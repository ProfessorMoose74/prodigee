import pytest
from pathlib import Path
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from digital_library_system import DownloadConfig


class TestDownloadConfig:
    def test_default_config_values(self):
        """Test that default configuration values are set correctly."""
        config = DownloadConfig()
        
        assert config.max_concurrent_downloads == 8
        assert config.request_delay == 2.0
        assert config.timeout == 30
        assert config.max_retries == 3
        assert config.max_file_size == 100 * 1024 * 1024  # 100MB
        assert config.connection_pool_size == 100
        assert config.keepalive_timeout == 30
        assert config.chunk_size == 8192
        assert config.download_dir == Path("downloads")
        assert config.db_path == Path("library.db")
    
    def test_custom_config_values(self):
        """Test setting custom configuration values."""
        custom_download_dir = Path("/custom/downloads")
        custom_db_path = Path("/custom/db.sqlite")
        
        config = DownloadConfig(
            max_concurrent_downloads=4,
            request_delay=5.0,
            timeout=60,
            max_retries=5,
            max_file_size=50 * 1024 * 1024,
            connection_pool_size=50,
            keepalive_timeout=60,
            chunk_size=16384,
            download_dir=custom_download_dir,
            db_path=custom_db_path
        )
        
        assert config.max_concurrent_downloads == 4
        assert config.request_delay == 5.0
        assert config.timeout == 60
        assert config.max_retries == 5
        assert config.max_file_size == 50 * 1024 * 1024
        assert config.connection_pool_size == 50
        assert config.keepalive_timeout == 60
        assert config.chunk_size == 16384
        assert config.download_dir == custom_download_dir
        assert config.db_path == custom_db_path
    
    def test_uvloop_detection(self):
        """Test uvloop configuration based on platform."""
        config = DownloadConfig()
        
        if sys.platform == "win32":
            assert config.use_uvloop is False
        else:
            # On non-Windows platforms, it depends on whether uvloop is installed
            assert isinstance(config.use_uvloop, bool)