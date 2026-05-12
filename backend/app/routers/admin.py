"""Admin router — user management, dashboard stats, content editing."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import require_role
from app.models.user import User, UserRole
from app.models.attendance import AttendanceRecord
from app.models.circular import Circular
from app.models.workflow import WorkflowRequest, WorkflowStatus
from app.models.event import Event
from app.models.opportunity import Opportunity
from app.schemas.common import APIResponse, MetaResponse
from app.schemas.user import AdminUserUpdateRequest, AdminUserCreateRequest, UserResponse
from app.utils.security import hash_password

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard")
async def admin_dashboard(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Admin dashboard — aggregate stats across all modules."""
    total_users = await db.scalar(select(func.count(User.id)))
    total_students = await db.scalar(select(func.count(User.id)).where(User.role == UserRole.STUDENT))
    total_staff = await db.scalar(select(func.count(User.id)).where(User.role == UserRole.STAFF))
    active_circulars = await db.scalar(select(func.count(Circular.id)))
    pending_workflows = await db.scalar(
        select(func.count(WorkflowRequest.id)).where(
            WorkflowRequest.status.in_([WorkflowStatus.SUBMITTED, WorkflowStatus.UNDER_REVIEW])
        )
    )
    upcoming_events = await db.scalar(select(func.count(Event.id)))
    total_opportunities = await db.scalar(select(func.count(Opportunity.id)))

    return APIResponse.success(data={
        "total_users": total_users or 0,
        "total_students": total_students or 0,
        "total_staff": total_staff or 0,
        "active_circulars": active_circulars or 0,
        "pending_workflows": pending_workflows or 0,
        "upcoming_events": upcoming_events or 0,
        "total_opportunities": total_opportunities or 0,
    })


@router.get("/users")
async def list_users(
    role: str | None = None,
    department: str | None = None,
    search: str | None = None,
    cursor: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """List all users with filters."""
    query = select(User).offset(cursor).limit(limit + 1).order_by(User.id)

    if role:
        query = query.where(User.role == role)
    if department:
        query = query.where(User.department == department)
    if search:
        query = query.where(User.name.ilike(f"%{search}%") | User.reg_no.ilike(f"%{search}%"))

    result = await db.execute(query)
    users = list(result.scalars().all())
    has_more = len(users) > limit
    if has_more:
        users = users[:limit]

    return APIResponse.success(
        data=[UserResponse.model_validate(u).model_dump() for u in users],
        meta=MetaResponse(cursor=str(cursor + limit) if has_more else None, has_more=has_more),
    )


@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return APIResponse.success(data=UserResponse.model_validate(user).model_dump())


@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(
    body: AdminUserCreateRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Admin can create new users directly."""
    existing = await db.execute(
        select(User).where((User.email == body.email) | (User.reg_no == body.reg_no))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

    role_enum = UserRole(body.role)
    pwd = body.password if body.password else "Staff@2026!"
    
    user = User(
        reg_no=body.reg_no,
        name=body.name,
        email=body.email,
        password_hash=hash_password(pwd),
        role=role_enum,
        department=body.department,
        is_active=True,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    return APIResponse.success(data=UserResponse.model_validate(user).model_dump())


@router.patch("/users/{user_id}")
async def update_user(
    user_id: int,
    body: AdminUserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Admin can edit any user's role, department, active status, etc."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.flush()
    await db.refresh(user)
    return APIResponse.success(data=UserResponse.model_validate(user).model_dump())


@router.delete("/users/{user_id}")
async def deactivate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Soft-delete: deactivate user instead of deleting."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = False
    await db.flush()
    return APIResponse.success(data={"message": f"User {user.reg_no} deactivated"})
