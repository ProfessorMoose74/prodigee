"""
Prodigee API Gateway
Reverse proxy that routes requests to internal microservices.
Handles rate limiting, request tracing, and aggregated health checks.
"""

import asyncio
import logging
import uuid

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from src.config import settings

logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Prodigee API Gateway",
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

# --- Service routing table ---

SERVICE_MAP = {
    "auth": settings.auth_service_url,
    "learning": settings.learning_service_url,
    "analytics": settings.analytics_service_url,
    "ar-vr": settings.ar_vr_service_url,
}

# Headers that should NOT be forwarded to backend services
HOP_BY_HOP_HEADERS = frozenset({
    "host", "connection", "keep-alive", "transfer-encoding",
    "te", "trailer", "upgrade", "proxy-authorization",
    "proxy-authenticate",
})

# --- httpx client lifecycle ---

_client: httpx.AsyncClient | None = None


@app.on_event("startup")
async def startup():
    global _client
    _client = httpx.AsyncClient(
        timeout=httpx.Timeout(settings.request_timeout_seconds),
        follow_redirects=False,
        limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
    )


@app.on_event("shutdown")
async def shutdown():
    global _client
    if _client:
        await _client.aclose()


# --- Gateway-local endpoints ---


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "gateway"}


@app.get("/services/health")
async def services_health():
    """Aggregated health check — pings all backend services concurrently."""
    results = {}

    async def check_service(name: str, base_url: str):
        try:
            resp = await _client.get(f"{base_url}/health", timeout=5.0)
            results[name] = "healthy" if resp.status_code == 200 else "unhealthy"
        except Exception:
            results[name] = "unreachable"

    await asyncio.gather(
        *(check_service(name, url) for name, url in SERVICE_MAP.items())
    )

    healthy_count = sum(1 for s in results.values() if s == "healthy")
    if healthy_count == len(results):
        overall = "healthy"
    elif healthy_count == 0:
        overall = "unhealthy"
    else:
        overall = "degraded"

    return {
        "gateway": "healthy",
        "services": results,
        "status": overall,
    }


@app.get("/")
async def root():
    return {
        "service": "prodigee-gateway",
        "version": "0.2.0",
        "environment": settings.environment,
    }


# --- Reverse proxy catch-all ---


@app.api_route("/api/{service}/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy(service: str, path: str, request: Request):
    """Forward requests to the appropriate backend service."""
    base_url = SERVICE_MAP.get(service)
    if base_url is None:
        return JSONResponse(
            status_code=404,
            content={"detail": f"Unknown service: {service}"},
        )

    # Build backend URL
    backend_url = f"{base_url}/{path}"
    if request.url.query:
        backend_url = f"{backend_url}?{request.url.query}"

    # Forward headers (strip hop-by-hop)
    headers = {}
    for key, value in request.headers.items():
        if key.lower() not in HOP_BY_HOP_HEADERS:
            headers[key] = value

    # Inject request tracing ID
    request_id = str(uuid.uuid4())
    headers["x-request-id"] = request_id

    # Read request body
    body = await request.body()

    try:
        response = await _client.request(
            method=request.method,
            url=backend_url,
            headers=headers,
            content=body if body else None,
        )
    except httpx.TimeoutException:
        logger.error(f"Timeout proxying to {service}: {request.method} /{path}")
        return JSONResponse(
            status_code=504,
            content={"detail": "Backend service timed out"},
        )
    except httpx.ConnectError:
        logger.error(f"Connection refused for {service}: {request.method} /{path}")
        return JSONResponse(
            status_code=502,
            content={"detail": f"Service '{service}' is unavailable"},
        )
    except httpx.HTTPError as exc:
        logger.error(f"Error proxying to {service}: {exc}")
        return JSONResponse(
            status_code=502,
            content={"detail": "Bad gateway"},
        )

    # Build response — forward status, headers, body
    response_headers = {}
    for key, value in response.headers.items():
        if key.lower() not in HOP_BY_HOP_HEADERS and key.lower() != "content-encoding":
            response_headers[key] = value
    response_headers["x-request-id"] = request_id

    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=response_headers,
    )
