from __future__ import annotations

import asyncio
import os
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

# -------------------------------------------------------------------
# Make app importable
# -------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

# Import Base AFTER sys.path fix
from app.models import Base  # noqa

# -------------------------------------------------------------------
# Alembic Config
# -------------------------------------------------------------------
config = context.config

# Allow DATABASE_URL override (Docker / .env)
database_url = os.getenv("DATABASE_URL")
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)

# -------------------------------------------------------------------
# Logging config
# -------------------------------------------------------------------
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# -------------------------------------------------------------------
# Metadata for autogenerate
# -------------------------------------------------------------------
target_metadata = Base.metadata


# -------------------------------------------------------------------
# OFFLINE MIGRATIONS
# -------------------------------------------------------------------
def run_migrations_offline():
    """Run migrations without DB connection."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


# -------------------------------------------------------------------
# ONLINE MIGRATIONS
# -------------------------------------------------------------------
def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online():
    """Run migrations using Async SQLAlchemy engine."""

    # ⚠ Nelty: async_engine_from_config has issues; use create_async_engine instead
    engine = create_async_engine(
        config.get_main_option("sqlalchemy.url"),
        poolclass=pool.NullPool,
        future=True,
    )

    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await engine.dispose()


# -------------------------------------------------------------------
# MAIN ENTRYPOINT
# -------------------------------------------------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
