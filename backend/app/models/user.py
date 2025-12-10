from __future__ import annotations

from sqlalchemy import String, TIMESTAMP, text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import CITEXT

from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    # 🔹 Authoritative APEX user ID
    apex_user_id: Mapped[str | None] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=True,
        doc="Primary user identifier from APEX Oracle DB"
    )

    # 🔹 Email (local mirror from APEX)
    email: Mapped[str] = mapped_column(
        CITEXT(),
        unique=True,
        index=True,
        nullable=False,
        doc="Email address of the user (mirrored from APEX)"
    )

    # 🔹 Full name (optional sync from APEX)
    full_name: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True
    )

    # 🔹 Role (local)
    role: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        server_default="user"
    )

    # 🔹 Timestamps
    created_at: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )

    updated_at: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
        onupdate=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )
