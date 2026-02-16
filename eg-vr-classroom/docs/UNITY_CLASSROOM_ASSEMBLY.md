# Unity Classroom Assembly Guide

**Step-by-step guide for building the VR classroom in Unity**

---

## Prerequisites

- Unity 2022.3 LTS installed
- Project opened in Unity Hub
- All scripts compiled without errors

---

## Quick Summary

We've created 7 core scripts for the classroom:

1. **ClassroomManager.cs** - Central classroom controller
2. **Blackboard.cs** - Interactive teaching blackboard
3. **StudentDesk.cs** - Individual desks with storage
4. **Door.cs** - Opening/closing door
5. **TeleportationManager.cs** - VR locomotion
6. **OASISManager.cs** - Backend integration
7. **VRInputHandler.cs** - Controller input

---

## Part 1: Scene Setup (15 minutes)

### Step 1: Open Scene

1. In Unity, open `Assets/Scenes/MainClassroom.unity`
2. You should see an empty scene with:
   - Main Camera
   - Directional Light

### Step 2: Create Classroom Structure

**Create parent object**:
1. Right-click Hierarchy → Create Empty
2. Name it: "Classroom"
3. Position: (0, 0, 0)

**Add floor**:
1. Right-click "Classroom" → 3D Object → Plane
2. Name: "Floor"
3. Scale: (1, 1, 1.2) for 10m x 12m room
4. Position: (0, 0, 0)

**Add ceiling**:
1. Right-click "Classroom" → 3D Object → Plane
2. Name: "Ceiling"
3. Rotation: (180, 0, 0) to flip upside down
4. Position: (0, 4, 0) for 4m high ceiling
5. Scale: (1, 1, 1.2)

**Add walls**:
1. Create 4 cubes for walls:
   - **North Wall**: Scale (10, 4, 0.2), Position (0, 2, 6)
   - **South Wall**: Scale (10, 4, 0.2), Position (0, 2, -6)
   - **East Wall**: Scale (0.2, 4, 12), Position (5, 2, 0)
   - **West Wall**: Scale (0.2, 4, 12), Position (-5, 2, 0)

### Step 3: Add Lighting

**Configure Directional Light**:
1. Select "Directional Light" in Hierarchy
2. Rotation: (50, -30, 0) for morning sun angle
3. Intensity: 1
4. Color: Warm white (255, 244, 214)
5. Shadow Type: Soft Shadows

**Add ambient lighting**:
1. Window → Rendering → Lighting
2. Environment tab:
   - Skybox Material: Default
   - Sun Source: Directional Light
   - Environment Lighting: Skybox
   - Ambient Intensity: 1
3. Baked Lightmaps tab:
   - Lightmapper: Progressive GPU (faster)
   - Generate Lighting (will take 1-2 minutes first time)

---

## Part 2: Add Interactive Elements (20 minutes)

### Step 1: Create Blackboard

**Create blackboard GameObject**:
1. Right-click Classroom → Create Empty
2. Name: "Blackboard"
3. Position: (0, 1.5, 5.5) - front of classroom
4. Add Component → Box Collider
   - Size: (3, 2, 0.1)

**Add blackboard mesh**:
1. Right-click Blackboard → 3D Object → Cube
2. Name: "BlackboardMesh"
3. Scale: (3, 2, 0.05)
4. Position: (0, 0, 0) relative to parent

**Add Blackboard script**:
1. Select "Blackboard" GameObject
2. Add Component → Blackboard (script)
3. In Inspector:
   - Board Size: (3, 2)
   - Allow Drawing: ✅
   - Chalk Color: White
   - Chalk Thickness: 0.02

**Create text canvas**:
1. Right-click Blackboard → UI → Canvas
2. Name: "TextCanvas"
3. Canvas settings:
   - Render Mode: World Space
   - Width: 300, Height: 200
   - Scale: (0.01, 0.01, 0.01)
4. Add two Text - TextMeshPro objects:
   - "TitleText" (top)
   - "ContentText" (center)

**Assign references**:
1. Select Blackboard GameObject
2. Drag TextCanvas to "Text Canvas" field
3. Drag TitleText to "Title Text" field
4. Drag ContentText to "Content Text" field

### Step 2: Create Student Desks (15 desks)

