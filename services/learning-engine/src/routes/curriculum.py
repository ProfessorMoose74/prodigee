"""
Curriculum routes — week data, subjects, and content listing.
No auth required (public reference data).
"""

from fastapi import APIRouter, HTTPException, Query, status

from src.curriculum import (
    get_content_list,
    get_daily_structure,
    get_nursery_rhyme,
    get_skill_activities,
    get_skills_for_week,
    get_subjects,
    get_week_data,
)
from src.schemas import CurriculumWeekResponse, SubjectResponse

router = APIRouter(tags=["curriculum"])


@router.get("/curriculum/week/{week_number}", response_model=CurriculumWeekResponse)
async def get_curriculum_week(week_number: int):
    """Get Heggerty curriculum for a specific week (1-35)."""
    if week_number < 1 or week_number > 35:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Week number must be between 1 and 35",
        )

    active_skills = get_skills_for_week(week_number)
    week_entries = get_week_data(week_number)

    # Build activities dict keyed by skill
    week_activities = {}
    for skill in active_skills:
        week_activities[skill] = get_skill_activities(skill, week_number)

    nursery_rhyme = get_nursery_rhyme(week_number)
    daily_structure = get_daily_structure()

    # Assessment progression from week entries
    assessment = None
    if week_entries:
        assessment = week_entries[0].get("assessment_checkpoints")

    return CurriculumWeekResponse(
        week_number=week_number,
        active_skills=active_skills,
        week_activities=week_activities,
        nursery_rhyme=nursery_rhyme,
        daily_structure=daily_structure,
        assessment_progression=assessment,
    )


@router.get("/subjects", response_model=list[SubjectResponse])
async def list_subjects(age_range: str | None = Query(None)):
    """List available subjects, optionally filtered by age range."""
    return get_subjects(age_range)


@router.get("/content")
async def list_content(
    subject: str | None = Query(None),
    age_range: str | None = Query(None),
    content_type: str | None = Query(None),
    difficulty: str | None = Query(None),
):
    """List educational content with optional filters."""
    return get_content_list(subject, age_range, content_type, difficulty)
