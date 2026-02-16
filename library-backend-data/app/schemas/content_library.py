from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime


class ContentLibraryBase(BaseModel):
    content_type: str = Field(..., description="Type of content (activity, nursery_rhyme, assessment, lesson)")
    subject_area: str = Field(..., description="Subject area (phonemic_awareness, math, science, geography)")
    age_range: str = Field(..., description="Target age range (3-5, 6-8, 9-12, 13+)")
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    difficulty_level: str = Field("intermediate", description="Difficulty level (beginner, intermediate, advanced)")
    
    @validator('content_type')
    def validate_content_type(cls, v):
        allowed_types = ['activity', 'nursery_rhyme', 'assessment', 'lesson', 'story', 'game']
        if v not in allowed_types:
            raise ValueError(f'content_type must be one of: {allowed_types}')
        return v
    
    @validator('subject_area')
    def validate_subject_area(cls, v):
        allowed_areas = ['phonemic_awareness', 'math', 'science', 'geography', 'language_arts', 'social_studies']
        if v not in allowed_areas:
            raise ValueError(f'subject_area must be one of: {allowed_areas}')
        return v
    
    @validator('age_range')
    def validate_age_range(cls, v):
        allowed_ranges = ['3-5', '6-8', '9-12', '13+', 'all']
        if v not in allowed_ranges:
            raise ValueError(f'age_range must be one of: {allowed_ranges}')
        return v
    
    @validator('difficulty_level')
    def validate_difficulty_level(cls, v):
        allowed_levels = ['beginner', 'intermediate', 'advanced']
        if v not in allowed_levels:
            raise ValueError(f'difficulty_level must be one of: {allowed_levels}')
        return v


class ContentLibraryCreate(ContentLibraryBase):
    file_path: Optional[str] = None
    skill_objectives: Optional[Dict[str, Any]] = None
    prerequisite_skills: Optional[Dict[str, Any]] = None
    content_metadata: Optional[Dict[str, Any]] = None
    download_priority: int = Field(1, ge=1, le=10)
    active: bool = True


class ContentLibraryUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    content_type: Optional[str] = None
    subject_area: Optional[str] = None
    age_range: Optional[str] = None
    difficulty_level: Optional[str] = None
    file_path: Optional[str] = None
    skill_objectives: Optional[Dict[str, Any]] = None
    prerequisite_skills: Optional[Dict[str, Any]] = None
    content_metadata: Optional[Dict[str, Any]] = None
    download_priority: Optional[int] = Field(None, ge=1, le=10)
    active: Optional[bool] = None


class ContentLibraryResponse(ContentLibraryBase):
    id: int
    file_path: Optional[str]
    skill_objectives: Optional[Dict[str, Any]]
    prerequisite_skills: Optional[Dict[str, Any]]
    content_metadata: Optional[Dict[str, Any]]
    download_priority: int
    active: bool
    usage_count: Optional[int]
    average_completion_time: Optional[int]
    success_rate: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ContentFilter(BaseModel):
    subject_area: Optional[str] = None
    age_range: Optional[str] = None
    content_type: Optional[str] = None
    difficulty_level: Optional[str] = None
    active_only: bool = True
    search_term: Optional[str] = None


class ContentRecommendation(BaseModel):
    content_id: int
    title: str
    subject_area: str
    age_range: str
    difficulty_level: str
    recommendation_score: float = Field(..., ge=0.0, le=1.0)
    recommendation_reason: str


class FileUploadResponse(BaseModel):
    message: str
    content_id: int
    filename: str
    original_filename: Optional[str]
    file_path: str
    content_item: ContentLibraryResponse


class FileInfo(BaseModel):
    filename: str
    size: int
    mime_type: Optional[str]
    created: datetime
    modified: datetime
    path: str