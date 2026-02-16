"""
Authentication Service
Handles user login, registration, and session management
Integrates JWT tokens, database, and COPPA compliance
"""

import logging
from datetime import datetime
from typing import Dict, Optional, Tuple

from werkzeug.security import generate_password_hash, check_password_hash

from src.core.database import (
    Parent, Child, ParentalConsent,
    get_session, session_scope
)
from src.core.auth.jwt_manager import jwt_manager
from src.core.config import config

logger = logging.getLogger(__name__)


class AuthenticationError(Exception):
    """Custom exception for authentication errors"""
    pass


class AuthService:
    """
    Complete authentication service for EG VR Classroom

    Features:
    - Parent registration and login
    - Child login (COPPA-compliant)
    - Password hashing
    - Session management
    - COPPA verification
    """

    def __init__(self):
        """Initialize authentication service"""
        self.jwt_manager = jwt_manager
        self.coppa_enabled = config.get('safety.coppa_enabled', True)

    def register_parent(
        self,
        email: str,
        password: str,
        first_name: str,
        last_name: str,
        phone_number: Optional[str] = None
    ) -> Tuple[int, str]:
        """
        Register a new parent account

        Args:
            email: Parent's email
            password: Plain text password (will be hashed)
            first_name: Parent's first name
            last_name: Parent's last name
            phone_number: Optional phone number

        Returns:
            Tuple of (parent_id, jwt_token)

        Raises:
            AuthenticationError: If registration fails
        """
        with session_scope() as session:
            # Check if email already exists
            existing = session.query(Parent).filter_by(email=email).first()
            if existing:
                raise AuthenticationError("Email already registered")

            # Hash password
            password_hash = generate_password_hash(password)

            # Create parent record
            parent = Parent(
                email=email,
                password_hash=password_hash,
                first_name=first_name,
                last_name=last_name,
                phone_number=phone_number,
                created_at=datetime.utcnow(),
                subscription_tier='basic',
                is_active=True
            )

            session.add(parent)
            session.flush()  # Get parent_id

            # Create JWT token
            token = self.jwt_manager.create_parent_token(
                parent_id=parent.parent_id,
                email=parent.email,
                subscription_tier=parent.subscription_tier
            )

            logger.info(f"Parent registered: {email} (ID: {parent.parent_id})")

            return parent.parent_id, token

    def login_parent(
        self,
        email: str,
        password: str
    ) -> Tuple[Dict, str]:
        """
        Authenticate parent login

        Args:
            email: Parent's email
            password: Plain text password

        Returns:
            Tuple of (parent_data_dict, jwt_token)

        Raises:
            AuthenticationError: If login fails
        """
        with session_scope() as session:
            parent = session.query(Parent).filter_by(email=email).first()

            if not parent:
                raise AuthenticationError("Invalid email or password")

            if not parent.is_active:
                raise AuthenticationError("Account is inactive")

            # Verify password
            if not check_password_hash(parent.password_hash, password):
                raise AuthenticationError("Invalid email or password")

            # Update last login
            parent.last_login = datetime.utcnow()
            session.flush()

            # Create JWT token
            token = self.jwt_manager.create_parent_token(
                parent_id=parent.parent_id,
                email=parent.email,
                subscription_tier=parent.subscription_tier
            )

            # Return parent data (without sensitive info)
            parent_data = {
                'parent_id': parent.parent_id,
                'email': parent.email,
                'first_name': parent.first_name,
                'last_name': parent.last_name,
                'subscription_tier': parent.subscription_tier,
                'created_at': parent.created_at.isoformat()
            }

            logger.info(f"Parent logged in: {email} (ID: {parent.parent_id})")

            return parent_data, token

    def login_child(
        self,
        child_id: int,
        parent_token: str
    ) -> Tuple[Dict, str]:
        """
        Authenticate child login (COPPA-compliant)
        Children can ONLY log in through parent authentication

        Args:
            child_id: Child's ID
            parent_token: Valid parent JWT token

        Returns:
            Tuple of (child_data_dict, child_jwt_token)

        Raises:
            AuthenticationError: If login fails
        """
        # Verify parent token
        try:
            parent_payload = self.jwt_manager.verify_token(parent_token)
            parent_id = parent_payload.get('user_id')

            if parent_payload.get('user_type') != 'parent':
                raise AuthenticationError("Invalid parent token")

        except Exception as e:
            raise AuthenticationError(f"Invalid parent authentication: {e}")

        with session_scope() as session:
            # Get child and verify parent relationship
            child = session.query(Child).filter_by(
                child_id=child_id,
                parent_id=parent_id,
                is_active=True
            ).first()

            if not child:
                raise AuthenticationError("Child not found or access denied")

            # COPPA check: Verify parental consent if required
            if self.coppa_enabled:
                consent = session.query(ParentalConsent).filter_by(
                    child_id=child_id,
                    parent_id=parent_id,
                    consent_granted=True,
                    is_verified=True
                ).first()

                if not consent:
                    raise AuthenticationError(
                        "Parental consent required. Please complete COPPA verification."
                    )

            # Update last activity
            child.last_activity = datetime.utcnow()
            session.flush()

            # Create child JWT token (shorter expiry for safety)
            token = self.jwt_manager.create_child_token(
                child_id=child.child_id,
                parent_id=child.parent_id,
                age=child.age,
                age_range=child.age_range,
                session_duration_hours=4  # 4-hour sessions
            )

            # Return child data
            child_data = {
                'child_id': child.child_id,
                'parent_id': child.parent_id,
                'display_name': child.display_name,
                'age': child.age,
                'age_range': child.age_range,
                'current_week': child.current_week,
                'total_stars': child.total_stars,
                'streak_days': child.streak_days,
                'avatar_customization': child.avatar_customization
            }

            logger.info(f"Child logged in: {child_id} via parent {parent_id}")

            return child_data, token

    def add_child_to_parent(
        self,
        parent_token: str,
        display_name: str,
        age: int,
        grade_level: Optional[str] = None,
        date_of_birth: Optional[str] = None
    ) -> int:
        """
        Add a new child to a parent account

        Args:
            parent_token: Valid parent JWT token
            display_name: Child's display name (not real name)
            age: Child's age (3-13)
            grade_level: Optional grade level
            date_of_birth: Optional DOB (encrypted storage)

        Returns:
            New child_id

        Raises:
            AuthenticationError: If operation fails
        """
        # Verify parent token
        try:
            parent_payload = self.jwt_manager.verify_token(parent_token)
            parent_id = parent_payload.get('user_id')

            if parent_payload.get('user_type') != 'parent':
                raise AuthenticationError("Invalid parent token")

        except Exception as e:
            raise AuthenticationError(f"Invalid parent authentication: {e}")

        # Determine age range
        if 3 <= age <= 4:
            age_range = '3-5'
        elif 5 <= age <= 7:
            age_range = '5-7'
        elif 8 <= age <= 10:
            age_range = '8-10'
        elif 11 <= age <= 13:
            age_range = '11-13'
        else:
            raise AuthenticationError("Age must be between 3 and 13")

        with session_scope() as session:
            # Create child record
            child = Child(
                parent_id=parent_id,
                display_name=display_name,
                age=age,
                age_range=age_range,
                grade_level=grade_level,
                created_at=datetime.utcnow(),
                is_active=True
            )

            session.add(child)
            session.flush()

            logger.info(f"Child added: {display_name} (ID: {child.child_id}) to parent {parent_id}")

            return child.child_id

    def verify_token(self, token: str) -> Dict:
        """
        Verify and decode a JWT token

        Args:
            token: JWT token string

        Returns:
            Token payload

        Raises:
            AuthenticationError: If token is invalid
        """
        try:
            payload = self.jwt_manager.verify_token(token)
            return payload
        except Exception as e:
            raise AuthenticationError(f"Invalid token: {e}")

    def get_current_user(self, token: str) -> Optional[Dict]:
        """
        Get current user data from token

        Args:
            token: JWT token string

        Returns:
            User data dictionary or None
        """
        try:
            payload = self.jwt_manager.verify_token(token)
            user_type = payload.get('user_type')
            user_id = payload.get('user_id')

            with session_scope() as session:
                if user_type == 'parent':
                    parent = session.query(Parent).filter_by(
                        parent_id=user_id,
                        is_active=True
                    ).first()

                    if parent:
                        return {
                            'user_id': parent.parent_id,
                            'user_type': 'parent',
                            'email': parent.email,
                            'first_name': parent.first_name,
                            'last_name': parent.last_name,
                            'subscription_tier': parent.subscription_tier
                        }

                elif user_type == 'child':
                    child = session.query(Child).filter_by(
                        child_id=user_id,
                        is_active=True
                    ).first()

                    if child:
                        return {
                            'user_id': child.child_id,
                            'user_type': 'child',
                            'parent_id': child.parent_id,
                            'display_name': child.display_name,
                            'age': child.age,
                            'age_range': child.age_range,
                            'current_week': child.current_week,
                            'total_stars': child.total_stars
                        }

            return None

        except Exception as e:
            logger.error(f"Failed to get current user: {e}")
            return None

    def logout(self, token: str) -> bool:
        """
        Log out user (invalidate token)

        Args:
            token: JWT token to invalidate

        Returns:
            True if successful

        Note: In production, implement token blacklisting via Redis
        """
        try:
            payload = self.jwt_manager.verify_token(token)
            user_id = payload.get('user_id')
            user_type = payload.get('user_type')

            # TODO: Add token to Redis blacklist
            # redis_client.setex(f"blacklist:{token}", expiry_seconds, "1")

            logger.info(f"User logged out: {user_type} {user_id}")
            return True

        except Exception as e:
            logger.error(f"Logout failed: {e}")
            return False


# Global instance
auth_service = AuthService()
