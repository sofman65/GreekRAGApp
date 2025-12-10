from __future__ import annotations
from sqlalchemy import ForeignKey, String, Text, TIMESTAMP, text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class Message(Base):
    __tablename__ = "messages"

    conversation_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    role: Mapped[str] = mapped_column(String(20))  # user/assistant/system
    content: Mapped[str] = mapped_column(Text)

    # For RAG metadata
    mode: Mapped[str | None] = mapped_column(String(20))
    label: Mapped[str | None] = mapped_column(String(50))

    created_at: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("CURRENT_TIMESTAMP")
    )
