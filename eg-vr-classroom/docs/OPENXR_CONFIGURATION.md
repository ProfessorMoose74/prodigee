# OpenXR Configuration for Meta Quest 3

**Complete guide for configuring OpenXR in Unity for Quest development**

---

## What is OpenXR?

OpenXR is an open, royalty-free standard for VR and AR applications. It provides a unified API that works across multiple VR platforms (Quest, PSVR2, SteamVR, etc.).

**Benefits**:
- Write once, deploy to multiple VR platforms
- Better performance than legacy SDKs
- Future-proof (industry standard)
- Official support from Meta, Unity, and others

---

## Unity OpenXR Setup

### Step 1: Install OpenXR Packages

These should already be installed (see `Packages/manifest.json`), but to verify:

1. **Window** → **Package Manager**
2. Switch to **Unity Registry**
3. Search and verify these are installed:
   - ✅ **XR Plugin Management** (4.4.0+)
   - ✅ **OpenXR Plugin** (1.9.1+)
   - ✅ **XR Interaction Toolkit** (2.5.2+)

### Step 2: Enable OpenXR for Android

1. **Edit** → **Project Settings** → **XR Plug-in Management**
2. Click **Android tab** (robot icon)
3. Check ✅ **OpenXR**
4. Uncheck other plugins (Oculus, etc.) - we only need OpenXR

### Step 3: Configure OpenXR Settings

1. Under **XR Plug-in Management**, click **OpenXR**
2. You'll see separate settings for **Standalone** (Editor) and **Android** (Quest)

#### Android OpenXR Settings

**Render Mode**:
- ✅ **Single Pass Instanced** (recommended - best performance)
- Alternative: Multi-pass (better compatibility, lower performance)

**Depth Submission Mode**:
- ✅ **Depth 16-bit** or **Depth 24-bit**
- Improves visual quality, required for some effects

**Interaction Profiles** (Controller Support):
1. Click **+** button under "Interaction Profiles"
2. Add these profiles:
   - ✅ **Oculus Touch Controller Profile**
   - ✅ **Meta Quest Touch Pro Controller Profile** (if available)
   - ✅ **Hand Interaction Profile** (for hand tracking)

**OpenXR Feature Groups**:
1. Scroll down to "OpenXR Feature Groups"
2. Enable these features:
   - ✅ **Meta Quest Support** (REQUIRED for Quest)
   - ✅ **Hand Tracking Subsystem** (optional - enables hand tracking)
   - ✅ **Render Model Feature** (shows controller models)
   - ✅ **Eye Gaze Interaction** (optional - Quest 3 Pro)

---

## Meta Quest-Specific Features

### Meta Quest Support Feature

**What it does**:
- Enables Quest-specific optimizations
- Provides access to Meta platform features
- Required for Quest deployment

**Settings**:
- **Target Devices**:
  - ✅ Quest 3
  - ✅ Quest 2 (for compatibility)
  - ✅ Quest Pro (optional)

### Hand Tracking

**Enable hand tracking** (optional):

1. OpenXR Settings → **Hand Tracking Subsystem** → Enable
2. Project Settings → Player → Android → **Other Settings**
3. **Scripting Define Symbols**: Add `HAND_TRACKING_ENABLED`

**In code**:
```csharp
using UnityEngine.XR.Hands;

// Check if hands are tracked
if (HandTracking.GetHandIsTracked(Handedness.Left))
{
    // Hand is tracked
}
```

**Note**: Hand tracking requires permission in AndroidManifest.xml:
```xml
<uses-permission android:name="com.oculus.permission.HAND_TRACKING" />
<uses-feature android:name="oculus.software.handtracking" android:required="false" />
```

---

## Render Settings

### Graphics Settings

**Edit → Project Settings → Player → Android → Other Settings**:

**Rendering**:
- **Color Space**: ✅ **Linear** (required for VR)
- **Auto Graphics API**: ❌ Disable
- **Graphics APIs** (in order):
  1. ✅ **Vulkan** (best performance on Quest)
  2. ✅ **OpenGL ES3** (fallback)
- **Multithreaded Rendering**: ✅ Enable

