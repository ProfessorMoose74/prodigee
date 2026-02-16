from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from typing import Optional, List
from app.core.database import get_db
from app.models import Document, Content
from app.services.search import SearchService
from app.schemas.search import SearchRequest, SearchResponse, SearchResult
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/", response_model=SearchResponse)
async def search_content(
    request: SearchRequest,
    db: Session = Depends(get_db)
):
    try:
        search_service = SearchService(db)
        results = search_service.search(
            query=request.query,
            category=request.category,
            author=request.author,
            limit=request.limit,
            offset=request.offset
        )
        
        return SearchResponse(
            query=request.query,
            total=results["total"],
            results=results["items"],
            offset=request.offset,
            limit=request.limit
        )
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail="Search failed")


@router.get("/quick")
async def quick_search(
    q: str = Query(..., min_length=2, description="Search query"),
    category: Optional[str] = None,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(Document)
        
        if category:
            query = query.filter(Document.category == category)
        
        search_filter = or_(
            Document.title.ilike(f"%{q}%"),
            Document.author.ilike(f"%{q}%"),
            Document.description.ilike(f"%{q}%")
        )
        query = query.filter(search_filter)
        
        total = query.count()
        documents = query.limit(limit).all()
        
        return {
            "query": q,
            "total": total,
            "results": [
                {
                    "id": doc.id,
                    "title": doc.title,
                    "author": doc.author,
                    "category": doc.category,
                    "description": doc.description
                }
                for doc in documents
            ]
        }
    except Exception as e:
        logger.error(f"Quick search error: {str(e)}")
        raise HTTPException(status_code=500, detail="Search failed")


@router.get("/advanced")
async def advanced_search(
    title: Optional[str] = None,
    author: Optional[str] = None,
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    min_words: Optional[int] = None,
    max_words: Optional[int] = None,
    language: Optional[str] = None,
    sort_by: str = Query("relevance", regex="^(relevance|title|author|date|words)$"),
    order: str = Query("desc", regex="^(asc|desc)$"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(Document)
        
        if title:
            query = query.filter(Document.title.ilike(f"%{title}%"))
        if author:
            query = query.filter(Document.author.ilike(f"%{author}%"))
        if category:
            query = query.filter(Document.category == category)
        if subcategory:
            query = query.filter(Document.subcategory == subcategory)
        if min_words:
            query = query.filter(Document.word_count >= min_words)
        if max_words:
            query = query.filter(Document.word_count <= max_words)
        if language:
            query = query.filter(Document.language == language)
        
        sort_column = {
            "title": Document.title,
            "author": Document.author,
            "date": Document.created_at,
            "words": Document.word_count
        }.get(sort_by, Document.created_at)
        
        if order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        total = query.count()
        documents = query.offset(offset).limit(limit).all()
        
        return {
            "total": total,
            "offset": offset,
            "limit": limit,
            "results": [
                {
                    "id": doc.id,
                    "title": doc.title,
                    "author": doc.author,
                    "category": doc.category,
                    "subcategory": doc.subcategory,
                    "word_count": doc.word_count,
                    "language": doc.language,
                    "description": doc.description
                }
                for doc in documents
            ]
        }
    except Exception as e:
        logger.error(f"Advanced search error: {str(e)}")
        raise HTTPException(status_code=500, detail="Search failed")