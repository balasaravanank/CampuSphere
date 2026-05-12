"""Assignments router — list student assignments, update kanban status."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.assignment import Assignment, Submission, SubmissionStatus
from app.models.academic import Enrollment
from app.models.user import User
from app.schemas.common import APIResponse

router = APIRouter(prefix="/assignments", tags=["assignments"])


class StatusUpdateRequest(BaseModel):
    status: SubmissionStatus


def _serialize(assignment: Assignment, submission: Submission | None) -> dict:
    return {
        "id": assignment.id,
        "title": assignment.title,
        "subject": assignment.subject.name if assignment.subject else "Unknown",
        "due": assignment.due_at.strftime("%b %d"),
        "max_marks": assignment.max_marks,
        "status": submission.status.value if submission else SubmissionStatus.TO_DO.value,
        "marks": f"{submission.grade}/{assignment.max_marks:.0f}" if (submission and submission.grade is not None) else None,
        "submission_id": submission.id if submission else None,
    }


@router.get("/")
async def list_assignments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all assignments for the current student's enrolled subjects."""
    # Get student's enrollments → get their subjects
    enroll_result = await db.execute(
        select(Enrollment).where(Enrollment.student_id == current_user.id)
    )
    enrollments = list(enroll_result.scalars().all())
    subject_ids = [e.subject_id for e in enrollments]

    if not subject_ids:
        # Fallback: show all assignments if no enrollment data (dev mode)
        assignments_result = await db.execute(
            select(Assignment).order_by(Assignment.due_at)
        )
    else:
        assignments_result = await db.execute(
            select(Assignment)
            .where(Assignment.subject_id.in_(subject_ids))
            .order_by(Assignment.due_at)
        )

    assignments = list(assignments_result.scalars().all())

    # Get student's submissions
    if assignments:
        subs_result = await db.execute(
            select(Submission).where(
                Submission.student_id == current_user.id,
                Submission.assignment_id.in_([a.id for a in assignments]),
            )
        )
        subs_by_assignment = {s.assignment_id: s for s in subs_result.scalars().all()}
    else:
        subs_by_assignment = {}

    return APIResponse.success(
        data=[_serialize(a, subs_by_assignment.get(a.id)) for a in assignments]
    )


@router.patch("/{assignment_id}/status")
async def update_status(
    assignment_id: int,
    body: StatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update submission status (to_do → in_progress → submitted)."""
    # Can't move backwards to to_do from graded
    if body.status == SubmissionStatus.GRADED:
        raise HTTPException(status_code=400, detail="Cannot manually set status to graded")

    # Find or create submission record
    result = await db.execute(
        select(Submission).where(
            Submission.assignment_id == assignment_id,
            Submission.student_id == current_user.id,
        )
    )
    submission = result.scalar_one_or_none()

    if not submission:
        submission = Submission(
            assignment_id=assignment_id,
            student_id=current_user.id,
            status=body.status,
        )
        db.add(submission)
    else:
        submission.status = body.status
        # Set submitted_at when first submitted
        if body.status == SubmissionStatus.SUBMITTED and not submission.submitted_at:
            from datetime import datetime, timezone
            submission.submitted_at = datetime.now(timezone.utc)

    await db.flush()

    assignment_result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = assignment_result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    return APIResponse.success(data=_serialize(assignment, submission))