**Rendering Path**:
- **Rendering Path**: Forward
- **Use GPU Skinning**: ✅ Enable
- **Graphics Jobs**: ✅ Enable (if supported)

### Quality Settings

**Edit → Project Settings → Quality**:

For **Android** platform:
- **Default**: Medium quality
- **VSync Count**: Don't Sync (Quest handles this)
- **Anti Aliasing**: 4x Multi Sampling
- **Anisotropic Textures**: Per Texture
- **Shadow Resolution**: Medium Resolution
- **Shadow Distance**: 50m (or less for classroom)

---

## OpenXR Validation

### OpenXR Project Validator

Unity includes a validation tool to check your OpenXR setup:

1. **Window** → **XR** → **OpenXR** → **Project Validation**
2. Review all warnings and errors
3. Click **Fix** on any issues

**Common issues**:
- ❌ Color Space not set to Linear
  - **Fix**: Project Settings → Player → Color Space = Linear

- ❌ Graphics API includes DX11
  - **Fix**: Remove DX11, use only Vulkan/OpenGL ES3

- ❌ Multiple XR plugins enabled
  - **Fix**: Disable Oculus plugin, use only OpenXR

### Runtime Debugging

**Enable OpenXR debugging**:

1. OpenXR Settings → **OpenXR Runtime**
2. Check ✅ **Enable Debug Logs**
3. Console will show detailed XR events:
   ```
   [OpenXR] Session state changed: Ready → Synchronized
   [OpenXR] Session state changed: Synchronized → Visible
   [OpenXR] Session state changed: Visible → Focused
   ```

---

## Controller Mapping

### Meta Quest 3 Controllers

**Input mapping** (Oculus Touch Controller Profile):

**Right Controller**:
- **Trigger** (index finger): `trigger`
- **Grip** (middle fingers): `grip`
- **Thumbstick**: `primary2DAxis`
- **A Button**: `primaryButton`
- **B Button**: `secondaryButton`
- **Thumbstick Click**: `primary2DAxisClick`

**Left Controller**:
- **Trigger**: `trigger`
- **Grip**: `grip`
- **Thumbstick**: `primary2DAxis`
- **X Button**: `primaryButton`
- **Y Button**: `secondaryButton`
- **Thumbstick Click**: `primary2DAxisClick`

**Both Controllers**:
- **Menu Button** (left controller): `menuButton`
- **Oculus Button** (right controller): System-level, not accessible

### Input Actions (New Input System)

Create Input Actions for VR:

1. **Assets** → **Create** → **Input Actions**
2. Name it `VR_InputActions`
3. Add Action Maps:

**Action Map: VR**:
- **Move** (Vector2): Left Thumbstick
- **Turn** (Vector2): Right Thumbstick
- **Select** (Button): Right Trigger
- **Grab** (Button): Right Grip
- **Menu** (Button): Left Menu Button

**Binding**:
```
Action: Select
Binding: XR Controller (Right Hand) → Trigger
```

---

## Performance Optimization for OpenXR

### Fixed Foveated Rendering (FFR)

Quest 3 supports FFR (renders center of view at higher resolution):

**Enable in code**:
```csharp
using Unity.XR.Oculus;

// Set FFR level (0 = off, 3 = max)
OculusSettings.SetFoveationLevel(2);  // Level 2 recommended
```

**Settings**:
- **Level 0**: Off (highest quality)
- **Level 1**: Low (subtle, ~10% performance gain)
- **Level 2**: Medium (balanced, ~20% gain) ⭐ Recommended
- **Level 3**: High (noticeable, ~30% gain)

### Dynamic Resolution

Automatically adjust resolution to maintain frame rate:

```csharp
using UnityEngine.XR;

// Enable dynamic resolution
XRSettings.eyeTextureResolutionScale = 1.0f;  // Start at 100%
XRSettings.useOcclusionMesh = true;  // Cull hidden pixels
```

### Refresh Rate

Quest 3 supports 72Hz, 90Hz, and 120Hz:

