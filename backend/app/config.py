"""Application configuration loaded from environment variables."""

from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    # App
    APP_NAME: str = "CampuSphere"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./campusphere_test.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_64_CHAR_RANDOM_STRING_HERE"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    ALLOWED_EMAIL_DOMAIN: str = "saveetha.ac.in"

    # MinIO
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "campusphere-uploads"
    MINIO_SECURE: bool = False

    # AI
    GROQ_API_KEY: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    AI_DAILY_QUOTA_STUDENT: int = 30
    AI_DAILY_QUOTA_FACULTY: int = 100

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # Security
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:3000", "http://127.0.0.1:3000",
    ]
    RATE_LIMIT_AUTH: str = "20/minute"
    RATE_LIMIT_GENERAL: str = "300/minute"
    BCRYPT_ROUNDS: int = 12
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_MINUTES: int = 30

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    @field_validator("BCRYPT_ROUNDS", mode="before")
    def handle_empty_bcrypt(cls, v):
        if v == "": return 12
        return v
        
    @field_validator("LOCKOUT_MINUTES", mode="before")
    def handle_empty_lockout(cls, v):
        if v == "": return 15
        return v

@lru_cache
def get_settings() -> Settings:
    return Settings()
