using UnityEngine;
using UnityEngine.XR.Interaction.Toolkit;
using TMPro;

namespace EG.OASIS.Classroom
{
    /// <summary>
    /// Interactive Globe - Educational world globe children can spin and explore
    /// Shows country names, facts, and connects to daily landmark system
    /// </summary>
    public class InteractiveGlobe : MonoBehaviour
    {
        #region Inspector Settings
        [Header("Globe Components")]
        [SerializeField] private Transform globeSphere; // The actual rotating sphere
        [SerializeField] private Transform standBase; // Static base
        [SerializeField] private Material globeMaterial;

        [Header("Rotation")]
        [SerializeField] private bool canSpin = true;
        [SerializeField] private float spinSensitivity = 50f;
        [SerializeField] private float friction = 0.95f; // How quickly it slows down
        [SerializeField] private float minSpinSpeed = 0.1f;

        [Header("Country Info Display")]
        [SerializeField] private Canvas infoCanvas;
        [SerializeField] private TextMeshProUGUI countryNameText;
        [SerializeField] private TextMeshProUGUI countryFactText;
        [SerializeField] private float displayDuration = 5f;

        [Header("Audio")]
        [SerializeField] private AudioClip spinSound;
        [SerializeField] private AudioClip clickCountrySound;
        [SerializeField] private AudioClip funFactSound;
        [SerializeField] private AudioSource audioSource;

        [Header("Visual Feedback")]
        [SerializeField] private ParticleSystem spinParticles;
        [SerializeField] private Light pointLight; // Highlight touched country
        [SerializeField] private Color highlightColor = Color.yellow;

        [Header("Haptic Feedback")]
        [SerializeField] private bool enableHaptics = true;
        [SerializeField] [Range(0f, 1f)] private float hapticIntensity = 0.2f;
        #endregion

        #region Properties
        public bool IsSpinning { get; private set; }
        public bool IsBeingTouched { get; private set; }
        public string CurrentCountry { get; private set; }
        #endregion

        #region Private Fields
        private Vector3 _spinVelocity = Vector3.zero;
        private Vector3 _lastTouchPosition;
        private bool _infoDisplayActive = false;
        private XRGrabInteractable _grabInteractable;
        #endregion

        #region Country Data
        private System.Collections.Generic.Dictionary<string, string> _countryFacts = new System.Collections.Generic.Dictionary<string, string>()
        {
            {"United States", "Home to over 330 million people and 50 states!"},
            {"Brazil", "Has the largest rainforest in the world - the Amazon!"},
            {"Egypt", "Ancient pyramids built over 4,500 years ago!"},
            {"China", "The Great Wall is over 13,000 miles long!"},
            {"Australia", "Home to kangaroos, koalas, and platypuses!"},
            {"France", "The Eiffel Tower has 1,665 steps to the top!"},
            {"Japan", "Land of the rising sun with over 6,800 islands!"},
            {"Kenya", "Amazing wildlife including lions, elephants, and giraffes!"},
            {"India", "Over 1.4 billion people and 22 official languages!"},
            {"Antarctica", "The coldest place on Earth - no permanent residents!"}
        };
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            InitializeGlobe();
        }

        private void Update()
        {
            UpdateSpinning();
        }
        #endregion

        #region Initialization
        private void InitializeGlobe()
        {
            // Find components if not assigned
            if (globeSphere == null)
            {
                globeSphere = transform.Find("GlobeSphere");
            }

            // Setup audio
            if (audioSource == null)
            {
                audioSource = gameObject.AddComponent<AudioSource>();
                audioSource.spatialBlend = 1f;
                audioSource.maxDistance = 5f;
            }

            // Setup grab interactable
            _grabInteractable = globeSphere.GetComponent<XRGrabInteractable>();
            if (_grabInteractable == null)
            {
                _grabInteractable = globeSphere.gameObject.AddComponent<XRGrabInteractable>();
            }

            _grabInteractable.selectEntered.AddListener(OnGlobeTouched);
            _grabInteractable.selectExited.AddListener(OnGlobeReleased);

            // Setup info canvas
            if (infoCanvas != null)
            {
                infoCanvas.gameObject.SetActive(false);
                infoCanvas.worldCamera = Camera.main;
            }

            Debug.Log("[Globe] Interactive globe initialized");
        }
        #endregion

        #region Spinning
        private void UpdateSpinning()
        {
            if (!canSpin) return;

            // Apply spin velocity
            if (_spinVelocity.magnitude > minSpinSpeed)
            {
                globeSphere.Rotate(_spinVelocity * Time.deltaTime, Space.World);

                // Apply friction
                _spinVelocity *= friction;

                IsSpinning = true;

                // Play spin sound if not already playing
                if (audioSource != null && !audioSource.isPlaying)
                {
                    PlaySound(spinSound, true);
                }

                // Show spin particles
                if (spinParticles != null && !spinParticles.isPlaying)
                {
                    spinParticles.Play();
                }
            }
            else if (IsSpinning)
            {
                // Stopped spinning
                IsSpinning = false;
                _spinVelocity = Vector3.zero;

                // Stop sound
                if (audioSource != null && audioSource.isPlaying)
                {
                    audioSource.Stop();
                }

                // Stop particles
                if (spinParticles != null)
                {
                    spinParticles.Stop();
                }
            }
        }

        /// <summary>
        /// Spin globe with velocity
        /// </summary>
        public void Spin(Vector3 axis, float speed)
        {
            _spinVelocity = axis * speed;
        }

        /// <summary>
        /// Spin to specific rotation (for educational activities)
        /// </summary>
        public void SpinToCountry(string countryName, float duration = 2f)
        {
            // Calculate rotation to show country
            // This would need country coordinate data

            StartCoroutine(SmoothRotateTo(Quaternion.identity, duration)); // Placeholder

            Debug.Log($"[Globe] Spinning to show {countryName}");
        }

