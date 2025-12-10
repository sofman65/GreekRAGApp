"""
Async SQLAlchemy engine factory for Ermis.
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from app.core.config import settings


def get_engine() -> AsyncEngine:
    """Create async SQLAlchemy engine using SETTINGS (single source of truth)."""
    database_url = settings.DATABASE_URL  # <--- CRITICAL FIX

    return create_async_engine(
        database_url,
        echo=settings.DEBUG,      # Enables SQL logs only in DEBUG mode
        future=True,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        pool_timeout=30,
    )


# Global engine instance
engine: AsyncEngine = get_engine()
