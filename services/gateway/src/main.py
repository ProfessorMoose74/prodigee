"""
Prodigee API Gateway
Routes requests to internal microservices, handles auth validation,
rate limiting, and external GCP API call management.
"""

import os

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings

app = FastAPI(
    title="Prodigee API Gateway",
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

SERVICE_ROUTES = {
    "/auth": settings.auth_service_url,
    "/learning": settings.learning_service_url,
    "/analytics": settings.analytics_service_url,
    "/ar-vr": settings.ar_vr_service_url,
}


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "gateway"}


@app.get("/")
async def root():
    return {
        "service": "prodigee-gateway",
        "version": "0.1.0",
        "environment": settings.environment,
    }
