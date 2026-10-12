"""
FastAPI shared dependencies: authentication, authorization, and DB session.
"""
from __future__ import annotations

from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, Request, status
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.logging import log_security_event
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    request: Request,
    db: DbSession,
    access_token: str | None = Cookie(default=None, alias="access_token"),
) -> User:
    """
    Extract and validate the JWT access token from the httpOnly cookie.
    Returns the authenticated User object.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not access_token:
        # Also check Authorization header for API clients
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            access_token = auth_header[7:]

    if not access_token:
        raise credentials_exception

    try:
        payload = decode_access_token(access_token)
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except JWTError:
        log_security_event("INVALID_TOKEN_ATTEMPT", ip_address=request.client.host if request.client else None)
        raise credentials_exception

    repo = UserRepository(db)
    user = await repo.get_by_id(int(user_id))

    if user is None or not user.is_active:
        raise credentials_exception

    # C7: enforce must_change_password — only /auth/password/change and
    # /auth/me are allowed until the user sets a new password.
    if user.must_change_password:
        allowed_paths = {"/api/v1/auth/password/change", "/api/v1/auth/me"}
        if request.url.path not in allowed_paths:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Password change required. Please change your password before continuing.",
            )

    return user



CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(*roles: UserRole):
    """
    Dependency factory: ensures the authenticated user has one of the required roles.
    Handles Enum instances, raw string values, and case variations.
    """
    expected = set()
    for r in roles:
        val = r.value if isinstance(r, UserRole) else str(r)
        expected.add(val.lower())
        name = r.name if isinstance(r, UserRole) else str(r)
        expected.add(name.lower())

    async def _check_role(current_user: CurrentUser) -> User:
        user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        role_str = str(user_role).lower().split(".")[-1]
        if role_str not in expected and role_str.replace("-", "_") not in expected:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user

    return _check_role


def require_super_admin():
    return require_role(UserRole.SUPER_ADMIN)


def require_content_admin():
    return require_role(UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN)


def require_admission_admin():
    return require_role(UserRole.SUPER_ADMIN, UserRole.ADMISSION_ADMIN)
