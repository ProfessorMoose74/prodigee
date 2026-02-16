from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.models import User, UserProgress, UserPreferences, UserBookmark
from app.schemas.user import UserCreate, UserProgressUpdate, UserPreferencesUpdate, BookmarkCreate
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user_id": user.user_id,
        "created_at": user.created_at,
        "last_active": user.last_active
    }


@router.post("/")
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(User.user_id == user_data.user_id).first()
    if existing_user:
        existing_user.last_active = datetime.utcnow()
        db.commit()
        return existing_user
    
    user = User(
        user_id=user_data.user_id,
        session_token=user_data.session_token
    )
    db.add(user)
    
    preferences = UserPreferences(
        user_id=user_data.user_id,
        difficulty_level="intermediate",
        learning_style="visual"
    )
    db.add(preferences)
    
    try:
        db.commit()
        db.refresh(user)
        return user
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create user")


@router.get("/{user_id}/progress")
async def get_user_progress(
    user_id: str,
    document_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(UserProgress).filter(UserProgress.user_id == user_id)
    
    if document_id:
        query = query.filter(UserProgress.document_id == document_id)
    
    progress = query.all()
    
    return {
        "user_id": user_id,
        "progress": [
            {
                "document_id": p.document_id,
                "section_id": p.section_id,
                "progress_percentage": p.progress_percentage,
                "last_position": p.last_position,
                "updated_at": p.updated_at
            }
            for p in progress
        ]
    }


@router.put("/{user_id}/progress")
async def update_user_progress(
    user_id: str,
    progress_update: UserProgressUpdate,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.document_id == progress_update.document_id
    ).first()
    
    if progress:
        progress.section_id = progress_update.section_id
        progress.progress_percentage = progress_update.progress_percentage
        progress.last_position = progress_update.last_position
        progress.updated_at = datetime.utcnow()
    else:
        progress = UserProgress(
            user_id=user_id,
            document_id=progress_update.document_id,
            section_id=progress_update.section_id,
            progress_percentage=progress_update.progress_percentage,
            last_position=progress_update.last_position
        )
        db.add(progress)
    
    user.last_active = datetime.utcnow()
    
    try:
        db.commit()
        db.refresh(progress)
        return progress
    except Exception as e:
        logger.error(f"Error updating progress: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update progress")


@router.get("/{user_id}/preferences")
async def get_user_preferences(
    user_id: str,
    db: Session = Depends(get_db)
):
    preferences = db.query(UserPreferences).filter(UserPreferences.user_id == user_id).first()
    if not preferences:
        raise HTTPException(status_code=404, detail="User preferences not found")
    return preferences


@router.put("/{user_id}/preferences")
async def update_user_preferences(
    user_id: str,
    preferences_update: UserPreferencesUpdate,
    db: Session = Depends(get_db)
):
    preferences = db.query(UserPreferences).filter(UserPreferences.user_id == user_id).first()
    if not preferences:
        raise HTTPException(status_code=404, detail="User preferences not found")
    
    update_data = preferences_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(preferences, field, value)
    
    preferences.updated_at = datetime.utcnow()
    
    try:
        db.commit()
        db.refresh(preferences)
        return preferences
    except Exception as e:
        logger.error(f"Error updating preferences: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update preferences")


@router.get("/{user_id}/bookmarks")
async def get_user_bookmarks(
    user_id: str,
    db: Session = Depends(get_db)
):
    bookmarks = db.query(UserBookmark).filter(UserBookmark.user_id == user_id).all()
    return {
        "user_id": user_id,
        "bookmarks": [
            {
                "id": b.id,
                "document_id": b.document_id,
                "section_id": b.section_id,
                "bookmark_name": b.bookmark_name,
                "notes": b.notes,
                "position": b.position,
                "created_at": b.created_at
            }
            for b in bookmarks
        ]
    }


@router.post("/{user_id}/bookmarks")
async def create_bookmark(
    user_id: str,
    bookmark_data: BookmarkCreate,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    bookmark = UserBookmark(
        user_id=user_id,
        document_id=bookmark_data.document_id,
        section_id=bookmark_data.section_id,
        bookmark_name=bookmark_data.bookmark_name,
        notes=bookmark_data.notes,
        position=bookmark_data.position
    )
    
    db.add(bookmark)
    
    try:
        db.commit()
        db.refresh(bookmark)
        return bookmark
    except Exception as e:
        logger.error(f"Error creating bookmark: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create bookmark")


@router.delete("/{user_id}/bookmarks/{bookmark_id}")
async def delete_bookmark(
    user_id: str,
    bookmark_id: int,
    db: Session = Depends(get_db)
):
    bookmark = db.query(UserBookmark).filter(
        UserBookmark.id == bookmark_id,
        UserBookmark.user_id == user_id
    ).first()
    
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    try:
        db.delete(bookmark)
        db.commit()
        return {"message": "Bookmark deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting bookmark: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete bookmark")