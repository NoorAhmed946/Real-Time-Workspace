"""
Application configuration management using Pydantic Settings.
All configuration is loaded from environment variables or .env file.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # ===================
    # Database Configuration
    # ===================
    DATABASE_URL: str
    
    @property
    def async_database_url(self) -> str:
        """Convert sync database URL to async (asyncpg) URL."""
        if "postgresql+psycopg2" in self.DATABASE_URL:
            return self.DATABASE_URL.replace(
                "postgresql+psycopg2", "postgresql+asyncpg"
            )
        elif "postgresql://" in self.DATABASE_URL:
            return self.DATABASE_URL.replace(
                "postgresql://", "postgresql+asyncpg://"
            )
        return self.DATABASE_URL
    
    # ===================
    # Google OAuth 2.0 Configuration
    # ===================
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_OAUTH_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"
    
    # ===================
    # JWT Configuration
    # ===================
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # ===================
    # Application Settings
    # ===================
    APP_NAME: str = "RTCD"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # CORS Origins (comma-separated in env, parsed to list)
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # ===================
    # WebSocket Settings
    # ===================
    WS_HEARTBEAT_INTERVAL: int = 30
    WS_MAX_CONNECTIONS_PER_DOCUMENT: int = 50


@lru_cache
def get_settings() -> Settings:
    """
    Get cached application settings.
    Using lru_cache ensures settings are only loaded once.
    """
    return Settings()
