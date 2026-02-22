"""
Prodigee Learning Engine
Core educational service — delivers Heggerty phonemic awareness curriculum,
tracks child progress, processes voice interactions, and provides
AI-powered adaptive learning recommendations.
"""

import logging
import time
import uuid

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.logging_config import setup_logging, request_id_var
from src.routes import curriculum, dashboard, voice, ai

setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Prodigee Learning Engine",
    version="0.2.0",
    docs_url="/docs" if settings.environment == "development" else None,
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
app.include_router(curriculum.router)
app.include_router(dashboard.router)
app.include_router(voice.router)
app.include_router(ai.router)


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "learning-engine"}
