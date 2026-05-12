"""SQLAlchemy models — all core tables for CampuSphere."""

from app.models.user import User
from app.models.academic import Subject, Slot, Enrollment
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.circular import Circular, CircularRead
from app.models.assignment import Assignment, Submission
from app.models.workflow import WorkflowRequest, WorkflowApprovalStep, WorkflowTemplate
from app.models.event import Event, EventBooking
from app.models.mentor import MentorAssignment, MentorMeeting
from app.models.opportunity import Opportunity, OpportunityApplication
from app.models.notification import Notification
from app.models.permission import UserPermission
from app.models.workshop import Workshop, WorkshopBooking, RewardTransaction

__all__ = [
    "User",
    "Subject", "Slot", "Enrollment",
    "AttendanceSession", "AttendanceRecord",
    "Circular", "CircularRead",
    "Assignment", "Submission",
    "WorkflowRequest", "WorkflowApprovalStep", "WorkflowTemplate",
    "Event", "EventBooking",
    "MentorAssignment", "MentorMeeting",
    "Opportunity", "OpportunityApplication",
    "Notification",
    "UserPermission",
    "Workshop", "WorkshopBooking", "RewardTransaction",
]
