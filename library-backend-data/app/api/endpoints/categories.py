from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from typing import List
from app.core.database import get_db
from app.models import Document
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/")
async def get_categories(
    db: Session = Depends(get_db)
):
    try:
        categories = db.query(
            Document.category,
            func.count(Document.id).label("document_count"),
            func.sum(Document.word_count).label("total_words")
        ).group_by(Document.category).all()
        
        return {
            "categories": [
                {
                    "name": cat.category,
                    "document_count": cat.document_count,
                    "total_words": cat.total_words or 0
                }
                for cat in categories
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch categories")


@router.get("/{category}/subcategories")
async def get_subcategories(
    category: str,
    db: Session = Depends(get_db)
):
    try:
        subcategories = db.query(
            Document.subcategory,
            func.count(Document.id).label("document_count")
        ).filter(
            Document.category == category,
            Document.subcategory.isnot(None)
        ).group_by(Document.subcategory).all()
        
        return {
            "category": category,
            "subcategories": [
                {
                    "name": sub.subcategory,
                    "document_count": sub.document_count
                }
                for sub in subcategories
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching subcategories: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch subcategories")


@router.get("/{category}/authors")
async def get_category_authors(
    category: str,
    db: Session = Depends(get_db)
):
    try:
        authors = db.query(
            Document.author,
            func.count(Document.id).label("document_count")
        ).filter(
            Document.category == category,
            Document.author.isnot(None)
        ).group_by(Document.author).order_by(func.count(Document.id).desc()).all()
        
        return {
            "category": category,
            "authors": [
                {
                    "name": author.author,
                    "document_count": author.document_count
                }
                for author in authors
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching authors: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch authors")


@router.get("/stats")
async def get_category_stats(
    db: Session = Depends(get_db)
):
    try:
        total_documents = db.query(func.count(Document.id)).scalar()
        total_words = db.query(func.sum(Document.word_count)).scalar() or 0
        total_authors = db.query(func.count(distinct(Document.author))).scalar()
        total_categories = db.query(func.count(distinct(Document.category))).scalar()
        
        category_breakdown = db.query(
            Document.category,
            func.count(Document.id).label("count"),
            func.avg(Document.word_count).label("avg_words")
        ).group_by(Document.category).all()
        
        return {
            "total_documents": total_documents,
            "total_words": total_words,
            "total_authors": total_authors,
            "total_categories": total_categories,
            "categories": [
                {
                    "name": cat.category,
                    "document_count": cat.count,
                    "average_word_count": int(cat.avg_words) if cat.avg_words else 0
                }
                for cat in category_breakdown
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch statistics")