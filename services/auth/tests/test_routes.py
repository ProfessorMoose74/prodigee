"""
Tests for auth service routes — register, login, add_child, child_login, logout, validate.
Uses mocked Firestore via dependency overrides.
"""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from src.dependencies import get_db, get_current_user, get_current_parent, create_token
from src.main import app
from tests.conftest import make_mock_doc, make_mock_db, SAMPLE_PARENT_DATA, SAMPLE_CHILD_DATA


# --- Health Check ---


class TestHealth:
    @pytest.mark.asyncio
    async def test_health(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["service"] == "auth"


# --- Parent Registration ---


class TestParentRegister:
    @pytest.mark.asyncio
    async def test_register_success(self, client, override_db):
        resp = await client.post("/parent/register", json={
            "email": "new@example.com",
            "password": "strongpass123",
            "display_name": "New Parent",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert "token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "new@example.com"
        assert data["user"]["display_name"] == "New Parent"
        assert data["user"]["subscription_tier"] == "free"

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client, override_db):
        # Set up stream to return an existing doc
        existing_doc = make_mock_doc(SAMPLE_PARENT_DATA, doc_id="existing-parent")

        async def stream_with_existing():
            yield existing_doc

        override_db.collection.return_value.where.return_value.limit.return_value.stream = stream_with_existing

        resp = await client.post("/parent/register", json={
            "email": "existing@example.com",
            "password": "strongpass123",
            "display_name": "Duplicate",
        })
        assert resp.status_code == 409
        assert "already registered" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_register_weak_password(self, client):
        resp = await client.post("/parent/register", json={
            "email": "new@example.com",
            "password": "short",  # min_length=8
            "display_name": "Test",
        })
        assert resp.status_code == 422  # validation error

    @pytest.mark.asyncio
    async def test_register_invalid_email(self, client):
        resp = await client.post("/parent/register", json={
            "email": "not-an-email",
            "password": "strongpass123",
            "display_name": "Test",
        })
        assert resp.status_code == 422


# --- Parent Login ---


class TestParentLogin:
    @pytest.mark.asyncio
    async def test_login_success(self, client, override_db):
        from src.dependencies import hash_password

        parent_data = {**SAMPLE_PARENT_DATA, "password_hash": hash_password("correct123")}
        doc = make_mock_doc(parent_data, doc_id="parent-123")

        async def stream_with_parent():
            yield doc

        override_db.collection.return_value.where.return_value.limit.return_value.stream = stream_with_parent

        resp = await client.post("/parent/login", json={
            "email": "parent@example.com",
            "password": "correct123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["user"]["email"] == "parent@example.com"

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client, override_db):
        from src.dependencies import hash_password

        parent_data = {**SAMPLE_PARENT_DATA, "password_hash": hash_password("correct123")}
        doc = make_mock_doc(parent_data, doc_id="parent-123")

        async def stream_with_parent():
            yield doc

        override_db.collection.return_value.where.return_value.limit.return_value.stream = stream_with_parent

        resp = await client.post("/parent/login", json={
            "email": "parent@example.com",
            "password": "wrongpass",
        })
        assert resp.status_code == 401
        assert "invalid" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_login_nonexistent_email(self, client, override_db):
        # Default mock: stream yields nothing
        resp = await client.post("/parent/login", json={
            "email": "nobody@example.com",
            "password": "anypassword",
        })
        assert resp.status_code == 401
        assert "invalid" in resp.json()["detail"].lower()


# --- Add Child ---


class TestAddChild:
    @pytest.mark.asyncio
    async def test_add_child_success(self, client, override_parent_auth, override_db):
        resp = await client.post(
            "/parent/add_child",
            json={
                "display_name": "Little One",
                "age": 5,
                "grade_level": "K",
                "avatar": "fox",
                "learning_style": "auditory",
            },
            headers={"Authorization": "Bearer fake-token"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["display_name"] == "Little One"
        assert data["age"] == 5
        assert data["age_range"] == "3-5"
        assert data["current_week"] == 1
        assert data["total_stars"] == 0

    @pytest.mark.asyncio
    async def test_add_child_age_range_6_8(self, client, override_parent_auth, override_db):
        resp = await client.post(
            "/parent/add_child",
            json={"display_name": "Middle Kid", "age": 7},
            headers={"Authorization": "Bearer fake-token"},
        )
        assert resp.status_code == 201
        assert resp.json()["age_range"] == "6-8"

    @pytest.mark.asyncio
    async def test_add_child_age_too_low(self, client, override_parent_auth):
        resp = await client.post(
            "/parent/add_child",
            json={"display_name": "Baby", "age": 2},  # min 3
            headers={"Authorization": "Bearer fake-token"},
        )
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_add_child_age_too_high(self, client, override_parent_auth):
        resp = await client.post(
            "/parent/add_child",
            json={"display_name": "Adult", "age": 19},  # max 18
            headers={"Authorization": "Bearer fake-token"},
        )
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_add_child_no_auth(self, client):
        resp = await client.post(
            "/parent/add_child",
            json={"display_name": "Kid", "age": 5},
        )
        assert resp.status_code == 401


# --- Child Login ---


class TestChildLogin:
    @pytest.mark.asyncio
    async def test_child_login_success(self, client, parent_token, override_db):
        child_doc = make_mock_doc(SAMPLE_CHILD_DATA, doc_id="child-abc")
        override_db.collection.return_value.document.return_value.get = AsyncMock(
            return_value=child_doc
        )

        # Token blacklist check returns non-blacklisted
        blacklist_doc = make_mock_doc({}, exists=False)

        original_get = override_db.collection.return_value.document.return_value.get

        async def route_get_by_collection(*args, **kwargs):
            return child_doc

        # We need to handle both collections — use side_effect
        call_count = 0

        async def smart_get():
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                return blacklist_doc  # token_blacklist check
            return child_doc  # children doc

        override_db.collection.return_value.document.return_value.get = AsyncMock(
            side_effect=[blacklist_doc, child_doc]
        )

        resp = await client.post("/child/login", json={
            "parent_token": parent_token,
            "child_id": "child-abc",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["session_limit_minutes"] == 30  # 3-5 age range
        assert data["user"]["display_name"] == "Test Child"

    @pytest.mark.asyncio
    async def test_child_login_child_not_found(self, client, parent_token, override_db):
        not_found = make_mock_doc({}, exists=False)
        blacklist_doc = make_mock_doc({}, exists=False)

        override_db.collection.return_value.document.return_value.get = AsyncMock(
            side_effect=[blacklist_doc, not_found]
        )

        resp = await client.post("/child/login", json={
            "parent_token": parent_token,
            "child_id": "nonexistent",
        })
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_child_login_wrong_parent(self, client, parent_token, override_db):
        wrong_parent_child = make_mock_doc(
            {**SAMPLE_CHILD_DATA, "parent_id": "different-parent"},
            doc_id="child-xyz",
        )
        blacklist_doc = make_mock_doc({}, exists=False)

        override_db.collection.return_value.document.return_value.get = AsyncMock(
            side_effect=[blacklist_doc, wrong_parent_child]
        )

        resp = await client.post("/child/login", json={
            "parent_token": parent_token,
            "child_id": "child-xyz",
        })
        assert resp.status_code == 403
        assert "does not belong" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_child_login_with_child_token_rejected(self, client, child_token, override_db):
        blacklist_doc = make_mock_doc({}, exists=False)
        override_db.collection.return_value.document.return_value.get = AsyncMock(
            return_value=blacklist_doc
        )

        resp = await client.post("/child/login", json={
            "parent_token": child_token,
            "child_id": "child-abc",
        })
        assert resp.status_code == 403
        assert "parent token" in resp.json()["detail"].lower()


# --- Logout ---


class TestLogout:
    @pytest.mark.asyncio
    async def test_logout_success(self, client, parent_token, override_db):
        blacklist_doc = make_mock_doc({}, exists=False)
        override_db.collection.return_value.document.return_value.get = AsyncMock(
            return_value=blacklist_doc
        )

        resp = await client.post(
            "/logout",
            headers={"Authorization": f"Bearer {parent_token}"},
        )
        assert resp.status_code == 200
        assert "logged out" in resp.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_logout_no_token(self, client):
        resp = await client.post("/logout")
        assert resp.status_code == 401


# --- Token Validation ---


class TestTokenValidation:
    @pytest.mark.asyncio
    async def test_validate_valid_token(self, client, parent_token, override_db):
        blacklist_doc = make_mock_doc({}, exists=False)
        override_db.collection.return_value.document.return_value.get = AsyncMock(
            return_value=blacklist_doc
        )

        resp = await client.post("/token/validate", json={"token": parent_token})
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is True
        assert data["user_id"] == "parent-123"
        assert data["user_type"] == "parent"

    @pytest.mark.asyncio
    async def test_validate_invalid_token(self, client):
        resp = await client.post("/token/validate", json={"token": "garbage.token.here"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is False
        assert data["user_id"] is None

    @pytest.mark.asyncio
    async def test_validate_blacklisted_token(self, client, parent_token, override_db):
        blacklisted = make_mock_doc({"blacklisted_at": datetime.now(timezone.utc)}, exists=True)
        override_db.collection.return_value.document.return_value.get = AsyncMock(
            return_value=blacklisted
        )

        resp = await client.post("/token/validate", json={"token": parent_token})
        assert resp.status_code == 200
        assert resp.json()["valid"] is False
