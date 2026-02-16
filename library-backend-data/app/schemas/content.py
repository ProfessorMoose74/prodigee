from pydantic import BaseModel
from typing import Optional, List


class ContentSection(BaseModel):
    id: int
    section_number: int
    section_title: Optional[str]
    content: Optional[str]
    word_count: int


class ContentResponse(BaseModel):
    document_id: int
    document_title: str
    author: Optional[str]
    category: str
    sections: List[ContentSection]
    total_sections: int
    total_words: int