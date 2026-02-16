# Window Prefab Creation Guide

**Creating authentic 1920s double-hung sash windows with multi-pane design**

---

## Design Specifications

### Dimensions
- **Total Width**: 1.0m (100cm)
- **Total Height**: 2.5m (250cm)
- **Frame Depth**: 10cm
- **Pane Configuration**: 6-over-6 (6 panes top sash, 6 panes bottom sash)
- **Each Pane Size**: ~30cm x 40cm

### Style
- Double-hung sash window (both upper and lower sections movable)
- Traditional wooden frame
- Grid pattern: 3 columns x 2 rows per sash
- Historical early-1900s design

---

## Part 1: Simple Version (ProBuilder - 15 minutes)

### Step 1: Create Window Frame

1. Right-click Hierarchy → Create Empty
2. Name: "ClassroomWindow"
3. Position: (0, 1.3, 0) - centered on wall at ~1.3m height

**Outer Frame**:
1. Create cube → Name: "WindowFrame_Outer"
2. Scale: (1.1, 2.6, 0.12) - slightly larger than glass area
3. Material: Dark wood `#3E2723`

**Frame Opening** (for glass):
1. Create cube → Name: "WindowFrame_Opening"
2. Scale: (1.0, 2.5, 0.08) - actual window area
3. Position: (0, 0, 0) relative to parent
4. Material: Transparent (or remove for now)

### Step 2: Create Window Panes (Glass)

**Upper Sash** (top 6 panes):
1. Create parent: Empty object → Name: "UpperSash"
2. Position: (0, 0.625, 0) - top half of window

For each pane (6 total):
1. Create cube → Names: "Pane_U1" through "Pane_U6"
2. Scale: (0.3, 0.4, 0.01) - thin glass pane
3. Positions (grid layout):
   - Row 1 (top): Y = 0.4
     - Left: X = -0.33
     - Center: X = 0
     - Right: X = 0.33
   - Row 2 (bottom): Y = -0.4
     - Same X positions

**Lower Sash** (bottom 6 panes):
1. Create parent: Empty object → Name: "LowerSash"
2. Position: (0, -0.625, 0) - bottom half
3. Create 6 panes same as upper sash

**Glass Material**:
1. Create material → Name: "WindowGlass"
2. Settings:
   - Rendering Mode: Transparent
   - Albedo: White `#F0F0F0`
   - Alpha: 0.9 (90% transparent, slight tint)
   - Metallic: 0
   - Smoothness: 0.9 (very smooth)
3. Apply to all panes

### Step 3: Create Muntins (Grid Bars)

**Horizontal Muntins**:
1. Create 2 thin cubes (separating rows)
2. Scale: (1.0, 0.02, 0.03) - thin bars
3. Position between pane rows

**Vertical Muntins**:
1. Create 4 thin cubes (separating columns)
2. Scale: (0.02, 2.4, 0.03) - thin bars
3. Position between pane columns

**Material**: Dark wood `#3E2723` (matches frame)

### Step 4: Add Sash Divider

**Center Horizontal Bar** (separates upper/lower sash):
1. Create cube → Name: "SashDivider"
2. Scale: (1.0, 0.08, 0.12)
3. Position: (0, 0, 0) - center of window
4. Material: Dark wood

### Step 5: Add Window Sill

**Interior Sill**:
1. Create cube → Name: "WindowSill"
2. Scale: (1.1, 0.05, 0.15)
3. Position: (0, -1.25, -0.08) - bottom of window, protruding inward
4. Material: Dark wood or painted to match walls

### Step 6: Optional Details

**Window Lock** (center where sashes meet):
1. Create small cube → Name: "WindowLock"
2. Scale: (0.05, 0.03, 0.02)
3. Position: (0, 0, 0.06) - on sash divider
4. Material: Brass `#B5A642` or dark metal

**Rope/Chain** (for opening):
1. Create cylinder → Name: "SashCord"
2. Scale: (0.01, 0.2, 0.01) - thin rope
3. Position: Side of window
4. Material: Brown or tan (rope color)

---

## Part 2: Opening Window (Optional Interactive)

### Add Animation

**If you want windows to open**:

1. Select LowerSash
2. Add Component → Animator
3. Create animation:
   - Closed: Y position = -0.625
   - Open: Y position = -1.5 (slides down)

**Or use script**:

```csharp
// Simple window opening script
public class Window : MonoBehaviour
{
    [SerializeField] private Transform lowerSash;
    [SerializeField] private float openPosition = -1.5f;
    [SerializeField] private float closedPosition = -0.625f;
    private bool isOpen = false;

    public void Toggle()
    {
        isOpen = !isOpen;
        float targetY = isOpen ? openPosition : closedPosition;
        // Animate lowerSash.localPosition.y to targetY
    }
}
```

---

## Part 3: Lighting Through Windows

### Sun Shafts Effect

**Create sun light shafts**:

1. Select window GameObject
2. Add Component → Light Probe Group (optional)
3. Add Component → Reflection Probe

**Directional Light Setup**:
1. Select Directional Light in scene
2. Position rotation to shine through windows:
   - For east windows: Rotation (50, -90, 0)
   - For west windows: Rotation (50, 90, 0)
3. Enable shadows
4. Adjust intensity for bright sunlight

