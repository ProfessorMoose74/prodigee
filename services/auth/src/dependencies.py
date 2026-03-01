"""
Auth service dependencies — Firestore client, JWT, bcrypt, FastAPI auth.
"""

import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.cloud import firestore_v1

from src.config import settings

# --- Firestore Client ---

_db = None


def get_db() -> firestore_v1.AsyncClient:
    """Get or create the async Firestore client.
    Auto-detects FIRESTORE_EMULATOR_HOST for local dev."""
    global _db
    if _db is None:
        _db = firestore_v1.AsyncClient(project=settings.project_id)
    return _db


# --- Password Hashing ---


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


# --- JWT ---


def create_token(user_id: str, user_type: str, extra_claims: dict | None = None) -> tuple[str, int]:
    """Create a JWT token. Returns (token_string, expires_in_seconds)."""
    if user_type == "parent":
        expiry_hours = settings.parent_token_expiry_hours
    else:
        expiry_hours = settings.child_token_expiry_hours

    expires_in = expiry_hours * 3600
    now = datetime.now(timezone.utc)

    payload = {
        "id": user_id,
        "type": user_type,
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + timedelta(seconds=expires_in),
    }
    if extra_claims:
        payload.update(extra_claims)

    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, expires_in


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token. Raises HTTPException on failure."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )


# --- Token Blacklist ---


async def is_token_blacklisted(jti: str, db: firestore_v1.AsyncClient) -> bool:
    doc = await db.collection("token_blacklist").document(jti).get()
    return doc.exists


async def blacklist_token(jti: str, expires_at: datetime, db: firestore_v1.AsyncClient) -> None:
    await db.collection("token_blacklist").document(jti).set({
        "blacklisted_at": datetime.now(timezone.utc),
        "expires_at": expires_at,
    })


# --- FastAPI Auth Dependencies ---

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: firestore_v1.AsyncClient = Depends(get_db),
) -> dict:
    """Validate JWT and return decoded claims. Works for both parent and child tokens.

    Checks X-Forwarded-Authorization first (set by gateway when using
    Cloud Run IAM auth), falls back to standard Authorization header.
    """
    forwarded = request.headers.get("x-forwarded-authorization", "")
    if forwarded.lower().startswith("bearer "):
        token = forwarded[7:]
    elif credentials is not None:
        token = credentials.credentials
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
        )

    payload = decode_token(token)

    if await is_token_blacklisted(payload["jti"], db):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
        )

    return payload


async def get_current_parent(user: dict = Depends(get_current_user)) -> dict:
    """Require the current user to be a parent."""
    if user.get("type") != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Parent access required",
        )
    return user
