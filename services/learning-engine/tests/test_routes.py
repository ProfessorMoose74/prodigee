"""
Tests for learning engine routes — curriculum, dashboard, activity, voice, AI.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from src.dependencies import get_db, get_current_user, get_current_child
from src.main import app
from tests.conftest import make_mock_doc, make_mock_db, SAMPLE_CHILD_DATA


# --- Health ---


class TestHealth:
    @pytest.mark.asyncio
    async def test_health(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["service"] == "learning-engine"


# --- Curriculum Routes (no auth) ---


class TestCurriculumRoutes:
    @pytest.mark.asyncio
    async def test_get_week_1(self, client):
        resp = await client.get("/curriculum/week/1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["week_number"] == 1
        assert "rhyming" in data["active_skills"]
        assert isinstance(data["week_activities"], dict)
        assert isinstance(data["nursery_rhyme"], dict)

    @pytest.mark.asyncio
    async def test_get_week_35(self, client):
        resp = await client.get("/curriculum/week/35")
        assert resp.status_code == 200
        assert "substituting" in resp.json()["active_skills"]

    @pytest.mark.asyncio
    async def test_get_week_0_invalid(self, client):
        resp = await client.get("/curriculum/week/0")
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_get_week_36_invalid(self, client):
        resp = await client.get("/curriculum/week/36")
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_list_subjects(self, client):
        resp = await client.get("/subjects")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 3
        ids = [s["subject_id"] for s in data]
        assert "phonemic" in ids

    @pytest.mark.asyncio
    async def test_list_subjects_filtered(self, client):
        resp = await client.get("/subjects", params={"age_range": "3-5"})
        assert resp.status_code == 200
        for s in resp.json():
            assert "3-5" in s["age_ranges"]

    @pytest.mark.asyncio
    async def test_list_content(self, client):
        resp = await client.get("/content")
        assert resp.status_code == 200
        assert len(resp.json()) > 0

    @pytest.mark.asyncio
    async def test_list_content_by_subject(self, client):
        resp = await client.get("/content", params={"subject": "phonemic"})
        assert resp.status_code == 200
        assert all(item["subject"] == "phonemic" for item in resp.json())


# --- Dashboard Routes (child auth) ---


class TestDashboardRoutes:
    @pytest.mark.asyncio
    async def test_dashboard(self, child_client, override_db):
        child_doc = make_mock_doc(SAMPLE_CHILD_DATA, doc_id="child-abc")
        override_db.collection.return_value.document.return_value.get = AsyncMock(
            return_value=child_doc
        )

        resp = await child_client.get(
            "/child/dashboard",
            headers={"Authorization": "Bearer fake"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["child"]["id"] == "child-abc"
        assert data["child"]["current_week"] == 3
        assert isinstance(data["progress"], dict)
        assert isinstance(data["recommendation"], dict)
        assert data["recommendation"]["source"] == "rule_based"

    @pytest.mark.asyncio
    async def test_get_activity_rhyming(self, child_client, override_db):
        child_doc = make_mock_doc(SAMPLE_CHILD_DATA, doc_id="child-abc")
        override_db.collection.return_value.document.return_value.get = AsyncMock(
            return_value=child_doc
        )

        resp = await child_client.get(
            "/child/activity/rhyming",
            headers={"Authorization": "Bearer fake"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["skill_name"] == "rhyming"
        assert data["mastery_level"] == "not_started"

    @pytest.mark.asyncio
    async def test_get_activity_invalid_type(self, child_client):
        resp = await child_client.get(
            "/child/activity/nonexistent",
            headers={"Authorization": "Bearer fake"},
        )
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_complete_activity(self, child_client, override_db):
        child_doc = make_mock_doc(SAMPLE_CHILD_DATA, doc_id="child-abc")
        progress_doc = make_mock_doc({
            "accuracy": 30.0, "attempts": 5, "correct": 3,
        }, doc_id="child-abc_rhyming")

        override_db.collection.return_value.document.return_value.get = AsyncMock(
            side_effect=[child_doc, progress_doc]
        )

        resp = await child_client.post(
            "/child/activity/rhyming/complete",
            json={
                "accuracy": 85.0,
                "duration": 200,
                "stars_earned": 3,
                "engagement": 9.0,
            },
            headers={"Authorization": "Bearer fake"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["progress_gained"] > 0
        assert data["new_progress"] > 30.0
        assert data["stars_earned"] == 3
        assert data["message"] == "Great job!"

    @pytest.mark.asyncio
    async def test_complete_activity_low_accuracy(self, child_client, override_db):
        child_doc = make_mock_doc(SAMPLE_CHILD_DATA, doc_id="child-abc")
        progress_doc = make_mock_doc({}, exists=False)

        override_db.collection.return_value.document.return_value.get = AsyncMock(
            side_effect=[child_doc, progress_doc]
        )

        resp = await child_client.post(
            "/child/activity/rhyming/complete",
            json={"accuracy": 40.0, "duration": 200},
            headers={"Authorization": "Bearer fake"},
        )
        assert resp.status_code == 200
        assert resp.json()["message"] == "Keep practicing!"

    @pytest.mark.asyncio
    async def test_complete_activity_invalid_type(self, child_client):
        resp = await child_client.post(
            "/child/activity/fake_skill/complete",
            json={"accuracy": 80.0, "duration": 200},
            headers={"Authorization": "Bearer fake"},
        )
        assert resp.status_code == 400


# --- Voice Routes (child auth, simulated fallback) ---


class TestVoiceRoutes:
    @pytest.mark.asyncio
    async def test_process_voice_simulated(self, child_client, override_db):
        """With no Speech client available, should use simulated fallback."""
        with patch("src.routes.voice.get_speech_client", return_value=None):
            resp = await child_client.post(
                "/voice/process",
                json={
                    "audio_data": "dGVzdCBhdWRpbw==",  # base64 "test audio"
                    "expected_response": "cat",
                    "activity_type": "pronunciation",
                },
                headers={"Authorization": "Bearer fake"},
            )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["source"] == "simulated"
        assert data["transcript"] == "cat"
        assert data["accuracy_score"] == 0.85

    @pytest.mark.asyncio
    async def test_synthesize_speech_unavailable(self, child_client):
        """With no TTS client available, should return unavailable."""
        with patch("src.routes.voice.get_tts_client", return_value=None):
            resp = await child_client.post(
                "/voice/synthesize",
                json={"text": "Hello little learner"},
                headers={"Authorization": "Bearer fake"},
            )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is False
        assert data["source"] == "unavailable"
        assert data["duration_estimate"] > 0


# --- Voice Text Accuracy Helper ---


class TestTextAccuracy:
    def test_exact_match(self):
        from src.routes.voice import _calculate_text_accuracy

        assert _calculate_text_accuracy("cat", "cat") == 1.0

    def test_case_insensitive(self):
        from src.routes.voice import _calculate_text_accuracy

        assert _calculate_text_accuracy("Cat", "cat") == 1.0

    def test_partial_match(self):
        from src.routes.voice import _calculate_text_accuracy

        score = _calculate_text_accuracy("cat", "bat")
        assert 0 < score < 1.0

    def test_empty_strings(self):
        from src.routes.voice import _calculate_text_accuracy

        assert _calculate_text_accuracy("", "cat") == 0.0
        assert _calculate_text_accuracy("cat", "") == 0.0


# --- AI Routes ---


class TestAIRoutes:
    @pytest.mark.asyncio
    async def test_recommendation_child_token(self, child_client, override_db):
        """Child token: uses child's own ID."""
        child_doc = make_mock_doc(SAMPLE_CHILD_DATA, doc_id="child-abc")
        override_db.collection.return_value.document.return_value.get = AsyncMock(
            return_value=child_doc
        )

        with patch("src.routes.ai.get_vertex_model", return_value=None):
            resp = await child_client.post(
                "/ai/recommendation",
                json={},
                headers={"Authorization": "Bearer fake"},
            )
        assert resp.status_code == 200
        data = resp.json()
        assert data["source"] == "rule_based"
        assert data["recommended_skill"] in [
            "rhyming", "onset_fluency", "blending", "isolating",
            "segmenting", "adding", "deleting", "substituting",
        ]

    @pytest.mark.asyncio
    async def test_recommendation_parent_needs_child_id(self, override_db, parent_user):
        """Parent token without child_id should return 400."""
        app.dependency_overrides[get_current_user] = lambda: parent_user
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as c:
            resp = await c.post(
                "/ai/recommendation",
                json={},
                headers={"Authorization": "Bearer fake"},
            )
        app.dependency_overrides.pop(get_current_user, None)
        assert resp.status_code == 400
        assert "child_id required" in resp.json()["detail"]
