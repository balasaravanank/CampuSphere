from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.user import User
from app.models.mentor import MentorProfile, MentorAssignment, MentorMeeting
from app.schemas.mentor import (
    MentorProfileCreate,
    MentorProfileUpdate,
    MentorProfileResponse,
    MentorAssignmentCreate,
    MentorAssignmentResponse,
)

router = APIRouter(prefix="/mentors", tags=["mentors"])

@router.get("/profiles", response_model=List[MentorProfileResponse])
def list_mentors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skills: str = None,
):
    """Get all mentors available in the marketplace."""
    query = select(MentorProfile).where(MentorProfile.is_accepting_mentees == True)
    
    # Simple skill filtering
    profiles = db.execute(query).scalars().all()
    if skills:
        skill_list = [s.strip().lower() for s in skills.split(",")]
        filtered_profiles = []
        for p in profiles:
            if p.skills:
                p_skills = [s.lower() for s in p.skills]
                if any(skill in p_skills for skill in skill_list):
                    filtered_profiles.append(p)
        return filtered_profiles
        
    return profiles

@router.post("/profiles", response_model=MentorProfileResponse)
def create_mentor_profile(
    profile: MentorProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["staff", "admin", "student"])),
):
    """Opt-in to become a mentor."""
    stmt = select(MentorProfile).where(MentorProfile.user_id == current_user.id)
    existing = db.execute(stmt).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
        
    new_profile = MentorProfile(
        user_id=current_user.id,
        bio=profile.bio,
        skills=profile.skills,
        is_accepting_mentees=profile.is_accepting_mentees,
        max_mentees=profile.max_mentees,
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile

@router.get("/my-profile", response_model=MentorProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(MentorProfile).where(MentorProfile.user_id == current_user.id)
    profile = db.execute(stmt).scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.post("/assign", response_model=MentorAssignmentResponse)
def assign_mentor(
    assignment: MentorAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Assign a student to a mentor (can be requested by student)."""
    # For now, allow students to pick mentors if they are under max_mentees
    stmt = select(MentorProfile).where(MentorProfile.user_id == assignment.mentor_id)
    profile = db.execute(stmt).scalar_one_or_none()
    if not profile or not profile.is_accepting_mentees:
        raise HTTPException(status_code=400, detail="Mentor is not accepting mentees")
        
    # Check current mentees count
    count_stmt = select(func.count(MentorAssignment.id)).where(MentorAssignment.mentor_id == assignment.mentor_id)
    current_count = db.execute(count_stmt).scalar()
    if current_count >= profile.max_mentees:
        raise HTTPException(status_code=400, detail="Mentor has reached maximum mentees limit")
        
    # Check if already assigned
    check_stmt = select(MentorAssignment).where(
        MentorAssignment.mentor_id == assignment.mentor_id,
        MentorAssignment.student_id == assignment.student_id
    )
    if db.execute(check_stmt).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already assigned to this mentor")

    new_assignment = MentorAssignment(
        mentor_id=assignment.mentor_id,
        student_id=assignment.student_id
    )
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    return new_assignment

@router.get("/my-mentors", response_model=List[MentorAssignmentResponse])
def my_mentors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List mentors assigned to current student"""
    stmt = select(MentorAssignment).where(MentorAssignment.student_id == current_user.id)
    return db.execute(stmt).scalars().all()

@router.get("/my-mentees", response_model=List[MentorAssignmentResponse])
def my_mentees(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List mentees assigned to current mentor"""
    stmt = select(MentorAssignment).where(MentorAssignment.mentor_id == current_user.id)
    return db.execute(stmt).scalars().all()
