"""Event schemas for validation and serialization."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class EventBase(BaseModel):
    term: str = Field(default="General", max_length=100)
    title: str = Field(..., max_length=300)
    description: str | None = None
    venue: str = Field(..., max_length=200)
    capacity: int = Field(..., ge=1)
    waitlist_limit: int = Field(default=0, ge=0)
    start_time: datetime
    end_time: datetime
    booking_open: datetime
    booking_close: datetime


class EventCreate(EventBase):
    pass


class EventResponse(EventBase):
    id: int
    created_by: int
    created_at: datetime
    confirmed_count: int
    waitlist_count: int
    status: str
    my_booking_status: str | None = None

    model_config = ConfigDict(from_attributes=True)
