"""
Authentication Bridge for Parent/Child Accounts
Handles secure authentication and authorization for VR classroom access
"""

import asyncio
import json
import hashlib
import secrets
import jwt
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum
import logging
import bcrypt
import uuid

logger = logging.getLogger(__name__)


class AccountType(Enum):
    """Account types in the system"""
    PARENT = "parent"
    CHILD = "child"
    TEACHER = "teacher"
    MODERATOR = "moderator"
    ADMIN = "admin"


class PermissionLevel(Enum):
    """Permission levels for different actions"""
    NONE = 0
    VIEW = 1
    INTERACT = 2
    MODERATE = 3
    ADMIN = 4


@dataclass
class ParentAccount:
    """Parent account information"""
    parent_id: str
    email: str
    password_hash: str
    first_name: str
    last_name: str
    phone_number: Optional[str]
    created_at: datetime
    verified_at: Optional[datetime]
    subscription_tier: str  # "basic", "premium", "family"
    two_factor_enabled: bool
    children_ids: List[str]
    preferences: Dict[str, Any]
    safety_settings: Dict[str, Any]


@dataclass
class ChildAccount:
    """Child account information"""
    child_id: str
    parent_id: str
    display_name: str  # Safe display name, never real name
    age_range: str  # "5-7", "8-10", "11-13"
    grade_level: Optional[str]
    created_at: datetime
    voice_profile_id: Optional[str]
    learning_preferences: Dict[str, Any]
    safety_restrictions: Dict[str, Any]
    session_history: List[str]
    is_active: bool


@dataclass
class SessionToken:
    """Secure session token"""
    token_id: str
    user_id: str
    account_type: AccountType
    parent_id: Optional[str]
    issued_at: datetime
    expires_at: datetime
    permissions: List[str]
    platform: str
    location_hash: str  # Hashed location data for verification