**Create single desk**:
1. Right-click Classroom → Create Empty
2. Name: "StudentDesk_01"
3. Position: (-3, 0, 2) - back left of classroom

**Add desk mesh**:
1. Right-click StudentDesk_01 → 3D Object → Cube
2. Name: "DeskTop"
3. Scale: (0.8, 0.05, 0.6)
4. Position: (0, 0.7, 0)

**Add desk legs** (optional):
1. Create 4 small cubes as legs
2. Position at corners

**Add StudentDesk script**:
1. Select StudentDesk_01
2. Add Component → Student Desk (script)
3. In Inspector:
   - Desk Number: 1
   - Can Open: ✅
   - Open Angle: 60
   - Sit Height: 0.7

**Duplicate for all desks**:
1. Duplicate StudentDesk_01 14 times (Ctrl+D)
2. Arrange in 3 rows of 5:
   - Row 1 (back): Z = 2
   - Row 2 (middle): Z = 0
   - Row 3 (front): Z = -2
   - Spacing: 1.5m apart in X direction
3. Rename: StudentDesk_01 to StudentDesk_15
4. Update Desk Number field for each (1-15)

### Step 3: Create Door

**Create door GameObject**:
1. Right-click Classroom → Create Empty
2. Name: "ClassroomDoor"
3. Position: (0, 0, -6) - center of south wall

**Add door mesh**:
1. Right-click ClassroomDoor → 3D Object → Cube
2. Name: "DoorPanel"
3. Scale: (1, 2.2, 0.1)
4. Position: (0, 1.1, 0)

**Add Door script**:
1. Select ClassroomDoor
2. Add Component → Door (script)
3. In Inspector:
   - Open Angle: 90
   - Open Speed: 2
   - Auto Close: ✅
   - Auto Close Delay: 3

**Create door pivot**:
1. Right-click ClassroomDoor → Create Empty
2. Name: "DoorPivot"
3. Position: (-0.5, 0, 0) - left edge
4. Move DoorPanel to be child of DoorPivot
5. Assign DoorPivot to Door script "Door Pivot" field

---

## Part 3: Add VR Support (10 minutes)

### Step 1: Add XR Origin

