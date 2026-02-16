# Physics & Interaction System

**Creating a physically realistic, tactile VR classroom where children can touch, grab, and interact with everything**

---

## Overview

Children learn through touch and exploration. The VR classroom must feel real - objects should have weight, bounce, stack, and respond naturally to interaction. Every surface should provide tactile feedback through haptics and sound.

**Core Principle**: If it looks touchable, it IS touchable. If it looks grabbable, it IS grabbable.

---

## Unity Physics Setup

### Physics Settings

**Edit → Project Settings → Physics**:

```
Fixed Timestep: 0.0111 (90 Hz to match VR frame rate)
Default Solver Iterations: 10 (higher for stability)
Default Solver Velocity Iterations: 8
Bounce Threshold: 2
Sleep Threshold: 0.005
Default Contact Offset: 0.01
Default Max Angular Speed: 50 (prevent spinning too fast)
```

**Collision Matrix** (Edit → Project Settings → Physics → Layer Collision Matrix):
- Player ↔ Furniture: Collide
- Player ↔ GrabbableObjects: Detect (trigger)
- GrabbableObjects ↔ Furniture: Collide
- GrabbableObjects ↔ GrabbableObjects: Collide
- GrabbableObjects ↔ Floor: Collide

### Layers

Create these layers:
1. **Player** - VR player collision
2. **Furniture** - Desks, blackboard, non-grabbable
3. **GrabbableObjects** - Books, chalk, props
4. **Floor** - Ground, teleportable surface
5. **Walls** - Room boundaries
6. **InteractiveUI** - Buttons, handles

---

## Grabbable Object System

### XR Interaction Toolkit Integration

**Every grabbable object needs**:

1. **Rigidbody** component
2. **Collider** (Box, Sphere, or Mesh)
3. **XR Grab Interactable** component
4. **PhysicsInteractable** script (custom)

### PhysicsInteractable Script