**Set refresh rate**:
```csharp
using Unity.XR.Oculus;

// Request 90 Hz (default, balanced)
OculusSettings.SetDisplayFrequency(90.0f);

// Or request 120 Hz (higher performance requirement)
// OculusSettings.SetDisplayFrequency(120.0f);
```

**Recommendation**: Start with 90 Hz, only use 120 Hz if hitting performance targets.

---

## Building for Quest 3

### Build Settings

**File → Build Settings**:

1. **Platform**: Android
2. **Texture Compression**: ASTC
3. **Build System**: Gradle
4. **Development Build**: ✅ (for testing)
5. **Compression Method**: LZ4 (faster) or LZ4HC (smaller)

### Android Manifest

Create custom manifest if needed:

**Location**: `Assets/Plugins/Android/AndroidManifest.xml`

**Required permissions**:
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

  <!-- Quest-specific -->
  <uses-feature android:name="android.hardware.vr.headtracking" android:version="1" android:required="true" />
  <uses-feature android:name="oculus.software.overlay_keyboard" android:required="false" />

  <!-- Hand tracking (optional) -->
  <uses-permission android:name="com.oculus.permission.HAND_TRACKING" />
  <uses-feature android:name="oculus.software.handtracking" android:required="false" />

  <application>
    <meta-data android:name="com.unity.xr.openxr.quest" android:value="true" />

    <!-- Enable passthrough (optional) -->
    <meta-data android:name="com.oculus.supportedDevices" android:value="quest|quest2|quest3|questpro" />
  </application>

</manifest>
```

---

## Testing in Unity Editor

### XR Device Simulator

Test VR without a headset:

1. **Window** → **Package Manager**
2. Search: **XR Device Simulator**
3. **Install**

**Using the simulator**:
1. **Window** → **XR** → **XR Device Simulator**
2. Click **Play** in Unity
3. Use keyboard/mouse to simulate VR:
   - **Mouse**: Head rotation
   - **WASD**: Move head position
   - **Q/E**: Switch hands
   - **Space + Mouse**: Trigger
   - **Ctrl + Mouse**: Grip
   - **Tab**: Toggle hand/device mode

---

## Troubleshooting

### "OpenXR failed to initialize"

**Causes**:
- No VR headset connected (if testing on device)
- Wrong build platform (use Android for Quest)
- Conflicting XR plugins

**Solutions**:
1. Disable all XR plugins except OpenXR
2. Restart Unity
3. Re-enable OpenXR
4. Run Project Validator (Window → XR → OpenXR → Project Validation)

### Black screen in headset

**Causes**:
- Rendering at wrong eye resolution
- Graphics API incompatibility
- Camera setup incorrect

**Solutions**:
1. Check Graphics API is Vulkan or OpenGL ES3
2. Verify Camera is part of XR Origin
3. Set Camera Clear Flags to Skybox (not Solid Color)
4. Check Quality Settings → VSync = Don't Sync

### Controllers not working

**Causes**:
- Interaction Profile not added
- Input System not configured
- XR Interaction Toolkit not set up

**Solutions**:
1. OpenXR Settings → Add Oculus Touch Controller Profile
2. Ensure XR Interaction Toolkit is installed
3. Add XR Controller components to hand objects
4. Check Input Actions are bound correctly

### Performance issues

**Solutions**:
1. Enable Fixed Foveated Rendering (Level 2)
2. Reduce draw calls (< 100)
3. Use Single Pass Instanced rendering
4. Enable occlusion culling
5. Optimize textures (use ASTC compression)
6. Profile with Unity Profiler

---

## Additional Resources

### Official Documentation

- **Unity OpenXR Manual**: https://docs.unity3d.com/Packages/com.unity.xr.openxr@latest
- **Meta Quest Development**: https://developer.oculus.com/documentation/unity/
- **OpenXR Specification**: https://www.khronos.org/openxr/

### Useful Tools

- **Meta Quest Developer Hub**: Device management, debugging
- **RenderDoc**: Graphics debugging
- **Unity Profiler**: Performance analysis
- **Oculus ADB Driver**: Device connection

---

*Last Updated: October 9, 2025*
*Unity Version: 2022.3 LTS*
*OpenXR Plugin: 1.9.1+*
*Target: Meta Quest 3*
