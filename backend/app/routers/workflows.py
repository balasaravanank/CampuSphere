"""Workflow router — request submission, multi-step approval chains, template management."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.workflow import (
    WorkflowApprovalStep,
    WorkflowRequest,
    WorkflowStatus,
    WorkflowTemplate,
    WorkflowType,
    StepStatus,
)
from app.schemas.common import APIResponse

router = APIRouter(prefix="/workflows", tags=["workflows"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class TemplateStepSchema(BaseModel):
    step_order: int
    label: str
    approver_role: str


class TemplateCreateRequest(BaseModel):
    name: str
    workflow_type: WorkflowType
    description: str | None = None
    steps: list[TemplateStepSchema]
    applicable_roles: list[str] = ["student"]


class TemplateUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    steps: list[TemplateStepSchema] | None = None
    applicable_roles: list[str] | None = None
    is_active: bool | None = None


class WorkflowCreateRequest(BaseModel):
    type: WorkflowType
    template_id: int
    title: str
    description: str | None = None
    payload: dict | None = None


class ApprovalActionRequest(BaseModel):
    comment: str | None = None


# ── Serializers ──────────────────────────────────────────────────────────────

def _serialize_template(t: WorkflowTemplate) -> dict:
    return {
        "id": t.id,
        "name": t.name,
        "workflow_type": t.workflow_type.value,
        "description": t.description,
        "steps": t.steps or [],
        "applicable_roles": t.applicable_roles or [],
        "is_active": t.is_active,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }


def _serialize_step(s: WorkflowApprovalStep) -> dict:
    return {
        "id": s.id,
        "step_order": s.step_order,
        "label": s.label,
        "approver_role": s.approver_role,
        "approver_id": s.approver_id,
        "approver_name": s.approver.name if s.approver else None,
        "status": s.status.value,
        "comment": s.comment,
        "acted_at": s.acted_at.isoformat() if s.acted_at else None,
    }


def _serialize_request(req: WorkflowRequest) -> dict:
    return {
        "id": req.id,
        "type": req.type.value,
        "template_id": req.template_id,
        "template_name": req.template.name if req.template else None,
        "student_id": req.student_id,
        "student_name": req.student.name if req.student else None,
        "status": req.status.value,
        "current_step": req.current_step,
        "title": req.title,
        "description": req.description,
        "payload": req.payload,
        "attachment_urls": req.attachment_urls,
        "created_at": req.created_at.strftime("%Y-%m-%d"),
        "resolved_at": req.resolved_at.isoformat() if req.resolved_at else None,
        "approval_steps": [_serialize_step(s) for s in (req.approval_steps or [])],
    }


# ── Template CRUD (admin) ───────────────────────────────────────────────────

@router.get("/templates")
async def list_templates(
    workflow_type: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List approval workflow templates."""
    query = select(WorkflowTemplate).where(WorkflowTemplate.is_active == True)
    if workflow_type:
        query = query.where(WorkflowTemplate.workflow_type == workflow_type)
    result = await db.execute(query.order_by(WorkflowTemplate.name))
    templates = list(result.scalars().all())

    # Non-admin: filter by applicable_roles client-side (SQLite JSON limitation)
    if current_user.role != UserRole.ADMIN:
        role_val = current_user.role.value
        templates = [t for t in templates if role_val in (t.applicable_roles or [])]

    return APIResponse.success(data=[_serialize_template(t) for t in templates])


