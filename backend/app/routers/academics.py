"""Academics router — student-facing enrolled subjects, attendance, sessions."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.academic import Enrollment, Slot, Subject
from app.models.attendance import (
    AttendanceRecord,
    AttendanceSession,
    AttendanceStatus,
    SessionStatus,
)
from app.models.user import User, UserRole
from app.schemas.common import APIResponse

router = APIRouter(prefix="/academics", tags=["academics"])


@router.get("/enrolled")
async def list_enrolled_subjects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all enrolled subjects for the current student with summary stats."""
    if current_user.role not in (UserRole.STUDENT, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Only students can view enrolled subjects")

    query = (
        select(Enrollment)
        .options(
            joinedload(Enrollment.subject).joinedload(Subject.slots).joinedload(Slot.faculty),
        )
        .where(Enrollment.student_id == current_user.id)
    )
    result = await db.execute(query)
    enrollments = result.unique().scalars().all()

    data = []
    for enr in enrollments:
        subject = enr.subject
        slots = subject.slots if subject.slots else []

        # Aggregate attendance stats across all slots for this subject
        slot_ids = [s.id for s in slots]
        total_sessions = 0
        present_count = 0
        first_session_date = None
        last_session_date = None

        if slot_ids:
            # Count total sessions
            sess_count = await db.scalar(
                select(func.count(AttendanceSession.id)).where(
                    AttendanceSession.slot_id.in_(slot_ids)
                )
            )
            total_sessions = sess_count or 0

            # Count present records for this student
            present_q = await db.scalar(
                select(func.count(AttendanceRecord.id)).where(
                    AttendanceRecord.session_id.in_(
                        select(AttendanceSession.id).where(
                            AttendanceSession.slot_id.in_(slot_ids)
                        )
                    ),
                    AttendanceRecord.student_id == current_user.id,
                    AttendanceRecord.status == AttendanceStatus.PRESENT,
                )
            )
            present_count = present_q or 0

            # Session date range
            date_range = await db.execute(
                select(
                    func.min(AttendanceSession.date),
                    func.max(AttendanceSession.date),
                ).where(AttendanceSession.slot_id.in_(slot_ids))
            )
            row = date_range.first()
            if row:
                first_session_date = row[0]
                last_session_date = row[1]

        attendance_pct = round((present_count / total_sessions) * 100, 2) if total_sessions > 0 else 0

        # Get upcoming sessions count
        now = datetime.now(timezone.utc)
        upcoming = 0
        if slot_ids:
            upcoming_q = await db.scalar(
                select(func.count(AttendanceSession.id)).where(
                    AttendanceSession.slot_id.in_(slot_ids),
                    AttendanceSession.date > now,
                )
            )
            upcoming = upcoming_q or 0

        # Pick the first slot for display info
        primary_slot = slots[0] if slots else None

        data.append({
            "enrollment_id": enr.id,
            "subject_id": subject.id,
            "subject_code": subject.code,
            "subject_name": subject.name,
            "credits": subject.credits,
            "department": subject.department,
            "semester": subject.semester,
            "term": subject.term,
            "slot_number": primary_slot.slot_number if primary_slot else None,
            "room": primary_slot.room if primary_slot else None,
            "faculty_name": primary_slot.faculty.name if primary_slot and primary_slot.faculty else None,
            "attendance_percentage": attendance_pct,
            "present_count": present_count,
            "total_sessions": total_sessions,
            "upcoming_sessions": upcoming,
            "first_session_date": first_session_date.isoformat() if first_session_date else None,
            "last_session_date": last_session_date.isoformat() if last_session_date else None,
        })

    return APIResponse.success(data=data)


@router.get("/enrolled/{enrollment_id}")
async def get_enrollment_detail(
    enrollment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed info about a specific enrolled subject."""
    query = (
        select(Enrollment)
        .options(
            joinedload(Enrollment.subject).joinedload(Subject.slots).joinedload(Slot.faculty),
            joinedload(Enrollment.student),
        )
        .where(Enrollment.id == enrollment_id)
    )
    result = await db.execute(query)
    enr = result.unique().scalar_one_or_none()

    if not enr:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    if current_user.role == UserRole.STUDENT and enr.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your enrollment")

    subject = enr.subject
    slots = subject.slots or []
    slot_ids = [s.id for s in slots]

    # Attendance stats
    total_sessions = 0
    present_count = 0
    if slot_ids:
        total_sessions = await db.scalar(
            select(func.count(AttendanceSession.id)).where(
                AttendanceSession.slot_id.in_(slot_ids)
            )
        ) or 0
        present_count = await db.scalar(
            select(func.count(AttendanceRecord.id)).where(
                AttendanceRecord.session_id.in_(
                    select(AttendanceSession.id).where(
                        AttendanceSession.slot_id.in_(slot_ids)
                    )
                ),
                AttendanceRecord.student_id == enr.student_id,
                AttendanceRecord.status == AttendanceStatus.PRESENT,
            )
        ) or 0

    attendance_pct = round((present_count / total_sessions) * 100, 2) if total_sessions > 0 else 0
    primary_slot = slots[0] if slots else None

    return APIResponse.success(data={
        "enrollment_id": enr.id,
        "student": {
            "id": enr.student.id,
            "name": enr.student.name,
            "reg_no": enr.student.reg_no,
            "department": enr.student.department,
        },
        "subject": {
            "id": subject.id,
            "code": subject.code,
            "name": subject.name,
            "credits": subject.credits,
            "department": subject.department,
            "semester": subject.semester,
            "term": subject.term,
        },
        "slot": {
            "id": primary_slot.id if primary_slot else None,
            "slot_number": primary_slot.slot_number if primary_slot else None,
            "room": primary_slot.room if primary_slot else None,
            "day_of_week": primary_slot.day_of_week if primary_slot else None,
            "time_start": primary_slot.time_start.strftime("%H:%M") if primary_slot else None,
            "time_end": primary_slot.time_end.strftime("%H:%M") if primary_slot else None,
            "faculty_name": primary_slot.faculty.name if primary_slot and primary_slot.faculty else None,
        },
        "attendance": {
            "percentage": attendance_pct,
            "present": present_count,
            "total": total_sessions,
        },
    })


@router.get("/enrolled/{enrollment_id}/attendance")
async def get_enrollment_attendance(
    enrollment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get attendance records for an enrolled subject."""
    enr_result = await db.execute(
        select(Enrollment)
        .options(joinedload(Enrollment.subject).joinedload(Subject.slots).joinedload(Slot.faculty))
        .where(Enrollment.id == enrollment_id)
    )
    enr = enr_result.unique().scalar_one_or_none()
    if not enr:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    if current_user.role == UserRole.STUDENT and enr.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your enrollment")

    slot_ids = [s.id for s in (enr.subject.slots or [])]
    if not slot_ids:
        return APIResponse.success(data=[])

    # Get all sessions for these slots
    sessions_result = await db.execute(
        select(AttendanceSession)
        .options(joinedload(AttendanceSession.slot))
        .where(AttendanceSession.slot_id.in_(slot_ids))
        .order_by(AttendanceSession.date.asc())
    )
    sessions = sessions_result.unique().scalars().all()

    # Get student's attendance records
    session_ids = [s.id for s in sessions]
    records_map = {}
    if session_ids:
        recs_result = await db.execute(
            select(AttendanceRecord).where(
                AttendanceRecord.session_id.in_(session_ids),
                AttendanceRecord.student_id == enr.student_id,
            )
        )
        for rec in recs_result.scalars().all():
            records_map[rec.session_id] = rec

    now = datetime.now(timezone.utc)
    data = []
    for sess in sessions:
        rec = records_map.get(sess.id)
        slot = sess.slot

        if sess.date > now:
            att_status = "UPCOMING"
        elif rec and rec.status == AttendanceStatus.PRESENT:
            att_status = "PRESENT"
        elif rec and rec.status == AttendanceStatus.ABSENT:
            att_status = "ABSENT"
        else:
            att_status = "ABSENT"

        data.append({
            "session_id": sess.id,
            "date": sess.date.strftime("%d %b %Y") if sess.date else None,
            "time": f"{slot.time_start.strftime('%H:%M')} - {slot.time_end.strftime('%H:%M')}" if slot else None,
            "timing": slot.slot_number or f"CLS{slot.time_start.strftime('%H')}-{slot.time_end.strftime('%H')}" if slot else None,
            "location": slot.room if slot else None,
            "status": att_status,
            "in_time": rec.in_time.strftime("%d %b %Y %H:%M %p") if rec and rec.in_time else None,
            "out_time": rec.out_time.strftime("%d %b %Y %H:%M %p") if rec and rec.out_time else None,
            "feedback_submitted": False,  # Placeholder — future feature
        })

    return APIResponse.success(data=data)


@router.get("/enrolled/{enrollment_id}/sessions")
async def get_enrollment_sessions(
    enrollment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all sessions (completed/upcoming) for an enrolled subject."""
    enr_result = await db.execute(
        select(Enrollment)
        .options(joinedload(Enrollment.subject).joinedload(Subject.slots).joinedload(Slot.faculty))
        .where(Enrollment.id == enrollment_id)
    )
    enr = enr_result.unique().scalar_one_or_none()
    if not enr:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    if current_user.role == UserRole.STUDENT and enr.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your enrollment")

    slot_ids = [s.id for s in (enr.subject.slots or [])]
    if not slot_ids:
        return APIResponse.success(data=[])

    sessions_result = await db.execute(
        select(AttendanceSession)
        .options(joinedload(AttendanceSession.slot))
        .where(AttendanceSession.slot_id.in_(slot_ids))
        .order_by(AttendanceSession.date.asc())
    )
    sessions = sessions_result.unique().scalars().all()

    now = datetime.now(timezone.utc)
    data = []
    for sess in sessions:
        slot = sess.slot
        is_upcoming = sess.date > now if sess.date else False

        data.append({
            "session_id": sess.id,
            "date": sess.date.strftime("%d %b %Y") if sess.date else None,
            "time": f"{slot.time_start.strftime('%H:%M')} - {slot.time_end.strftime('%H:%M')}" if slot else None,
            "timing": slot.slot_number or f"CLS{slot.time_start.strftime('%H')}-{slot.time_end.strftime('%H')}" if slot else None,
            "location": slot.room if slot else None,
            "status": "Upcoming" if is_upcoming else "Completed",
        })

    return APIResponse.success(data=data)
