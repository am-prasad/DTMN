"""
Authentication API — login, MFA, token refresh, logout, password change.

Rate limiting is applied to all sensitive endpoints.
"""

from app.schemas.auth import LoginRequest, TokenResponse
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status,Body
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import CurrentUser
from app.core.logging import log_security_event
from app.core.security import (
    DUMMY_HASH,
    async_verify_password,
    create_access_token,
    create_mfa_pending_token,
    decode_mfa_pending_token,
    create_refresh_token,
    decode_refresh_token,
    generate_recovery_codes,
    generate_totp_qr_base64,
    generate_totp_secret,
    get_totp_uri,
    hash_password,
    utcnow,
    verify_password,
    verify_recovery_code,
    verify_totp,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    MFAConfirmRequest,
    MFASetupResponse,
    MFAVerifyRequest,
    RecoveryCodesResponse,
    RecoveryLoginRequest,
    TokenResponse,
)
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()
limiter = Limiter(key_func=get_remote_address)

REFRESH_COOKIE = "refresh_token"
ACCESS_COOKIE = "access_token"
# C5: Use lax (not 'none') so the browser withholds cookies on
# cross-origin requests, providing actual CSRF protection.
COOKIE_SAMESITE = "lax"
COOKIE_SECURE = settings.is_production

