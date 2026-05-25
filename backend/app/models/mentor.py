"""Mentor-Student assignment and meeting models."""

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


class MentorProfile(Base):
    """Profile for users who opt-in to be mentors in the marketplace."""

    __tablename__ = "mentor_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    skills: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    is_accepting_mentees: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    max_mentees: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user = relationship("User", foreign_keys=[user_id], lazy="selectin")


class MentorAssignment(Base):
    """Links a mentor to their mentees."""

    __tablename__ = "mentor_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    mentor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    mentor = relationship("User", foreign_keys=[mentor_id])
    student = relationship("User", foreign_keys=[student_id])
    meetings = relationship("MentorMeeting", back_populates="assignment", lazy="selectin")


class MentorMeeting(Base):
    """Meeting record between mentor and mentee."""

    __tablename__ = "mentor_meetings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    assignment_id: Mapped[int] = mapped_column(ForeignKey("mentor_assignments.id"), nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="scheduled", nullable=False)
    mentor_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    student_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    goals: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    assignment = relationship("MentorAssignment", back_populates="meetings")
