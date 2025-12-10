from __future__ import annotations
from sqlalchemy import ForeignKey, String, TIMESTAMP, text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class Session(Base):
    __tablename__ = "sessions"

    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    refresh_token: Mapped[str] = mapped_column(String, unique=True)
    user_agent: Mapped[str | None] = mapped_column(String)
    ip_address: Mapped[str | None] = mapped_column(String)
    expires_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True))
    created_at: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("CURRENT_TIMESTAMP")
    )
