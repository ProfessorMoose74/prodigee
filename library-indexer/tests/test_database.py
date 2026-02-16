import pytest
import tempfile
import sqlite3
from pathlib import Path
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from digital_library_system import LibraryDatabase


class TestLibraryDatabase:
    @pytest.fixture
    def temp_db(self):
        """Create a temporary database for testing."""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp:
            db_path = Path(tmp.name)
        
        db = LibraryDatabase(db_path)
        yield db
        
        # Cleanup
        if db_path.exists():
            db_path.unlink()
    
    def test_database_creation(self, temp_db):
        """Test that database tables are created correctly."""
        with temp_db._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='downloads'")
            result = cursor.fetchone()
            assert result is not None
            assert result[0] == 'downloads'
    
    def test_add_download_entry(self, temp_db):
        """Test adding a new download entry."""
        result = temp_db.add_download_entry('test_source', 'http://example.com/file1.txt', '{"test": "data"}')
        assert result is True
        
        # Verify entry was added
        with temp_db._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT source, url, metadata FROM downloads WHERE url = ?", ('http://example.com/file1.txt',))
            row = cursor.fetchone()
            assert row is not None
            assert row[0] == 'test_source'
            assert row[1] == 'http://example.com/file1.txt'
            assert row[2] == '{"test": "data"}'
    
    def test_duplicate_url_prevention(self, temp_db):
        """Test that duplicate URLs are not added."""
        temp_db.add_download_entry('source1', 'http://example.com/duplicate.txt')
        result = temp_db.add_download_entry('source2', 'http://example.com/duplicate.txt')
        assert result is False
        
        # Verify only one entry exists
        with temp_db._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM downloads WHERE url = ?", ('http://example.com/duplicate.txt',))
            count = cursor.fetchone()[0]
            assert count == 1
    
    def test_get_pending_downloads(self, temp_db):
        """Test fetching pending downloads."""
        # Add some test entries
        temp_db.add_download_entry('source1', 'http://example.com/file1.txt')
        temp_db.add_download_entry('source2', 'http://example.com/file2.txt')
        temp_db.add_download_entry('source3', 'http://example.com/file3.txt')
        
        # Update one to completed
        with temp_db._get_connection() as conn:
            conn.execute("UPDATE downloads SET status = 'success' WHERE url = ?", ('http://example.com/file2.txt',))
            conn.commit()
        
        # Get pending downloads
        pending = temp_db.get_pending_downloads(limit=10)
        assert len(pending) == 2
        urls = [item[1] for item in pending]
        assert 'http://example.com/file1.txt' in urls
        assert 'http://example.com/file3.txt' in urls
        assert 'http://example.com/file2.txt' not in urls
    
    def test_update_download_status(self, temp_db):
        """Test updating download status."""
        temp_db.add_download_entry('source', 'http://example.com/test.txt')
        
        # Get the download ID
        with temp_db._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM downloads WHERE url = ?", ('http://example.com/test.txt',))
            download_id = cursor.fetchone()[0]
        
        # Update status
        temp_db.update_download_status(download_id, 'success', 'test.txt', 1024)
        
        # Verify update
        with temp_db._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT status, filename, filesize FROM downloads WHERE id = ?", (download_id,))
            row = cursor.fetchone()
            assert row[0] == 'success'
            assert row[1] == 'test.txt'
            assert row[2] == 1024
    
    def test_get_download_stats(self, temp_db):
        """Test retrieving download statistics."""
        # Add test entries with different statuses
        temp_db.add_download_entry('source', 'http://example.com/file1.txt')
        temp_db.add_download_entry('source', 'http://example.com/file2.txt')
        temp_db.add_download_entry('source', 'http://example.com/file3.txt')
        
        # Update statuses
        with temp_db._get_connection() as conn:
            conn.execute("UPDATE downloads SET status = 'success', filesize = 1000 WHERE url = ?", 
                        ('http://example.com/file1.txt',))
            conn.execute("UPDATE downloads SET status = 'failed' WHERE url = ?", 
                        ('http://example.com/file2.txt',))
            conn.execute("UPDATE downloads SET status = 'skipped' WHERE url = ?", 
                        ('http://example.com/file3.txt',))
            conn.commit()
        
        stats = temp_db.get_download_stats()
        assert stats['total_files'] == 3
        assert stats['successful'] == 1
        assert stats['failed'] == 1
        assert stats['skipped'] == 1
        assert stats['total_bytes'] == 1000