"""
Prodigee Analytics & Progress Tracking Service
Read-only service — aggregates student progress from Firestore collections
written by the learning engine. Powers parent dashboards and reporting.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.routes import child, parent, system

app = FastAPI(
    title="Prodigee Analytics Service",
    version="0.2.0",
    docs_url="/docs" if settings.environment == "development" else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wire up route modules
app.include_router(child.router)
app.include_router(parent.router)
app.include_router(system.router)


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "analytics"}
