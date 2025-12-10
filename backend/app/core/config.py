"""
Application configuration settings
"""

from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    # Application
    PROJECT_NAME: str = "Pithia - Greek Army RAG API"
    VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]

    # Security
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "greek_military_secret_key_change_in_production_use_strong_key"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours

    # RAG Configuration
    RAG_CONFIG_PATH: str = os.getenv(
        "RAG_CONFIG_PATH", "backend/config/config.yml")

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", None) or "sqlite:///./pithia.db"

    # Weaviate
    WEAVIATE_URL: str = os.getenv("WEAVIATE_URL", "http://localhost:8080")

    # Ollama
    OLLAMA_BASE_URL: str = os.getenv(
        "OLLAMA_BASE_URL", "http://localhost:11434")

    class Config:
        case_sensitive = True
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