**Delete Main Camera**:
1. Select "Main Camera" in Hierarchy
2. Delete (we'll use XR camera)

**Add XR Origin**:
1. Right-click Hierarchy → XR → XR Origin (VR)
2. This creates:
   - XR Origin (root)
   - Camera Offset
   - Main Camera (VR camera)
   - Left Controller
   - Right Controller

**Configure XR Origin**:
1. Select "XR Origin"
2. Position: (0, 0, -3) - start at back of classroom
3. XR Origin component:
   - Camera Floor Offset Object: Camera Offset
   - Camera Y Offset: 0
   - Origin Base GameObject: XR Origin

**Configure cameras**:
1. Select "Main Camera" (under XR Origin)
2. Clear Flags: Skybox
3. Culling Mask: Everything
4. Near: 0.1, Far: 100

### Step 2: Add OASIS Manager

**Create OASIS Manager**:
1. Right-click Hierarchy → Create Empty
2. Name: "OASIS Manager"
3. Don't Destroy On Load: (will be set by script)

**Add OASISManager script**:
1. Select "OASIS Manager"
2. Add Component → OASIS Manager
3. In Inspector:
   - Python Backend URL: `http://localhost:5000`
   - Websocket URL: `ws://localhost:8765`
   - VR Platform: `meta_quest_3`
   - Enable VR On Start: ✅
   - Debug Mode: ✅

### Step 3: Add Teleportation

**Create Teleportation Manager**:
1. Right-click Hierarchy → Create Empty
2. Name: "TeleportationManager"

**Add TeleportationManager script**:
1. Select "TeleportationManager"
2. Add Component → Teleportation Manager
3. In Inspector:
   - Max Teleport Distance: 10
   - Teleport Speed: 2
   - Use Vignette: ✅
   - Teleport Layer Mask: Default (floor)

**Create teleport reticle**:
1. Right-click TeleportationManager → 3D Object → Cylinder
2. Name: "TeleportReticle"
3. Scale: (0.5, 0.01, 0.5)
4. Disable (will be shown during teleport)
5. Assign to TeleportationManager "Teleport Reticle" field

**Add line renderer**:
1. Select TeleportationManager
2. Add Component → Line Renderer
3. Settings:
   - Width: 0.05
   - Positions: 2 elements
   - Material: Default-Line
4. Assign to "Teleport Line" field

**Make floor teleportable**:
1. Select "Floor" GameObject
2. Layer: Default (or create "Teleportable" layer)
3. Add Component → Box Collider (if not present)

---

## Part 4: Add Classroom Manager (5 minutes)

### Step 1: Create Classroom Manager

**Create manager GameObject**:
1. Right-click Hierarchy → Create Empty (under Classroom)
2. Name: "ClassroomManager"

**Add ClassroomManager script**:
1. Select "ClassroomManager"
2. Add Component → Classroom Manager
3. In Inspector, assign references:
   - Blackboard: Drag "Blackboard" GameObject
   - Student Desks: Click "+" 15 times, drag each desk
   - Classroom Door: Drag "ClassroomDoor"
   - Main Light: Drag "Directional Light"

**Configure**:
- Script will find elements automatically on Start()
- You can also manually assign references for faster startup

---

## Part 5: Test in Editor (Play Mode)

### Step 1: Enter Play Mode

1. Click **Play** button (top center)
2. You should see:
   - VR camera active
   - Classroom rendered
   - Console logs:
     ```
     [OASIS] Initializing OASIS Manager...
     [OASIS] Starting VR subsystem...
     [Classroom] Initializing 1920s schoolhouse...
     [Classroom] Initialized with 15 desks
     [Blackboard] Initialized
     [Teleport] Activated
     ```

### Step 2: Test Movement (Editor Mode)

**In Play mode**:
- **WASD**: Move camera
- **Mouse**: Look around
- **Q/E**: Rotate left/right

**Scene view controls**:
- Right-click + drag: Look around
- Middle mouse + drag: Pan
- Scroll: Zoom

### Step 3: Test Interactions (Inspector)

**Test blackboard**:
1. Select "Blackboard" in Hierarchy
2. In Inspector, find Blackboard script
3. Right-click on script → Context → Test commands

**Test classroom activities**:
1. Select "ClassroomManager"
2. Right-click script → "Test Start Activity"
3. Check Console for logs

### Step 4: Exit Play Mode

Click **Play** button again to exit

---

## Part 6: Materials & Visuals (15 minutes)

### Step 1: Create Materials

**Create materials folder**:
1. Project window → Assets → Right-click → Create → Folder
2. Name: "Materials"

**Create floor material**:
1. Right-click Materials → Create → Material
2. Name: "FloorWood"
3. Settings:
   - Shader: Standard
   - Albedo Color: Brown (139, 90, 43)
   - Metallic: 0
   - Smoothness: 0.3

**Create wall material**:
1. Create → Material
2. Name: "WallPaint"
3. Settings:
   - Albedo Color: Cream (245, 245, 220)
   - Smoothness: 0.2

**Create blackboard material**:
1. Create → Material
2. Name: "BlackboardSlate"
3. Settings:
   - Albedo Color: Dark gray (26, 26, 26)
   - Smoothness: 0.1

**Create desk material**:
1. Create → Material
2. Name: "DeskWood"
3. Settings:
   - Albedo Color: Medium brown (101, 67, 33)
   - Metallic: 0
   - Smoothness: 0.4

### Step 2: Apply Materials

**Apply to objects**:
1. Select "Floor" → Drag FloorWood material
2. Select all wall cubes → Drag WallPaint
3. Select "Ceiling" → Drag WallPaint
4. Select "BlackboardMesh" → Drag BlackboardSlate
5. Select all desk tops → Drag DeskWood

---

## Part 7: Build Settings (5 minutes)

### Step 1: Add Scene to Build

1. File → Build Settings
2. Click "Add Open Scenes"
3. MainClassroom.unity should appear in list
4. Scene index: 0

### Step 2: Configure Platform

**For testing in editor**:
- Platform: PC, Mac & Linux Standalone
- Target Platform: Windows (or your OS)

**For Quest deployment** (later):
- Platform: Android
- Texture Compression: ASTC
- (See VR_SETUP_GUIDE.md for full Quest setup)

---

## Part 8: Save & Test

### Step 1: Save Everything

1. **File → Save** (Ctrl+S)
2. **File → Save Project**

### Step 2: Final Test

1. Click **Play**
2. Verify:
   - ✅ Classroom renders correctly
   - ✅ All objects visible
   - ✅ No console errors
   - ✅ Can move around (WASD)
   - ✅ Materials applied
   - ✅ Lighting looks good

### Step 3: Test Interactions

**Test from Inspector** (while in Play mode):
1. Select Blackboard → Right-click script → Test methods
2. Select Door → Right-click script → Test Open/Close
3. Select Desks → Right-click script → Test interactions

---

## Troubleshooting

### Scripts won't compile

**Error**: "Type or namespace not found"
- **Fix**: Ensure all script files are in `Assets/Scripts/`
- **Fix**: Close and reopen Unity

### XR Origin not working

**Error**: "XR Rig not found"
- **Fix**: Window → Package Manager → XR Interaction Toolkit → Install
- **Fix**: XR Plugin Management must be enabled (Edit → Project Settings)

### Blackboard text not showing

**Issue**: TextMeshPro not visible
- **Fix**: Import TextMeshPro (Window → TextMeshPro → Import TMP Essentials)
- **Fix**: Check Canvas Render Mode is World Space
- **Fix**: Check Canvas scale is (0.01, 0.01, 0.01)

### Objects falling through floor

**Issue**: No colliders
- **Fix**: Add Box Collider to Floor GameObject
- **Fix**: Ensure Floor layer is in Teleport Layer Mask

### VR camera not moving

**Issue**: XR Origin position not updating
- **Fix**: Ensure XR Origin is at scene root (not nested)
- **Fix**: Check XR Plug-in Management is enabled for your platform

---

## Next Steps

### Immediate

1. **Add textures**: Import wood/slate textures for realism
2. **Add audio**: Import sound effects for door, chalk, etc.
3. **Add lighting**: Create pendant lights, window light shafts
4. **Test teleportation**: Add teleport anchors around classroom

### This Week

1. **Create windows**: Add transparent window panes
2. **Add props**: Bookshelf, globe, map, chalk tray
3. **Import characters**: Professor Al, Ella, Gus models
4. **First activity**: Connect to Python backend, load curriculum

### When Quest Arrives

1. **Build for Android**: Switch platform, configure Quest settings
2. **Deploy to Quest**: USB connection, Build and Run
3. **Test on hardware**: Performance, comfort, interactions
4. **Optimize**: Hit 90 FPS target

---

## Reference

### Keyboard Controls (Editor Testing)

- **WASD**: Move camera
- **Mouse**: Look around
- **Q/E**: Rotate
- **Shift**: Move faster
- **Ctrl**: Move slower
- **Right Click + Drag**: Free look

### Hierarchy Structure

```
Scene: MainClassroom
├── XR Origin (VR)
│   ├── Camera Offset
│   │   └── Main Camera
│   ├── Left Controller
│   └── Right Controller
├── Classroom
│   ├── Floor
│   ├── Ceiling
│   ├── Walls (4x)
│   ├── Blackboard
│   │   ├── BlackboardMesh
│   │   └── TextCanvas
│   ├── StudentDesk_01 to _15
│   ├── ClassroomDoor
│   │   └── DoorPivot
│   │       └── DoorPanel
│   └── ClassroomManager
├── OASIS Manager
├── TeleportationManager
│   ├── TeleportReticle
│   └── Line Renderer
└── Directional Light
```

---

## Tips

**Organization**:
- Use empty GameObjects as folders (Desks, Props, Characters)
- Name objects clearly (StudentDesk_01, not GameObject(1))
- Use prefabs for repeated objects (desks)

**Performance**:
- Keep polygon count low (< 50k total in scene)
- Use baked lighting (faster than real-time)
- Combine meshes where possible
- Use occlusion culling for large scenes

**Testing**:
- Test in Editor frequently (Play mode)
- Use Console for debugging (logs, errors)
- Use Gizmos to visualize positions (OnDrawGizmos)
- Profile with Unity Profiler (Window → Analysis → Profiler)

---

*Last Updated: October 9, 2025*
*For Unity 2022.3 LTS*
*VR Classroom Assembly Guide*
