"""
Auth service request/response schemas.
Separate from shared Firestore models — these define API contracts only.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# --- Requests ---


class ParentRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=100)


class ParentLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AddChildRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=50)
    age: int = Field(ge=3, le=18)
    grade_level: str = ""
    avatar: str = "default"
    learning_style: str = "visual"


class ChildLoginRequest(BaseModel):
    parent_token: str
    child_id: str


class TokenValidateRequest(BaseModel):
    token: str


# --- Responses ---


class ParentResponse(BaseModel):
    id: str
    email: str
    display_name: str
    subscription_tier: str
    children: list[str]
    created_at: datetime


class ChildResponse(BaseModel):
    id: str
    parent_id: str
    display_name: str
    age: int
    age_range: str
    grade_level: str
    avatar: str
    learning_style: str
    current_week: int
    total_stars: int
    streak_days: int
    created_at: datetime


class AuthResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_in: int
    user: ParentResponse


class ChildAuthResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_in: int
    session_limit_minutes: int
    user: ChildResponse


class TokenValidationResponse(BaseModel):
    valid: bool
    user_id: Optional[str] = None
    user_type: Optional[str] = None
    email: Optional[str] = None
