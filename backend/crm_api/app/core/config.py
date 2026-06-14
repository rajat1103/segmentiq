import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str = "segmentiq_super_secret_key_change_in_production"
    GROQ_API_KEY: Optional[str] = None
    REDIS_URL: Optional[str] = None
    GOOGLE_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_CLIENT_ID") or os.getenv("CLIENT_ID") or "662384752311-3b47hrvdcaf7vc38utiogrps4dt3v43a.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_CLIENT_SECRET") or os.getenv("CLIENT_SECRET")

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()