from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500)
    category: Optional[str] = None
    author: Optional[str] = None
    limit: int = Field(20, ge=1, le=100)
    offset: int = Field(0, ge=0)
    filters: Optional[Dict[str, Any]] = None


class SearchResult(BaseModel):
    id: int
    title: str
    author: Optional[str]
    category: str
    description: Optional[str]
    relevance_score: Optional[float] = None
    word_count: Optional[int] = None
    excerpt: Optional[str] = None


class SearchResponse(BaseModel):
    query: str
    total: int
    results: List[SearchResult]
    offset: int
    limit: int
    processing_time: Optional[float] = None