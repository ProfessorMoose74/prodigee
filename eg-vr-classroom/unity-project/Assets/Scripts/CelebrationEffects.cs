using System.Collections;
using UnityEngine;
using UnityEngine.XR.Interaction.Toolkit;

namespace EG.OASIS.Classroom
{
    /// <summary>
    /// Celebration Effects - Fun visual and audio feedback for children
    /// Makes learning feel magical, rewarding, and encouraging
    /// </summary>
    public class CelebrationEffects : MonoBehaviour
    {
        #region Singleton
        private static CelebrationEffects _instance;
        public static CelebrationEffects Instance
        {
            get
            {
                if (_instance == null)
                {
                    _instance = FindObjectOfType<CelebrationEffects>();
                    if (_instance == null)
                    {
                        GameObject go = new GameObject("CelebrationEffects");
                        _instance = go.AddComponent<CelebrationEffects>();
                    }
                }
                return _instance;
            }
        }
        #endregion

        #region Inspector Settings
        [Header("Particle Prefabs")]
        [SerializeField] private ParticleSystem starBurstPrefab;
        [SerializeField] private ParticleSystem confettiPrefab;
        [SerializeField] private ParticleSystem sparklesPrefab;
        [SerializeField] private ParticleSystem rainbowPrefab;
        [SerializeField] private ParticleSystem fireworksPrefab;

        [Header("Success Audio")]
        [SerializeField] private AudioClip[] cheerSounds; // "Yay!", "Hooray!", "Great job!"
        [SerializeField] private AudioClip[] applauseSounds;
        [SerializeField] private AudioClip magicSparkleSound;
        [SerializeField] private AudioClip correctAnswerSound;
        [SerializeField] private AudioClip levelUpSound;

        [Header("Encouragement Audio")]
        [SerializeField] private AudioClip[] tryAgainSounds; // "Try again!", "You can do it!"
        [SerializeField] private AudioClip[] almostSounds; // "Almost!", "So close!"

        [Header("Character Voices")]
        [SerializeField] private AudioClip professorAlPraise;
        [SerializeField] private AudioClip ellaCelebration;
        [SerializeField] private AudioClip gusCheer;

        [Header("Haptic Patterns")]
        [SerializeField] private bool enableHaptics = true;
        [SerializeField] [Range(0f, 1f)] private float successHapticIntensity = 0.5f;
        [SerializeField] [Range(0f, 1f)] private float encouragementHapticIntensity = 0.3f;
        #endregion

        #region Private Fields
        private AudioSource _audioSource;
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                Destroy(gameObject);
                return;
            }

            _instance = this;
            DontDestroyOnLoad(gameObject);