@router.post("/templates", status_code=status.HTTP_201_CREATED)
async def create_template(
    body: TemplateCreateRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Admin creates a new approval chain template."""
    template = WorkflowTemplate(
        name=body.name,
        workflow_type=body.workflow_type,
        description=body.description,
        steps=[s.model_dump() for s in body.steps],
        applicable_roles=body.applicable_roles,
    )
    db.add(template)
    await db.flush()
    await db.refresh(template)
    return APIResponse.success(data=_serialize_template(template))


@router.patch("/templates/{template_id}")
async def update_template(
    template_id: int,
    body: TemplateUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Admin updates an existing template."""
    result = await db.execute(
        select(WorkflowTemplate).where(WorkflowTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    update = body.model_dump(exclude_unset=True)
    if "steps" in update and update["steps"]:
        update["steps"] = [s if isinstance(s, dict) else s.model_dump() for s in update["steps"]]
    for field, value in update.items():
        setattr(template, field, value)

    await db.flush()
    await db.refresh(template)
    return APIResponse.success(data=_serialize_template(template))


@router.delete("/templates/{template_id}")
async def delete_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Soft-delete: deactivate a template."""
    result = await db.execute(
        select(WorkflowTemplate).where(WorkflowTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    template.is_active = False
    await db.flush()
    return APIResponse.success(data={"message": f"Template '{template.name}' deactivated"})


# ── Request endpoints ────────────────────────────────────────────────────────

@router.get("/")
async def list_workflows(
    status_filter: str | None = Query(None, alias="status"),
    type_filter: str | None = Query(None, alias="type"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List workflow requests. Students/staff see own, admin sees all."""
    query = (
        select(WorkflowRequest)
        .options(
            joinedload(WorkflowRequest.approval_steps)
            .joinedload(WorkflowApprovalStep.approver),
            joinedload(WorkflowRequest.template),
            joinedload(WorkflowRequest.student),
        )
        .order_by(WorkflowRequest.created_at.desc())
    )

    if current_user.role != UserRole.ADMIN:
        query = query.where(WorkflowRequest.student_id == current_user.id)

    if status_filter and status_filter != "all":
        query = query.where(WorkflowRequest.status == status_filter)
    if type_filter and type_filter != "all":
        query = query.where(WorkflowRequest.type == type_filter)

    result = await db.execute(query)
    requests = list(result.unique().scalars().all())
    return APIResponse.success(data=[_serialize_request(r) for r in requests])


@router.get("/pending")
async def list_pending_approvals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List requests pending current user's approval (staff/admin)."""
    if current_user.role == UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Students cannot approve requests")

    role_val = current_user.role.value

    # Find requests where current_step's approver_role matches user's role
    query = (
        select(WorkflowRequest)
        .options(
            joinedload(WorkflowRequest.approval_steps)
            .joinedload(WorkflowApprovalStep.approver),
            joinedload(WorkflowRequest.template),
            joinedload(WorkflowRequest.student),
        )
        .where(
            WorkflowRequest.status.in_([
                WorkflowStatus.SUBMITTED,
                WorkflowStatus.UNDER_REVIEW,
            ])
        )
        .order_by(WorkflowRequest.created_at.desc())
    )
    result = await db.execute(query)
    all_requests = list(result.unique().scalars().all())

    # Filter: only requests where current step matches user's role
    pending = []
    for req in all_requests:
        if not req.approval_steps:
            continue
        current = next(
            (s for s in req.approval_steps if s.step_order == req.current_step),
            None,
        )
        if current and current.status == StepStatus.PENDING and current.approver_role == role_val:
            pending.append(req)

    return APIResponse.success(data=[_serialize_request(r) for r in pending])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_workflow(
    body: WorkflowCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a new workflow request with an approval template."""
    if current_user.role not in (UserRole.STUDENT, UserRole.STAFF):
        raise HTTPException(status_code=403, detail="Only students/staff can submit requests")

    # Validate template
    tpl_result = await db.execute(
        select(WorkflowTemplate).where(
            WorkflowTemplate.id == body.template_id,
            WorkflowTemplate.is_active == True,
        )
    )
    template = tpl_result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Approval template not found")
    if template.workflow_type != body.type:
        raise HTTPException(status_code=400, detail="Template type mismatch")

    req = WorkflowRequest(
        type=body.type,
        template_id=body.template_id,
        title=body.title,
        description=body.description,
        payload=body.payload,
        student_id=current_user.id,
        status=WorkflowStatus.SUBMITTED,
        current_step=1,
    )
    db.add(req)
    await db.flush()

    # Create approval steps from template
    for step_def in (template.steps or []):
        step = WorkflowApprovalStep(
            request_id=req.id,
            step_order=step_def["step_order"],
            label=step_def["label"],
            approver_role=step_def["approver_role"],
            status=StepStatus.PENDING,
        )
        db.add(step)

    await db.flush()
    await db.refresh(req)
    return APIResponse.success(data=_serialize_request(req))


@router.get("/{request_id}")
async def get_workflow(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single workflow request with full approval chain."""
    result = await db.execute(
        select(WorkflowRequest)
        .options(
            joinedload(WorkflowRequest.approval_steps)
            .joinedload(WorkflowApprovalStep.approver),
            joinedload(WorkflowRequest.template),
            joinedload(WorkflowRequest.student),
        )
        .where(WorkflowRequest.id == request_id)
    )
    req = result.unique().scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    # Students can only see their own
    if current_user.role == UserRole.STUDENT and req.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return APIResponse.success(data=_serialize_request(req))


@router.patch("/{request_id}/cancel")
async def cancel_workflow(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel a submitted/draft request (only owner)."""
    result = await db.execute(
        select(WorkflowRequest).where(
            WorkflowRequest.id == request_id,
            WorkflowRequest.student_id == current_user.id,
        )
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status not in (WorkflowStatus.DRAFT, WorkflowStatus.SUBMITTED):
        raise HTTPException(status_code=400, detail="Cannot cancel a processed request")

    req.status = WorkflowStatus.CANCELLED
    await db.flush()
    return APIResponse.success(data={"message": "Request cancelled"})


@router.post("/{request_id}/approve")
async def approve_step(
    request_id: int,
    body: ApprovalActionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve the current step. Moves to next step or marks as fully approved."""
    if current_user.role == UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Students cannot approve")

    result = await db.execute(
        select(WorkflowRequest)
        .options(joinedload(WorkflowRequest.approval_steps))
        .where(WorkflowRequest.id == request_id)
    )
    req = result.unique().scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status not in (WorkflowStatus.SUBMITTED, WorkflowStatus.UNDER_REVIEW):
        raise HTTPException(status_code=400, detail="Request is not pending approval")

    # Find current step
    current = next(
        (s for s in req.approval_steps if s.step_order == req.current_step), None
    )
    if not current or current.status != StepStatus.PENDING:
        raise HTTPException(status_code=400, detail="No pending step found")
    if current.approver_role != current_user.role.value:
        raise HTTPException(status_code=403, detail="You cannot approve this step")

    # Approve current step
    current.status = StepStatus.APPROVED
    current.approver_id = current_user.id
    current.comment = body.comment
    current.acted_at = datetime.now(timezone.utc)

    # Check if there are more steps
    max_step = max(s.step_order for s in req.approval_steps)
    if req.current_step < max_step:
        req.current_step += 1
        req.status = WorkflowStatus.UNDER_REVIEW
    else:
        req.status = WorkflowStatus.APPROVED
        req.resolved_at = datetime.now(timezone.utc)

    await db.flush()
    await db.refresh(req)
    return APIResponse.success(data=_serialize_request(req))


@router.post("/{request_id}/reject")
async def reject_step(
    request_id: int,
    body: ApprovalActionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reject the current step. Marks the whole request as rejected."""
    if current_user.role == UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Students cannot reject")

    result = await db.execute(
        select(WorkflowRequest)
        .options(joinedload(WorkflowRequest.approval_steps))
        .where(WorkflowRequest.id == request_id)
    )
    req = result.unique().scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status not in (WorkflowStatus.SUBMITTED, WorkflowStatus.UNDER_REVIEW):
        raise HTTPException(status_code=400, detail="Request is not pending approval")

    current = next(
        (s for s in req.approval_steps if s.step_order == req.current_step), None
    )
    if not current or current.status != StepStatus.PENDING:
        raise HTTPException(status_code=400, detail="No pending step found")
    if current.approver_role != current_user.role.value:
        raise HTTPException(status_code=403, detail="You cannot reject this step")

    current.status = StepStatus.REJECTED
    current.approver_id = current_user.id
    current.comment = body.comment
    current.acted_at = datetime.now(timezone.utc)
    req.status = WorkflowStatus.REJECTED
    req.resolved_at = datetime.now(timezone.utc)

    await db.flush()
    await db.refresh(req)
    return APIResponse.success(data=_serialize_request(req))
