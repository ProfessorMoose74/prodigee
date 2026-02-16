# digital_library_system.py

import asyncio
import aiohttp
import aiofiles
import sqlite3
import logging
import logging.handlers
import sys
import argparse
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urljoin
from bs4 import BeautifulSoup

# Optional: Install and enable uvloop for a performance boost on Linux
try:
    import uvloop
    if sys.platform != "win32":
        uvloop.install()
except ImportError:
    print("uvloop not found, falling back to default asyncio event loop.")
    pass

# --- Configuration ---

@dataclass
class DownloadConfig:
    """Configuration for the downloader."""
    max_concurrent_downloads: int = 8
    request_delay: float = 2.0
    timeout: int = 30
    max_retries: int = 3
    max_file_size: int = 100 * 1024 * 1024  # 100MB
    connection_pool_size: int = 100
    keepalive_timeout: int = 30
    chunk_size: int = 8192
    use_uvloop: bool = sys.platform != "win32" and 'uvloop' in sys.modules
    download_dir: Path = Path("downloads")
    db_path: Path = Path("library.db")

# --- Database Management ---

class LibraryDatabase:
    """Manages the SQLite database for tracking downloads."""

    def __init__(self, db_path: Path):
        self.db_path = db_path
        self._create_tables()
        self._optimize_connection()

    def _get_connection(self):
        """Creates and returns a database connection."""
        conn = sqlite3.connect(self.db_path, timeout=10)
        # Enable WAL mode for better concurrency
        conn.execute("PRAGMA journal_mode=WAL")
        return conn

    def _create_tables(self):
        """Creates the necessary database tables if they don't exist."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS downloads (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source TEXT NOT NULL,
                    url TEXT NOT NULL UNIQUE,
                    filename TEXT,
                    status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed, skipped
                    filesize INTEGER,
                    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP,
                    metadata TEXT
                )
            """)
            conn.commit()

    def _optimize_connection(self):
        """Applies performance-tuning PRAGMA statements."""
        with self._get_connection() as conn:
            conn.execute("PRAGMA cache_size=50000")
            conn.execute("PRAGMA temp_store=memory")
            conn.execute("PRAGMA mmap_size=268435456")

    def add_download_entry(self, source: str, url: str, metadata: str = '{}'):
        """Adds a new download entry to the database, ignoring duplicates."""
        with self._get_connection() as conn:
            try:
                conn.execute(
                    "INSERT INTO downloads (source, url, metadata) VALUES (?, ?, ?)",
                    (source, url, metadata)
                )
                conn.commit()
                return True
            except sqlite3.IntegrityError:
                logging.debug(f"URL already exists in database: {url}")
                return False

    def get_pending_downloads(self, limit: int = 50):
        """Fetches a list of pending downloads."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, url, source FROM downloads WHERE status = 'pending' ORDER BY id LIMIT ?",
                (limit,)
            )
            return cursor.fetchall()

    def update_download_status(self, download_id: int, status: str, filename: str = None, filesize: int = 0):
        """Updates the status of a download entry."""
        with self._get_connection() as conn:
            conn.execute("""
                UPDATE downloads
                SET status = ?, filename = ?, filesize = ?, completed_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (status, filename, filesize, download_id))
            conn.commit()

    def get_download_stats(self):
        """Retrieves download statistics from the database."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            stats = {}
            cursor.execute("SELECT COUNT(*) FROM downloads")
            stats['total_files'] = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM downloads WHERE status = 'success'")
            stats['successful'] = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM downloads WHERE status = 'failed'")
            stats['failed'] = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM downloads WHERE status = 'skipped'")
            stats['skipped'] = cursor.fetchone()[0]
            cursor.execute("SELECT SUM(filesize) FROM downloads WHERE status = 'success'")
            total_bytes = cursor.fetchone()[0]
            stats['total_bytes'] = total_bytes if total_bytes else 0
            return stats

# --- Downloader ---

class Downloader:
    """Asynchronous file downloader."""

    def __init__(self, config: DownloadConfig, db: LibraryDatabase):
        self.config = config
        self.db = db
        self.session = None
        self.semaphore = asyncio.Semaphore(config.max_concurrent_downloads)

    async def __aenter__(self):
        """Initializes the aiohttp session."""
        connector = aiohttp.TCPConnector(limit=self.config.connection_pool_size)
        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=aiohttp.ClientTimeout(total=self.config.timeout)
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Closes the aiohttp session."""
        await self.session.close()

    async def discover_content(self, limit: int):
        """Placeholder for content discovery. Must be implemented by subclasses."""
        raise NotImplementedError

    async def download_file(self, download_id: int, url: str, source: str):
        """Downloads a single file and updates its status in the database."""
        async with self.semaphore:
            await asyncio.sleep(self.config.request_delay)
            filepath = None
            try:
                logging.info(f"Downloading {url}...")
                async with self.session.get(url, allow_redirects=True) as response:
                    response.raise_for_status()

                    # Check file size
                    content_length = int(response.headers.get('Content-Length', 0))
                    if content_length > self.config.max_file_size:
                        logging.warning(f"Skipping {url}, file size {content_length} exceeds limit.")
                        self.db.update_download_status(download_id, 'skipped')
                        return

                    filename = Path(url).name or f"download_{download_id}"
                    source_dir = self.config.download_dir / source
                    source_dir.mkdir(parents=True, exist_ok=True)
                    filepath = source_dir / filename

                    total_read = 0
                    async with aiofiles.open(filepath, 'wb') as f:
                        async for chunk in response.content.iter_chunked(self.config.chunk_size):
                            total_read += len(chunk)
                            if total_read > self.config.max_file_size:
                                logging.warning(f"Skipping {url}, download exceeded max file size.")
                                self.db.update_download_status(download_id, 'skipped')
                                # Clean up partial file
                                await f.close()
                                filepath.unlink()
                                return
                            await f.write(chunk)

                logging.info(f"Successfully downloaded {filepath}")
                self.db.update_download_status(download_id, 'success', filename, total_read)

            except aiohttp.ClientError as e:
                logging.error(f"Network error downloading {url}: {e}")
                self.db.update_download_status(download_id, 'failed')
            except Exception as e:
                logging.error(f"Failed to download or save {url}: {e}")
                self.db.update_download_status(download_id, 'failed')
                if filepath and filepath.exists():
                    filepath.unlink() # Clean up failed download

    async def process_downloads_batch(self, downloads: list):
        """Processes a batch of downloads concurrently."""
        tasks = [self.download_file(d_id, url, source) for d_id, url, source in downloads]
        await asyncio.gather(*tasks)

