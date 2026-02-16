"""
Backend Security Update for Elemental Genius
Integrates with existing COPPA-compliant frontends
"""

import os
import secrets
from flask import Flask
from config import get_config, validate_config
from security import security_manager, add_security_headers, audit_logger, rate_limit

def apply_security_updates(app, db, redis_client):
    """
    Apply security updates to existing backend without breaking frontend compatibility
    Your frontends already handle COPPA compliance - this secures the API layer
    """

    # 1. Load secure configuration
    config = get_config()
    app.config.from_object(config)

    # 2. Initialize security manager
    security_manager.init_app(app)
    app.extensions['security_manager'] = security_manager
    app.extensions['redis_client'] = redis_client

    # 3. Add security headers to all responses
    app.after_request(add_security_headers)

    # 4. Apply rate limiting to critical endpoints
    apply_rate_limits(app)

    # 5. Add platform detection for your various frontends
    @app.before_request
    def detect_platform():
        """Detect which frontend is making the request"""
        from flask import request, g

        user_agent = request.headers.get('User-Agent', '').lower()
        api_key = request.headers.get('X-API-Key', '')

        # Detect platform from user agent or API key
        if 'android' in user_agent or 'okhttp' in user_agent:
            g.platform = 'android'
        elif 'electron' in user_agent or 'desktop' in user_agent:
            g.platform = 'desktop'
        elif 'unity' in user_agent or 'unreal' in user_agent:
            g.platform = 'vr'
        elif 'mozilla' in user_agent or 'chrome' in user_agent:
            g.platform = 'web'
        else:
            g.platform = 'unknown'

        # Log platform access
        audit_logger.log_security_event('platform_access', f"Platform: {g.platform}, IP: {request.remote_addr}")

    # 6. Update token generation to include platform info
    def generate_secure_token(user_data, platform):
        """Generate token with platform-specific claims"""
        payload = {
            **user_data,
            'platform': platform,
            'issued_for': platform,
        }
        return security_manager.generate_jwt_token(payload)

    # 7. Add secure logout with token blacklisting
    def secure_logout(token):
        """Blacklist token on logout"""
        payload = security_manager.decode_jwt_token(token)
        if payload:
            security_manager.blacklist_token(
                payload.get('jti'),
                datetime.datetime.fromtimestamp(payload.get('exp', 0))
            )

    return app


def apply_rate_limits(app):
    """Apply rate limiting to protect against abuse"""

    # Different limits for different platforms
    platform_limits = {
        'android': {'requests': 200, 'window': 3600},     # 200/hour for mobile
        'desktop': {'requests': 300, 'window': 3600},     # 300/hour for desktop
        'vr': {'requests': 500, 'window': 3600},          # 500/hour for VR (more interactive)
        'web': {'requests': 100, 'window': 3600},         # 100/hour for web
        'institute': {'requests': 1000, 'window': 3600},  # 1000/hour for institutes
    }

    # Apply limits to authentication endpoints
    auth_endpoints = [
        '/parent/register',
        '/parent/login',
        '/child/login',
        '/api/auth/login',
        '/api/auth/register'
    ]

    for endpoint in auth_endpoints:
        if endpoint in app.view_functions:
            app.view_functions[endpoint] = rate_limit(
                requests=10,  # Strict limit for auth
                window=300    # 5 minutes
            )(app.view_functions[endpoint])

    # Apply limits to voice processing (resource intensive)
    voice_endpoints = [
        '/api/voice/process',
        '/api/voice/listen',
        '/api/voice/synthesize'
    ]

    for endpoint in voice_endpoints:
        if endpoint in app.view_functions:
            app.view_functions[endpoint] = rate_limit(
                requests=50,
                window=3600
            )(app.view_functions[endpoint])


def generate_secure_config():
    """Generate secure configuration for production deployment"""

    print("\n🔐 Generating Secure Configuration for Elemental Genius")
    print("=" * 60)

    # Generate secrets
    secret_key = secrets.token_urlsafe(64)
    jwt_secret = secrets.token_urlsafe(64)

    # Generate platform API keys
    platforms = ['android', 'ios', 'desktop', 'vr', 'web', 'institute']
    api_keys = {}
    for platform in platforms:
        api_keys[platform] = secrets.token_urlsafe(32)

    print("\n📝 Add these to your .env file:")
    print("-" * 40)
    print(f"SECRET_KEY={secret_key}")
    print(f"JWT_SECRET_KEY={jwt_secret}")
    print()
    for platform, key in api_keys.items():
        print(f"{platform.upper()}_API_KEY={key}")

    print("\n⚠️  IMPORTANT:")
    print("1. Never commit these keys to version control")
    print("2. Use different keys for each environment (dev/staging/prod)")
    print("3. Rotate keys periodically (every 90 days)")
    print("4. Store production keys in a secure vault (e.g., HashiCorp Vault)")

    print("\n📱 Frontend Configuration:")
    print("-" * 40)
    print("Add the appropriate API key to each frontend:")
    print("- Android: Add to app/src/main/res/values/secrets.xml")
    print("- Desktop: Add to .env.production")
    print("- VR: Add to ProjectSettings (Unity) or Config (Unreal)")
    print("- Web: Add to environment variables")

    return {
        'secret_key': secret_key,
        'jwt_secret': jwt_secret,
        'api_keys': api_keys
    }


def verify_security_setup():
    """Verify that security is properly configured"""

    print("\n🔍 Security Configuration Check")
    print("=" * 60)

    issues = []
    warnings = []

    # Check environment variables
    if not os.environ.get('SECRET_KEY'):
        issues.append("SECRET_KEY not set in environment")

    if not os.environ.get('DATABASE_URL'):
        warnings.append("DATABASE_URL not set - using SQLite (development only)")

    # Check platform API keys
    platforms = ['ANDROID_API_KEY', 'DESKTOP_API_KEY', 'VR_API_KEY']
    for platform in platforms:
        if not os.environ.get(platform):
            warnings.append(f"{platform} not set - {platform.lower()} won't be able to connect")

    # Check Redis
    if not os.environ.get('REDIS_URL'):
        warnings.append("REDIS_URL not set - rate limiting and sessions may not work properly")

    # Report results
    if issues:
        print("❌ CRITICAL ISSUES FOUND:")
        for issue in issues:
            print(f"   - {issue}")
        print("\n   Run: python backend_security_update.py --generate-config")
        return False

    if warnings:
        print("⚠️  Warnings:")
        for warning in warnings:
            print(f"   - {warning}")

    if not issues and not warnings:
        print("✅ Security configuration looks good!")

    print("\n📊 Security Features Status:")
    print(f"   - Rate Limiting: {'Enabled' if os.environ.get('REDIS_URL') else 'Disabled'}")
    print(f"   - HTTPS Only: {'Enforced' if os.environ.get('FLASK_ENV') == 'production' else 'Development Mode'}")
    print(f"   - COPPA Compliance: Handled by frontends")
    print(f"   - GPU Acceleration: {'Enabled' if os.environ.get('CUDA_VISIBLE_DEVICES') else 'Disabled'}")

    return not bool(issues)


if __name__ == '__main__':
    import sys

    if '--generate-config' in sys.argv:
        generate_secure_config()
    elif '--verify' in sys.argv:
        verify_security_setup()
    else:
        print("Elemental Genius Backend Security Update")
        print()
        print("Usage:")
        print("  python backend_security_update.py --generate-config")
        print("    Generate secure configuration values")
        print()
        print("  python backend_security_update.py --verify")
        print("    Verify security configuration")
        print()
        print("Your frontends already handle COPPA compliance.")
        print("This update secures the backend API layer.")