**Volumetric Lighting** (god rays):
- Use post-processing stack
- Add volumetric lighting effect
- Or use particle system with glowing particles in sun beams

---

## Part 4: Window Placement in Classroom

### East Wall Windows (3 windows)

Positions along east wall (assuming wall is at X = 5m):
1. **Window 1**: (5, 1.3, -3.0)
2. **Window 2**: (5, 1.3, 0)
3. **Window 3**: (5, 1.3, 3.0)

Rotation: (0, -90, 0) to face into room

### West Wall Windows (3 windows)

Positions along west wall (assuming wall is at X = -5m):
1. **Window 1**: (-5, 1.3, -3.0)
2. **Window 2**: (-5, 1.3, 0)
3. **Window 3**: (-5, 1.3, 3.0)

Rotation: (0, 90, 0) to face into room

### Wall Integration

**Cut holes in walls**:
1. Option A: Boolean operation (ProBuilder)
2. Option B: Separate wall sections (top, bottom, between windows)
3. Option C: Windows on top of wall (easier, slightly less realistic)

---

## Part 5: Curtains (Optional)

### Simple Curtain Mesh

1. Create plane → Name: "Curtain_Left"
2. Scale: (0.5, 2.2, 1) - half window width
3. Position: Left side of window, slightly in front
4. Rotate: Slightly angled (as if pulled back)

**Duplicate for right side**:
1. Duplicate → Name: "Curtain_Right"
2. Mirror position to right side

**Curtain Material**:
- Shader: Standard (Transparent)
- Albedo: White or cream
- Alpha: 0.5 (semi-transparent)
- Smoothness: 0.7

**Curtain Rod**:
1. Create cylinder → Name: "CurtainRod"
2. Scale: (0.02, 1.2, 0.02) - thin rod, wider than window
3. Position: Above window
4. Material: Dark wood or metal

---

## Part 6: Optimization

### Performance Tips

**Combine Panes**:
- Merge all 12 glass panes into one mesh
- Single material/draw call
- Better for VR

**Texture Baking**:
- Bake muntin shadows onto glass texture
- Reduces geometry
- Faster rendering

**LOD**:
- LOD 0 (< 5m): Full detail with all muntins
- LOD 1 (5-10m): Simplified muntins
- LOD 2 (> 10m): Single pane, baked grid texture

**Polygon Count**:
- Target: < 150 triangles per window
- Frame: 50 tris
- Glass: 50 tris
- Muntins: 50 tris

---

## Part 7: Skybox/Exterior View

### What's Visible Outside

**Option A: Skybox Only**:
- Unity skybox (clouds, blue sky)
- No exterior geometry
- Simplest, best performance

**Option B: Simple Backdrop**:
- Large plane with countryside texture
- Positioned outside windows
- Static image, no parallax

**Option C: 3D Exterior** (advanced):
- Model simple trees, hills outside
- Keep low-poly
- Only visible from windows
- Significant performance cost

**Recommendation**: Start with Skybox, add backdrop if needed

---

## Part 8: Prefab Creation

### Save as Prefab

1. Configure one window completely
2. Drag from Hierarchy to Project → Assets/Prefabs
3. Name: "ClassroomWindow.prefab"

**Create variants for different walls**:
1. Duplicate prefab
2. Adjust rotation for each wall
3. Names:
   - "ClassroomWindow_East.prefab"
   - "ClassroomWindow_West.prefab"
   - "ClassroomWindow_North.prefab" (if needed)

### Place All Windows

1. Drag prefab into scene 6 times
2. Position on walls (see Part 4)
3. Adjust rotations to face inward
4. Test lighting through windows

---

## Quick Reference

### Window Measurements
| Component | Size (cm) |
|-----------|-----------|
| Total Width | 100 |
| Total Height | 250 |
| Frame Width | 10 |
| Pane Width | 30 |
| Pane Height | 40 |
| Glass Thickness | 1 |
| Muntin Thickness | 2 |

### Material Settings

**Glass**:
```
Rendering Mode: Transparent
Albedo: #F0F0F0
Alpha: 0.9
Smoothness: 0.9
```

**Frame**:
```
Rendering Mode: Opaque
Albedo: #3E2723 (dark wood)
Smoothness: 0.4
```

### Components Checklist
- [ ] Outer frame
- [ ] 12 glass panes (6 upper, 6 lower)
- [ ] Horizontal muntins
- [ ] Vertical muntins
- [ ] Sash divider
- [ ] Window sill
- [ ] Materials applied
- [ ] Saved as prefab

---

## Troubleshooting

### Glass looks opaque
- Check material Rendering Mode is Transparent
- Verify Alpha value is < 1.0 (try 0.9)
- Check shader is Standard (not Unlit)

### Can't see through window
- Ensure glass mesh is single-sided (normal facing in)
- Check camera culling distance
- Verify no solid objects blocking view

### Lighting doesn't come through
- Check Directional Light rotation
- Increase light intensity
- Enable shadows
- Verify windows are on correct layer for lighting

### Performance issues
- Combine glass panes into single mesh
- Use LOD groups
- Reduce shadow casting (static shadows only)

---

*Last Updated: October 9, 2025*
*For Unity 2022.3 LTS*
*Window Prefab Guide*
