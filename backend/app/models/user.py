from __future__ import annotations

from sqlalchemy import String, TIMESTAMP, text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, CITEXT
from uuid import uuid4

from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    # -------------------------
    # Primary Key
    # -------------------------
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )

    # -------------------------
    # APEX Authentication
    # -------------------------
    apex_user_id: Mapped[str | None] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=True,   # Local users don't have APEX id
    )

    # -------------------------
    # Email (Local users)
    # -------------------------
    email: Mapped[str | None] = mapped_column(
        CITEXT,               # Case-insensitive email
        unique=True,
        index=True,
        nullable=True,        # APEX users may not have email
    )

    # -------------------------
    # Password (Local users)
    # -------------------------
    password_hash: Mapped[str | None] = mapped_column(
        String,
        nullable=True,        # APEX users have no password
    )

    # -------------------------
    # Profile
    # -------------------------
    full_name: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    role: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="user",
        server_default="user",
    )

    # -------------------------
    # Timestamps
    # -------------------------
    created_at: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    updated_at: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        onupdate=text("CURRENT_TIMESTAMP"),
    )
