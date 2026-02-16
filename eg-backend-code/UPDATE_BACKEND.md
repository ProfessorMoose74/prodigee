# Backend Security Update Guide

## Overview
Your frontends (Android, Desktop, VR) already handle COPPA compliance, parental controls, and child safety features. This update focuses on securing the **backend API layer** that all your frontends communicate with.

## What's Being Updated

### ✅ Already Handled by Your Frontends:
- COPPA compliance (parental consent flow)
- Child account creation through parents
- Age verification
- Progress monitoring dashboards
- Child-safe UI/UX

### 🔐 New Backend Security Features:
1. **Secure Configuration Management** - No more hardcoded secrets
2. **Platform-Specific API Keys** - Each frontend gets its own key
3. **Rate Limiting** - Prevent abuse and DDoS
4. **Token Blacklisting** - Secure logout across all platforms
5. **Audit Logging** - Track security events
6. **GPU Optimization** - Better V100 utilization
7. **Security Headers** - Protect against common attacks

## Quick Start

### 1. Generate Secure Configuration
```bash
python backend_security_update.py --generate-config
```
This will generate:
- Secret keys for JWT tokens
- API keys for each platform (Android, Desktop, VR, etc.)

### 2. Create .env File
```bash
cp .env.template .env
# Edit .env and add the generated keys
```

### 3. Update Your Frontends
Add the appropriate API key to each frontend:

#### Android App
```xml
<!-- app/src/main/res/values/secrets.xml -->
<resources>
    <string name="api_key">YOUR_ANDROID_API_KEY</string>
    <string name="api_base_url">https://api.elementalgenius.com</string>
</resources>
```

#### Desktop (Electron/React)
```javascript
// .env.production
REACT_APP_API_KEY=YOUR_DESKTOP_API_KEY
REACT_APP_API_URL=https://api.elementalgenius.com
```

#### VR Classroom (Unity)
```csharp
// APIConfig.cs
public static class APIConfig {
    public const string API_KEY = "YOUR_VR_API_KEY";
    public const string BASE_URL = "https://api.elementalgenius.com";
}
```

### 4. Update Backend Code
The main changes needed in `elemental_genius_backend.py`:

```python
# At the top, after imports
from config import get_config
from backend_security_update import apply_security_updates

# Replace the Config class with:
app.config.from_object(get_config())

# After creating the Flask app:
apply_security_updates(app, db, redis_client)
```

### 5. Verify Setup
```bash
python backend_security_update.py --verify
```

## Platform-Specific Headers

Each frontend should send these headers:

### Android
```kotlin
val request = Request.Builder()
    .url(url)
    .addHeader("X-API-Key", BuildConfig.API_KEY)
    .addHeader("X-Platform", "android")
    .addHeader("Authorization", "Bearer $token")
    .build()
```

### Desktop (JavaScript)
```javascript
fetch(url, {
    headers: {
        'X-API-Key': process.env.REACT_APP_API_KEY,
        'X-Platform': 'desktop',
        'Authorization': `Bearer ${token}`
    }
})
```

### VR (C#)
```csharp
request.SetRequestHeader("X-API-Key", APIConfig.API_KEY);
request.SetRequestHeader("X-Platform", "vr");
request.SetRequestHeader("Authorization", $"Bearer {token}");
```

## Rate Limits by Platform

| Platform | Requests/Hour | Notes |
|----------|--------------|-------|
| Android | 200 | Mobile data constraints |
| Desktop | 300 | Higher bandwidth |
| VR | 500 | More interactive |
| Web | 100 | Public access |
| Institute | 1000 | Bulk operations |

## Security Best Practices

### ✅ DO:
- Rotate API keys every 90 days
- Use HTTPS for all API calls
- Store tokens securely on each platform
- Implement token refresh before expiry
- Log out users after inactivity

### ❌ DON'T:
- Hardcode API keys in source code
- Store tokens in plain text
- Share API keys between platforms
- Disable certificate validation
- Log sensitive data

## Deployment Checklist

- [ ] Generate new secret keys
- [ ] Create .env file with keys
- [ ] Update each frontend with its API key
- [ ] Test each platform connection
- [ ] Enable HTTPS on production
- [ ] Set up Redis for rate limiting
- [ ] Configure backup and monitoring
- [ ] Document API keys in password manager

## Troubleshooting

### "API key required" Error
- Ensure X-API-Key header is sent
- Verify key matches platform

### "Rate limit exceeded" Error
- Implement exponential backoff
- Cache responses when possible
- Batch API requests

### Token Expired
- Implement token refresh flow
- Auto-logout on 401 responses

## Migration Path

1. **Phase 1**: Add security module (no breaking changes)
2. **Phase 2**: Deploy with optional API keys
3. **Phase 3**: Require API keys for all platforms
4. **Phase 4**: Enable rate limiting
5. **Phase 5**: Enforce HTTPS only

## Support

Your existing COPPA-compliant frontends will continue to work. This backend update adds defense-in-depth security without changing the user experience.

For questions about:
- Android app → Check `eg-android-app-old/`
- Desktop app → Check `eg-frontend-win-mac/`
- VR Classroom → Check `eg-vr-classroom/`
- Curriculum → Check `eg-curriculum/`
- Institute Portal → Check `eg-institute/`