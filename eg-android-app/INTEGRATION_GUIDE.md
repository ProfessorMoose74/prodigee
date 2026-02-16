# Elemental Genius Mobile App Integration Guide

## Overview

This document provides a comprehensive guide for integrating the Elemental Genius React Native mobile application with the Flask backend server. All integration components have been tested and verified to work together smoothly.

## 🚀 Quick Start

### 1. Backend Setup

#### Option A: Full Backend (Recommended for Production)
```bash
cd eg-backend-code
pip install -r requirements.txt
python elemental_genius_backend.py
```

#### Option B: Test Backend (For Development/Testing)
```bash
cd eg-android-app
python test_backend.py
```

### 2. Mobile App Setup

```bash
cd eg-android-app
npm install
# For iOS
cd ios && pod install && cd ..
# Run the app
npx react-native run-android
# or
npx react-native run-ios
```

### 3. Verify Integration

```bash
cd eg-android-app
python test_integration.py
```

## 📱 Mobile App Architecture

### API Service Layer (`src/services/api.ts`)

The main API service provides type-safe communication with the backend:

- **Authentication**: Parent/child login with JWT tokens
- **Dashboard**: Child learning dashboard and parent analytics
- **Activities**: Activity completion and progress tracking
- **Real-time**: Voice interactions and learning sessions
- **Content**: Educational content and curriculum access

### Socket Service (`src/services/socket.ts`)

Real-time communication for parent monitoring:

- **Parent Notifications**: Activity start/completion events
- **Progress Updates**: Live progress tracking
- **Session Management**: Learning session monitoring
- **Connection Management**: Auto-reconnection and error handling

### Authentication Context (`src/context/AuthContext.tsx`)

Centralized authentication state management:

- **Token Management**: Secure JWT storage and validation
- **User State**: Parent/child user context
- **Auto-login**: Persistent authentication
- **Socket Integration**: Automatic socket connection on auth

## 🔗 Backend Integration Points

### API Endpoints

| Mobile App Endpoint | Backend Route | Purpose |
|-------------------|---------------|---------|
| `parentLogin()` | `POST /parent/login` | Parent authentication |
| `childLogin()` | `POST /child/login` | Child authentication (COPPA compliant) |
| `getChildDashboard()` | `GET /child/dashboard` | Child learning interface |
| `completeActivity()` | `POST /child/activity/{type}/complete` | Activity completion |
| `getAnalyticsDashboard()` | `GET /analytics/dashboard` | Parent monitoring |
| `logVoiceInteraction()` | `POST /child/voice-interactions` | Voice processing |

### WebSocket Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `child_login` | Backend → Parent | Child login notification |
| `child_activity_started` | Backend → Parent | Activity start alert |
| `child_activity_completed` | Backend → Parent | Activity completion |
| `learning_session_started` | Backend → Parent | Session monitoring |
| `progress_updated` | Backend → Parent | Real-time progress |

## 🔧 Configuration

### Environment Variables

Create `.env` file in mobile app root:

```env
# Backend Configuration
API_BASE_URL=http://localhost:5000
SOCKET_URL=http://localhost:5000

# Development Settings
DEBUG_MODE=true
LOG_LEVEL=info

# App Configuration
APP_NAME=Elemental Genius
VERSION=1.0.0
```

### Backend Configuration

The backend expects these settings in `elemental_genius_backend.py`:

```python
# CORS Configuration
CORS(app, origins=["*"])  # Configure for production

# Socket.IO Configuration
socketio = SocketIO(app, cors_allowed_origins="*")

# JWT Configuration
app.config['SECRET_KEY'] = 'your-secret-key'
```

## 📊 Testing & Verification

### Integration Test Suite

Run the comprehensive test suite:

```bash
python test_integration.py
```

**Test Coverage:**
- ✅ Backend health check
- ✅ Parent authentication flow
- ✅ Child authentication (COPPA compliant)
- ✅ Activity completion workflow
- ✅ Logout and token invalidation
- ✅ WebSocket/Socket.IO connectivity

### Manual Testing

1. **Parent Login**:
   - Email: `demo@elementalgenius.com`
   - Password: `demo123`

