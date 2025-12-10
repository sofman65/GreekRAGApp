from __future__ import annotations
from sqlalchemy import ForeignKey, String, TIMESTAMP, text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class Conversation(Base):
    __tablename__ = "conversations"

    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    title: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True),
                                            server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True),
                                            server_default=text(
                                                "CURRENT_TIMESTAMP"),
                                            onupdate=text("CURRENT_TIMESTAMP"))
