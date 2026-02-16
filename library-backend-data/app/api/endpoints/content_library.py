from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from pathlib import Path
import os
import json
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_user, get_current_parent, get_child_or_parent
from app.models import ContentLibrary, Child, Parent, Progress
from app.schemas.content_library import (
    ContentLibraryCreate, 
    ContentLibraryResponse, 
    ContentLibraryUpdate,
    ContentFilter
)
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=List[ContentLibraryResponse])
async def get_content_library(
    subject_area: Optional[str] = None,
    age_range: Optional[str] = None,
    content_type: Optional[str] = None,
    difficulty_level: Optional[str] = None,
    active_only: bool = True,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_child_or_parent)
):
    """Get content library with filtering - compatible with Flask backend /content endpoint."""
    try:
        query = db.query(ContentLibrary)
        
        if active_only:
            query = query.filter(ContentLibrary.active == True)
        
        if subject_area:
            query = query.filter(ContentLibrary.subject_area == subject_area)
        if age_range:
            query = query.filter(ContentLibrary.age_range == age_range)
        if content_type:
            query = query.filter(ContentLibrary.content_type == content_type)
        if difficulty_level:
            query = query.filter(ContentLibrary.difficulty_level == difficulty_level)
        
        # Order by download priority and usage for better user experience
        query = query.order_by(
            ContentLibrary.download_priority.desc(),
            ContentLibrary.usage_count.desc()
        )
        
        total = query.count()
        content_items = query.offset(offset).limit(limit).all()
        
        # Track content access for analytics
        for item in content_items:
            item.usage_count = (item.usage_count or 0) + 1
        
        try:
            db.commit()
        except Exception as e:
            logger.warning(f"Could not update usage count: {str(e)}")
            db.rollback()
        
        return content_items
        
    except Exception as e:
        logger.error(f"Error fetching content library: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch content library")


