"""Attendance models: Session (faculty generates OTP), Record (student marks)."""

import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SessionStatus(str, enum.Enum):
    ACTIVE = "active"
    CLOSED = "closed"


class AttendanceStatus(str, enum.Enum):
    ABSENT = "absent"
    CHECKED_IN = "checked_in"
    PRESENT = "present"
    PARTIAL = "partial"
    ON_LEAVE = "on_leave"
    CORRECTION_REQUESTED = "correction_requested"
    REJECTED = "rejected"


class AttendanceSession(Base):
    """One attendance session per class — faculty generates OTP here."""

    __tablename__ = "attendance_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    slot_id: Mapped[int] = mapped_column(ForeignKey("slots.id"), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    in_otp_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    out_otp_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    otp_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[SessionStatus] = mapped_column(
        Enum(SessionStatus), default=SessionStatus.ACTIVE, nullable=False
    )
    geo_fence_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    slot = relationship("Slot", back_populates="attendance_sessions")
    faculty = relationship("User", foreign_keys=[created_by])
    records = relationship("AttendanceRecord", back_populates="session", lazy="selectin")


class AttendanceRecord(Base):
    """One record per student per session."""

    __tablename__ = "attendance_records"
    __table_args__ = (
        UniqueConstraint("session_id", "student_id", name="uq_attendance_record"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("attendance_sessions.id"), nullable=False)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[AttendanceStatus] = mapped_column(
        Enum(AttendanceStatus), default=AttendanceStatus.ABSENT, nullable=False
    )
    in_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    out_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    device_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    geo_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    correction_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    session = relationship("AttendanceSession", back_populates="records")
    student = relationship(
        "User",
        foreign_keys=[student_id],
        back_populates="attendance_records",
    )
    approver = relationship("User", foreign_keys=[approved_by])
