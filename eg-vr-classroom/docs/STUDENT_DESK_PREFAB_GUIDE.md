# Student Desk Prefab Creation Guide

**Building the authentic 1920s school desk with ornate cast iron frame**

---

## Overview

This guide provides step-by-step instructions for creating the iconic student desk from 1920s American classrooms, featuring ornate cast iron legs and a wooden desktop with storage.

---

## Design Specifications

### Dimensions
- **Overall Width**: 60cm
- **Overall Depth**: 45cm
- **Overall Height**: 70cm (desktop), 40cm (seat)
- **Desktop Thickness**: 3cm
- **Seat Dimensions**: 35cm x 30cm

### Components
1. Desktop (wooden, hinged lid)
2. Cast iron frame (ornate scrollwork)
3. Attached wooden seat
4. Storage compartment
5. Inkwell hole

---

## Part 1: Simple Version (ProBuilder - 30 minutes)

**For quick prototyping without 3D modeling software**

### Step 1: Create Base Object

1. In Unity, right-click Hierarchy → Create Empty
2. Name: "StudentDesk_Prefab"
3. Position: (0, 0, 0)

### Step 2: Create Desktop

1. Right-click StudentDesk_Prefab → 3D Object → Cube
2. Name: "Desktop"
3. Scale: (0.6, 0.03, 0.45) - 60cm wide, 3cm thick, 45cm deep
4. Position: (0, 0.70, 0) - 70cm height

**Add details**:
1. Duplicate Desktop → Name: "DeskLid"
2. Position slightly above Desktop
3. Add HingeJoint component (for opening animation)

### Step 3: Create Desk Legs/Frame

**Option A: Simple box legs**:
1. Create 4 cubes for legs
2. Name: "LegFrontLeft", "LegFrontRight", "LegBackLeft", "LegBackRight"
3. Scale each: (0.05, 0.65, 0.05) - 5cm x 65cm
4. Positions:
   - Front Left: (-0.25, 0.35, 0.18)
   - Front Right: (0.25, 0.35, 0.18)
   - Back Left: (-0.25, 0.35, -0.18)
   - Back Right: (0.25, 0.35, -0.18)

**Option B: ProBuilder frame** (more authentic):
1. GameObject → 3D Object → ProBuilder → New Shape
2. Choose "Arch" or "Pipe" for curved frame
3. Customize to create side panels
4. Extrude/modify to add ornate details

### Step 4: Create Seat

1. Right-click StudentDesk_Prefab → 3D Object → Cube
2. Name: "Seat"
3. Scale: (0.35, 0.03, 0.30)
4. Position: (0.15, 0.40, -0.05) - Offset to side/back

**Add seat support**:
1. Create cube → Name: "SeatSupport"
2. Scale: (0.05, 0.35, 0.05)
3. Position: Connect seat to frame

### Step 5: Add Inkwell Hole

1. Create small cylinder → Name: "InkwellHole"
2. Scale: (0.05, 0.04, 0.05) - 5cm diameter
3. Position: Top right corner of desktop (0.23, 0.72, 0.18)
4. Material: Dark, recessed appearance

### Step 6: Create Storage Compartment

1. Under Desktop, create empty GameObject → Name: "StorageCompartment"
2. Add Box Collider (trigger)
3. Scale to fit under desktop
4. This is where items will be stored (invisible container)

### Step 7: Apply Materials

**Create materials**:
1. Project → Assets → Materials → Right-click → Create → Material

**Desk Wood Material**:
- Name: "DeskWood"
- Albedo: `#8B6914` (dark goldenrod)
- Metallic: 0
- Smoothness: 0.4
- Apply to: Desktop, DeskLid, Seat

**Cast Iron Material**:
- Name: "CastIron"
- Albedo: `#2C2C2C` (dark gray)
- Metallic: 0.6
- Smoothness: 0.3
- Apply to: Legs, Frame pieces

### Step 8: Add StudentDesk Script

1. Select StudentDesk_Prefab root object
2. Add Component → Student Desk (script)
3. Assign references:
   - Desk Lid Pivot: DeskLid
   - Seat Position: Seat transform
   - Desk Renderer: Desktop MeshRenderer
4. Configure:
   - Desk Number: 1
   - Can Open: ✅
   - Open Angle: 60

### Step 9: Save as Prefab

1. Drag StudentDesk_Prefab from Hierarchy to Project window
2. Create folder: Assets/Prefabs
3. Save as: "StudentDesk_Simple.prefab"

