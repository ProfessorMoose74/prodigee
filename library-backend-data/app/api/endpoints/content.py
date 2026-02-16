from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.models import Document, Content
from app.schemas.content import ContentResponse, ContentSection
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/{document_id}")
async def get_document_content(
    document_id: int,
    section: Optional[int] = None,
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if section is not None:
        content = db.query(Content).filter(
            Content.document_id == document_id,
            Content.section_number == section
        ).first()
        
        if not content:
            raise HTTPException(status_code=404, detail="Section not found")
        
        return {
            "document_id": document_id,
            "document_title": document.title,
            "section": {
                "id": content.id,
                "section_number": content.section_number,
                "section_title": content.section_title,
                "content": content.content_text,
                "word_count": content.word_count
            }
        }
    
    contents = db.query(Content).filter(
        Content.document_id == document_id
    ).order_by(Content.section_number).all()
    
    return {
        "document_id": document_id,
        "document_title": document.title,
        "author": document.author,
        "category": document.category,
        "total_sections": len(contents),
        "total_words": document.word_count,
        "sections": [
            {
                "id": c.id,
                "section_number": c.section_number,
                "section_title": c.section_title,
                "word_count": c.word_count
            }
            for c in contents
        ]
    }


@router.get("/{document_id}/passage")
async def get_passage(
    document_id: int,
    start_section: int = Query(..., ge=0),
    end_section: Optional[int] = None,
    start_position: Optional[int] = None,
    end_position: Optional[int] = None,
    context_words: int = Query(50, ge=0, le=500),
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    query = db.query(Content).filter(Content.document_id == document_id)
    
    if end_section is not None:
        query = query.filter(
            Content.section_number >= start_section,
            Content.section_number <= end_section
        )
    else:
        query = query.filter(Content.section_number == start_section)
    
    contents = query.order_by(Content.section_number).all()
    
    if not contents:
        raise HTTPException(status_code=404, detail="Content sections not found")
    
    combined_text = " ".join([c.content_text for c in contents])
    
    if start_position is not None and end_position is not None:
        passage = combined_text[start_position:end_position]
    else:
        passage = combined_text
    
    words = passage.split()
    word_count = len(words)
    
    return {
        "document_id": document_id,
        "document_title": document.title,
        "start_section": start_section,
        "end_section": end_section or start_section,
        "passage": passage,
        "word_count": word_count,
        "context": {
            "before": combined_text[max(0, (start_position or 0) - context_words):(start_position or 0)] if start_position else "",
            "after": combined_text[(end_position or len(passage)):(end_position or len(passage)) + context_words] if end_position else ""
        }
    }


@router.get("/{document_id}/random")
async def get_random_passage(
    document_id: int,
    max_words: int = Query(500, ge=50, le=2000),
    db: Session = Depends(get_db)
):
    import random
    
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    contents = db.query(Content).filter(
        Content.document_id == document_id
    ).all()
    
    if not contents:
        raise HTTPException(status_code=404, detail="No content available")
    
    random_content = random.choice(contents)
    text = random_content.content_text
    words = text.split()
    
    if len(words) > max_words:
        start_idx = random.randint(0, max(0, len(words) - max_words))
        selected_words = words[start_idx:start_idx + max_words]
        passage = " ".join(selected_words)
    else:
        passage = text
    
    return {
        "document_id": document_id,
        "document_title": document.title,
        "section_id": random_content.id,
        "section_number": random_content.section_number,
        "section_title": random_content.section_title,
        "passage": passage,
        "word_count": len(passage.split())
    }