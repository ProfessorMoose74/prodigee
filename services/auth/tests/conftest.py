"""
Shared test fixtures for auth service.
"""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from src.dependencies import get_db, get_current_user, get_current_parent, create_token
from src.main import app


# --- Mock Firestore helpers ---


def make_mock_doc(data: dict, doc_id: str = "test-id", exists: bool = True):
    """Create a mock Firestore document snapshot."""
    doc = MagicMock()
    doc.exists = exists
    doc.id = doc_id
    doc.to_dict.return_value = data
    return doc


def make_mock_db():
    """Create a mock async Firestore client."""
    db = MagicMock()

    # Default: .document().get() returns non-existent doc
    missing = make_mock_doc({}, exists=False)
    db.collection.return_value.document.return_value.get = AsyncMock(return_value=missing)

    # Default: .where().limit().stream() yields nothing
    async def empty_stream():
        return
        yield  # noqa: make it an async generator

    db.collection.return_value.where.return_value.limit.return_value.stream = empty_stream

    # Default: .document().set() and .update() succeed
    db.collection.return_value.document.return_value.set = AsyncMock()
    db.collection.return_value.document.return_value.update = AsyncMock()

    # Batch
    batch = AsyncMock()
    db.batch.return_value = batch

    return db


# --- Fixtures ---


@pytest.fixture
def mock_db():
    return make_mock_db()


@pytest.fixture
def override_db(mock_db):
    """Override the get_db dependency with a mock."""
    app.dependency_overrides[get_db] = lambda: mock_db
    yield mock_db
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
async def client(override_db):
    """Async test client with mocked Firestore."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture
def parent_token():
    """Generate a valid parent JWT for testing."""
    token, _ = create_token(
        "parent-123", "parent", extra_claims={"email": "test@example.com"}
    )
    return token


@pytest.fixture
def child_token():
    """Generate a valid child JWT for testing."""
    token, _ = create_token(
        "child-abc", "child", extra_claims={"parent_id": "parent-123"}
    )
    return token


@pytest.fixture
def parent_user():
    """Decoded parent user dict (as returned by get_current_user)."""
    return {
        "id": "parent-123",
        "type": "parent",
        "email": "test@example.com",
        "jti": "test-jti-parent",
        "exp": int(datetime.now(timezone.utc).timestamp()) + 86400,
    }


@pytest.fixture
def child_user():
    """Decoded child user dict."""
    return {
        "id": "child-abc",
        "type": "child",
        "parent_id": "parent-123",
        "jti": "test-jti-child",
        "exp": int(datetime.now(timezone.utc).timestamp()) + 14400,
    }


@pytest.fixture
def override_parent_auth(parent_user, override_db):
    """Override auth to return a parent user without real JWT validation."""
    app.dependency_overrides[get_current_user] = lambda: parent_user
    app.dependency_overrides[get_current_parent] = lambda: parent_user
    yield
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_current_parent, None)


SAMPLE_PARENT_DATA = {
    "email": "parent@example.com",
    "password_hash": "$2b$12$LJ3m5Ev7Cxe9rlGFm/UH6OZ2X0e8yS1fN0p3w2lD7v8MjR4dPxKSi",
    "display_name": "Test Parent",
    "subscription_tier": "free",
    "children": ["child-abc"],
    "last_login": datetime(2026, 1, 1, tzinfo=timezone.utc),
    "created_at": datetime(2025, 12, 1, tzinfo=timezone.utc),
}

SAMPLE_CHILD_DATA = {
    "parent_id": "parent-123",
    "display_name": "Test Child",
    "age": 5,
    "age_range": "3-5",
    "grade_level": "K",
    "avatar": "fox",
    "learning_style": "visual",
    "current_week": 3,
    "total_stars": 15,
    "streak_days": 5,
    "last_login": None,
    "created_at": datetime(2025, 12, 15, tzinfo=timezone.utc),
}
