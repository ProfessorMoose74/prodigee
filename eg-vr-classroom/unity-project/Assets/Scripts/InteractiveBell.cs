using UnityEngine;
using UnityEngine.XR.Interaction.Toolkit;

namespace EG.OASIS.Classroom
{
    /// <summary>
    /// Interactive Bell - Classic school bell children can ring
    /// Makes a satisfying "ding!" sound and visual feedback
    /// </summary>
    [RequireComponent(typeof(GrabbableObject))]
    public class InteractiveBell : MonoBehaviour
    {
        #region Inspector Settings
        [Header("Bell Properties")]
        [SerializeField] private BellType bellType = BellType.DeskBell;
        [SerializeField] private float ringCooldown = 0.5f; // Prevent spam ringing

        [Header("Visual Components")]
        [SerializeField] private Transform bellButton; // The part that presses down
        [SerializeField] private Transform bellDome; // The dome that shakes
        [SerializeField] private Renderer bellRenderer;

        [Header("Animation")]
        [SerializeField] private float buttonPressDistance = 0.05f;
        [SerializeField] private float buttonPressSpeed = 10f;
        [SerializeField] private float shakeIntensity = 5f;
        [SerializeField] private float shakeDuration = 0.3f;

        [Header("Audio")]
        [SerializeField] private AudioClip[] bellRingSounds; // Different bell sounds
        [SerializeField] [Range(0f, 1f)] private float volume = 1f;
        [SerializeField] private AudioSource audioSource;

        [Header("Visual Feedback")]
        [SerializeField] private ParticleSystem ringParticles;
        [SerializeField] private Light ringLight;
        [SerializeField] private Color ringLightColor = Color.yellow;
        [SerializeField] private float ringLightDuration = 0.2f;

        [Header("Haptic Feedback")]
        [SerializeField] private bool enableHaptics = true;
        [SerializeField] [Range(0f, 1f)] private float hapticIntensity = 0.4f;
        [SerializeField] private float hapticDuration = 0.15f;
        #endregion

        #region Bell Types
        public enum BellType
        {
            DeskBell,      // Classic desk service bell
            HandBell,      // Handheld school bell
            Cowbell,       // Novelty cowbell
            Chime          // Single chime
        }
        #endregion

        #region Properties
        public bool IsRinging { get; private set; }
        public int TimesRung { get; private set; } = 0;
        #endregion

        #region Private Fields
        private GrabbableObject _grabbable;
        private Vector3 _buttonRestPosition;
        private Vector3 _buttonPressedPosition;
        private bool _isButtonPressed;
        private float _lastRingTime;
        private float _shakeTimeRemaining;
        private Vector3 _originalDomePosition;
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            InitializeComponents();
        }

        private void Update()
        {
            AnimateButton();
            AnimateShake();
        }
        #endregion

        #region Initialization
        private void InitializeComponents()
        {
            _grabbable = GetComponent<GrabbableObject>();

            if (audioSource == null)
            {
                audioSource = gameObject.AddComponent<AudioSource>();
                audioSource.spatialBlend = 1f; // 3D sound
                audioSource.maxDistance = 15f; // Bell sound travels far!
            }

            // Store original positions
            if (bellButton != null)
            {
                _buttonRestPosition = bellButton.localPosition;
                _buttonPressedPosition = _buttonRestPosition - new Vector3(0, buttonPressDistance, 0);
            }

            if (bellDome != null)
            {
                _originalDomePosition = bellDome.localPosition;
            }

            // Setup light
            if (ringLight != null)
            {
                ringLight.enabled = false;
                ringLight.color = ringLightColor;
                ringLight.intensity = 2f;
            }

            Debug.Log($"[Bell] Initialized {bellType} bell");
        }
        #endregion

        #region Ring Bell
        /// <summary>
        /// Ring the bell!
        /// </summary>
        public void Ring()
        {
            // Cooldown check
            if (Time.time - _lastRingTime < ringCooldown)
            {
                return;
            }

            _lastRingTime = Time.time;
            IsRinging = true;
            TimesRung++;

            // Press button
            _isButtonPressed = true;

            // Play sound
            PlayBellSound();

            // Visual effects
            TriggerVisualEffects();

            // Shake
            StartShake();

            // Haptic feedback
            SendHapticFeedback();

            Debug.Log($"[Bell] DING! (Rung {TimesRung} times)");

            // Celebration for milestones
            if (TimesRung == 10 || TimesRung == 25 || TimesRung == 50)
            {
                CelebrationEffects.Instance?.PlayInteractionSparkle(transform.position);
            }

            // Reset after short delay
            Invoke(nameof(ResetRinging), 0.2f);
        }

        private void ResetRinging()
        {
            IsRinging = false;
            _isButtonPressed = false;
        }
        #endregion

        #region Audio
        private void PlayBellSound()
        {
            if (bellRingSounds != null && bellRingSounds.Length > 0)
            {
                AudioClip sound = bellRingSounds[Random.Range(0, bellRingSounds.Length)];
                audioSource.volume = volume;
                audioSource.PlayOneShot(sound);
            }
            else if (SoundManager.Instance != null)
            {
                SoundManager.Instance.PlaySound("bellRing", volume);
            }
        }
        #endregion

