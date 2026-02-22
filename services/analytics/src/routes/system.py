"""
System routes — classroom reports (placeholder) and platform metrics.
"""

import time

from fastapi import APIRouter, Depends, HTTPException, status
from google.cloud import firestore_v1

from src.config import settings
from src.dependencies import get_current_parent, get_db
from src.schemas import SystemMetricsResponse

router = APIRouter(tags=["system"])

_start_time = time.time()


@router.get("/classroom/{classroom_id}/report")
async def classroom_report(
    classroom_id: str,
    parent: dict = Depends(get_current_parent),
):
    """Classroom-level reporting — placeholder for future teacher/admin features."""
    return {
        "classroom_id": classroom_id,
        "status": "coming_soon",
        "message": "Classroom reporting will be available in a future release.",
    }


@router.get("/system/metrics", response_model=SystemMetricsResponse)
async def system_metrics(
    db: firestore_v1.AsyncClient = Depends(get_db),
):
    """Platform health and basic collection stats."""
    # Count documents in key collections
    collections = {}
    for name in ["children", "parents", "phonemic_progress", "learning_sessions", "voice_interactions"]:
        try:
            docs = db.collection(name).limit(1000)
            count = len([d async for d in docs.stream()])
            collections[name] = count
        except Exception:
            collections[name] = -1

    uptime_seconds = int(time.time() - _start_time)
    hours, remainder = divmod(uptime_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    return SystemMetricsResponse(
        service="analytics",
        status="healthy",
        environment=settings.environment,
        uptime_info=f"{hours}h {minutes}m {seconds}s",
        collections=collections,
    )
