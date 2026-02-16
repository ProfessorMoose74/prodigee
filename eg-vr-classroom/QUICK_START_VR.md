# Quick Start - VR Development

**Get up and running with VR development in 15 minutes**

---

## Step 1: Start Python Backend (2 minutes)

```bash
# Navigate to project
cd C:\Users\rober\Git\eg-vr-classroom

# Activate environment
venv\Scripts\activate

# Start VR API server
python scripts/start_vr_api_server.py
```

**Expected output**:
```
============================================================
🎮 EG OASIS VR API Server
============================================================
...
🚀 VR API Server Running
============================================================
📡 Endpoints available at:
   http://localhost:5000/api/vr/...
```

**Leave this running!**

---

## Step 2: Install Unity (One-time, 30 minutes)

**If you already have Unity 2022.3 LTS, skip to Step 3**

1. Download Unity Hub: https://unity.com/download
2. Install Unity Hub
3. In Unity Hub:
   - Click **Installs** → **Install Editor**
   - Select **Unity 2022.3.x LTS**
   - **Add Modules**:
     - ✅ Android Build Support
     - ✅ Android SDK & NDK Tools
     - ✅ OpenJDK
   - Click **Install** (takes ~20 minutes)

---

## Step 3: Open Unity Project (5 minutes)

1. Launch **Unity Hub**
2. Click **Projects** tab
3. Click **Add** → **Add project from disk**
4. Navigate to: `C:\Users\rober\Git\eg-vr-classroom\unity-project`
5. Click **Add Project**
6. Click project name to open

**First open takes 5-10 minutes** (importing packages)

---

## Step 4: Explore the Project (5 minutes)

In Unity Editor:

1. **Project window** → `Assets/Scripts/`
   - `OASISManager.cs` - Main VR manager
   - `PythonBridge.cs` - Backend communication
   - `VRSessionController.cs` - Session control
   - `VRInputHandler.cs` - Quest controllers

2. **Verify packages**:
   - Window → Package Manager
   - Switch to "In Project"
   - Confirm: OpenXR, XR Interaction Toolkit, Input System

3. **Check configuration**:
   - Edit → Project Settings → XR Plug-in Management
   - Android tab should show OpenXR enabled

---

## Step 5: Test Integration (3 minutes)

1. **Create test scene**:
   - File → New Scene
   - Save as `Assets/Scenes/TestScene.unity`

2. **Add OASIS Manager**:
   - Right-click Hierarchy → Create Empty
   - Name it "OASIS Manager"
   - Add Component → OASIS Manager
   - In Inspector:
     - Python Backend URL: `http://localhost:5000`
     - WebSocket URL: `ws://localhost:8765`
     - Debug Mode: ✅

3. **Click Play**:
   - Check Console for logs:
     ```
     [OASIS] Initializing OASIS Manager...
     [OASIS] Starting VR subsystem...
     [PythonBridge] Connecting to Python backend...
     ```

**If you see these logs, integration works!** ✅

---

## Next Steps

### Immediate (Today)

**Read documentation**:
1. `docs/PHASE2_VR_FOUNDATION.md` - What was built
2. `unity-project/README.md` - Unity project guide
3. `docs/CLASSROOM_DESIGN.md` - Classroom design

### This Week

**Build first classroom**:
1. Create classroom geometry
2. Add basic furniture
3. Implement teleportation
4. Make blackboard interactive

**Follow**: `docs/CLASSROOM_DESIGN.md` → Implementation Plan

### When Quest 3 Arrives

**Deploy to hardware**:
1. Enable Developer Mode on Quest
2. Connect USB cable
3. File → Build Settings → Build and Run
4. Test on actual headset

**Follow**: `docs/VR_SETUP_GUIDE.md` → Deployment

---

## Troubleshooting

### Python Backend Won't Start

**Error**: "Module not found"
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

**Error**: "Port 5000 already in use"
```bash
# Kill process on port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <process_id> /F
```

### Unity Won't Open Project

**Issue**: "Version mismatch"
- Ensure Unity 2022.3 LTS is installed
- Not 2021.x or 2023.x - must be 2022.3

**Issue**: "Import failed"
- Delete `Library` folder in unity-project
- Reopen project in Unity Hub

### Can't Connect to Backend

**Issue**: Unity shows connection error
- Check Python server is running
- Verify URL is `http://localhost:5000` (not https)
- Check firewall isn't blocking port 5000

---

## Quick Commands Reference

**Python**:
```bash
# Start VR API server
python scripts/start_vr_api_server.py

# Run integration demo (all services)
python scripts/demo_oasis_integration.py

# Check system status
curl http://localhost:5000/api/vr/status
```

**Unity**:
```
# Open project
Unity Hub → Projects → unity-project

# Build for Quest
File → Build Settings → Android → Build and Run

# Project Validator
Window → XR → OpenXR → Project Validation
```

---

## File Locations

**Unity Project**: `C:\Users\rober\Git\eg-vr-classroom\unity-project`

**Python Backend**: `C:\Users\rober\Git\eg-vr-classroom`

**Documentation**: `C:\Users\rober\Git\eg-vr-classroom\docs`

**Scripts**:
- Unity: `unity-project/Assets/Scripts/`
- Python: `src/`

---

## Getting Help

**Documentation**:
- `START_HERE.md` - Project overview
- `docs/PHASE2_VR_FOUNDATION.md` - Status report
- `docs/VR_SETUP_GUIDE.md` - Detailed Unity setup
- `docs/VR_INTEGRATION_GUIDE.md` - Unity-Python integration

**Check Logs**:
- Python: Console output
- Unity: Console window (Window → General → Console)

**Common Issues**:
- See `docs/VR_SETUP_GUIDE.md` → Troubleshooting
- See `docs/VR_INTEGRATION_GUIDE.md` → Troubleshooting

---

## You're All Set! 🎉

**What you have**:
- ✅ Unity VR project ready to build in
- ✅ Python backend running with VR API
- ✅ Full documentation
- ✅ Clear roadmap to first classroom

**Next**: Start building the 1920s classroom in Unity!

---

*Last Updated: October 9, 2025*
*Quick Start Guide for Project EGO VR Development*