        #region Animation
        private void AnimateButton()
        {
            if (bellButton == null) return;

            Vector3 targetPosition = _isButtonPressed ? _buttonPressedPosition : _buttonRestPosition;

            bellButton.localPosition = Vector3.Lerp(
                bellButton.localPosition,
                targetPosition,
                Time.deltaTime * buttonPressSpeed
            );
        }

        private void StartShake()
        {
            _shakeTimeRemaining = shakeDuration;
        }

        private void AnimateShake()
        {
            if (_shakeTimeRemaining > 0 && bellDome != null)
            {
                _shakeTimeRemaining -= Time.deltaTime;

                // Random shake
                Vector3 shakeOffset = Random.insideUnitSphere * shakeIntensity * 0.01f;
                bellDome.localPosition = _originalDomePosition + shakeOffset;

                // Return to original when done
                if (_shakeTimeRemaining <= 0)
                {
                    bellDome.localPosition = _originalDomePosition;
                }
            }
        }
        #endregion

        #region Visual Effects
        private void TriggerVisualEffects()
        {
            // Particles
            if (ringParticles != null)
            {
                ringParticles.Play();
            }

            // Light flash
            if (ringLight != null)
            {
                StartCoroutine(FlashLight());
            }
        }

        private System.Collections.IEnumerator FlashLight()
        {
            if (ringLight == null) yield break;

            ringLight.enabled = true;

            yield return new WaitForSeconds(ringLightDuration);

            ringLight.enabled = false;
        }
        #endregion

        #region Haptic Feedback
        private void SendHapticFeedback()
        {
            if (!enableHaptics) return;

            // Send to all controllers
            XRBaseController[] controllers = FindObjectsOfType<XRBaseController>();
            foreach (var controller in controllers)
            {
                controller.SendHapticImpulse(hapticIntensity, hapticDuration);
            }
        }
        #endregion

        #region Interaction
        /// <summary>
        /// Handle grab - ring bell
        /// </summary>
        public void OnGrabbed()
        {
            if (bellType == BellType.HandBell)
            {
                Ring();
            }
        }

        /// <summary>
        /// Handle press - ring desk bell
        /// </summary>
        public void OnPressed()
        {
            if (bellType == BellType.DeskBell)
            {
                Ring();
            }
        }

        /// <summary>
        /// Handle shake - ring handheld bell
        /// </summary>
        public void OnShake(float shakeForce)
        {
            if (bellType == BellType.HandBell && shakeForce > 2f)
            {
                Ring();
            }
        }
        #endregion

        #region Special Features
        /// <summary>
        /// Ring bell multiple times (for class start/end)
        /// </summary>
        public void RingMultiple(int count, float delayBetweenRings = 0.5f)
        {
            StartCoroutine(RingSequence(count, delayBetweenRings));
        }

        private System.Collections.IEnumerator RingSequence(int count, float delay)
        {
            for (int i = 0; i < count; i++)
            {
                Ring();
                yield return new WaitForSeconds(delay);
            }

            Debug.Log($"[Bell] Rang {count} times for announcement");
        }

        /// <summary>
        /// Play "class starting" bell sequence
        /// </summary>
        public void RingClassStart()
        {
            RingMultiple(3, 0.3f);
        }

        /// <summary>
        /// Play "class ending" bell sequence
        /// </summary>
        public void RingClassEnd()
        {
            RingMultiple(2, 0.5f);
        }

        /// <summary>
        /// Play "achievement" bell sequence
        /// </summary>
        public void RingAchievement()
        {
            RingMultiple(5, 0.2f);
            CelebrationEffects.Instance?.CelebrationAtPlayer("success");
        }
        #endregion

        #region Stats
        /// <summary>
        /// Reset ring counter
        /// </summary>
        public void ResetCounter()
        {
            TimesRung = 0;
            Debug.Log("[Bell] Counter reset");
        }

        /// <summary>
        /// Get total times rung (for achievements)
        /// </summary>
        public int GetTimesRung()
        {
            return TimesRung;
        }
        #endregion

        #region Context Menu (Testing)
        [ContextMenu("Ring Bell")]
        private void TestRing()
        {
            Ring();
        }

        [ContextMenu("Ring Class Start (3x)")]
        private void TestClassStart()
        {
            RingClassStart();
        }

        [ContextMenu("Ring Achievement (5x)")]
        private void TestAchievement()
        {
            RingAchievement();
        }
        #endregion

        #region Gizmos
        private void OnDrawGizmos()
        {
            // Draw bell area
            Gizmos.color = Color.yellow;
            Gizmos.DrawWireSphere(transform.position, 0.1f);

            // Draw sound range
            Gizmos.color = new Color(1f, 1f, 0f, 0.1f);
            if (audioSource != null)
            {
                Gizmos.DrawWireSphere(transform.position, audioSource.maxDistance);
            }
        }
        #endregion
    }
}
