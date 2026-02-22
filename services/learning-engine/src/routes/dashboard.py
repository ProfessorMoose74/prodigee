"""
Child learning dashboard routes — dashboard, activity details, activity completion.
All endpoints require child JWT.
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from google.cloud import firestore_v1

from src.curriculum import (
    SKILL_PROGRESSION,
    get_nursery_rhyme,
    get_skill_activities,
    get_skills_for_week,
)
from src.dependencies import get_current_child, get_db
from src.progress import (
    calculate_progress_update,
    determine_mastery_level,
    generate_rule_based_recommendation,
    should_advance_week,
)
from src.schemas import (
    ActivityCompleteRequest,
    ActivityCompleteResponse,
    ActivityDetailResponse,
    DashboardResponse,
)

router = APIRouter(prefix="/child", tags=["child"])


async def _fetch_child_progress(
    child_id: str, db: firestore_v1.AsyncClient,
) -> dict[str, float]:
    """Fetch all phonemic progress for a child, returns {skill: accuracy}."""
    query = db.collection("phonemic_progress").where("child_id", "==", child_id)
    docs = [doc async for doc in query.stream()]
    return {
        doc.to_dict()["skill"]: doc.to_dict().get("accuracy", 0.0)
        for doc in docs
    }


@router.get("/dashboard", response_model=DashboardResponse)
async def child_dashboard(
    child: dict = Depends(get_current_child),
    db: firestore_v1.AsyncClient = Depends(get_db),
):
    """Main learning interface — activities, progress, and recommendation."""
    child_id = child["id"]

    # Fetch child document
    child_doc = await db.collection("children").document(child_id).get()
    if not child_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    child_data = child_doc.to_dict()
    current_week = child_data.get("current_week", 1)

    # Fetch progress
    progress_data = await _fetch_child_progress(child_id, db)

    # Build week activities
    active_skills = get_skills_for_week(current_week)
    week_activities = {}
    for skill in active_skills:
        week_activities[skill] = get_skill_activities(skill, current_week)

    nursery_rhyme = get_nursery_rhyme(current_week)

    # Build progress summary with mastery levels
    progress_summary = {}
    for skill in SKILL_PROGRESSION:
        acc = progress_data.get(skill, 0.0)
        progress_summary[skill] = {
            "accuracy": acc,
            "mastery_level": determine_mastery_level(acc),
        }

    # Rule-based recommendation (AI is on its own endpoint)
    recommendation = generate_rule_based_recommendation(
        progress_data, current_week,
    )

    return DashboardResponse(
        child={
            "id": child_id,
            "display_name": child_data.get("display_name", ""),
            "age": child_data.get("age", 5),
            "current_week": current_week,
            "total_stars": child_data.get("total_stars", 0),
            "streak_days": child_data.get("streak_days", 0),
            "avatar": child_data.get("avatar", "default"),
        },
        week_activities=week_activities,
        nursery_rhyme=nursery_rhyme,
        progress=progress_summary,
        recommendation=recommendation,
        active_skills=active_skills,
    )


@router.get("/activity/{activity_type}", response_model=ActivityDetailResponse)
async def get_activity(
    activity_type: str,
    child: dict = Depends(get_current_child),
    db: firestore_v1.AsyncClient = Depends(get_db),
):
    """Get activity details for a specific skill."""
    if activity_type not in SKILL_PROGRESSION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown activity type: {activity_type}. "
                   f"Valid types: {list(SKILL_PROGRESSION.keys())}",
        )

    child_id = child["id"]

    # Get child's current week
    child_doc = await db.collection("children").document(child_id).get()
    current_week = child_doc.to_dict().get("current_week", 1) if child_doc.exists else 1

    # Get skill activities
    activities = get_skill_activities(activity_type, current_week)

    # Get child's progress for this skill
    progress_data = await _fetch_child_progress(child_id, db)
    child_progress = progress_data.get(activity_type, 0.0)

    return ActivityDetailResponse(
        skill_name=activity_type,
        skill_info=SKILL_PROGRESSION[activity_type],
        week_number=current_week,
        activities=activities,
        child_progress=child_progress,
        mastery_level=determine_mastery_level(child_progress),
    )


@router.post("/activity/{activity_type}/complete", response_model=ActivityCompleteResponse)
async def complete_activity(
    activity_type: str,
    req: ActivityCompleteRequest,
    child: dict = Depends(get_current_child),
    db: firestore_v1.AsyncClient = Depends(get_db),
):
    """Record activity completion, update progress, and award stars."""
    if activity_type not in SKILL_PROGRESSION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown activity type: {activity_type}",
        )

    child_id = child["id"]
    now = datetime.now(timezone.utc)

    # Fetch current state
    child_doc = await db.collection("children").document(child_id).get()
    if not child_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    child_data = child_doc.to_dict()
    current_week = child_data.get("current_week", 1)

    # Fetch current progress for this skill
    progress_ref = db.collection("phonemic_progress").document(f"{child_id}_{activity_type}")
    progress_doc = await progress_ref.get()

    if progress_doc.exists:
        current_accuracy = progress_doc.to_dict().get("accuracy", 0.0)
        current_attempts = progress_doc.to_dict().get("attempts", 0)
        current_correct = progress_doc.to_dict().get("correct", 0)
    else:
        current_accuracy = 0.0
        current_attempts = 0
        current_correct = 0

    # Calculate progress gain
    progress_gained = calculate_progress_update(req.accuracy, req.duration, current_accuracy)
    new_accuracy = min(100.0, round(current_accuracy + progress_gained, 2))
    new_mastery = determine_mastery_level(new_accuracy)

    # Check week advancement
    all_progress = await _fetch_child_progress(child_id, db)
    all_progress[activity_type] = new_accuracy
    week_advanced = should_advance_week(current_week, all_progress)
    new_week = current_week + 1 if week_advanced else current_week

    # Atomic batch write
    batch = db.batch()

    # Update phonemic progress
    batch.set(progress_ref, {
        "child_id": child_id,
        "skill": activity_type,
        "mastery_level": new_mastery,
        "accuracy": new_accuracy,
        "attempts": current_attempts + 1,
        "correct": current_correct + (1 if req.accuracy >= 70 else 0),
        "current_week": new_week,
        "last_practiced": now,
    })

    # Create learning session record
    session_id = str(uuid.uuid4())
    batch.set(db.collection("learning_sessions").document(session_id), {
        "id": session_id,
        "child_id": child_id,
        "session_type": "phonemic",
        "activity_type": activity_type,
        "planned_duration_minutes": 8,
        "actual_duration_minutes": round(req.duration / 60, 1),
        "accuracy": req.accuracy,
        "stars_earned": req.stars_earned,
        "engagement_score": req.engagement,
        "completed": True,
        "started_at": now,
        "completed_at": now,
    })

    # Update child stats
    child_updates = {
        "total_stars": child_data.get("total_stars", 0) + req.stars_earned,
    }
    if week_advanced:
        child_updates["current_week"] = new_week
    batch.update(db.collection("children").document(child_id), child_updates)

    await batch.commit()

    return ActivityCompleteResponse(
        message="Great job!" if req.accuracy >= 70 else "Keep practicing!",
        progress_gained=progress_gained,
        new_progress=new_accuracy,
        mastery_level=new_mastery,
        stars_earned=req.stars_earned,
        current_week=new_week,
        week_advanced=week_advanced,
    )