            InitializeAudio();
        }
        #endregion

        #region Initialization
        private void InitializeAudio()
        {
            _audioSource = GetComponent<AudioSource>();
            if (_audioSource == null)
            {
                _audioSource = gameObject.AddComponent<AudioSource>();
            }

            _audioSource.spatialBlend = 0f; // 2D sound (everywhere)
            _audioSource.volume = 0.8f;
        }
        #endregion

        #region Success Celebrations
        /// <summary>
        /// Full celebration for completing an activity
        /// </summary>
        public void CelebrateActivityComplete(Vector3 position, float score)
        {
            Debug.Log($"[Celebration] Activity completed with score: {score:P0}");

            if (score >= 0.9f)
            {
                // Perfect score!
                SpawnEffect(fireworksPrefab, position);
                PlayRandomSound(cheerSounds);
                PlayRandomSound(applauseSounds, 0.3f);
                SendHapticPattern(HapticPattern.Perfect);
            }
            else if (score >= 0.7f)
            {
                // Great job!
                SpawnEffect(confettiPrefab, position);
                PlayRandomSound(cheerSounds);
                SendHapticPattern(HapticPattern.Success);
            }
            else
            {
                // Good effort!
                SpawnEffect(sparklesPrefab, position);
                PlayRandomSound(tryAgainSounds);
                SendHapticPattern(HapticPattern.Encouragement);
            }

            // Professor Al's praise
            if (professorAlPraise != null)
            {
                StartCoroutine(PlaySoundDelayed(professorAlPraise, 0.5f));
            }
        }

        /// <summary>
        /// Quick celebration for correct answer
        /// </summary>
        public void CelebrateCorrectAnswer(Vector3 position)
        {
            SpawnEffect(starBurstPrefab, position);
            PlaySound(correctAnswerSound);
            SendHapticPattern(HapticPattern.Success);

            Debug.Log("[Celebration] Correct answer!");
        }

        /// <summary>
        /// Rainbow celebration for special achievements
        /// </summary>
        public void CelebrateSpecial(Vector3 position, string achievementName)
        {
            SpawnEffect(rainbowPrefab, position);
            PlaySound(levelUpSound);
            PlayRandomSound(cheerSounds, 0.3f);
            SendHapticPattern(HapticPattern.Perfect);

            Debug.Log($"[Celebration] Special achievement: {achievementName}");
        }

        /// <summary>
        /// Sparkle effect for interactions
        /// </summary>
        public void PlayInteractionSparkle(Vector3 position)
        {
            SpawnEffect(sparklesPrefab, position, 0.5f);
            PlaySound(magicSparkleSound, 0.3f);
        }
        #endregion

        #region Encouragement
        /// <summary>
        /// Gentle encouragement for incorrect answers
        /// </summary>
        public void EncourageRetry(Vector3 position)
        {
            // Gentle sparkles
            SpawnEffect(sparklesPrefab, position, 0.3f);

            // Encouraging sound
            PlayRandomSound(tryAgainSounds);

            // Gentle haptic
            SendHapticPattern(HapticPattern.Encouragement);

            Debug.Log("[Celebration] Encouraging retry");
        }

        /// <summary>
        /// "Almost there!" feedback
        /// </summary>
        public void CelebrateAlmost(Vector3 position)
        {
            SpawnEffect(starBurstPrefab, position, 0.5f);
            PlayRandomSound(almostSounds);
            SendHapticPattern(HapticPattern.Encouragement);

            Debug.Log("[Celebration] Almost correct!");
        }

        /// <summary>
        /// Character-specific encouragement
        /// </summary>
        public void PlayCharacterEncouragement(CharacterType character, Vector3 position)
        {
            SpawnEffect(sparklesPrefab, position);

            switch (character)
            {
                case CharacterType.ProfessorAl:
                    PlaySound(professorAlPraise);
                    break;
                case CharacterType.Ella:
                    PlaySound(ellaCelebration);
                    break;
                case CharacterType.Gus:
                    PlaySound(gusCheer);
                    break;
            }

            SendHapticPattern(HapticPattern.Encouragement);
        }

        public enum CharacterType
        {
            ProfessorAl,
            Ella,
            Gus
        }
        #endregion

        #region Particle Effects
        private void SpawnEffect(ParticleSystem prefab, Vector3 position, float scale = 1f)
        {
            if (prefab == null) return;

            ParticleSystem effect = Instantiate(prefab, position, Quaternion.identity);
            effect.transform.localScale = Vector3.one * scale;
            effect.Play();

            // Auto-destroy after playing
            Destroy(effect.gameObject, effect.main.duration + effect.main.startLifetime.constantMax);
        }
        #endregion

        #region Audio
        private void PlaySound(AudioClip clip, float volumeMultiplier = 1f)
        {
            if (_audioSource != null && clip != null)
            {
                _audioSource.PlayOneShot(clip, volumeMultiplier);
            }
        }

        private void PlayRandomSound(AudioClip[] clips, float volumeMultiplier = 1f)
        {
            if (clips == null || clips.Length == 0) return;

            AudioClip randomClip = clips[Random.Range(0, clips.Length)];
            PlaySound(randomClip, volumeMultiplier);
        }

        private IEnumerator PlaySoundDelayed(AudioClip clip, float delay)
        {
            yield return new WaitForSeconds(delay);
            PlaySound(clip);
        }
        #endregion

        #region Haptic Feedback
        private enum HapticPattern
        {
            Success,        // Double tap
            Perfect,        // Triple tap with crescendo
            Encouragement,  // Single gentle pulse
            Incorrect       // Very gentle single pulse
        }

        private void SendHapticPattern(HapticPattern pattern)
        {
            if (!enableHaptics) return;

            StartCoroutine(PlayHapticPattern(pattern));
        }

        private IEnumerator PlayHapticPattern(HapticPattern pattern)
        {
            switch (pattern)
            {
                case HapticPattern.Success:
                    // Double tap
                    SendHapticToControllers(successHapticIntensity, 0.1f);
                    yield return new WaitForSeconds(0.15f);
                    SendHapticToControllers(successHapticIntensity, 0.1f);
                    break;

                case HapticPattern.Perfect:
                    // Triple tap with crescendo
                    SendHapticToControllers(0.3f, 0.1f);
                    yield return new WaitForSeconds(0.1f);
                    SendHapticToControllers(0.5f, 0.1f);
                    yield return new WaitForSeconds(0.1f);
                    SendHapticToControllers(0.8f, 0.15f);
                    break;

                case HapticPattern.Encouragement:
                    // Single gentle pulse
                    SendHapticToControllers(encouragementHapticIntensity, 0.15f);
                    break;

                case HapticPattern.Incorrect:
                    // Very gentle pulse
                    SendHapticToControllers(0.1f, 0.08f);
                    break;
            }
        }

        private void SendHapticToControllers(float intensity, float duration)
        {
            // Find all XR controllers and send haptic impulse
            XRBaseController[] controllers = FindObjectsOfType<XRBaseController>();
            foreach (var controller in controllers)
            {
                controller.SendHapticImpulse(intensity, duration);
            }
        }
        #endregion

        #region Public Utility Methods
        /// <summary>
        /// Create celebration at player position
        /// </summary>
        public void CelebrateAtPlayer(string celebrationType = "success")
        {
            Vector3 playerPos = Camera.main.transform.position + Camera.main.transform.forward * 2f;

            switch (celebrationType.ToLower())
            {
                case "perfect":
                    SpawnEffect(fireworksPrefab, playerPos);
                    PlayRandomSound(cheerSounds);
                    break;
                case "success":
                    SpawnEffect(confettiPrefab, playerPos);
                    PlaySound(correctAnswerSound);
                    break;
                case "sparkle":
                    SpawnEffect(sparklesPrefab, playerPos);
                    PlaySound(magicSparkleSound);
                    break;
                default:
                    SpawnEffect(starBurstPrefab, playerPos);
                    break;
            }
        }

        /// <summary>
        /// Celebrate with fireworks show
        /// </summary>
        public void PlayFireworksShow(Vector3 centerPosition, int count = 5)
        {
            StartCoroutine(FireworksSequence(centerPosition, count));
        }

        private IEnumerator FireworksSequence(Vector3 center, int count)
        {
            for (int i = 0; i < count; i++)
            {
                Vector3 randomOffset = Random.insideUnitSphere * 3f;
                randomOffset.y = Mathf.Abs(randomOffset.y) + 2f; // Keep above ground

                SpawnEffect(fireworksPrefab, center + randomOffset);
                PlayRandomSound(cheerSounds, 0.5f);

                yield return new WaitForSeconds(Random.Range(0.3f, 0.8f));
            }
        }
        #endregion
    }
}
