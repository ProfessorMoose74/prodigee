"""
Shared test fixtures for gateway service.
"""

from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest
from httpx import ASGITransport, AsyncClient

import src.main as gateway_main
from src.main import app


@pytest.fixture
def mock_httpx_client():
    """Replace the gateway's internal httpx client with a mock."""
    client = AsyncMock(spec=httpx.AsyncClient)
    gateway_main._client = client
    yield client
    gateway_main._client = None


@pytest.fixture
async def client(mock_httpx_client):
    """Test client with mocked backend httpx client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


def make_httpx_response(
    status_code: int = 200,
    content: bytes = b'{"ok": true}',
    headers: dict | None = None,
) -> MagicMock:
    """Create a mock httpx.Response."""
    resp = MagicMock(spec=httpx.Response)
    resp.status_code = status_code
    resp.content = content
    resp.headers = httpx.Headers(headers or {"content-type": "application/json"})
    return resp
