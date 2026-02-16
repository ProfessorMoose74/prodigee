# VR Setup Guide - Meta Quest 3 Development

**Complete guide for setting up Unity VR development for Project EGO**

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Unity Installation](#unity-installation)
3. [Project Setup](#project-setup)
4. [Meta Quest 3 Configuration](#meta-quest-3-configuration)
5. [Testing Without Hardware](#testing-without-hardware)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Software Requirements

- **Windows 10/11** (64-bit) or **macOS 12+**
- **Unity Hub** (latest version)
- **Unity 2022.3 LTS**
- **Visual Studio 2022** or **Visual Studio Code**
- **Git** (for version control)
- **Meta Quest Developer Hub** (for Quest development)
- **Android SDK** (included with Unity Android Build Support)

### Hardware Requirements

**Development PC:**
- Intel i7 / AMD Ryzen 7 or better
- 16GB RAM minimum (32GB recommended)
- NVIDIA GTX 1070 / AMD RX 580 or better
- 50GB free disk space
- USB 3.0 port (for Quest connection)

**VR Headset:**
- Meta Quest 3 (primary target)
- Meta Quest 2 (secondary support)

### Accounts Needed

1. **Unity Account** (free) - https://id.unity.com/
2. **Meta Developer Account** (free) - https://developer.oculus.com/

---

## Unity Installation

### Step 1: Install Unity Hub

1. Download Unity Hub: https://unity.com/download
2. Run installer and follow prompts
3. Launch Unity Hub
4. Sign in with Unity account

### Step 2: Install Unity 2022.3 LTS

1. In Unity Hub, click **Installs** tab
2. Click **Install Editor**
3. Select **Unity 2022.3.x LTS** (latest patch)
4. Click **Next**

5. **Select Modules** (very important):
   - ✅ **Android Build Support**
     - ✅ Android SDK & NDK Tools
     - ✅ OpenJDK
   - ✅ **Documentation**
   - ✅ **Visual Studio** (if not already installed)
   - ✅ **WebGL Build Support** (optional, for web testing)

6. Accept licenses
7. Click **Install** (will take 15-30 minutes)

### Step 3: Verify Installation

1. In Unity Hub → Installs
2. Confirm Unity 2022.3.x appears with Android icon
3. Click gear icon → Verify installed modules

---

## Project Setup

### Step 1: Open Project in Unity

1. Launch Unity Hub
2. Click **Projects** tab
3. Click **Add** → **Add project from disk**
4. Navigate to: `C:\Users\rober\Git\eg-vr-classroom\unity-project`
5. Click **Add Project**
6. Unity will appear in project list
7. Click project name to open

**First-time open takes 5-10 minutes** while Unity:
- Imports packages
- Compiles scripts
- Generates library files
- Sets up XR configuration

### Step 2: Verify Package Installation

1. Window → Package Manager
2. Switch to **In Project** view
3. Verify these packages are installed:
   - ✅ XR Plugin Management
   - ✅ OpenXR Plugin
   - ✅ XR Interaction Toolkit
   - ✅ Input System
   - ✅ TextMeshPro
   - ✅ Newtonsoft Json

If any are missing:
1. Switch to **Unity Registry**
2. Search for package name
3. Click **Install**

### Step 3: Configure Input System

Unity may prompt about Input System:
- Select **Yes** to enable new Input System
- Unity will restart

Or manually enable:
1. Edit → Project Settings → Player
2. Other Settings → Configuration
3. **Active Input Handling**: Both (or New Input System)
4. Restart Unity

---

## Meta Quest 3 Configuration

### Step 1: Switch to Android Platform

1. File → Build Settings
2. Select **Android**
3. Click **Switch Platform** (takes 5-10 minutes first time)
4. Wait for platform switch to complete

### Step 2: Configure XR Settings

1. Edit → Project Settings
2. Select **XR Plug-in Management**

**If OpenXR is not available:**
1. Click **Install XR Plugin Management**
2. Wait for installation

3. **Android tab** (desktop icon):
   - ✅ Enable **OpenXR**
   - ⬜ Disable other plugins (Oculus, etc.)

4. Click **OpenXR** (under XR Plug-in Management)
5. **Interaction Profiles**:
   - Click **+** button
   - Add **Oculus Touch Controller Profile**
   - Add **Meta Quest Touch Pro Controller Profile** (if available)

6. **OpenXR Feature Groups**:
   - ✅ **Meta Quest Support**
   - ✅ **Hand Tracking** (optional)
   - ✅ **Render Model** (shows controllers)

7. **Render Mode**:
   - Select **Single Pass Instanced** (best performance)
   - Alternative: **Multi-pass** (better compatibility)

### Step 3: Configure Player Settings

1. Edit → Project Settings → Player
2. **Android tab**:

**Other Settings:**
- **Company Name**: Elemental Genius
- **Product Name**: EG OASIS VR Classroom
- **Package Name**: com.elementalgenius.oasisvr
- **Version**: 0.1.0
- **Bundle Version Code**: 1

**Rendering:**
- **Color Space**: Linear (required for VR)
- **Auto Graphics API**: Disable
- **Graphics APIs**:
  - Add **Vulkan** (top priority)
  - Add **OpenGL ES3** (fallback)
- **Multithreaded Rendering**: ✅ Enable

**Identification:**
- **Minimum API Level**: Android 10.0 (API 29)
- **Target API Level**: Android 13.0 (API 33)

**Configuration:**
- **Scripting Backend**: IL2CPP
- **API Compatibility Level**: .NET Standard 2.1
- **Target Architectures**: ✅ ARM64 only

**Optimization:**
- **Prebake Collision Meshes**: ✅
- **Keep Loaded Shaders Alive**: ✅
- **Preloaded Assets**: (leave empty for now)

### Step 4: Configure Quality Settings

1. Edit → Project Settings → Quality
2. Select **Medium** as default for Android
3. Click **Medium** quality level:
   - **VSync Count**: Don't Sync (Quest handles this)
   - **Anti Aliasing**: 4x Multi Sampling
   - **Texture Quality**: Full Res
   - **Shadow Resolution**: Medium Res

### Step 5: Configure Physics

1. Edit → Project Settings → Physics
2. **Fixed Timestep**: 0.0111 (90 FPS)
3. **Default Contact Offset**: 0.01
4. **Sleep Threshold**: 0.005

---

## Testing Without Hardware

### Option 1: Unity Editor Play Mode

1. Click **Play** button in Unity Editor
2. Scene view becomes game view
3. **Controls**:
   - **WASD**: Move
   - **Mouse**: Look around
   - **Left Click**: Right trigger
   - **Right Click**: Left trigger
   - **Shift + Mouse**: Rotate hands
   - **ESC**: Emergency stop

### Option 2: XR Device Simulator

More realistic VR testing in editor:

1. Window → Package Manager
2. Search: **XR Device Simulator**
3. Install package
4. Window → XR → XR Device Simulator
5. Dock simulator window
6. Click **Play**

**XR Simulator Controls:**
- **Mouse**: Head rotation
- **Q/E**: Left/right hand position
- **Tab**: Switch hands
- **Middle Mouse**: Grab/move hands
- **Scroll**: Move hands forward/back
- **Space + Mouse**: Trigger
- **Ctrl + Mouse**: Grip

### Option 3: Quest Link (Requires Quest)

Test on Quest while connected to PC:

1. Install Meta Quest PC app
2. Enable Quest Link in headset
3. Connect USB-C cable
4. Allow Quest Link in headset
5. In Unity: Play button → runs on Quest

---

## Deployment

### Option A: Build and Deploy (ADB)

**Prerequisites:**
- Quest 3 in Developer Mode
- USB Debugging enabled
- USB-C cable connected

**Steps:**
1. File → Build Settings
2. Ensure Android platform selected
3. Click **Refresh** next to **Run Device**
4. Select your Quest 3
5. Check **Development Build** (for testing)
6. Click **Build and Run**
7. Choose save location for APK
8. Unity builds and deploys automatically

**Install time**: 2-5 minutes

### Option B: Build APK (Manual Install)

1. File → Build Settings
2. Click **Build**
3. Save APK file
4. Install via ADB:
   ```bash
   adb install EG_OASIS_VR.apk
   ```
5. Or use SideQuest

### Option C: SideQuest

1. Install SideQuest: https://sidequestvr.com/
2. Connect Quest 3
3. Drag APK onto SideQuest window
4. App appears in **Unknown Sources**

---

## Meta Quest 3 Setup

### Enable Developer Mode

1. Install **Meta Quest mobile app**
2. Open app → Menu → Devices
3. Select your Quest 3
4. **Developer Mode** → Enable
5. You may need to create an organization in Meta Developer portal first

### Enable USB Debugging

1. Put on Quest 3 headset
2. Go to Settings → System → Developer
3. **USB Connection Dialog**: Enable
4. Connect to PC via USB-C
5. Allow USB debugging prompt

### Verify Connection

**On PC:**
```bash
adb devices
```

Should show:
```
List of devices attached
1WMHH1234567    device
```

---

## Creating Your First Scene

### Step 1: Create Main Classroom Scene

1. File → New Scene
2. Save as: `Assets/Scenes/MainClassroom.unity`

### Step 2: Add XR Origin

1. Right-click Hierarchy
2. XR → XR Origin (VR)
3. This creates:
   - XR Origin (root)
   - Camera Offset
   - Main Camera (VR camera)
   - Left/Right Controllers

### Step 3: Add OASIS Manager

1. Right-click Hierarchy
2. Create Empty → Name it "OASIS Manager"
3. Add Component → OASIS Manager script
4. Configure in Inspector:
   - **Python Backend URL**: http://localhost:5000
   - **WebSocket URL**: ws://localhost:8765
   - **VR Platform**: meta_quest_3
   - **Debug Mode**: ✅

### Step 4: Add Floor

1. Right-click Hierarchy
2. 3D Object → Plane
3. Name: "Floor"
4. Transform: Position (0, 0, 0), Scale (10, 1, 10)
5. Create Material for floor

### Step 5: Test in Editor

1. Click **Play**
2. Check Console for:
   ```
   [OASIS] Initializing OASIS Manager...
   [OASIS] Starting VR subsystem...
   ```
3. Should see VR camera active

---

## Performance Profiling

### Unity Profiler

1. Window → Analysis → Profiler
2. Click **Play** in editor
3. Monitor:
   - **CPU Usage**: < 11ms (90 FPS)
   - **Rendering**: < 8ms
   - **Scripts**: < 2ms
   - **Physics**: < 1ms

### Quest Performance Overlay

On Quest headset:
1. Enable Developer Runtime Features
2. Settings → System → Developer
3. **Performance Overlay**: Enable
4. Shows FPS, thermal, battery

**Target**: 90 FPS stable (green)
**Acceptable**: 72 FPS (yellow)
**Poor**: < 72 FPS (red)

---

## Troubleshooting

### "XR Management Not Found"

**Solution:**
1. Window → Package Manager
2. Unity Registry → Search "XR Plugin Management"
3. Install package
4. Restart Unity

### "Failed to Switch Platform to Android"

**Solution:**
1. Verify Android Build Support installed
2. Unity Hub → Installs → Gear icon → Add Modules
3. Install Android Build Support + SDK/NDK
4. Restart Unity

### "OpenXR Failed to Initialize"

**Solution:**
1. Edit → Project Settings → XR Plug-in Management
2. Disable OpenXR
3. Apply
4. Enable OpenXR
5. Apply
6. Restart Unity

### "ADB Device Not Found"

**Solution:**
1. Check USB cable (must be data cable, not charge-only)
2. Allow USB debugging on Quest
3. Restart ADB:
   ```bash
   adb kill-server
   adb start-server
   adb devices
   ```

### "Build Failed: Gradle Error"

**Solution:**
1. Close Unity
2. Delete `Library` folder in project
3. Reopen Unity
4. Let Unity reimport everything
5. Try build again

### Controllers Not Working in Editor

**Solution:**
- Editor simulation is limited
- Use XR Device Simulator
- Or test on actual Quest hardware

### App Crashes on Launch (Quest)

**Solution:**
1. Check Logcat:
   ```bash
   adb logcat -s Unity
   ```
2. Common issues:
   - Missing permissions in manifest
   - Graphics API mismatch
   - IL2CPP build errors

3. Try:
   - Clean build (delete `Build` folder)
   - Rebuild with "Development Build" enabled
   - Check Android log output

---

## Next Steps

1. ✅ Unity and project setup complete
2. ➡️ Create classroom environment (see `CLASSROOM_DESIGN.md`)
3. ➡️ Add VR interactions
4. ➡️ Integrate with Python backend
5. ➡️ Test on Quest 3 when hardware arrives

---

## Resources

### Official Documentation
- **Unity Manual**: https://docs.unity3d.com/Manual/
- **Unity XR**: https://docs.unity3d.com/Manual/XR.html
- **Meta Quest Development**: https://developer.oculus.com/documentation/unity/
- **OpenXR**: https://www.khronos.org/openxr/

### Tutorials
- **Unity Learn**: https://learn.unity.com/
- **Meta VR Development**: https://developer.oculus.com/learn/
- **XR Interaction Toolkit**: https://learn.unity.com/project/vr-beginner-the-escape-room

### Community
- **Unity Forum**: https://forum.unity.com/
- **Meta Developer Forum**: https://forums.oculusvr.com/
- **Reddit r/Unity3D**: https://reddit.com/r/Unity3D
- **Reddit r/OculusQuest**: https://reddit.com/r/OculusQuest

---

*Last Updated: October 9, 2025*
*Unity Version: 2022.3 LTS*
*Target: Meta Quest 3*
