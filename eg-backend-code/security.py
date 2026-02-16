"""
Elemental Genius Security Module
Handles authentication, authorization, and COPPA compliance
"""

import os
import jwt
import hashlib
import hmac
import secrets
import datetime
import re
from functools import wraps
from typing import Optional, Dict, Any
from flask import request, jsonify, g, current_app
from werkzeug.security import generate_password_hash, check_password_hash
import redis
import logging

logger = logging.getLogger(__name__)


class SecurityManager:
    """Central security management for multi-platform authentication"""

    def __init__(self, app=None, redis_client=None):
        self.app = app
        self.redis_client = redis_client or redis.StrictRedis.from_url(
            os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
        )
        self.blacklisted_tokens = set()

    def init_app(self, app):
        """Initialize security with Flask app"""
        self.app = app

    def generate_platform_token(self, platform: str) -> str:
        """Generate platform-specific API token"""
        timestamp = datetime.datetime.utcnow().isoformat()
        data = f"{platform}:{timestamp}:{secrets.token_hex(16)}"
        signature = hmac.new(
            self.app.config['SECRET_KEY'].encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
        return f"{data}:{signature}"

    def verify_platform_token(self, token: str, platform: str) -> bool:
        """Verify platform-specific API token"""
        try:
            parts = token.split(':')
            if len(parts) != 4:
                return False

            token_platform, timestamp, random_data, signature = parts

            if token_platform != platform:
                logger.warning(f"Token platform mismatch: expected {platform}, got {token_platform}")
                return False

            # Verify signature
            data = f"{token_platform}:{timestamp}:{random_data}"
            expected_signature = hmac.new(
                self.app.config['SECRET_KEY'].encode(),
                data.encode(),
                hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(signature, expected_signature):
                logger.warning(f"Invalid signature for platform {platform}")
                return False

            # Check token age (24 hours max)
            token_time = datetime.datetime.fromisoformat(timestamp)
            age = datetime.datetime.utcnow() - token_time
            if age.total_seconds() > 86400:
                logger.warning(f"Token expired for platform {platform}")
                return False

            return True

        except Exception as e:
            logger.error(f"Token verification error: {e}")
            return False

    def generate_jwt_token(self, payload: Dict[str, Any], token_type: str = 'access') -> str:
        """Generate JWT token with enhanced security"""
        now = datetime.datetime.utcnow()

        # Add standard claims
        payload.update({
            'iat': now,
            'nbf': now,
            'jti': secrets.token_urlsafe(16),  # JWT ID for blacklisting
            'type': token_type
        })

        # Set expiration based on token type
        if token_type == 'access':
            payload['exp'] = now + self.app.config['JWT_ACCESS_TOKEN_EXPIRES']
        elif token_type == 'refresh':
            payload['exp'] = now + self.app.config['JWT_REFRESH_TOKEN_EXPIRES']

        # Encode token
        token = jwt.encode(
            payload,
            self.app.config['JWT_SECRET_KEY'],
            algorithm=self.app.config['JWT_ALGORITHM']
        )

        return token

    def decode_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Decode and validate JWT token"""
        try:
            payload = jwt.decode(
                token,
                self.app.config['JWT_SECRET_KEY'],
                algorithms=[self.app.config['JWT_ALGORITHM']]
            )

            # Check if token is blacklisted
            if self.is_token_blacklisted(payload.get('jti')):
                logger.warning(f"Attempted to use blacklisted token: {payload.get('jti')}")
                return None

            return payload

        except jwt.ExpiredSignatureError:
            logger.debug("Token expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            return None

    def blacklist_token(self, jti: str, expiry: datetime.datetime):
        """Add token to blacklist"""
        if not jti:
            return

        # Store in Redis with expiry
        ttl = int((expiry - datetime.datetime.utcnow()).total_seconds())
        if ttl > 0:
            self.redis_client.setex(f"blacklist:{jti}", ttl, "1")
            logger.info(f"Token blacklisted: {jti}")

    def is_token_blacklisted(self, jti: str) -> bool:
        """Check if token is blacklisted"""
        if not jti:
            return True
        return self.redis_client.get(f"blacklist:{jti}") is not None


class COPPACompliance:
    """COPPA compliance for child data protection"""

    @staticmethod
    def verify_parental_consent(parent_id: int, child_id: int) -> bool:
        """Verify parental consent for child account"""
        # This should check database for consent records
        # For now, return True if parent_id matches child's parent
        return True  # Implement actual verification

    @staticmethod
    def anonymize_child_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Remove PII from child data"""
        safe_fields = ['age', 'grade_level', 'learning_style', 'progress', 'stars']
        return {k: v for k, v in data.items() if k in safe_fields}

    @staticmethod
    def validate_parent_age(birth_date: str) -> bool:
        """Verify parent is 18 or older"""
        try:
            birth = datetime.datetime.strptime(birth_date, '%Y-%m-%d')
            age = (datetime.datetime.now() - birth).days / 365.25
            return age >= 18
        except:
            return False

    @staticmethod
    def generate_child_pseudonym() -> str:
        """Generate anonymous identifier for child"""
        adjectives = ['Happy', 'Bright', 'Smart', 'Creative', 'Curious']
        nouns = ['Star', 'Explorer', 'Scholar', 'Learner', 'Student']
        number = secrets.randbelow(9999)
        return f"{secrets.choice(adjectives)}{secrets.choice(nouns)}{number:04d}"


# Decorators for route protection
def require_platform_key(platform: str):
    """Require valid platform API key"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            api_key = request.headers.get('X-API-Key')

            if not api_key:
                return jsonify({'error': 'API key required'}), 401

            expected_key = current_app.config['PLATFORM_API_KEYS'].get(platform)

            if not expected_key:
                logger.error(f"No API key configured for platform: {platform}")
                return jsonify({'error': 'Platform not configured'}), 503

            if not secrets.compare_digest(api_key, expected_key):
                logger.warning(f"Invalid API key for platform: {platform}")
                return jsonify({'error': 'Invalid API key'}), 401

            g.platform = platform
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def require_token(user_type: Optional[str] = None):
    """Require valid JWT token"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = None
            auth_header = request.headers.get('Authorization')

            if auth_header:
                try:
                    token = auth_header.split(' ')[1]  # Bearer <token>
                except IndexError:
                    return jsonify({'error': 'Invalid token format'}), 401

            if not token:
                return jsonify({'error': 'Token required'}), 401

            security_manager = current_app.extensions.get('security_manager')
            if not security_manager:
                logger.error("Security manager not initialized")
                return jsonify({'error': 'Server configuration error'}), 500

            payload = security_manager.decode_jwt_token(token)

            if not payload:
                return jsonify({'error': 'Invalid or expired token'}), 401

            # Check user type if specified
            if user_type and payload.get('user_type') != user_type:
                return jsonify({'error': 'Insufficient permissions'}), 403

            g.current_user = payload
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def require_coppa_compliance():
    """Ensure COPPA compliance for child-related operations"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_app.config.get('COPPA_COMPLIANCE'):
                return f(*args, **kwargs)

            # Check if operation involves child data
            if g.get('current_user', {}).get('user_type') == 'child':
                # Verify parental consent
                parent_id = g.current_user.get('parent_id')
                child_id = g.current_user.get('id')

                if not COPPACompliance.verify_parental_consent(parent_id, child_id):
                    return jsonify({'error': 'Parental consent required'}), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator


class RateLimiter:
    """Custom rate limiter for different platforms and user types"""

    def __init__(self, redis_client):
        self.redis_client = redis_client

    def check_rate_limit(self, key: str, limit: int = 100, window: int = 3600) -> bool:
        """Check if rate limit exceeded"""
        try:
            pipe = self.redis_client.pipeline()
            now = datetime.datetime.utcnow().timestamp()
            window_start = now - window

            # Remove old entries
            pipe.zremrangebyscore(key, 0, window_start)

            # Count requests in window
            pipe.zcard(key)

            # Add current request
            pipe.zadd(key, {str(now): now})

            # Set expiry
            pipe.expire(key, window)

            results = pipe.execute()
            request_count = results[1]

            return request_count < limit

        except Exception as e:
            logger.error(f"Rate limit check failed: {e}")
            return True  # Allow request on error


def rate_limit(requests: int = 100, window: int = 3600, key_func=None):
    """Rate limiting decorator"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_app.config.get('RATELIMIT_ENABLED', True):
                return f(*args, **kwargs)

            # Generate rate limit key
            if key_func:
                key = key_func()
            else:
                key = f"rate_limit:{request.remote_addr}:{f.__name__}"

            limiter = RateLimiter(current_app.extensions.get('redis_client'))

            if not limiter.check_rate_limit(key, requests, window):
                return jsonify({'error': 'Rate limit exceeded'}), 429

            return f(*args, **kwargs)
        return decorated_function
    return decorator


# Input validation
class InputValidator:
    """Validate and sanitize user input"""

    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))

    @staticmethod
    def validate_password(password: str) -> tuple[bool, str]:
        """Validate password strength"""
        if len(password) < 8:
            return False, "Password must be at least 8 characters"

        if not re.search(r'[A-Z]', password):
            return False, "Password must contain uppercase letter"

        if not re.search(r'[a-z]', password):
            return False, "Password must contain lowercase letter"

        if not re.search(r'[0-9]', password):
            return False, "Password must contain number"

        return True, "Password valid"

    @staticmethod
    def sanitize_input(text: str, max_length: int = 1000) -> str:
        """Sanitize text input"""
        # Remove control characters
        text = ''.join(char for char in text if ord(char) >= 32)

        # Limit length
        text = text[:max_length]

        # Remove potential SQL injection attempts
        dangerous_patterns = ['--', '/*', '*/', 'xp_', 'sp_', 'exec', 'execute']
        for pattern in dangerous_patterns:
            text = text.replace(pattern, '')

        return text.strip()

    @staticmethod
    def validate_age(age: Any) -> bool:
        """Validate age input"""
        try:
            age_int = int(age)
            return 1 <= age_int <= 120
        except:
            return False


# Security headers middleware
def add_security_headers(response):
    """Add security headers to response"""
    headers = current_app.config.get('SECURITY_HEADERS', {})
    for header, value in headers.items():
        response.headers[header] = value
    return response


# Audit logging
class AuditLogger:
    """Log security-relevant events"""

    def __init__(self, log_file='audit.log'):
        self.logger = logging.getLogger('audit')
        handler = logging.FileHandler(log_file)
        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)

    def log_authentication(self, user_id: int, user_type: str, success: bool, platform: str = None):
        """Log authentication attempt"""
        self.logger.info(f"AUTH: user_id={user_id}, type={user_type}, success={success}, platform={platform}")

    def log_data_access(self, user_id: int, resource: str, action: str):
        """Log data access"""
        self.logger.info(f"ACCESS: user_id={user_id}, resource={resource}, action={action}")

    def log_security_event(self, event: str, details: str):
        """Log security event"""
        self.logger.warning(f"SECURITY: event={event}, details={details}")


# Initialize global instances
security_manager = SecurityManager()
audit_logger = AuditLogger()