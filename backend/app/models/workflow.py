"""Workflow models with admin-configurable multi-step approval chains."""

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
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class WorkflowType(str, enum.Enum):
    GENERAL_LETTER = "general_letter"
    EVENT_APPLICATION = "event_application"
    LEAVE_APPLICATION = "leave_application"
    MANUAL_ACADEMIC_ATTENDANCE = "manual_academic_attendance"
    MANUAL_EVENT_ATTENDANCE = "manual_event_attendance"
    REWARD_CLAIM = "reward_claim"
    REWARD_REDEEM = "reward_redeem"


class WorkflowStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    ESCALATED = "escalated"
    CANCELLED = "cancelled"


class StepStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SKIPPED = "skipped"


class WorkflowTemplate(Base):
    """Admin-configurable approval chain template."""
    __tablename__ = "workflow_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    workflow_type: Mapped[WorkflowType] = mapped_column(Enum(WorkflowType), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # JSON: [{"step_order":1,"label":"Mentor","approver_role":"staff"}, ...]
    steps: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    # Which roles can use this template: ["student","staff"]
    applicable_roles: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    requests = relationship("WorkflowRequest", back_populates="template", lazy="selectin")


class WorkflowRequest(Base):
    __tablename__ = "workflow_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    type: Mapped[WorkflowType] = mapped_column(Enum(WorkflowType), nullable=False)
    template_id: Mapped[int | None] = mapped_column(
        ForeignKey("workflow_templates.id"), nullable=True
    )
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[WorkflowStatus] = mapped_column(
        Enum(WorkflowStatus), default=WorkflowStatus.DRAFT, nullable=False
    )
    current_step: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    attachment_urls: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    escalated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    student = relationship("User", foreign_keys=[student_id], back_populates="workflow_requests")
    template = relationship("WorkflowTemplate", back_populates="requests")
    approval_steps = relationship(
        "WorkflowApprovalStep",
        back_populates="request",
        lazy="selectin",
        order_by="WorkflowApprovalStep.step_order",
    )


class WorkflowApprovalStep(Base):
    """Tracks each approval step's status for a specific request."""
    __tablename__ = "workflow_approval_steps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    request_id: Mapped[int] = mapped_column(
        ForeignKey("workflow_requests.id"), nullable=False
    )
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    approver_role: Mapped[str] = mapped_column(String(20), nullable=False)
    approver_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    status: Mapped[StepStatus] = mapped_column(
        Enum(StepStatus), default=StepStatus.PENDING, nullable=False
    )
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    acted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    request = relationship("WorkflowRequest", back_populates="approval_steps")
    approver = relationship("User", foreign_keys=[approver_id])
