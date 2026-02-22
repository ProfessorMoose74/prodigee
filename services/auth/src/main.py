"""
Prodigee Auth Service
Handles parent/child authentication, role-based access control,
session management, and COPPA-compliant child account flows.
"""

import logging
import time
import uuid

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from src.config import settings
from src.logging_config import setup_logging, request_id_var
from src.routes import parent, child, session

setup_logging()
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Prodigee Auth Service",
    version="0.2.0",
    docs_url="/docs" if settings.environment == "development" else None,
)

app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."},
    )


@app.middleware("http")
async def request_tracing_middleware(request: Request, call_next):
    """Extract or generate X-Request-ID, attach to logs and response."""
    rid = request.headers.get("x-request-id", str(uuid.uuid4()))
    request_id_var.set(rid)

    start = time.perf_counter()
    response: Response = await call_next(request)
    elapsed_ms = round((time.perf_counter() - start) * 1000, 1)

    response.headers["x-request-id"] = rid

    logger.info(
        "%s %s -> %s (%.1fms)",
        request.method, request.url.path, response.status_code, elapsed_ms,
    )
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wire up route modules
app.include_router(parent.router)
app.include_router(child.router)
app.include_router(session.router)


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "auth"}
