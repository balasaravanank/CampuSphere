"""Workshops router — full lifecycle: create → approve → book → meet link → complete → confirm attendance → reward."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func as sa_func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.notification import Notification, NotificationPriority
from app.models.workshop import (
    Workshop, WorkshopBooking, RewardTransaction,
    WorkshopStatus, WorkshopType, BookingStatus as WBookingStatus, RewardType,
)
from app.schemas.common import APIResponse
from app.schemas.workshop import (
    WorkshopCreate, WorkshopApprove, WorkshopReject,
    WorkshopMeetLink, WorkshopComplete,
)

router = APIRouter(prefix="/workshops", tags=["workshops"])


# ── Serializers ─────────────────────────────────────────────────────────

def _serialize_workshop(ws: Workshop, user_id: int) -> dict:
    booked = sum(1 for b in ws.bookings if b.status in (WBookingStatus.BOOKED, WBookingStatus.ATTENDED))

    my_booking = next((b for b in ws.bookings if b.user_id == user_id), None)
    my_booking_status = my_booking.status.value if my_booking else None

    return {
        "id": ws.id,
        "title": ws.title,
        "description": ws.description,
        "type": ws.type.value,
        "category": ws.category,
        "host": {
            "id": ws.host.id,
            "name": ws.host.name,
            "role": ws.host.role.value,
            "department": ws.host.department,
            "avatar_url": ws.host.avatar_url,
        } if ws.host else None,
        "status": ws.status.value,
        "scheduled_date": ws.scheduled_date.isoformat(),
        "start_time": ws.start_time.isoformat(),
        "end_time": ws.end_time.isoformat(),
        "duration_minutes": ws.duration_minutes,
        "max_participants": ws.max_participants,
        "booked_count": booked,
        "is_full": booked >= ws.max_participants,
        "meet_link": ws.meet_link,
        "venue": ws.venue,
        "reward_points_host": ws.reward_points_host,
        "reward_points_attendee": ws.reward_points_attendee,
        "prerequisites": ws.prerequisites,
        "target_audience": ws.target_audience,
        "tags": ws.tags,
        "rejection_reason": ws.rejection_reason,
        "completion_notes": ws.completion_notes,
        "completed_at": ws.completed_at.isoformat() if ws.completed_at else None,
        "approved_at": ws.approved_at.isoformat() if ws.approved_at else None,
        "created_at": ws.created_at.isoformat(),
        "my_booking_status": my_booking_status,
        "is_host": ws.host_id == user_id,
        "bookings": [
            {
                "id": b.id,
                "user_id": b.user_id,
                "user_name": b.user.name if b.user else "Unknown",
                "user_department": b.user.department if b.user else "",
                "status": b.status.value,
                "booked_at": b.booked_at.isoformat(),
                "attended_at": b.attended_at.isoformat() if b.attended_at else None,
            }
            for b in ws.bookings
        ],
    }


def _serialize_reward(r: RewardTransaction) -> dict:
    return {
        "id": r.id,
        "user_id": r.user_id,
        "workshop_id": r.workshop_id,
        "points": r.points,
        "type": r.type.value,
        "description": r.description,
        "created_at": r.created_at.isoformat(),
        "workshop_title": r.workshop.title if r.workshop else None,
    }


# ── CREATE — any authenticated user can request a workshop ──────────────

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_workshop(
    body: WorkshopCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Request to host a new workshop/event. Goes to pending for admin approval."""
    try:
        ws_type = WorkshopType(body.type)
    except ValueError:
        ws_type = WorkshopType.OTHER

    ws = Workshop(
        title=body.title,
        description=body.description,
        type=ws_type,
        category=body.category,
        host_id=current_user.id,
        status=WorkshopStatus.PENDING,
        scheduled_date=body.scheduled_date,
        start_time=body.start_time,
        end_time=body.end_time,
        duration_minutes=body.duration_minutes,
        max_participants=body.max_participants,
        venue=body.venue,
        prerequisites=body.prerequisites,
        target_audience=body.target_audience,
        tags=body.tags,
    )
    db.add(ws)
    await db.flush()
    await db.refresh(ws)

    # Notify admins
    admin_result = await db.execute(select(User).where(User.role == UserRole.ADMIN))
    for admin in admin_result.scalars().all():
        notif = Notification(
            user_id=admin.id,
            type="workshop_request",
            title="New Workshop Request",
            body=f"{current_user.name} requested to host: '{ws.title}'",
            priority=NotificationPriority.MEDIUM,
            source_type="workshop",
            source_id=ws.id,
        )
        db.add(notif)

    await db.flush()
    await db.refresh(ws)
    return APIResponse.success(data=_serialize_workshop(ws, current_user.id))


