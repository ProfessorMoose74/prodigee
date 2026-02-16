from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, text
from typing import Optional, List, Dict, Any
from app.models import Document, Content
from app.schemas.search import SearchResult
import logging

logger = logging.getLogger(__name__)


class SearchService:
    def __init__(self, db: Session):
        self.db = db
    
    def search(
        self,
        query: str,
        category: Optional[str] = None,
        author: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
        use_fulltext: bool = True
    ) -> Dict[str, Any]:
        try:
            if use_fulltext:
                return self._fulltext_search(query, category, author, limit, offset)
            else:
                return self._basic_search(query, category, author, limit, offset)
        except Exception as e:
            logger.error(f"Search error: {str(e)}")
            return {"total": 0, "items": []}
    
    def _fulltext_search(
        self,
        query: str,
        category: Optional[str] = None,
        author: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        search_query = func.to_tsquery('english', self._prepare_tsquery(query))
        
        base_query = self.db.query(
            Document.id,
            Document.title,
            Document.author,
            Document.category,
            Document.description,
            Document.word_count,
            func.ts_rank(Document.search_vector, search_query).label('rank')
        ).filter(
            Document.search_vector.match(self._prepare_tsquery(query))
        )
        
        if category:
            base_query = base_query.filter(Document.category == category)
        if author:
            base_query = base_query.filter(Document.author.ilike(f"%{author}%"))
        
        base_query = base_query.order_by(text('rank DESC'))
        
        total = base_query.count()
        results = base_query.offset(offset).limit(limit).all()
        
        items = []
        for r in results:
            items.append(SearchResult(
                id=r.id,
                title=r.title,
                author=r.author,
                category=r.category,
                description=r.description,
                word_count=r.word_count,
                relevance_score=float(r.rank) if r.rank else 0.0
            ))
        
        return {"total": total, "items": items}
    
    def _basic_search(
        self,
        query: str,
        category: Optional[str] = None,
        author: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        base_query = self.db.query(Document)
        
        search_filter = or_(
            Document.title.ilike(f"%{query}%"),
            Document.author.ilike(f"%{query}%"),
            Document.description.ilike(f"%{query}%")
        )
        base_query = base_query.filter(search_filter)
        
        if category:
            base_query = base_query.filter(Document.category == category)
        if author:
            base_query = base_query.filter(Document.author.ilike(f"%{author}%"))
        
        total = base_query.count()
        documents = base_query.offset(offset).limit(limit).all()
        
        items = []
        for doc in documents:
            items.append(SearchResult(
                id=doc.id,
                title=doc.title,
                author=doc.author,
                category=doc.category,
                description=doc.description,
                word_count=doc.word_count
            ))
        
        return {"total": total, "items": items}
    
    def _prepare_tsquery(self, query: str) -> str:
        tokens = query.split()
        return ' & '.join(tokens)
    
    def search_content(
        self,
        query: str,
        document_id: Optional[int] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        base_query = self.db.query(Content)
        
        if document_id:
            base_query = base_query.filter(Content.document_id == document_id)
        
        base_query = base_query.filter(
            Content.content_text.ilike(f"%{query}%")
        ).limit(limit)
        
        results = base_query.all()
        
        return [
            {
                "content_id": r.id,
                "document_id": r.document_id,
                "section_title": r.section_title,
                "section_number": r.section_number,
                "excerpt": self._extract_excerpt(r.content_text, query)
            }
            for r in results
        ]
    
    def _extract_excerpt(self, text: str, query: str, context_chars: int = 150) -> str:
        lower_text = text.lower()
        lower_query = query.lower()
        
        pos = lower_text.find(lower_query)
        if pos == -1:
            return text[:context_chars * 2]
        
        start = max(0, pos - context_chars)
        end = min(len(text), pos + len(query) + context_chars)
        
        excerpt = text[start:end]
        
        if start > 0:
            excerpt = "..." + excerpt
        if end < len(text):
            excerpt = excerpt + "..."
        
        return excerpt