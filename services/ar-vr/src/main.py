"""
Prodigee AR/VR Service
Augmented and Virtual Reality interactive curriculum experiences.
Scales independently from curriculum delivery.
Helyxium VR module is architecturally parked — not a launch priority.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings

app = FastAPI(
    title="Prodigee AR/VR Service",
    version="0.1.0",
    description="AR/VR service — parked for post-launch activation",
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
    return {"status": "healthy", "service": "ar-vr", "phase": "parked"}


@app.get("/")
async def root():
    return {
        "service": "prodigee-ar-vr",
        "version": "0.1.0",
        "note": "Architecturally present — Helyxium VR activation is post-launch",
    }
