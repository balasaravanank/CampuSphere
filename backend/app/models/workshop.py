"""Workshop / Mentorship Activity models with booking and reward tracking."""

import enum
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class WorkshopStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    LIVE = "live"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class WorkshopType(str, enum.Enum):
    WORKSHOP = "workshop"
    SEMINAR = "seminar"
    WEBINAR = "webinar"
    BOOTCAMP = "bootcamp"
    GUEST_LECTURE = "guest_lecture"
    HACKATHON = "hackathon"
    OTHER = "other"


class BookingStatus(str, enum.Enum):
    BOOKED = "booked"
    ATTENDED = "attended"
    NO_SHOW = "no_show"
    CANCELLED = "cancelled"


class RewardType(str, enum.Enum):
    HOST_REWARD = "host_reward"
    ATTENDEE_REWARD = "attendee_reward"
    BONUS = "bonus"
    PENALTY = "penalty"


class Workshop(Base):
    """A workshop/event that staff or students can host after admin approval."""

    __tablename__ = "workshops"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[WorkshopType] = mapped_column(
        Enum(WorkshopType), default=WorkshopType.WORKSHOP, nullable=False
    )
    category: Mapped[str] = mapped_column(String(100), default="General", nullable=False)

    # Host
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    # Status & Approval
    status: Mapped[WorkshopStatus] = mapped_column(
        Enum(WorkshopStatus), default=WorkshopStatus.PENDING, nullable=False
    )
    approved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Schedule
    scheduled_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60, nullable=False)

    # Capacity
    max_participants: Mapped[int] = mapped_column(Integer, nullable=False)

    # Meeting
    meet_link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    venue: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Reward points (set by admin on approval)
    reward_points_host: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    reward_points_attendee: Mapped[float] = mapped_column(Float, default=0, nullable=False)

    # Completion
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completion_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Prerequisites / requirements
    prerequisites: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_audience: Mapped[str | None] = mapped_column(String(200), nullable=True)
    tags: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    host = relationship("User", foreign_keys=[host_id])
    approver = relationship("User", foreign_keys=[approved_by])
    bookings = relationship(
        "WorkshopBooking", back_populates="workshop", lazy="selectin", cascade="all, delete-orphan"
    )
    rewards = relationship(
        "RewardTransaction", back_populates="workshop", lazy="selectin", cascade="all, delete-orphan"
    )

    @property
    def booked_count(self) -> int:
        return sum(
            1 for b in self.bookings if b.status in (BookingStatus.BOOKED, BookingStatus.ATTENDED)
        )

    @property
    def is_full(self) -> bool:
        return self.booked_count >= self.max_participants


class WorkshopBooking(Base):
    """A student's booking for a workshop."""

    __tablename__ = "workshop_bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workshop_id: Mapped[int] = mapped_column(ForeignKey("workshops.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus), default=BookingStatus.BOOKED, nullable=False
    )
    booked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    attended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    workshop = relationship("Workshop", back_populates="bookings")
    user = relationship("User", foreign_keys=[user_id])


class RewardTransaction(Base):
    """Ledger entry for reward points earned/spent."""

    __tablename__ = "reward_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    workshop_id: Mapped[int | None] = mapped_column(ForeignKey("workshops.id"), nullable=True)
    points: Mapped[float] = mapped_column(Float, nullable=False)
    type: Mapped[RewardType] = mapped_column(Enum(RewardType), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user = relationship("User", foreign_keys=[user_id])
    workshop = relationship("Workshop", back_populates="rewards")
