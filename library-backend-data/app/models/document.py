from sqlalchemy import Column, Integer, String, DateTime, Text, Index, func
from sqlalchemy.dialects.postgresql import TSVECTOR
from datetime import datetime
from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    author = Column(String(300), index=True)
    category = Column(String(100), nullable=False, index=True)
    subcategory = Column(String(100))
    publication_date = Column(String(50))
    source = Column(String(200))
    word_count = Column(Integer, default=0)
    language = Column(String(10), default="en")
    description = Column(Text)
    metadata = Column(Text)
    
    search_vector = Column(TSVECTOR)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_document_search', 'search_vector', postgresql_using='gin'),
        Index('idx_document_category_author', 'category', 'author'),
        Index('idx_document_created', 'created_at'),
    )