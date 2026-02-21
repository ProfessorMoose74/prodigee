"""
Parent dashboard route — aggregated analytics for all children.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from google.cloud import firestore_v1

from src.aggregation import compute_overall_progress
from src.dependencies import get_current_parent, get_db
from src.schemas import ChildSummary, ParentDashboardResponse

router = APIRouter(prefix="/parent", tags=["parent"])


@router.get("/{parent_id}/dashboard", response_model=ParentDashboardResponse)
async def parent_dashboard(
    parent_id: str,
    parent: dict = Depends(get_current_parent),
    db: firestore_v1.AsyncClient = Depends(get_db),
):
    """Parent analytics dashboard — all children's progress at a glance."""
    # Verify the parent is accessing their own dashboard
    if parent["id"] != parent_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access another parent's dashboard",
        )

    # Fetch parent doc
    parent_doc = await db.collection("parents").document(parent_id).get()
    if not parent_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")

    parent_data = parent_doc.to_dict()
    child_ids = parent_data.get("children", [])

    # Aggregate each child
    children_summaries = []
    for child_id in child_ids:
        child_doc = await db.collection("children").document(child_id).get()
        if not child_doc.exists:
            continue

        child_data = child_doc.to_dict()

        # Fetch phonemic progress for this child
        progress_query = db.collection("phonemic_progress").where("child_id", "==", child_id)
        progress_docs = [doc.to_dict() async for doc in progress_query.stream()]
        progress = compute_overall_progress(progress_docs)

        # Find most recent activity
        sessions_query = (
            db.collection("learning_sessions")
            .where("child_id", "==", child_id)
            .order_by("completed_at", direction=firestore_v1.Query.DESCENDING)
            .limit(1)
        )
        recent_sessions = [doc.to_dict() async for doc in sessions_query.stream()]
        recent_activity = recent_sessions[0].get("completed_at") if recent_sessions else None

        children_summaries.append(ChildSummary(
            child_id=child_id,
            display_name=child_data.get("display_name", ""),
            age=child_data.get("age", 5),
            current_week=child_data.get("current_week", 1),
            total_stars=child_data.get("total_stars", 0),
            streak_days=child_data.get("streak_days", 0),
            overall_accuracy=progress["overall_accuracy"],
            mastery_distribution=progress["mastery_distribution"],
            recent_activity=recent_activity,
        ))

    return ParentDashboardResponse(
        parent_id=parent_id,
        display_name=parent_data.get("display_name", ""),
        total_children=len(children_summaries),
        children=children_summaries,
    )
