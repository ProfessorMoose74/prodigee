# Unity Scripts Quick Reference

**All 21 Unity C# Scripts - Quick Lookup Guide**

---

## Core VR Scripts (10)

### **1. OASISManager.cs**
**Purpose:** Main VR application manager, backend integration
**Singleton:** Yes
**Key Methods:**
```csharp
OASISManager.Instance.StartVR();
OASISManager.Instance.StartChildSession(token, childId, name);
OASISManager.Instance.StopSession();
```
**File:** `unity-project/Assets/Scripts/OASISManager.cs`

---

### **2. PythonBridge.cs**
**Purpose:** Communication with Python backend
**Singleton:** No (component)
**Key Methods:**
```csharp
ConnectToBackend(token, childId, platform);
SendHeartbeat();
Disconnect();
```
**File:** `unity-project/Assets/Scripts/PythonBridge.cs`

---

### **3. VRSessionController.cs**
**Purpose:** Session management, safety timers (COPPA)
**Singleton:** No (component)
**File:** `unity-project/Assets/Scripts/VRSessionController.cs`

---

### **4. VRInputHandler.cs**
**Purpose:** Quest controller input handling
**Singleton:** No (component)
**File:** `unity-project/Assets/Scripts/VRInputHandler.cs`

---

### **5. ClassroomManager.cs**
**Purpose:** Central classroom orchestrator
**Singleton:** Yes
**Key Methods:**
```csharp
ClassroomManager.Instance.StartActivity(id, title);
ClassroomManager.Instance.EndActivity(completed, score);
ClassroomManager.Instance.WriteOnBlackboard(text);
ClassroomManager.Instance.ClearBlackboard();
```
**File:** `unity-project/Assets/Scripts/ClassroomManager.cs`

---

### **6. Blackboard.cs**
**Purpose:** Interactive teaching surface
**Singleton:** No (component)
**Key Methods:**
```csharp
SetTitle(title);
WriteText(text);
Clear();
DisplayImage(texture);
StartDrawing(position);
ContinueDrawing(position);
EndDrawing();
```
**Attach To:** Blackboard GameObject
**File:** `unity-project/Assets/Scripts/Blackboard.cs`

---

### **7. StudentDesk.cs**
**Purpose:** Individual desk with storage, sitting
**Singleton:** No (component)
**Key Methods:**
```csharp
Open();
Close();
Toggle();
SitDown();
StandUp();
StoreItem(gameObject);
RetrieveItem(name);
```
**Attach To:** Each desk GameObject (15x)
**File:** `unity-project/Assets/Scripts/StudentDesk.cs`

---

### **8. Door.cs**
**Purpose:** Animated classroom door
**Singleton:** No (component)
**File:** `unity-project/Assets/Scripts/Door.cs`

---

### **9. TeleportationManager.cs**
**Purpose:** VR locomotion system
**Singleton:** No (component)
**File:** `unity-project/Assets/Scripts/TeleportationManager.cs`

---

### **10. TeleportAnchor.cs**
**Purpose:** Named teleport points
**Singleton:** No (component)
**File:** `unity-project/Assets/Scripts/TeleportationManager.cs` (embedded)

---

## Child-Friendly Scripts (4)

### **11. GrabbableObject.cs**
**Purpose:** Universal pick-up system for any object
**Singleton:** No (component - attach to every grabbable object)
**Object Types:** Chalk, Eraser, Book, Toy, Globe, PencilBox, StuffedAnimal, Bell, Apple, Generic
**Key Features:**
- Haptic feedback
- Sound effects
- Visual glow when nearby
- Bouncy physics (for toys)
- Auto-return to origin
- Storage in desks

**Usage:**
```csharp
GrabbableObject grab = gameObject.AddComponent<GrabbableObject>();
grab.objectType = GrabbableObject.ObjectType.StuffedAnimal;
grab.isBouncyToy = true;
grab.bounciness = 0.7f;
```
**Attach To:** Any object children can pick up
**File:** `unity-project/Assets/Scripts/GrabbableObject.cs`

---