---

## Part 2: Detailed Version (External 3D Software)

**For authentic ornate cast iron frame - requires Blender/3D modeling**

### Blender Workflow

**Step 1: Desktop (Blender)**

1. Add Cube → Scale to (0.6, 0.03, 0.45)
2. Add subdivision for smooth edges
3. Bevel edges slightly
4. Add wood texture/material
5. Create hinged lid (duplicate, separate)

**Step 2: Cast Iron Frame (Blender)**

**Side Panels** (ornate scrollwork):
1. Start with plane → Extrude to create panel shape
2. Add decorative curves:
   - Use Bezier curves for scrollwork design
   - Convert curves to mesh
   - Join with panel
3. Add depth (Solidify modifier, 2cm thickness)
4. Mirror for opposite side

**Scrollwork Pattern Ideas**:
- Victorian spiral scrolls
- Heart or fleur-de-lis motifs
- Geometric patterns
- "School Furniture Co." text embossed

**Legs**:
1. Create curved legs (use Array + Curve modifiers)
2. Taper towards bottom
3. Add foot pads (small cylinders)

**Cross Braces**:
1. Connect front to back
2. Connect left to right
3. Add decorative elements at joints

**Step 3: Seat (Blender)**

1. Create seat platform (simple cube, beveled)
2. Optional: Add slight contour (subdivide, sculpt)
3. Create support bracket connecting to frame

**Step 4: Details (Blender)**

**Inkwell Hole**:
1. Boolean modifier to cut hole in desktop
2. Add inner cylinder for depth
3. Darken inside

**Desk Hardware**:
1. Hinges for lid (small cylinders + rectangles)
2. Latch/lock (optional)
3. Bolts/rivets on metal frame (tiny cylinders)

**Step 5: UV Unwrap & Texturing (Blender)**

**Wood Parts**:
1. Smart UV unwrap
2. Apply wood texture (seamless)
3. Add wear/scratch details
4. Export with texture

**Metal Parts**:
1. Smart UV unwrap
2. Metal texture (dark iron)
3. Add rust/patina in texture
4. Optional: Worn edges (lighter color)

**Step 6: Export from Blender**

1. Select all desk components
2. File → Export → FBX (.fbx)
   - Scale: 1.0
   - Forward: -Z Forward
   - Up: Y Up
   - Apply Transform: ✅
3. Save as: "StudentDesk_Detailed.fbx"

OR

1. File → Export → glTF 2.0 (.glb)
   - Format: GLB
   - Include: Selected Objects
2. Save as: "StudentDesk_Detailed.glb"

### Unity Import

**Step 1: Import Model**

1. Drag FBX/GLB into Unity Project window
2. Assets → Models folder
3. Select model in Project
4. Inspector → Model tab:
   - Scale Factor: 1
   - Mesh Compression: Off (for VR quality)
   - Read/Write Enabled: ✅
   - Optimize Mesh: ✅
   - Generate Colliders: Optional
5. Click Apply

**Step 2: Configure Materials**

1. Extract Materials (if needed)
2. Apply textures to materials
3. Configure for VR:
   - Use Mobile/Diffuse shader OR Standard
   - Texture compression: ASTC
   - Max texture size: 2048

**Step 3: Create Prefab**

1. Drag model into scene
2. Add StudentDesk script
3. Configure colliders (for interaction)
4. Test opening/closing
5. Save as prefab

---

## Part 3: Asset Store Option

**Quick solution if modeling isn't desired**

### Recommended Asset Packs

Search Unity Asset Store for:
- "Vintage school desk"
- "1920s furniture"
- "Antique classroom"
- "Victorian school"

**Good options**:
- Individual desk models (free or paid)
- Classroom furniture packs
- Historical furniture collections

**After Import**:
1. Import asset package
2. Find desk model in Project
3. Drag into scene
4. Add StudentDesk script
5. Configure as needed
6. Create prefab variant

---

## Part 4: Collision & Interaction Setup

### Colliders

**Desktop Collider**:
1. Select Desktop object
2. Add Component → Box Collider
3. Size: Match desktop dimensions
4. Is Trigger: ❌

**Seat Collider**:
1. Select Seat object
2. Add Component → Box Collider
3. Size: Match seat dimensions
4. Is Trigger: ✅ (for sitting detection)

