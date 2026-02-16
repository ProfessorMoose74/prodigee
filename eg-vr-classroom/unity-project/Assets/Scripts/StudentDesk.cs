using UnityEngine;
using UnityEngine.XR.Interaction.Toolkit;

namespace EG.OASIS.Classroom
{
    /// <summary>
    /// Student Desk - Individual school desk with storage and sitting mechanic
    /// Represents a classic 1920s wooden school desk
    /// </summary>
    public class StudentDesk : MonoBehaviour
    {
        #region Inspector Settings
        [Header("Desk Properties")]
        [SerializeField] private int deskNumber = 1;
        [SerializeField] private Transform seatPosition;
        [SerializeField] private Transform deskLidPivot;

        [Header("Interaction")]
        [SerializeField] private bool canOpen = true;
        [SerializeField] private float openAngle = 60f;
        [SerializeField] private float openSpeed = 2f;

        [Header("Sitting")]
        [SerializeField] private Transform cameraTargetPosition;
        [SerializeField] private float sitHeight = 0.7f;
        [SerializeField] private float sitDuration = 0.5f;

        [Header("Visual")]
        [SerializeField] private Renderer deskRenderer;
        [SerializeField] private Material normalMaterial;
        [SerializeField] private Material highlightMaterial;
        [SerializeField] private Color playerDeskColor = Color.cyan;

        [Header("Audio")]
        [SerializeField] private AudioClip deskOpenSound;
        [SerializeField] private AudioClip deskCloseSound;
        [SerializeField] private AudioSource audioSource;
        #endregion

        #region Properties
        public bool IsOccupied { get; private set; }
        public bool IsPlayerDesk { get; private set; }
        public bool IsOpen { get; private set; }
        public int DeskNumber => deskNumber;
        #endregion

        #region Private Fields
        private Quaternion _closedRotation;
        private Quaternion _openRotation;
        private bool _isAnimating = false;
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            // Setup audio
            if (audioSource == null)
            {
                audioSource = gameObject.AddComponent<AudioSource>();
                audioSource.spatialBlend = 1f;
                audioSource.maxDistance = 5f;
            }

            // Calculate rotations
            if (deskLidPivot != null)
            {
                _closedRotation = deskLidPivot.localRotation;
                _openRotation = _closedRotation * Quaternion.Euler(-openAngle, 0, 0);
            }

            // Create seat position if not assigned
            if (seatPosition == null)
            {
                GameObject seatGO = new GameObject("SeatPosition");
                seatGO.transform.SetParent(transform);
                seatGO.transform.localPosition = new Vector3(0, 0.4f, 0);
                seatPosition = seatGO.transform;
            }

            // Create camera target if not assigned
            if (cameraTargetPosition == null)
            {
                GameObject camTarget = new GameObject("CameraTarget");
                camTarget.transform.SetParent(seatPosition);
                camTarget.transform.localPosition = new Vector3(0, sitHeight, 0);
                cameraTargetPosition = camTarget.transform;
            }
        }

        private void Update()
        {
            // Animate lid opening/closing
            if (_isAnimating && deskLidPivot != null)
            {
                Quaternion targetRotation = IsOpen ? _openRotation : _closedRotation;
                deskLidPivot.localRotation = Quaternion.Lerp(
                    deskLidPivot.localRotation,
                    targetRotation,
                    Time.deltaTime * openSpeed
                );

                // Check if animation complete
                if (Quaternion.Angle(deskLidPivot.localRotation, targetRotation) < 0.1f)
                {
                    deskLidPivot.localRotation = targetRotation;
                    _isAnimating = false;
                }
            }
        }
        #endregion

        #region Desk Lid
        /// <summary>
        /// Open desk lid
        /// </summary>
        public void Open()
        {
            if (!canOpen || IsOpen) return;

            IsOpen = true;
            _isAnimating = true;

            // Play sound
            PlaySound(deskOpenSound);

            Debug.Log($"[Desk {deskNumber}] Opening");
        }

        /// <summary>
        /// Close desk lid
        /// </summary>
        public void Close()
        {
            if (!IsOpen) return;

            IsOpen = false;
            _isAnimating = true;

            // Play sound
            PlaySound(deskCloseSound);

            Debug.Log($"[Desk {deskNumber}] Closing");
        }

        /// <summary>
        /// Toggle desk open/closed
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
        #endregion

