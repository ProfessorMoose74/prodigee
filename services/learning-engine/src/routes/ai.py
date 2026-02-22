"""
AI/Adaptive learning route — Vertex AI recommendation with rule-based fallback.
"""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from google.cloud import firestore_v1

from src.curriculum import SKILL_PROGRESSION, get_skills_for_week
from src.dependencies import get_current_user, get_db, get_vertex_model
from src.progress import generate_rule_based_recommendation
from src.schemas import RecommendationRequest, RecommendationResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/recommendation", response_model=RecommendationResponse)
async def get_recommendation(
    req: RecommendationRequest,
    user: dict = Depends(get_current_user),
    db: firestore_v1.AsyncClient = Depends(get_db),
):
    """Get AI-powered learning recommendation with rule-based fallback."""
    # Determine child_id based on token type
    if user.get("type") == "child":
        child_id = user["id"]
    elif req.child_id:
        child_id = req.child_id
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="child_id required when using parent token",
        )

    # Fetch child data
    child_doc = await db.collection("children").document(child_id).get()
    if not child_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    child_data = child_doc.to_dict()
    current_week = child_data.get("current_week", 1)

    # Fetch progress
    query = db.collection("phonemic_progress").where("child_id", "==", child_id)
    progress_docs = [doc async for doc in query.stream()]
    child_progress = {
        doc.to_dict()["skill"]: doc.to_dict().get("accuracy", 0.0)
        for doc in progress_docs
    }

    # Try Vertex AI first
    model = get_vertex_model()
    if model is not None:
        try:
            active_skills = get_skills_for_week(current_week)

            progress_summary = "\n".join(
                f"- {skill}: {child_progress.get(skill, 0.0):.0f}%"
                for skill in SKILL_PROGRESSION
            )

            prompt = (
                "You are an educational AI for a phonemic awareness learning platform "
                "for children. Based on the child's profile and progress, recommend the "
                "single best skill to practice next.\n\n"
                f"Child profile:\n"
                f"- Age: {child_data.get('age', 5)}\n"
                f"- Current week: {current_week} of 35\n"
                f"- Total stars: {child_data.get('total_stars', 0)}\n\n"
                f"Skill progress:\n{progress_summary}\n\n"
                f"Active skills for week {current_week}: {', '.join(active_skills)}\n\n"
                "Respond ONLY with a JSON object (no markdown):\n"
                '{"recommended_skill": "skill_name", "reason": "short motivational reason '
                'for the child", "difficulty_level": "easy|medium|hard", "confidence": 0.0-1.0}'
            )

            response = model.generate_content(prompt)
            text = response.text.strip()

            # Parse JSON from response (handle potential markdown wrapping)
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

            result = json.loads(text)

            # Validate the recommended skill exists
            skill = result.get("recommended_skill", "")
            if skill in SKILL_PROGRESSION:
                return RecommendationResponse(
                    recommended_skill=skill,
                    reason=result.get("reason", "Let's practice this skill!"),
                    difficulty_level=result.get("difficulty_level", "medium"),
                    readiness_score=1.0,
                    confidence=result.get("confidence", 0.8),
                    source="vertex_ai",
                )

        except Exception as e:
            logger.warning(f"Vertex AI recommendation failed, using fallback: {e}")

    # Rule-based fallback
    recommendation = generate_rule_based_recommendation(child_progress, current_week)
    return RecommendationResponse(**recommendation)
