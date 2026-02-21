"""
Per-child analytics routes — progress, phonemic breakdown, sessions, assessments.
Accepts either child JWT (own data) or parent JWT (must own child).
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from google.cloud import firestore_v1

from src.aggregation import (
    compute_overall_progress,
    compute_session_stats,
    compute_voice_stats,
    compute_weekly_summary,
)
from src.dependencies import get_current_user, get_db, verify_child_access
from src.schemas import (
    AssessmentsResponse,
    ChildProgressResponse,
    PhonemicProgressResponse,
    SessionRecord,
    SessionsResponse,
)

router = APIRouter(prefix="/child", tags=["child"])


async def _get_progress_docs(child_id: str, db: firestore_v1.AsyncClient) -> list[dict]:
    query = db.collection("phonemic_progress").where("child_id", "==", child_id)
    return [doc.to_dict() async for doc in query.stream()]


async def _get_session_docs(child_id: str, db: firestore_v1.AsyncClient) -> list[dict]:
    query = db.collection("learning_sessions").where("child_id", "==", child_id)
    return [doc.to_dict() async for doc in query.stream()]


async def _get_voice_docs(child_id: str, db: firestore_v1.AsyncClient) -> list[dict]:
    query = db.collection("voice_interactions").where("child_id", "==", child_id)
    return [doc.to_dict() async for doc in query.stream()]


@router.get("/{child_id}/progress", response_model=ChildProgressResponse)
async def get_child_progress(
    child_id: str,
    user: dict = Depends(get_current_user),
    db: firestore_v1.AsyncClient = Depends(get_db),
):
    """Comprehensive progress report for a child."""
    await verify_child_access(child_id, user, db)

    # Fetch child profile
    child_doc = await db.collection("children").document(child_id).get()
    if not child_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    child_data = child_doc.to_dict()

    # Fetch all data sources
    progress_docs = await _get_progress_docs(child_id, db)
    session_docs = await _get_session_docs(child_id, db)
    voice_docs = await _get_voice_docs(child_id, db)

    # Aggregate
    progress = compute_overall_progress(progress_docs)
    sessions = compute_session_stats(session_docs)
    voice = compute_voice_stats(voice_docs)

    return ChildProgressResponse(
        child_id=child_id,
        display_name=child_data.get("display_name", ""),
        age=child_data.get("age", 5),
        current_week=child_data.get("current_week", 1),
        total_stars=child_data.get("total_stars", 0),
        streak_days=child_data.get("streak_days", 0),
        overall_accuracy=progress["overall_accuracy"],
        mastery_distribution=progress["mastery_distribution"],
        strongest_skill=progress["strongest_skill"],
        weakest_skill=progress["weakest_skill"],
        skills=progress["skills"],
        sessions=sessions,
        voice=voice,
    )


@router.get("/{child_id}/phonemic-progress", response_model=PhonemicProgressResponse)
async def get_phonemic_progress(
    child_id: str,
    user: dict = Depends(get_current_user),
    db: firestore_v1.AsyncClient = Depends(get_db),
):
    """Phonemic awareness skill breakdown — 8 skills with mastery levels."""
    await verify_child_access(child_id, user, db)

    progress_docs = await _get_progress_docs(child_id, db)
    progress = compute_overall_progress(progress_docs)

    return PhonemicProgressResponse(
        child_id=child_id,
        skills=progress["skills"],
        overall_accuracy=progress["overall_accuracy"],
        mastery_distribution=progress["mastery_distribution"],
    )


@router.get("/{child_id}/sessions", response_model=SessionsResponse)
async def get_learning_sessions(
    child_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    activity_type: str | None = Query(default=None),
    user: dict = Depends(get_current_user),
    db: firestore_v1.AsyncClient = Depends(get_db),
):
    """Learning session history — paginated, filterable by activity type."""
    await verify_child_access(child_id, user, db)

    session_docs = await _get_session_docs(child_id, db)

    # Filter by activity type if specified
    if activity_type:
        session_docs = [s for s in session_docs if s.get("activity_type") == activity_type]

    # Sort by completed_at descending
    session_docs.sort(key=lambda s: s.get("completed_at") or "", reverse=True)

    total = len(session_docs)
    page = session_docs[offset:offset + limit]

    sessions = [
        SessionRecord(
            id=s.get("id", ""),
            session_type=s.get("session_type", ""),
            activity_type=s.get("activity_type", ""),
            accuracy=s.get("accuracy", 0.0),
            stars_earned=s.get("stars_earned", 0),
            engagement_score=s.get("engagement_score", 0.0),
            duration_minutes=s.get("actual_duration_minutes", 0.0),
            completed=s.get("completed", False),
            completed_at=s.get("completed_at"),
        )
        for s in page
    ]

    return SessionsResponse(
        child_id=child_id,
        total=total,
        limit=limit,
        offset=offset,
        sessions=sessions,
    )


@router.get("/{child_id}/assessments", response_model=AssessmentsResponse)
async def get_assessments(
    child_id: str,
    user: dict = Depends(get_current_user),
    db: firestore_v1.AsyncClient = Depends(get_db),
):
    """Assessment-style reports derived from session and progress data.
    Groups sessions by week with per-skill scores."""
    await verify_child_access(child_id, user, db)

    session_docs = await _get_session_docs(child_id, db)
    weekly_summaries = compute_weekly_summary(session_docs)

    return AssessmentsResponse(
        child_id=child_id,
        weekly_summaries=weekly_summaries,
    )
