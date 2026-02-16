# EG OASIS VR Classroom - Unity Project

**Meta Quest 3 VR Application for Elemental Genius OASIS**

---

## Project Structure

```
unity-project/
├── Assets/
│   ├── Scenes/           # VR classroom scenes
│   ├── Scripts/          # C# scripts
│   │   ├── OASISManager.cs         # Main manager
│   │   ├── PythonBridge.cs         # Backend communication
│   │   ├── VRSessionController.cs  # Session management
│   │   └── VRInputHandler.cs       # VR input handling
│   ├── Prefabs/          # Reusable GameObjects
│   ├── Materials/        # Materials and shaders
│   ├── Models/           # 3D models
│   ├── Audio/            # Sound effects and music
│   └── Resources/        # Runtime-loaded assets
├── Packages/
│   └── manifest.json     # Unity package dependencies
└── ProjectSettings/      # Unity project settings
```

---

## Required Unity Version

**Unity 2022.3 LTS** (Long Term Support)

Download from: https://unity.com/releases/lts

---

## Required Packages

The following packages are configured in `Packages/manifest.json`:

- **XR Plugin Management** (4.4.0) - XR system management
- **OpenXR Plugin** (1.9.1) - OpenXR support for Quest
- **XR Interaction Toolkit** (2.5.2) - VR interactions
- **Input System** (1.7.0) - New input system
- **TextMeshPro** (3.0.6) - Text rendering
- **Newtonsoft Json** (3.2.1) - JSON serialization

---

## Setup Instructions

### 1. Install Unity 2022.3 LTS

1. Download Unity Hub from https://unity.com/download
2. Install Unity 2022.3 LTS from the Unity Hub
3. Make sure to include:
   - Android Build Support
   - Android SDK & NDK Tools
   - OpenJDK

### 2. Open Project

1. Open Unity Hub
2. Click "Add" → "Add project from disk"
3. Navigate to `C:\Users\rober\Git\eg-vr-classroom\unity-project`
4. Select the folder and click "Open"
5. Unity will import all packages (may take 5-10 minutes first time)

### 3. Configure Build Settings

1. File → Build Settings
2. Switch platform to **Android**
3. Set Texture Compression to **ASTC**
4. Click "Switch Platform"

### 4. Configure XR Settings

1. Edit → Project Settings → XR Plug-in Management
2. Enable **OpenXR** for Android
3. In OpenXR settings:
   - Add "Oculus Touch Controller Profile"
   - Add "Meta Quest Support"
   - Set **Render Mode** to "Multi-pass" or "Single Pass Instanced"

### 5. Configure Player Settings

1. Edit → Project Settings → Player
2. Android tab:
   - **Company Name**: Elemental Genius
   - **Product Name**: EG OASIS VR Classroom
   - **Minimum API Level**: Android 10.0 (API 29)
   - **Target API Level**: Android 13.0 (API 33)

3. Other Settings:
   - **Color Space**: Linear
   - **Graphics API**: OpenGL ES3 or Vulkan
   - **Scripting Backend**: IL2CPP
   - **Target Architectures**: ARM64

---

## Python Backend Connection

The Unity project connects to the Python backend services via HTTP REST API and WebSocket.

### Configuration

Edit these settings in the Unity Editor:
1. Find **OASISManager** GameObject in the scene
2. Inspector → OASIS Manager component:
   - **Python Backend URL**: `http://localhost:5000`
   - **WebSocket URL**: `ws://localhost:8765`

### Connection Flow

```
Unity App → HTTP REST → Python Backend → Database
          → WebSocket → Real-time updates
```

---

## Core Scripts

### OASISManager.cs
Main singleton manager that orchestrates the VR experience.

**Key Methods:**
- `StartVR()` - Initialize VR subsystem
- `StartChildSession(parentToken, childId, childName)` - Start authenticated session
- `StopSession()` - End current session

**Usage:**
```csharp
// Start VR
OASISManager.Instance.StartVR();

// Start child session
StartCoroutine(OASISManager.Instance.StartChildSession(
    "parent_jwt_token",
    1,
    "Alice"
));

// Check if connected
if (OASISManager.Instance.IsConnected)
{
    Debug.Log("Connected to backend!");
}
```

