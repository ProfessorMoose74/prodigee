using System.Collections.Generic;
using UnityEngine;
using UnityEngine.XR.Interaction.Toolkit;

namespace EG.OASIS.Locomotion
{
    /// <summary>
    /// Teleportation Manager - Handles VR locomotion via teleportation
    /// Child-friendly, comfort-focused movement system
    /// </summary>
    public class TeleportationManager : MonoBehaviour
    {
        #region Inspector Settings
        [Header("Teleportation Settings")]
        [SerializeField] private float maxTeleportDistance = 10f;
        [SerializeField] private float teleportSpeed = 2f;
        [SerializeField] private bool useVignette = true;
        [SerializeField] private float vignetteDuration = 0.3f;

        [Header("Valid Areas")]
        [SerializeField] private LayerMask teleportLayerMask;
        [SerializeField] private List<TeleportAnchor> teleportAnchors = new List<TeleportAnchor>();

        [Header("Visual Feedback")]
        [SerializeField] private GameObject teleportReticle;
        [SerializeField] private LineRenderer teleportLine;
        [SerializeField] private Material validTeleportMaterial;
        [SerializeField] private Material invalidTeleportMaterial;
        [SerializeField] private float reticleHoverHeight = 0.1f;

        [Header("Audio")]
        [SerializeField] private AudioClip teleportSound;
        [SerializeField] private AudioClip invalidSound;
        [SerializeField] private AudioSource audioSource;

        [Header("Comfort Options")]
        [SerializeField] private bool fadeOnTeleport = true;
        [SerializeField] private float fadeDuration = 0.2f;
        [SerializeField] private bool rotateOnTeleport = false;
        #endregion

        #region Properties
        public bool IsTeleporting { get; private set; }
        public bool CanTeleport => !IsTeleporting;
        #endregion

        #region Private Fields
        private bool _isTeleportActive = false;
        private Vector3 _teleportTarget;
        private bool _validTarget = false;
        private Transform _xrRig;
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            // Find XR Rig
            var xrOrigin = FindObjectOfType<UnityEngine.XR.Interaction.Toolkit.XROrigin>();
            if (xrOrigin != null)
            {
                _xrRig = xrOrigin.transform;
            }

            // Setup audio
            if (audioSource == null)
            {
                audioSource = gameObject.AddComponent<AudioSource>();
            }

            // Hide reticle initially
            if (teleportReticle != null)
            {
                teleportReticle.SetActive(false);
            }

            // Setup line renderer
            if (teleportLine != null)
            {
                teleportLine.enabled = false;
            }
        }

        private void Update()
        {
            // Update visual feedback if teleport is active
            if (_isTeleportActive)
            {
                UpdateTeleportVisuals();
            }
        }
        #endregion

        #region Teleport Activation
        /// <summary>
        /// Activate teleport aiming
        /// </summary>
        public void ActivateTeleport()
        {
            if (!CanTeleport) return;

            _isTeleportActive = true;

            // Show line renderer
            if (teleportLine != null)
            {
                teleportLine.enabled = true;
            }

            Debug.Log("[Teleport] Activated");
        }

        /// <summary>
        /// Deactivate teleport aiming
        /// </summary>
        public void DeactivateTeleport()
        {
            _isTeleportActive = false;

            // Hide visuals
            if (teleportLine != null)
            {
                teleportLine.enabled = false;
            }

            if (teleportReticle != null)
            {
                teleportReticle.SetActive(false);
            }

            Debug.Log("[Teleport] Deactivated");
        }
        #endregion

        #region Teleport Execution
        /// <summary>
        /// Execute teleport to target location
        /// </summary>
        public void ExecuteTeleport()
        {
            if (!_isTeleportActive || !_validTarget || IsTeleporting)
            {
                // Play invalid sound
                if (!_validTarget && invalidSound != null)
                {
                    audioSource.PlayOneShot(invalidSound);
                }
                return;
            }

            StartCoroutine(TeleportCoroutine(_teleportTarget));
        }

        private System.Collections.IEnumerator TeleportCoroutine(Vector3 targetPosition)
        {
            IsTeleporting = true;

            // Fade out
            if (fadeOnTeleport)
            {
                yield return StartCoroutine(FadeScreen(0f, 1f, fadeDuration));
            }

            // Move XR Rig
            if (_xrRig != null)
            {
                Vector3 offset = targetPosition - Camera.main.transform.position;
                offset.y = 0; // Keep Y at rig level
                _xrRig.position += offset;
            }

            // Play teleport sound
            if (teleportSound != null)
            {
                audioSource.PlayOneShot(teleportSound);
            }

            // Fade in
            if (fadeOnTeleport)
            {
                yield return StartCoroutine(FadeScreen(1f, 0f, fadeDuration));
            }

            IsTeleporting = false;
            DeactivateTeleport();

            Debug.Log($"[Teleport] Teleported to {targetPosition}");
        }
        #endregion

