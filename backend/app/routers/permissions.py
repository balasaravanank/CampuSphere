"""Admin Permissions router — grant/revoke feature access to staff by email."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import require_role
from app.models.permission import UserPermission
from app.models.user import User, UserRole
from app.schemas.common import APIResponse

router = APIRouter(prefix="/admin/permissions", tags=["admin-permissions"])

PERMISSION_POST_OPPORTUNITIES = "post_opportunities"


class GrantPermissionRequest(BaseModel):
    email: str
    permission: str = PERMISSION_POST_OPPORTUNITIES


def _serialize_permission(p: UserPermission) -> dict:
    return {
        "id": p.id,
        "user_id": p.user_id,
        "user_name": p.user.name if p.user else "Unknown",
        "user_email": p.user.email if p.user else "N/A",
        "user_reg_no": p.user.reg_no if p.user else "N/A",
        "user_department": p.user.department if p.user else "N/A",
        "permission": p.permission,
        "granted_by_name": p.granted_by_user.name if p.granted_by_user else "Admin",
        "granted_at": p.granted_at.isoformat(),
    }


@router.get("/opportunities")
async def list_opportunity_permissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """List all staff who have been granted opportunity-posting access."""
    result = await db.execute(
        select(UserPermission).where(UserPermission.permission == PERMISSION_POST_OPPORTUNITIES)
    )
    perms = list(result.scalars().all())
    return APIResponse.success(data=[_serialize_permission(p) for p in perms])


@router.post("/opportunities", status_code=status.HTTP_201_CREATED)
async def grant_opportunity_permission(
    body: GrantPermissionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Grant a staff member opportunity-posting access by email."""
    # Find the user by email
    result = await db.execute(select(User).where(User.email == body.email))
    target_user = result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No user found with email '{body.email}'",
        )

    if target_user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admins already have full access — no need to grant permission.",
        )

    if target_user.role != UserRole.STAFF:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only staff users can be granted this permission. '{target_user.name}' is a {target_user.role.value}.",
        )

    # Check if permission already exists
    existing = await db.execute(
        select(UserPermission).where(
            and_(
                UserPermission.user_id == target_user.id,
                UserPermission.permission == PERMISSION_POST_OPPORTUNITIES,
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{target_user.name} already has this access.",
        )

    perm = UserPermission(
        user_id=target_user.id,
        permission=PERMISSION_POST_OPPORTUNITIES,
        granted_by=current_user.id,
    )
    db.add(perm)
    await db.flush()
    await db.refresh(perm)

    return APIResponse.success(data=_serialize_permission(perm))


@router.delete("/opportunities/{user_id}")
async def revoke_opportunity_permission(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Revoke a staff member's opportunity-posting access."""
    result = await db.execute(
        select(UserPermission).where(
            and_(
                UserPermission.user_id == user_id,
                UserPermission.permission == PERMISSION_POST_OPPORTUNITIES,
            )
        )
    )
    perm = result.scalar_one_or_none()

    if not perm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found for this user.",
        )

    await db.delete(perm)
    await db.flush()
    return APIResponse.success(data={"revoked": True, "user_id": user_id})


@router.get("/check/{user_id}")
async def check_user_permission(
    user_id: int,
    permission: str = PERMISSION_POST_OPPORTUNITIES,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Check if a specific user has a given permission."""
    result = await db.execute(
        select(UserPermission).where(
            and_(
                UserPermission.user_id == user_id,
                UserPermission.permission == permission,
            )
        )
    )
    has_perm = result.scalar_one_or_none() is not None
    return APIResponse.success(data={"user_id": user_id, "permission": permission, "has_access": has_perm})
