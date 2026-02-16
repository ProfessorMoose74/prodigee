using UnityEngine;
using UnityEngine.XR.Interaction.Toolkit;

namespace EG.OASIS.Classroom
{
    /// <summary>
    /// Grabbable Object - Makes any object pickupable and interactable for children
    /// Includes haptic feedback, sound effects, and visual feedback
    /// </summary>
    [RequireComponent(typeof(Rigidbody))]
    [RequireComponent(typeof(XRGrabInteractable))]
    public class GrabbableObject : MonoBehaviour
    {
        #region Inspector Settings
        [Header("Object Properties")]
        [SerializeField] private string objectName = "Object";
        [SerializeField] private ObjectType objectType = ObjectType.Generic;

        [Header("Physics")]
        [SerializeField] private float mass = 0.5f;
        [SerializeField] private float drag = 1f;
        [SerializeField] private bool useGravity = true;
        [SerializeField] private bool isBouncyToy = false;
        [SerializeField] [Range(0f, 1f)] private float bounciness = 0.5f;

        [Header("Haptic Feedback")]
        [SerializeField] private bool enableHaptics = true;
        [SerializeField] [Range(0f, 1f)] private float grabHapticIntensity = 0.3f;
        [SerializeField] [Range(0f, 1f)] private float dropHapticIntensity = 0.2f;
        [SerializeField] private float hapticDuration = 0.1f;

        [Header("Audio")]
        [SerializeField] private AudioClip grabSound;
        [SerializeField] private AudioClip dropSound;
        [SerializeField] private AudioClip squeezeSound; // For toys
        [SerializeField] private AudioClip collisionSound;
        [SerializeField] [Range(0f, 1f)] private float soundVolume = 1f;

        [Header("Visual Feedback")]
        [SerializeField] private bool glowWhenNearby = true;
        [SerializeField] private Color highlightColor = new Color(1f, 1f, 0.5f, 0.5f);
        [SerializeField] private ParticleSystem grabParticles;
        [SerializeField] private ParticleSystem dropParticles;

        [Header("Special Behaviors")]
        [SerializeField] private bool canBeStoredInDesk = true;
        [SerializeField] private bool returnsToOrigin = false;
        [SerializeField] private float returnDelay = 5f;
        #endregion

        #region Object Types
        public enum ObjectType
        {
            Generic,
            Chalk,
            Eraser,
            Book,
            Toy,
            Globe,
            PencilBox,
            StuffedAnimal,
            Bell,
            Apple
        }
        #endregion

        #region Properties
        public bool IsBeingHeld { get; private set; }
        public bool IsHovered { get; private set; }
        #endregion

        #region Private Fields
        private Rigidbody _rigidbody;
        private XRGrabInteractable _grabInteractable;
        private AudioSource _audioSource;
        private Renderer _renderer;
        private Material _originalMaterial;
        private Material _highlightMaterial;
        private Vector3 _originalPosition;
        private Quaternion _originalRotation;
        private Transform _originalParent;
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            InitializeComponents();
            StoreOriginalTransform();
        }

        private void Start()
        {
            SetupGrabInteractable();
        }

        private void OnCollisionEnter(Collision collision)
        {
            // Play collision sound for bouncy/hard impacts
            if (collision.relativeVelocity.magnitude > 1f)
            {
                PlaySound(collisionSound, collision.relativeVelocity.magnitude / 5f);
            }
        }
        #endregion

        #region Initialization
        private void InitializeComponents()
        {
            // Rigidbody setup
            _rigidbody = GetComponent<Rigidbody>();
            _rigidbody.mass = mass;
            _rigidbody.drag = drag;
            _rigidbody.useGravity = useGravity;

            // Make toys bouncy
            if (isBouncyToy)
            {
                PhysicMaterial bouncyMat = new PhysicMaterial();
                bouncyMat.bounciness = bounciness;
                bouncyMat.bounceCombine = PhysicMaterialCombine.Maximum;

                Collider col = GetComponent<Collider>();
                if (col != null)
                {
                    col.material = bouncyMat;
                }
            }

            // Audio setup
            _audioSource = GetComponent<AudioSource>();
            if (_audioSource == null)
            {
                _audioSource = gameObject.AddComponent<AudioSource>();
            }
            _audioSource.spatialBlend = 1f; // 3D sound
            _audioSource.maxDistance = 5f;
            _audioSource.volume = soundVolume;

            // Visual setup
            _renderer = GetComponent<Renderer>();
            if (_renderer != null)
            {
                _originalMaterial = _renderer.material;

                // Create highlight material
                if (glowWhenNearby)
                {
                    _highlightMaterial = new Material(_originalMaterial);
                    _highlightMaterial.SetColor("_EmissionColor", highlightColor);
                    _highlightMaterial.EnableKeyword("_EMISSION");
                }
            }

            // XR Grab Interactable
            _grabInteractable = GetComponent<XRGrabInteractable>();
        }

        private void StoreOriginalTransform()
        {
            _originalPosition = transform.position;
            _originalRotation = transform.rotation;
            _originalParent = transform.parent;
        }

        private void SetupGrabInteractable()
        {
            if (_grabInteractable == null) return;

            // Subscribe to interaction events
            _grabInteractable.selectEntered.AddListener(OnGrabbed);
            _grabInteractable.selectExited.AddListener(OnReleased);
            _grabInteractable.hoverEntered.AddListener(OnHoverEnter);
            _grabInteractable.hoverExited.AddListener(OnHoverExit);
        }
        #endregion

