"""
Prodigee Learning Engine
Core educational service — delivers Heggerty phonemic awareness curriculum,
tracks child progress, processes voice interactions, and provides
AI-powered adaptive learning recommendations.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.routes import curriculum, dashboard, voice, ai

app = FastAPI(
    title="Prodigee Learning Engine",
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
app.include_router(curriculum.router)
app.include_router(dashboard.router)
app.include_router(voice.router)
app.include_router(ai.router)


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "learning-engine"}
