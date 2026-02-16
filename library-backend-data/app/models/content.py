from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Index
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Content(Base):
    __tablename__ = "content"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    section_title = Column(String(500))
    section_number = Column(Integer, default=0)
    content_text = Column(Text, nullable=False)
    word_count = Column(Integer, default=0)
    
    search_vector = Column(TSVECTOR)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    document = relationship("Document", backref="contents")
    
    __table_args__ = (
        Index('idx_content_document', 'document_id'),
        Index('idx_content_search', 'search_vector', postgresql_using='gin'),
        Index('idx_content_section', 'document_id', 'section_number'),
    )