```csharp
using UnityEngine;
using UnityEngine.XR.Interaction.Toolkit;

namespace EG.OASIS.Interaction
{
    /// <summary>
    /// Physics Interactable - Makes any object grabbable with realistic physics
    /// Provides haptic feedback, sound effects, and physical properties
    /// </summary>
    [RequireComponent(typeof(Rigidbody))]
    [RequireComponent(typeof(XRGrabInteractable))]
    public class PhysicsInteractable : MonoBehaviour
    {
        #region Inspector Settings
        [Header("Physical Properties")]
        [SerializeField] private float mass = 0.1f; // kg
        [SerializeField] private float drag = 0.5f;
        [SerializeField] private float angularDrag = 0.5f;

        [Header("Material Properties")]
        [SerializeField] private PhysicMaterial physicsMaterial;
        [SerializeField] private float bounciness = 0.3f;
        [SerializeField] private float friction = 0.6f;

        [Header("Haptic Feedback")]
        [SerializeField] private float grabHapticIntensity = 0.3f;
        [SerializeField] private float grabHapticDuration = 0.1f;
        [SerializeField] private float collisionHapticIntensity = 0.2f;
        [SerializeField] private float collisionHapticThreshold = 0.5f; // m/s

        [Header("Audio")]
        [SerializeField] private AudioClip grabSound;
        [SerializeField] private AudioClip releaseSound;
        [SerializeField] private AudioClip[] collisionSounds;
        [SerializeField] private float minTimeBetweenCollisionSounds = 0.1f;

        [Header("Constraints")]
        [SerializeField] private bool constrainRotation = false;
        [SerializeField] private bool stayUpright = false;
        [SerializeField] private float returnToPositionTime = 0f; // 0 = never return
        #endregion

        #region Private Fields
        private Rigidbody _rigidbody;
        private XRGrabInteractable _grabInteractable;
        private AudioSource _audioSource;
        private Vector3 _originalPosition;
        private Quaternion _originalRotation;
        private float _lastCollisionSoundTime;
        private bool _isGrabbed;
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            // Get components
            _rigidbody = GetComponent<Rigidbody>();
            _grabInteractable = GetComponent<XRGrabInteractable>();

            // Setup audio
            _audioSource = gameObject.GetComponent<AudioSource>();
            if (_audioSource == null)
            {
                _audioSource = gameObject.AddComponent<AudioSource>();
            }
            _audioSource.spatialBlend = 1f; // 3D sound
            _audioSource.maxDistance = 10f;

            // Configure rigidbody
            _rigidbody.mass = mass;
            _rigidbody.drag = drag;
            _rigidbody.angularDrag = angularDrag;
            _rigidbody.useGravity = true;
            _rigidbody.interpolation = RigidbodyInterpolation.Interpolate;
            _rigidbody.collisionDetectionMode = CollisionDetectionMode.Continuous;

            // Create or assign physics material
            if (physicsMaterial == null)
            {
                physicsMaterial = new PhysicMaterial("InteractablePhysicsMaterial");
                physicsMaterial.bounciness = bounciness;
                physicsMaterial.friction = friction;
                physicsMaterial.frictionCombine = PhysicMaterialCombine.Average;
                physicsMaterial.bounceCombine = PhysicMaterialCombine.Average;
            }

            // Apply physics material to colliders
            var colliders = GetComponents<Collider>();
            foreach (var collider in colliders)
            {
                collider.material = physicsMaterial;
            }

            // Store original position
            _originalPosition = transform.position;
            _originalRotation = transform.rotation;

            // Subscribe to grab events
            _grabInteractable.selectEntered.AddListener(OnGrab);
            _grabInteractable.selectExited.AddListener(OnRelease);
        }

        private void OnCollisionEnter(Collision collision)
        {
            HandleCollision(collision);
        }

        private void Update()
        {
            // Keep upright if specified
            if (stayUpright && !_isGrabbed)
            {
                Quaternion targetRotation = Quaternion.Euler(0, transform.eulerAngles.y, 0);
                transform.rotation = Quaternion.Lerp(transform.rotation, targetRotation, Time.deltaTime * 5f);
            }
        }
        #endregion

        #region Grab/Release
        private void OnGrab(SelectEnterEventArgs args)
        {
            _isGrabbed = true;

            // Play grab sound
            if (grabSound != null)
            {
                _audioSource.PlayOneShot(grabSound);
            }

            // Haptic feedback
            TriggerHaptic(args.interactorObject, grabHapticIntensity, grabHapticDuration);

            Debug.Log($"[Physics] Grabbed: {gameObject.name}");
        }

        private void OnRelease(SelectExitEventArgs args)
        {
            _isGrabbed = false;

            // Play release sound
            if (releaseSound != null)
            {
                _audioSource.PlayOneShot(releaseSound);
            }

            // Optional: Return to original position after delay
            if (returnToPositionTime > 0)
            {
                StartCoroutine(ReturnToOriginalPosition(returnToPositionTime));
            }

            Debug.Log($"[Physics] Released: {gameObject.name}");
        }
        #endregion

        #region Collision Handling
        private void HandleCollision(Collision collision)
        {
            // Calculate impact force
            float impactVelocity = collision.relativeVelocity.magnitude;

            // Play collision sound
            if (impactVelocity > collisionHapticThreshold &&
                Time.time - _lastCollisionSoundTime > minTimeBetweenCollisionSounds)
            {
                PlayCollisionSound(impactVelocity);
                _lastCollisionSoundTime = Time.time;
            }

            // Haptic feedback if being held
            if (_isGrabbed && impactVelocity > collisionHapticThreshold)
            {
                // Get interactor (hand holding object)
                var interactor = _grabInteractable.firstInteractorSelecting;
                if (interactor != null)
                {
                    float intensity = Mathf.Clamp01(impactVelocity / 5f) * collisionHapticIntensity;
                    TriggerHaptic(interactor, intensity, 0.1f);
                }
            }
        }

        private void PlayCollisionSound(float impactVelocity)
        {
            if (collisionSounds == null || collisionSounds.Length == 0) return;

            // Pick random collision sound
            AudioClip sound = collisionSounds[Random.Range(0, collisionSounds.Length)];

            // Volume based on impact
            float volume = Mathf.Clamp01(impactVelocity / 5f);

            _audioSource.PlayOneShot(sound, volume);
        }
        #endregion

        #region Haptic Feedback
        private void TriggerHaptic(IXRSelectInteractor interactor, float intensity, float duration)
        {
            // Get controller from interactor
            if (interactor is XRBaseControllerInteractor controllerInteractor)
            {
                var controller = controllerInteractor.xrController;
                if (controller != null)
                {
                    controller.SendHapticImpulse(intensity, duration);
                }
            }
        }
        #endregion

        #region Return to Position
        private System.Collections.IEnumerator ReturnToOriginalPosition(float delay)
        {
            yield return new WaitForSeconds(delay);

            // Smoothly move back to original position
            float elapsed = 0f;
            float duration = 1f;
            Vector3 startPos = transform.position;
            Quaternion startRot = transform.rotation;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;

                transform.position = Vector3.Lerp(startPos, _originalPosition, t);
                transform.rotation = Quaternion.Lerp(startRot, _originalRotation, t);

                yield return null;
            }

            // Ensure final position
            transform.position = _originalPosition;
            transform.rotation = _originalRotation;
            _rigidbody.velocity = Vector3.zero;
            _rigidbody.angularVelocity = Vector3.zero;
        }
        #endregion

        #region Public Methods
        /// <summary>
        /// Reset object to original position immediately
        /// </summary>
        public void ResetPosition()
        {
            transform.position = _originalPosition;
            transform.rotation = _originalRotation;
            _rigidbody.velocity = Vector3.zero;
            _rigidbody.angularVelocity = Vector3.zero;
        }

        /// <summary>
        /// Set new "original" position (for moved furniture)
        /// </summary>
        public void SetNewOriginalPosition()
        {
            _originalPosition = transform.position;
            _originalRotation = transform.rotation;
        }
        #endregion
    }
}
```

