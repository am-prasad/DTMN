"""
Pydantic schemas for authentication endpoints.
"""
from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field, field_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=256)


class MFAVerifyRequest(BaseModel):
    code: str = Field(min_length=6, max_length=8, pattern=r"^\d{6,8}$")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    requires_mfa: bool = False
    must_change_password: bool = False


class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MFASetupResponse(BaseModel):
    secret: str
    qr_code_base64: str
    provisioning_uri: str


class MFAConfirmRequest(BaseModel):
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class RecoveryCodesResponse(BaseModel):
    recovery_codes: list[str]
    warning: str = "Store these codes securely. They will not be shown again."


class RecoveryLoginRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=12, max_length=12)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=12, max_length=256)

    @field_validator("new_password")
    @classmethod
    def password_complexity(cls, v: str) -> str:
        import string
        errors = []
        if len(v) < 12:
            errors.append("at least 12 characters")
        if not any(c.isupper() for c in v):
            errors.append("an uppercase letter")
        if not any(c.islower() for c in v):
            errors.append("a lowercase letter")
        if not any(c.isdigit() for c in v):
            errors.append("a digit")
        if not any(c in string.punctuation for c in v):
            errors.append("a special character")
        if errors:
            raise ValueError(f"Password must contain: {', '.join(errors)}")
        return v
