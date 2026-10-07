"""Application configuration (pydantic-settings).

Secrets come from the environment / .env file — never hardcoded, never committed.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Core ---
    APP_NAME: str = "Redwan Ahmed Khan — Portfolio API"
    ENVIRONMENT: Literal["development", "testing", "production"] = "development"
    API_V1_PREFIX: str = "/api/v1"
    SITE_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    # --- Database ---
    # PostgreSQL in production; SQLite fallback keeps local dev frictionless.
    DATABASE_URL: str = "sqlite:///./dev.db"
    DB_ECHO: bool = False

    # --- Auth ---
    SECRET_KEY: str = "change-me-in-production"
    JWT_SECRET: str = "change-me-jwt-secret-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14
    LOGIN_MAX_FAILED_ATTEMPTS: int = 8
    LOGIN_LOCKOUT_SECONDS: int = 300

    # Bootstrap super admin (used by seed script only)
    ADMIN_EMAIL: str = "admin@example.com"
    ADMIN_PASSWORD: str = "ChangeMe!123"

    # --- CORS ---
    # Comma-separated list (NoDecode: parsed by the validator below, not as JSON)
    CORS_ORIGINS: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:3000"]
    )

    # --- Rate limiting ---
    RATE_LIMIT_CONTACT_PER_HOUR: int = 5
    RATE_LIMIT_LOGIN_PER_MINUTE: int = 10

    # --- SMTP (notifications; optional) ---
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM: str = "no-reply@example.com"
    NOTIFY_EMAIL: str | None = None

    # --- Object storage (S3-compatible; optional, local disk fallback) ---
    STORAGE_BACKEND: Literal["local", "s3"] = "local"
    STORAGE_LOCAL_DIR: str = "./storage"
    STORAGE_ENDPOINT: str | None = None
    STORAGE_ACCESS_KEY: str | None = None
    STORAGE_SECRET_KEY: str | None = None
    STORAGE_BUCKET: str | None = None

    # --- Redis (optional cache/rate-limit) ---
    REDIS_URL: str | None = None

    # --- Uploads ---
    MAX_UPLOAD_MB: int = 10
    ALLOWED_IMAGE_TYPES: Annotated[set[str], NoDecode] = Field(
        default_factory=lambda: {
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/gif",
            "image/svg+xml",
        }
    )
    ALLOWED_DOC_TYPES: Annotated[set[str], NoDecode] = Field(
        default_factory=lambda: {"application/pdf"}
    )

    @field_validator("ALLOWED_IMAGE_TYPES", "ALLOWED_DOC_TYPES", mode="before")
    @classmethod
    def _split_sets(cls, v):  # noqa: ANN001, ANN206
        if isinstance(v, str):
            return {s.strip() for s in v.split(",") if s.strip()}
        return v

    # --- Docs ---
    ENABLE_OPENAPI_DOCS: bool = True

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_origins(cls, v):  # noqa: ANN001, ANN206
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
