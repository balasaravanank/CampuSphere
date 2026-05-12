"""Pydantic schemas for Workshop endpoints."""

from datetime import datetime
from pydantic import BaseModel, Field


class WorkshopCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=300)
    description: str = Field(..., min_length=10)
    type: str = Field(default="workshop")
    category: str = Field(default="General", max_length=100)
    scheduled_date: datetime
    start_time: datetime
    end_time: datetime
    duration_minutes: int = Field(default=60, ge=15, le=480)
    max_participants: int = Field(..., ge=1, le=500)
    venue: str | None = None
    prerequisites: str | None = None
    target_audience: str | None = None
    tags: str | None = None


class WorkshopApprove(BaseModel):
    reward_points_host: float = Field(..., ge=0, le=1000)
    reward_points_attendee: float = Field(..., ge=0, le=1000)


class WorkshopReject(BaseModel):
    rejection_reason: str = Field(..., min_length=5)


class WorkshopMeetLink(BaseModel):
    meet_link: str = Field(..., min_length=5, max_length=500)


class WorkshopComplete(BaseModel):
    completion_notes: str | None = None


class ConfirmAttendance(BaseModel):
    pass
