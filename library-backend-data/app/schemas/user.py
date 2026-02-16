from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class UserCreate(BaseModel):
    user_id: str = Field(..., max_length=100)
    session_token: Optional[str] = Field(None, max_length=500)


class UserProgressUpdate(BaseModel):
    document_id: int
    section_id: Optional[int] = None
    progress_percentage: float = Field(0.0, ge=0.0, le=100.0)
    last_position: int = Field(0, ge=0)


class UserPreferencesUpdate(BaseModel):
    difficulty_level: Optional[str] = Field(None, max_length=50)
    interface_settings: Optional[Dict[str, Any]] = None
    avatar_preferences: Optional[Dict[str, Any]] = None
    learning_style: Optional[str] = Field(None, max_length=50)
    reading_speed: Optional[str] = Field(None, max_length=50)
    font_size: Optional[str] = Field(None, max_length=20)
    theme: Optional[str] = Field(None, max_length=20)


class BookmarkCreate(BaseModel):
    document_id: int
    section_id: Optional[int] = None
    bookmark_name: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = None
    position: Optional[int] = None