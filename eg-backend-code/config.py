"""
Elemental Genius Secure Configuration Management
Handles environment-based configuration for multi-platform deployment
"""

import os
import secrets
from datetime import timedelta
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BaseConfig:
    """Base configuration with secure defaults"""

    # Security - CRITICAL: Generate new secret key on first run
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        SECRET_KEY = secrets.token_urlsafe(64)
        logger.warning("⚠️  Generated temporary SECRET_KEY. Set SECRET_KEY environment variable in production!")

    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)  # Short-lived for children's sessions
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
    JWT_ALGORITHM = 'HS256'

    # Database Configuration with secure defaults
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'sqlite:///elemental_genius_dev.db'  # Local SQLite for development only
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True,  # Verify connections before using
    }

    # Redis Configuration
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL

    # Session Configuration
    SESSION_COOKIE_SECURE = True  # HTTPS only
    SESSION_COOKIE_HTTPONLY = True  # No JS access
    SESSION_COOKIE_SAMESITE = 'Strict'  # CSRF protection
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=30)  # Auto-logout for child safety

    # CORS Configuration for multi-platform support
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',') if os.environ.get('CORS_ORIGINS') else []

    # File Upload Security
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB max file size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp3', 'wav', 'json'}

    # Rate Limiting (requests per minute)
    RATELIMIT_STORAGE_URL = REDIS_URL
    RATELIMIT_STRATEGY = 'fixed-window'
    RATELIMIT_DEFAULT = "100 per hour"  # Conservative default

    # Platform-specific API Keys
    PLATFORM_API_KEYS = {
        'android': os.environ.get('ANDROID_API_KEY'),
        'ios': os.environ.get('IOS_API_KEY'),
        'desktop': os.environ.get('DESKTOP_API_KEY'),
        'vr': os.environ.get('VR_API_KEY'),
        'web': os.environ.get('WEB_API_KEY'),
        'institute': os.environ.get('INSTITUTE_API_KEY'),
    }

    # COPPA Compliance Settings
    COPPA_COMPLIANCE = True
    MINIMUM_PARENT_AGE = 18
    CHILD_DATA_RETENTION_DAYS = 30  # Auto-delete after 30 days of inactivity
    REQUIRE_PARENTAL_CONSENT = True
    ANONYMOUS_CHILD_MODE = True  # Don't store PII for children

    # GPU Configuration (NVIDIA V100 16GB)
    NVIDIA_GPU_ID = int(os.environ.get('CUDA_VISIBLE_DEVICES', '0'))
    GPU_MEMORY_LIMIT = int(os.environ.get('GPU_MEMORY_LIMIT', '14336'))
    TF_FORCE_GPU_ALLOW_GROWTH = os.environ.get('TF_FORCE_GPU_ALLOW_GROWTH', 'true').lower() == 'true'
    TF_ENABLE_XLA = os.environ.get('TF_ENABLE_XLA', 'true').lower() == 'true'
    TF_MIXED_PRECISION = os.environ.get('TF_MIXED_PRECISION', 'true').lower() == 'true'

    # Logging Configuration
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FILE = os.environ.get('LOG_FILE', 'elemental_genius.log')
    AUDIT_LOG_FILE = os.environ.get('AUDIT_LOG_FILE', 'audit.log')

    # Security Headers
    SECURITY_HEADERS = {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'",
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    }

    # Voice Processing Security
    VOICE_PROCESSING_ENABLED = os.environ.get('VOICE_PROCESSING_ENABLED', 'true').lower() == 'true'
    VOICE_DATA_ENCRYPTED = True
    VOICE_AUTO_DELETE_HOURS = 24  # Delete voice data after 24 hours

    # Content Delivery
    CONTENT_DELIVERY_NETWORK = os.environ.get('CDN_URL', '')
    STATIC_FOLDER = 'static'
    UPLOAD_FOLDER = 'uploads'

    # Feature Flags
    FEATURES = {
        'vr_classroom': os.environ.get('FEATURE_VR_CLASSROOM', 'false').lower() == 'true',
        'ai_tutoring': os.environ.get('FEATURE_AI_TUTORING', 'true').lower() == 'true',
        'voice_interaction': os.environ.get('FEATURE_VOICE', 'true').lower() == 'true',
        'institute_portal': os.environ.get('FEATURE_INSTITUTE', 'false').lower() == 'true',
    }


