"""Circulars router — full CRUD, advanced filtering, read tracking."""

import math
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.circular import Circular, CircularPriority, CircularRead
from app.models.user import User, UserRole
from app.schemas.common import APIResponse

router = APIRouter(prefix="/circulars", tags=["circulars"])


# ── Schemas ────────────────────────────────────────────────────

class CircularCreate(BaseModel):
    title: str
    content: str
    priority: str = "informational"
    deadline: str | None = None
    role_targets: list[str] | None = None
    department_targets: list[str] | None = None
    pinned: bool = False

class CircularUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    priority: str | None = None
    deadline: str | None = None
    role_targets: list[str] | None = None
    department_targets: list[str] | None = None
    pinned: bool | None = None


# ── Helpers ────────────────────────────────────────────────────

def _time_ago(dt) -> str:
    now = datetime.now(timezone.utc)
    diff = now - dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else now - dt
    secs = int(diff.total_seconds())
    if secs < 60:
        return "just now"
    if secs < 3600:
        return f"{secs // 60} min ago"
    if secs < 86400:
        return f"{secs // 3600} hr ago"
    days = secs // 86400
    if days == 1:
        return "1 day ago"
    if days < 30:
        return f"{days} days ago"
    return f"{days // 30} months ago"


def _format_date(dt) -> str:
    if dt is None:
        return ""
    d = dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt
    return d.strftime("%d %b %Y")


def _deadline_info(deadline_dt) -> dict | None:
    if not deadline_dt:
        return None
    deadline = deadline_dt.replace(tzinfo=timezone.utc) if deadline_dt.tzinfo is None else deadline_dt
    diff = deadline - datetime.now(timezone.utc)
    total_seconds = diff.total_seconds()
    if total_seconds <= 0:
        return {"text": "Expired", "days": 0, "hours": 0, "expired": True}
    days = int(total_seconds // 86400)
    hours = int((total_seconds % 86400) // 3600)
    if days > 0:
        text = f"{days}d {hours}h left"
    else:
        text = f"{hours}h left"
    return {"text": text, "days": days, "hours": hours, "expired": False}


def _serialize(circular: Circular, read_ids: set[int], include_content: bool = False) -> dict:
    author_name = circular.author.name if circular.author else "Unknown"
    read_count = len(circular.reads) if circular.reads else 0

    result = {
        "id": circular.id,
        "title": circular.title,
        "summary": circular.ai_summary or (circular.content[:200] if circular.content else ""),
        "priority": circular.priority.value,
        "pinned": circular.pinned,
        "date": _time_ago(circular.created_at),
        "date_formatted": _format_date(circular.created_at),
        "created_at": circular.created_at.isoformat() if circular.created_at else None,
        "deadline": _deadline_info(circular.deadline),
        "deadline_raw": circular.deadline.isoformat() if circular.deadline else None,
        "read": circular.id in read_ids,
        "author_name": author_name,
        "read_count": read_count,
        "role_targets": circular.role_targets or [],
        "department_targets": circular.department_targets or [],
        "attachment_urls": circular.attachment_urls or [],
    }

    if include_content:
        result["content"] = circular.content

    return result


# ── Endpoints ──────────────────────────────────────────────────

@router.get("/")
async def list_circulars(
    priority: str | None = Query(default=None),
    pinned: bool | None = Query(default=None),
    search: str | None = Query(default=None),
    department: str | None = Query(default=None),
    from_date: str | None = Query(default=None),
    to_date: str | None = Query(default=None),
    read_status: str | None = Query(default=None),  # "read", "unread", or None/all
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List circulars with advanced filtering."""
    query = select(Circular).order_by(Circular.pinned.desc(), Circular.created_at.desc())

    if priority and priority != "all":
        query = query.where(Circular.priority == priority)
    if pinned is not None:
        query = query.where(Circular.pinned == pinned)
    if search:
        search_term = f"%{search}%"
        query = query.where(Circular.title.ilike(search_term) | Circular.content.ilike(search_term))
    if from_date:
        try:
            fd = datetime.fromisoformat(from_date).replace(tzinfo=timezone.utc)
            query = query.where(Circular.created_at >= fd)
        except ValueError:
            pass
    if to_date:
        try:
            td = datetime.fromisoformat(to_date).replace(tzinfo=timezone.utc)
            query = query.where(Circular.created_at <= td)
        except ValueError:
            pass

    result = await db.execute(query)
    circulars = list(result.scalars().all())

    # Get IDs this user has read
    reads_result = await db.execute(
        select(CircularRead.circular_id).where(CircularRead.user_id == current_user.id)
    )
    read_ids = set(reads_result.scalars().all())

    serialized = [_serialize(c, read_ids) for c in circulars]

    # Filter by read status (post-query since it involves join logic)
    if read_status == "read":
        serialized = [c for c in serialized if c["read"]]
    elif read_status == "unread":
        serialized = [c for c in serialized if not c["read"]]

    # Filter by department (check if department is in the targets or targets are empty)
    if department and department != "all":
        serialized = [
            c for c in serialized
            if not c["department_targets"] or department in c["department_targets"]
        ]

    # Stats
    total = len(serialized)
    unread = sum(1 for c in serialized if not c["read"])
    urgent = sum(1 for c in serialized if c["priority"] == "urgent")
    deadlines_today = sum(
        1 for c in serialized
        if c["deadline"] and not c["deadline"]["expired"] and c["deadline"]["days"] == 0
    )

    return APIResponse.success(
        data={
            "circulars": serialized,
            "stats": {
                "total": total,
                "unread": unread,
                "urgent": urgent,
                "deadlines_today": deadlines_today,
            },
            "departments": list(
                {dept for c in circulars if c.department_targets for dept in c.department_targets}
            ),
        }
    )


@router.get("/{circular_id}")
async def get_circular(
    circular_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full circular detail."""
    result = await db.execute(select(Circular).where(Circular.id == circular_id))
    circular = result.scalar_one_or_none()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    reads_result = await db.execute(
        select(CircularRead.circular_id).where(CircularRead.user_id == current_user.id)
    )
    read_ids = set(reads_result.scalars().all())

    return APIResponse.success(data=_serialize(circular, read_ids, include_content=True))


@router.post("/")
async def create_circular(
    body: CircularCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.STAFF)),
):
    """Create a new circular (admin/staff only)."""
    deadline_dt = None
    if body.deadline:
        try:
            deadline_dt = datetime.fromisoformat(body.deadline)
            if deadline_dt.tzinfo is None:
                deadline_dt = deadline_dt.replace(tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid deadline format")

    circular = Circular(
        title=body.title,
        content=body.content,
        priority=body.priority,
        deadline=deadline_dt,
        role_targets=body.role_targets,
        department_targets=body.department_targets,
        pinned=body.pinned,
        created_by=current_user.id,
    )
    db.add(circular)
    await db.flush()
    await db.refresh(circular)

    return APIResponse.success(data={"id": circular.id, "message": "Circular created"})


@router.put("/{circular_id}")
async def update_circular(
    circular_id: int,
    body: CircularUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.STAFF)),
):
    """Update a circular (admin/staff only)."""
    result = await db.execute(select(Circular).where(Circular.id == circular_id))
    circular = result.scalar_one_or_none()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    if body.title is not None:
        circular.title = body.title
    if body.content is not None:
        circular.content = body.content
    if body.priority is not None:
        circular.priority = body.priority
    if body.deadline is not None:
        try:
            dt = datetime.fromisoformat(body.deadline)
            circular.deadline = dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid deadline format")
    if body.role_targets is not None:
        circular.role_targets = body.role_targets
    if body.department_targets is not None:
        circular.department_targets = body.department_targets
    if body.pinned is not None:
        circular.pinned = body.pinned

    await db.flush()

    return APIResponse.success(data={"message": "Circular updated"})


