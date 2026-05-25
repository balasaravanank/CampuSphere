"""Study Group models for peer networking and collaborative learning."""

from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Boolean,
    JSON,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StudyGroup(Base):
    """A peer-driven study group or networking circle."""

    __tablename__ = "study_groups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    subject_tags: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    is_private: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    creator = relationship("User", foreign_keys=[created_by], lazy="selectin")
    members = relationship("StudyGroupMember", back_populates="group", cascade="all, delete-orphan", lazy="selectin")


class StudyGroupMember(Base):
    """Membership record for a study group."""

    __tablename__ = "study_group_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("study_groups.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="member", nullable=False)  # 'admin' or 'member'
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    group = relationship("StudyGroup", back_populates="members")
    user = relationship("User", foreign_keys=[user_id], lazy="selectin")
