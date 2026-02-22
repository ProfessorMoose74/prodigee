"""
End-to-end integration tests — runs against the live docker-compose stack.

Prerequisites:
    docker compose up --build
    pip install httpx pytest pytest-asyncio

Usage:
    pytest tests/test_integration.py -v

These tests hit the gateway (localhost:8080) which proxies to real services
with a real Firestore emulator. No mocking — full stack.
"""

import httpx
import pytest

GATEWAY = "http://localhost:8080"


@pytest.fixture(scope="module")
def client():
    """Sync httpx client — integration tests run sequentially."""
    with httpx.Client(base_url=GATEWAY, timeout=15.0) as c:
        yield c


@pytest.fixture(scope="module")
def test_state():
    """Shared state across the test module for the full E2E flow."""
    return {}


# === Phase 1: Health Checks ===


class TestHealthChecks:
    def test_gateway_health(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"

    def test_services_health(self, client):
        resp = client.get("/services/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["gateway"] == "healthy"
        # At minimum auth, learning-engine, analytics should be healthy
        services = data["services"]
        assert services.get("auth") == "healthy", f"Auth unhealthy: {services}"
        assert services.get("learning") == "healthy", f"Learning unhealthy: {services}"
        assert services.get("analytics") == "healthy", f"Analytics unhealthy: {services}"

    def test_gateway_root(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        assert resp.json()["service"] == "prodigee-gateway"


# === Phase 2: Parent Registration & Login ===


class TestParentAuth:
    def test_register_parent(self, client, test_state):
        resp = client.post("/api/auth/parent/register", json={
            "email": "integration-test@prodigee.com",
            "password": "TestPass123!",
            "display_name": "Integration Test Parent",
        })
        assert resp.status_code == 201, f"Register failed: {resp.text}"
        data = resp.json()
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "integration-test@prodigee.com"

        test_state["parent_token"] = data["token"]
        test_state["parent_id"] = data["user"]["id"]

    def test_register_duplicate_email(self, client, test_state):
        resp = client.post("/api/auth/parent/register", json={
            "email": "integration-test@prodigee.com",
            "password": "AnotherPass123!",
            "display_name": "Duplicate",
        })
        assert resp.status_code == 409

    def test_login_parent(self, client, test_state):
        resp = client.post("/api/auth/parent/login", json={
            "email": "integration-test@prodigee.com",
            "password": "TestPass123!",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["user"]["id"] == test_state["parent_id"]
        # Use the fresh token going forward
        test_state["parent_token"] = data["token"]

    def test_login_wrong_password(self, client):
        resp = client.post("/api/auth/parent/login", json={
            "email": "integration-test@prodigee.com",
            "password": "WrongPassword",
        })
        assert resp.status_code == 401

    def test_validate_parent_token(self, client, test_state):
        resp = client.post("/api/auth/token/validate", json={
            "token": test_state["parent_token"],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is True
        assert data["user_type"] == "parent"


# === Phase 3: Add Child (COPPA) ===


class TestAddChild:
    def test_add_child(self, client, test_state):
        resp = client.post(
            "/api/auth/parent/add_child",
            json={
                "display_name": "Test Child",
                "age": 5,
                "grade_level": "K",
                "avatar": "fox",
                "learning_style": "visual",
            },
            headers={"Authorization": f"Bearer {test_state['parent_token']}"},
        )
        assert resp.status_code == 201, f"Add child failed: {resp.text}"
        data = resp.json()
        assert data["display_name"] == "Test Child"
        assert data["age"] == 5
        assert data["age_range"] == "3-5"
        assert data["current_week"] == 1

        test_state["child_id"] = data["id"]

    def test_add_child_no_auth(self, client):
        resp = client.post("/api/auth/parent/add_child", json={
            "display_name": "Unauthorized",
            "age": 5,
        })
        assert resp.status_code == 401


# === Phase 4: Child Login ===


class TestChildLogin:
    def test_child_login(self, client, test_state):
        resp = client.post("/api/auth/child/login", json={
            "parent_token": test_state["parent_token"],
            "child_id": test_state["child_id"],
        })
        assert resp.status_code == 200, f"Child login failed: {resp.text}"
        data = resp.json()
        assert data["session_limit_minutes"] == 30  # age 5 -> "3-5" -> 30 min
        assert data["user"]["display_name"] == "Test Child"

        test_state["child_token"] = data["token"]

    def test_child_login_wrong_parent(self, client, test_state):
        """Register a second parent and try to login as the first parent's child."""
        resp = client.post("/api/auth/parent/register", json={
            "email": "other-parent@prodigee.com",
            "password": "OtherPass123!",
            "display_name": "Other Parent",
        })
        if resp.status_code == 201:
            other_token = resp.json()["token"]
        else:
            # Already exists from previous run — login instead
            resp = client.post("/api/auth/parent/login", json={
                "email": "other-parent@prodigee.com",
                "password": "OtherPass123!",
            })
            other_token = resp.json()["token"]

        resp = client.post("/api/auth/child/login", json={
            "parent_token": other_token,
            "child_id": test_state["child_id"],
        })
        assert resp.status_code == 403


# === Phase 5: Learning Engine ===


class TestLearningEngine:
    def test_curriculum_week_1(self, client):
        resp = client.get("/api/learning/curriculum/week/1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["week_number"] == 1
        assert "rhyming" in data["active_skills"]

    def test_subjects(self, client):
        resp = client.get("/api/learning/subjects")
        assert resp.status_code == 200
        assert len(resp.json()) == 3

    def test_child_dashboard(self, client, test_state):
        resp = client.get(
            "/api/learning/child/dashboard",
            headers={"Authorization": f"Bearer {test_state['child_token']}"},
        )
        assert resp.status_code == 200, f"Dashboard failed: {resp.text}"
        data = resp.json()
        assert data["child"]["id"] == test_state["child_id"]
        assert data["child"]["current_week"] == 1

    def test_get_activity(self, client, test_state):
        resp = client.get(
            "/api/learning/child/activity/rhyming",
            headers={"Authorization": f"Bearer {test_state['child_token']}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["skill_name"] == "rhyming"
        assert data["mastery_level"] == "not_started"

    def test_complete_activity(self, client, test_state):
        resp = client.post(
            "/api/learning/child/activity/rhyming/complete",
            json={
                "accuracy": 85.0,
                "duration": 200,
                "stars_earned": 3,
                "engagement": 9.0,
            },
            headers={"Authorization": f"Bearer {test_state['child_token']}"},
        )
        assert resp.status_code == 200, f"Complete activity failed: {resp.text}"
        data = resp.json()
        assert data["progress_gained"] > 0
        assert data["new_progress"] > 0
        assert data["stars_earned"] == 3
        assert data["message"] == "Great job!"

        test_state["progress_after_activity"] = data["new_progress"]

    def test_voice_process_simulated(self, client, test_state):
        resp = client.post(
            "/api/learning/voice/process",
            json={
                "audio_data": "dGVzdCBhdWRpbw==",
                "expected_response": "cat",
            },
            headers={"Authorization": f"Bearer {test_state['child_token']}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        # Simulated mode (no real speech API in docker-compose)
        assert data["source"] == "simulated"

    def test_ai_recommendation(self, client, test_state):
        resp = client.post(
            "/api/learning/ai/recommendation",
            json={},
            headers={"Authorization": f"Bearer {test_state['child_token']}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["source"] == "rule_based"  # No Vertex AI in local
        assert data["recommended_skill"] in [
            "rhyming", "onset_fluency", "blending", "isolating",
            "segmenting", "adding", "deleting", "substituting",
        ]


# === Phase 6: Analytics — Verify data written by learning engine ===


class TestAnalytics:
    def test_child_progress(self, client, test_state):
        resp = client.get(
            f"/api/analytics/child/{test_state['child_id']}/progress",
            headers={"Authorization": f"Bearer {test_state['child_token']}"},
        )
        assert resp.status_code == 200, f"Progress failed: {resp.text}"
        data = resp.json()
        assert data["child_id"] == test_state["child_id"]
        assert data["total_stars"] >= 3  # from the activity we completed

    def test_phonemic_progress(self, client, test_state):
        resp = client.get(
            f"/api/analytics/child/{test_state['child_id']}/phonemic-progress",
            headers={"Authorization": f"Bearer {test_state['child_token']}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        # Should have rhyming progress from the activity we completed
        rhyming = next((s for s in data["skills"] if s["skill"] == "rhyming"), None)
        assert rhyming is not None
        assert rhyming["accuracy"] > 0

    def test_sessions(self, client, test_state):
        resp = client.get(
            f"/api/analytics/child/{test_state['child_id']}/sessions",
            headers={"Authorization": f"Bearer {test_state['child_token']}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 1
        assert data["sessions"][0]["activity_type"] == "rhyming"

    def test_parent_dashboard(self, client, test_state):
        resp = client.get(
            f"/api/analytics/parent/{test_state['parent_id']}/dashboard",
            headers={"Authorization": f"Bearer {test_state['parent_token']}"},
        )
        assert resp.status_code == 200, f"Parent dashboard failed: {resp.text}"
        data = resp.json()
        assert data["total_children"] >= 1
        child_summary = data["children"][0]
        assert child_summary["child_id"] == test_state["child_id"]

    def test_system_metrics(self, client):
        resp = client.get("/api/analytics/system/metrics")
        assert resp.status_code == 200
        data = resp.json()
        assert data["service"] == "analytics"

    def test_child_cannot_access_other_data(self, client, test_state):
        resp = client.get(
            "/api/analytics/child/nonexistent-child/progress",
            headers={"Authorization": f"Bearer {test_state['child_token']}"},
        )
        assert resp.status_code == 403


# === Phase 7: Token Blacklisting Across Services ===


class TestTokenBlacklisting:
    def test_logout_and_verify_blacklisted(self, client, test_state):
        # Logout (blacklist the child token)
        resp = client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {test_state['child_token']}"},
        )
        assert resp.status_code == 200

        # Verify the token is now rejected by the learning engine
        resp = client.get(
            "/api/learning/child/dashboard",
            headers={"Authorization": f"Bearer {test_state['child_token']}"},
        )
        assert resp.status_code == 401, (
            "Blacklisted token should be rejected by learning engine"
        )

        # Verify the token is also rejected by analytics
        resp = client.get(
            f"/api/analytics/child/{test_state['child_id']}/progress",
            headers={"Authorization": f"Bearer {test_state['child_token']}"},
        )
        assert resp.status_code == 401, (
            "Blacklisted token should be rejected by analytics"
        )

    def test_validate_returns_invalid_for_blacklisted(self, client, test_state):
        resp = client.post("/api/auth/token/validate", json={
            "token": test_state["child_token"],
        })
        assert resp.status_code == 200
        assert resp.json()["valid"] is False


# === Phase 8: X-Request-ID Tracing ===


class TestRequestTracing:
    def test_x_request_id_in_proxy_response(self, client):
        resp = client.get("/api/learning/curriculum/week/1")
        assert "x-request-id" in resp.headers
        assert len(resp.headers["x-request-id"]) == 36  # UUID
