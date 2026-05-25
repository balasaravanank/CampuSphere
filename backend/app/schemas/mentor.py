"""Mentor schema definitions."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.user import UserResponse


class MentorProfileBase(BaseModel):
    bio: Optional[str] = None
    skills: Optional[List[str]] = Field(default_factory=list)
    is_accepting_mentees: bool = True
    max_mentees: int = 5


class MentorProfileCreate(MentorProfileBase):
    pass


class MentorProfileUpdate(MentorProfileBase):
    pass


class MentorProfileResponse(MentorProfileBase):
    id: int
    user_id: int
    created_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class MentorAssignmentBase(BaseModel):
    student_id: int


class MentorAssignmentCreate(MentorAssignmentBase):
    mentor_id: int


class MentorAssignmentResponse(MentorAssignmentBase):
    id: int
    mentor_id: int
    assigned_at: datetime
    student: Optional[UserResponse] = None
    mentor: Optional[UserResponse] = None

    class Config:
        from_attributes = True