@router.get("/{content_id}", response_model=ContentLibraryResponse)
async def get_content_item(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_child_or_parent)
):
    """Get specific content item - compatible with Flask backend /content/<int:content_id>."""
    content = db.query(ContentLibrary).filter(
        ContentLibrary.id == content_id,
        ContentLibrary.active == True
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Update usage statistics
    content.usage_count = (content.usage_count or 0) + 1
    try:
        db.commit()
    except Exception as e:
        logger.warning(f"Could not update usage count: {str(e)}")
        db.rollback()
    
    return content


@router.post("/", response_model=ContentLibraryResponse)
async def create_content(
    content: ContentLibraryCreate,
    db: Session = Depends(get_db),
    current_parent: Parent = Depends(get_current_parent)
):
    """Create new content - compatible with Flask backend POST /content."""
    try:
        db_content = ContentLibrary(**content.dict())
        db.add(db_content)
        db.commit()
        db.refresh(db_content)
        
        logger.info(f"Content created: {db_content.title} by parent {current_parent.id}")
        return db_content
        
    except Exception as e:
        logger.error(f"Error creating content: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create content")


@router.put("/{content_id}", response_model=ContentLibraryResponse)
async def update_content(
    content_id: int,
    content_update: ContentLibraryUpdate,
    db: Session = Depends(get_db),
    current_parent: Parent = Depends(get_current_parent)
):
    """Update content item."""
    content = db.query(ContentLibrary).filter(ContentLibrary.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    update_data = content_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(content, field, value)
    
    content.updated_at = datetime.utcnow()
    
    try:
        db.commit()
        db.refresh(content)
        return content
    except Exception as e:
        logger.error(f"Error updating content: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update content")


@router.get("/child/{child_id}/recommendations")
async def get_child_recommendations(
    child_id: int,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_child_or_parent)
):
    """Get personalized content recommendations for a child."""
    from app.core.auth import verify_child_parent_access
    
    # Verify access rights
    if not verify_child_parent_access(child_id, current_user, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Get child's learning profile
    age = child.age or 6
    grade_level = child.grade_level or "K-2"
    difficulty_adjustment = child.ai_difficulty_adjustment or 1.0
    
    # Map age to age range
    if age <= 5:
        age_range = "3-5"
    elif age <= 8:
        age_range = "6-8"
    elif age <= 12:
        age_range = "9-12"
    else:
        age_range = "13+"
    
    # Get child's progress data
    completed_content = db.query(Progress.content_id).filter(
        Progress.child_id == child_id,
        Progress.accuracy_percentage >= 80  # Mastered content
    ).subquery()
    
    # Build recommendation query
    query = db.query(ContentLibrary).filter(
        ContentLibrary.active == True,
        ContentLibrary.age_range == age_range,
        ~ContentLibrary.id.in_(completed_content)  # Exclude mastered content
    )
    
    # Adjust difficulty based on child's AI adjustment
    if difficulty_adjustment < 0.8:
        query = query.filter(ContentLibrary.difficulty_level.in_(["beginner", "intermediate"]))
    elif difficulty_adjustment > 1.2:
        query = query.filter(ContentLibrary.difficulty_level.in_(["intermediate", "advanced"]))
    
    # Order by priority and success rate
    recommendations = query.order_by(
        ContentLibrary.download_priority.desc(),
        ContentLibrary.success_rate.desc()
    ).limit(limit).all()
    
    # Add recommendation reasoning
    for item in recommendations:
        item.recommendation_reason = f"Recommended based on age {age}, difficulty adjustment {difficulty_adjustment:.2f}"
    
    return {
        "child_id": child_id,
        "child_name": child.name,
        "recommendations": recommendations,
        "based_on": {
            "age": age,
            "age_range": age_range,
            "difficulty_adjustment": difficulty_adjustment,
            "completed_activities": completed_content.count() if hasattr(completed_content, 'count') else 0
        }
    }


@router.get("/subjects")
async def get_subjects(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_child_or_parent)
):
    """Get available subject areas."""
    try:
        subjects = db.query(ContentLibrary.subject_area).filter(
            ContentLibrary.active == True
        ).distinct().all()
        
        subject_stats = {}
        for subject_tuple in subjects:
            subject = subject_tuple[0]
            count = db.query(ContentLibrary).filter(
                ContentLibrary.subject_area == subject,
                ContentLibrary.active == True
            ).count()
            subject_stats[subject] = count
        
        return {
            "subjects": list(subject_stats.keys()),
            "subject_counts": subject_stats
        }
        
    except Exception as e:
        logger.error(f"Error fetching subjects: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch subjects")


@router.get("/age-ranges")
async def get_age_ranges(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_child_or_parent)
):
    """Get available age ranges."""
    try:
        age_ranges = db.query(ContentLibrary.age_range).filter(
            ContentLibrary.active == True
        ).distinct().all()
        
        age_range_stats = {}
        for age_tuple in age_ranges:
            age_range = age_tuple[0]
            count = db.query(ContentLibrary).filter(
                ContentLibrary.age_range == age_range,
                ContentLibrary.active == True
            ).count()
            age_range_stats[age_range] = count
        
        return {
            "age_ranges": list(age_range_stats.keys()),
            "age_range_counts": age_range_stats
        }
        
    except Exception as e:
        logger.error(f"Error fetching age ranges: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch age ranges")


@router.get("/content-types")
async def get_content_types(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_child_or_parent)
):
    """Get available content types."""
    try:
        content_types = db.query(ContentLibrary.content_type).filter(
            ContentLibrary.active == True
        ).distinct().all()
        
        type_stats = {}
        for type_tuple in content_types:
            content_type = type_tuple[0]
            count = db.query(ContentLibrary).filter(
                ContentLibrary.content_type == content_type,
                ContentLibrary.active == True
            ).count()
            type_stats[content_type] = count
        
        return {
            "content_types": list(type_stats.keys()),
            "content_type_counts": type_stats
        }
        
    except Exception as e:
        logger.error(f"Error fetching content types: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch content types")