        #region Grab/Release Events
        private void OnGrabbed(SelectEnterEventArgs args)
        {
            IsBeingHeld = true;

            Debug.Log($"[Grabbable] Picked up {objectName}");

            // Play grab sound
            PlaySound(grabSound);

            // Haptic feedback
            if (enableHaptics)
            {
                SendHapticFeedback(args.interactorObject, grabHapticIntensity, hapticDuration);
            }

            // Visual feedback
            if (grabParticles != null)
            {
                grabParticles.Play();
            }

            // Stop any return coroutine
            StopAllCoroutines();

            // Special behavior for specific objects
            OnGrabbedSpecialBehavior();
        }

        private void OnReleased(SelectExitEventArgs args)
        {
            IsBeingHeld = false;

            Debug.Log($"[Grabbable] Released {objectName}");

            // Play drop sound
            PlaySound(dropSound);

            // Haptic feedback
            if (enableHaptics)
            {
                SendHapticFeedback(args.interactorObject, dropHapticIntensity, hapticDuration);
            }

            // Visual feedback
            if (dropParticles != null)
            {
                dropParticles.Play();
            }

            // Return to origin after delay
            if (returnsToOrigin)
            {
                StartCoroutine(ReturnToOriginAfterDelay());
            }

            // Check if dropped into desk
            CheckIfDroppedInDesk();
        }

        private void OnHoverEnter(HoverEnterEventArgs args)
        {
            IsHovered = true;

            // Show highlight
            if (glowWhenNearby && _renderer != null && _highlightMaterial != null)
            {
                _renderer.material = _highlightMaterial;
            }
        }

        private void OnHoverExit(HoverExitEventArgs args)
        {
            IsHovered = false;

            // Remove highlight
            if (_renderer != null && _originalMaterial != null)
            {
                _renderer.material = _originalMaterial;
            }
        }
        #endregion

        #region Special Behaviors
        private void OnGrabbedSpecialBehavior()
        {
            switch (objectType)
            {
                case ObjectType.Bell:
                    // Ring the bell!
                    PlaySound(squeezeSound);
                    break;

                case ObjectType.StuffedAnimal:
                    // Squeaky toy sound
                    PlaySound(squeezeSound);
                    break;

                case ObjectType.Book:
                    // Could open to a random page
                    Debug.Log($"[Book] Opened to page {Random.Range(1, 100)}");
                    break;
            }
        }

        private void CheckIfDroppedInDesk()
        {
            if (!canBeStoredInDesk) return;

            // Check if dropped near an open desk
            Collider[] nearbyColliders = Physics.OverlapSphere(transform.position, 0.5f);
            foreach (var col in nearbyColliders)
            {
                StudentDesk desk = col.GetComponentInParent<StudentDesk>();
                if (desk != null && desk.IsOpen)
                {
                    desk.StoreItem(gameObject);
                    Debug.Log($"[Grabbable] {objectName} stored in desk #{desk.DeskNumber}");
                    break;
                }
            }
        }
        #endregion

        #region Return to Origin
        private System.Collections.IEnumerator ReturnToOriginAfterDelay()
        {
            yield return new WaitForSeconds(returnDelay);

            if (!IsBeingHeld)
            {
                ReturnToOrigin();
            }
        }

        public void ReturnToOrigin()
        {
            transform.position = _originalPosition;
            transform.rotation = _originalRotation;
            transform.parent = _originalParent;

            // Reset velocity
            _rigidbody.velocity = Vector3.zero;
            _rigidbody.angularVelocity = Vector3.zero;

            Debug.Log($"[Grabbable] {objectName} returned to origin");
        }
        #endregion

        #region Audio
        private void PlaySound(AudioClip clip, float volumeMultiplier = 1f)
        {
            if (_audioSource != null && clip != null)
            {
                _audioSource.PlayOneShot(clip, soundVolume * volumeMultiplier);
            }
        }
        #endregion

        #region Haptic Feedback
        private void SendHapticFeedback(IXRInteractor interactor, float intensity, float duration)
        {
            if (interactor is XRBaseControllerInteractor controllerInteractor)
            {
                if (controllerInteractor.xrController != null)
                {
                    controllerInteractor.xrController.SendHapticImpulse(intensity, duration);
                }
            }
        }
        #endregion

        #region Public Methods
        /// <summary>
        /// Make object squeeze (for toys)
        /// </summary>
        public void Squeeze()
        {
            if (objectType == ObjectType.StuffedAnimal || objectType == ObjectType.Toy)
            {
                PlaySound(squeezeSound);

                // Scale animation
                StartCoroutine(SqueezeAnimation());
            }
        }

        private System.Collections.IEnumerator SqueezeAnimation()
        {
            Vector3 originalScale = transform.localScale;
            Vector3 squeezedScale = originalScale * 0.9f;

            float elapsed = 0f;
            float duration = 0.2f;

            // Squeeze in
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                transform.localScale = Vector3.Lerp(originalScale, squeezedScale, elapsed / duration);
                yield return null;
            }

            elapsed = 0f;

            // Release
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                transform.localScale = Vector3.Lerp(squeezedScale, originalScale, elapsed / duration);
                yield return null;
            }

            transform.localScale = originalScale;
        }
        #endregion

        #region Gizmos
        private void OnDrawGizmos()
        {
            if (returnsToOrigin)
            {
                Gizmos.color = Color.cyan;
                Gizmos.DrawWireSphere(_originalPosition, 0.1f);
                Gizmos.DrawLine(transform.position, _originalPosition);
            }
        }
        #endregion
    }
}