class ParentChildAuthBridge:
    """
    Authentication and authorization bridge for parent/child accounts
    Ensures COPPA compliance and child safety
    """
    
    def __init__(self, helyxium_connector, jwt_secret: str):
        self.helyxium = helyxium_connector
        self.jwt_secret = jwt_secret
        
        # In-memory storage (in production, use database)
        self.parent_accounts: Dict[str, ParentAccount] = {}
        self.child_accounts: Dict[str, ChildAccount] = {}
        self.active_sessions: Dict[str, SessionToken] = {}
        self.pending_verifications: Dict[str, Dict] = {}
        
        # Security settings
        self.session_timeout = 3600  # 1 hour
        self.max_failed_attempts = 3
        self.lockout_duration = 900  # 15 minutes
        self.password_min_length = 12
        
    async def register_parent_account(self, email: str, password: str,
                                    first_name: str, last_name: str,
                                    phone_number: Optional[str] = None) -> Tuple[bool, str]:
        """Register a new parent account with verification"""
        try:
            # Validate input
            if not self._validate_email(email):
                return False, "Invalid email address"
            
            if not self._validate_password(password):
                return False, f"Password must be at least {self.password_min_length} characters"
            
            # Check if email already exists
            if self._email_exists(email):
                return False, "Email address already registered"
            
            # Create parent account
            parent_id = str(uuid.uuid4())
            password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
            
            parent_account = ParentAccount(
                parent_id=parent_id,
                email=email.lower(),
                password_hash=password_hash,
                first_name=first_name,
                last_name=last_name,
                phone_number=phone_number,
                created_at=datetime.utcnow(),
                verified_at=None,
                subscription_tier="basic",
                two_factor_enabled=False,
                children_ids=[],
                preferences=self._get_default_parent_preferences(),
                safety_settings=self._get_default_safety_settings()
            )
            
            self.parent_accounts[parent_id] = parent_account
            
            # Send verification email
            verification_code = await self._send_verification_email(email, parent_id)
            
            logger.info(f"Created parent account for {email}")
            return True, parent_id
            
        except Exception as e:
            logger.error(f"Failed to register parent account: {e}")
            return False, "Registration failed"
    
    def _validate_email(self, email: str) -> bool:
        """Basic email validation"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def _validate_password(self, password: str) -> bool:
        """Password strength validation"""
        if len(password) < self.password_min_length:
            return False
        
        # Check for complexity
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
        
        return sum([has_upper, has_lower, has_digit, has_special]) >= 3
    
    def _email_exists(self, email: str) -> bool:
        """Check if email is already registered"""
        email_lower = email.lower()
        return any(p.email == email_lower for p in self.parent_accounts.values())
    
    def _get_default_parent_preferences(self) -> Dict[str, Any]:
        """Default parent preferences"""
        return {
            "notification_email": True,
            "notification_sms": False,
            "session_alerts": True,
            "safety_incident_alerts": True,
            "weekly_reports": True,
            "language": "en",
            "timezone": "UTC"
        }
    
    def _get_default_safety_settings(self) -> Dict[str, Any]:
        """Default safety settings"""
        return {
            "voice_recording_consent": False,
            "session_recording_consent": False,
            "shadow_mode_enabled": True,
            "auto_end_on_incident": True,
            "allowed_platforms": ["meta_quest", "desktop"],
            "max_session_duration": 60,  # minutes
            "require_parent_auth": True
        }
    
    async def _send_verification_email(self, email: str, parent_id: str) -> str:
        """Send email verification (mock implementation)"""
        verification_code = secrets.token_hex(16)
        
        self.pending_verifications[verification_code] = {
            "parent_id": parent_id,
            "email": email,
            "type": "email_verification",
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(hours=24)
        }
        
        # In production, send actual email
        logger.info(f"Verification email sent to {email} with code {verification_code}")
        return verification_code
    
    async def verify_parent_email(self, verification_code: str) -> bool:
        """Verify parent email address"""
        if verification_code not in self.pending_verifications:
            return False
        
        verification = self.pending_verifications[verification_code]
        
        # Check expiration
        if datetime.utcnow() > verification["expires_at"]:
            del self.pending_verifications[verification_code]
            return False
        
        # Mark parent as verified
        parent_id = verification["parent_id"]
        if parent_id in self.parent_accounts:
            self.parent_accounts[parent_id].verified_at = datetime.utcnow()
            del self.pending_verifications[verification_code]
            logger.info(f"Parent {parent_id} email verified")
            return True
        
        return False
    
    async def authenticate_parent(self, email: str, password: str) -> Tuple[bool, Optional[str]]:
        """Authenticate parent login"""
        try:
            email_lower = email.lower()
            
            # Find parent account
            parent_account = None
            for parent in self.parent_accounts.values():
                if parent.email == email_lower:
                    parent_account = parent
                    break
            
            if not parent_account:
                return False, None
            
            # Check if account is verified
            if not parent_account.verified_at:
                return False, "Email not verified"
            
            # Verify password
            if not bcrypt.checkpw(password.encode(), parent_account.password_hash.encode()):
                return False, "Invalid credentials"
            
            # Generate session token
            session_token = await self._create_parent_session(parent_account)
            
            logger.info(f"Parent {parent_account.parent_id} authenticated successfully")
            return True, session_token
            
        except Exception as e:
            logger.error(f"Parent authentication failed: {e}")
            return False, None
    
    async def _create_parent_session(self, parent_account: ParentAccount) -> str:
        """Create authenticated parent session"""
        token_id = str(uuid.uuid4())
        
        session_token = SessionToken(
            token_id=token_id,
            user_id=parent_account.parent_id,
            account_type=AccountType.PARENT,
            parent_id=None,
            issued_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(seconds=self.session_timeout),
            permissions=["create_child", "view_reports", "shadow_mode", "emergency_end"],
            platform="web",
            location_hash=""
        )
        
        self.active_sessions[token_id] = session_token
        
        # Create JWT token
        jwt_payload = {
            "token_id": token_id,
            "user_id": parent_account.parent_id,
            "account_type": AccountType.PARENT.value,
            "exp": session_token.expires_at.timestamp(),
            "iat": session_token.issued_at.timestamp()
        }
        
        jwt_token = jwt.encode(jwt_payload, self.jwt_secret, algorithm="HS256")
        return jwt_token
    
    async def create_child_account(self, parent_token: str, display_name: str,
                                 age_range: str, grade_level: Optional[str] = None) -> Tuple[bool, str]:
        """Create child account under parent supervision"""
        try:
            # Verify parent token
            parent_id = await self._verify_parent_token(parent_token)
            if not parent_id:
                return False, "Invalid parent authorization"
            
            # Validate inputs
            if not self._validate_child_display_name(display_name):
                return False, "Invalid display name"
            
            if age_range not in ["5-7", "8-10", "11-13"]:
                return False, "Invalid age range"
            
            # Create child account
            child_id = str(uuid.uuid4())
            
            child_account = ChildAccount(
                child_id=child_id,
                parent_id=parent_id,
                display_name=display_name,
                age_range=age_range,
                grade_level=grade_level,
                created_at=datetime.utcnow(),
                voice_profile_id=None,
                learning_preferences=self._get_default_child_preferences(age_range),
                safety_restrictions=self._get_child_safety_restrictions(age_range),
                session_history=[],
                is_active=True
            )
            
            self.child_accounts[child_id] = child_account
            
            # Add to parent's children list
            self.parent_accounts[parent_id].children_ids.append(child_id)
            
            logger.info(f"Created child account {child_id} for parent {parent_id}")
            return True, child_id
            
        except Exception as e:
            logger.error(f"Failed to create child account: {e}")
            return False, "Failed to create child account"
    
    async def _verify_parent_token(self, token: str) -> Optional[str]:
        """Verify parent JWT token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
            token_id = payload.get("token_id")
            
            if token_id not in self.active_sessions:
                return None
            
            session = self.active_sessions[token_id]
            
            # Check expiration
            if datetime.utcnow() > session.expires_at:
                del self.active_sessions[token_id]
                return None
            
            # Check account type
            if session.account_type != AccountType.PARENT:
                return None
            
            return session.user_id
            
        except jwt.InvalidTokenError:
            return None
    
    def _validate_child_display_name(self, name: str) -> bool:
        """Validate child display name (no real names)"""
        if not name or len(name) < 2 or len(name) > 20:
            return False
        
        # Check for potentially identifying information
        prohibited_patterns = [
            r'\b\d{4}\b',  # Years
            r'\b\d{3,}\b',  # Phone numbers, SSN parts
            r'@',  # Email addresses
            r'\.com\b',  # URLs
        ]
        
        import re
        for pattern in prohibited_patterns:
            if re.search(pattern, name, re.IGNORECASE):
                return False
        
        return True
    
    def _get_default_child_preferences(self, age_range: str) -> Dict[str, Any]:
        """Default child preferences based on age"""
        base_preferences = {
            "language": "en",
            "avatar_style": "cartoon",
            "voice_feedback_enabled": True,
            "sound_effects_enabled": True
        }
        
        if age_range == "5-7":
            base_preferences.update({
                "difficulty_level": "beginner",
                "session_reminders": True,
                "parent_guidance": True
            })
        elif age_range == "8-10":
            base_preferences.update({
                "difficulty_level": "intermediate",
                "collaborative_activities": True
            })
        else:  # 11-13
            base_preferences.update({
                "difficulty_level": "advanced",
                "peer_interaction": True
            })
        
        return base_preferences
    
    def _get_child_safety_restrictions(self, age_range: str) -> Dict[str, Any]:
        """Safety restrictions based on age"""
        base_restrictions = {
            "voice_recording_allowed": False,
            "session_recording_allowed": False,
            "free_text_chat": False,
            "voice_chat_supervised": True,
            "parent_observation_required": True
        }
        
        if age_range == "5-7":
            base_restrictions.update({
                "max_session_duration": 30,  # 30 minutes
                "break_reminders": True,
                "simplified_interface": True
            })
        elif age_range == "8-10":
            base_restrictions.update({
                "max_session_duration": 45,  # 45 minutes
                "peer_interaction_limited": True
            })
        else:  # 11-13
            base_restrictions.update({
                "max_session_duration": 60,  # 60 minutes
                "advanced_features": True
            })
        
        return base_restrictions
    
    async def authorize_child_session(self, child_id: str, parent_token: str,
                                    platform: str) -> Tuple[bool, Optional[str]]:
        """Authorize child to join VR session"""
        try:
            # Verify parent token
            parent_id = await self._verify_parent_token(parent_token)
            if not parent_id:
                return False, None
            
            # Check child exists and belongs to parent
            if child_id not in self.child_accounts:
                return False, None
            
            child_account = self.child_accounts[child_id]
            if child_account.parent_id != parent_id:
                return False, None
            
            # Check child account is active
            if not child_account.is_active:
                return False, None
            
            # Check platform is allowed
            parent_account = self.parent_accounts[parent_id]
            allowed_platforms = parent_account.safety_settings.get("allowed_platforms", [])
            if platform not in allowed_platforms:
                return False, None
            
            # Create child session token
            child_token = await self._create_child_session(child_account, platform)
            
            logger.info(f"Authorized child {child_id} for VR session")
            return True, child_token
            
        except Exception as e:
            logger.error(f"Failed to authorize child session: {e}")
            return False, None
    
    async def _create_child_session(self, child_account: ChildAccount, platform: str) -> str:
        """Create authorized child session"""
        token_id = str(uuid.uuid4())
        
        session_token = SessionToken(
            token_id=token_id,
            user_id=child_account.child_id,
            account_type=AccountType.CHILD,
            parent_id=child_account.parent_id,
            issued_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(seconds=self.session_timeout),
            permissions=["join_classroom", "interact", "learn"],
            platform=platform,
            location_hash=""
        )
        
        self.active_sessions[token_id] = session_token
        
        # Create JWT token
        jwt_payload = {
            "token_id": token_id,
            "user_id": child_account.child_id,
            "parent_id": child_account.parent_id,
            "account_type": AccountType.CHILD.value,
            "age_range": child_account.age_range,
            "exp": session_token.expires_at.timestamp(),
            "iat": session_token.issued_at.timestamp()
        }
        
        jwt_token = jwt.encode(jwt_payload, self.jwt_secret, algorithm="HS256")
        return jwt_token
    
    async def verify_session_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify session token and return user info"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
            token_id = payload.get("token_id")
            
            if token_id not in self.active_sessions:
                return None
            
            session = self.active_sessions[token_id]
            
            # Check expiration
            if datetime.utcnow() > session.expires_at:
                del self.active_sessions[token_id]
                return None
            
            # Return session info
            return {
                "user_id": session.user_id,
                "account_type": session.account_type.value,
                "parent_id": session.parent_id,
                "permissions": session.permissions,
                "platform": session.platform,
                "expires_at": session.expires_at.isoformat()
            }
            
        except jwt.InvalidTokenError:
            return None
    
    async def end_session(self, token: str) -> bool:
        """End user session"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
            token_id = payload.get("token_id")
            
            if token_id in self.active_sessions:
                del self.active_sessions[token_id]
                return True
            
        except jwt.InvalidTokenError:
            pass
        
        return False
    
    async def get_child_accounts(self, parent_token: str) -> List[Dict[str, Any]]:
        """Get list of children for authenticated parent"""
        parent_id = await self._verify_parent_token(parent_token)
        if not parent_id:
            return []
        
        parent_account = self.parent_accounts[parent_id]
        children = []
        
        for child_id in parent_account.children_ids:
            if child_id in self.child_accounts:
                child = self.child_accounts[child_id]
                children.append({
                    "child_id": child.child_id,
                    "display_name": child.display_name,
                    "age_range": child.age_range,
                    "grade_level": child.grade_level,
                    "is_active": child.is_active,
                    "created_at": child.created_at.isoformat()
                })
        
        return children
    
    async def update_safety_settings(self, parent_token: str, 
                                   settings: Dict[str, Any]) -> bool:
        """Update parent safety settings"""
        parent_id = await self._verify_parent_token(parent_token)
        if not parent_id:
            return False
        
        parent_account = self.parent_accounts[parent_id]
        parent_account.safety_settings.update(settings)
        
        logger.info(f"Updated safety settings for parent {parent_id}")
        return True
    
    async def get_session_activity(self, parent_token: str) -> Dict[str, Any]:
        """Get current session activity for parent's children"""
        parent_id = await self._verify_parent_token(parent_token)
        if not parent_id:
            return {}
        
        parent_account = self.parent_accounts[parent_id]
        activity = {
            "active_sessions": [],
            "total_children": len(parent_account.children_ids),
            "online_children": 0
        }
        
        # Check for active sessions
        for session in self.active_sessions.values():
            if (session.account_type == AccountType.CHILD and 
                session.parent_id == parent_id):
                
                child = self.child_accounts.get(session.user_id)
                if child:
                    activity["active_sessions"].append({
                        "child_id": session.user_id,
                        "display_name": child.display_name,
                        "platform": session.platform,
                        "started_at": session.issued_at.isoformat(),
                        "expires_at": session.expires_at.isoformat()
                    })
                    activity["online_children"] += 1
        
        return activity
    
    async def emergency_end_child_session(self, parent_token: str, child_id: str) -> bool:
        """Emergency session termination by parent"""
        parent_id = await self._verify_parent_token(parent_token)
        if not parent_id:
            return False
        
        # Verify child belongs to parent
        if child_id not in self.child_accounts:
            return False
        
        if self.child_accounts[child_id].parent_id != parent_id:
            return False
        
        # Find and end child's session
        sessions_to_end = []
        for token_id, session in self.active_sessions.items():
            if (session.user_id == child_id and 
                session.account_type == AccountType.CHILD):
                sessions_to_end.append(token_id)
        
        for token_id in sessions_to_end:
            del self.active_sessions[token_id]
        
        # Log emergency action
        logger.warning(f"Emergency session end by parent {parent_id} for child {child_id}")
        
        return len(sessions_to_end) > 0