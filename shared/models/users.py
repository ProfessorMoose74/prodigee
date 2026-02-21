"""
Shared user models — Firestore document schemas.
These define the canonical data shapes used across all services.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class SubscriptionTier(str, Enum):
    FREE = "free"
    STANDARD = "standard"
    PREMIUM = "premium"
    INSTITUTE = "institute"


class AgeRange(str, Enum):
    AGES_3_5 = "3-5"
    AGES_6_8 = "6-8"
    AGES_9_12 = "9-12"
    AGES_13_PLUS = "13+"


class Parent(BaseModel):
    """Parent/Guardian account — Firestore document in 'parents' collection."""

    id: str = ""
    email: str = ""
    display_name: str = ""
    subscription_tier: SubscriptionTier = SubscriptionTier.FREE
    children: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Child(BaseModel):
    """Child account — Firestore document in 'children' collection.
    COPPA-compliant: no email, no real name stored."""

    id: str = ""
    parent_id: str = ""
    display_name: str = ""
    age: int = 5
    age_range: AgeRange = AgeRange.AGES_3_5
    avatar: str = "default"
    learning_style: str = "visual"
    current_week: int = 1
    total_stars: int = 0
    streak_days: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
