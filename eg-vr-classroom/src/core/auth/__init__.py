"""Authentication and authorization for EG VR Classroom"""

from .jwt_manager import JWTManager, jwt_manager
from .auth_service import AuthService, auth_service, AuthenticationError

__all__ = [
    'JWTManager',
    'jwt_manager',
    'AuthService',
    'auth_service',
    'AuthenticationError',
]
