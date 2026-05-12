"""Seed script — creates 3 clean users (admin, staff, student) for development."""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.database import async_session_factory, engine, Base
from app.models.user import User, UserRole
from app.utils.security import hash_password


SEED_USERS = [
    {
        "reg_no": "ADMIN001",
        "name": "Admin User",
        "email": "admin@campusphere.com",
        "password": "Admin@2026!",
        "role": UserRole.ADMIN,
        "department": "Administration",
    },
    {
        "reg_no": "STF001",
        "name": "Prof. Lakshmi Kumar",
        "email": "staff@saveetha.ac.in",
        "password": "Staff@2026!",
        "role": UserRole.STAFF,
        "department": "Computer Science",
    },
    {
        "reg_no": "24900611",
        "name": "Bala Saravanan",
        "email": "student@saveetha.ac.in",
        "password": "Student@2026!",
        "role": UserRole.STUDENT,
        "department": "Computer Science",
        "year": 2,
        "section": "A",
    },
]


async def seed():
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        # Check if already seeded
        result = await session.execute(select(User).where(User.role == UserRole.ADMIN))
        if result.scalar_one_or_none():
            print("[!] Database already seeded. Delete the .db file to re-seed.")
            return

        for u in SEED_USERS:
            pwd = u.pop("password")
            user = User(**u, password_hash=hash_password(pwd))
            session.add(user)

        await session.commit()

        print("[OK] Database seeded -- 3 users, 3 roles")
        print()
        print("  +----------+--------------------------+--------------+")
        print("  | Role     | Email                    | Password     |")
        print("  +----------+--------------------------+--------------+")
        print("  | admin    | admin@campusphere.com     | Admin@2026!  |")
        print("  | staff    | staff@saveetha.ac.in      | Staff@2026!  |")
        print("  | student  | student@saveetha.ac.in    | Student@2026!|")
        print("  +----------+--------------------------+--------------+")


if __name__ == "__main__":
    asyncio.run(seed())