2. **Child Access**:
   - Child ID: `1` (Demo Child)
   - Requires parent authentication first

3. **Activity Testing**:
   - Complete rhyming activities
   - Verify progress tracking
   - Check parent notifications

## 🔒 Security Features

### Authentication
- **JWT Tokens**: Secure token-based authentication
- **Token Expiration**: 24-hour parent tokens, 4-hour child tokens
- **COPPA Compliance**: Children cannot login independently

### Data Protection
- **Secure Storage**: Encrypted token storage on device
- **API Security**: All endpoints require authentication
- **Input Validation**: Comprehensive request validation

### Privacy
- **Voice Data**: Processed and stored as text only
- **Parent Monitoring**: Real-time oversight without data retention
- **COPPA Compliance**: Child data protection standards

## 🚨 Troubleshooting

### Common Issues

**1. Connection Refused**
```bash
# Check if backend is running
curl http://localhost:5000/health
```

**2. Authentication Errors**
```bash
# Verify credentials
curl -X POST http://localhost:5000/parent/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@elementalgenius.com","password":"demo123"}'
```

**3. Socket Connection Issues**
```bash
# Test Socket.IO endpoint
curl http://localhost:5000/socket.io/?EIO=4&transport=polling
```

**4. CORS Issues**
- Ensure backend CORS is configured for mobile app origin
- Check `Access-Control-Allow-Origin` headers

### Debugging Tools

**Backend Logs**:
```bash
# Enable debug mode
export FLASK_DEBUG=1
python elemental_genius_backend.py
```

**Mobile App Debug**:
```javascript
// Enable API logging
console.log('API Request:', request);
console.log('API Response:', response);
```

## 📱 Mobile App Development

### Key Dependencies

```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.19.0",
    "axios": "^1.5.0",
    "socket.io-client": "^4.7.0",
    "react-native": "^0.72.0",
    "@react-navigation/native": "^6.1.0"
  }
}
```

### File Structure

```
eg-android-app/
├── src/
│   ├── services/
│   │   ├── api.ts           # Backend API integration
│   │   └── socket.ts        # Real-time communication
│   ├── context/
│   │   └── AuthContext.tsx  # Authentication state
│   ├── utils/
│   │   └── connectionTest.ts # Integration testing
│   └── components/
├── test_backend.py          # Lightweight test server
├── test_integration.py      # Integration test suite
└── INTEGRATION_GUIDE.md     # This guide
```

## 🔄 Development Workflow

### 1. Backend Development
```bash
# Start backend
cd eg-backend-code
python elemental_genius_backend.py

# Or use test backend
cd eg-android-app
python test_backend.py
```

### 2. Mobile Development
```bash
# Start Metro bundler
npx react-native start

# Run on device/simulator
npx react-native run-android
npx react-native run-ios
```

### 3. Integration Testing
```bash
# Verify connectivity
python test_integration.py

# Manual API testing
curl -X POST http://localhost:5000/parent/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@elementalgenius.com","password":"demo123"}'
```

## 📈 Production Deployment

### Backend Requirements
- Python 3.11+
- PostgreSQL database
- Redis for caching
- NVIDIA GPU for AI features (optional)

### Mobile App Requirements
- React Native 0.72+
- Android API level 21+
- iOS 13.0+

### Deployment Checklist
- [ ] Backend deployed with HTTPS
- [ ] Database properly configured
- [ ] CORS configured for production domains
- [ ] JWT secrets configured
- [ ] Mobile app built for production
- [ ] API endpoints updated for production
- [ ] Socket.IO configured for production

## 🎯 Next Steps

1. **Voice Processing**: Integrate with backend voice recognition
2. **Offline Mode**: Cache curriculum for offline learning
3. **Push Notifications**: Parent alerts and reminders
4. **Analytics**: Enhanced tracking and reporting
5. **Content Updates**: Dynamic curriculum delivery

## 📞 Support

For integration issues or questions:

1. Run the integration test suite: `python test_integration.py`
2. Check backend logs for errors
3. Verify mobile app API configuration
4. Test individual endpoints with curl/Postman

---

**Status**: ✅ All integration tests passing (6/6)  
**Last Updated**: August 2, 2025  
**Version**: 1.0.0