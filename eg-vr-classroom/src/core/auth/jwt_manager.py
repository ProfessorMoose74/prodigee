"""
JWT Token Management
Handles creation, validation, and management of JWT tokens
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Optional

import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

from src.core.config import config

logger = logging.getLogger(__name__)


class JWTManager:
    """
    JSON Web Token manager for authentication

    Features:
    - Token creation for parents and children
    - Token validation
    - Token refresh
    - Token blacklisting (via Redis)
    """

    def __init__(self):
        """Initialize JWT manager"""
        self.secret_key = config.get('auth.jwt_secret')
        self.algorithm = config.get('auth.jwt_algorithm', 'HS256')
        self.token_expiry_hours = config.get('auth.token_expiry_hours', 24)

        if not self.secret_key:
            raise ValueError("JWT secret key not configured")

    def create_parent_token(
        self,
        parent_id: int,
        email: str,
        subscription_tier: str = 'basic'
    ) -> str:
        """
        Create JWT token for parent

        Args:
            parent_id: Parent's unique ID
            email: Parent's email address
            subscription_tier: Subscription level

        Returns:
            JWT token string
        """
        now = datetime.utcnow()
        expiry = now + timedelta(hours=self.token_expiry_hours)

        payload = {
            'user_id': parent_id,
            'user_type': 'parent',
            'email': email,
            'subscription_tier': subscription_tier,
            'iat': now,  # Issued at
            'exp': expiry,  # Expiration
            'sub': str(parent_id),  # Subject
        }

        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        logger.info(f"Created parent token for user {parent_id}")

        return token

    def create_child_token(
        self,
        child_id: int,
        parent_id: int,
        age: int,
        age_range: str,
        session_duration_hours: int = 4
    ) -> str:
        """
        Create JWT token for child (COPPA-compliant)

        Args:
            child_id: Child's unique ID
            parent_id: Parent's ID (for verification)
            age: Child's age
            age_range: Age range category
            session_duration_hours: Token validity period

        Returns:
            JWT token string
        """
        now = datetime.utcnow()
        expiry = now + timedelta(hours=session_duration_hours)

        payload = {
            'user_id': child_id,
            'user_type': 'child',
            'parent_id': parent_id,
            'age': age,
            'age_range': age_range,
            'iat': now,
            'exp': expiry,
            'sub': str(child_id),
        }

        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        logger.info(f"Created child token for user {child_id} (parent: {parent_id})")

        return token

    def verify_token(self, token: str) -> Optional[Dict]:
        """
        Verify and decode JWT token

        Args:
            token: JWT token string

        Returns:
            Decoded token payload or None if invalid

        Raises:
            ExpiredSignatureError: If token has expired
            InvalidTokenError: If token is invalid
        """
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm]
            )

            logger.debug(f"Token verified for user {payload.get('user_id')}")
            return payload

        except ExpiredSignatureError:
            logger.warning("Token has expired")
            raise
        except InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            raise

    def decode_token_no_verify(self, token: str) -> Optional[Dict]:
        """
        Decode token without verification (for debugging)

        Args:
            token: JWT token string

        Returns:
            Decoded payload or None
        """
        try:
            payload = jwt.decode(
                token,
                options={"verify_signature": False}
            )
            return payload
        except Exception as e:
            logger.error(f"Failed to decode token: {e}")
            return None

    def refresh_token(self, token: str) -> Optional[str]:
        """
        Refresh an existing token

        Args:
            token: Current JWT token

        Returns:
            New JWT token or None if refresh failed
        """
        try:
            payload = self.verify_token(token)

            # Don't refresh if token expires in more than 1 hour
            exp_timestamp = payload.get('exp')
            if exp_timestamp:
                exp_time = datetime.fromtimestamp(exp_timestamp)
                time_remaining = exp_time - datetime.utcnow()

                if time_remaining.total_seconds() > 3600:  # 1 hour
                    logger.info("Token refresh not needed yet")
                    return token

            # Create new token based on user type
            user_type = payload.get('user_type')

            if user_type == 'parent':
                new_token = self.create_parent_token(
                    parent_id=payload['user_id'],
                    email=payload['email'],
                    subscription_tier=payload.get('subscription_tier', 'basic')
                )
            elif user_type == 'child':
                new_token = self.create_child_token(
                    child_id=payload['user_id'],
                    parent_id=payload['parent_id'],
                    age=payload['age'],
                    age_range=payload['age_range']
                )
            else:
                logger.error(f"Unknown user type: {user_type}")
                return None

            logger.info(f"Token refreshed for user {payload['user_id']}")
            return new_token

        except Exception as e:
            logger.error(f"Token refresh failed: {e}")
            return None

    def extract_user_id(self, token: str) -> Optional[int]:
        """
        Extract user ID from token

        Args:
            token: JWT token string

        Returns:
            User ID or None
        """
        try:
            payload = self.verify_token(token)
            return payload.get('user_id')
        except Exception:
            return None

    def extract_user_type(self, token: str) -> Optional[str]:
        """
        Extract user type from token

        Args:
            token: JWT token string

        Returns:
            'parent' or 'child' or None
        """
        try:
            payload = self.verify_token(token)
            return payload.get('user_type')
        except Exception:
            return None

    def is_token_expired(self, token: str) -> bool:
        """
        Check if token is expired

        Args:
            token: JWT token string

        Returns:
            True if expired, False otherwise
        """
        try:
            self.verify_token(token)
            return False
        except ExpiredSignatureError:
            return True
        except Exception:
            return True

    def get_token_expiry(self, token: str) -> Optional[datetime]:
        """
        Get token expiration time

        Args:
            token: JWT token string

        Returns:
            Expiration datetime or None
        """
        try:
            payload = self.verify_token(token)
            exp_timestamp = payload.get('exp')
            if exp_timestamp:
                return datetime.fromtimestamp(exp_timestamp)
            return None
        except Exception:
            return None


# Global instance
jwt_manager = JWTManager()
