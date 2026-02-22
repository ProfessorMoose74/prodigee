"""
Structured logging configuration.
- Production (Cloud Run): JSON format, compatible with Cloud Logging
- Development: human-readable colored output
"""

import logging
import json
import sys
from contextvars import ContextVar
from datetime import datetime, timezone

from src.config import settings

# Context variable for request-scoped tracing
request_id_var: ContextVar[str] = ContextVar("request_id", default="-")


class JSONFormatter(logging.Formatter):
    """Cloud Logging-compatible JSON formatter."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "severity": record.levelname,
            "message": record.getMessage(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "logging.googleapis.com/sourceLocation": {
                "file": record.pathname,
                "line": record.lineno,
                "function": record.funcName,
            },
            "service": "auth",
            "request_id": request_id_var.get("-"),
        }
        if record.exc_info and record.exc_info[0] is not None:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)


class DevFormatter(logging.Formatter):
    """Human-readable formatter for local development."""

    def format(self, record: logging.LogRecord) -> str:
        rid = request_id_var.get("-")
        rid_short = rid[:8] if rid != "-" else "-"
        return (
            f"{record.levelname:<7} [{rid_short}] "
            f"{record.name}:{record.lineno} — {record.getMessage()}"
        )


def setup_logging() -> None:
    """Configure logging based on environment."""
    root = logging.getLogger()
    root.setLevel(logging.INFO)

    # Remove any existing handlers
    root.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)

    if settings.environment == "production":
        handler.setFormatter(JSONFormatter())
    else:
        handler.setFormatter(DevFormatter())

    root.addHandler(handler)

    # Quiet noisy libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("google").setLevel(logging.WARNING)
