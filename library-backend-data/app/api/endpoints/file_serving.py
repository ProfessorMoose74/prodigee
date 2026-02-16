from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from pathlib import Path
import os
import mimetypes
import aiofiles
from datetime import datetime
import uuid

from app.core.database import get_db
from app.core.auth import get_child_or_parent, get_current_parent
from app.core.config import settings
from app.models import ContentLibrary, Parent
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Ensure content directories exist
os.makedirs(settings.CONTENT_STORAGE_PATH, exist_ok=True)
os.makedirs(settings.ASSETS_STORAGE_PATH, exist_ok=True)

ALLOWED_CONTENT_TYPES = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.json': 'application/json',
    '.txt': 'text/plain'
}


@router.get("/content/{filename:path}")
async def serve_content_file(
    filename: str,
    current_user: Dict[str, Any] = Depends(get_child_or_parent)
):
    """Serve content files - compatible with Flask backend /content/<path:filename>."""
    try:
        file_path = Path(settings.CONTENT_STORAGE_PATH) / filename
        
        # Security check - ensure file is within content directory
        if not str(file_path.resolve()).startswith(str(Path(settings.CONTENT_STORAGE_PATH).resolve())):
            raise HTTPException(status_code=403, detail="Access denied")
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        # Get MIME type
        mime_type, _ = mimetypes.guess_type(str(file_path))
        if not mime_type:
            file_ext = file_path.suffix.lower()
            mime_type = ALLOWED_CONTENT_TYPES.get(file_ext, 'application/octet-stream')
        
        # Log file access for analytics
        logger.info(f"File accessed: {filename} by user {current_user['user_id']}")
        
        return FileResponse(
            path=str(file_path),
            media_type=mime_type,
            filename=file_path.name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving content file {filename}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to serve file")


@router.get("/assets/{filename:path}")
async def serve_asset_file(
    filename: str,
    current_user: Dict[str, Any] = Depends(get_child_or_parent)
):
    """Serve asset files - compatible with Flask backend /assets/<path:filename>."""
    try:
        file_path = Path(settings.ASSETS_STORAGE_PATH) / filename
        
        # Security check
        if not str(file_path.resolve()).startswith(str(Path(settings.ASSETS_STORAGE_PATH).resolve())):
            raise HTTPException(status_code=403, detail="Access denied")
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        mime_type, _ = mimetypes.guess_type(str(file_path))
        if not mime_type:
            file_ext = file_path.suffix.lower()
            mime_type = ALLOWED_CONTENT_TYPES.get(file_ext, 'application/octet-stream')
        
        return FileResponse(
            path=str(file_path),
            media_type=mime_type,
            filename=file_path.name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving asset file {filename}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to serve file")


@router.post("/upload")
async def upload_content_file(
    file: UploadFile = File(...),
    content_type: str = Form(...),
    subject_area: str = Form(...),
    age_range: str = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    difficulty_level: str = Form("intermediate"),
    db: Session = Depends(get_db),
    current_parent: Parent = Depends(get_current_parent)
):
    """Upload content file - compatible with Flask backend POST /api/content/upload."""
    try:
        # Validate file type
        file_ext = Path(file.filename).suffix.lower() if file.filename else ""
        if file_ext not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=400, 
                detail=f"File type {file_ext} not allowed. Allowed types: {list(ALLOWED_CONTENT_TYPES.keys())}"
            )
        
        # Check file size
        if file.size and file.size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(status_code=413, detail="File too large")
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = Path(settings.CONTENT_STORAGE_PATH) / unique_filename
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Create database entry
        content_item = ContentLibrary(
            content_type=content_type,
            subject_area=subject_area,
            age_range=age_range,
            title=title,
            description=description,
            file_path=str(unique_filename),  # Store relative path
            difficulty_level=difficulty_level,
            download_priority=1,
            active=True
        )
        
        db.add(content_item)
        db.commit()
        db.refresh(content_item)
        
        logger.info(f"File uploaded: {unique_filename} by parent {current_parent.id}")
        
        return {
            "message": "File uploaded successfully",
            "content_id": content_item.id,
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_path": f"/content/{unique_filename}",
            "content_item": content_item
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        # Clean up file if database operation failed
        if 'file_path' in locals() and file_path.exists():
            try:
                os.remove(file_path)
            except:
                pass
        
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to upload file")


@router.get("/download/{content_id}")
async def download_content(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_child_or_parent)
):
    """Download content file by content ID."""
    content = db.query(ContentLibrary).filter(
        ContentLibrary.id == content_id,
        ContentLibrary.active == True
    ).first()
    
    if not content or not content.file_path:
        raise HTTPException(status_code=404, detail="Content file not found")
    
    file_path = Path(settings.CONTENT_STORAGE_PATH) / content.file_path
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Physical file not found")
    
    # Update download statistics
    content.usage_count = (content.usage_count or 0) + 1
    try:
        db.commit()
    except Exception as e:
        logger.warning(f"Could not update download count: {str(e)}")
        db.rollback()
    
    mime_type, _ = mimetypes.guess_type(str(file_path))
    if not mime_type:
        file_ext = file_path.suffix.lower()
        mime_type = ALLOWED_CONTENT_TYPES.get(file_ext, 'application/octet-stream')
    
    return FileResponse(
        path=str(file_path),
        media_type=mime_type,
        filename=f"{content.title}{file_path.suffix}",
        headers={"Content-Disposition": f"attachment; filename=\"{content.title}{file_path.suffix}\""}
    )


@router.delete("/content/{content_id}")
async def delete_content_file(
    content_id: int,
    db: Session = Depends(get_db),
    current_parent: Parent = Depends(get_current_parent)
):
    """Delete content file and database entry."""
    content = db.query(ContentLibrary).filter(ContentLibrary.id == content_id).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    try:
        # Delete physical file
        if content.file_path:
            file_path = Path(settings.CONTENT_STORAGE_PATH) / content.file_path
            if file_path.exists():
                os.remove(file_path)
        
        # Delete database entry
        db.delete(content)
        db.commit()
        
        logger.info(f"Content deleted: {content.title} by parent {current_parent.id}")
        
        return {"message": "Content deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting content: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete content")


@router.get("/file-info/{filename:path}")
async def get_file_info(
    filename: str,
    current_user: Dict[str, Any] = Depends(get_child_or_parent)
):
    """Get information about a file without downloading it."""
    try:
        file_path = Path(settings.CONTENT_STORAGE_PATH) / filename
        
        # Security check
        if not str(file_path.resolve()).startswith(str(Path(settings.CONTENT_STORAGE_PATH).resolve())):
            raise HTTPException(status_code=403, detail="Access denied")
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        stat = file_path.stat()
        mime_type, _ = mimetypes.guess_type(str(file_path))
        
        return {
            "filename": file_path.name,
            "size": stat.st_size,
            "mime_type": mime_type,
            "created": datetime.fromtimestamp(stat.st_ctime),
            "modified": datetime.fromtimestamp(stat.st_mtime),
            "path": filename
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file info for {filename}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get file information")