### PythonBridge.cs
Handles all communication with Python backend services.

**Key Methods:**
- `ConnectToBackend()` - Connect and authenticate
- `GetCurriculumContent()` - Fetch curriculum for child
- `SubmitProgress()` - Submit activity progress
- `TranslateText()` - Translate text to child's language
- `GetModel()` - Load 3D model from library

**Usage:**
```csharp
var bridge = GetComponent<PythonBridge>();

// Get curriculum
StartCoroutine(bridge.GetCurriculumContent(
    onSuccess: (content) => {
        Debug.Log($"Activity: {content.title}");
    },
    onError: (error) => {
        Debug.LogError(error);
    }
));

// Submit progress
StartCoroutine(bridge.SubmitProgress(
    activityId: 1,
    completed: true,
    score: 0.95f,
    onComplete: (success) => {
        Debug.Log($"Progress submitted: {success}");
    }
));
```

### VRSessionController.cs
Manages VR session state and COPPA-compliant safety features.

**Features:**
- 30-minute session time limit (configurable by age)
- 5-minute warning before timeout
- Emergency stop (ESC key)
- Session duration tracking

**Events:**
- `OnSessionStarted` - Session begins
- `OnSessionEnded` - Session ends normally
- `OnSessionWarning` - Time warning
- `OnEmergencyStop` - Emergency stop activated

**Usage:**
```csharp
var sessionController = GetComponent<VRSessionController>();

// Subscribe to events
sessionController.OnSessionWarning += () => {
    Debug.Log("5 minutes remaining!");
    ShowWarningUI();
};

// Start session
sessionController.StartSession();

// Get session info
string info = sessionController.GetSessionInfo();
```

### VRInputHandler.cs
Manages VR controller input and interactions.

**Supported Inputs:**
- Trigger (index finger)
- Grip (middle fingers)
- Thumbstick (2D axis)
- Primary/Secondary buttons (A/B, X/Y)
- Haptic feedback

**Events:**
- `OnTriggerPressed/Released`
- `OnGripPressed/Released`
- `OnThumbstickMoved`
- `OnPrimaryButtonPressed`

**Usage:**
```csharp
var inputHandler = GetComponent<VRInputHandler>();

// Subscribe to trigger events
inputHandler.OnTriggerPressed += (node) => {
    if (node == XRNode.RightHand)
    {
        Debug.Log("Right trigger pressed!");
        PerformAction();
    }
};

// Trigger haptic feedback
inputHandler.TriggerHaptic(
    XRNode.RightHand,
    amplitude: 0.5f,
    duration: 0.1f
);
```

---

## Building for Meta Quest 3

