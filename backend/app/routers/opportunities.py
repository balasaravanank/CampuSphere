"""Opportunities router — create, list, filter by type, apply/withdraw, view applicants."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.opportunity import Opportunity, OpportunityApplication, OpportunityType
from app.models.permission import UserPermission
from app.models.user import User, UserRole
from app.schemas.common import APIResponse
from app.schemas.opportunity import OpportunityCreateRequest

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


def _serialize(opp: Opportunity, applied_ids: set[int], include_poster: bool = False) -> dict:
    deadline_str = None
    deadline_iso = None
    if opp.deadline:
        deadline_str = opp.deadline.strftime("%b %d, %Y")
        deadline_iso = opp.deadline.isoformat()

    result = {
        "id": opp.id,
        "type": opp.type.value,
        "title": opp.title,
        "organization": opp.organization,
        "description": opp.description,
        "link": opp.link,
        "deadline": deadline_str,
        "deadline_iso": deadline_iso,
        "departments": opp.departments or ["All"],
        "eligibility": opp.eligibility,
        "applied": opp.id in applied_ids,
        "application_count": len(opp.applications),
        "source": opp.source,
        "source_id": opp.source_id,
        "logo_url": opp.logo_url,
        "created_at": opp.created_at.isoformat(),
    }

    if include_poster and opp.poster:
        result["poster_name"] = opp.poster.name
        result["posted_by"] = opp.posted_by

    return result


def _serialize_applicant(app: OpportunityApplication) -> dict:
    return {
        "id": app.id,
        "student_id": app.student_id,
        "student_name": app.student.name if app.student else "Unknown",
        "student_reg_no": app.student.reg_no if app.student else "N/A",
        "student_department": app.student.department if app.student else "N/A",
        "student_email": app.student.email if app.student else "N/A",
        "status": app.status,
        "applied_at": app.applied_at.isoformat(),
    }


@router.get("/")
async def list_opportunities(
    type: str | None = Query(default=None),
    source: str | None = Query(default=None, description="Filter by source: manual, unstop, devfolio, or all"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all opportunities, optionally filtered by type and source.

    Sorting: manual (college-posted) items appear first, then by deadline ASC.
    """
    query = select(Opportunity).order_by(
        case((Opportunity.source == "manual", 0), else_=1),  # manual first
        Opportunity.deadline.asc().nulls_last(),
    )
    if type and type.lower() != "all":
        query = query.where(Opportunity.type == type.lower())
    if source and source.lower() != "all":
        query = query.where(Opportunity.source == source.lower())

    result = await db.execute(query)
    opps = list(result.scalars().all())

    applied_result = await db.execute(
        select(OpportunityApplication.opportunity_id).where(
            OpportunityApplication.student_id == current_user.id
        )
    )
    applied_ids = set(applied_result.scalars().all())
    is_staff_or_admin = current_user.role in (UserRole.ADMIN, UserRole.STAFF)

    return APIResponse.success(data=[_serialize(o, applied_ids, include_poster=is_staff_or_admin) for o in opps])


@router.get("/stats")
async def opportunity_stats(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Return counts grouped by type and source."""
    # Count by type
    type_q = await db.execute(
        select(Opportunity.type, func.count(Opportunity.id))
        .group_by(Opportunity.type)
    )
    by_type = {row[0].value: row[1] for row in type_q.all()}

    # Count by source
    source_q = await db.execute(
        select(Opportunity.source, func.count(Opportunity.id))
        .group_by(Opportunity.source)
    )
    by_source = {row[0]: row[1] for row in source_q.all()}

    total = sum(by_source.values())

    return APIResponse.success(data={
        "total": total,
        "by_type": by_type,
        "by_source": by_source,
    })


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_opportunity(
    body: OpportunityCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin can always post. Staff can post only if granted permission by Admin."""
    if current_user.role == UserRole.STUDENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Students cannot post opportunities.")

    # For staff: check explicit permission grant
    if current_user.role == UserRole.STAFF:
        perm_result = await db.execute(
            select(UserPermission).where(
                UserPermission.user_id == current_user.id,
                UserPermission.permission == "post_opportunities",
            )
        )
        if not perm_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You need Admin approval to post opportunities. Contact your Admin.",
            )
    try:
        opp_type = OpportunityType(body.type.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid opportunity type '{body.type}'. Valid: hackathon, event, internship, competition, scholarship, workshop",
        )

    deadline = body.deadline
    if deadline and deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)

    opp = Opportunity(
        type=opp_type,
        title=body.title,
        organization=body.organization,
        description=body.description,
        link=body.link,
        deadline=deadline,
        departments=body.departments or ["All"],
        eligibility=body.eligibility,
        posted_by=current_user.id,
    )
    db.add(opp)
    await db.flush()
    await db.refresh(opp)
    return APIResponse.success(data=_serialize(opp, set(), include_poster=True))


@router.delete("/{opp_id}", status_code=status.HTTP_200_OK)
async def delete_opportunity(
    opp_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.STAFF)),
):
    """Admin or Staff can delete an opportunity."""
    result = await db.execute(select(Opportunity).where(Opportunity.id == opp_id))
    opp = result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    await db.delete(opp)
    await db.flush()
    return APIResponse.success(data={"deleted": True})


@router.get("/{opp_id}/applicants")
async def list_applicants(
    opp_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.STAFF)),
):
    """Admin or Staff can view all students who applied to an opportunity."""
    opp_result = await db.execute(select(Opportunity).where(Opportunity.id == opp_id))
    opp = opp_result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    apps_result = await db.execute(
        select(OpportunityApplication).where(OpportunityApplication.opportunity_id == opp_id)
    )
    apps = list(apps_result.scalars().all())

    return APIResponse.success(data={
        "opportunity": {
            "id": opp.id,
            "title": opp.title,
            "organization": opp.organization,
            "type": opp.type.value,
        },
        "applicants": [_serialize_applicant(a) for a in apps],
        "total": len(apps),
    })


@router.post("/{opp_id}/apply", status_code=status.HTTP_201_CREATED)
async def apply_opportunity(
    opp_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Apply to an opportunity."""
    result = await db.execute(select(Opportunity).where(Opportunity.id == opp_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Opportunity not found")

    existing = await db.execute(
        select(OpportunityApplication).where(
            OpportunityApplication.opportunity_id == opp_id,
            OpportunityApplication.student_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already applied")

    app = OpportunityApplication(
        opportunity_id=opp_id,
        student_id=current_user.id,
        status="applied",
    )
    db.add(app)
    await db.flush()
    return APIResponse.success(data={"applied": True})


@router.delete("/{opp_id}/apply")
async def withdraw_application(
    opp_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Withdraw from an opportunity."""
    result = await db.execute(
        select(OpportunityApplication).where(
            OpportunityApplication.opportunity_id == opp_id,
            OpportunityApplication.student_id == current_user.id,
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="No application found")

    await db.delete(app)
    await db.flush()
    return APIResponse.success(data={"applied": False})
