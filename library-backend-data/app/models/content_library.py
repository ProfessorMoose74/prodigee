from sqlalchemy import Column, Integer, String, Text, Boolean, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class ContentLibrary(Base):
    __tablename__ = "content_library"
    
    id = Column(Integer, primary_key=True, index=True)
    content_type = Column(String(50), nullable=False, index=True)  # activity, nursery_rhyme, assessment, lesson
    subject_area = Column(String(50), nullable=False, index=True)  # phonemic_awareness, math, science, geography
    age_range = Column(String(20), nullable=False, index=True)     # 3-5, 6-8, 9-12, 13+
    title = Column(String(200), nullable=False)
    description = Column(Text)
    file_path = Column(String(500))  # Path to content files - audio, video, images
    
    skill_objectives = Column(JSON)
    prerequisite_skills = Column(JSON)
    content_metadata = Column(JSON)
    
    download_priority = Column(Integer, default=1)  # For caching strategies
    difficulty_level = Column(String(20), default='beginner')  # beginner, intermediate, advanced
    active = Column(Boolean, default=True)
    
    # Performance and analytics
    usage_count = Column(Integer, default=0)
    average_completion_time = Column(Integer)  # in seconds
    success_rate = Column(Integer)  # percentage
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    progress_records = relationship("Progress", back_populates="content")


class HeggertyCurriculumData(Base):
    __tablename__ = "heggerty_curriculum_data"
    
    id = Column(Integer, primary_key=True, index=True)
    lesson_number = Column(Integer, nullable=False, index=True)
    skill_focus = Column(String(100), nullable=False)
    activity_type = Column(String(50), nullable=False)
    content_data = Column(JSON)
    audio_file_path = Column(String(500))
    difficulty_progression = Column(String(20), default='sequential')
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class NurseryRhymeData(Base):
    __tablename__ = "nursery_rhyme_data"
    
    id = Column(Integer, primary_key=True, index=True)
    rhyme_name = Column(String(100), nullable=False, index=True)
    lyrics = Column(Text)
    audio_file_path = Column(String(500))
    learning_objectives = Column(JSON)
    motor_skills = Column(JSON)  # hand motions, physical activities
    age_appropriate = Column(String(20), default='3-5')
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MultiSubjectCurriculum(Base):
    __tablename__ = "multi_subject_curriculum"
    
    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(50), nullable=False, index=True)  # math, science, geography, etc.
    grade_level = Column(String(20), nullable=False)
    unit_title = Column(String(200), nullable=False)
    lesson_sequence = Column(Integer, nullable=False)
    
    learning_objectives = Column(JSON)
    content_structure = Column(JSON)
    assessment_criteria = Column(JSON)
    resources = Column(JSON)  # files, links, materials needed
    
    difficulty_progression = Column(String(20), default='sequential')
    estimated_duration = Column(Integer)  # minutes
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)