# ── LIST — all workshops (filtered by status/role) ──────────────────────

@router.get("/")
async def list_workshops(
    status_filter: str | None = None,
    my_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List workshops. Optionally filter by status or 'my workshops only'."""
    query = select(Workshop).order_by(Workshop.created_at.desc())

    if status_filter:
        try:
            ws_status = WorkshopStatus(status_filter)
            query = query.where(Workshop.status == ws_status)
        except ValueError:
            pass

    if my_only:
        query = query.where(Workshop.host_id == current_user.id)

    result = await db.execute(query)
    workshops = list(result.scalars().all())
    return APIResponse.success(
        data=[_serialize_workshop(ws, current_user.id) for ws in workshops]
    )


# ── REWARD POINTS LEDGER (must be before /{workshop_id}) ─────────────────

@router.get("/rewards/my-points")
async def get_my_rewards(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's reward transactions and total balance."""
    result = await db.execute(
        select(RewardTransaction)
        .where(RewardTransaction.user_id == current_user.id)
        .order_by(RewardTransaction.created_at.desc())
    )
    transactions = list(result.scalars().all())
    total_points = sum(t.points for t in transactions)
    return APIResponse.success(data={
        "total_points": total_points,
        "transactions": [_serialize_reward(t) for t in transactions],
    })


# ── ADMIN: PENDING WORKSHOPS (must be before /{workshop_id}) ────────────

@router.get("/admin/pending")
async def get_pending_workshops(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Admin: list all pending workshop requests."""
    result = await db.execute(
        select(Workshop)
        .where(Workshop.status == WorkshopStatus.PENDING)
        .order_by(Workshop.created_at.desc())
    )
    workshops = list(result.scalars().all())
    return APIResponse.success(
        data=[_serialize_workshop(ws, current_user.id) for ws in workshops]
    )


# ── GET SINGLE ──────────────────────────────────────────────────────────

@router.get("/{workshop_id}")
async def get_workshop(
    workshop_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single workshop with full details."""
    result = await db.execute(select(Workshop).where(Workshop.id == workshop_id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workshop not found")
    return APIResponse.success(data=_serialize_workshop(ws, current_user.id))


# ── ADMIN: APPROVE ──────────────────────────────────────────────────────

@router.patch("/{workshop_id}/approve")
async def approve_workshop(
    workshop_id: int,
    body: WorkshopApprove,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Admin approves a pending workshop and sets reward points."""
    result = await db.execute(select(Workshop).where(Workshop.id == workshop_id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workshop not found")
    if ws.status != WorkshopStatus.PENDING:
        raise HTTPException(status_code=409, detail=f"Workshop is '{ws.status.value}', not pending")

    ws.status = WorkshopStatus.APPROVED
    ws.approved_by = current_user.id
    ws.approved_at = datetime.now(timezone.utc)
    ws.reward_points_host = body.reward_points_host
    ws.reward_points_attendee = body.reward_points_attendee

    # Notify host
    notif = Notification(
        user_id=ws.host_id,
        type="workshop_approved",
        title="Workshop Approved! 🎉",
        body=f"Your workshop '{ws.title}' has been approved. Host: {body.reward_points_host} pts, Attendees: {body.reward_points_attendee} pts each.",
        priority=NotificationPriority.HIGH,
        source_type="workshop",
        source_id=ws.id,
    )
    db.add(notif)
    await db.flush()
    await db.refresh(ws)
    return APIResponse.success(data=_serialize_workshop(ws, current_user.id))


# ── ADMIN: REJECT ──────────────────────────────────────────────────────

@router.patch("/{workshop_id}/reject")
async def reject_workshop(
    workshop_id: int,
    body: WorkshopReject,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Admin rejects a pending workshop with a reason."""
    result = await db.execute(select(Workshop).where(Workshop.id == workshop_id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workshop not found")
    if ws.status != WorkshopStatus.PENDING:
        raise HTTPException(status_code=409, detail=f"Workshop is '{ws.status.value}', not pending")

    ws.status = WorkshopStatus.REJECTED
    ws.rejection_reason = body.rejection_reason

    # Notify host
    notif = Notification(
        user_id=ws.host_id,
        type="workshop_rejected",
        title="Workshop Rejected",
        body=f"Your workshop '{ws.title}' was not approved. Reason: {body.rejection_reason}",
        priority=NotificationPriority.HIGH,
        source_type="workshop",
        source_id=ws.id,
    )
    db.add(notif)
    await db.flush()
    await db.refresh(ws)
    return APIResponse.success(data=_serialize_workshop(ws, current_user.id))


# ── HOST: ADD MEET LINK ────────────────────────────────────────────────

@router.patch("/{workshop_id}/meet-link")
async def add_meet_link(
    workshop_id: int,
    body: WorkshopMeetLink,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Host adds/updates Google Meet link."""
    result = await db.execute(select(Workshop).where(Workshop.id == workshop_id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workshop not found")
    if ws.host_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only the host can add a meet link")
    if ws.status not in (WorkshopStatus.APPROVED, WorkshopStatus.LIVE):
        raise HTTPException(status_code=409, detail="Workshop must be approved first")

    ws.meet_link = body.meet_link

    # Notify all booked attendees
    for booking in ws.bookings:
        if booking.status == WBookingStatus.BOOKED:
            notif = Notification(
                user_id=booking.user_id,
                type="workshop_meet_link",
                title="Meeting Link Added",
                body=f"The host has added a Google Meet link for '{ws.title}'.",
                priority=NotificationPriority.MEDIUM,
                source_type="workshop",
                source_id=ws.id,
            )
            db.add(notif)

    await db.flush()
    await db.refresh(ws)
    return APIResponse.success(data=_serialize_workshop(ws, current_user.id))


# ── STUDENT: BOOK SLOT ─────────────────────────────────────────────────

@router.post("/{workshop_id}/book", status_code=status.HTTP_201_CREATED)
async def book_workshop(
    workshop_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Book a slot in an approved workshop."""
    result = await db.execute(select(Workshop).where(Workshop.id == workshop_id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workshop not found")
    if ws.status != WorkshopStatus.APPROVED:
        raise HTTPException(status_code=409, detail="Workshop is not open for booking")
    if ws.host_id == current_user.id:
        raise HTTPException(status_code=409, detail="Host cannot book their own workshop")

    # Check already booked
    existing = next(
        (b for b in ws.bookings if b.user_id == current_user.id and b.status != WBookingStatus.CANCELLED),
        None,
    )
    if existing:
        raise HTTPException(status_code=409, detail="Already booked")

    if ws.is_full:
        raise HTTPException(status_code=409, detail="Workshop is full")

    booking = WorkshopBooking(
        workshop_id=ws.id,
        user_id=current_user.id,
        status=WBookingStatus.BOOKED,
    )
    db.add(booking)

    # Notify host
    notif = Notification(
        user_id=ws.host_id,
        type="workshop_booking",
        title="New Booking",
        body=f"{current_user.name} booked a slot in '{ws.title}'. ({ws.booked_count + 1}/{ws.max_participants})",
        priority=NotificationPriority.LOW,
        source_type="workshop",
        source_id=ws.id,
    )
    db.add(notif)

    await db.flush()
    await db.refresh(ws)
    return APIResponse.success(data=_serialize_workshop(ws, current_user.id))


# ── STUDENT: CANCEL BOOKING ────────────────────────────────────────────

@router.delete("/{workshop_id}/book")
async def cancel_workshop_booking(
    workshop_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel a workshop booking."""
    result = await db.execute(select(Workshop).where(Workshop.id == workshop_id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workshop not found")

    booking = next(
        (b for b in ws.bookings if b.user_id == current_user.id and b.status == WBookingStatus.BOOKED),
        None,
    )
    if not booking:
        raise HTTPException(status_code=404, detail="No active booking found")

    booking.status = WBookingStatus.CANCELLED
    booking.cancelled_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(ws)
    return APIResponse.success(data=_serialize_workshop(ws, current_user.id))


# ── HOST: MARK COMPLETE ────────────────────────────────────────────────

@router.patch("/{workshop_id}/complete")
async def complete_workshop(
    workshop_id: int,
    body: WorkshopComplete,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Host marks workshop as completed. Attendees must then confirm attendance."""
    result = await db.execute(select(Workshop).where(Workshop.id == workshop_id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workshop not found")
    if ws.host_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only the host can mark completion")
    if ws.status not in (WorkshopStatus.APPROVED, WorkshopStatus.LIVE):
        raise HTTPException(status_code=409, detail="Workshop must be approved/live to complete")

    ws.status = WorkshopStatus.COMPLETED
    ws.completed_at = datetime.now(timezone.utc)
    ws.completion_notes = body.completion_notes

    # Award host reward
    if ws.reward_points_host > 0:
        host_reward = RewardTransaction(
            user_id=ws.host_id,
            workshop_id=ws.id,
            points=ws.reward_points_host,
            type=RewardType.HOST_REWARD,
            description=f"Host reward for conducting '{ws.title}'",
        )
        db.add(host_reward)

    # Notify all booked attendees to confirm attendance
    for booking in ws.bookings:
        if booking.status == WBookingStatus.BOOKED:
            notif = Notification(
                user_id=booking.user_id,
                type="workshop_completed",
                title="Workshop Completed — Confirm Attendance",
                body=f"'{ws.title}' is now complete. Confirm your attendance to earn {ws.reward_points_attendee} reward points!",
                priority=NotificationPriority.HIGH,
                source_type="workshop",
                source_id=ws.id,
            )
            db.add(notif)

    await db.flush()
    await db.refresh(ws)
    return APIResponse.success(data=_serialize_workshop(ws, current_user.id))


# ── STUDENT: CONFIRM ATTENDANCE ─────────────────────────────────────────

@router.post("/{workshop_id}/confirm-attendance")
async def confirm_attendance(
    workshop_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Student confirms they attended. Awards attendee reward points."""
    result = await db.execute(select(Workshop).where(Workshop.id == workshop_id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workshop not found")
    if ws.status != WorkshopStatus.COMPLETED:
        raise HTTPException(status_code=409, detail="Workshop is not yet marked complete by host")

    booking = next(
        (b for b in ws.bookings if b.user_id == current_user.id and b.status == WBookingStatus.BOOKED),
        None,
    )
    if not booking:
        raise HTTPException(status_code=404, detail="No booking found for this workshop")

    booking.status = WBookingStatus.ATTENDED
    booking.attended_at = datetime.now(timezone.utc)

    # Award attendee reward
    if ws.reward_points_attendee > 0:
        reward = RewardTransaction(
            user_id=current_user.id,
            workshop_id=ws.id,
            points=ws.reward_points_attendee,
            type=RewardType.ATTENDEE_REWARD,
            description=f"Attendance reward for '{ws.title}'",
        )
        db.add(reward)

    await db.flush()
    await db.refresh(ws)
    return APIResponse.success(data=_serialize_workshop(ws, current_user.id))





# ── DELETE WORKSHOP ─────────────────────────────────────────────────────

@router.delete("/{workshop_id}")
async def delete_workshop(
    workshop_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a workshop (host or admin only). Only pending/rejected can be deleted."""
    result = await db.execute(select(Workshop).where(Workshop.id == workshop_id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workshop not found")
    if ws.host_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    if ws.status not in (WorkshopStatus.PENDING, WorkshopStatus.REJECTED, WorkshopStatus.CANCELLED):
        raise HTTPException(status_code=409, detail="Cannot delete an approved/completed workshop")

    await db.delete(ws)
    await db.flush()
    return APIResponse.success(data={"id": workshop_id, "deleted": True})
