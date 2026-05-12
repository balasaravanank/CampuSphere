"""Opportunity request/response schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class OpportunityCreateRequest(BaseModel):
    type: str
    title: str
    organization: str
    description: Optional[str] = None
    link: Optional[str] = None
    deadline: Optional[datetime] = None
    departments: Optional[list[str]] = None
    eligibility: Optional[str] = None
