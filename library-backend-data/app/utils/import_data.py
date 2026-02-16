import os
import json
import re
from pathlib import Path
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models import Document, Content
from app.core.database import SessionLocal
import logging
import xml.etree.ElementTree as ET
from datetime import datetime

logger = logging.getLogger(__name__)


class DataImporter:
    def __init__(self, db: Session = None):
        self.db = db or SessionLocal()
        self.batch_size = 100
        self.imported_count = 0
        self.error_count = 0
    
    def import_gutenberg_file(self, file_path: str, category: str = "Literature") -> bool:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            metadata = self._extract_gutenberg_metadata(content)
            title = metadata.get('title', Path(file_path).stem)
            author = metadata.get('author', 'Unknown')
            
            document = Document(
                title=title,
                author=author,
                category=category,
                subcategory="Classic Literature",
                source="Project Gutenberg",
                language=metadata.get('language', 'en'),
                publication_date=metadata.get('publication_date'),
                description=metadata.get('description'),
                metadata=json.dumps(metadata)
            )
            
            self.db.add(document)
            self.db.flush()
            
            sections = self._split_into_chapters(content)
            total_words = 0
            
            for i, section in enumerate(sections):
                words = len(section['text'].split())
                total_words += words
                
                content_obj = Content(
                    document_id=document.id,
                    section_title=section['title'],
                    section_number=i,
                    content_text=section['text'],
                    word_count=words
                )
                self.db.add(content_obj)
            
            document.word_count = total_words
            self._update_search_vectors(document.id)
            
            self.db.commit()
            self.imported_count += 1
            logger.info(f"Imported: {title} by {author}")
            return True
            
        except Exception as e:
            logger.error(f"Error importing {file_path}: {str(e)}")
            self.db.rollback()
            self.error_count += 1
            return False
    
    def _extract_gutenberg_metadata(self, content: str) -> Dict[str, Any]:
        metadata = {}
        
        title_match = re.search(r'Title:\s*(.+?)(?:\n|$)', content, re.IGNORECASE)
        if title_match:
            metadata['title'] = title_match.group(1).strip()
        
        author_match = re.search(r'Author:\s*(.+?)(?:\n|$)', content, re.IGNORECASE)
        if author_match:
            metadata['author'] = author_match.group(1).strip()
        
        date_match = re.search(r'Release Date:\s*(.+?)(?:\n|$)', content, re.IGNORECASE)
        if date_match:
            metadata['publication_date'] = date_match.group(1).strip()
        
        language_match = re.search(r'Language:\s*(.+?)(?:\n|$)', content, re.IGNORECASE)
        if language_match:
            metadata['language'] = language_match.group(1).strip()[:2].lower()
        
        start_match = re.search(r'\*\*\* START OF (THIS|THE) PROJECT GUTENBERG', content)
        if start_match:
            metadata['content_start'] = start_match.end()
        
        end_match = re.search(r'\*\*\* END OF (THIS|THE) PROJECT GUTENBERG', content)
        if end_match:
            metadata['content_end'] = end_match.start()
        
        return metadata
    
    def _split_into_chapters(self, content: str) -> List[Dict[str, str]]:
        metadata = self._extract_gutenberg_metadata(content)
        start = metadata.get('content_start', 0)
        end = metadata.get('content_end', len(content))
        main_content = content[start:end]
        
        chapter_pattern = re.compile(
            r'(CHAPTER|Chapter|BOOK|Book|PART|Part)\s+([IVXLCDM]+|\d+)[^\n]*',
            re.MULTILINE
        )
        
        chapters = []
        matches = list(chapter_pattern.finditer(main_content))
        
        if not matches:
            return [{"title": "Full Text", "text": main_content.strip()}]
        
        for i, match in enumerate(matches):
            chapter_title = match.group(0).strip()
            chapter_start = match.end()
            
            if i < len(matches) - 1:
                chapter_end = matches[i + 1].start()
            else:
                chapter_end = len(main_content)
            
            chapter_text = main_content[chapter_start:chapter_end].strip()
            
            if chapter_text:
                chapters.append({
                    "title": chapter_title,
                    "text": chapter_text
                })
        
        return chapters
    
    def import_bible_xml(self, file_path: str) -> bool:
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()
            
            document = Document(
                title="Geneva Bible",
                author="Various",
                category="Religious",
                subcategory="Bible",
                source="Geneva Bible Translation",
                language="en",
                publication_date="1599",
                description="The Geneva Bible translation"
            )
            
            self.db.add(document)
            self.db.flush()
            
            total_words = 0
            section_num = 0
            
            for book in root.findall('.//book'):
                book_name = book.get('name', 'Unknown Book')
                
                for chapter in book.findall('.//chapter'):
                    chapter_num = chapter.get('number', '0')
                    verses = []
                    
                    for verse in chapter.findall('.//verse'):
                        verse_num = verse.get('number', '0')
                        verse_text = verse.text or ''
                        verses.append(f"{verse_num}. {verse_text}")
                    
                    chapter_text = '\n'.join(verses)
                    words = len(chapter_text.split())
                    total_words += words
                    
                    content_obj = Content(
                        document_id=document.id,
                        section_title=f"{book_name} - Chapter {chapter_num}",
                        section_number=section_num,
                        content_text=chapter_text,
                        word_count=words
                    )
                    self.db.add(content_obj)
                    section_num += 1
            
            document.word_count = total_words
            self._update_search_vectors(document.id)
            
            self.db.commit()
            self.imported_count += 1
            logger.info(f"Imported Geneva Bible with {section_num} chapters")
            return True
            
        except Exception as e:
            logger.error(f"Error importing Bible XML: {str(e)}")
            self.db.rollback()
            self.error_count += 1
            return False
    
    def import_founding_documents(self, directory: str) -> bool:
        documents_info = {
            "declaration.txt": {
                "title": "Declaration of Independence",
                "author": "Thomas Jefferson et al.",
                "date": "1776"
            },
            "constitution.txt": {
                "title": "U.S. Constitution",
                "author": "Constitutional Convention",
                "date": "1787"
            },
            "federalist_papers": {
                "title": "The Federalist Papers",
                "author": "Hamilton, Madison, Jay",
                "date": "1787-1788"
            }
        }
        
        success_count = 0
        
        for filename, info in documents_info.items():
            file_path = os.path.join(directory, filename)
            
            if os.path.exists(file_path):
                if self._import_historical_document(file_path, info):
                    success_count += 1
            elif os.path.isdir(os.path.join(directory, filename)):
                if self._import_federalist_papers(os.path.join(directory, filename), info):
                    success_count += 1
        
        return success_count > 0
    
    def _import_historical_document(self, file_path: str, info: Dict[str, str]) -> bool:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            document = Document(
                title=info['title'],
                author=info['author'],
                category="Historical",
                subcategory="Founding Documents",
                source="U.S. Government Archives",
                language="en",
                publication_date=info['date'],
                description=f"Founding document of the United States"
            )
            
            self.db.add(document)
            self.db.flush()
            
            sections = self._split_into_sections(content)
            total_words = 0
            
            for i, section in enumerate(sections):
                words = len(section['text'].split())
                total_words += words
                
                content_obj = Content(
                    document_id=document.id,
                    section_title=section['title'],
                    section_number=i,
                    content_text=section['text'],
                    word_count=words
                )
                self.db.add(content_obj)
            
            document.word_count = total_words
            self._update_search_vectors(document.id)
            
            self.db.commit()
            self.imported_count += 1
            logger.info(f"Imported: {info['title']}")
            return True
            
        except Exception as e:
            logger.error(f"Error importing {file_path}: {str(e)}")
            self.db.rollback()
            self.error_count += 1
            return False
    
    def _split_into_sections(self, content: str) -> List[Dict[str, str]]:
        sections = []
        
        article_pattern = re.compile(r'(Article|ARTICLE|Section|SECTION)\s+([IVXLCDM]+|\d+)[^\n]*', re.MULTILINE)
        matches = list(article_pattern.finditer(content))
        
        if not matches:
            paragraphs = content.split('\n\n')
            for i, para in enumerate(paragraphs):
                if para.strip():
                    sections.append({
                        "title": f"Section {i + 1}",
                        "text": para.strip()
                    })
        else:
            for i, match in enumerate(matches):
                section_title = match.group(0).strip()
                section_start = match.end()
                
                if i < len(matches) - 1:
                    section_end = matches[i + 1].start()
                else:
                    section_end = len(content)
                
                section_text = content[section_start:section_end].strip()
                
                if section_text:
                    sections.append({
                        "title": section_title,
                        "text": section_text
                    })
        
        return sections
    
    def _import_federalist_papers(self, directory: str, info: Dict[str, str]) -> bool:
        try:
            document = Document(
                title=info['title'],
                author=info['author'],
                category="Historical",
                subcategory="Founding Documents",
                source="U.S. Government Archives",
                language="en",
                publication_date=info['date'],
                description="Essays promoting the ratification of the United States Constitution"
            )
            
            self.db.add(document)
            self.db.flush()
            
            total_words = 0
            paper_files = sorted(Path(directory).glob("*.txt"))
            
            for i, paper_file in enumerate(paper_files):
                with open(paper_file, 'r', encoding='utf-8') as f:
                    paper_content = f.read()
                
                paper_num = re.search(r'\d+', paper_file.stem)
                paper_title = f"Federalist No. {paper_num.group() if paper_num else i + 1}"
                
                words = len(paper_content.split())
                total_words += words
                
                content_obj = Content(
                    document_id=document.id,
                    section_title=paper_title,
                    section_number=i,
                    content_text=paper_content,
                    word_count=words
                )
                self.db.add(content_obj)
            
            document.word_count = total_words
            self._update_search_vectors(document.id)
            
            self.db.commit()
            self.imported_count += 1
            logger.info(f"Imported {len(paper_files)} Federalist Papers")
            return True
            
        except Exception as e:
            logger.error(f"Error importing Federalist Papers: {str(e)}")
            self.db.rollback()
            self.error_count += 1
            return False
    
    def _update_search_vectors(self, document_id: int):
        try:
            self.db.execute(
                """
                UPDATE documents 
                SET search_vector = to_tsvector('english', 
                    coalesce(title, '') || ' ' || 
                    coalesce(author, '') || ' ' || 
                    coalesce(description, '')
                )
                WHERE id = :doc_id
                """,
                {"doc_id": document_id}
            )
            
            self.db.execute(
                """
                UPDATE content 
                SET search_vector = to_tsvector('english', 
                    coalesce(section_title, '') || ' ' || 
                    coalesce(content_text, '')
                )
                WHERE document_id = :doc_id
                """,
                {"doc_id": document_id}
            )
        except Exception as e:
            logger.warning(f"Could not update search vectors: {str(e)}")
    
    def get_import_stats(self) -> Dict[str, int]:
        return {
            "imported": self.imported_count,
            "errors": self.error_count,
            "total": self.imported_count + self.error_count
        }