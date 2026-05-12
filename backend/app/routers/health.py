"""Health check endpoint — used by CI/CD and monitoring."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "campusphere-api",
        "version": "1.0.0",
    }