class ProjectGutenbergDownloader(Downloader):
    """Specific downloader for Project Gutenberg."""
    BASE_URL = "https://www.gutenberg.org"

    async def discover_content(self, limit: int = 50):
        """Discovers new content from Project Gutenberg's new book list."""
        logging.info("Discovering content from Project Gutenberg...")
        discover_url = urljoin(self.BASE_URL, "/ebooks/search/?sort_order=release_date")
        
        try:
            async with self.session.get(discover_url) as response:
                response.raise_for_status()
                text = await response.text()

            soup = BeautifulSoup(text, 'lxml')
            book_links = soup.select('li.booklink a.link')
            
            count = 0
            for link in book_links:
                if count >= limit:
                    break
                
                # We need to find the actual file URL, e.g., the .txt file
                book_page_url = urljoin(self.BASE_URL, link['href'])
                ebook_id = Path(book_page_url).name
                # A common URL pattern for plain text files
                file_url = f"https://www.gutenberg.org/files/{ebook_id}/{ebook_id}-0.txt"
                
                # Add to DB, skipping duplicates
                if self.db.add_download_entry('gutenberg', file_url):
                    count += 1
                    logging.info(f"Discovered and added: {file_url}")
            logging.info(f"Discovery complete. Found {count} new items.")

        except Exception as e:
            logging.error(f"Error during Project Gutenberg discovery: {e}")

# --- Main Application Logic ---

def setup_logging(log_dir: Path):
    """Configures logging for the application."""
    log_dir.mkdir(exist_ok=True)
    log_file = log_dir / "digital_library.log"
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.handlers.RotatingFileHandler(
                log_file,
                maxBytes=10*1024*1024, # 10MB
                backupCount=5
            )
        ]
    )

def print_stats(db: LibraryDatabase):
    """Prints download statistics to the console."""
    stats = db.get_download_stats()
    successful = stats.get('successful', 0)
    total = stats.get('total_files', 0)
    success_rate = (successful / total * 100) if total > 0 else 0
    total_mb = stats.get('total_bytes', 0) / (1024 * 1024)

    print(f"""
    📊 Download Statistics:
    =====================
    Total Discovered Files: {stats.get('total_files', 0)}
    Successful Downloads:   {successful}
    Failed Downloads:       {stats.get('failed', 0)}
    Skipped Files:          {stats.get('skipped', 0)}
    Success Rate:           {success_rate:.1f}%
    Total Data Downloaded:  {total_mb:.2f} MB
    """)

async def main():
    """Main function to run the digital library system."""
    parser = argparse.ArgumentParser(description="Digital Library System")
    parser.add_argument('--source', type=str, choices=['gutenberg', 'loc'], default='gutenberg', help='Specify the content source.')
    parser.add_argument('--limit', type=int, default=50, help='Limit the number of files to discover or download.')
    parser.add_argument('--resume', action='store_true', help='Resume interrupted downloads.')
    parser.add_argument('--stats', action='store_true', help='Display download statistics and exit.')
    parser.add_argument('--download-dir', type=str, default='downloads', help='Set the main directory for downloads.')
    
    args = parser.parse_args()

    # --- Setup ---
    config = DownloadConfig()
    config.download_dir = Path(args.download_dir)
    config.db_path = config.download_dir / "library.db"

    # Create directories if they don't exist
    log_dir = Path("logs")
    setup_logging(log_dir)
    config.download_dir.mkdir(exist_ok=True)

    db = LibraryDatabase(config.db_path)

    if args.stats:
        print_stats(db)
        return

    # --- Downloader Initialization ---
    downloader_classes = {
        'gutenberg': ProjectGutenbergDownloader,
        # 'loc': LibraryOfCongressDownloader # Future implementation
    }
    
    if args.source not in downloader_classes:
        logging.error(f"Source '{args.source}' is not supported.")
        return

    downloader_class = downloader_classes[args.source]
    
    async with downloader_class(config, db) as downloader:
        if not args.resume:
            # Discover new content
            await downloader.discover_content(limit=args.limit)
        
        # Process pending downloads
        pending = db.get_pending_downloads(limit=args.limit)
        if not pending:
            logging.info("No pending downloads found.")
        else:
            logging.info(f"Starting download of {len(pending)} pending files.")
            await downloader.process_downloads_batch(pending)
            logging.info("Download batch complete.")
    
    print_stats(db)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nProcess interrupted by user. Exiting.")