        #region Targeting
        /// <summary>
        /// Update teleport target based on controller ray
        /// </summary>
        public void UpdateTeleportTarget(Ray ray)
        {
            if (!_isTeleportActive) return;

            RaycastHit hit;
            _validTarget = false;

            // Raycast to find valid teleport location
            if (Physics.Raycast(ray, out hit, maxTeleportDistance, teleportLayerMask))
            {
                _teleportTarget = hit.point;
                _validTarget = true;

                // Show reticle at hit point
                if (teleportReticle != null)
                {
                    teleportReticle.SetActive(true);
                    teleportReticle.transform.position = hit.point + Vector3.up * reticleHoverHeight;
                    teleportReticle.transform.rotation = Quaternion.LookRotation(hit.normal);
                }
            }
            else
            {
                // No valid target
                if (teleportReticle != null)
                {
                    teleportReticle.SetActive(false);
                }
            }
        }

        /// <summary>
        /// Check if position is valid teleport location
        /// </summary>
        public bool IsValidTeleportLocation(Vector3 position)
        {
            // Check if position is on teleport layer
            RaycastHit hit;
            if (Physics.Raycast(position + Vector3.up * 2f, Vector3.down, out hit, 3f, teleportLayerMask))
            {
                return true;
            }

            return false;
        }
        #endregion

        #region Visual Feedback
        private void UpdateTeleportVisuals()
        {
            if (teleportLine == null) return;

            // Update line renderer
            Vector3 start = Camera.main.transform.position;
            Vector3 end = _validTarget ? _teleportTarget : start + Camera.main.transform.forward * maxTeleportDistance;

            teleportLine.SetPosition(0, start);
            teleportLine.SetPosition(1, end);

            // Change line color based on validity
            if (_validTarget && validTeleportMaterial != null)
            {
                teleportLine.material = validTeleportMaterial;
            }
            else if (!_validTarget && invalidTeleportMaterial != null)
            {
                teleportLine.material = invalidTeleportMaterial;
            }
        }
        #endregion

        #region Anchors
        /// <summary>
        /// Register teleport anchor
        /// </summary>
        public void RegisterAnchor(TeleportAnchor anchor)
        {
            if (!teleportAnchors.Contains(anchor))
            {
                teleportAnchors.Add(anchor);
                Debug.Log($"[Teleport] Registered anchor: {anchor.name}");
            }
        }

        /// <summary>
        /// Unregister teleport anchor
        /// </summary>
        public void UnregisterAnchor(TeleportAnchor anchor)
        {
            if (teleportAnchors.Contains(anchor))
            {
                teleportAnchors.Remove(anchor);
            }
        }

        /// <summary>
        /// Teleport to named anchor
        /// </summary>
        public void TeleportToAnchor(string anchorName)
        {
            TeleportAnchor anchor = teleportAnchors.Find(a => a.name == anchorName);
            if (anchor != null)
            {
                _teleportTarget = anchor.transform.position;
                _validTarget = true;
                StartCoroutine(TeleportCoroutine(_teleportTarget));
            }
            else
            {
                Debug.LogWarning($"[Teleport] Anchor not found: {anchorName}");
            }
        }
        #endregion

        #region Fade Effect
        private System.Collections.IEnumerator FadeScreen(float startAlpha, float endAlpha, float duration)
        {
            // TODO: Implement screen fade using a full-screen quad or post-processing
            // For now, just wait
            yield return new WaitForSeconds(duration);
        }
        #endregion

        #region Public Methods
        /// <summary>
        /// Enable/disable teleportation
        /// </summary>
        public void SetTeleportEnabled(bool enabled)
        {
            this.enabled = enabled;

            if (!enabled)
            {
                DeactivateTeleport();
            }

            Debug.Log($"[Teleport] {(enabled ? "Enabled" : "Disabled")}");
        }
        #endregion
    }

    /// <summary>
    /// Teleport Anchor - Predefined teleport location
    /// </summary>
    public class TeleportAnchor : MonoBehaviour
    {
        [Header("Anchor Properties")]
        [SerializeField] private string anchorName = "Teleport Point";
        [SerializeField] private bool rotatePlayer = false;
        [SerializeField] private float targetRotation = 0f;

        public string AnchorName => anchorName;
        public bool RotatePlayer => rotatePlayer;
        public float TargetRotation => targetRotation;

        private void Start()
        {
            // Register with teleportation manager
            var teleportManager = FindObjectOfType<TeleportationManager>();
            if (teleportManager != null)
            {
                teleportManager.RegisterAnchor(this);
            }
        }

        private void OnDestroy()
        {
            // Unregister
            var teleportManager = FindObjectOfType<TeleportationManager>();
            if (teleportManager != null)
            {
                teleportManager.UnregisterAnchor(this);
            }
        }

        private void OnDrawGizmos()
        {
            // Draw anchor position
            Gizmos.color = Color.cyan;
            Gizmos.DrawWireSphere(transform.position, 0.3f);
            Gizmos.DrawLine(transform.position, transform.position + transform.forward * 0.5f);

            // Draw label
            #if UNITY_EDITOR
            UnityEditor.Handles.Label(transform.position + Vector3.up * 0.5f, anchorName);
            #endif
        }
    }
}
