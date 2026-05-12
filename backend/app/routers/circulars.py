"""Circulars router — list, filter by priority, mark as read."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.circular import Circular, CircularPriority, CircularRead
from app.models.user import User
from app.schemas.common import APIResponse

router = APIRouter(prefix="/circulars", tags=["circulars"])


def _time_ago(dt) -> str:
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    diff = now - dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else now - dt
    secs = int(diff.total_seconds())
    if secs < 3600:
        return f"{secs // 60} min ago"
    if secs < 86400:
        return f"{secs // 3600} hr ago"
    return f"{secs // 86400} days ago"


def _serialize(circular: Circular, read_ids: set[int]) -> dict:
    import math
    from datetime import datetime, timezone
    deadline_str = None
    if circular.deadline:
        deadline = circular.deadline.replace(tzinfo=timezone.utc) if circular.deadline.tzinfo is None else circular.deadline
        diff = deadline - datetime.now(timezone.utc)
        if diff.total_seconds() > 0:
            days = math.ceil(diff.total_seconds() / 86400)
            deadline_str = f"{days} days left"
    return {
        "id": circular.id,
        "title": circular.title,
        "summary": circular.content[:200],
        "priority": circular.priority.value,
        "pinned": circular.pinned,
        "date": _time_ago(circular.created_at),
        "deadline": deadline_str,
        "read": circular.id in read_ids,
    }


@router.get("/")
async def list_circulars(
    priority: str | None = Query(default=None),
    pinned: bool | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List circulars, optionally filtered by priority or pinned status."""
    query = select(Circular).order_by(Circular.pinned.desc(), Circular.created_at.desc())
    if priority and priority != "all":
        query = query.where(Circular.priority == priority)
    if pinned is not None:
        query = query.where(Circular.pinned == pinned)

    result = await db.execute(query)
    circulars = list(result.scalars().all())

    # Get IDs this user has read
    reads_result = await db.execute(
        select(CircularRead.circular_id).where(CircularRead.user_id == current_user.id)
    )
    read_ids = set(reads_result.scalars().all())

    return APIResponse.success(data=[_serialize(c, read_ids) for c in circulars])


@router.post("/{circular_id}/read")
async def mark_read(
    circular_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a circular as read by the current user."""
    existing = await db.execute(
        select(CircularRead).where(
            CircularRead.circular_id == circular_id,
            CircularRead.user_id == current_user.id,
        )
    )
    if not existing.scalar_one_or_none():
        db.add(CircularRead(circular_id=circular_id, user_id=current_user.id))
        await db.flush()
    return APIResponse.success(data={"read": True})