### **12. InteractiveGlobe.cs**
**Purpose:** Spinning educational globe
**Singleton:** No (component)
**Key Methods:**
```csharp
Spin(axis, speed);
SpinToCountry(countryName, duration);
ShowCountryInfo(country);
HideCountryInfo();
ShowTodaysCountry(country);
```
**Countries:** USA, Brazil, Egypt, China, Australia, France, Japan, Kenya, India, Antarctica
**Attach To:** Globe GameObject
**File:** `unity-project/Assets/Scripts/InteractiveGlobe.cs`

---

### **13. CelebrationEffects.cs**
**Purpose:** Magical reward system
**Singleton:** Yes
**Key Methods:**
```csharp
CelebrationEffects.Instance.CelebrateActivityComplete(position, score);
CelebrationEffects.Instance.CelebrateCorrectAnswer(position);
CelebrationEffects.Instance.CelebrateSpecial(position, achievement);
CelebrationEffects.Instance.EncourageRetry(position);
CelebrationEffects.Instance.CelebrateAlmost(position);
CelebrationEffects.Instance.PlayCharacterEncouragement(character, position);
```
**Celebration Types:**
- Perfect (90-100%): Fireworks + cheers
- Success (70-89%): Confetti
- Effort (<70%): Sparkles + encouragement

**Attach To:** Empty GameObject (auto-creates singleton)
**File:** `unity-project/Assets/Scripts/CelebrationEffects.cs`

---

### **14. DeskTreasure.cs**
**Purpose:** Hidden treasure system
**Singleton:** No (component)
**Rarity:** Common (70%), Rare (20%), Legendary (5%)
**Key Methods:**
```csharp
GenerateTreasures();
RevealTreasures();
OnDeskOpened();
SetTreasureTheme(theme);
AddSpecificTreasure(prefab, rarity);
ResetTreasures();
```
**Themes:** SchoolSupplies, Toys, Nature, Educational
**Attach To:** Each StudentDesk GameObject
**File:** `unity-project/Assets/Scripts/DeskTreasure.cs`

---

## Management Scripts (2)

### **15. ClassroomPropManager.cs**
**Purpose:** Spawn and manage all classroom props
**Singleton:** Yes
**Key Methods:**
```csharp
ClassroomPropManager.Instance.PopulateClassroom();
ClassroomPropManager.Instance.SpawnProp(name, position);
ClassroomPropManager.Instance.FillAllDesks();
ClassroomPropManager.Instance.SpawnDailySurprise();
ClassroomPropManager.Instance.ClearAllProps();
ClassroomPropManager.Instance.ResetAllProps();
```
**Props:** 25+ types (school supplies, toys, educational, nature, special)
**Attach To:** Empty GameObject "PropManager"
**File:** `unity-project/Assets/Scripts/ClassroomPropManager.cs`

---

### **16. SoundManager.cs**
**Purpose:** Centralized audio management
**Singleton:** Yes
**Key Methods:**
```csharp
SoundManager.Instance.PlaySound(name);
SoundManager.Instance.PlaySound(clip);
SoundManager.Instance.PlayRandomSound(clips);
SoundManager.Instance.PlaySound3D(clip, position);
SoundManager.Instance.PlayCelebration(type);
SoundManager.Instance.PlayEncouragement(type);
SoundManager.Instance.PlayCharacterVoice(character);
SoundManager.Instance.PlayMusic(clip, loop);
SoundManager.Instance.StopMusic();
SoundManager.Instance.SetMasterVolume(volume);
```
**Sound Categories:** Objects, Classroom, Celebrations, Encouragement, Voices, Globe, Treasures, Ambient, Music
**Attach To:** Empty GameObject "SoundManager"
**File:** `unity-project/Assets/Scripts/SoundManager.cs`

---

## Specialized Prop Scripts (2)

### **17. InteractiveBook.cs**
**Purpose:** Books children can read
**Singleton:** No (component)
**Book Types:** Story, Educational, Picture, Activity, Reference
**Key Methods:**
```csharp
Open();
Close();
Toggle();
NextPage();
PreviousPage();
GoToPage(pageNumber);
EnterReadingMode();
SetPageContent(index, content);
LoadActivityPage(title, description);
```
**Attach To:** Book GameObjects
**File:** `unity-project/Assets/Scripts/InteractiveBook.cs`

---

