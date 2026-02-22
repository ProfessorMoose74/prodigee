"""
Tests for analytics service routes — child progress, parent dashboard, system metrics.
"""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.dependencies import get_db, get_current_user, get_current_parent
from src.main import app
from tests.conftest import make_mock_doc, make_mock_db, SAMPLE_CHILD_DATA, SAMPLE_PARENT_DATA


# --- Health ---


class TestHealth:
    @pytest.mark.asyncio
    async def test_health(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["service"] == "analytics"


# --- Child Progress ---


class TestChildProgress:
    @pytest.mark.asyncio
    async def test_progress_own_child(self, child_client, override_db):
        """Child accessing their own progress."""
        child_doc = make_mock_doc(SAMPLE_CHILD_DATA, doc_id="child-abc")
        override_db.collection.return_value.document.return_value.get = AsyncMock(
            return_value=child_doc
        )

        resp = await child_client.get(
            "/child/child-abc/progress",
            headers={"Authorization": "Bearer fake"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["child_id"] == "child-abc"
        assert data["display_name"] == "Test Child"
        assert data["current_week"] == 3
        assert isinstance(data["skills"], list)
        assert isinstance(data["sessions"], dict)
        assert isinstance(data["voice"], dict)

    @pytest.mark.asyncio
    async def test_progress_other_child_forbidden(self, child_client, override_db):
        """Child trying to access another child's data."""
        resp = await child_client.get(
            "/child/other-child/progress",
            headers={"Authorization": "Bearer fake"},
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_phonemic_progress(self, child_client, override_db):
        resp = await child_client.get(
            "/child/child-abc/phonemic-progress",
            headers={"Authorization": "Bearer fake"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["child_id"] == "child-abc"
        assert len(data["skills"]) == 8  # all skills including not_started
        assert data["overall_accuracy"] == 0.0

    @pytest.mark.asyncio
    async def test_sessions_empty(self, child_client, override_db):
        resp = await child_client.get(
            "/child/child-abc/sessions",
            headers={"Authorization": "Bearer fake"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["sessions"] == []
        assert data["limit"] == 20
        assert data["offset"] == 0

    @pytest.mark.asyncio
    async def test_sessions_pagination_params(self, child_client, override_db):
        resp = await child_client.get(
            "/child/child-abc/sessions",
            params={"limit": 5, "offset": 10},
            headers={"Authorization": "Bearer fake"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["limit"] == 5
        assert data["offset"] == 10

    @pytest.mark.asyncio
    async def test_assessments_empty(self, child_client, override_db):
        resp = await child_client.get(
            "/child/child-abc/assessments",
            headers={"Authorization": "Bearer fake"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["child_id"] == "child-abc"
        assert data["weekly_summaries"] == []


# --- Parent as child accessor ---


class TestParentChildAccess:
    @pytest.mark.asyncio
    async def test_parent_accesses_own_child(self, parent_client, override_db):
        """Parent accessing their child's progress — verify_child_access checks ownership."""
        child_doc = make_mock_doc(SAMPLE_CHILD_DATA, doc_id="child-abc")
        override_db.collection.return_value.document.return_value.get = AsyncMock(
            return_value=child_doc
        )

        resp = await parent_client.get(
            "/child/child-abc/progress",
            headers={"Authorization": "Bearer fake"},
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_parent_accesses_other_child(self, parent_client, override_db):
        """Parent accessing a child that doesn't belong to them."""
        other_child_doc = make_mock_doc(
            {**SAMPLE_CHILD_DATA, "parent_id": "other-parent"},
            doc_id="other-child",
        )
        override_db.collection.return_value.document.return_value.get = AsyncMock(
            return_value=other_child_doc
        )

        resp = await parent_client.get(
            "/child/other-child/progress",
            headers={"Authorization": "Bearer fake"},
        )
        assert resp.status_code == 403


# --- Parent Dashboard ---


class TestParentDashboard:
    @pytest.mark.asyncio
    async def test_dashboard_own(self, parent_client, override_db):
        parent_doc = make_mock_doc(SAMPLE_PARENT_DATA, doc_id="parent-123")
        child_doc = make_mock_doc(SAMPLE_CHILD_DATA, doc_id="child-abc")

        override_db.collection.return_value.document.return_value.get = AsyncMock(
            side_effect=[parent_doc, child_doc]
        )

        resp = await parent_client.get(
            "/parent/parent-123/dashboard",
            headers={"Authorization": "Bearer fake"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["parent_id"] == "parent-123"
        assert data["display_name"] == "Test Parent"
        assert data["total_children"] == 1
        assert len(data["children"]) == 1
        assert data["children"][0]["child_id"] == "child-abc"

    @pytest.mark.asyncio
    async def test_dashboard_other_parent_forbidden(self, parent_client, override_db):
        resp = await parent_client.get(
            "/parent/other-parent/dashboard",
            headers={"Authorization": "Bearer fake"},
        )
        assert resp.status_code == 403
        assert "another parent" in resp.json()["detail"].lower()


# --- System Metrics ---


class TestSystemMetrics:
    @pytest.mark.asyncio
    async def test_system_metrics(self, client, override_db):
        """System metrics endpoint — no auth required."""
        resp = await client.get("/system/metrics")
        assert resp.status_code == 200
        data = resp.json()
        assert data["service"] == "analytics"
        assert data["status"] == "healthy"
        assert isinstance(data["collections"], dict)

    @pytest.mark.asyncio
    async def test_uptime_format(self, client, override_db):
        resp = await client.get("/system/metrics")
        data = resp.json()
        assert "h" in data["uptime_info"]
        assert "m" in data["uptime_info"]
        assert "s" in data["uptime_info"]


# --- Classroom Report (placeholder) ---


class TestClassroomReport:
    @pytest.mark.asyncio
    async def test_classroom_report_placeholder(self, parent_client, override_db):
        resp = await parent_client.get(
            "/classroom/class-1/report",
            headers={"Authorization": "Bearer fake"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "coming_soon"

    @pytest.mark.asyncio
    async def test_classroom_report_no_auth(self, client):
        resp = await client.get("/classroom/class-1/report")
        assert resp.status_code == 401
