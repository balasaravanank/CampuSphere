"""Academic models: Subject, Slot (schedule), Enrollment."""

from datetime import time

from sqlalchemy import (
    ForeignKey,
    Integer,
    String,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    credits: Mapped[int] = mapped_column(Integer, nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    semester: Mapped[int] = mapped_column(Integer, nullable=False)

    slots = relationship("Slot", back_populates="subject", lazy="selectin")
    assignments = relationship("Assignment", back_populates="subject", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Subject {self.code}: {self.name}>"


class Slot(Base):
    """Time slot for a subject — represents one class session per week."""

    __tablename__ = "slots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"), nullable=False)
    faculty_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    time_start: Mapped[time] = mapped_column(Time, nullable=False)
    time_end: Mapped[time] = mapped_column(Time, nullable=False)
    room: Mapped[str] = mapped_column(String(50), nullable=False)

    subject = relationship("Subject", back_populates="slots")
    faculty = relationship("User", foreign_keys=[faculty_id])
    attendance_sessions = relationship("AttendanceSession", back_populates="slot", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Slot {self.room} Day{self.day_of_week} {self.time_start}-{self.time_end}>"


class Enrollment(Base):
    """Student enrollment in a subject."""

    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("student_id", "subject_id", name="uq_enrollment"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"), nullable=False)

    student = relationship("User", foreign_keys=[student_id])
    subject = relationship("Subject", foreign_keys=[subject_id])