### **18. InteractiveBell.cs**
**Purpose:** Classroom bell
**Singleton:** No (component)
**Bell Types:** DeskBell, HandBell, Cowbell, Chime
**Key Methods:**
```csharp
Ring();
RingMultiple(count, delay);
RingClassStart();  // 3 rings
RingClassEnd();    // 2 rings
RingAchievement(); // 5 rings + celebration
```
**Attach To:** Bell GameObjects
**File:** `unity-project/Assets/Scripts/InteractiveBell.cs`

---

## Integration Examples

### **Setup Classroom**
```csharp
// Auto-populate with props
ClassroomPropManager.Instance.PopulateClassroom();

// Fill all desks with treasures
ClassroomPropManager.Instance.FillAllDesks();
```

### **Celebrate Achievement**
```csharp
float score = 0.95f;
CelebrationEffects.Instance.CelebrateActivityComplete(
    transform.position,
    score
);
```

### **Play Sounds**
```csharp
SoundManager.Instance.PlayCelebration(
    SoundManager.CelebrationType.Firework
);
```

### **Spawn Prop**
```csharp
GameObject book = ClassroomPropManager.Instance.SpawnProp(
    "book",
    spawnPosition
);
```

### **Open Book**
```csharp
InteractiveBook book = GetComponent<InteractiveBook>();
book.Open();
book.NextPage();
```

---

## Unity Scene Hierarchy

```
MainClassroom Scene
├── XR Origin (VR)
│   ├── Camera Offset
│   │   └── Main Camera
│   ├── Left Controller
│   └── Right Controller
├── Classroom
│   ├── Floor
│   ├── Ceiling
│   ├── Walls (4x)
│   ├── Blackboard (Blackboard.cs)
│   ├── StudentDesk_01-15 (StudentDesk.cs + DeskTreasure.cs)
│   ├── Door (Door.cs)
│   ├── Globe (InteractiveGlobe.cs)
│   ├── Books (InteractiveBook.cs)
│   ├── Bell (InteractiveBell.cs)
│   └── ClassroomManager (ClassroomManager.cs)
├── OASIS Manager (OASISManager.cs)
├── TeleportationManager (TeleportationManager.cs)
├── PropManager (ClassroomPropManager.cs)
├── SoundManager (SoundManager.cs)
└── Directional Light
```

---

## Component Dependencies

### **Required Components**
- `GrabbableObject` requires: Rigidbody, XRGrabInteractable
- `InteractiveBook` requires: GrabbableObject
- `InteractiveBell` requires: GrabbableObject

### **Singleton Managers (Auto-Create)**
- OASISManager
- ClassroomManager
- CelebrationEffects
- ClassroomPropManager
- SoundManager

---

## Inspector Configuration

### **Most Important Settings**

**ClassroomPropManager:**
- Assign all prop prefabs
- Set spawn points (teacher desk, bookshelf, window sill, chalk tray)
- Enable "Populate On Start"

**SoundManager:**
- Assign all audio clips (30+ sounds)
- Set volume levels (master, SFX, music, voice)

**DeskTreasure:**
- Set treasure theme
- Assign treasure prefabs (common/rare/legendary)
- Set spawn chance

**GrabbableObject:**
- Set object type
- Enable bouncy physics (for toys)
- Assign grab/drop sounds

---

## Testing Checklist

- [ ] All singletons initialize
- [ ] Props spawn correctly
- [ ] Objects are grabbable
- [ ] Sounds play
- [ ] Celebrations trigger
- [ ] Treasures appear in desks
- [ ] Globe spins
- [ ] Books open and turn pages
- [ ] Bell rings
- [ ] Haptic feedback works

---

## File Locations

All scripts: `unity-project/Assets/Scripts/`

**Core:** OASISManager, PythonBridge, VRSessionController, VRInputHandler, ClassroomManager, Blackboard, StudentDesk, Door, TeleportationManager

**Child-Friendly:** GrabbableObject, InteractiveGlobe, CelebrationEffects, DeskTreasure

**Management:** ClassroomPropManager, SoundManager

**Props:** InteractiveBook, InteractiveBell

---

*Created: October 9, 2025*
*Total Scripts: 21*
*Total Lines: ~8,600*
