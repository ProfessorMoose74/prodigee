"""
Learning engine request/response schemas.
Separate from shared Firestore models — these define API contracts only.
"""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# --- Enums (replicated from shared models since no shared/ import in Docker) ---


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


# --- Requests ---


class ActivityCompleteRequest(BaseModel):
    accuracy: float = Field(ge=0, le=100)
    duration: int = Field(ge=0, description="Duration in seconds")
    stars_earned: int = Field(ge=0, le=5, default=0)
    engagement: float = Field(ge=0, le=10, default=8.0)
    responses: list[dict] = Field(default_factory=list)


class VoiceProcessRequest(BaseModel):
    audio_data: str  # base64 encoded
    expected_response: str
    activity_type: str = "pronunciation"
    encoding: str = "LINEAR16"
    sample_rate_hertz: int = 16000
    language_code: str = "en-US"


class VoiceSynthesizeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    voice_type: str = "default"
    language_code: str = "en-US"
    speaking_rate: float = Field(default=0.85, ge=0.5, le=1.5)


class RecommendationRequest(BaseModel):
    child_id: Optional[str] = None
    recent_performance: Optional[dict] = None
    activity_type: Optional[str] = None


# --- Responses ---


class CurriculumWeekResponse(BaseModel):
    week_number: int
    active_skills: list[str]
    week_activities: dict
    nursery_rhyme: dict
    daily_structure: dict
    assessment_progression: Optional[dict] = None


class SubjectResponse(BaseModel):
    subject_id: str
    name: str
    description: str
    age_ranges: list[str]


class DashboardResponse(BaseModel):
    child: dict
    week_activities: dict
    nursery_rhyme: dict
    progress: dict
    recommendation: dict
    active_skills: list[str]


class ActivityDetailResponse(BaseModel):
    skill_name: str
    skill_info: dict
    week_number: int
    activities: dict
    child_progress: float
    mastery_level: str


class ActivityCompleteResponse(BaseModel):
    message: str
    progress_gained: float
    new_progress: float
    mastery_level: str
    stars_earned: int
    current_week: int
    week_advanced: bool = False


class VoiceProcessResponse(BaseModel):
    success: bool
    transcript: str = ""
    confidence: float = 0.0
    accuracy_score: float = 0.0
    feedback: str = ""
    source: str = "cloud_speech"


class VoiceSynthesizeResponse(BaseModel):
    success: bool
    audio_content: str = ""
    duration_estimate: float = 0.0
    message: str = ""
    source: str = "cloud_tts"


class RecommendationResponse(BaseModel):
    recommended_skill: str
    reason: str
    difficulty_level: str = "medium"
    readiness_score: float = 1.0
    confidence: float = 0.7
    source: str = "rule_based"
