from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl, EmailStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


from pathlib import Path

ENV_PATH = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_PATH,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Application
    ENVIRONMENT: Literal["development", "production", "test"] = "development"
    DEBUG: bool = False
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    # Database
    DATABASE_URL: str

    # JWT
    JWT_SECRET: str
    JWT_REFRESH_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # File Storage
    STORAGE_BACKEND: Literal["local", "s3"] = "local"
    UPLOAD_DIR: str = "uploads"
    MAX_IMAGE_SIZE_MB: int = 10
    MAX_DOCUMENT_SIZE_MB: int = 25

    # S3 / Object storage
    STORAGE_ENDPOINT: str = ""
    STORAGE_ACCESS_KEY: str = ""
    STORAGE_SECRET_KEY: str = ""
    STORAGE_BUCKET: str = ""
    STORAGE_REGION: str = ""

    # Email
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@example.com"
    SMTP_FROM_NAME: str = "[Institution Name]"
    SMTP_USE_TLS: bool = True

    # Security
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,https://dtmn-eta.vercel.app"
    CSRF_SECRET: str = ""
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15

    # Initial seed admin
    SEED_ADMIN_EMAIL: str = "admin@example.com"
    SEED_ADMIN_PASSWORD: str = ""

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v:
            raise ValueError("DATABASE_URL must be set")
        v = v.strip()
        # Remove unsupported query parameters from Aiven/cloud providers
        v = v.replace("?ssl-mode=REQUIRED", "").replace("&ssl-mode=REQUIRED", "")
        # Auto-convert standard mysql:// prefix to async mysql+aiomysql://
        if v.startswith("mysql://"):
            v = "mysql+aiomysql://" + v[8:]
        elif v.startswith("postgres://"):
            v = "postgresql+asyncpg://" + v[11:]
        elif v.startswith("postgresql://"):
            v = "postgresql+asyncpg://" + v[13:]
        return v

    @field_validator("JWT_SECRET", "JWT_REFRESH_SECRET", mode="before")
    @classmethod
    def validate_secrets(cls, v: str) -> str:
        if not v or len(v) < 32:
            raise ValueError("JWT secrets must be at least 32 characters")
        return v

    @property
    def allowed_origins_list(self) -> list[str]:
        origins = [origin.strip().rstrip("/") for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
        # Always include frontend if not present
        if self.FRONTEND_URL:
            frontend = self.FRONTEND_URL.strip().rstrip("/")
            if frontend and frontend not in origins:
                origins.append(frontend)
        return origins

    @property
    def max_image_size_bytes(self) -> int:
        return self.MAX_IMAGE_SIZE_MB * 1024 * 1024

    @property
    def max_document_size_bytes(self) -> int:
        return self.MAX_DOCUMENT_SIZE_MB * 1024 * 1024

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
