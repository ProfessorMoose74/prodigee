"""
Shared learning/progress models — Firestore document schemas.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class PhonemicSkill(str, Enum):
    RHYMING = "rhyming"
    ONSET_FLUENCY = "onset_fluency"
    BLENDING = "blending"
    ISOLATING = "isolating"
    SEGMENTING = "segmenting"
    ADDING = "adding"
    DELETING = "deleting"
    SUBSTITUTING = "substituting"


class MasteryLevel(str, Enum):
    NOT_STARTED = "not_started"
    EMERGING = "emerging"
    DEVELOPING = "developing"
    PROFICIENT = "proficient"
    ADVANCED = "advanced"


class PhonemicProgress(BaseModel):
    """Per-skill phonemic awareness progress tracking."""

    child_id: str = ""
    skill: PhonemicSkill = PhonemicSkill.RHYMING
    mastery_level: MasteryLevel = MasteryLevel.NOT_STARTED
    accuracy: float = 0.0
    attempts: int = 0
    correct: int = 0
    current_week: int = 1
    last_practiced: datetime = Field(default_factory=datetime.utcnow)


class LearningSession(BaseModel):
    """Individual learning session record."""

    id: str = ""
    child_id: str = ""
    session_type: str = ""
    activity_type: str = ""
    planned_duration_minutes: int = 0
    actual_duration_minutes: int = 0
    accuracy: float = 0.0
    stars_earned: int = 0
    engagement_score: float = 0.0
    completed: bool = False
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None


class Assessment(BaseModel):
    """Assessment result record."""

    id: str = ""
    child_id: str = ""
    assessment_type: str = ""
    skills_assessed: list[str] = Field(default_factory=list)
    overall_score: float = 0.0
    skill_scores: dict[str, float] = Field(default_factory=dict)
    recommendations: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
