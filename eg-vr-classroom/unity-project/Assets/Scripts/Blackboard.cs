using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace EG.OASIS.Classroom
{
    /// <summary>
    /// Interactive Blackboard - Main teaching surface for classroom activities
    /// Supports chalk drawing, text display, and image projection
    /// </summary>
    [RequireComponent(typeof(BoxCollider))]
    public class Blackboard : MonoBehaviour
    {
        #region Inspector Settings
        [Header("Blackboard Properties")]
        [SerializeField] private Vector2 boardSize = new Vector2(3f, 2f);
        [SerializeField] private Material blackboardMaterial;
        [SerializeField] private Color chalkColor = Color.white;
        [SerializeField] private float chalkThickness = 0.02f;

        [Header("Text Display")]
        [SerializeField] private Canvas textCanvas;
        [SerializeField] private TextMeshProUGUI titleText;
        [SerializeField] private TextMeshProUGUI contentText;

        [Header("Drawing")]
        [SerializeField] private bool allowDrawing = true;
        [SerializeField] private float drawingSmoothing = 0.5f;
        [SerializeField] private int maxDrawPoints = 1000;

        [Header("Audio")]
        [SerializeField] private AudioClip chalkWriteSound;
        [SerializeField] private AudioClip eraseSound;
        [SerializeField] private AudioSource audioSource;
        #endregion

        #region Private Fields
        private RenderTexture _drawingTexture;
        private Texture2D _displayTexture;
        private List<Vector2> _currentStroke = new List<Vector2>();
        private bool _isDrawing = false;
        private Vector3 _lastDrawPosition;
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            InitializeBlackboard();
        }

        private void OnDestroy()
        {
            if (_drawingTexture != null)
            {
                _drawingTexture.Release();
            }
        }
        #endregion

        #region Initialization
        private void InitializeBlackboard()
        {
            // Create drawing texture
            _drawingTexture = new RenderTexture(1024, 1024, 0);
            _drawingTexture.Create();

            // Apply to material
            if (blackboardMaterial != null)
            {
                blackboardMaterial.mainTexture = _drawingTexture;
            }

            // Setup text canvas
            if (textCanvas != null)
            {
                textCanvas.worldCamera = Camera.main;
            }

            // Setup audio
            if (audioSource == null)
            {
                audioSource = gameObject.AddComponent<AudioSource>();
                audioSource.spatialBlend = 1f; // 3D sound
                audioSource.maxDistance = 10f;
            }

            // Clear board
            Clear();

            Debug.Log("[Blackboard] Initialized");
        }
        #endregion

        #region Text Display
        /// <summary>
        /// Set title text on blackboard
        /// </summary>
        public void SetTitle(string title)
        {
            if (titleText != null)
            {
                titleText.text = title;
                titleText.gameObject.SetActive(true);
            }
        }

        /// <summary>
        /// Write text on blackboard
        /// </summary>
        public void WriteText(string text)
        {
            if (contentText != null)
            {
                contentText.text = text;
                contentText.gameObject.SetActive(true);
            }

            PlaySound(chalkWriteSound);
        }

        /// <summary>
        /// Append text to existing content
        /// </summary>
        public void AppendText(string text)
        {
            if (contentText != null)
            {
                contentText.text += text;
            }

            PlaySound(chalkWriteSound);
        }
        #endregion

        #region Drawing
        /// <summary>
        /// Start drawing on blackboard
        /// </summary>
        public void StartDrawing(Vector3 worldPosition)
        {
            if (!allowDrawing) return;

            _isDrawing = true;
            _currentStroke.Clear();
            _lastDrawPosition = worldPosition;

            // Convert world position to UV coordinates
            Vector2 uv = WorldToUV(worldPosition);
            _currentStroke.Add(uv);

            PlaySound(chalkWriteSound, true);
        }

        /// <summary>
        /// Continue drawing on blackboard
        /// </summary>
        public void ContinueDrawing(Vector3 worldPosition)
        {
            if (!_isDrawing || !allowDrawing) return;

            // Check if moved enough
            if (Vector3.Distance(worldPosition, _lastDrawPosition) < drawingSmoothing)
            {
                return;
            }

            Vector2 uv = WorldToUV(worldPosition);
            _currentStroke.Add(uv);

            // Draw line from last point to current
            if (_currentStroke.Count > 1)
            {
                DrawLineOnTexture(
                    _currentStroke[_currentStroke.Count - 2],
                    uv
                );
            }

            _lastDrawPosition = worldPosition;

            // Limit stroke points
            if (_currentStroke.Count > maxDrawPoints)
            {
                EndDrawing();
                StartDrawing(worldPosition);
            }
        }

        /// <summary>
        /// End drawing on blackboard
        /// </summary>
        public void EndDrawing()
        {
            _isDrawing = false;
            _currentStroke.Clear();

            if (audioSource != null && audioSource.isPlaying)
            {
                audioSource.Stop();
            }
        }

        private void DrawLineOnTexture(Vector2 from, Vector2 to)
        {
            // Convert UV to pixel coordinates
            int x0 = (int)(from.x * _drawingTexture.width);
            int y0 = (int)(from.y * _drawingTexture.height);
            int x1 = (int)(to.x * _drawingTexture.width);
            int y1 = (int)(to.y * _drawingTexture.height);

            // Simple line drawing (Bresenham's algorithm)
            RenderTexture.active = _drawingTexture;

            // TODO: Implement actual drawing on render texture
            // For now, placeholder

            RenderTexture.active = null;
        }

        private Vector2 WorldToUV(Vector3 worldPosition)
        {
            // Convert world position to local position
            Vector3 localPos = transform.InverseTransformPoint(worldPosition);

            // Convert to UV coordinates (0-1)
            float u = (localPos.x / boardSize.x) + 0.5f;
            float v = (localPos.y / boardSize.y) + 0.5f;

            return new Vector2(u, v);
        }
        #endregion

        #region Image Display
        /// <summary>
        /// Display image on blackboard
        /// </summary>
        public void DisplayImage(Texture2D image)
        {
            if (image == null) return;

            _displayTexture = image;

            // Apply to material
            if (blackboardMaterial != null)
            {
                blackboardMaterial.mainTexture = image;
            }
        }
        #endregion

        #region Clear
        /// <summary>
        /// Clear blackboard completely
        /// </summary>
        public void Clear()
        {
            // Clear drawing texture
            RenderTexture.active = _drawingTexture;
            GL.Clear(true, true, new Color(0.1f, 0.1f, 0.1f, 1f)); // Dark slate color
            RenderTexture.active = null;

            // Clear text
            if (titleText != null) titleText.text = "";
            if (contentText != null) contentText.text = "";

            // Hide text displays
            if (titleText != null) titleText.gameObject.SetActive(false);
            if (contentText != null) contentText.gameObject.SetActive(false);

            PlaySound(eraseSound);

            Debug.Log("[Blackboard] Cleared");
        }

        /// <summary>
        /// Erase specific area
        /// </summary>
        public void Erase(Vector3 worldPosition, float radius)
        {
            Vector2 uv = WorldToUV(worldPosition);

            // Convert UV to pixel coordinates
            int x = (int)(uv.x * _drawingTexture.width);
            int y = (int)(uv.y * _drawingTexture.height);
            int pixelRadius = (int)(radius * _drawingTexture.width);

            // TODO: Implement erasing circle
            // For now, placeholder

            PlaySound(eraseSound);
        }
        #endregion

        #region Audio
        private void PlaySound(AudioClip clip, bool loop = false)
        {
            if (audioSource != null && clip != null)
            {
                audioSource.clip = clip;
                audioSource.loop = loop;
                audioSource.Play();
            }
        }
        #endregion

        #region Interaction
        /// <summary>
        /// Handle ray interaction (from VR controller)
        /// </summary>
        public void HandleRayInteraction(Vector3 hitPoint, bool triggerPressed)
        {
            if (triggerPressed)
            {
                if (!_isDrawing)
                {
                    StartDrawing(hitPoint);
                }
                else
                {
                    ContinueDrawing(hitPoint);
                }
            }
            else if (_isDrawing)
            {
                EndDrawing();
            }
        }
        #endregion

        #region Gizmos
        private void OnDrawGizmos()
        {
            // Draw blackboard bounds
            Gizmos.color = Color.green;
            Gizmos.DrawWireCube(transform.position, new Vector3(boardSize.x, boardSize.y, 0.1f));
        }
        #endregion
    }
}
