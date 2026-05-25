"""Study Group schema definitions."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.user import UserResponse


class StudyGroupBase(BaseModel):
    name: str = Field(..., max_length=150)
    description: Optional[str] = None
    subject_tags: Optional[List[str]] = Field(default_factory=list)
    is_private: bool = False


class StudyGroupCreate(StudyGroupBase):
    pass


class StudyGroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    subject_tags: Optional[List[str]] = None
    is_private: Optional[bool] = None


class StudyGroupMemberResponse(BaseModel):
    id: int
    user_id: int
    group_id: int
    role: str
    joined_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class StudyGroupResponse(StudyGroupBase):
    id: int
    created_by: int
    created_at: datetime
    creator: Optional[UserResponse] = None
    members: Optional[List[StudyGroupMemberResponse]] = None

    class Config:
        from_attributes = True
