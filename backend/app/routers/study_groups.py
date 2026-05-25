from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.study_group import StudyGroup, StudyGroupMember
from app.schemas.study_group import (
    StudyGroupCreate,
    StudyGroupUpdate,
    StudyGroupResponse,
    StudyGroupMemberResponse,
)

router = APIRouter(prefix="/study-groups", tags=["study-groups"])

@router.get("/", response_model=List[StudyGroupResponse])
def list_study_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tags: str = None,
):
    """List public study groups."""
    query = select(StudyGroup).where(StudyGroup.is_private == False)
    
    groups = db.execute(query).scalars().all()
    if tags:
        tag_list = [t.strip().lower() for t in tags.split(",")]
        filtered = []
        for g in groups:
            if g.subject_tags:
                g_tags = [t.lower() for t in g.subject_tags]
                if any(tag in g_tags for tag in tag_list):
                    filtered.append(g)
        return filtered
        
    return groups

@router.post("/", response_model=StudyGroupResponse)
def create_study_group(
    group: StudyGroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new study group."""
    new_group = StudyGroup(
        name=group.name,
        description=group.description,
        subject_tags=group.subject_tags,
        is_private=group.is_private,
        created_by=current_user.id
    )
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    
    # Add creator as admin member
    member = StudyGroupMember(
        group_id=new_group.id,
        user_id=current_user.id,
        role="admin"
    )
    db.add(member)
    db.commit()
    db.refresh(new_group)
    return new_group

@router.post("/{group_id}/join", response_model=StudyGroupMemberResponse)
def join_study_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Join a study group."""
    group = db.execute(select(StudyGroup).where(StudyGroup.id == group_id)).scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
        
    # Check if already a member
    stmt = select(StudyGroupMember).where(
        StudyGroupMember.group_id == group_id,
        StudyGroupMember.user_id == current_user.id
    )
    if db.execute(stmt).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already a member of this group")
        
    # If private, maybe need an invite system, but for now we just allow if you have the ID or restrict it
    if group.is_private:
        # In a real app, check for invite link/code. For now just let them join if they have the ID.
        pass

    new_member = StudyGroupMember(
        group_id=group_id,
        user_id=current_user.id,
        role="member"
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member

@router.get("/my-groups", response_model=List[StudyGroupResponse])
def my_study_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get study groups I am a member of."""
    stmt = select(StudyGroupMember).where(StudyGroupMember.user_id == current_user.id)
    memberships = db.execute(stmt).scalars().all()
    group_ids = [m.group_id for m in memberships]
    
    if not group_ids:
        return []
        
    groups_stmt = select(StudyGroup).where(StudyGroup.id.in_(group_ids))
    return db.execute(groups_stmt).scalars().all()
