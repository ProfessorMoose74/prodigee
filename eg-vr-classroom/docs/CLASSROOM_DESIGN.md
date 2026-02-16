# VR Classroom Design Document

**1920s American Schoolhouse for the OASIS Education Planet**

---

## Design Vision

**Theme**: Classic 1920s one-room schoolhouse
**Atmosphere**: Warm, inviting, nostalgic yet magical
**Purpose**: Educational VR environment for K-5 students
**Characters**: Professor Al (owl), Ella (elephant), Gus (grasshopper)

---

## Table of Contents

1. [Overall Layout](#overall-layout)
2. [Architectural Details](#architectural-details)
3. [Interactive Elements](#interactive-elements)
4. [Lighting & Atmosphere](#lighting--atmosphere)
5. [Scale & Accessibility](#scale--accessibility)
6. [Performance Targets](#performance-targets)
7. [Implementation Plan](#implementation-plan)

---

## Overall Layout

### Room Dimensions

**Main Classroom**:
- **Width**: 10 meters (32 feet)
- **Length**: 12 meters (39 feet)
- **Height**: 4 meters (13 feet) - high ceiling for grandeur
- **Play Area**: 8m x 10m (safe movement space)
- **Guardian Boundary**: Recommended 3m x 3m minimum

### Spatial Zones

```
┌─────────────────────────────────┐
│  [Windows]  [Windows]  [Windows] │
│                                  │
│  ┌─────────┐         ┌────────┐ │
│  │Professor│         │  Ella  │ │
│  │   Al    │         │Elephant│ │
│  │(Perch)  │         │(Corner)│ │
│  └─────────┘         └────────┘ │
│                                  │
│      ╔════════════╗              │
│      ║ Blackboard ║              │
│      ║  (Front)   ║              │
│      ╚════════════╝              │
│         [Desk]                   │
│                                  │
│   🪑  🪑  🪑  🪑  🪑             │
│   Student Desks (Interactive)    │
│   🪑  🪑  🪑  🪑  🪑             │
│                                  │
│   🪑  🪑  🪑  🪑  🪑             │
│                                  │
│  [Bookshelf]        [Globe]      │
│  [Map]              [Cabinet]    │
│                                  │
│          [Door]                  │
└─────────────────────────────────┘
```

### Key Areas

1. **Front Teaching Area** (North):
   - Large slate blackboard (3m x 2m)
   - Teacher's wooden desk
   - Professor Al's perch (left)
   - Display easel

2. **Student Seating** (Center):
   - 15 wooden desks in 3 rows of 5
   - Each desk with chair, inkwell, slate
   - Spacing: 1.5m between rows, 1m between desks

3. **Interactive Corners**:
   - **NE**: Ella the Elephant reading corner
   - **NW**: Professor Al's perch
   - **SE**: Globe & geography area
   - **SW**: Gus's grasshopper activity space

4. **Back Wall** (South):
   - Coat hooks & cubbies
   - Wooden bookshelves
   - World map
   - Cabinet with supplies

5. **Windows** (East & West):
   - 6 tall windows total (3 per side)
   - Period-appropriate frames
   - View: Rolling hills, trees (skybox)

---

## Architectural Details

### Walls

**Material**: Painted wood paneling
- **Color**: Warm cream (#F5F5DC)
- **Wainscoting**: Dark wood up to 1m height
- **Crown Molding**: Decorative trim at ceiling
- **Texture**: Subtle wood grain

### Floor

**Material**: Wide-plank hardwood
- **Type**: Oak or pine planks
- **Width**: 20cm planks
- **Color**: Medium brown with wear patterns
- **Details**: Visible nail heads, knots, grain
- **Finish**: Slightly worn/scuffed (authentic)

### Ceiling

**Material**: Pressed tin tiles (1920s style)
- **Pattern**: Geometric floral design
- **Color**: White with subtle oxidation
- **Features**: Exposed wooden beams
- **Lighting**: Pendant fixtures

### Windows

**Style**: Tall, double-hung sash windows
- **Size**: 1m wide x 2.5m tall each
- **Frame**: White-painted wood
- **Glass**: 6-over-6 pane design
- **Curtains**: Simple white muslin
- **View**: Skybox with countryside

### Door

**Style**: Heavy wooden door with window
- **Size**: 1m wide x 2.2m tall
- **Material**: Dark stained wood
- **Hardware**: Brass knob & hinges
- **Window**: 4-pane glass insert (upper half)
- **Interaction**: Can open/close

---

## Interactive Elements

### Primary Interactions

#### 1. Blackboard (Main Teaching Area)

**Physical Properties**:
- **Size**: 3m wide x 2m tall
- **Material**: Black slate with wood frame
- **Features**: Chalk tray at bottom

**Interactions**:
- ✍️ **Draw with chalk** (VR controller ray)
- 🧽 **Erase with eraser** (grab interaction)
- 📋 **Display curriculum content** (dynamic text/images)
- ✨ **Magical transformations** (for activities)

**Technical**:
- Render texture for drawing
- Collision detection for eraser
- Dynamic content from backend
- Save/load drawing states

#### 2. Student Desks

**Physical Properties**:
- **Quantity**: 15 desks
- **Style**: Individual wooden school desks
- **Features**:
  - Hinged desktop (opens)
  - Storage compartment inside
  - Inkwell hole (decorative)
  - Chair attached or separate

**Interactions**:
- 🪑 **Sit down** (teleport to desk, adjust view)
- 📖 **Open desk** (grab lid, swing open)
- 📝 **Use slate** (handheld writing surface)
- 🎒 **Store items** (inside desk)

**Player Desk** (Front center):
- Highlighted/glowing slightly
- Player's assigned seat
- Progress indicators
- Achievement stickers

#### 3. Professor Al's Perch

**Physical Properties**:
- **Location**: Left of blackboard, 2m high
- **Design**: Ornate wooden perch/stand
- **Character**: Animated owl (AI-powered)

**Interactions**:
- 🦉 **Talk to Professor Al** (voice/button)
- 💬 **Get hints** (activity help)
- 📚 **Ask questions** (AI responses)
- 🎓 **Receive lessons** (tutorial mode)

**Technical**:
- Animated character model
- AI dialogue system
- Text-to-speech (child-safe)
- Gesture animations

#### 4. Ella the Elephant (Reading Corner)

**Physical Properties**:
- **Location**: NE corner
- **Design**: Friendly elephant character, seated
- **Props**: Cushions, bookshelf, reading lamp

**Interactions**:
- 🐘 **Story time** (Ella reads aloud)
- 📖 **Book selection** (choose from shelf)
- 🗣️ **Practice reading** (child reads to Ella)
- ⭐ **Earn bookmarks** (reading achievements)

**Technical**:
- Animated character model
- Audio playback system
- Speech recognition (optional)
- Progress tracking

#### 5. Gus the Grasshopper (Activity Space)

**Physical Properties**:
- **Location**: SW corner
- **Design**: Energetic grasshopper character
- **Props**: Activity materials, musical instruments

**Interactions**:
- 🦗 **Phonemic games** (sound activities)
- 🎵 **Music & rhythm** (educational songs)
- 🏃 **Movement activities** (VR physical games)
- 🎉 **Celebrations** (positive reinforcement)

**Technical**:
- Animated character model
- Sound effect library
- Rhythm game mechanics
- Particle effects for feedback

#### 6. Globe & Geography Station

**Physical Properties**:
- **Location**: SE corner
- **Design**: Antique standing globe (1920s style)
- **Size**: 0.8m diameter on wooden stand

**Interactions**:
- 🌍 **Spin globe** (physics-based)
- 🔍 **Zoom into countries** (teleport to landmarks)
- 🗺️ **Learn geography** (educational content)
- ✈️ **Virtual field trips** (OASIS portal)

**Technical**:
- Interactive globe model
- Library integration (landmarks)
- Translation (country names)
- Portal to other OASIS worlds

#### 7. Map & Bookshelves

**Physical Properties**:
- **Map**: Large wall-mounted world map (vintage)
- **Shelves**: 3-tier wooden bookshelf
- **Books**: Period-appropriate textbooks

**Interactions**:
- 📖 **Browse books** (grab/open)
- 📚 **Read content** (curriculum supplements)
- 🗺️ **Explore map** (interactive highlights)

---

## Lighting & Atmosphere

### Natural Light

**Windows**:
- **Time of Day**: Morning/afternoon (adjustable)
- **Sunbeams**: God rays through windows
- **Dynamic**: Optional day/night cycle
- **Color**: Warm golden (morning sun)

**Skybox**:
- **Setting**: Rural countryside
- **Features**: Rolling hills, trees, clouds
- **Season**: Spring/Summer (green, pleasant)
- **Weather**: Clear with occasional clouds

### Artificial Light

**Main Lighting**:
- **Fixtures**: 2-3 hanging pendant lights
- **Style**: Early electric bulbs with brass fixtures
- **Intensity**: Warm, soft glow
- **Color**: 2700K (warm white)

**Accent Lighting**:
- **Reading lamp** (Ella's corner): Soft, focused
- **Desk lamp** (teacher desk): Vintage brass
- **Magical glow** (interactive elements): Subtle highlight

**Ambient Occlusion**:
- Baked lighting for performance
- Contact shadows for realism
- Soft shadows throughout

### Atmosphere Effects

**Particles**:
- Dust motes floating in sunbeams
- Chalk dust when erasing blackboard
- Sparkles for positive feedback
- Celebration confetti (achievements)

**Audio**:
- Ambient: Birds chirping outside, wind
- Environmental: Creaking floor, desk sounds
- Music: Gentle educational background (optional)
- Voices: Character dialogue, encouragement

---

## Scale & Accessibility

### Child-Appropriate Scale

**Challenge**: VR users are children (ages 5-10)

**Solutions**:
1. **Adjustable Height**:
   - Auto-detect player height
   - Scale world accordingly
   - Keep interactions at child eye-level

2. **Character Heights**:
   - Professor Al: 0.5m (perched at 2m)
   - Ella: 1.5m (seated, approachable)
   - Gus: 0.3m (eye-level when on props)
   - Child avatar: 1.0-1.3m

3. **Furniture Scale**:
   - Desks: 0.7m tall (child-size)
   - Chairs: 0.4m seat height
   - Blackboard: 0.5m from floor to 2.5m top
   - Doorknobs: 0.9m height

### Movement & Navigation

**Locomotion Options**:
1. **Teleportation** (Primary):
   - Point & click to move
   - Safe, comfortable
   - Prevents motion sickness
   - Highlight valid locations

2. **Continuous Movement** (Advanced):
   - Thumbstick locomotion
   - For older children
   - Optional snap turning
   - Speed: Slow (1.5 m/s)

3. **Seated Areas**:
   - Desk: Sit/stand toggle
   - Reading corner: Seated mode
   - Auto-adjust view height

**Comfort Features**:
- Vignetting during movement
- Snap turning (30° increments)
- No artificial acceleration
- Static reference frame (floor grid)

### Accessibility

**Visual**:
- High contrast UI elements
- Adjustable text size
- Color-blind friendly palettes
- Screen reader compatible (future)

**Audio**:
- Closed captions for all dialogue
- Visual cues for sounds
- Volume controls
- Mono audio option

**Physical**:
- Seated play mode
- One-handed mode option
- Simplified controls
- No required rapid movements

---

## Performance Targets

### Meta Quest 3 Optimization

**Target Frame Rate**: 90 FPS (minimum), 120 FPS (ideal)

**Budget**:
- **Draw Calls**: < 100
- **Vertices**: < 50,000 visible
- **Texture Memory**: < 512MB
- **Materials**: < 50 unique

### Optimization Strategies

#### 1. Geometry

**Techniques**:
- **Low-poly models**: < 500 tris per prop
- **LOD system**: 3 levels (high/med/low)
- **Occlusion culling**: Hide unseen objects
- **Merged meshes**: Combine static objects

**Poly Budget**:
- Classroom structure: 5,000 tris
- Each desk: 300 tris x 15 = 4,500 tris
- Blackboard: 200 tris
- Characters: 2,000 tris each x 3 = 6,000 tris
- Props: 10,000 tris total
- **Total**: ~26,000 tris (well under budget)

#### 2. Textures

**Atlasing**:
- Combine textures into atlases
- Classroom: 2048x2048 atlas
- Characters: 1024x1024 each
- Props: 1024x1024 shared atlas

**Compression**:
- **Format**: ASTC (Quest native)
- **Sizes**: Power of 2
- **Mipmaps**: Always enabled
- **Streaming**: Not needed (small scene)

#### 3. Lighting

**Baked Lighting**:
- **Lightmaps**: 1024x1024 per object
- **Bake resolution**: Medium
- **Ambient occlusion**: Baked
- **Shadows**: Static only

**Real-time Lights**:
- **Limit**: 3-4 real-time lights max
- **Shadows**: 1 directional (sun) only
- **Range**: Keep small
- **Falloff**: Use attenuation

#### 4. Materials

**Shader Complexity**:
- **Standard shader**: Mobile-optimized
- **Features**: Albedo + Normal + AO only
- **No**: Parallax, tessellation, complex effects
- **Transparency**: Minimal use (expensive)

**Material Instances**:
- Share materials across objects
- Use material instances for variations
- Limit unique shaders

#### 5. Effects

**Particles**:
- **Budget**: < 500 particles total
- **Textures**: Small (128x128)
- **Alpha**: Minimize overdraw
- **Use sparingly**: Only for feedback

**Post-Processing**:
- **Bloom**: Very light
- **Color grading**: Minimal
- **AO**: Baked only
- **No**: Motion blur, DOF, SSR

---

## Implementation Plan

### Phase 1: Basic Structure (Week 1)

**Tasks**:
- [x] Unity project setup
- [ ] Create classroom geometry
  - [ ] Walls, floor, ceiling
  - [ ] Windows and door
  - [ ] Basic furniture layout
- [ ] Apply base materials
- [ ] Set up lighting (baked)
- [ ] Add XR Origin (VR camera)
- [ ] Test locomotion

**Deliverable**: Empty classroom you can walk through in VR

### Phase 2: Core Interactions (Week 2)

**Tasks**:
- [ ] Implement teleportation
- [ ] Add blackboard interaction
- [ ] Create student desks
- [ ] Add desk sitting mechanic
- [ ] Door open/close
- [ ] Basic grab interactions

**Deliverable**: Interactive classroom with basic functionality

### Phase 3: Characters (Week 3)

**Tasks**:
- [ ] Import/create Professor Al model
- [ ] Import/create Ella model
- [ ] Import/create Gus model
- [ ] Add animations (idle, talk, gesture)
- [ ] Implement dialogue system
- [ ] Add character sounds

**Deliverable**: Animated characters in classroom

### Phase 4: Educational Content (Week 4)

**Tasks**:
- [ ] Backend integration
- [ ] Load curriculum from API
- [ ] Display content on blackboard
- [ ] First activity implementation
- [ ] Progress tracking
- [ ] Achievement system

**Deliverable**: Functional first lesson

### Phase 5: Polish & Optimization (Week 5)

**Tasks**:
- [ ] Optimize performance (hit 90 FPS)
- [ ] Add sound effects
- [ ] Add particle effects
- [ ] Improve materials/lighting
- [ ] Add skybox
- [ ] Bug fixes

**Deliverable**: Polished, optimized classroom

### Phase 6: Testing & Iteration (Week 6)

**Tasks**:
- [ ] Quest 3 deployment
- [ ] Real hardware testing
- [ ] Comfort testing
- [ ] User feedback
- [ ] Adjustments
- [ ] Final polish

**Deliverable**: Production-ready VR classroom

---

## Asset Sources

### 3D Models

**Option 1: Create Custom**
- Use Blender (free)
- Follow 1920s reference images
- Low-poly modeling
- Export as FBX/GLB

**Option 2: Asset Store**
- Unity Asset Store
- Sketchfab (with license)
- TurboSquid
- Search: "classroom", "school", "1920s", "vintage"

**Option 3: Procedural**
- ProBuilder (Unity built-in)
- Create basic geometry in Unity
- Faster iteration

### Textures

**Sources**:
- **Textures.com** (free with account)
- **Poly Haven** (free, CC0)
- **Substance Source** (paid)

**Types Needed**:
- Wood planks (floor)
- Wood paneling (walls)
- Blackboard slate
- Metal (tin ceiling)
- Fabric (curtains)

### Audio

**Sources**:
- **Freesound.org** (free, CC)
- **Epidemic Sound** (paid, royalty-free)
- **Unity Audio Packs** (Asset Store)

**Sounds Needed**:
- Ambient: Birds, wind, classroom ambience
- Interactions: Chalk writing, desk opening, footsteps
- Characters: Voice lines, animal sounds
- Music: Gentle background (optional)

### Characters

**Professor Al (Owl)**:
- Stylized, friendly design
- Large expressive eyes
- Graduation cap or reading glasses
- Animated: Blink, head turn, wing gestures

**Ella (Elephant)**:
- Warm, motherly appearance
- Sitting/relaxed pose
- Books in trunk
- Animated: Gentle movements, ear flaps

**Gus (Grasshopper)**:
- Energetic, small
- Bright green color
- Expressive antennae
- Animated: Jumping, bouncing, excited

**Sources**:
- Commission 3D artist
- Modify existing models (with license)
- Stylized/low-poly for performance

---

## Next Steps

1. ✅ Design document complete
2. ➡️ Start Phase 1: Build basic classroom structure
3. ➡️ Create or source 3D assets
4. ➡️ Implement in Unity
5. ➡️ Test on Quest 3 when hardware arrives

---

## Reference Images

*TODO: Add reference images folder with:*
- 1920s schoolhouse interiors
- Period furniture
- Vintage blackboards
- Character concept art
- Color palette swatches

---

*Last Updated: October 9, 2025*
*Designer: Project EGO Team*
*Target Platform: Meta Quest 3*
