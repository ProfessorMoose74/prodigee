"""
Service-to-service authentication for Cloud Run.

On Cloud Run, the gateway fetches Google ID tokens from the instance
metadata server to authenticate with backend services. Tokens are
cached for 55 minutes (they're valid ~60 min).

In development, tokens are skipped (returns None).
"""

import logging
import time

import httpx

from src.config import settings

logger = logging.getLogger(__name__)

_METADATA_URL = (
    "http://metadata.google.internal/computeMetadata/v1"
    "/instance/service-accounts/default/identity"
)
_METADATA_HEADERS = {"Metadata-Flavor": "Google"}
_TOKEN_LIFETIME = 3300  # 55 minutes

_token_cache: dict[str, tuple[str, float]] = {}


async def get_id_token(target_audience: str) -> str | None:
    """Get a Google ID token for the target Cloud Run service URL.

    Returns None in development mode or if token fetch fails.
    """
    if settings.environment != "production":
        return None

    now = time.time()
    cached = _token_cache.get(target_audience)
    if cached and cached[1] > now:
        return cached[0]

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                _METADATA_URL,
                params={"audience": target_audience},
                headers=_METADATA_HEADERS,
                timeout=5.0,
            )
            resp.raise_for_status()
            token = resp.text

        _token_cache[target_audience] = (token, now + _TOKEN_LIFETIME)
        logger.info("Fetched ID token for %s", target_audience)
        return token
    except Exception:
        logger.warning(
            "Failed to fetch ID token for %s", target_audience, exc_info=True,
        )
        return None
