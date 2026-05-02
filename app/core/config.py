from __future__ import annotations

import os
from pathlib import Path
from functools import lru_cache
from typing import ClassVar
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from dotenv import load_dotenv

load_dotenv()


def _as_sqlite_url(value: str, *, base_dir: Path) -> str:
    if value.startswith("sqlite://"):
        return value
    candidate = Path(value)
    if not candidate.is_absolute():
        candidate = (base_dir / candidate).resolve()
    else:
        candidate = candidate.resolve()
    return f"sqlite:///{candidate.as_posix()}"



class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="USER_API_",
        env_file=".env",
        extra="ignore",
    )

    

    _app_dir: ClassVar[Path] = Path(__file__).resolve().parents[1]
    _default_db_path: ClassVar[str] = str((_app_dir / "db" / "ecommerce.db").resolve())
    CUSTOMER_DATABASE: str = _as_sqlite_url(
        os.getenv("CUSTOMER_DATABASE", _default_db_path),
        base_dir=_app_dir,
    )

    APP_NAME: str = os.getenv("APP_NAME", "Ecommerce API")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    API_PREFIX: str = os.getenv("API_PREFIX", "/api/v1")
    DATABASE_URL: str = "sqlite:///./ecommerce.db"
    jwt_secret: str = Field(default="change-me-in-production", min_length=16)
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 15
    refresh_token_days: int = 7
    api_version: str = "1.1.0"

    global_rate_limit: str = "100/minute"
    health_rate_limit: str = "30/minute"
    register_rate_limit: str = "10/minute"
    login_rate_limit: str = "5/minute"
    firebase_exchange_rate_limit: str = "10/minute"
    refresh_rate_limit: str = "20/minute"
    change_password_rate_limit: str = "10/hour"
    list_users_rate_limit: str = "30/minute"
    billing_checkout_rate_limit: str = "20/minute"
    billing_portal_rate_limit: str = "20/minute"
    billing_webhook_rate_limit: str = "120/minute"

    firebase_enabled: bool = False
    firebase_credentials_path: str | None = None
    firebase_project_id: str | None = None
    firebase_require_verified_email: bool = True
    firebase_check_revoked: bool = True

    stripe_enabled: bool = os.getenv("STRIPE_ENABLED", "false").lower() == "true"
    stripe_secret_key: str | None = os.getenv("STRIPE_SECRET_KEY")
    stripe_publishable_key: str | None = os.getenv("STRIPE_PUBLISHABLE_KEY")
    stripe_webhook_secret: str | None = os.getenv("STRIPE_WEBHOOK_SECRET")
    stripe_api_version: str = "2026-02-25.clover"
    stripe_default_price_id: str | None = None
    stripe_currency: str = "usd"
    stripe_return_url: str = "http://localhost:3000/billing/success?session_id={CHECKOUT_SESSION_ID}"
    stripe_success_url: str = "http://localhost:3000/billing/success?session_id={CHECKOUT_SESSION_ID}"
    stripe_cancel_url: str = "http://localhost:3000/billing/cancel"
    stripe_portal_return_url: str = "http://localhost:3000/settings/billing"

    log_level: str = "INFO"
    log_json: bool = True


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

settings = get_settings()  # Global cached instance
