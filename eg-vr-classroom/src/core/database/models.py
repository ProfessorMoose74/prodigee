"""
SQLAlchemy ORM Models for EG VR Classroom
Maps to the unified database schema
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Boolean, Column, Date, DateTime, ForeignKey, Integer,
    String, Text, DECIMAL, BigInteger, CheckConstraint, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

Base = declarative_base()


# ============================================================================
# USER MANAGEMENT & AUTHENTICATION
# ============================================================================

class Parent(Base):
    """Parent/Guardian account"""
    __tablename__ = 'parents'

    parent_id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone_number = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)
    verified_at = Column(DateTime)
    last_login = Column(DateTime)
    subscription_tier = Column(String(50), default='basic')
    two_factor_enabled = Column(Boolean, default=False)
    communication_preferences = Column(JSONB, default={})
    safety_settings = Column(JSONB, default={})
    is_active = Column(Boolean, default=True)

    # Relationships
    children = relationship('Child', back_populates='parent', cascade='all, delete-orphan')
    consents = relationship('ParentalConsent', back_populates='parent')

    def __repr__(self):
        return f"<Parent {self.parent_id}: {self.email}>"


class Child(Base):
    """Child account (COPPA-protected)"""
    __tablename__ = 'children'

    child_id = Column(Integer, primary_key=True)
    parent_id = Column(Integer, ForeignKey('parents.parent_id', ondelete='CASCADE'), nullable=False)
    display_name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    age_range = Column(String(10))
    grade_level = Column(String(20))
    date_of_birth = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime)
    current_week = Column(Integer, default=1)
    total_stars = Column(Integer, default=0)
    streak_days = Column(Integer, default=0)
    last_streak_date = Column(Date)
    avatar_customization = Column(JSONB, default={})
    learning_preferences = Column(JSONB, default={})
    safety_restrictions = Column(JSONB, default={})
    voice_profile_id = Column(UUID)
    is_active = Column(Boolean, default=True)

    # Relationships
    parent = relationship('Parent', back_populates='children')
    vr_sessions = relationship('VRSession', back_populates='child')
    phonemic_progress = relationship('PhonemicProgress', back_populates='child')
    activity_completions = relationship('ActivityCompletion', back_populates='child')
    assessments = relationship('Assessment', back_populates='child')
    voice_interactions = relationship('VoiceInteraction', back_populates='child')
    consents = relationship('ParentalConsent', back_populates='child')

    __table_args__ = (
        CheckConstraint('age BETWEEN 3 AND 13', name='age_range_valid'),
    )

    def __repr__(self):
        return f"<Child {self.child_id}: {self.display_name} (age {self.age})>"


class ParentalConsent(Base):
    """COPPA-required parental consent records"""
    __tablename__ = 'parental_consent'

    consent_id = Column(Integer, primary_key=True)
    child_id = Column(Integer, ForeignKey('children.child_id', ondelete='CASCADE'), nullable=False)
    parent_id = Column(Integer, ForeignKey('parents.parent_id', ondelete='CASCADE'), nullable=False)
    consent_method = Column(String(50), nullable=False)
    consent_granted = Column(Boolean, default=False)
    consent_timestamp = Column(DateTime)
    verification_token = Column(UUID, unique=True)
    is_verified = Column(Boolean, default=False)
    expires_at = Column(DateTime)
    consent_data = Column(JSONB, default={})
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    child = relationship('Child', back_populates='consents')
    parent = relationship('Parent', back_populates='consents')

    def __repr__(self):
        return f"<ParentalConsent {self.consent_id}: child={self.child_id} verified={self.is_verified}>"


# ============================================================================
# VR SESSION MANAGEMENT
# ============================================================================

class VRSession(Base):
    """VR classroom session"""
    __tablename__ = 'vr_sessions'

    session_id = Column(Integer, primary_key=True)
    child_id = Column(Integer, ForeignKey('children.child_id', ondelete='CASCADE'), nullable=False)
    classroom_id = Column(Integer, ForeignKey('vr_classrooms.classroom_id'))
    session_type = Column(String(50), default='daily_practice')
    vr_platform = Column(String(50))
    headset_model = Column(String(100))
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime)
    duration_seconds = Column(Integer)
    planned_duration_seconds = Column(Integer, default=1800)
    actual_activities_completed = Column(Integer, default=0)
    planned_activities = Column(Integer, default=0)
    overall_engagement_score = Column(DECIMAL(3, 1))
    completion_status = Column(String(20), default='in_progress')
    stars_earned = Column(Integer, default=0)
    break_reminders_triggered = Column(Integer, default=0)
    parent_observation_active = Column(Boolean, default=False)
    emergency_stop_triggered = Column(Boolean, default=False)
    emergency_stop_reason = Column(Text)
    session_metadata = Column(JSONB, default={})

    # Relationships
    child = relationship('Child', back_populates='vr_sessions')
    classroom = relationship('VRClassroom', back_populates='sessions')
    activities = relationship('ActivityCompletion', back_populates='session')
    voice_interactions = relationship('VoiceInteraction', back_populates='session')
    vr_interactions = relationship('VRInteraction', back_populates='session')

    def __repr__(self):
        return f"<VRSession {self.session_id}: child={self.child_id} status={self.completion_status}>"


class VRClassroom(Base):
    """Virtual classroom instance"""
    __tablename__ = 'vr_classrooms'

    classroom_id = Column(Integer, primary_key=True)
    teacher_id = Column(Integer)
    classroom_name = Column(String(200))
    classroom_type = Column(String(50), default='standard')
    era_theme = Column(String(50), default='1920s_american')
    max_capacity = Column(Integer, default=25)
    current_occupancy = Column(Integer, default=0)
    localization_country_code = Column(String(2))
    localization_timezone = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    classroom_settings = Column(JSONB, default={})

    # Relationships
    sessions = relationship('VRSession', back_populates='classroom')
    participants = relationship('ClassroomParticipant', back_populates='classroom')
    daily_landmarks = relationship('DailyLandmark', back_populates='classroom')

    def __repr__(self):
        return f"<VRClassroom {self.classroom_id}: {self.classroom_name}>"


class ClassroomParticipant(Base):
    """Students/observers in a classroom"""
    __tablename__ = 'classroom_participants'

    participant_id = Column(Integer, primary_key=True)
    classroom_id = Column(Integer, ForeignKey('vr_classrooms.classroom_id', ondelete='CASCADE'), nullable=False)
    child_id = Column(Integer, ForeignKey('children.child_id', ondelete='CASCADE'), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    left_at = Column(DateTime)
    role = Column(String(20), default='student')
    seat_position = Column(Integer)
    is_currently_present = Column(Boolean, default=True)

    # Relationships
    classroom = relationship('VRClassroom', back_populates='participants')

    __table_args__ = (
        UniqueConstraint('classroom_id', 'child_id', 'joined_at'),
    )


# ============================================================================
# LEARNING PROGRESS & CURRICULUM
# ============================================================================

class PhonemicProgress(Base):
    """Heggerty phonemic awareness progress"""
    __tablename__ = 'phonemic_progress'

    progress_id = Column(Integer, primary_key=True)
    child_id = Column(Integer, ForeignKey('children.child_id', ondelete='CASCADE'), nullable=False)
    skill_type = Column(String(50), nullable=False)
    skill_category = Column(String(50))
    week_number = Column(Integer, nullable=False)
    mastery_level = Column(DECIMAL(5, 2), default=0.0)
    accuracy_percentage = Column(DECIMAL(5, 2))
    attempts_total = Column(Integer, default=0)
    attempts_correct = Column(Integer, default=0)
    voice_recognition_accuracy = Column(DECIMAL(5, 2))
    last_practiced = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    child = relationship('Child', back_populates='phonemic_progress')

    __table_args__ = (
        CheckConstraint('week_number BETWEEN 1 AND 35', name='week_valid'),
    )


class ActivityCompletion(Base):
    """Individual activity completion records"""
    __tablename__ = 'activity_completions'

    completion_id = Column(Integer, primary_key=True)
    child_id = Column(Integer, ForeignKey('children.child_id', ondelete='CASCADE'), nullable=False)
    session_id = Column(Integer, ForeignKey('vr_sessions.session_id', ondelete='SET NULL'))
    activity_type = Column(String(100), nullable=False)
    skill_area = Column(String(50))
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    duration_seconds = Column(Integer)
    accuracy = Column(DECIMAL(5, 2))
    stars_earned = Column(Integer, default=0)
    engagement_score = Column(DECIMAL(3, 1))
    interaction_method = Column(String(20))
    activity_data = Column(JSONB, default={})

    # Relationships
    child = relationship('Child', back_populates='activity_completions')
    session = relationship('VRSession', back_populates='activities')


class Assessment(Base):
    """Formal assessments"""
    __tablename__ = 'assessments'

    assessment_id = Column(Integer, primary_key=True)
    child_id = Column(Integer, ForeignKey('children.child_id', ondelete='CASCADE'), nullable=False)
    assessment_type = Column(String(50), nullable=False)
    week_number = Column(Integer)
    administered_at = Column(DateTime, default=datetime.utcnow)
    skills_assessed = Column(JSONB)
    overall_score = Column(DECIMAL(5, 2))
    skill_scores = Column(JSONB)
    recommendations = Column(JSONB)
    administered_by = Column(String(50))
    assessment_metadata = Column(JSONB, default={})

    # Relationships
    child = relationship('Child', back_populates='assessments')


# ============================================================================
# VOICE INTERACTIONS (COPPA-COMPLIANT)
# ============================================================================

class VoiceInteraction(Base):
    """Voice interaction records (text-only for COPPA)"""
    __tablename__ = 'voice_interactions'

    interaction_id = Column(Integer, primary_key=True)
    child_id = Column(Integer, ForeignKey('children.child_id', ondelete='CASCADE'), nullable=False)
    session_id = Column(Integer, ForeignKey('vr_sessions.session_id', ondelete='SET NULL'))
    interaction_type = Column(String(50), nullable=False)
    prompt_given = Column(Text)
    expected_response = Column(Text)
    actual_response_text = Column(Text)  # TEXT ONLY - never audio
    recognition_confidence = Column(DECIMAL(4, 3))
    accuracy_score = Column(DECIMAL(4, 3))
    response_time_seconds = Column(DECIMAL(6, 2))
    success_achieved = Column(Boolean)
    timestamp = Column(DateTime, default=datetime.utcnow)
    language_code = Column(String(5), default='en')

    # Relationships
    child = relationship('Child', back_populates='voice_interactions')
    session = relationship('VRSession', back_populates='voice_interactions')


# ============================================================================
# CONTENT LIBRARY
# ============================================================================

class ContentLibrary(Base):
    """Educational content metadata"""
    __tablename__ = 'content_library'

    content_id = Column(Integer, primary_key=True)
    content_type = Column(String(50), nullable=False)
    subject_area = Column(String(50))
    age_range = Column(String(10))
    title = Column(String(500))
    description = Column(Text)
    file_path = Column(String(1000))
    file_size_bytes = Column(BigInteger)
    mime_type = Column(String(100))
    duration_seconds = Column(Integer)
    difficulty_level = Column(String(20))
    skill_objectives = Column(JSONB)
    prerequisite_skills = Column(JSONB)
    tags = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey('parents.parent_id'))
    is_approved = Column(Boolean, default=False)
    approval_date = Column(DateTime)
    download_count = Column(Integer, default=0)
    average_rating = Column(DECIMAL(3, 2))


class HeggertyCurriculum(Base):
    """Heggerty weekly curriculum data"""
    __tablename__ = 'heggerty_curriculum'

    curriculum_id = Column(Integer, primary_key=True)
    week_number = Column(Integer, unique=True, nullable=False)
    skill_focus = Column(String(100))
    nursery_rhyme_title = Column(String(200))
    nursery_rhyme_lyrics = Column(Text)
    nursery_rhyme_motions = Column(Text)
    activities = Column(JSONB)
    daily_lesson_plan = Column(JSONB)
    assessment_checkpoint = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint('week_number BETWEEN 1 AND 35', name='week_range'),
    )


# ============================================================================
# VR-SPECIFIC INTERACTIONS
# ============================================================================

class VRInteraction(Base):
    """VR object interactions"""
    __tablename__ = 'vr_interactions'

    interaction_id = Column(Integer, primary_key=True)
    child_id = Column(Integer, ForeignKey('children.child_id', ondelete='CASCADE'), nullable=False)
    session_id = Column(Integer, ForeignKey('vr_sessions.session_id', ondelete='CASCADE'), nullable=False)
    object_id = Column(String(200))
    interaction_type = Column(String(50))
    position_x = Column(DECIMAL(10, 6))
    position_y = Column(DECIMAL(10, 6))
    position_z = Column(DECIMAL(10, 6))
    rotation_quaternion = Column(JSONB)
    interaction_data = Column(JSONB)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship('VRSession', back_populates='vr_interactions')


class DailyLandmark(Base):
    """Daily landmark for lunchroom mural"""
    __tablename__ = 'daily_landmarks'

    landmark_id = Column(Integer, primary_key=True)
    date = Column(Date, unique=True, nullable=False)
    classroom_id = Column(Integer, ForeignKey('vr_classrooms.classroom_id'))
    landmark_name = Column(String(300))
    landmark_country_code = Column(String(2))
    landmark_type = Column(String(50))
    landmark_description = Column(Text)
    image_path = Column(String(1000))
    fun_fact = Column(Text)
    is_local = Column(Boolean)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    classroom = relationship('VRClassroom', back_populates='daily_landmarks')


# ============================================================================
# COMMUNICATION & SAFETY
# ============================================================================

class ApprovedPhrase(Base):
    """Pre-approved communication phrases"""
    __tablename__ = 'approved_phrases'

    phrase_id = Column(Integer, primary_key=True)
    phrase_text = Column(String(500), nullable=False)
    category = Column(String(50))
    age_appropriate_from = Column(Integer, default=3)
    age_appropriate_to = Column(Integer, default=13)
    translation_cache = Column(JSONB, default={})
    usage_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class CommunicationLog(Base):
    """Student communication log"""
    __tablename__ = 'communication_log'

    log_id = Column(Integer, primary_key=True)
    from_child_id = Column(Integer, ForeignKey('children.child_id', ondelete='CASCADE'))
    to_child_id = Column(Integer, ForeignKey('children.child_id', ondelete='CASCADE'))
    session_id = Column(Integer, ForeignKey('vr_sessions.session_id', ondelete='SET NULL'))
    communication_type = Column(String(20))
    phrase_id = Column(Integer, ForeignKey('approved_phrases.phrase_id'))
    phrase_text = Column(Text)
    source_language = Column(String(5))
    target_language = Column(String(5))
    was_translated = Column(Boolean, default=False)
    moderation_status = Column(String(20), default='approved')
    timestamp = Column(DateTime, default=datetime.utcnow)


class SafetyIncident(Base):
    """Safety incident tracking"""
    __tablename__ = 'safety_incidents'

    incident_id = Column(Integer, primary_key=True)
    child_id = Column(Integer, ForeignKey('children.child_id', ondelete='CASCADE'))
    session_id = Column(Integer, ForeignKey('vr_sessions.session_id', ondelete='SET NULL'))
    incident_type = Column(String(50), nullable=False)
    severity = Column(String(20))
    description = Column(Text)
    detected_at = Column(DateTime, default=datetime.utcnow)
    parent_notified_at = Column(DateTime)
    action_taken = Column(String(200))
    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime)
    incident_data = Column(JSONB, default={})


# ============================================================================
# ANALYTICS
# ============================================================================

class SystemAnalytics(Base):
    """System-wide analytics"""
    __tablename__ = 'system_analytics'

    analytics_id = Column(Integer, primary_key=True)
    metric_type = Column(String(50))
    metric_name = Column(String(100))
    metric_value = Column(DECIMAL(15, 6))
    metric_unit = Column(String(20))
    server_component = Column(String(50))
    context_data = Column(JSONB)
    recorded_at = Column(DateTime, default=datetime.utcnow)


class SessionAnalytics(Base):
    """Per-session analytics"""
    __tablename__ = 'session_analytics'

    analytics_id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey('vr_sessions.session_id', ondelete='CASCADE'))
    child_id = Column(Integer, ForeignKey('children.child_id', ondelete='CASCADE'))
    avg_fps = Column(DECIMAL(6, 2))
    frame_drops_count = Column(Integer)
    network_latency_avg_ms = Column(DECIMAL(8, 2))
    voice_recognition_avg_confidence = Column(DECIMAL(4, 3))
    total_interactions_count = Column(Integer)
    hand_tracking_quality = Column(DECIMAL(3, 2))
    comfort_violations = Column(Integer)
    performance_score = Column(DECIMAL(3, 1))
    created_at = Column(DateTime, default=datetime.utcnow)
