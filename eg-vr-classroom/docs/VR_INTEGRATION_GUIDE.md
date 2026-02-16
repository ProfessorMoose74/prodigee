# VR Integration Guide - Unity to Python Backend

**Complete guide for integrating Unity VR client with Python backend services**

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend Setup](#backend-setup)
3. [Unity Setup](#unity-setup)
4. [Authentication Flow](#authentication-flow)
5. [API Integration](#api-integration)
6. [Real-time Communication](#real-time-communication)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Unity VR Client                         │
│                    (Meta Quest 3)                           │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │OASISManager  │  │PythonBridge  │  │VRSession     │     │
│  │              │  │              │  │Controller    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────┬────────────────────────────────────────────────┘
             │
             │ HTTP REST API (5000)
             │ WebSocket (8765)
             │
┌────────────▼────────────────────────────────────────────────┐
│                  Python Backend Services                    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Flask API    │  │ OASIS Service│  │  WebSocket   │     │
│  │ (/api/vr)    │  │   Manager    │  │    Server    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Backend Client│  │Library Client│  │ Translation  │     │
│  │(Curriculum)  │  │(3D/Audio)    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────┬────────────────────────────────────────────────┘
             │
             │ External APIs
             │
┌────────────▼────────────────────────────────────────────────┐
│                    External Services                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │EG Backend API│  │Content Library│  │   Database   │     │
│  │(Curriculum)  │  │(Assets)      │  │ (PostgreSQL) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Communication Flow

1. **Authentication**:
   - Parent logs in via web/app → Gets JWT token
   - Parent selects child → Gets child-specific token
   - Unity receives token → Starts VR session

2. **Session Start**:
   - Unity → `POST /api/vr/session/start` → Python
   - Python verifies token → Creates session → Returns session ID
   - Unity stores session ID → Begins VR experience

3. **Curriculum Loading**:
   - Unity → `GET /api/vr/curriculum/current` → Python
   - Python → Backend API → Gets current activity
   - Python → Unity → Activity data (JSON)
   - Unity displays activity in VR

4. **Progress Tracking**:
   - Child completes activity in VR
   - Unity → `POST /api/vr/progress/submit` → Python
   - Python → Backend API → Saves progress
   - Python → Unity → Confirmation

5. **Real-time Updates** (WebSocket):
   - Parent monitoring: Python → Unity (session status)
   - Multi-user: Python ↔ Unity (sync state)
   - Emergency stop: Parent → Python → Unity

---

## Backend Setup

### 1. Start Python Backend Services

**Option A: Start VR API Server**

```bash
# Navigate to project root
cd C:\Users\rober\Git\eg-vr-classroom

# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Start VR API server
python scripts/start_vr_api_server.py
```

**Output**:
```
============================================================
🎮 EG OASIS VR API Server
============================================================

Initializing OASIS services...
✅ OASIS services started

Creating API server...
✅ API server created

============================================================
🚀 VR API Server Running
============================================================

📡 Endpoints available at:
   http://localhost:5000/api/vr/session/start
   http://localhost:5000/api/vr/session/stop
   http://localhost:5000/api/vr/curriculum/current
   ...

💡 Unity client should connect to: http://localhost:5000
```

**Option B: Integration Demo (Full System)**

```bash
# Run full system demo
python scripts/demo_oasis_integration.py
```

This starts:
- Flask API server
- WebSocket server
- All backend service clients
- Demo user session

### 2. Verify Backend is Running

**Test endpoints**:

```bash
# Check system status
curl http://localhost:5000/api/vr/status

# Expected response:
{
  "status": "operational",
  "version": "0.1.0",
  "services": {
    "backend": "connected",
    "library": "connected",
    "translation": "ready"
  },
  "active_sessions": 0
}
```

### 3. Configure Backend Settings

Edit `config/settings.yaml`:

```yaml
# VR API Settings
vr_api:
  host: "0.0.0.0"
  port: 5000
  debug: true
  cors_enabled: true
  allowed_origins:
    - "*"  # Development only! Restrict in production

# Session Settings
session:
  max_duration_minutes: 30
  heartbeat_interval_seconds: 30
  token_expiry_hours: 2

# Security
security:
  jwt_secret: "your-secret-key-change-in-production"
  require_https: false  # Set true in production
```

---

## Unity Setup

### 1. Configure OASIS Manager

In Unity Editor:

1. Create empty GameObject: **OASIS Manager**
2. Add component: **OASIS Manager**
3. Configure in Inspector:

**Python Backend Configuration**:
- **Python Backend URL**: `http://localhost:5000`
  - Production: `https://your-api.com`
- **Websocket URL**: `ws://localhost:8765`
  - Production: `wss://your-api.com/ws`

**VR Settings**:
- **VR Platform**: `meta_quest_3`
- **Enable VR On Start**: ✅

**Session Settings**:
- **Session Heartbeat Interval**: 30 (seconds)
- **Connection Timeout**: 10 (seconds)

**Debug**:
- **Debug Mode**: ✅ (for development)

### 2. Create Test Scene

**Create test script** (`Assets/Scripts/TestIntegration.cs`):

```csharp
using System.Collections;
using UnityEngine;
using EG.OASIS;

public class TestIntegration : MonoBehaviour
{
    [Header("Test Credentials")]
    [SerializeField] private string testParentToken = "test_token_123";
    [SerializeField] private int testChildId = 1;
    [SerializeField] private string testChildName = "Alice";

    [Header("Auto Start")]
    [SerializeField] private bool autoStartSession = true;

    private void Start()
    {
        if (autoStartSession)
        {
            StartCoroutine(StartTestSession());
        }
    }

    private IEnumerator StartTestSession()
    {
        Debug.Log("=== Starting Test VR Session ===");

        // Wait for OASIS Manager to initialize
        yield return new WaitForSeconds(1f);

        // Start VR
        OASISManager.Instance.StartVR();

        // Wait for VR to initialize
        yield return new WaitForSeconds(2f);

        // Start child session
        yield return StartCoroutine(OASISManager.Instance.StartChildSession(
            testParentToken,
            testChildId,
            testChildName
        ));

        // Check connection
        if (OASISManager.Instance.IsConnected)
        {
            Debug.Log("✅ Connected to backend!");
            Debug.Log($"Session ID: {OASISManager.Instance.SessionID}");

            // Test curriculum loading
            StartCoroutine(TestCurriculumLoad());
        }
        else
        {
            Debug.LogError("❌ Failed to connect to backend");
        }
    }

    private IEnumerator TestCurriculumLoad()
    {
        Debug.Log("=== Testing Curriculum Load ===");

        var bridge = FindObjectOfType<PythonBridge>();

        yield return StartCoroutine(bridge.GetCurriculumContent(
            onSuccess: (content) =>
            {
                Debug.Log("✅ Curriculum loaded!");
                Debug.Log($"Activity: {content.title}");
                Debug.Log($"Type: {content.content_type}");
            },
            onError: (error) =>
            {
                Debug.LogError($"❌ Curriculum load failed: {error}");
            }
        ));
    }

    // Test from inspector button
    [ContextMenu("Test Connection")]
    public void TestConnection()
    {
        StartCoroutine(StartTestSession());
    }

    // Test progress submission
    [ContextMenu("Test Progress Submit")]
    public void TestProgressSubmit()
    {
        StartCoroutine(SubmitTestProgress());
    }

    private IEnumerator SubmitTestProgress()
    {
        var bridge = FindObjectOfType<PythonBridge>();

        yield return StartCoroutine(bridge.SubmitProgress(
            activityId: 1,
            completed: true,
            score: 0.95f,
            onComplete: (success) =>
            {
                if (success)
                {
                    Debug.Log("✅ Progress submitted!");
                }
                else
                {
                    Debug.LogError("❌ Progress submission failed");
                }
            }
        ));
    }
}
```

### 3. Add to Scene

1. Create empty GameObject: **Test Integration**
2. Add component: **Test Integration**
3. Configure test credentials
4. Enable **Auto Start Session**

---

## Authentication Flow

### Parent-Child Authentication

**Backend (Web/Mobile App)**:

1. Parent logs in → Gets parent JWT token
2. Parent selects child → Gets child-specific session token
3. Token passed to VR application

**Unity VR App**:

```csharp
// Receive token from external source (web, QR code, etc.)
string parentToken = "eyJ0eXAiOiJKV1QiLCJhbGc...";
int childId = 123;
string childName = "Alice";

// Start VR session
StartCoroutine(OASISManager.Instance.StartChildSession(
    parentToken,
    childId,
    childName
));
```

### Token Exchange Process

**Step 1: Unity sends credentials to Python**

```csharp
// PythonBridge.cs
POST /api/vr/session/start
{
  "child_id": 123,
  "parent_token": "eyJ0eXAiOiJKV1Qi...",
  "vr_platform": "meta_quest_3"
}
```

**Step 2: Python verifies and creates session**

```python
# vr_endpoints.py
@vr_api.route('/session/start', methods=['POST'])
def start_vr_session():
    # Verify parent token
    # Create VR session
    # Generate session token
    return {
        "success": True,
        "session_id": "vr_session_abc123",
        "auth_token": "session_jwt_token...",
        "child_name": "Alice",
        "language": "en"
    }
```

**Step 3: Unity stores session token**

```csharp
// PythonBridge.cs
SessionID = response.session_id;
_authToken = response.auth_token;
IsConnected = true;
```

**Step 4: Unity uses session token for API calls**

```csharp
// All subsequent requests include Authorization header
request.SetRequestHeader("Authorization", $"Bearer {_authToken}");
```

---

## API Integration

### Session Management

#### Start Session

```csharp
// Unity
StartCoroutine(OASISManager.Instance.StartChildSession(
    parentToken: "parent_jwt",
    childId: 1,
    childName: "Alice"
));
```

```python
# Python API
POST /api/vr/session/start
{
  "child_id": 1,
  "parent_token": "parent_jwt",
  "vr_platform": "meta_quest_3"
}

Response:
{
  "success": true,
  "session_id": "vr_abc123",
  "auth_token": "session_jwt",
  "message": "Session started successfully"
}
```

#### Stop Session

```csharp
// Unity
OASISManager.Instance.StopSession();
```

```python
# Python API
GET /api/vr/session/stop?session_id=vr_abc123
Authorization: Bearer session_jwt

Response:
{
  "success": true,
  "message": "Session stopped successfully"
}
```

#### Heartbeat

```csharp
// Unity (automatic, every 30 seconds)
_pythonBridge.SendHeartbeat();
```

```python
# Python API
POST /api/vr/session/heartbeat
{
  "session_id": "vr_abc123",
  "timestamp": "2025-10-09T10:30:00Z"
}

Response:
{
  "success": true,
  "message": "Heartbeat received"
}
```

### Curriculum Integration

#### Get Current Curriculum

```csharp
// Unity
var bridge = FindObjectOfType<PythonBridge>();

StartCoroutine(bridge.GetCurriculumContent(
    onSuccess: (content) =>
    {
        // Display activity in VR
        ShowActivity(content);
    },
    onError: (error) =>
    {
        Debug.LogError(error);
    }
));
```

```python
# Python API
GET /api/vr/curriculum/current?child_id=1
Authorization: Bearer session_jwt

Response:
{
  "activity_id": 1,
  "title": "Phoneme Segmentation: /cat/",
  "description": "Identify the sounds in 'cat'",
  "content_type": "phonemic_awareness",
  "data": {
    "word": "cat",
    "phonemes": ["/k/", "/æ/", "/t/"],
    "difficulty": 1,
    "hints_available": true
  }
}
```

#### Display Activity

```csharp
// Unity - Example activity handler
void ShowActivity(CurriculumContent content)
{
    switch (content.content_type)
    {
        case "phonemic_awareness":
            ShowPhonemicActivity(content);
            break;

        case "reading":
            ShowReadingActivity(content);
            break;

        case "math":
            ShowMathActivity(content);
            break;
    }
}

void ShowPhonemicActivity(CurriculumContent content)
{
    // Get data
    string word = content.data["word"].ToString();
    var phonemes = content.data["phonemes"] as List<string>;

    // Display on blackboard
    blackboard.ShowText($"Say the sounds in: {word}");

    // Set up interactive elements
    foreach (var phoneme in phonemes)
    {
        CreatePhonemeBubble(phoneme);
    }

    // Professor Al provides instructions
    professorAl.Speak($"Let's break down the word {word}!");
}
```

### Progress Tracking

#### Submit Progress

```csharp
// Unity - When activity completes
void OnActivityComplete(int activityId, float score)
{
    var bridge = FindObjectOfType<PythonBridge>();

    StartCoroutine(bridge.SubmitProgress(
        activityId: activityId,
        completed: true,
        score: score,
        onComplete: (success) =>
        {
            if (success)
            {
                ShowSuccessAnimation();
                LoadNextActivity();
            }
        }
    ));
}
```

```python
# Python API
POST /api/vr/progress/submit
{
  "session_id": "vr_abc123",
  "activity_id": 1,
  "completed": true,
  "score": 0.95,
  "timestamp": "2025-10-09T10:35:00Z",
  "details": {
    "attempts": 1,
    "hints_used": 0,
    "time_spent": 120
  }
}

Response:
{
  "success": true,
  "message": "Progress saved successfully"
}
```

### Translation Service

#### Translate Text

```csharp
// Unity - Translate for child's language
string childLanguage = "es";  // Spanish

StartCoroutine(bridge.TranslateText(
    text: "Great job!",
    targetLanguage: childLanguage,
    onSuccess: (translatedText) =>
    {
        // Show translated text
        ShowMessage(translatedText);  // "¡Buen trabajo!"
    },
    onError: (error) =>
    {
        // Fallback to English
        ShowMessage("Great job!");
    }
));
```

### Asset Loading

#### Load 3D Model

```csharp
// Unity - Load model from library
string modelId = "elephant_ella_v1";

StartCoroutine(bridge.GetModel(
    modelId: modelId,
    onSuccess: (modelData) =>
    {
        // Load GLB model
        LoadGLBModel(modelData);
    },
    onError: (error) =>
    {
        Debug.LogError($"Failed to load model: {error}");
    }
));
```

---

## Real-time Communication

### WebSocket Integration

**Python WebSocket Server**:

```python
# Already implemented in src/services/backend/websocket_client.py
# Connects to existing WebSocket infrastructure
```

**Unity WebSocket Client** (future implementation):

```csharp
using WebSocketSharp;

public class WebSocketManager : MonoBehaviour
{
    private WebSocket _ws;

    public void Connect(string url, string authToken)
    {
        _ws = new WebSocket(url);

        _ws.OnOpen += (sender, e) =>
        {
            Debug.Log("WebSocket connected");
            // Send auth token
            _ws.Send($"{{\"type\":\"auth\",\"token\":\"{authToken}\"}}");
        };

        _ws.OnMessage += (sender, e) =>
        {
            HandleMessage(e.Data);
        };

        _ws.Connect();
    }

    private void HandleMessage(string data)
    {
        // Parse JSON message
        var message = JsonConvert.DeserializeObject<WSMessage>(data);

        switch (message.type)
        {
            case "parent_monitoring":
                // Parent is watching
                ShowParentIndicator();
                break;

            case "emergency_stop":
                // Parent triggered emergency stop
                OASISManager.Instance.StopSession();
                break;

            case "user_joined":
                // Another child joined classroom
                SpawnOtherUser(message.data);
                break;
        }
    }
}
```

---

## Testing

### 1. Unit Testing (Unity)

**Test script** (`Assets/Scripts/Tests/PythonBridgeTests.cs`):

```csharp
using NUnit.Framework;
using UnityEngine.TestTools;
using System.Collections;

public class PythonBridgeTests
{
    [UnityTest]
    public IEnumerator ConnectionTest()
    {
        var bridge = new PythonBridge();
        bridge.Initialize("http://localhost:5000", "ws://localhost:8765", true);

        yield return bridge.ConnectToBackend("test_token", 1, "meta_quest_3");

        Assert.IsTrue(bridge.IsConnected, "Should connect to backend");
    }

    [UnityTest]
    public IEnumerator CurriculumLoadTest()
    {
        var bridge = new PythonBridge();
        bool loaded = false;

        yield return bridge.GetCurriculumContent(
            onSuccess: (content) => { loaded = true; },
            onError: (error) => { }
        );

        Assert.IsTrue(loaded, "Should load curriculum");
    }
}
```

### 2. Integration Testing

**Run both systems**:

Terminal 1 (Python):
```bash
python scripts/start_vr_api_server.py
```

Terminal 2 (Unity):
- Open Unity project
- Click Play
- Watch Console for connection logs

**Expected output**:
```
[OASIS] Initializing OASIS Manager...
[OASIS] Starting VR subsystem...
[PythonBridge] Connecting to Python backend...
[PythonBridge] Connected successfully - Session ID: vr_abc123
[VRSession] Starting VR session
✅ All systems operational
```

### 3. Network Testing

**Test network connectivity**:

```bash
# Check if API is accessible
curl http://localhost:5000/api/vr/status

# Test session start
curl -X POST http://localhost:5000/api/vr/session/start \
  -H "Content-Type: application/json" \
  -d '{"child_id":1,"parent_token":"test","vr_platform":"meta_quest_3"}'
```

---

## Deployment

### Local Network (Quest Development)

**1. Find PC IP address**:

Windows:
```bash
ipconfig
# Look for: IPv4 Address (e.g., 192.168.1.100)
```

macOS/Linux:
```bash
ifconfig
# Look for: inet address
```

**2. Update Unity settings**:

```csharp
// Change from localhost to PC IP
pythonBackendURL = "http://192.168.1.100:5000";
websocketURL = "ws://192.168.1.100:8765";
```

**3. Start Python server on network**:

```python
# start_vr_api_server.py
app.run(
    host='0.0.0.0',  # Listen on all interfaces
    port=5000
)
```

**4. Build and deploy to Quest**:

- File → Build and Run
- Quest must be on same WiFi network

### Production Deployment

**Python Backend**:

```bash
# Use production WSGI server (e.g., Gunicorn)
gunicorn --bind 0.0.0.0:5000 --workers 4 src.api:create_api_app()

# With HTTPS (recommended)
gunicorn --bind 0.0.0.0:443 \
  --certfile=/path/to/cert.pem \
  --keyfile=/path/to/key.pem \
  --workers 4 \
  src.api:create_api_app()
```

**Unity VR App**:

```csharp
// Production settings
pythonBackendURL = "https://api.yourdomain.com";
websocketURL = "wss://api.yourdomain.com/ws";
```

**Security considerations**:
- Use HTTPS/WSS in production
- Implement proper JWT verification
- Rate limiting on API
- Input validation
- CORS restrictions

---

## Troubleshooting

### Connection Issues

**Problem**: "Failed to connect to backend"

**Solutions**:
1. Check Python server is running:
   ```bash
   curl http://localhost:5000/api/vr/status
   ```

2. Check firewall settings:
   - Windows: Allow Python through firewall
   - Quest: Check WiFi network allows local connections

3. Check URL in Unity:
   - Use IP address, not "localhost" when testing on Quest
   - Verify port number matches Python server

**Problem**: "Connection timeout"

**Solutions**:
1. Increase timeout in Unity:
   ```csharp
   connectionTimeout = 30f;  // Increase to 30 seconds
   ```

2. Check network speed:
   - Quest and PC on same network?
   - WiFi signal strength good?

### Authentication Issues

**Problem**: "Invalid or expired token"

**Solutions**:
1. Check token expiry time (default: 2 hours)
2. Verify token format (JWT)
3. Check system clocks are synchronized

**Problem**: "Session not found"

**Solutions**:
1. Check session was created successfully
2. Verify session ID matches
3. Check if session expired (30 min default)

### Data Issues

**Problem**: "Curriculum not loading"

**Solutions**:
1. Check backend API is connected:
   ```python
   oasis.get_system_status()
   ```

2. Verify child ID exists in database
3. Check curriculum is assigned to child

**Problem**: "Progress not saving"

**Solutions**:
1. Verify session is active
2. Check database connection
3. Review Python backend logs

### Performance Issues

**Problem**: "Slow API responses"

**Solutions**:
1. Enable caching in Python
2. Reduce payload size (compress JSON)
3. Use connection pooling
4. Consider Redis for session storage

---

## Best Practices

### Error Handling

**Always handle errors gracefully**:

```csharp
StartCoroutine(bridge.GetCurriculumContent(
    onSuccess: (content) =>
    {
        // Success path
        DisplayContent(content);
    },
    onError: (error) =>
    {
        // Error path
        Debug.LogError($"Error: {error}");
        ShowErrorMessage("Failed to load activity. Please try again.");

        // Fallback behavior
        LoadDefaultActivity();
    }
));
```

### Offline Support

**Implement graceful degradation**:

```csharp
void LoadActivity()
{
    if (OASISManager.Instance.IsConnected)
    {
        // Load from backend
        LoadOnlineActivity();
    }
    else
    {
        // Load cached content
        LoadOfflineActivity();
        ShowOfflineIndicator();
    }
}
```

### Progress Caching

**Cache progress locally, sync when connected**:

```csharp
void SaveProgress(ProgressData progress)
{
    // Save locally first
    LocalStorage.SaveProgress(progress);

    // Try to sync with backend
    if (OASISManager.Instance.IsConnected)
    {
        StartCoroutine(SyncProgress(progress));
    }
    else
    {
        // Queue for later sync
        ProgressQueue.Enqueue(progress);
    }
}
```

---

## Next Steps

1. ✅ Integration guide complete
2. ➡️ Implement WebSocket support in Unity
3. ➡️ Add offline caching
4. ➡️ Create production deployment scripts
5. ➡️ Add comprehensive error handling

---

*Last Updated: October 9, 2025*
*Unity Version: 2022.3 LTS*
*Python Version: 3.11+*
*API Version: 0.1.0*