        #region Sitting
        /// <summary>
        /// Sit at desk
        /// </summary>
        public void SitDown()
        {
            if (IsOccupied && !IsPlayerDesk) return;

            Debug.Log($"[Desk {deskNumber}] Sitting down");

            // Mark as occupied
            IsOccupied = true;

            // Move player camera to seat position
            if (Camera.main != null && cameraTargetPosition != null)
            {
                StartCoroutine(MoveCamera(cameraTargetPosition.position, sitDuration));
            }

            // Close desk if open
            if (IsOpen)
            {
                Close();
            }
        }

        /// <summary>
        /// Stand up from desk
        /// </summary>
        public void StandUp()
        {
            if (!IsOccupied) return;

            Debug.Log($"[Desk {deskNumber}] Standing up");

            // Only mark as unoccupied if not player desk
            if (!IsPlayerDesk)
            {
                IsOccupied = false;
            }
        }

        private System.Collections.IEnumerator MoveCamera(Vector3 target, float duration)
        {
            Vector3 startPos = Camera.main.transform.position;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;

                // Smooth step interpolation
                t = t * t * (3f - 2f * t);

                Camera.main.transform.position = Vector3.Lerp(startPos, target, t);

                yield return null;
            }

            Camera.main.transform.position = target;
        }
        #endregion

        #region Player Assignment
        /// <summary>
        /// Assign this desk to the player
        /// </summary>
        public void AssignToPlayer()
        {
            IsPlayerDesk = true;
            IsOccupied = true;

            // Change desk color/material
            if (deskRenderer != null)
            {
                deskRenderer.material.color = playerDeskColor;
            }

            Debug.Log($"[Desk {deskNumber}] Assigned to player");
        }

        /// <summary>
        /// Remove player assignment
        /// </summary>
        public void UnassignPlayer()
        {
            IsPlayerDesk = false;
            IsOccupied = false;

            // Restore normal color
            if (deskRenderer != null && normalMaterial != null)
            {
                deskRenderer.material = normalMaterial;
            }
        }
        #endregion

        #region Visual Feedback
        /// <summary>
        /// Highlight desk (for UI feedback)
        /// </summary>
        public void Highlight(bool enabled)
        {
            if (deskRenderer == null) return;

            if (enabled && highlightMaterial != null)
            {
                deskRenderer.material = highlightMaterial;
            }
            else if (normalMaterial != null)
            {
                deskRenderer.material = normalMaterial;
            }
        }
        #endregion

        #region Storage
        /// <summary>
        /// Store item in desk
        /// </summary>
        public void StoreItem(GameObject item)
        {
            // Hide item and parent to desk
            item.SetActive(false);
            item.transform.SetParent(transform);

            Debug.Log($"[Desk {deskNumber}] Stored item: {item.name}");
        }

        /// <summary>
        /// Retrieve item from desk
        /// </summary>
        public GameObject RetrieveItem(string itemName)
        {
            // Find item by name
            Transform itemTransform = transform.Find(itemName);
            if (itemTransform != null)
            {
                GameObject item = itemTransform.gameObject;
                item.SetActive(true);
                item.transform.SetParent(null);

                Debug.Log($"[Desk {deskNumber}] Retrieved item: {itemName}");
                return item;
            }

            return null;
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

        #region Interaction
        /// <summary>
        /// Handle interaction from VR controller
        /// </summary>
        public void OnInteract()
        {
            // If player is nearby and standing, sit down
            // If already sitting, toggle desk lid
            if (IsPlayerDesk && IsOccupied)
            {
                Toggle();
            }
            else if (!IsOccupied)
            {
                SitDown();
            }
        }
        #endregion

        #region Gizmos
        private void OnDrawGizmos()
        {
            // Draw seat position
            if (seatPosition != null)
            {
                Gizmos.color = Color.blue;
                Gizmos.DrawWireSphere(seatPosition.position, 0.1f);
            }

            // Draw camera target
            if (cameraTargetPosition != null)
            {
                Gizmos.color = Color.yellow;
                Gizmos.DrawWireSphere(cameraTargetPosition.position, 0.05f);
                Gizmos.DrawLine(seatPosition.position, cameraTargetPosition.position);
            }

            // Draw desk number
            #if UNITY_EDITOR
            if (seatPosition != null)
            {
                UnityEditor.Handles.Label(
                    seatPosition.position + Vector3.up * 0.5f,
                    $"Desk #{deskNumber}"
                );
            }
            #endif
        }
        #endregion
    }
}
