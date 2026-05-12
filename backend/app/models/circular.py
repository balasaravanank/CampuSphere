"""Circular & Announcement models with AI summary support."""

import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    func,
)
# from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CircularPriority(str, enum.Enum):
    URGENT = "urgent"
    ACTION_REQUIRED = "action_required"
    INFORMATIONAL = "informational"
    LOW_PRIORITY = "low_priority"


class Circular(Base):
    __tablename__ = "circulars"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[CircularPriority] = mapped_column(
        Enum(CircularPriority), default=CircularPriority.INFORMATIONAL, nullable=False
    )
    role_targets: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    department_targets: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachment_urls: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    author = relationship("User", foreign_keys=[created_by])
    reads = relationship("CircularRead", back_populates="circular", lazy="selectin")


class CircularRead(Base):
    __tablename__ = "circular_reads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    circular_id: Mapped[int] = mapped_column(ForeignKey("circulars.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    read_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    circular = relationship("Circular", back_populates="reads")
    user = relationship("User", foreign_keys=[user_id])
