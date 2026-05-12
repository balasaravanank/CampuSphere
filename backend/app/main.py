"""CampuSphere API — FastAPI application factory."""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import (
    admin_router, auth_router, health_router,
    workflows_router, events_router, circulars_router,
    opportunities_router, assignments_router, attendance_router,
    permissions_router, workshops_router,
)
from app.database import engine, Base
from app.services.scraper import sync_external_opportunities
import app.models  # noqa: F401 — ensures all models are registered with Base

logger = logging.getLogger("campusphere")

settings = get_settings()


async def _scraper_loop(stop_event: asyncio.Event):
    """Background loop: run scraper every 6 hours."""
    await asyncio.sleep(10)  # initial delay — let the server warm up
    while not stop_event.is_set():
        try:
            logger.info("⏳ Running external opportunity sync...")
            result = await sync_external_opportunities()
            logger.info("✅ Scraper sync done: %s", result)
        except Exception:
            logger.exception("❌ Scraper sync crashed")
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=6 * 3600)
        except asyncio.TimeoutError:
            pass  # timeout means 6h elapsed — loop again


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Auto-create any new tables (safe — does not drop existing tables)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    if settings.JWT_SECRET_KEY == "CHANGE_ME_IN_PRODUCTION_64_CHAR_RANDOM_STRING_HERE":
        import warnings
        warnings.warn("⚠️  Using default JWT secret — CHANGE THIS IN PRODUCTION!", stacklevel=2)

    # Start scraper background task
    stop_event = asyncio.Event()
    scraper_task = asyncio.create_task(_scraper_loop(stop_event))
    logger.info("🚀 Scraper scheduler started (6h interval)")

    yield

    # Shutdown: stop scraper
    stop_event.set()
    scraper_task.cancel()
    logger.info("🛑 Scraper scheduler stopped")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(health_router, prefix=settings.API_V1_PREFIX)
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(admin_router, prefix=settings.API_V1_PREFIX)
app.include_router(workflows_router, prefix=settings.API_V1_PREFIX)
app.include_router(events_router, prefix=settings.API_V1_PREFIX)
app.include_router(circulars_router, prefix=settings.API_V1_PREFIX)
app.include_router(opportunities_router, prefix=settings.API_V1_PREFIX)
app.include_router(assignments_router, prefix=settings.API_V1_PREFIX)
app.include_router(attendance_router, prefix=settings.API_V1_PREFIX)
app.include_router(permissions_router, prefix=settings.API_V1_PREFIX)
app.include_router(workshops_router, prefix=settings.API_V1_PREFIX)
