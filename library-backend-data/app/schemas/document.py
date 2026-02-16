from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class DocumentBase(BaseModel):
    title: str = Field(..., max_length=500)
    author: Optional[str] = Field(None, max_length=300)
    category: str = Field(..., max_length=100)
    subcategory: Optional[str] = Field(None, max_length=100)
    publication_date: Optional[str] = Field(None, max_length=50)
    source: Optional[str] = Field(None, max_length=200)
    language: str = Field("en", max_length=10)
    description: Optional[str] = None
    metadata: Optional[str] = None


class DocumentCreate(DocumentBase):
    word_count: Optional[int] = 0


class DocumentUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    author: Optional[str] = Field(None, max_length=300)
    category: Optional[str] = Field(None, max_length=100)
    subcategory: Optional[str] = Field(None, max_length=100)
    publication_date: Optional[str] = Field(None, max_length=50)
    source: Optional[str] = Field(None, max_length=200)
    language: Optional[str] = Field(None, max_length=10)
    description: Optional[str] = None
    metadata: Optional[str] = None
    word_count: Optional[int] = None


class DocumentResponse(DocumentBase):
    id: int
    word_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True