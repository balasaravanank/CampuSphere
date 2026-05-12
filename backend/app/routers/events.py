"""Events router — list events, book slots, join waitlist, cancel booking."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.event import BookingStatus, Event, EventBooking
from app.models.user import User, UserRole
from app.models.notification import Notification, NotificationPriority
from app.schemas.common import APIResponse
from app.schemas.event import EventCreate

router = APIRouter(prefix="/events", tags=["events"])


def _serialize_event(event: Event, user_id: int) -> dict:
    confirmed = sum(1 for b in event.bookings if b.status == BookingStatus.CONFIRMED)
    waitlisted = sum(1 for b in event.bookings if b.status == BookingStatus.WAITLISTED)

    my_booking = next((b for b in event.bookings if b.user_id == user_id), None)
    booking_status = my_booking.status.value if my_booking else None

    is_full = confirmed >= event.capacity
    return {
        "id": event.id,
        "term": event.term,
        "title": event.title,
        "description": event.description,
        "venue": event.venue,
        "capacity": event.capacity,
        "waitlist_limit": event.waitlist_limit,
        "confirmed_count": confirmed,
        "waitlist_count": waitlisted,
        "start_time": event.start_time.isoformat(),
        "end_time": event.end_time.isoformat(),
        "booking_open": event.booking_open.isoformat() if event.booking_open else None,
        "booking_close": event.booking_close.isoformat() if event.booking_close else None,
        "status": "waitlist" if is_full else "open",
        "my_booking_status": booking_status,
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_event(
    body: EventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.STAFF)),
):
    """Create a new event (Admin & Staff only)."""
    event = Event(
        term=body.term,
        title=body.title,
        description=body.description,
        venue=body.venue,
        capacity=body.capacity,
        waitlist_limit=body.waitlist_limit,
        start_time=body.start_time,
        end_time=body.end_time,
        booking_open=body.booking_open,
        booking_close=body.booking_close,
        created_by=current_user.id,
    )
    db.add(event)
    await db.flush()
    await db.refresh(event)
    return APIResponse.success(data=_serialize_event(event, current_user.id))


@router.get("/")
async def list_events(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all upcoming events with user's booking status."""
    result = await db.execute(select(Event).order_by(Event.start_time))
    events = list(result.scalars().all())
    return APIResponse.success(data=[_serialize_event(e, current_user.id) for e in events])


@router.post("/{event_id}/book", status_code=status.HTTP_201_CREATED)
async def book_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Book a slot or join waitlist for an event."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if already booked
    existing = await db.execute(
        select(EventBooking).where(
            EventBooking.event_id == event_id,
            EventBooking.user_id == current_user.id,
            EventBooking.status != BookingStatus.CANCELLED,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already booked or on waitlist")

    # Check for overlapping bookings
    overlapping = await db.execute(
        select(EventBooking).join(Event).where(
            EventBooking.user_id == current_user.id,
            EventBooking.status.in_([BookingStatus.CONFIRMED, BookingStatus.WAITLISTED]),
            Event.id != event_id,
            Event.start_time < event.end_time,
            Event.end_time > event.start_time
        )
    )
    if overlapping.scalars().first():
        raise HTTPException(status_code=409, detail="You already have a booking that overlaps with this time slot")

    confirmed_count = sum(1 for b in event.bookings if b.status == BookingStatus.CONFIRMED)
    waitlist_count = sum(1 for b in event.bookings if b.status == BookingStatus.WAITLISTED)
    is_full = confirmed_count >= event.capacity

    if is_full and waitlist_count >= event.waitlist_limit:
        raise HTTPException(status_code=409, detail="Event and waitlist are both full")

    booking = EventBooking(
        event_id=event_id,
        user_id=current_user.id,
        status=BookingStatus.WAITLISTED if is_full else BookingStatus.CONFIRMED,
        waitlist_position=None,
    )
    db.add(booking)
    await db.flush()
    await db.refresh(event)
    return APIResponse.success(data=_serialize_event(event, current_user.id))


@router.delete("/{event_id}/book")
async def cancel_booking(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel an existing booking."""
    result = await db.execute(
        select(EventBooking).where(
            EventBooking.event_id == event_id,
            EventBooking.user_id == current_user.id,
            EventBooking.status != BookingStatus.CANCELLED,
        )
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="No active booking found")

    was_confirmed = booking.status == BookingStatus.CONFIRMED
    booking.status = BookingStatus.CANCELLED
    booking.cancelled_at = datetime.now(timezone.utc)
    await db.flush()

    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one()

    if was_confirmed:
        waitlisted = await db.execute(
            select(EventBooking)
            .where(
                EventBooking.event_id == event_id,
                EventBooking.status == BookingStatus.WAITLISTED
            )
            .order_by(EventBooking.booked_at.asc())
            .limit(1)
        )
        next_in_line = waitlisted.scalar_one_or_none()
        if next_in_line:
            next_in_line.status = BookingStatus.CONFIRMED
            
            notif = Notification(
                user_id=next_in_line.user_id,
                type="event_promotion",
                title="You're off the waitlist!",
                body=f"A slot opened up and your waitlist position for '{event.title}' is now confirmed.",
                priority=NotificationPriority.HIGH,
                source_type="event",
                source_id=event_id,
            )
            db.add(notif)
            await db.flush()

    await db.refresh(event)
    return APIResponse.success(data=_serialize_event(event, current_user.id))


@router.delete("/{event_id}", status_code=status.HTTP_200_OK)
async def delete_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.STAFF)),
):
    """Delete an event and all its bookings (Admin & Staff only)."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    await db.delete(event)
    await db.flush()
    return APIResponse.success(data={"id": event_id, "deleted": True})
