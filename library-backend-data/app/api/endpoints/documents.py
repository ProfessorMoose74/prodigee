from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.models import Document
from app.schemas.document import DocumentCreate, DocumentResponse, DocumentUpdate
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=List[DocumentResponse])
async def get_documents(
    category: Optional[str] = None,
    author: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Document)
    
    if category:
        query = query.filter(Document.category == category)
    if author:
        query = query.filter(Document.author == author)
    
    documents = query.offset(offset).limit(limit).all()
    return documents


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.post("/", response_model=DocumentResponse)
async def create_document(
    document: DocumentCreate,
    db: Session = Depends(get_db)
):
    try:
        db_document = Document(**document.dict())
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        return db_document
    except Exception as e:
        logger.error(f"Error creating document: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create document")


@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    document_update: DocumentUpdate,
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    update_data = document_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(document, field, value)
    
    try:
        db.commit()
        db.refresh(document)
        return document
    except Exception as e:
        logger.error(f"Error updating document: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update document")


@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        db.delete(document)
        db.commit()
        return {"message": "Document deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete document")


@router.get("/random/")
async def get_random_document(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    from sqlalchemy.sql.expression import func
    
    query = db.query(Document)
    
    if category:
        query = query.filter(Document.category == category)
    
    document = query.order_by(func.random()).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="No documents found")
    
    return document