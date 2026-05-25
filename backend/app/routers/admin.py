"""Admin router — user management, dashboard stats, content editing."""

from datetime import time as time_type

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.dependencies.auth import require_role
from app.models.user import User, UserRole
from app.models.attendance import AttendanceRecord
from app.models.circular import Circular
from app.models.workflow import WorkflowRequest, WorkflowStatus
from app.models.event import Event
from app.models.opportunity import Opportunity
from app.models.academic import Subject, Slot, Enrollment
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


# ── Subject CRUD ───────────────────────────────────────────────

class SubjectCreateRequest(BaseModel):
    code: str
    name: str
    credits: int
    department: str
    semester: int
    term: str | None = None


class SubjectUpdateRequest(BaseModel):
    name: str | None = None
    credits: int | None = None
    department: str | None = None
    semester: int | None = None
    term: str | None = None


@router.get("/subjects")
async def list_subjects(
    department: str | None = None,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    query = select(Subject).order_by(Subject.code)
    if department:
        query = query.where(Subject.department == department)
    result = await db.execute(query)
    subjects = result.scalars().all()
    return APIResponse.success(data=[
        {
            "id": s.id, "code": s.code, "name": s.name,
            "credits": s.credits, "department": s.department,
            "semester": s.semester, "term": s.term,
        }
        for s in subjects
    ])


@router.post("/subjects", status_code=201)
async def create_subject(
    body: SubjectCreateRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    existing = await db.execute(select(Subject).where(Subject.code == body.code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Subject code already exists")

    subj = Subject(**body.model_dump())
    db.add(subj)
    await db.flush()
    await db.refresh(subj)
    return APIResponse.success(data={
        "id": subj.id, "code": subj.code, "name": subj.name,
        "credits": subj.credits, "department": subj.department,
        "semester": subj.semester, "term": subj.term,
    })


@router.patch("/subjects/{subject_id}")
async def update_subject(
    subject_id: int,
    body: SubjectUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(select(Subject).where(Subject.id == subject_id))
    subj = result.scalar_one_or_none()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(subj, k, v)
    await db.flush()
    await db.refresh(subj)
    return APIResponse.success(data={
        "id": subj.id, "code": subj.code, "name": subj.name,
        "credits": subj.credits, "department": subj.department,
        "semester": subj.semester, "term": subj.term,
    })


# ── Slot CRUD ──────────────────────────────────────────────────

class SlotCreateRequest(BaseModel):
    subject_id: int
    faculty_id: int
    day_of_week: int  # 0=Mon..6=Sun
    time_start: str   # "HH:MM"
    time_end: str     # "HH:MM"
    room: str
    slot_number: str | None = None


class SlotUpdateRequest(BaseModel):
    faculty_id: int | None = None
    day_of_week: int | None = None
    time_start: str | None = None
    time_end: str | None = None
    room: str | None = None
    slot_number: str | None = None


@router.get("/slots")
async def list_slots(
    subject_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    query = select(Slot).options(joinedload(Slot.subject), joinedload(Slot.faculty))
    if subject_id:
        query = query.where(Slot.subject_id == subject_id)
    result = await db.execute(query)
    slots = result.unique().scalars().all()
    return APIResponse.success(data=[
        {
            "id": s.id, "subject_id": s.subject_id,
            "subject_code": s.subject.code, "subject_name": s.subject.name,
            "faculty_id": s.faculty_id, "faculty_name": s.faculty.name,
            "day_of_week": s.day_of_week,
            "time_start": s.time_start.strftime("%H:%M"),
            "time_end": s.time_end.strftime("%H:%M"),
            "room": s.room, "slot_number": s.slot_number,
        }
        for s in slots
    ])


@router.post("/slots", status_code=201)
async def create_slot(
    body: SlotCreateRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    # Verify subject exists
    subj = await db.scalar(select(Subject).where(Subject.id == body.subject_id))
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    # Verify faculty exists
    faculty = await db.scalar(select(User).where(User.id == body.faculty_id))
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty user not found")

    ts = time_type(*map(int, body.time_start.split(":")))
    te = time_type(*map(int, body.time_end.split(":")))

    slot = Slot(
        subject_id=body.subject_id,
        faculty_id=body.faculty_id,
        day_of_week=body.day_of_week,
        time_start=ts,
        time_end=te,
        room=body.room,
        slot_number=body.slot_number,
    )
    db.add(slot)
    await db.flush()
    await db.refresh(slot)
    return APIResponse.success(data={"id": slot.id, "room": slot.room, "slot_number": slot.slot_number})


@router.patch("/slots/{slot_id}")
async def update_slot(
    slot_id: int,
    body: SlotUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(select(Slot).where(Slot.id == slot_id))
    slot = result.scalar_one_or_none()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    update = body.model_dump(exclude_unset=True)
    if "time_start" in update:
        update["time_start"] = time_type(*map(int, update["time_start"].split(":")))
    if "time_end" in update:
        update["time_end"] = time_type(*map(int, update["time_end"].split(":")))

    for k, v in update.items():
        setattr(slot, k, v)
    await db.flush()
    return APIResponse.success(data={"id": slot.id, "message": "Slot updated"})


# ── Enrollment CRUD ────────────────────────────────────────────

class EnrollmentCreateRequest(BaseModel):
    student_id: int
    subject_id: int


class BulkEnrollRequest(BaseModel):
    student_ids: list[int]
    subject_id: int


@router.get("/enrollments")
async def list_enrollments(
    subject_id: int | None = None,
    student_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    query = select(Enrollment).options(
        joinedload(Enrollment.student), joinedload(Enrollment.subject)
    )
    if subject_id:
        query = query.where(Enrollment.subject_id == subject_id)
    if student_id:
        query = query.where(Enrollment.student_id == student_id)
    result = await db.execute(query)
    enrollments = result.unique().scalars().all()
    return APIResponse.success(data=[
        {
            "id": e.id, "student_id": e.student_id,
            "student_name": e.student.name, "student_reg_no": e.student.reg_no,
            "subject_id": e.subject_id, "subject_code": e.subject.code,
            "subject_name": e.subject.name,
        }
        for e in enrollments
    ])


@router.post("/enrollments", status_code=201)
async def create_enrollment(
    body: EnrollmentCreateRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    # Check duplicates
    existing = await db.execute(
        select(Enrollment).where(
            Enrollment.student_id == body.student_id,
            Enrollment.subject_id == body.subject_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Student already enrolled in this subject")

    enr = Enrollment(student_id=body.student_id, subject_id=body.subject_id)
    db.add(enr)
    await db.flush()
    return APIResponse.success(data={"id": enr.id, "message": "Enrolled successfully"})


@router.post("/enrollments/bulk", status_code=201)
async def bulk_enroll(
    body: BulkEnrollRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    created = 0
    skipped = 0
    for sid in body.student_ids:
        existing = await db.execute(
            select(Enrollment).where(
                Enrollment.student_id == sid,
                Enrollment.subject_id == body.subject_id,
            )
        )
        if existing.scalar_one_or_none():
            skipped += 1
            continue
        db.add(Enrollment(student_id=sid, subject_id=body.subject_id))
        created += 1
    await db.flush()
    return APIResponse.success(data={"created": created, "skipped": skipped})


@router.delete("/enrollments/{enrollment_id}")
async def delete_enrollment(
    enrollment_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
    enr = result.scalar_one_or_none()
    if not enr:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    await db.delete(enr)
    await db.flush()
    return APIResponse.success(data={"message": "Enrollment removed"})
