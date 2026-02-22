"""
Shared test fixtures for analytics service.
"""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from src.dependencies import get_db, get_current_user, get_current_parent
from src.main import app


# --- Mock Firestore helpers ---


def make_mock_doc(data: dict, doc_id: str = "test-id", exists: bool = True):
    doc = MagicMock()
    doc.exists = exists
    doc.id = doc_id
    doc.to_dict.return_value = data
    return doc


def make_mock_db():
    db = MagicMock()

    missing = make_mock_doc({}, exists=False)
    db.collection.return_value.document.return_value.get = AsyncMock(return_value=missing)

    async def empty_stream():
        return
        yield

    db.collection.return_value.where.return_value.stream = empty_stream
    db.collection.return_value.where.return_value.limit.return_value.stream = empty_stream
    db.collection.return_value.where.return_value.order_by.return_value.limit.return_value.stream = empty_stream
    db.collection.return_value.limit.return_value.stream = empty_stream

    db.collection.return_value.document.return_value.set = AsyncMock()
    db.collection.return_value.document.return_value.update = AsyncMock()

    return db


# --- Fixtures ---


@pytest.fixture
def mock_db():
    return make_mock_db()


@pytest.fixture
def override_db(mock_db):
    app.dependency_overrides[get_db] = lambda: mock_db
    yield mock_db
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def child_user():
    return {
        "id": "child-abc",
        "type": "child",
        "parent_id": "parent-123",
        "jti": "test-jti",
        "exp": int(datetime.now(timezone.utc).timestamp()) + 14400,
    }


@pytest.fixture
def parent_user():
    return {
        "id": "parent-123",
        "type": "parent",
        "email": "test@example.com",
        "jti": "test-jti",
        "exp": int(datetime.now(timezone.utc).timestamp()) + 86400,
    }


@pytest.fixture
def override_child_auth(child_user, override_db):
    app.dependency_overrides[get_current_user] = lambda: child_user
    yield
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
def override_parent_auth(parent_user, override_db):
    app.dependency_overrides[get_current_user] = lambda: parent_user
    app.dependency_overrides[get_current_parent] = lambda: parent_user
    yield
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_current_parent, None)


@pytest.fixture
async def client(override_db):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture
async def child_client(override_child_auth):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture
async def parent_client(override_parent_auth):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


SAMPLE_CHILD_DATA = {
    "parent_id": "parent-123",
    "display_name": "Test Child",
    "age": 5,
    "age_range": "3-5",
    "current_week": 3,
    "total_stars": 15,
    "streak_days": 5,
    "avatar": "fox",
    "created_at": datetime(2025, 12, 15, tzinfo=timezone.utc),
}

SAMPLE_PARENT_DATA = {
    "email": "parent@example.com",
    "display_name": "Test Parent",
    "subscription_tier": "free",
    "children": ["child-abc"],
    "created_at": datetime(2025, 12, 1, tzinfo=timezone.utc),
}
