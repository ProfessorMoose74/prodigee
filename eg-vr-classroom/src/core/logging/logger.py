"""
OASIS Education Planet - Logging System
Production-grade logging with rotation and structured output
"""

import logging
import logging.handlers
import sys
from pathlib import Path
from typing import Optional
from datetime import datetime

import colorlog

from src.core.config import config


class OASISLogger:
    """
    Unified logging system for OASIS Education Planet

    Features:
    - Color-coded console output
    - File logging with rotation
    - Structured log format
    - Performance tracking
    - Error reporting
    """

    _initialized = False
    _loggers = {}

    @classmethod
    def setup(cls, log_level: Optional[str] = None):
        """
        Setup logging system

        Args:
            log_level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        """
        if cls._initialized:
            return

        # Get configuration
        log_level = log_level or config.get_log_level()
        logs_dir = Path(config.get('paths.logs_dir', 'logs'))
        logs_dir.mkdir(parents=True, exist_ok=True)

        # Convert string to logging level
        level = getattr(logging, log_level.upper(), logging.INFO)

        # ================================================================
        # CONSOLE HANDLER (Color-coded)
        # ================================================================
        console_handler = colorlog.StreamHandler(sys.stdout)
        console_handler.setLevel(level)

        console_formatter = colorlog.ColoredFormatter(
            '%(log_color)s%(asctime)s %(levelname)-8s%(reset)s '
            '%(blue)s[%(name)s]%(reset)s %(white)s%(message)s%(reset)s',
            datefmt='%Y-%m-%d %H:%M:%S',
            log_colors={
                'DEBUG': 'cyan',
                'INFO': 'green',
                'WARNING': 'yellow',
                'ERROR': 'red',
                'CRITICAL': 'red,bg_white',
            }
        )
        console_handler.setFormatter(console_formatter)

        # ================================================================
        # FILE HANDLER (Rotating)
        # ================================================================
        log_file = logs_dir / 'oasis.log'

        file_handler = logging.handlers.RotatingFileHandler(
            filename=log_file,
            maxBytes=10 * 1024 * 1024,  # 10 MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setLevel(level)

        file_formatter = logging.Formatter(
            '%(asctime)s %(levelname)-8s [%(name)s] %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(file_formatter)

        # ================================================================
        # ERROR FILE HANDLER (Errors only)
        # ================================================================
        error_log_file = logs_dir / 'oasis_errors.log'

        error_handler = logging.handlers.RotatingFileHandler(
            filename=error_log_file,
            maxBytes=5 * 1024 * 1024,  # 5 MB
            backupCount=3,
            encoding='utf-8'
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(file_formatter)

        # ================================================================
        # ROOT LOGGER CONFIGURATION
        # ================================================================
        root_logger = logging.getLogger()
        root_logger.setLevel(level)

        # Clear existing handlers
        root_logger.handlers.clear()

        # Add handlers
        root_logger.addHandler(console_handler)
        root_logger.addHandler(file_handler)
        root_logger.addHandler(error_handler)

        # Suppress noisy third-party loggers
        logging.getLogger('urllib3').setLevel(logging.WARNING)
        logging.getLogger('requests').setLevel(logging.WARNING)
        logging.getLogger('socketio').setLevel(logging.WARNING)
        logging.getLogger('engineio').setLevel(logging.WARNING)

        cls._initialized = True

        # Log startup
        logger = logging.getLogger('oasis.logging')
        logger.info("🌍 OASIS Logging System initialized")
        logger.info(f"   Log Level: {log_level}")
        logger.info(f"   Log Directory: {logs_dir}")
        logger.info(f"   Main Log: {log_file}")
        logger.info(f"   Error Log: {error_log_file}")

    @classmethod
    def get_logger(cls, name: str) -> logging.Logger:
        """
        Get logger for a specific module

        Args:
            name: Logger name (usually __name__)

        Returns:
            Configured logger instance
        """
        if not cls._initialized:
            cls.setup()

        if name not in cls._loggers:
            cls._loggers[name] = logging.getLogger(name)

        return cls._loggers[name]


# Initialize on import
OASISLogger.setup()


# Convenience function
def get_logger(name: str) -> logging.Logger:
    """Get logger for module"""
    return OASISLogger.get_logger(name)