---

## Physical Object Categories

### Category 1: Grabbable Props

**Examples**: Chalk, eraser, books, pencils, small toys, globe

**Settings**:
```
Mass: 0.05 - 0.5 kg (light, easy for children)
Drag: 0.5
Angular Drag: 0.5
Bounciness: 0.2 - 0.4
Friction: 0.6
Constraints: None (free movement)
Return to Position: Optional (after 30 seconds if dropped)
```

**Interaction**:
- Grab with either hand
- Throw (realistic trajectory)
- Drop (falls with gravity)
- Stack on surfaces
- Collide with other objects

### Category 2: Interactive Furniture

**Examples**: Desk lids, drawers, doors, windows

**Settings**:
```
Mass: 5 - 20 kg (heavier, feels substantial)
Drag: 1.0
Angular Drag: 2.0
Bounciness: 0.1
Friction: 0.8
Constraints: Rotation (hinge joint)
Return to Position: No (stays where placed)
```

**Interaction**:
- Grab handle/edge
- Pull/push to open
- Hinged movement (realistic swing)
- Stays in position (not freely movable)
- Heavier haptic feedback

### Category 3: Large Movable Objects

**Examples**: Chairs, stools, small tables, boxes

**Settings**:
```
Mass: 2 - 10 kg (movable but with effort)
Drag: 1.5
Angular Drag: 1.5
Bounciness: 0.1
Friction: 0.9
Constraints: Keep upright (optional)
Return to Position: No
```

**Interaction**:
- Grab with two hands (optional)
- Slide on floor
- Lift and carry
- Place down gently or drop
- Makes sound when moved

### Category 4: Static Environment

**Examples**: Walls, floor, blackboard frame, built-in furniture

**Settings**:
```
Rigidbody: None (or Kinematic)
Collider: Yes (for physics interactions)
Touchable: Yes (provides haptic feedback)
Movable: No
```

**Interaction**:
- Touch provides haptic feedback
- Surface sounds when touched
- Can write/draw on (blackboard, paper)
- Cannot be moved or damaged

---

## Realistic Physical Properties

### Material Physics

**Wood** (desks, chairs, blackboard frame):
```
Friction: 0.6
Bounciness: 0.2
Mass: Varies by size
Sound: Hollow knock, scraping, sliding
```

**Metal** (cast iron desk frames):
```
Friction: 0.4
Bounciness: 0.3
Mass: Heavy (for size)
Sound: Metallic clang, ringing
```

**Paper/Books**:
```
Friction: 0.7
Bounciness: 0.1
Mass: Very light (0.05 - 0.3 kg)
Sound: Rustling, pages flipping
```

**Chalk**:
```
Friction: 0.8
Bounciness: 0.1
Mass: 0.02 kg (very light)
Sound: Click when dropped, scraping on board
```

**Glass** (windows):
```
Friction: 0.2
Bounciness: 0.4
Mass: Medium (for pane)
Sound: Tap (not break - child-safe)
```

---

## Haptic Feedback System

### Intensity Levels

**Light Touch** (0.1 - 0.2):
- Brushing against surface
- Picking up very light object
- Touching smooth surface