        private System.Collections.IEnumerator SmoothRotateTo(Quaternion targetRotation, float duration)
        {
            Quaternion startRotation = globeSphere.rotation;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;

                // Smooth step
                t = t * t * (3f - 2f * t);

                globeSphere.rotation = Quaternion.Slerp(startRotation, targetRotation, t);

                yield return null;
            }

            globeSphere.rotation = targetRotation;
        }
        #endregion

        #region Touch Interaction
        private void OnGlobeTouched(SelectEnterEventArgs args)
        {
            IsBeingTouched = true;

            // Get touch point on globe
            if (args.interactorObject is IXRInteractor interactor)
            {
                // Calculate spin based on touch movement
                _lastTouchPosition = interactor.transform.position;
            }

            PlaySound(clickCountrySound);

            // Haptic feedback
            if (enableHaptics)
            {
                SendHapticFeedback(args.interactorObject, hapticIntensity, 0.1f);
            }

            Debug.Log("[Globe] Touched");
        }

        private void OnGlobeReleased(SelectExitEventArgs args)
        {
            IsBeingTouched = false;

            // Calculate release velocity for spin
            if (args.interactorObject is IXRInteractor interactor)
            {
                Vector3 movement = interactor.transform.position - _lastTouchPosition;
                Vector3 spinAxis = Vector3.Cross(movement, globeSphere.forward).normalized;
                float spinSpeed = movement.magnitude * spinSensitivity;

                Spin(spinAxis, spinSpeed);
            }

            Debug.Log("[Globe] Released");
        }

        /// <summary>
        /// Touch country to show info
        /// </summary>
        public void TouchCountry(Vector3 worldPosition)
        {
            // Raycast from touch point to globe center
            RaycastHit hit;
            Vector3 direction = (worldPosition - globeSphere.position).normalized;

            if (Physics.Raycast(globeSphere.position, direction, out hit, 1f))
            {
                // Get country at this position (would need texture mapping data)
                string country = GetCountryAtPosition(hit.textureCoord);

                if (!string.IsNullOrEmpty(country))
                {
                    ShowCountryInfo(country);
                }
            }
        }

        private string GetCountryAtPosition(Vector2 uv)
        {
            // Placeholder - would need actual country texture map
            // For now, randomly select a country for demonstration

            string[] countries = new string[]
            {
                "United States", "Brazil", "Egypt", "China",
                "Australia", "France", "Japan", "Kenya", "India"
            };

            return countries[Random.Range(0, countries.Length)];
        }
        #endregion

        #region Country Information
        /// <summary>
        /// Display country name and fun fact
        /// </summary>
        public void ShowCountryInfo(string country)
        {
            CurrentCountry = country;

            // Update UI
            if (countryNameText != null)
            {
                countryNameText.text = country;
            }

            if (countryFactText != null && _countryFacts.ContainsKey(country))
            {
                countryFactText.text = _countryFacts[country];
            }

            // Show canvas
            if (infoCanvas != null)
            {
                infoCanvas.gameObject.SetActive(true);
                infoCanvas.transform.LookAt(Camera.main.transform);
                infoCanvas.transform.Rotate(0, 180, 0); // Face camera
            }

            // Play sound
            PlaySound(funFactSound);

            // Highlight country with light
            if (pointLight != null)
            {
                pointLight.enabled = true;
                pointLight.color = highlightColor;
            }

            // Auto-hide after duration
            if (!_infoDisplayActive)
            {
                StartCoroutine(HideCountryInfoAfterDelay());
            }

            _infoDisplayActive = true;

            Debug.Log($"[Globe] Showing info for {country}");
        }

        /// <summary>
        /// Hide country information
        /// </summary>
        public void HideCountryInfo()
        {
            if (infoCanvas != null)
            {
                infoCanvas.gameObject.SetActive(false);
            }

            if (pointLight != null)
            {
                pointLight.enabled = false;
            }

            _infoDisplayActive = false;
            CurrentCountry = null;
        }

        private System.Collections.IEnumerator HideCountryInfoAfterDelay()
        {
            yield return new WaitForSeconds(displayDuration);

            if (_infoDisplayActive)
            {
                HideCountryInfo();
            }
        }
        #endregion

        #region Audio
        private void PlaySound(AudioClip clip, bool loop = false)
        {
            if (audioSource != null && clip != null)
            {
                if (loop)
                {
                    audioSource.clip = clip;
                    audioSource.loop = true;
                    audioSource.Play();
                }
                else
                {
                    audioSource.PlayOneShot(clip);
                }
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
        /// Connect to daily landmark system (from lunchroom)
        /// </summary>
        public void ShowTodaysCountry(string country)
        {
            SpinToCountry(country, 2f);

            // Wait for spin to finish, then show info
            StartCoroutine(ShowCountryInfoAfterSpin(country, 2.5f));
        }

        private System.Collections.IEnumerator ShowCountryInfoAfterSpin(string country, float delay)
        {
            yield return new WaitForSeconds(delay);
            ShowCountryInfo(country);
        }
        #endregion

        #region Gizmos
        private void OnDrawGizmos()
        {
            // Draw globe boundary
            Gizmos.color = Color.blue;
            if (globeSphere != null)
            {
                Gizmos.DrawWireSphere(globeSphere.position, globeSphere.localScale.x * 0.5f);
            }

            // Draw spin axis
            if (IsSpinning)
            {
                Gizmos.color = Color.red;
                Gizmos.DrawRay(globeSphere.position, _spinVelocity.normalized);
            }
        }
        #endregion
    }
}
