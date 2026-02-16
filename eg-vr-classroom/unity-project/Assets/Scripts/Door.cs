using UnityEngine;

namespace EG.OASIS.Classroom
{
    /// <summary>
    /// Interactive Door - Opens and closes with sound effects
    /// Classic 1920s wooden door with window
    /// </summary>
    public class Door : MonoBehaviour
    {
        #region Inspector Settings
        [Header("Door Properties")]
        [SerializeField] private Transform doorPivot;
        [SerializeField] private float openAngle = 90f;
        [SerializeField] private float openSpeed = 2f;
        [SerializeField] private bool startsOpen = false;

        [Header("Interaction")]
        [SerializeField] private float interactionDistance = 2f;
        [SerializeField] private bool autoClose = true;
        [SerializeField] private float autoCloseDelay = 3f;

        [Header("Audio")]
        [SerializeField] private AudioClip doorOpenSound;
        [SerializeField] private AudioClip doorCloseSound;
        [SerializeField] private AudioClip doorCreakSound;
        [SerializeField] private AudioSource audioSource;

        [Header("Visual")]
        [SerializeField] private bool showInteractionPrompt = true;
        [SerializeField] private GameObject interactionPrompt;
        #endregion

        #region Properties
        public bool IsOpen { get; private set; }
        public bool IsMoving { get; private set; }
        #endregion

        #region Private Fields
        private Quaternion _closedRotation;
        private Quaternion _openRotation;
        private float _autoCloseTimer;
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            // Setup audio
            if (audioSource == null)
            {
                audioSource = gameObject.AddComponent<AudioSource>();
                audioSource.spatialBlend = 1f; // 3D sound
                audioSource.maxDistance = 10f;
            }

            // Create pivot if not assigned
            if (doorPivot == null)
            {
                GameObject pivotGO = new GameObject("DoorPivot");
                pivotGO.transform.SetParent(transform);
                pivotGO.transform.localPosition = new Vector3(-0.5f, 0, 0); // Left edge
                pivotGO.transform.localRotation = Quaternion.identity;
                doorPivot = pivotGO.transform;

                // Re-parent door mesh to pivot
                Transform doorMesh = transform.GetChild(0);
                if (doorMesh != null)
                {
                    doorMesh.SetParent(doorPivot);
                }
            }

            // Calculate rotations
            _closedRotation = doorPivot.localRotation;
            _openRotation = _closedRotation * Quaternion.Euler(0, openAngle, 0);

            // Set initial state
            if (startsOpen)
            {
                doorPivot.localRotation = _openRotation;
                IsOpen = true;
            }

            // Hide interaction prompt initially
            if (interactionPrompt != null)
            {
                interactionPrompt.SetActive(false);
            }
        }

        private void Update()
        {
            // Animate door movement
            if (IsMoving)
            {
                AnimateDoor();
            }

            // Auto-close timer
            if (IsOpen && autoClose)
            {
                _autoCloseTimer -= Time.deltaTime;
                if (_autoCloseTimer <= 0)
                {
                    Close();
                }
            }

            // Show interaction prompt based on player distance
            if (showInteractionPrompt && interactionPrompt != null)
            {
                UpdateInteractionPrompt();
            }
        }
        #endregion

        #region Door Control
        /// <summary>
        /// Open the door
        /// </summary>
        public void Open()
        {
            if (IsOpen || IsMoving) return;

            IsOpen = true;
            IsMoving = true;

            // Play sound
            PlaySound(doorOpenSound);

            // Reset auto-close timer
            if (autoClose)
            {
                _autoCloseTimer = autoCloseDelay;
            }

            Debug.Log("[Door] Opening");
        }

        /// <summary>
        /// Close the door
        /// </summary>
        public void Close()
        {
            if (!IsOpen || IsMoving) return;

            IsOpen = false;
            IsMoving = true;

            // Play sound
            PlaySound(doorCloseSound);

            Debug.Log("[Door] Closing");
        }

        /// <summary>
        /// Toggle door open/closed
        /// </summary>
        public void Toggle()
        {
            if (IsOpen)
            {
                Close();
            }
            else
            {
                Open();
            }
        }

        private void AnimateDoor()
        {
            Quaternion targetRotation = IsOpen ? _openRotation : _closedRotation;

            doorPivot.localRotation = Quaternion.Lerp(
                doorPivot.localRotation,
                targetRotation,
                Time.deltaTime * openSpeed
            );

            // Check if animation complete
            if (Quaternion.Angle(doorPivot.localRotation, targetRotation) < 0.1f)
            {
                doorPivot.localRotation = targetRotation;
                IsMoving = false;

                // Play creak sound when door stops
                if (doorCreakSound != null && Random.value > 0.5f)
                {
                    PlaySound(doorCreakSound);
                }

                Debug.Log($"[Door] {(IsOpen ? "Opened" : "Closed")}");
            }
        }
        #endregion

        #region Interaction
        /// <summary>
        /// Handle interaction from VR controller or raycast
        /// </summary>
        public void OnInteract()
        {
            if (IsMoving) return;

            Toggle();
        }

        private void UpdateInteractionPrompt()
        {
            if (Camera.main == null) return;

            float distance = Vector3.Distance(Camera.main.transform.position, transform.position);

            if (distance <= interactionDistance)
            {
                interactionPrompt.SetActive(true);
                // Face player
                interactionPrompt.transform.LookAt(Camera.main.transform);
            }
            else
            {
                interactionPrompt.SetActive(false);
            }
        }
        #endregion

        #region Audio
        private void PlaySound(AudioClip clip)
        {
            if (audioSource != null && clip != null)
            {
                audioSource.PlayOneShot(clip);
            }
        }
        #endregion

        #region Public Methods
        /// <summary>
        /// Lock door (prevent opening)
        /// </summary>
        public void Lock()
        {
            enabled = false;
            Debug.Log("[Door] Locked");
        }

        /// <summary>
        /// Unlock door
        /// </summary>
        public void Unlock()
        {
            enabled = true;
            Debug.Log("[Door] Unlocked");
        }

        /// <summary>
        /// Set auto-close behavior
        /// </summary>
        public void SetAutoClose(bool enabled, float delay = 3f)
        {
            autoClose = enabled;
            autoCloseDelay = delay;
        }
        #endregion

        #region Gizmos
        private void OnDrawGizmos()
        {
            // Draw door pivot
            if (doorPivot != null)
            {
                Gizmos.color = Color.yellow;
                Gizmos.DrawWireSphere(doorPivot.position, 0.1f);
            }

            // Draw interaction range
            Gizmos.color = Color.green;
            Gizmos.DrawWireSphere(transform.position, interactionDistance);

            // Draw open arc
            if (doorPivot != null)
            {
                Gizmos.color = Color.blue;
                Vector3 start = doorPivot.forward;
                Vector3 end = Quaternion.Euler(0, openAngle, 0) * doorPivot.forward;
                Gizmos.DrawLine(doorPivot.position, doorPivot.position + start * 1.5f);
                Gizmos.DrawLine(doorPivot.position, doorPivot.position + end * 1.5f);
            }
        }
        #endregion
    }
}