**Medium Touch** (0.3 - 0.5):
- Grabbing object
- Opening drawer
- Placing object down
- Writing on blackboard

**Strong Touch** (0.6 - 0.8):
- Collision impact
- Dropping heavy object
- Slamming door/desk
- Hitting wall

**Very Strong** (0.9 - 1.0):
- Major collision
- Throwing and hitting hard
- Emergency feedback (avoid overuse)

### Haptic Patterns

**Grab**:
```csharp
// Short pulse when grabbing
controller.SendHapticImpulse(0.3f, 0.1f);
```

**Continuous Interaction** (drawing on blackboard):
```csharp
// Gentle vibration while touching
for (duration of touch)
{
    controller.SendHapticImpulse(0.2f, 0.05f);
    yield return new WaitForSeconds(0.05f);
}
```

**Collision**:
```csharp
// Intensity based on impact force
float intensity = Mathf.Clamp01(impactForce / maxForce);
controller.SendHapticImpulse(intensity, 0.1f);
```

---

## Sound Effects System

### Sound Categories

**Grab Sounds**:
- Wood: Soft tap
- Metal: Light clink
- Paper: Rustle
- Fabric: Soft whoosh

**Release Sounds**:
- Gentle placement: Soft thud
- Drop: Harder impact
- Throw and hit: Loud impact

**Collision Sounds** (by material):
- Wood on wood: Knock, clack
- Metal on wood: Clang
- Paper on surface: Flutter, soft tap
- Object on floor: Thud (varies by mass)

**Sliding Sounds**:
- Wood on wood: Scraping
- Chair on floor: Squeak, drag
- Heavy furniture: Scraping, effort sound

**Environmental Sounds**:
- Door: Creak, slam, latch click
- Desk lid: Squeak, thud
- Drawers: Slide, bump
- Blackboard eraser: Swoosh

### Sound Implementation

**Per-Object Audio Source**:
```csharp
// Every interactive object has AudioSource
AudioSource audioSource = GetComponent<AudioSource>();
audioSource.spatialBlend = 1.0f; // 3D sound
audioSource.minDistance = 0.5f;
audioSource.maxDistance = 10f;
audioSource.rolloffMode = AudioRolloffMode.Linear;
```

**Volume Based on Force**:
```csharp
void PlayCollisionSound(float impactForce)
{
    float volume = Mathf.Clamp01(impactForce / 5f);
    volume = Mathf.Lerp(0.2f, 1.0f, volume); // Min 0.2, max 1.0

    AudioClip clip = GetCollisionSound(impactForce);
    audioSource.PlayOneShot(clip, volume);
}
```

---

## Child-Safe Constraints

### Safety Features

**No Breaking**:
- Objects don't break or shatter
- Glass windows don't crack
- Furniture doesn't splinter
- Educational tools stay intact

**Soft Limits**:
- Throwing speed limited (< 5 m/s)
- Can't hurt self or others (no collision damage)
- Objects don't get stuck in walls (teleport out if needed)
- Heavy objects auto-place gently near ground

**Reset Functions**:
- Auto-reset props after timeout
- "Clean up" button returns all objects
- Respawn dropped items that fall out of room
- Undo any "mess" with one click

**Comfortable Physics**:
- No excessive spinning (angular velocity limit)
- Smooth grabs (not jerky)
- Gentle releases (auto-slow before drop)
- Predictable behavior (children can learn)

---

## Performance Optimization

### Physics Optimization

**For Meta Quest 3**:

1. **Simplified Collision Meshes**:
   - Use box/sphere colliders when possible
   - Mesh colliders only for complex shapes
   - Keep mesh colliders low-poly (< 100 tris)

2. **Sleeping Objects**:
   - Unity auto-sleeps stationary objects
   - Sleep threshold: 0.005
   - Sleeping objects don't consume physics time

3. **Continuous vs Discrete**:
   - Fast-moving objects: Continuous collision
   - Slow/static objects: Discrete collision
   - Most classroom objects: ContinuousDynamic

4. **Physics Layers**:
   - Ignore collisions between non-interacting layers
   - Reduce unnecessary collision checks
   - Saves significant performance

5. **Fixed Timestep**:
   - Match VR frame rate (90 Hz = 0.0111s)
   - Consistent physics regardless of frame drops
   - Smoother interactions

### Maximum Active Physics Objects

