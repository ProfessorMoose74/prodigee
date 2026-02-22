"""
Analytics service dependencies — Firestore client, JWT auth.
Read-only service: no write operations, no token creation.
"""

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.cloud import firestore_v1

from src.config import settings

# --- Firestore Client ---

_db = None


def get_db() -> firestore_v1.AsyncClient:
    """Get or create the async Firestore client."""
    global _db
    if _db is None:
        _db = firestore_v1.AsyncClient(project=settings.project_id)
    return _db


# --- JWT (decode only) ---


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


async def is_token_blacklisted(jti: str, db: firestore_v1.AsyncClient) -> bool:
    doc = await db.collection("token_blacklist").document(jti).get()
    return doc.exists


# --- FastAPI Auth Dependencies ---

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: firestore_v1.AsyncClient = Depends(get_db),
) -> dict:
    """Validate JWT and return decoded claims."""
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authentication token")

    payload = decode_token(credentials.credentials)

    if await is_token_blacklisted(payload["jti"], db):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked")

    return payload


async def get_current_parent(user: dict = Depends(get_current_user)) -> dict:
    """Require the current user to be a parent."""
    if user.get("type") != "parent":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Parent access required")
    return user


async def verify_child_access(
    child_id: str,
    user: dict,
    db: firestore_v1.AsyncClient,
) -> None:
    """Verify the user can access this child's data.
    - Child tokens: child_id must match token's id
    - Parent tokens: child must belong to the parent
    """
    if user.get("type") == "child":
        if user["id"] != child_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access another child's data")
    elif user.get("type") == "parent":
        child_doc = await db.collection("children").document(child_id).get()
        if not child_doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
        if child_doc.to_dict().get("parent_id") != user["id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This child does not belong to you")
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid user type")
