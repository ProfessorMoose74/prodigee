"""
Analytics service response schemas.
Read-only service — no request body schemas needed (all GET endpoints).
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# --- Child Progress ---


class SkillProgress(BaseModel):
    skill: str
    accuracy: float
    mastery_level: str
    attempts: int
    correct: int
    last_practiced: Optional[datetime] = None


class SessionSummary(BaseModel):
    total_sessions: int
    completed_sessions: int
    avg_accuracy: float
    avg_engagement: float
    total_stars: int
    total_minutes: float


class VoiceSummary(BaseModel):
    total_interactions: int
    avg_accuracy: float
    success_rate: float


class ChildProgressResponse(BaseModel):
    child_id: str
    display_name: str
    age: int
    current_week: int
    total_stars: int
    streak_days: int
    overall_accuracy: float
    mastery_distribution: dict[str, int]
    strongest_skill: Optional[str] = None
    weakest_skill: Optional[str] = None
    skills: list[SkillProgress]
    sessions: SessionSummary
    voice: VoiceSummary


# --- Phonemic Progress ---


class PhonemicProgressResponse(BaseModel):
    child_id: str
    skills: list[SkillProgress]
    overall_accuracy: float
    mastery_distribution: dict[str, int]


# --- Sessions ---


class SessionRecord(BaseModel):
    id: str
    session_type: str
    activity_type: str
    accuracy: float
    stars_earned: int
    engagement_score: float
    duration_minutes: float
    completed: bool
    completed_at: Optional[datetime] = None


class SessionsResponse(BaseModel):
    child_id: str
    total: int
    limit: int
    offset: int
    sessions: list[SessionRecord]


# --- Assessments (derived from session data) ---


class WeeklyAssessment(BaseModel):
    week_number: int
    sessions_count: int
    avg_accuracy: float
    skills_practiced: list[str]
    skill_scores: dict[str, float]
    total_stars: int


class AssessmentsResponse(BaseModel):
    child_id: str
    weekly_summaries: list[WeeklyAssessment]


# --- Parent Dashboard ---


class ChildSummary(BaseModel):
    child_id: str
    display_name: str
    age: int
    current_week: int
    total_stars: int
    streak_days: int
    overall_accuracy: float
    mastery_distribution: dict[str, int]
    recent_activity: Optional[datetime] = None


class ParentDashboardResponse(BaseModel):
    parent_id: str
    display_name: str
    total_children: int
    children: list[ChildSummary]


# --- System Metrics ---


class SystemMetricsResponse(BaseModel):
    service: str
    status: str
    environment: str
    uptime_info: str
    collections: dict[str, int]