@router.delete("/{circular_id}")
async def delete_circular(
    circular_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.STAFF)),
):
    """Delete a circular and its read records (admin/staff only)."""
    result = await db.execute(select(Circular).where(Circular.id == circular_id))
    circular = result.scalar_one_or_none()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    await db.execute(delete(CircularRead).where(CircularRead.circular_id == circular_id))
    await db.delete(circular)
    await db.flush()

    return APIResponse.success(data={"message": "Circular deleted"})


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


@router.post("/{circular_id}/toggle-pin")
async def toggle_pin(
    circular_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.STAFF)),
):
    """Toggle the pinned status of a circular (admin/staff only)."""
    result = await db.execute(select(Circular).where(Circular.id == circular_id))
    circular = result.scalar_one_or_none()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    circular.pinned = not circular.pinned
    await db.flush()

    return APIResponse.success(data={"pinned": circular.pinned})


@router.post("/mark-all-read")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all circulars as read for the current user."""
    all_ids_result = await db.execute(select(Circular.id))
    all_ids = set(all_ids_result.scalars().all())

    already_read_result = await db.execute(
        select(CircularRead.circular_id).where(CircularRead.user_id == current_user.id)
    )
    already_read = set(already_read_result.scalars().all())

    unread_ids = all_ids - already_read
    for cid in unread_ids:
        db.add(CircularRead(circular_id=cid, user_id=current_user.id))

    await db.flush()

    return APIResponse.success(data={"marked": len(unread_ids)})
