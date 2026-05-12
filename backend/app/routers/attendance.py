"""Attendance router — schedule, OTP generation, and marking."""

import random
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.academic import Enrollment, Slot, Subject
from app.models.attendance import (
    AttendanceRecord,
    AttendanceSession,
    AttendanceStatus,
    SessionStatus,
)
from app.models.user import User, UserRole
from app.schemas.common import APIResponse

router = APIRouter(prefix="/attendance", tags=["attendance"])


class GenerateOTPRequest(BaseModel):
    slot_id: int
    expires_in_minutes: int = 10


class MarkAttendanceRequest(BaseModel):
    otp: str


@router.get("/schedule")
async def get_schedule(
    all_days: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get schedule for today (or all days for testing)."""
    current_day = datetime.now().weekday()
    
    # 1. Fetch relevant slots based on role
    query = select(Slot).options(joinedload(Slot.subject), joinedload(Slot.faculty))
    
    if current_user.role == UserRole.STUDENT:
        # Get enrolled subjects
        enrolled = await db.execute(select(Enrollment.subject_id).where(Enrollment.student_id == current_user.id))
        subject_ids = [row for row in enrolled.scalars().all()]
        query = query.where(Slot.subject_id.in_(subject_ids))
    elif current_user.role == UserRole.STAFF:
        query = query.where(Slot.faculty_id == current_user.id)
    # Admin sees everything (or can be restricted if needed)

    if not all_days:
        query = query.where(Slot.day_of_week == current_day)
        
    query = query.order_by(Slot.time_start)
    result = await db.execute(query)
    slots = result.unique().scalars().all()
    
    # 2. Check for active sessions for these slots today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    slot_ids = [s.id for s in slots]
    
    sessions_dict = {}
    records_dict = {}
    
    if slot_ids:
        sess_query = select(AttendanceSession).where(
            AttendanceSession.slot_id.in_(slot_ids),
            AttendanceSession.date >= today_start,
            AttendanceSession.status == SessionStatus.ACTIVE
        )
        sess_result = await db.execute(sess_query)
        for sess in sess_result.scalars().all():
            sessions_dict[sess.slot_id] = sess
            
        # 3. For students, check if they have marked attendance
        if current_user.role == UserRole.STUDENT and sessions_dict:
            session_ids = [s.id for s in sessions_dict.values()]
            rec_query = select(AttendanceRecord).where(
                AttendanceRecord.session_id.in_(session_ids),
                AttendanceRecord.student_id == current_user.id
            )
            rec_result = await db.execute(rec_query)
            for rec in rec_result.scalars().all():
                records_dict[rec.session_id] = rec

    # 4. Format output
    schedule = []
    for slot in slots:
        sess = sessions_dict.get(slot.id)
        
        # Calculate status
        status_label = "pending"
        if sess:
            if current_user.role == UserRole.STUDENT:
                rec = records_dict.get(sess.id)
                if rec and rec.status == AttendanceStatus.PRESENT:
                    status_label = "present"
                else:
                    status_label = "active" # Session is active, student needs to mark
            else:
                status_label = "active" # Staff sees it as active
                
        schedule.append({
            "id": slot.id,
            "type": "class",
            "time": f"{slot.time_start.strftime('%H:%M')} - {slot.time_end.strftime('%H:%M')}",
            "subject": slot.subject.name,
            "room": slot.room,
            "faculty": slot.faculty.name,
            "status": status_label,
            "session_id": sess.id if sess else None,
            "otp_generated": sess is not None,
        })

    return APIResponse.success(data=schedule)


@router.post("/sessions")
async def generate_otp(
    body: GenerateOTPRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate OTP for a class slot."""
    if current_user.role not in (UserRole.STAFF, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Only staff can generate OTP")
        
    # Check if slot exists and user has access
    slot_result = await db.execute(select(Slot).where(Slot.id == body.slot_id))
    slot = slot_result.scalar_one_or_none()
    
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
        
    if current_user.role == UserRole.STAFF and slot.faculty_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only generate OTP for your own classes")

    # Check if active session already exists today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    existing = await db.execute(
        select(AttendanceSession).where(
            AttendanceSession.slot_id == slot.id,
            AttendanceSession.date >= today_start,
            AttendanceSession.status == SessionStatus.ACTIVE
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Active session already exists for this class today")

    # Generate OTP
    otp = str(random.randint(100000, 999999))
    
    session = AttendanceSession(
        slot_id=slot.id,
        date=datetime.now(timezone.utc),
        in_otp_hash=otp, # Storing plain for simplicity in prototype, should hash in prod
        otp_expires_at=datetime.now(timezone.utc) + timedelta(minutes=body.expires_in_minutes),
        status=SessionStatus.ACTIVE,
        created_by=current_user.id,
    )
    db.add(session)
    await db.flush()
    
    return APIResponse.success(data={
        "session_id": session.id,
        "otp": otp,
        "expires_at": session.otp_expires_at.isoformat()
    })


@router.post("/sessions/{session_id}/mark")
async def mark_attendance(
    session_id: int,
    body: MarkAttendanceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Student marks attendance using OTP."""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can mark attendance")

    # Check session
    result = await db.execute(select(AttendanceSession).where(AttendanceSession.id == session_id))
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session.status != SessionStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Session is closed")
        
    if session.otp_expires_at and session.otp_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP has expired")
        
    # Verify OTP (plain compare for prototype)
    if session.in_otp_hash != body.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    # Check if already marked
    existing = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.session_id == session.id,
            AttendanceRecord.student_id == current_user.id
        )
    )
    record = existing.scalar_one_or_none()
    
    if record:
        if record.status == AttendanceStatus.PRESENT:
            raise HTTPException(status_code=400, detail="Attendance already marked")
        record.status = AttendanceStatus.PRESENT
        record.in_time = datetime.now(timezone.utc)
    else:
        record = AttendanceRecord(
            session_id=session.id,
            student_id=current_user.id,
            status=AttendanceStatus.PRESENT,
            in_time=datetime.now(timezone.utc)
        )
        db.add(record)
        
    await db.flush()
    return APIResponse.success(data={"message": "Attendance marked successfully"})
