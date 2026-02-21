"""
Parent authentication routes — register, login, add child.
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from google.cloud import firestore_v1

from src.config import settings
from src.dependencies import (
    create_token,
    get_current_parent,
    get_db,
    hash_password,
    verify_password,
)
from src.schemas import (
    AddChildRequest,
    AuthResponse,
    ChildResponse,
    ParentRegisterRequest,
    ParentLoginRequest,
    ParentResponse,
)

router = APIRouter(prefix="/parent", tags=["parent"])


def _age_range(age: int) -> str:
    if age <= 5:
        return "3-5"
    elif age <= 8:
        return "6-8"
    elif age <= 12:
        return "9-12"
    else:
        return "13+"


def _parent_response(doc_data: dict, parent_id: str) -> ParentResponse:
    return ParentResponse(
        id=parent_id,
        email=doc_data["email"],
        display_name=doc_data["display_name"],
        subscription_tier=doc_data.get("subscription_tier", "free"),
        children=doc_data.get("children", []),
        created_at=doc_data["created_at"],
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    req: ParentRegisterRequest,
    db: firestore_v1.AsyncClient = Depends(get_db),
):
    """Register a new parent account."""
    # Check for existing email
    existing = db.collection("parents").where("email", "==", req.email).limit(1)
    docs = [doc async for doc in existing.stream()]
    if docs:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    parent_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    parent_data = {
        "email": req.email,
        "password_hash": hash_password(req.password),
        "display_name": req.display_name,
        "subscription_tier": "free",
        "children": [],
        "last_login": now,
        "communication_preferences": {
            "email_notifications": True,
            "progress_reports": "weekly",
        },
        "monitoring_settings": {
            "session_alerts": True,
            "progress_milestones": True,
        },
        "created_at": now,
    }

    await db.collection("parents").document(parent_id).set(parent_data)

    token, expires_in = create_token(
        parent_id, "parent", extra_claims={"email": req.email}
    )

    return AuthResponse(
        token=token,
        expires_in=expires_in,
        user=_parent_response(parent_data, parent_id),
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    req: ParentLoginRequest,
    db: firestore_v1.AsyncClient = Depends(get_db),
):
    """Parent login — returns JWT token."""
    query = db.collection("parents").where("email", "==", req.email).limit(1)
    docs = [doc async for doc in query.stream()]

    if not docs:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    doc = docs[0]
    parent_data = doc.to_dict()

    if not verify_password(req.password, parent_data["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Update last_login
    now = datetime.now(timezone.utc)
    await db.collection("parents").document(doc.id).update({"last_login": now})
    parent_data["last_login"] = now

    token, expires_in = create_token(
        doc.id, "parent", extra_claims={"email": parent_data["email"]}
    )

    return AuthResponse(
        token=token,
        expires_in=expires_in,
        user=_parent_response(parent_data, doc.id),
    )


@router.post("/add_child", response_model=ChildResponse, status_code=status.HTTP_201_CREATED)
async def add_child(
    req: AddChildRequest,
    parent: dict = Depends(get_current_parent),
    db: firestore_v1.AsyncClient = Depends(get_db),
):
    """Add a child to the parent's account. COPPA: children cannot self-register."""
    child_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    child_data = {
        "parent_id": parent["id"],
        "display_name": req.display_name,
        "age": req.age,
        "age_range": _age_range(req.age),
        "grade_level": req.grade_level,
        "avatar": req.avatar,
        "learning_style": req.learning_style,
        "current_week": 1,
        "total_stars": 0,
        "streak_days": 0,
        "last_login": None,
        "created_at": now,
    }

    # Write child doc and update parent's children list atomically
    batch = db.batch()
    batch.set(db.collection("children").document(child_id), child_data)
    batch.update(
        db.collection("parents").document(parent["id"]),
        {"children": firestore_v1.ArrayUnion([child_id])},
    )
    await batch.commit()

    return ChildResponse(
        id=child_id,
        **{k: v for k, v in child_data.items() if k != "last_login"},
    )
