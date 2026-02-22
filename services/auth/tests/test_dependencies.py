"""
Tests for auth pure functions — password hashing, JWT, age ranges, session limits.
No Firestore mocking needed for most of these.
"""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import jwt
import pytest
from fastapi import HTTPException

from src.config import settings
from src.dependencies import (
    create_token,
    decode_token,
    hash_password,
    is_token_blacklisted,
    blacklist_token,
    verify_password,
)
from src.routes.parent import _age_range
from src.routes.child import _session_limit


# --- Password Hashing ---


class TestPasswordHashing:
    def test_hash_password_returns_bcrypt_hash(self):
        hashed = hash_password("mypassword123")
        assert hashed.startswith("$2b$")
        assert len(hashed) > 50

    def test_hash_password_different_salts(self):
        h1 = hash_password("same_password")
        h2 = hash_password("same_password")
        assert h1 != h2  # different salts

    def test_verify_password_correct(self):
        hashed = hash_password("correct_password")
        assert verify_password("correct_password", hashed) is True

    def test_verify_password_wrong(self):
        hashed = hash_password("correct_password")
        assert verify_password("wrong_password", hashed) is False


# --- JWT ---


class TestJWT:
    def test_create_token_parent(self):
        token, expires_in = create_token("user-1", "parent")
        assert isinstance(token, str)
        assert expires_in == settings.parent_token_expiry_hours * 3600

    def test_create_token_child(self):
        token, expires_in = create_token("child-1", "child")
        assert isinstance(token, str)
        assert expires_in == settings.child_token_expiry_hours * 3600

    def test_create_token_with_extra_claims(self):
        token, _ = create_token("user-1", "parent", extra_claims={"email": "a@b.com"})
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        assert payload["email"] == "a@b.com"
        assert payload["id"] == "user-1"
        assert payload["type"] == "parent"

    def test_create_token_includes_jti(self):
        token, _ = create_token("user-1", "parent")
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        assert "jti" in payload
        assert len(payload["jti"]) == 36  # UUID format

    def test_decode_token_valid(self):
        token, _ = create_token("user-1", "parent")
        payload = decode_token(token)
        assert payload["id"] == "user-1"
        assert payload["type"] == "parent"

    def test_decode_token_expired(self):
        # Create an already-expired token
        expired_token = jwt.encode(
            {"id": "user-1", "type": "parent", "jti": "abc", "exp": 1000000},
            settings.jwt_secret,
            algorithm=settings.jwt_algorithm,
        )
        with pytest.raises(HTTPException) as exc_info:
            decode_token(expired_token)
        assert exc_info.value.status_code == 401
        assert "expired" in exc_info.value.detail.lower()

    def test_decode_token_invalid_signature(self):
        token = jwt.encode(
            {"id": "user-1", "type": "parent", "jti": "abc"},
            "wrong-secret",
            algorithm="HS256",
        )
        with pytest.raises(HTTPException) as exc_info:
            decode_token(token)
        assert exc_info.value.status_code == 401

    def test_decode_token_garbage(self):
        with pytest.raises(HTTPException):
            decode_token("not.a.real.token")


# --- Token Blacklist ---


class TestTokenBlacklist:
    @pytest.mark.asyncio
    async def test_is_token_blacklisted_true(self):
        db = MagicMock()
        doc = MagicMock()
        doc.exists = True
        db.collection.return_value.document.return_value.get = AsyncMock(return_value=doc)

        result = await is_token_blacklisted("some-jti", db)
        assert result is True
        db.collection.assert_called_with("token_blacklist")

    @pytest.mark.asyncio
    async def test_is_token_blacklisted_false(self):
        db = MagicMock()
        doc = MagicMock()
        doc.exists = False
        db.collection.return_value.document.return_value.get = AsyncMock(return_value=doc)

        result = await is_token_blacklisted("some-jti", db)
        assert result is False

    @pytest.mark.asyncio
    async def test_blacklist_token_writes_doc(self):
        db = MagicMock()
        db.collection.return_value.document.return_value.set = AsyncMock()

        expires = datetime(2026, 3, 1, tzinfo=timezone.utc)
        await blacklist_token("jti-123", expires, db)

        db.collection.return_value.document.assert_called_with("jti-123")
        call_args = db.collection.return_value.document.return_value.set.call_args[0][0]
        assert call_args["expires_at"] == expires
        assert "blacklisted_at" in call_args


# --- Age Range Helper ---


class TestAgeRange:
    def test_age_3(self):
        assert _age_range(3) == "3-5"

    def test_age_5(self):
        assert _age_range(5) == "3-5"

    def test_age_6(self):
        assert _age_range(6) == "6-8"

    def test_age_8(self):
        assert _age_range(8) == "6-8"

    def test_age_9(self):
        assert _age_range(9) == "9-12"

    def test_age_12(self):
        assert _age_range(12) == "9-12"

    def test_age_13(self):
        assert _age_range(13) == "13+"

    def test_age_18(self):
        assert _age_range(18) == "13+"


# --- Session Limit ---


class TestSessionLimit:
    def test_limit_3_5(self):
        assert _session_limit("3-5") == settings.child_session_limit_minutes_3_5

    def test_limit_6_8(self):
        assert _session_limit("6-8") == settings.child_session_limit_minutes_6_8

    def test_limit_9_12(self):
        assert _session_limit("9-12") == settings.child_session_limit_minutes_9_plus

    def test_limit_13_plus(self):
        assert _session_limit("13+") == settings.child_session_limit_minutes_9_plus

    def test_limit_unknown_defaults_to_6_8(self):
        assert _session_limit("unknown") == settings.child_session_limit_minutes_6_8