### Prerequisites
1. Enable Developer Mode on your Quest 3:
   - Install Meta Quest Developer Hub (https://developer.oculus.com/downloads/)
   - Enable Developer Mode in the Meta Quest app

2. Install ADB drivers:
   - Included with Unity Android Build Support
   - Or download from Android SDK Platform Tools

### Build Process

1. **Connect Quest 3**:
   - Connect via USB-C cable
   - Allow USB debugging on headset

2. **Build and Run**:
   - File → Build Settings
   - Select Android platform
   - Click "Build and Run"
   - Save APK file
   - Unity will deploy to headset automatically

3. **Manual Installation**:
   ```bash
   # Build APK first
   # Then install via ADB
   adb install EG_OASIS_VR.apk
   ```

---

## Testing Without Hardware

### Unity Editor Play Mode

1. Click Play button in Unity Editor
2. Use keyboard/mouse to simulate VR:
   - **WASD** - Move camera
   - **Mouse** - Look around
   - **Left Click** - Trigger
   - **Right Click** - Grip
   - **ESC** - Emergency stop

### XR Device Simulator

The XR Interaction Toolkit includes a Device Simulator:

1. Window → XR → XR Device Simulator
2. Use keyboard/mouse to control virtual hands
3. See full controls in simulator window

---

## Performance Optimization (Quest 3)

**Target**: 90 FPS minimum (Quest 3 supports up to 120 FPS)

### Optimization Checklist

- [ ] Use ASTC texture compression
- [ ] Limit draw calls (< 100 per frame)
- [ ] Use occlusion culling
- [ ] Bake lighting when possible
- [ ] Use LOD (Level of Detail) for models
- [ ] Keep vertex count low (< 50k per scene)
- [ ] Use object pooling for frequent spawns
- [ ] Profile with Unity Profiler regularly

### Quest 3 Specifications

- **CPU**: Snapdragon XR2 Gen 2
- **RAM**: 8GB
- **Display**: 2064 x 2208 per eye @ 90/120 Hz
- **Storage**: 128GB / 512GB

---

## Integration with Python Backend

### Starting a Session

```csharp
using EG.OASIS;

public class GameStart : MonoBehaviour
{
    void Start()
    {
        // Initialize OASIS
        OASISManager.Instance.StartVR();

        // Start child session
        StartCoroutine(OASISManager.Instance.StartChildSession(
            parentToken: "eyJ0eXAiOiJKV1QiLCJhbGc...",
            childId: 123,
            childName: "Alice"
        ));
    }
}
```

### Loading Curriculum

```csharp
using EG.OASIS;

public class CurriculumLoader : MonoBehaviour
{
    void LoadCurrentLesson()
    {
        var bridge = FindObjectOfType<PythonBridge>();

        StartCoroutine(bridge.GetCurriculumContent(
            onSuccess: (content) => {
                // Load activity based on content type
                switch (content.content_type)
                {
                    case "phonemic_awareness":
                        LoadPhonemicActivity(content);
                        break;
                    case "reading":
                        LoadReadingActivity(content);
                        break;
                }
            },
            onError: (error) => {
                Debug.LogError($"Failed to load curriculum: {error}");
            }
        ));
    }
}
```

### Submitting Progress

```csharp
using EG.OASIS;

public class ActivityController : MonoBehaviour
{
    void OnActivityComplete(int activityId, float score)
    {
        var bridge = FindObjectOfType<PythonBridge>();

        StartCoroutine(bridge.SubmitProgress(
            activityId: activityId,
            completed: true,
            score: score,
            onComplete: (success) => {
                if (success)
                {
                    Debug.Log("Progress saved!");
                    LoadNextActivity();
                }
            }
        ));
    }
}
```

---

## Debugging

### Enable Debug Mode

In OASISManager Inspector:
- Check **Debug Mode**

This will show detailed logs:
```
[OASIS] Initializing OASIS Manager...
[OASIS] Starting VR subsystem...
[PythonBridge] Connecting to Python backend...
[PythonBridge] Connected successfully - Session ID: abc123
[VRSession] Starting VR session
```

### Common Issues

**VR not initializing:**
- Check XR Plug-in Management is enabled
- Verify OpenXR is selected for Android
- Restart Unity Editor

**Backend connection fails:**
- Check Python backend is running (`python scripts/demo_oasis_integration.py`)
- Verify URL is correct in OASISManager
- Check firewall settings

**Controllers not working:**
- Verify XR Interaction Toolkit is installed
- Check Input System package is active
- Restart headset

---

## Next Steps

1. **Create Main Classroom Scene** (see `docs/CLASSROOM_DESIGN.md`)
2. **Implement Professor Al character**
3. **Add first Heggerty phonemic activity**
4. **Test on Meta Quest 3 when hardware arrives**

---

## Resources

- **Unity XR Documentation**: https://docs.unity3d.com/Manual/XR.html
- **Meta Quest Development**: https://developer.oculus.com/documentation/unity/
- **OpenXR Specification**: https://www.khronos.org/openxr/
- **XR Interaction Toolkit**: https://docs.unity3d.com/Packages/com.unity.xr.interaction.toolkit@latest

---

*Last Updated: October 9, 2025*
*Unity Version: 2022.3 LTS*
*Target Platform: Meta Quest 3*