**Quest 3 Target**:
- Max 50 active physics objects at once
- Most objects should be sleeping
- Wake only when interacted with
- Auto-sleep after 2 seconds of stillness

---

## Interaction Examples

### Example 1: Picking Up Chalk

**User Action**: Hand touches chalk, pulls trigger

**System Response**:
1. XRGrabInteractable detects grab
2. PhysicsInteractable.OnGrab() fires
3. Haptic pulse (0.3 intensity, 0.1s)
4. Grab sound plays (soft tap)
5. Object parents to controller
6. Rigidbody becomes kinematic (no physics while held)
7. Follows hand position 1:1

**While Holding**:
- Feels weightless in hand
- Can write on blackboard (triggers haptic + sound)
- Can throw (velocity transferred on release)

**On Release**:
1. PhysicsInteractable.OnRelease() fires
2. Rigidbody becomes dynamic again
3. Release sound plays
4. Object gets velocity from hand movement
5. Falls with gravity
6. Bounces on floor (soft)
7. Rolls slightly
8. Comes to rest
9. After 30s, returns to chalk tray

### Example 2: Opening Desk Lid

**User Action**: Hand grabs desk edge, pulls up

**System Response**:
1. XRGrabInteractable on lid detects grab
2. Haptic feedback (0.4 intensity)
3. Wood grab sound
4. Hinge Joint rotates lid
5. Lid opens smoothly (limited to 60°)
6. Squeak sound during movement
7. Haptic feedback continues while moving
8. Stops at open position
9. Stays open (no auto-close)

**Interaction with Open Desk**:
- Can see inside (storage)
- Can place objects inside
- Can retrieve objects from inside
- Objects stay in desk (collider bounds)

### Example 3: Sitting in Desk

**User Action**: Teleports to desk, trigger to sit

**System Response**:
1. StudentDesk.SitDown() called
2. Camera smoothly moves to seat position (0.5s)
3. View height lowers to child height
4. Desk lid closes (if open)
5. Desk highlight effect (subtle glow)
6. Nearby props become easier to reach
7. Activity appears on blackboard
8. Comfortable sitting position maintained

**While Sitting**:
- Can reach items on desk
- Can write with chalk (if holding)
- Can turn head to look around
- Can stand up with button press

---

## Testing Checklist

### Physics Testing

- [ ] Objects fall with realistic gravity
- [ ] Objects bounce appropriately for material
- [ ] Stackable objects stack stably
- [ ] Sliding objects slide realistically
- [ ] Throwing has accurate trajectory
- [ ] Collisions sound right for materials
- [ ] Heavy objects feel heavy (haptics)
- [ ] Light objects feel light
- [ ] No objects escape room (invisible walls)
- [ ] No objects stuck in geometry

### Interaction Testing

- [ ] Can grab all grabbable objects
- [ ] Grab feels responsive (<0.1s latency)
- [ ] Release works predictably
- [ ] Throwing velocity is accurate
- [ ] Two-hand grab works (if implemented)
- [ ] Haptics feel appropriate
- [ ] Sounds trigger correctly
- [ ] Objects reset when needed
- [ ] Desk lids open/close smoothly
- [ ] Door opens/closes smoothly

### Performance Testing

- [ ] Maintains 90 FPS with physics active
- [ ] No physics stutters or jank
- [ ] Sleeping objects don't wake unnecessarily
- [ ] Max physics objects respected (50)
- [ ] No memory leaks from physics
- [ ] Collision detection is accurate
- [ ] No tunneling (fast objects pass through walls)

### Safety Testing

- [ ] Children can't break anything
- [ ] No sharp/dangerous interactions
- [ ] Objects can't hurt player
- [ ] Reset function works
- [ ] Auto-cleanup works
- [ ] No inappropriate object use possible
- [ ] COPPA compliance maintained

---

## Next Steps

### Implementation Priority

1. **Add PhysicsInteractable script to all props** (1 hour)
2. **Configure rigidbodies with proper masses** (30 min)
3. **Create physics materials for each type** (30 min)
4. **Add collision sounds** (1 hour)
5. **Test grab/release on all objects** (1 hour)
6. **Tune haptic feedback** (30 min)
7. **Optimize performance** (1 hour)
8. **Safety testing with children** (ongoing)

**Total**: ~6 hours to full physics implementation

---

*Last Updated: October 9, 2025*
*For Unity 2022.3 LTS / Meta Quest 3*
*Physics & Interaction System Specification*
