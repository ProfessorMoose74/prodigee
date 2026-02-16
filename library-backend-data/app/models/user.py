from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class User(Base):
    __tablename__ = "users"
    
    user_id = Column(String(100), primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)
    session_token = Column(String(500))
    
    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")
    bookmarks = relationship("UserBookmark", back_populates="user", cascade="all, delete-orphan")


class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("content.id"))
    progress_percentage = Column(Float, default=0.0)
    last_position = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="progress")
    document = relationship("Document")
    section = relationship("Content")


class UserPreferences(Base):
    __tablename__ = "user_preferences"
    
    user_id = Column(String(100), ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    difficulty_level = Column(String(50), default="intermediate")
    interface_settings = Column(JSON)
    avatar_preferences = Column(JSON)
    learning_style = Column(String(50), default="visual")
    reading_speed = Column(String(50), default="normal")
    font_size = Column(String(20), default="medium")
    theme = Column(String(20), default="light")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="preferences")


class UserBookmark(Base):
    __tablename__ = "user_bookmarks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("content.id"))
    bookmark_name = Column(String(200))
    notes = Column(Text)
    position = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="bookmarks")
    document = relationship("Document")
    section = relationship("Content")