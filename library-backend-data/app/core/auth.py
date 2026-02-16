import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models import Parent, Child
import redis
import logging

logger = logging.getLogger(__name__)

# JWT Security scheme
security = HTTPBearer()

# Redis client for token blacklisting (shared with Flask backend)
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception as e:
    logger.warning(f"Redis connection failed: {str(e)}. Token blacklisting disabled.")
    redis_client = None


class AuthenticationError(HTTPException):
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT token compatible with Flask backend format."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "sub": str(data.get("user_id"))
    })
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify JWT token and return payload if valid."""
    try:
        # Check if token is blacklisted
        if redis_client and redis_client.get(f"blacklisted_token:{token}"):
            raise AuthenticationError("Token has been revoked")
        
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        
        # Validate expiration
        exp = payload.get("exp")
        if exp and datetime.utcfromtimestamp(exp) < datetime.utcnow():
            raise AuthenticationError("Token has expired")
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token has expired")
    except jwt.JWTError:
        raise AuthenticationError("Invalid token")


def blacklist_token(token: str, ttl: int = None):
    """Add token to blacklist (for logout functionality)."""
    if redis_client:
        try:
            if ttl is None:
                ttl = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            redis_client.setex(f"blacklisted_token:{token}", ttl, "true")
        except Exception as e:
            logger.error(f"Failed to blacklist token: {str(e)}")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get current authenticated user from JWT token."""
    token = credentials.credentials
    payload = verify_token(token)
    
    if not payload:
        raise AuthenticationError("Invalid authentication credentials")
    
    user_id = payload.get("user_id")
    user_type = payload.get("user_type", "parent")  # Default to parent
    
    if not user_id:
        raise AuthenticationError("Invalid token payload")
    
    # Verify user exists in database
    if user_type == "parent":
        user = db.query(Parent).filter(Parent.id == user_id).first()
        if not user:
            raise AuthenticationError("Parent user not found")
    elif user_type == "child":
        user = db.query(Child).filter(Child.id == user_id).first()
        if not user:
            raise AuthenticationError("Child user not found")
    else:
        raise AuthenticationError("Invalid user type")
    
    return {
        "user_id": user_id,
        "user_type": user_type,
        "user": user,
        "token": token
    }


def get_current_parent(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Parent:
    """Require parent authentication."""
    if current_user["user_type"] != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Parent access required"
        )
    return current_user["user"]


def get_current_child(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Child:
    """Require child authentication."""
    if current_user["user_type"] != "child":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Child access required"
        )
    return current_user["user"]


def get_child_or_parent(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Allow both child and parent access."""
    return current_user


def verify_child_parent_access(
    child_id: int,
    current_user: Dict[str, Any],
    db: Session
) -> bool:
    """Verify that a parent has access to a specific child or child is accessing own data."""
    if current_user["user_type"] == "child":
        # Child can only access their own data
        return current_user["user_id"] == child_id
    elif current_user["user_type"] == "parent":
        # Parent can access their children's data
        child = db.query(Child).filter(
            Child.id == child_id,
            Child.parent_id == current_user["user_id"]
        ).first()
        return child is not None
    
    return False


class RateLimitExceeded(HTTPException):
    def __init__(self, detail: str = "Rate limit exceeded"):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail
        )


def check_rate_limit(key: str, limit: int = 100, window: int = 3600) -> bool:
    """Check rate limiting using Redis."""
    if not redis_client:
        return True  # Skip rate limiting if Redis unavailable
    
    try:
        current = redis_client.get(key)
        if current is None:
            redis_client.setex(key, window, 1)
            return True
        elif int(current) < limit:
            redis_client.incr(key)
            return True
        else:
            return False
    except Exception as e:
        logger.error(f"Rate limiting error: {str(e)}")
        return True  # Allow request if rate limiting fails


def require_rate_limit(key_prefix: str, limit: int = 100, window: int = 3600):
    """Decorator for rate limiting endpoints."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Extract user info for rate limiting key
            current_user = kwargs.get('current_user')
            if current_user:
                user_id = current_user.get('user_id', 'anonymous')
                key = f"{key_prefix}:{user_id}"
            else:
                key = f"{key_prefix}:anonymous"
            
            if not check_rate_limit(key, limit, window):
                raise RateLimitExceeded()
            
            return func(*args, **kwargs)
        return wrapper
    return decorator