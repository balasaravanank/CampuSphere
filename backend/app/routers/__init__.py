# Routers package
from app.routers.health import router as health_router
from app.routers.auth import router as auth_router
from app.routers.admin import router as admin_router
from app.routers.workflows import router as workflows_router
from app.routers.events import router as events_router
from app.routers.circulars import router as circulars_router
from app.routers.opportunities import router as opportunities_router
from app.routers.assignments import router as assignments_router
from app.routers.attendance import router as attendance_router
from app.routers.permissions import router as permissions_router
from app.routers.workshops import router as workshops_router

__all__ = [
    "health_router", "auth_router", "admin_router",
    "workflows_router", "events_router", "circulars_router",
    "opportunities_router", "assignments_router", "attendance_router",
    "permissions_router", "workshops_router",
]
