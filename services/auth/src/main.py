"""
Prodigee Auth Service
Handles parent/child authentication, role-based access control,
session management, and COPPA-compliant child account flows.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from src.config import settings
from src.routes import parent, child, session

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
