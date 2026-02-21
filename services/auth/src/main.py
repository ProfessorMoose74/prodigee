"""
Prodigee Auth Service
Handles parent/child authentication, role-based access control,
session management, and COPPA-compliant child account flows.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings

app = FastAPI(
    title="Prodigee Auth Service",
    version="0.1.0",
    docs_url="/docs" if settings.environment == "development" else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "auth"}


# --- Parent Auth ---


@app.post("/parent/register")
async def parent_register():
    """Register a new parent account."""
    return {"status": "not_implemented"}


@app.post("/parent/login")
async def parent_login():
    """Parent login — returns JWT token."""
    return {"status": "not_implemented"}


# --- Child Auth (COPPA-compliant) ---


@app.post("/child/login")
async def child_login():
    """Child login — requires parent token, COPPA-compliant."""
    return {"status": "not_implemented"}


@app.post("/logout")
async def logout():
    """Logout with token invalidation."""
    return {"status": "not_implemented"}
