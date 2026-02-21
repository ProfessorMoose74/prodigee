"""
Session management routes — logout and token validation.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from google.cloud import firestore_v1

from src.dependencies import (
    decode_token,
    get_current_user,
    get_db,
    is_token_blacklisted,
)
from src.schemas import TokenValidateRequest, TokenValidationResponse

router = APIRouter(tags=["session"])


@router.post("/logout")
async def logout(
    user: dict = Depends(get_current_user),
    db: firestore_v1.AsyncClient = Depends(get_db),
):
    """Logout — blacklist the current token."""
    jti = user["jti"]
    expires_at = datetime.fromtimestamp(user["exp"], tz=timezone.utc)

    await db.collection("token_blacklist").document(jti).set({
        "blacklisted_at": datetime.now(timezone.utc),
        "expires_at": expires_at,
    })

    return {"message": "Successfully logged out"}


@router.post("/token/validate", response_model=TokenValidationResponse)
async def validate_token(
    req: TokenValidateRequest,
    db: firestore_v1.AsyncClient = Depends(get_db),
):
    """Validate a token — used by gateway for service-to-service auth checks.
    Does not require Authorization header."""
    try:
        payload = decode_token(req.token)
    except Exception:
        return TokenValidationResponse(valid=False)

    if await is_token_blacklisted(payload["jti"], db):
        return TokenValidationResponse(valid=False)

    return TokenValidationResponse(
        valid=True,
        user_id=payload.get("id"),
        user_type=payload.get("type"),
        email=payload.get("email"),
    )
