"""
Learning engine dependencies — Firestore client, JWT auth, GCP client factories.
"""

import logging

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.cloud import firestore_v1

from src.config import settings

logger = logging.getLogger(__name__)

# --- Firestore Client ---

_db = None


def get_db() -> firestore_v1.AsyncClient:
    """Get or create the async Firestore client.
    Auto-detects FIRESTORE_EMULATOR_HOST for local dev."""
    global _db
    if _db is None:
        _db = firestore_v1.AsyncClient(project=settings.project_id)
    return _db


# --- JWT (decode only — learning engine never creates tokens) ---


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    try:
        return jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
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


async def is_token_blacklisted(jti: str, db: firestore_v1.AsyncClient) -> bool:
    doc = await db.collection("token_blacklist").document(jti).get()
    return doc.exists


# --- FastAPI Auth Dependencies ---

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: firestore_v1.AsyncClient = Depends(get_db),
) -> dict:
    """Validate JWT and return decoded claims. Works for both parent and child."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
        )

    payload = decode_token(credentials.credentials)

    if await is_token_blacklisted(payload["jti"], db):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
        )

    return payload


async def get_current_child(user: dict = Depends(get_current_user)) -> dict:
    """Require the current user to be a child."""
    if user.get("type") != "child":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Child access required",
        )
    return user


# --- GCP Client Factories (lazy init with graceful fallback) ---

_speech_client = None
_tts_client = None
_vertex_model = None


def get_speech_client():
    """Get Cloud Speech-to-Text client, or None if unavailable."""
    global _speech_client
    if _speech_client is False:
        return None
    if _speech_client is not None:
        return _speech_client
    try:
        from google.cloud import speech_v1
        _speech_client = speech_v1.SpeechClient()
        return _speech_client
    except Exception as e:
        logger.warning(f"Cloud Speech-to-Text unavailable: {e}")
        _speech_client = False
        return None


def get_tts_client():
    """Get Cloud Text-to-Speech client, or None if unavailable."""
    global _tts_client
    if _tts_client is False:
        return None
    if _tts_client is not None:
        return _tts_client
    try:
        from google.cloud import texttospeech_v1
        _tts_client = texttospeech_v1.TextToSpeechClient()
        return _tts_client
    except Exception as e:
        logger.warning(f"Cloud Text-to-Speech unavailable: {e}")
        _tts_client = False
        return None


def get_vertex_model():
    """Get Vertex AI generative model, or None if unavailable."""
    global _vertex_model
    if _vertex_model is False:
        return None
    if _vertex_model is not None:
        return _vertex_model
    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel
        vertexai.init(project=settings.project_id, location=settings.region)
        _vertex_model = GenerativeModel(settings.vertex_ai_model)
        return _vertex_model
    except Exception as e:
        logger.warning(f"Vertex AI unavailable: {e}")
        _vertex_model = False
        return None
