"""
Tests for gateway routes — health, proxy routing, error handling, X-Request-ID.
"""

from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest

from tests.conftest import make_httpx_response


# --- Health Endpoints ---


class TestHealth:
    @pytest.mark.asyncio
    async def test_health(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["service"] == "gateway"

    @pytest.mark.asyncio
    async def test_root(self, client):
        resp = await client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["service"] == "prodigee-gateway"
        assert data["version"] == "0.2.0"


# --- Aggregated Service Health ---


class TestServicesHealth:
    @pytest.mark.asyncio
    async def test_all_healthy(self, client, mock_httpx_client):
        mock_httpx_client.get = AsyncMock(
            return_value=make_httpx_response(200, b'{"status": "healthy"}')
        )

        resp = await client.get("/services/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["gateway"] == "healthy"
        assert data["status"] == "healthy"
        assert all(v == "healthy" for v in data["services"].values())

    @pytest.mark.asyncio
    async def test_some_unreachable(self, client, mock_httpx_client):
        call_count = 0

        async def alternating_health(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count % 2 == 0:
                raise httpx.ConnectError("Connection refused")
            return make_httpx_response(200)

        mock_httpx_client.get = AsyncMock(side_effect=alternating_health)

        resp = await client.get("/services/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "degraded"

    @pytest.mark.asyncio
    async def test_all_unreachable(self, client, mock_httpx_client):
        mock_httpx_client.get = AsyncMock(
            side_effect=httpx.ConnectError("Connection refused")
        )

        resp = await client.get("/services/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "unhealthy"
        assert all(v == "unreachable" for v in data["services"].values())


# --- Proxy Routing ---


class TestProxy:
    @pytest.mark.asyncio
    async def test_proxy_to_auth(self, client, mock_httpx_client):
        mock_httpx_client.request = AsyncMock(
            return_value=make_httpx_response(200, b'{"token": "abc"}')
        )

        resp = await client.post(
            "/api/auth/parent/login",
            json={"email": "test@example.com", "password": "pass"},
        )
        assert resp.status_code == 200
        assert resp.json() == {"token": "abc"}

        # Verify the backend call
        call_args = mock_httpx_client.request.call_args
        assert "localhost:8081" in call_args.kwargs["url"]
        assert call_args.kwargs["method"] == "POST"

    @pytest.mark.asyncio
    async def test_proxy_to_learning(self, client, mock_httpx_client):
        mock_httpx_client.request = AsyncMock(
            return_value=make_httpx_response(200, b'{"week_number": 1}')
        )

        resp = await client.get("/api/learning/curriculum/week/1")
        assert resp.status_code == 200
        call_url = mock_httpx_client.request.call_args.kwargs["url"]
        assert "localhost:8082" in call_url
        assert "curriculum/week/1" in call_url

    @pytest.mark.asyncio
    async def test_proxy_to_analytics(self, client, mock_httpx_client):
        mock_httpx_client.request = AsyncMock(
            return_value=make_httpx_response(200, b'{"service": "analytics"}')
        )

        resp = await client.get("/api/analytics/system/metrics")
        assert resp.status_code == 200
        assert "localhost:8083" in mock_httpx_client.request.call_args.kwargs["url"]

    @pytest.mark.asyncio
    async def test_proxy_forwards_query_params(self, client, mock_httpx_client):
        mock_httpx_client.request = AsyncMock(
            return_value=make_httpx_response(200, b'[]')
        )

        resp = await client.get("/api/learning/content?subject=phonemic&age_range=3-5")
        assert resp.status_code == 200
        call_url = mock_httpx_client.request.call_args.kwargs["url"]
        assert "subject=phonemic" in call_url
        assert "age_range=3-5" in call_url

    @pytest.mark.asyncio
    async def test_proxy_forwards_auth_header(self, client, mock_httpx_client):
        mock_httpx_client.request = AsyncMock(
            return_value=make_httpx_response(200, b'{}')
        )

        resp = await client.get(
            "/api/auth/health",
            headers={"Authorization": "Bearer my-token"},
        )
        assert resp.status_code == 200
        forwarded_headers = mock_httpx_client.request.call_args.kwargs["headers"]
        assert forwarded_headers.get("authorization") == "Bearer my-token"


# --- Error Handling ---


class TestProxyErrors:
    @pytest.mark.asyncio
    async def test_unknown_service_404(self, client, mock_httpx_client):
        resp = await client.get("/api/nonexistent/some/path")
        assert resp.status_code == 404
        assert "unknown service" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_backend_timeout_504(self, client, mock_httpx_client):
        mock_httpx_client.request = AsyncMock(
            side_effect=httpx.TimeoutException("Timed out")
        )

        resp = await client.get("/api/auth/health")
        assert resp.status_code == 504
        assert "timed out" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_backend_unreachable_502(self, client, mock_httpx_client):
        mock_httpx_client.request = AsyncMock(
            side_effect=httpx.ConnectError("Connection refused")
        )

        resp = await client.get("/api/auth/health")
        assert resp.status_code == 502
        assert "unavailable" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_backend_generic_error_502(self, client, mock_httpx_client):
        mock_httpx_client.request = AsyncMock(
            side_effect=httpx.HTTPError("Something broke")
        )

        resp = await client.get("/api/auth/health")
        assert resp.status_code == 502

    @pytest.mark.asyncio
    async def test_backend_error_status_forwarded(self, client, mock_httpx_client):
        """Backend returns 400 — gateway should forward it, not mask it."""
        mock_httpx_client.request = AsyncMock(
            return_value=make_httpx_response(400, b'{"detail": "bad request"}')
        )

        resp = await client.get("/api/auth/some-endpoint")
        assert resp.status_code == 400


# --- X-Request-ID ---


class TestRequestTracing:
    @pytest.mark.asyncio
    async def test_x_request_id_injected(self, client, mock_httpx_client):
        mock_httpx_client.request = AsyncMock(
            return_value=make_httpx_response(200, b'{}')
        )

        resp = await client.get("/api/auth/health")
        assert resp.status_code == 200

        # Check that X-Request-ID was sent to backend
        forwarded_headers = mock_httpx_client.request.call_args.kwargs["headers"]
        assert "x-request-id" in forwarded_headers
        assert len(forwarded_headers["x-request-id"]) == 36  # UUID format

    @pytest.mark.asyncio
    async def test_x_request_id_in_response(self, client, mock_httpx_client):
        mock_httpx_client.request = AsyncMock(
            return_value=make_httpx_response(200, b'{}')
        )

        resp = await client.get("/api/auth/health")
        assert "x-request-id" in resp.headers
        assert len(resp.headers["x-request-id"]) == 36


# --- Hop-by-hop header stripping ---


class TestHeaderStripping:
    @pytest.mark.asyncio
    async def test_host_header_not_forwarded(self, client, mock_httpx_client):
        mock_httpx_client.request = AsyncMock(
            return_value=make_httpx_response(200, b'{}')
        )

        resp = await client.get("/api/auth/health")
        forwarded_headers = mock_httpx_client.request.call_args.kwargs["headers"]
        assert "host" not in forwarded_headers
