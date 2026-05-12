"""Opportunity (hackathon/internship) models with staff form filling."""

import enum
from datetime import datetime

from sqlalchemy import (
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


class OpportunityType(str, enum.Enum):
    HACKATHON = "hackathon"
    EVENT = "event"
    INTERNSHIP = "internship"
    COMPETITION = "competition"
    SCHOLARSHIP = "scholarship"
    WORKSHOP = "workshop"


class Opportunity(Base):
    __tablename__ = "opportunities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    type: Mapped[OpportunityType] = mapped_column(Enum(OpportunityType), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    organization: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    departments: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    eligibility: Mapped[str | None] = mapped_column(Text, nullable=True)
    posted_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="manual", nullable=False)
    source_id: Mapped[str | None] = mapped_column(String(200), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    poster = relationship("User", foreign_keys=[posted_by])
    applications = relationship("OpportunityApplication", back_populates="opportunity", lazy="selectin")


class OpportunityApplication(Base):
    __tablename__ = "opportunity_applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    opportunity_id: Mapped[int] = mapped_column(ForeignKey("opportunities.id"), nullable=False)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="applied", nullable=False)
    applied_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    opportunity = relationship("Opportunity", back_populates="applications")
    student = relationship("User", foreign_keys=[student_id], lazy="selectin")
