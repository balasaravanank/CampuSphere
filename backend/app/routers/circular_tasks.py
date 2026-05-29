"""Tasks management for circulars."""

from datetime import timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.circular import Circular, CircularTask, CircularTaskSubmission
from app.models.user import User, UserRole
from app.schemas.common import APIResponse

router = APIRouter(prefix="/circulars", tags=["circular-tasks"])


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    attachment_url: str | None = None


@router.get("/{circular_id}/tasks")
async def get_tasks(
    circular_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all tasks for a circular, including the current user's completion status."""
    result = await db.execute(select(Circular).where(Circular.id == circular_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Circular not found")

    tasks_result = await db.execute(
        select(CircularTask).where(CircularTask.circular_id == circular_id).order_by(CircularTask.created_at.asc())
    )
    tasks = tasks_result.scalars().all()

    # Get user completions
    submissions_result = await db.execute(
        select(CircularTaskSubmission.task_id).where(CircularTaskSubmission.user_id == current_user.id)
    )
    completed_task_ids = set(submissions_result.scalars().all())

    formatted = []
    for task in tasks:
        formatted.append({
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "attachment_url": task.attachment_url,
            "completed": task.id in completed_task_ids
        })

    return APIResponse.success(data=formatted)


@router.post("/{circular_id}/tasks")
async def create_task(
    circular_id: int,
    body: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.STAFF)),
):
    """Create a new task for a circular (admin/staff only)."""
    result = await db.execute(select(Circular).where(Circular.id == circular_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Circular not found")

    task = CircularTask(
        circular_id=circular_id,
        title=body.title,
        description=body.description,
        attachment_url=body.attachment_url,
        created_by=current_user.id
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    return APIResponse.success(data={
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "attachment_url": task.attachment_url,
        "completed": False
    })


@router.post("/tasks/{task_id}/toggle")
async def toggle_task_completion(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle a task as complete/incomplete for the current user."""
    task_result = await db.execute(select(CircularTask).where(CircularTask.id == task_id))
    if not task_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Task not found")

    sub_result = await db.execute(
        select(CircularTaskSubmission).where(
            CircularTaskSubmission.task_id == task_id,
            CircularTaskSubmission.user_id == current_user.id
        )
    )
    submission = sub_result.scalar_one_or_none()

    if submission:
        await db.delete(submission)
        completed = False
    else:
        db.add(CircularTaskSubmission(task_id=task_id, user_id=current_user.id))
        completed = True

    await db.commit()
    return APIResponse.success(data={"completed": completed})


@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.STAFF)),
):
    """Delete a circular task (admin/staff only)."""
    result = await db.execute(select(CircularTask).where(CircularTask.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await db.delete(task)
    await db.commit()
    
    return APIResponse.success(data={"message": "Task deleted"})
