"""
Database Connection Manager
Handles PostgreSQL and SQLite connections with connection pooling
"""

import logging
from contextlib import contextmanager
from typing import Generator, Optional

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import QueuePool, StaticPool

from src.core.config import config

logger = logging.getLogger(__name__)


class DatabaseManager:
    """
    Manages database connections and sessions

    Features:
    - Connection pooling
    - Automatic reconnection
    - Transaction management
    - SQLite fallback for offline mode
    """

    _instance = None
    _engine: Optional[Engine] = None
    _session_factory: Optional[sessionmaker] = None

    def __new__(cls):
        """Singleton pattern"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialize database manager"""
        if self._engine is None:
            self.initialize()

    @classmethod
    def initialize(cls, use_sqlite: bool = False) -> None:
        """
        Initialize database connection

        Args:
            use_sqlite: Force SQLite mode (for offline/testing)
        """
        try:
            if use_sqlite:
                cls._init_sqlite()
            else:
                cls._init_postgresql()

            cls._session_factory = sessionmaker(
                bind=cls._engine,
                expire_on_commit=False
            )

            logger.info(f"Database initialized: {cls._engine.url.database}")

        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            # Fallback to SQLite
            if not use_sqlite:
                logger.warning("Falling back to SQLite offline mode")
                cls._init_sqlite()
                cls._session_factory = sessionmaker(
                    bind=cls._engine,
                    expire_on_commit=False
                )

    @classmethod
    def _init_postgresql(cls) -> None:
        """Initialize PostgreSQL connection"""
        db_url = config.get_database_url()
        db_config = config.get_database_config()

        cls._engine = create_engine(
            db_url,
            poolclass=QueuePool,
            pool_size=db_config.pool_size,
            max_overflow=db_config.max_overflow,
            pool_pre_ping=True,  # Verify connections before use
            pool_recycle=3600,  # Recycle connections after 1 hour
            echo=db_config.echo,
            connect_args={
                "connect_timeout": 10,
                "options": "-c timezone=utc"
            }
        )

        # Set up connection event listeners
        @event.listens_for(cls._engine, "connect")
        def receive_connect(dbapi_conn, connection_record):
            """Configure connection on connect"""
            logger.debug("New database connection established")

        @event.listens_for(cls._engine, "checkout")
        def receive_checkout(dbapi_conn, connection_record, connection_proxy):
            """Verify connection on checkout"""
            logger.debug("Connection checked out from pool")

    @classmethod
    def _init_sqlite(cls) -> None:
        """Initialize SQLite connection (offline mode)"""
        db_config = config.get_database_config()
        db_path = db_config.local_db_path

        cls._engine = create_engine(
            f"sqlite:///{db_path}",
            poolclass=StaticPool,  # SQLite doesn't need pooling
            echo=db_config.echo,
            connect_args={"check_same_thread": False}
        )

        # Enable foreign keys for SQLite
        @event.listens_for(cls._engine, "connect")
        def set_sqlite_pragma(dbapi_conn, connection_record):
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    @classmethod
    def get_engine(cls) -> Engine:
        """Get database engine"""
        if cls._engine is None:
            cls.initialize()
        return cls._engine

    @classmethod
    def get_session(cls) -> Session:
        """
        Get a new database session

        Returns:
            SQLAlchemy Session object
        """
        if cls._session_factory is None:
            cls.initialize()
        return cls._session_factory()

    @classmethod
    @contextmanager
    def session_scope(cls) -> Generator[Session, None, None]:
        """
        Context manager for database sessions

        Usage:
            with DatabaseManager.session_scope() as session:
                session.query(Child).all()

        Automatically commits on success, rolls back on error
        """
        session = cls.get_session()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Database transaction failed: {e}")
            raise
        finally:
            session.close()

    @classmethod
    def close_all(cls) -> None:
        """Close all database connections"""
        if cls._engine:
            cls._engine.dispose()
            logger.info("All database connections closed")

    @classmethod
    def create_tables(cls) -> None:
        """Create all database tables"""
        from src.core.database.models import Base

        if cls._engine is None:
            cls.initialize()

        Base.metadata.create_all(cls._engine)
        logger.info("Database tables created")

    @classmethod
    def drop_tables(cls) -> None:
        """Drop all database tables (DANGEROUS!)"""
        from src.core.database.models import Base

        if cls._engine is None:
            cls.initialize()

        Base.metadata.drop_all(cls._engine)
        logger.warning("All database tables dropped")

    @classmethod
    def test_connection(cls) -> bool:
        """
        Test database connection

        Returns:
            True if connection successful, False otherwise
        """
        try:
            with cls.session_scope() as session:
                session.execute("SELECT 1")
            logger.info("Database connection test successful")
            return True
        except Exception as e:
            logger.error(f"Database connection test failed: {e}")
            return False


# Global instance
db_manager = DatabaseManager()


# Convenience functions
def get_session() -> Session:
    """Get a new database session"""
    return db_manager.get_session()


@contextmanager
def session_scope() -> Generator[Session, None, None]:
    """Session context manager"""
    with db_manager.session_scope() as session:
        yield session
