"""
Child authentication routes — COPPA-compliant parent-proxy login.
Children never enter credentials. The parent authenticates first,
then initiates the child's session using their own token.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from google.cloud import firestore_v1

from src.config import settings
from src.dependencies import create_token, decode_token, get_db, is_token_blacklisted
from src.schemas import ChildAuthResponse, ChildLoginRequest, ChildResponse

router = APIRouter(prefix="/child", tags=["child"])


def _session_limit(age_range: str) -> int:
    """Return COPPA session limit in minutes based on age range."""
    limits = {
        "3-5": settings.child_session_limit_minutes_3_5,
        "6-8": settings.child_session_limit_minutes_6_8,
        "9-12": settings.child_session_limit_minutes_9_plus,
        "13+": settings.child_session_limit_minutes_9_plus,
    }
    return limits.get(age_range, settings.child_session_limit_minutes_6_8)


@router.post("/login", response_model=ChildAuthResponse)
async def child_login(
    req: ChildLoginRequest,
    db: firestore_v1.AsyncClient = Depends(get_db),
):
    """Parent-proxy child login. The parent's token is provided in the request
    body (not the Authorization header) to prove parental consent."""

    # Validate parent token
    parent_payload = decode_token(req.parent_token)

    if parent_payload.get("type") != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="A parent token is required to initiate a child session",
        )

    if await is_token_blacklisted(parent_payload["jti"], db):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Parent token has been revoked",
        )

    # Fetch child document
    child_doc = await db.collection("children").document(req.child_id).get()
    if not child_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found",
        )

    child_data = child_doc.to_dict()

    # COPPA: verify this child belongs to the authenticated parent
    if child_data["parent_id"] != parent_payload["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This child does not belong to the authenticated parent",
        )

    # Update child last_login
    now = datetime.now(timezone.utc)
    await db.collection("children").document(req.child_id).update({"last_login": now})

    # Create child token
    token, expires_in = create_token(
        req.child_id, "child", extra_claims={"parent_id": parent_payload["id"]}
    )

    session_limit = _session_limit(child_data.get("age_range", "6-8"))

    return ChildAuthResponse(
        token=token,
        expires_in=expires_in,
        session_limit_minutes=session_limit,
        user=ChildResponse(
            id=req.child_id,
            parent_id=child_data["parent_id"],
            display_name=child_data["display_name"],
            age=child_data["age"],
            age_range=child_data.get("age_range", "6-8"),
            grade_level=child_data.get("grade_level", ""),
            avatar=child_data.get("avatar", "default"),
            learning_style=child_data.get("learning_style", "visual"),
            current_week=child_data.get("current_week", 1),
            total_stars=child_data.get("total_stars", 0),
            streak_days=child_data.get("streak_days", 0),
            created_at=child_data["created_at"],
        ),
    )
