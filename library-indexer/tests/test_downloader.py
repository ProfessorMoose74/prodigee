import pytest
import asyncio
import tempfile
from pathlib import Path
from unittest.mock import Mock, AsyncMock, patch, MagicMock
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from digital_library_system import DownloadConfig, Downloader, LibraryDatabase, ProjectGutenbergDownloader


class TestDownloader:
    @pytest.fixture
    def temp_dirs(self):
        """Create temporary directories for testing."""
        with tempfile.TemporaryDirectory() as tmpdir:
            temp_path = Path(tmpdir)
            download_dir = temp_path / "downloads"
            download_dir.mkdir()
            db_path = temp_path / "test.db"
            yield download_dir, db_path
    
    @pytest.fixture
    def config(self, temp_dirs):
        """Create a test configuration."""
        download_dir, db_path = temp_dirs
        config = DownloadConfig(
            max_concurrent_downloads=2,
            request_delay=0.1,
            timeout=5,
            max_retries=1,
            max_file_size=1024 * 1024,  # 1MB
            download_dir=download_dir,
            db_path=db_path
        )
        return config
    
    @pytest.fixture
    def mock_db(self):
        """Create a mock database."""
        db = Mock(spec=LibraryDatabase)
        db.add_download_entry = Mock(return_value=True)
        db.get_pending_downloads = Mock(return_value=[])
        db.update_download_status = Mock()
        return db
    
    @pytest.mark.asyncio
    async def test_downloader_initialization(self, config, mock_db):
        """Test downloader initialization and context manager."""
        async with Downloader(config, mock_db) as downloader:
            assert downloader.config == config
            assert downloader.db == mock_db
            assert downloader.session is not None
            assert downloader.semaphore._value == config.max_concurrent_downloads
    
    @pytest.mark.asyncio
    async def test_download_file_success(self, config, mock_db, temp_dirs):
        """Test successful file download."""
        download_dir, _ = temp_dirs
        
        # Mock response
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.headers = {'Content-Length': '100'}
        mock_response.raise_for_status = Mock()
        
        # Mock content iteration
        async def mock_iter_chunked(chunk_size):
            yield b'test content'
        
        mock_response.content.iter_chunked = mock_iter_chunked
        
        async with Downloader(config, mock_db) as downloader:
            with patch.object(downloader.session, 'get', return_value=mock_response):
                await downloader.download_file(1, 'http://example.com/test.txt', 'test_source')
                
                # Verify file was created
                expected_file = download_dir / 'test_source' / 'test.txt'
                assert expected_file.exists()
                assert expected_file.read_text() == 'test content'
                
                # Verify database was updated
                mock_db.update_download_status.assert_called_once()
                call_args = mock_db.update_download_status.call_args[0]
                assert call_args[0] == 1  # download_id
                assert call_args[1] == 'success'  # status
    
    @pytest.mark.asyncio
    async def test_download_file_size_limit(self, config, mock_db):
        """Test that files exceeding size limit are skipped."""
        # Mock response with large content length
        mock_response = AsyncMock()
        mock_response.headers = {'Content-Length': str(config.max_file_size + 1)}
        mock_response.raise_for_status = Mock()
        
        async with Downloader(config, mock_db) as downloader:
            with patch.object(downloader.session, 'get', return_value=mock_response):
                await downloader.download_file(1, 'http://example.com/large.txt', 'test')
                
                # Verify file was skipped
                mock_db.update_download_status.assert_called_with(1, 'skipped')
    
    @pytest.mark.asyncio
    async def test_download_file_network_error(self, config, mock_db):
        """Test handling of network errors during download."""
        async with Downloader(config, mock_db) as downloader:
            with patch.object(downloader.session, 'get', side_effect=Exception("Network error")):
                await downloader.download_file(1, 'http://example.com/error.txt', 'test')
                
                # Verify status was set to failed
                mock_db.update_download_status.assert_called_with(1, 'failed')
    
    @pytest.mark.asyncio
    async def test_process_downloads_batch(self, config, mock_db):
        """Test processing multiple downloads concurrently."""
        downloads = [
            (1, 'http://example.com/file1.txt', 'source1'),
            (2, 'http://example.com/file2.txt', 'source2'),
            (3, 'http://example.com/file3.txt', 'source3')
        ]
        
        async with Downloader(config, mock_db) as downloader:
            # Mock the download_file method
            downloader.download_file = AsyncMock()
            
            await downloader.process_downloads_batch(downloads)
            
            # Verify all downloads were processed
            assert downloader.download_file.call_count == 3


class TestProjectGutenbergDownloader:
    @pytest.fixture
    def mock_db(self):
        """Create a mock database."""
        db = Mock(spec=LibraryDatabase)
        db.add_download_entry = Mock(side_effect=[True, True, False, True])  # Simulate some duplicates
        return db
    
    @pytest.fixture
    def config(self):
        """Create a test configuration."""
        with tempfile.TemporaryDirectory() as tmpdir:
            temp_path = Path(tmpdir)
            config = DownloadConfig(
                download_dir=temp_path / "downloads",
                db_path=temp_path / "test.db"
            )
            return config
    
    @pytest.mark.asyncio
    async def test_discover_content(self, config, mock_db):
        """Test content discovery from Project Gutenberg."""
        # Mock HTML response
        mock_html = '''
        <html>
        <body>
            <li class="booklink"><a class="link" href="/ebooks/12345">Book 1</a></li>
            <li class="booklink"><a class="link" href="/ebooks/67890">Book 2</a></li>
            <li class="booklink"><a class="link" href="/ebooks/11111">Book 3</a></li>
        </body>
        </html>
        '''
        
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.raise_for_status = Mock()
        mock_response.text = AsyncMock(return_value=mock_html)
        
        async with ProjectGutenbergDownloader(config, mock_db) as downloader:
            with patch.object(downloader.session, 'get', return_value=mock_response):
                await downloader.discover_content(limit=3)
                
                # Verify correct number of entries were added
                assert mock_db.add_download_entry.call_count == 3
                
                # Verify correct URLs were generated
                calls = mock_db.add_download_entry.call_args_list
                assert calls[0][0] == ('gutenberg', 'https://www.gutenberg.org/files/12345/12345-0.txt')
                assert calls[1][0] == ('gutenberg', 'https://www.gutenberg.org/files/67890/67890-0.txt')
                assert calls[2][0] == ('gutenberg', 'https://www.gutenberg.org/files/11111/11111-0.txt')