**Frame Collider**:
1. Optional: Add colliders to frame
2. Or use simplified collision (box)

**Interaction Collider**:
1. Add child object → Name: "InteractionTrigger"
2. Add Sphere Collider
3. Radius: 1.0m (interaction distance)
4. Is Trigger: ✅
5. Add script to detect player proximity

### Layers

1. Create layer: "Furniture"
2. Assign desk to Furniture layer
3. Configure collision matrix:
   - Furniture vs Player: Collide
   - Furniture vs Teleport: Ignore
   - Furniture vs Furniture: Collide

---

## Part 5: Variations

### Create Desk Variations

**Different desk numbers**:
1. Duplicate base prefab
2. Change desk number in script (1-15)
3. Save as variants

**Wear variations**:
1. Create 3 material variants:
   - New/Clean
   - Slightly worn
   - Very worn
2. Random assign to desks
3. Adds visual variety

**Optional differences**:
- Some desks with inkwells, some without
- Different wood tones (slight variation)
- Some with papers/books on top
- Different levels of "messiness"

---

## Part 6: Testing

### Test in Unity Editor

1. Place prefab in test scene
2. Click Play
3. Test interactions:
   - Select desk in Hierarchy
   - Inspector → Right-click Student Desk script
   - Test methods: Open(), Close(), Toggle()
4. Check visuals:
   - Materials applied correctly
   - Proportions look right
   - No z-fighting or overlaps

### Test with VR

1. Add XR Origin to scene
2. Position near desk
3. Click Play
4. Use VR simulator or device
5. Test:
   - Sitting down (teleport to desk)
   - Opening lid (trigger on desktop)
   - Grabbing items from storage

---

## Part 7: Optimization

### For Meta Quest 3

**Polygon Count**:
- Target: < 500 triangles per desk
- Frame: 300 tris
- Desktop: 100 tris
- Seat: 50 tris
- Details: 50 tris

**Texture Optimization**:
- Create atlas for multiple desks
- Size: 2048x2048 for all 15 desks
- ASTC compression
- Mipmaps: Enabled

**Material Optimization**:
- Use Standard shader (Mobile variant)
- 2 materials total: Wood + Metal
- Share materials across all desks

**LOD (Level of Detail)**:
1. Create 3 versions:
   - LOD 0: Full detail (< 2m)
   - LOD 1: Medium detail (2-5m)
   - LOD 2: Low detail (5m+)
2. Configure LOD Group component
3. Test transitions

---

## Quick Reference

### Measurements Summary
| Component | Dimensions (cm) |
|-----------|-----------------|
| Desktop | 60 x 3 x 45 |
| Seat | 35 x 3 x 30 |
| Total Height | 70 (desk), 40 (seat) |
| Leg Height | 65 |
| Frame Width | 60 |
| Inkwell Diameter | 5 |

### Color Codes
| Element | Hex | RGB |
|---------|-----|-----|
| Desk Wood | `#8B6914` | (139, 105, 20) |
| Cast Iron | `#2C2C2C` | (44, 44, 44) |
| Brass Details | `#B5A642` | (181, 166, 66) |

### Unity Components Checklist
- [ ] Desktop mesh
- [ ] Seat mesh
- [ ] Frame mesh
- [ ] Inkwell hole
- [ ] Box Colliders
- [ ] StudentDesk script
- [ ] Materials applied
- [ ] Prefab saved
- [ ] Tested interactions

---

## Troubleshooting

### Desk too large/small in VR
- Check scale: Should be 60cm x 70cm x 45cm
- Verify Unity units are in meters
- Test with XR Origin (human scale)

### Lid won't open
- Check DeskLidPivot is assigned
- Verify rotation angles (0° closed, -60° open)
- Check animation speed setting

### Collision issues
- Ensure colliders match visual geometry
- Check layer collision matrix
- Test with physics debugger (show colliders)

### Performance issues
- Check polygon count (< 500)
- Verify texture compression (ASTC)
- Combine meshes if possible
- Use LOD groups

---

## Next Steps

After creating the desk prefab:

1. **Duplicate 15 times** for full classroom
2. **Arrange in rows**: 3 rows of 5
3. **Assign desk numbers**: 1-15
4. **Test sitting mechanic**: At each desk
5. **Add visual variety**: Different wear levels
6. **Optimize**: Create texture atlas

---

*Last Updated: October 9, 2025*
*For Unity 2022.3 LTS*
*Student Desk Prefab Guide*