class DevelopmentConfig(BaseConfig):
    """Development configuration - relaxed security for testing"""
    DEBUG = True
    TESTING = False

    # Relaxed CORS for development
    CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:5000']

    # Disable some security features for easier development
    SESSION_COOKIE_SECURE = False
    WTF_CSRF_ENABLED = False

    # More verbose logging
    LOG_LEVEL = 'DEBUG'

    # Simplified rate limiting
    RATELIMIT_DEFAULT = "1000 per hour"


class TestingConfig(BaseConfig):
    """Testing configuration - for automated tests"""
    DEBUG = True
    TESTING = True

    # Use in-memory SQLite for tests
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

    # Disable CSRF for testing
    WTF_CSRF_ENABLED = False

    # Fast token expiry for testing
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=5)

    # Disable rate limiting in tests
    RATELIMIT_ENABLED = False


class ProductionConfig(BaseConfig):
    """Production configuration - maximum security"""
    DEBUG = False
    TESTING = False

    # Enforce all security measures
    if not os.environ.get('SECRET_KEY'):
        raise ValueError("SECRET_KEY environment variable must be set in production!")

    if not os.environ.get('DATABASE_URL'):
        raise ValueError("DATABASE_URL environment variable must be set in production!")

    # Strict CORS - must be configured
    if not os.environ.get('CORS_ORIGINS'):
        logger.warning("CORS_ORIGINS not set - API will reject all cross-origin requests")

    # Enforce HTTPS
    SESSION_COOKIE_SECURE = True
    PREFERRED_URL_SCHEME = 'https'

    # Production logging
    LOG_LEVEL = 'WARNING'

    # Strict rate limiting
    RATELIMIT_DEFAULT = "50 per hour"

    # Require all platform API keys
    for platform, key in BaseConfig.PLATFORM_API_KEYS.items():
        if not key and platform in ['android', 'desktop', 'web']:
            logger.warning(f"Missing API key for platform: {platform}")


class InstituteConfig(ProductionConfig):
    """Special configuration for Institute deployments"""

    # Extended session for teachers/administrators
    PERMANENT_SESSION_LIFETIME = timedelta(hours=8)

    # Higher rate limits for bulk operations
    RATELIMIT_DEFAULT = "500 per hour"

    # Additional features for institutes
    FEATURES = {
        **ProductionConfig.FEATURES,
        'bulk_enrollment': True,
        'analytics_dashboard': True,
        'curriculum_customization': True,
        'parent_portal': True,
    }

    # Institute-specific compliance
    FERPA_COMPLIANCE = True  # For US schools
    GDPR_COMPLIANCE = True   # For EU schools


# Configuration selector
def get_config():
    """Get configuration based on environment"""
    env = os.environ.get('FLASK_ENV', 'development').lower()

    configs = {
        'development': DevelopmentConfig,
        'testing': TestingConfig,
        'production': ProductionConfig,
        'institute': InstituteConfig,
    }

    config_class = configs.get(env, DevelopmentConfig)
    logger.info(f"Loading configuration: {config_class.__name__}")

    return config_class()


# Validate configuration
def validate_config(config):
    """Validate configuration for security issues"""
    issues = []

    # Check critical security settings
    if config.DEBUG and env != 'development':
        issues.append("DEBUG mode enabled in non-development environment")

    if 'your-super-secret' in str(config.SECRET_KEY):
        issues.append("Using default SECRET_KEY - CRITICAL SECURITY RISK")

    if 'password' in str(config.SQLALCHEMY_DATABASE_URI):
        issues.append("Database password visible in connection string")

    if not config.SESSION_COOKIE_SECURE and env == 'production':
        issues.append("Session cookies not secured with HTTPS")

    # Check COPPA compliance
    if config.COPPA_COMPLIANCE and not config.REQUIRE_PARENTAL_CONSENT:
        issues.append("COPPA compliance enabled but parental consent not required")

    # Check platform API keys
    if env == 'production':
        missing_keys = [k for k, v in config.PLATFORM_API_KEYS.items() if not v]
        if missing_keys:
            issues.append(f"Missing API keys for platforms: {', '.join(missing_keys)}")

    if issues:
        logger.error("Configuration validation failed:")
        for issue in issues:
            logger.error(f"  - {issue}")
        if env == 'production':
            raise ValueError("Configuration validation failed. See logs for details.")
    else:
        logger.info("✅ Configuration validation passed")

    return len(issues) == 0


# Export configuration
config = get_config()
env = os.environ.get('FLASK_ENV', 'development')

# Validate on import
if not validate_config(config):
    logger.warning("⚠️  Configuration has security issues - review logs")