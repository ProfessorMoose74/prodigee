from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base


class Parent(Base):
    __tablename__ = "parent"
    
    id = Column(Integer, primary_key=True)
    uuid = Column(String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    
    subscription_tier = Column(String(20), default='basic')  # basic, premium, enterprise
    communication_preferences = Column(JSON, default=lambda: {
        'email_notifications': True,
        'sms_notifications': False,
        'push_notifications': True,
        'daily_summary': True,
        'weekly_report': True,
        'milestone_alerts': True
    })
    monitoring_settings = Column(JSON, default=lambda: {
        'real_time_alerts': True,
        'session_start_notify': True,
        'progress_threshold_notify': 80,
        'difficulty_change_notify': True
    })
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    children = relationship("Child", back_populates="parent")


class Child(Base):
    __tablename__ = "child"
    
    id = Column(Integer, primary_key=True)
    uuid = Column(String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    parent_id = Column(Integer, ForeignKey('parent.id'), nullable=False)
    name = Column(String(100), nullable=False)
    age = Column(Integer)
    grade_level = Column(String(20))
    
    # Authentication
    pin_hash = Column(String(256))  # For child login
    last_login = Column(DateTime)
    
    # Learning Profile
    learning_preferences = Column(JSON, default=lambda: {
        'visual_learning': True,
        'auditory_learning': True,
        'kinesthetic_learning': False,
        'preferred_difficulty': 'adaptive',
        'session_length_preference': 15,  # minutes
        'break_frequency': 3  # activities before break
    })
    
    # Progress Tracking
    current_phonemic_level = Column(String(50), default='beginning')
    overall_progress_percentage = Column(Float, default=0.0)
    total_session_time = Column(Integer, default=0)  # minutes
    
    # AI Personalization
    ai_difficulty_adjustment = Column(Float, default=1.0)
    learning_velocity = Column(Float, default=1.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    parent = relationship("Parent", back_populates="children")
    progress_records = relationship("Progress", back_populates="child")
    learning_sessions = relationship("LearningSession", back_populates="child")
    assessments = relationship("Assessment", back_populates="child")


class Progress(Base):
    __tablename__ = "progress"
    
    id = Column(Integer, primary_key=True)
    child_id = Column(Integer, ForeignKey('child.id'), nullable=False)
    content_id = Column(Integer, ForeignKey('content_library.id'), nullable=False)
    
    # Detailed Progress Tracking
    phonemic_skill = Column(String(100))
    skill_level = Column(String(50))  # beginning, developing, proficient, advanced
    accuracy_percentage = Column(Float)
    completion_time = Column(Integer)  # seconds
    attempts_count = Column(Integer, default=1)
    
    # Learning Analytics
    learning_velocity = Column(Float)  # progress rate
    difficulty_adjustment = Column(Float, default=1.0)
    engagement_score = Column(Float)  # 0-100
    
    session_date = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    child = relationship("Child", back_populates="progress_records")
    content = relationship("ContentLibrary", back_populates="progress_records")


class LearningSession(Base):
    __tablename__ = "learning_session"
    
    id = Column(Integer, primary_key=True)
    child_id = Column(Integer, ForeignKey('child.id'), nullable=False)
    session_start = Column(DateTime, default=datetime.utcnow)
    session_end = Column(DateTime)
    
    # Session Metrics
    total_activities = Column(Integer, default=0)
    completed_activities = Column(Integer, default=0)
    average_accuracy = Column(Float)
    total_time_spent = Column(Integer)  # seconds
    
    # AI Adjustments
    ai_adjustments_made = Column(JSON)  # Record of difficulty/content adjustments
    engagement_level = Column(String(20))  # low, medium, high
    
    # Session Outcomes
    skills_practiced = Column(JSON)
    mastery_achieved = Column(JSON)
    recommended_next_steps = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    child = relationship("Child", back_populates="learning_sessions")


class Assessment(Base):
    __tablename__ = "assessment"
    
    id = Column(Integer, primary_key=True)
    child_id = Column(Integer, ForeignKey('child.id'), nullable=False)
    assessment_type = Column(String(50), nullable=False)  # diagnostic, progress, mastery
    subject_area = Column(String(50), nullable=False)
    
    # Assessment Results
    total_questions = Column(Integer)
    correct_answers = Column(Integer)
    accuracy_percentage = Column(Float)
    time_taken = Column(Integer)  # seconds
    
    # Detailed Results
    skill_breakdown = Column(JSON)  # Performance by skill area
    difficulty_analysis = Column(JSON)  # Performance by difficulty level
    
    # AI Analysis
    strengths_identified = Column(JSON)
    areas_for_improvement = Column(JSON)
    recommended_activities = Column(JSON)
    
    assessment_date = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    child = relationship("Child", back_populates="assessments")


class VoiceInteraction(Base):
    __tablename__ = "voice_interaction"
    
    id = Column(Integer, primary_key=True)
    child_id = Column(Integer, ForeignKey('child.id'), nullable=False)
    session_id = Column(String(36))  # For grouping interactions
    
    # Voice Processing Results (COPPA Compliant - no audio storage)
    transcribed_text = Column(Text)  # What the child said
    phonemic_analysis = Column(JSON)  # Phoneme detection results
    quality_score = Column(Float)  # Audio quality assessment
    
    # Recognition Results
    target_sound = Column(String(10))  # Expected phoneme/sound
    detected_sound = Column(String(10))  # What was detected
    accuracy_match = Column(Boolean)
    confidence_score = Column(Float)
    
    # Context
    activity_type = Column(String(50))
    difficulty_level = Column(String(20))
    
    interaction_timestamp = Column(DateTime, default=datetime.utcnow)


class SystemAnalytics(Base):
    __tablename__ = "system_analytics"
    
    id = Column(Integer, primary_key=True)
    metric_name = Column(String(100), nullable=False, index=True)
    metric_value = Column(Float)
    metric_category = Column(String(50), index=True)  # performance, usage, engagement
    
    # Context Data
    user_count = Column(Integer)
    session_count = Column(Integer)
    content_access_count = Column(Integer)
    
    # Performance Metrics
    average_response_time = Column(Float)  # milliseconds
    error_rate = Column(Float)  # percentage
    system_load = Column(Float)  # percentage
    
    recorded_at = Column(DateTime, default=datetime.utcnow)
    
    additional_data = Column(JSON)  # Flexible storage for metric-specific data