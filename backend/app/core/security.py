"""
Security utilities: password hashing, JWT, MFA (TOTP), recovery codes.

Password hashing uses Argon2id via passlib.
JWT uses HS256 with separate access/refresh secrets.
MFA uses RFC 6238 TOTP via pyotp.
Recovery codes are stored as hashed values (Argon2id).
"""
from __future__ import annotations

import secrets
import string
from datetime import datetime, timezone, timedelta
from typing import Any

import pyotp
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def utcnow() -> datetime:
    """Return current UTC time as a naive datetime (consistent with MySQL storage)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


# C3: Pre-compute a valid Argon2id hash at import time so that the timing-
# equalisation call for unknown email addresses never raises ValueError.
# (The old hand-written string was not a valid hash; passlib raised ValueError,
# which became a 500 and also revealed which emails exist in the system.)
DUMMY_HASH: str = ""  # filled below after pwd_context is defined


# ---------------------------------------------------------------------------
# MFA pending token helpers (C2)
# ---------------------------------------------------------------------------
_MFA_PENDING_TYPE = "mfa_pending"
_MFA_PENDING_TTL = 300  # 5 minutes


def create_mfa_pending_token(user_id: int) -> str:
    """Issue a short-lived signed JWT for the MFA second-factor step.

    Replaces the unsigned base64-JSON cookie that an attacker could forge
    to skip the password step and attack any user's TOTP directly.
    """
    payload = {
        "sub": str(user_id),
        "type": _MFA_PENDING_TYPE,
        "jti": secrets.token_hex(8),
        "exp": datetime.now(timezone.utc) + timedelta(seconds=_MFA_PENDING_TTL),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_mfa_pending_token(token: str) -> int:
    """Decode and validate a MFA-pending token. Returns the user_id.

    Raises JWTError if the token is invalid, expired, or wrong type.
    """
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    if payload.get("type") != _MFA_PENDING_TYPE:
        raise JWTError("Wrong token type")
    return int(payload["sub"])


pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
    argon2__memory_cost=65536,   # 64 MiB
    argon2__time_cost=3,
    argon2__parallelism=4,
)

# Populate DUMMY_HASH now that pwd_context exists (C3).
# This is a real Argon2id hash so passlib never raises ValueError.
DUMMY_HASH = pwd_context.hash("_dummy_timing_equalisation_password_")


def hash_password(password: str) -> str:
    """Hash a plaintext password using Argon2id."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against its Argon2id hash."""
    return pwd_context.verify(plain_password, hashed_password)


# H3: Argon2id (64 MiB, 3 passes) is CPU-heavy and blocks the asyncio event
# loop if called directly from async handlers.  These async wrappers offload
# the work to the default threadpool so other requests continue to be served.
async def async_hash_password(password: str) -> str:
    """Non-blocking Argon2id hash — runs in the default threadpool."""
    from starlette.concurrency import run_in_threadpool
    return await run_in_threadpool(hash_password, password)


async def async_verify_password(plain: str, hashed: str) -> bool:
    """Non-blocking Argon2id verify — runs in the default threadpool."""
    from starlette.concurrency import run_in_threadpool
    return await run_in_threadpool(verify_password, plain, hashed)




def check_password_strength(password: str) -> list[str]:
    """
    Return a list of violations. Empty list = password is acceptable.
    Requirements:
      - At least 12 characters
      - At least one uppercase letter
      - At least one lowercase letter
      - At least one digit
      - At least one special character
    """
    errors: list[str] = []
    if len(password) < 12:
        errors.append("Password must be at least 12 characters long.")
    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter.")
    if not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter.")
    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one digit.")
    if not any(c in string.punctuation for c in password):
        errors.append("Password must contain at least one special character.")
    return errors


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------
def create_access_token(data: dict[str, Any]) -> str:
    """Create a short-lived access token (15 minutes by default)."""
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload.update({"exp": expire, "type": "access"})
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict[str, Any]) -> str:
    """Create a longer-lived refresh token."""
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload.update({"exp": expire, "type": "refresh"})
    return jwt.encode(
        payload, settings.JWT_REFRESH_SECRET, algorithm=settings.JWT_ALGORITHM
    )


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate an access token. Raises JWTError on failure."""
    payload = jwt.decode(
        token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
    )
    if payload.get("type") != "access":
        raise JWTError("Invalid token type")
    return payload


def decode_refresh_token(token: str) -> dict[str, Any]:
    """Decode and validate a refresh token. Raises JWTError on failure."""
    payload = jwt.decode(
        token, settings.JWT_REFRESH_SECRET, algorithms=[settings.JWT_ALGORITHM]
    )
    if payload.get("type") != "refresh":
        raise JWTError("Invalid token type")
    return payload


# ---------------------------------------------------------------------------
# MFA — TOTP (RFC 6238)
# ---------------------------------------------------------------------------
def generate_totp_secret() -> str:
    """Generate a new TOTP secret key."""
    return pyotp.random_base32()


def get_totp_uri(secret: str, email: str, issuer: str = "D T M N") -> str:
    """Return the otpauth:// URI for QR code generation."""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name=issuer)


def verify_totp(secret: str, code: str) -> bool:
    """Verify a TOTP code. Allows ±1 window for clock drift."""
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)


def generate_totp_qr_base64(secret: str, email: str) -> str:
    """Generate a base64-encoded PNG QR code for the TOTP URI."""
    import io
    import base64
    import qrcode

    uri = get_totp_uri(secret, email)
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_L)
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode()


# ---------------------------------------------------------------------------
# Recovery codes
# ---------------------------------------------------------------------------
RECOVERY_CODE_COUNT = 8
RECOVERY_CODE_LENGTH = 12


def generate_recovery_codes() -> tuple[list[str], list[str]]:
    """
    Generate recovery codes.

    Returns:
        plain_codes: The plaintext codes to show the user ONCE.
        hashed_codes: The hashed versions to store in the database.
    """
    alphabet = string.ascii_uppercase + string.digits
    plain_codes = [
        "".join(secrets.choice(alphabet) for _ in range(RECOVERY_CODE_LENGTH))
        for _ in range(RECOVERY_CODE_COUNT)
    ]
    hashed_codes = [hash_password(code) for code in plain_codes]
    return plain_codes, hashed_codes


def verify_recovery_code(plain_code: str, hashed_codes: list[str]) -> int | None:
    """
    Check if the provided plaintext recovery code matches any stored hash.

    Returns the index of the matched code so it can be invalidated, or None.
    """
    for i, hashed in enumerate(hashed_codes):
        if verify_password(plain_code, hashed):
            return i
    return None


# ---------------------------------------------------------------------------
# Secure token generation (for CSRF, etc.)
# ---------------------------------------------------------------------------
def generate_secure_token(nbytes: int = 32) -> str:
    """Generate a cryptographically secure URL-safe token."""
    return secrets.token_urlsafe(nbytes)