# C3: Pre-compute a valid Argon2id hash at module load so the timing-
# equalisation call in the unknown-email branch never raises ValueError.
from app.core.security import DUMMY_HASH  # noqa: E402  (imported here, defined there)


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        key=ACCESS_COOKIE,
        value=access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(ACCESS_COOKIE)
    response.delete_cookie(REFRESH_COOKIE)
    response.delete_cookie("mfa_pending")


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    response: Response,
    body: LoginRequest = Body(...),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Login with email + password. Returns tokens in httpOnly cookies."""
    repo = UserRepository(db)
    user = await repo.get_by_email(body.email)
    ip = request.client.host if request.client else "unknown"

    # Account not found — still hash to prevent timing oracle (C3: valid hash).
    if not user:
        verify_password(body.password, DUMMY_HASH)
        log_security_event("LOGIN_FAILED_USER_NOT_FOUND", ip_address=ip)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

    # Account locked — H2: compare using naive UTC to avoid TypeError from MySQL
    from app.core.security import utcnow
    if user.locked_until:
        locked = user.locked_until
        # MySQL returns naive datetimes; make comparison safe
        now = utcnow()
        locked_naive = locked.replace(tzinfo=None) if locked.tzinfo else locked
        if locked_naive > now:
            log_security_event("LOGIN_BLOCKED_LOCKED", user_id=str(user.id), ip_address=ip)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Account temporarily locked due to repeated failed login attempts.",
            )

    # H3: use async wrapper so Argon2 doesn't block the event loop
    if not await async_verify_password(body.password, user.hashed_password):
        await repo.increment_failed_login(user, settings.MAX_LOGIN_ATTEMPTS, settings.LOCKOUT_DURATION_MINUTES)
        log_security_event("LOGIN_FAILED_WRONG_PASSWORD", user_id=str(user.id), ip_address=ip)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled.")

    # Reset failed attempts on successful password verification
    await repo.reset_failed_login(user)
    log_security_event("LOGIN_SUCCESS", user_id=str(user.id), ip_address=ip)

    # MFA required — C2: issue a short-lived SIGNED token instead of
    # an unsigned base64 JSON cookie that any attacker can forge.
    if user.mfa_enabled:
        from app.core.security import create_mfa_pending_token
        mfa_token = create_mfa_pending_token(user.id)
        response.set_cookie(
            "mfa_pending", mfa_token,
            httponly=True, secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE, max_age=300,
        )
        return TokenResponse(access_token="", requires_mfa=True)

    role_str = str(user.role.value if hasattr(user.role, "value") else user.role).lower().split(".")[-1]
    token_data = {"sub": str(user.id), "role": role_str}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    _set_auth_cookies(response, access_token, refresh_token)
    return TokenResponse(
        access_token=access_token,
        must_change_password=user.must_change_password,
    )


@router.post("/mfa/verify", response_model=TokenResponse)
@limiter.limit("5/minute")
async def verify_mfa(
    request: Request,
    response: Response,
    body: MFAVerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    # C2: validate the signed MFA-pending token
    mfa_pending = request.cookies.get("mfa_pending")
    if not mfa_pending:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No pending MFA session.")

    from app.core.security import decode_mfa_pending_token
    from jose import JWTError
    try:
        uid = decode_mfa_pending_token(mfa_pending)
    except (JWTError, ValueError, KeyError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired MFA session.")

    repo = UserRepository(db)
    user = await repo.get_by_id(uid)
    ip = request.client.host if request.client else "unknown"

    if not user or not user.mfa_enabled or not user.mfa_secret:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="MFA not configured.")

    if not verify_totp(user.mfa_secret, body.code):
        log_security_event("MFA_FAILED", user_id=str(uid), ip_address=ip)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid MFA code.")

    log_security_event("MFA_SUCCESS", user_id=str(uid), ip_address=ip)
    response.delete_cookie("mfa_pending")

    role_str = str(user.role.value if hasattr(user.role, "value") else user.role).lower().split(".")[-1]
    token_data = {"sub": str(user.id), "role": role_str}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    _set_auth_cookies(response, access_token, refresh_token)
    return TokenResponse(
        access_token=access_token,
        must_change_password=user.must_change_password,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Refresh access token using the httpOnly refresh token cookie."""
    refresh_token = request.cookies.get(REFRESH_COOKIE)
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")

    from jose import JWTError
    try:
        payload = decode_refresh_token(refresh_token)
        user_id = int(payload["sub"])
    except (JWTError, ValueError):
        _clear_auth_cookies(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session.")

    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user or not user.is_active:
        _clear_auth_cookies(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")

    role_str = str(user.role.value if hasattr(user.role, "value") else user.role).lower().split(".")[-1]
    token_data = {"sub": str(user.id), "role": role_str}
    new_access = create_access_token(token_data)
    new_refresh = create_refresh_token(token_data)
    _set_auth_cookies(response, new_access, new_refresh)
    return TokenResponse(
        access_token=new_access,
        must_change_password=user.must_change_password,
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response, current_user: CurrentUser) -> MessageResponse:
    """Logout — clears all auth cookies."""
    log_security_event("LOGOUT", user_id=str(current_user.id))
    _clear_auth_cookies(response)
    return MessageResponse(message="Logged out successfully.")


@router.post("/mfa/setup", response_model=MFASetupResponse)
async def setup_mfa(current_user: CurrentUser, db: AsyncSession = Depends(get_db)) -> MFASetupResponse:
    """Generate a new TOTP secret for the current user. Activate with /mfa/confirm."""
    if current_user.mfa_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="MFA already enabled.")
    secret = generate_totp_secret()
    repo = UserRepository(db)
    await repo.update(current_user, mfa_secret=secret)
    qr = generate_totp_qr_base64(secret, current_user.email)
    uri = get_totp_uri(secret, current_user.email)
    return MFASetupResponse(secret=secret, qr_code_base64=qr, provisioning_uri=uri)


@router.post("/mfa/confirm", response_model=RecoveryCodesResponse)
async def confirm_mfa(
    body: MFAConfirmRequest, current_user: CurrentUser, db: AsyncSession = Depends(get_db)
) -> RecoveryCodesResponse:
    """Confirm MFA setup by verifying a TOTP code. Returns one-time recovery codes."""
    if not current_user.mfa_secret:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Run /mfa/setup first.")
    if not verify_totp(current_user.mfa_secret, body.code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid TOTP code.")

    import json
    plain_codes, hashed_codes = generate_recovery_codes()
    repo = UserRepository(db)
    await repo.update(current_user, mfa_enabled=True, mfa_recovery_codes=json.dumps(hashed_codes))
    log_security_event("MFA_ENABLED", user_id=str(current_user.id))
    return RecoveryCodesResponse(recovery_codes=plain_codes)


@router.post("/mfa/disable", response_model=MessageResponse)
async def disable_mfa(
    body: MFAVerifyRequest, current_user: CurrentUser, db: AsyncSession = Depends(get_db)
) -> MessageResponse:
    """Disable MFA (requires current TOTP code as verification)."""
    if not current_user.mfa_enabled or not current_user.mfa_secret:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="MFA is not enabled.")
    if not verify_totp(current_user.mfa_secret, body.code):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid TOTP code.")
    repo = UserRepository(db)
    await repo.update(current_user, mfa_enabled=False, mfa_secret=None, mfa_recovery_codes=None)
    log_security_event("MFA_DISABLED", user_id=str(current_user.id))
    return MessageResponse(message="MFA disabled.")


@router.post("/password/change", response_model=MessageResponse)
async def change_password(
    body: ChangePasswordRequest, current_user: CurrentUser, db: AsyncSession = Depends(get_db)
) -> MessageResponse:
    """Change current user's password. Requires the current password."""
    if not await async_verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
    repo = UserRepository(db)
    await repo.update(current_user, hashed_password=hash_password(body.new_password), must_change_password=False)
    log_security_event("PASSWORD_CHANGED", user_id=str(current_user.id))
    return MessageResponse(message="Password changed successfully.")


@router.post("/mfa/recover", response_model=TokenResponse)
@limiter.limit("5/minute")
async def recover_mfa(
    request: Request,
    response: Response,
    body: RecoveryLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """C1: Login using a one-time recovery code when TOTP is unavailable.

    Requires the mfa_pending signed cookie (issued during the password step)
    so the user must still pass the password gate before using a recovery code.
    The recovery code is burned (removed from the stored list) after use.
    """
    mfa_pending = request.cookies.get("mfa_pending")
    if not mfa_pending:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No pending MFA session.")

    from jose import JWTError
    try:
        uid = decode_mfa_pending_token(mfa_pending)
    except (JWTError, ValueError, KeyError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired MFA session.")

    repo = UserRepository(db)
    user = await repo.get_by_id(uid)
    ip = request.client.host if request.client else "unknown"

    if not user or not user.mfa_enabled or not user.mfa_recovery_codes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="MFA recovery not available.")

    import json
    try:
        hashed_codes: list[str] = json.loads(user.mfa_recovery_codes)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Recovery codes corrupted.")

    # Check the submitted code against all stored hashes
    matched_index = verify_recovery_code(body.recovery_code.strip().upper(), hashed_codes)
    if matched_index is None:
        log_security_event("MFA_RECOVERY_FAILED", user_id=str(uid), ip_address=ip)
        await repo.increment_failed_login(user, settings.MAX_LOGIN_ATTEMPTS, settings.LOCKOUT_DURATION_MINUTES)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid recovery code.")

    # Burn the used code so it cannot be replayed
    hashed_codes.pop(matched_index)
    await repo.update(user, mfa_recovery_codes=json.dumps(hashed_codes))
    await repo.reset_failed_login(user)
    log_security_event("MFA_RECOVERY_SUCCESS", user_id=str(uid), ip_address=ip)
    response.delete_cookie("mfa_pending")

    role_str = str(user.role.value if hasattr(user.role, "value") else user.role).lower().split(".")[-1]
    token_data = {"sub": str(user.id), "role": role_str}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    _set_auth_cookies(response, access_token, refresh_token)
    return TokenResponse(
        access_token=access_token,
        must_change_password=user.must_change_password,
    )




@router.get("/me", response_model=dict)
async def get_me(current_user: CurrentUser) -> dict:
    """Return the current authenticated user's profile."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": str(current_user.role.value if hasattr(current_user.role, "value") else current_user.role).lower().split(".")[-1],
        "is_active": current_user.is_active,
        "mfa_enabled": current_user.mfa_enabled,
        "must_change_password": current_user.must_change_password,
    }
