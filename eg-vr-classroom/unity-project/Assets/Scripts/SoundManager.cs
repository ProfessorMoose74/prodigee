using System.Collections.Generic;
using UnityEngine;

namespace EG.OASIS.Classroom
{
    /// <summary>
    /// Sound Manager - Centralized audio management for the VR classroom
    /// Organizes all sounds by category and provides easy playback methods
    /// </summary>
    public class SoundManager : MonoBehaviour
    {
        #region Singleton
        private static SoundManager _instance;
        public static SoundManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    _instance = FindObjectOfType<SoundManager>();
                    if (_instance == null)
                    {
                        GameObject go = new GameObject("SoundManager");
                        _instance = go.AddComponent<SoundManager>();
                        DontDestroyOnLoad(go);
                    }
                }
                return _instance;
            }
        }
        #endregion

        #region Sound Categories
        [System.Serializable]
        public class SoundCategory
        {
            public string categoryName;
            public AudioClip[] clips;
            [Range(0f, 1f)] public float volume = 1f;
            public bool is3D = false;
        }
        #endregion

        #region Inspector Settings
        [Header("Object Interaction Sounds")]
        [SerializeField] private AudioClip[] grabSounds;
        [SerializeField] private AudioClip[] dropSounds;
        [SerializeField] private AudioClip[] collisionSounds;
        [SerializeField] private AudioClip[] squeakSounds;

        [Header("Classroom Sounds")]
        [SerializeField] private AudioClip chalkWriteSound;
        [SerializeField] private AudioClip eraseSound;
        [SerializeField] private AudioClip deskOpenSound;
        [SerializeField] private AudioClip deskCloseSound;
        [SerializeField] private AudioClip doorOpenSound;
        [SerializeField] private AudioClip doorCloseSound;
        [SerializeField] private AudioClip bellRingSound;
        [SerializeField] private AudioClip bookPageTurnSound;

        [Header("Celebration Sounds")]
        [SerializeField] private AudioClip[] cheerSounds;
        [SerializeField] private AudioClip[] applauseSounds;
        [SerializeField] private AudioClip correctAnswerSound;
        [SerializeField] private AudioClip levelUpSound;
        [SerializeField] private AudioClip magicSparkleSound;
        [SerializeField] private AudioClip fireworkSound;

        [Header("Encouragement Sounds")]
        [SerializeField] private AudioClip[] tryAgainSounds;
        [SerializeField] private AudioClip[] almostSounds;
        [SerializeField] private AudioClip[] goodJobSounds;

        [Header("Character Voices")]
        [SerializeField] private AudioClip[] professorAlVoices;
        [SerializeField] private AudioClip[] ellaVoices;
        [SerializeField] private AudioClip[] gusVoices;

        [Header("Globe Sounds")]
        [SerializeField] private AudioClip globeSpinSound;
        [SerializeField] private AudioClip countryClickSound;
        [SerializeField] private AudioClip funFactSound;

        [Header("Treasure Sounds")]
        [SerializeField] private AudioClip treasureFoundSound;
        [SerializeField] private AudioClip rareTreasureSound;
        [SerializeField] private AudioClip legendaryTreasureSound;

        [Header("Ambient Sounds")]
        [SerializeField] private AudioClip classroomAmbienceSound;
        [SerializeField] private AudioClip[] outdoorBirdSounds;
        [SerializeField] private AudioClip clockTickingSound;

        [Header("Music")]
        [SerializeField] private AudioClip backgroundMusicCalm;
        [SerializeField] private AudioClip backgroundMusicEnergetic;
        [SerializeField] private AudioClip victoryMusic;

        [Header("Settings")]
        [SerializeField] [Range(0f, 1f)] private float masterVolume = 1f;
        [SerializeField] [Range(0f, 1f)] private float sfxVolume = 1f;
        [SerializeField] [Range(0f, 1f)] private float musicVolume = 0.5f;
        [SerializeField] [Range(0f, 1f)] private float voiceVolume = 1f;
        [SerializeField] private int maxSimultaneousSounds = 10;
        #endregion

        #region Private Fields
        private List<AudioSource> _audioSourcePool = new List<AudioSource>();
        private AudioSource _musicSource;
        private AudioSource _ambienceSource;
        private Dictionary<string, AudioClip> _soundLibrary = new Dictionary<string, AudioClip>();
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

            InitializeAudioSources();
            BuildSoundLibrary();
        }

        private void Start()
        {
            // Start ambient sounds
            PlayAmbience(classroomAmbienceSound, loop: true);
        }
        #endregion

        #region Initialization
        private void InitializeAudioSources()
        {
            // Create audio source pool
            for (int i = 0; i < maxSimultaneousSounds; i++)
            {
                AudioSource source = gameObject.AddComponent<AudioSource>();
                source.playOnAwake = false;
                source.spatialBlend = 0f; // 2D by default
                _audioSourcePool.Add(source);
            }

            // Music source
            _musicSource = gameObject.AddComponent<AudioSource>();
            _musicSource.loop = true;
            _musicSource.volume = musicVolume * masterVolume;
            _musicSource.playOnAwake = false;

            // Ambience source
            _ambienceSource = gameObject.AddComponent<AudioSource>();
            _ambienceSource.loop = true;
            _ambienceSource.volume = 0.3f * masterVolume;
            _ambienceSource.playOnAwake = false;

            Debug.Log($"[SoundManager] Initialized with {_audioSourcePool.Count} audio sources");
        }

        private void BuildSoundLibrary()
        {
            // Register all sounds in dictionary for easy access
            RegisterSound("chalkWrite", chalkWriteSound);
            RegisterSound("erase", eraseSound);
            RegisterSound("deskOpen", deskOpenSound);
            RegisterSound("deskClose", deskCloseSound);
            RegisterSound("doorOpen", doorOpenSound);
            RegisterSound("doorClose", doorCloseSound);
            RegisterSound("bellRing", bellRingSound);
            RegisterSound("pageT", bookPageTurnSound);

            RegisterSound("correctAnswer", correctAnswerSound);
            RegisterSound("levelUp", levelUpSound);
            RegisterSound("sparkle", magicSparkleSound);
            RegisterSound("firework", fireworkSound);

            RegisterSound("globeSpin", globeSpinSound);
            RegisterSound("countryClick", countryClickSound);
            RegisterSound("funFact", funFactSound);

            RegisterSound("treasureFound", treasureFoundSound);
            RegisterSound("rareTreasure", rareTreasureSound);
            RegisterSound("legendaryTreasure", legendaryTreasureSound);

            Debug.Log($"[SoundManager] Registered {_soundLibrary.Count} sounds");
        }

        private void RegisterSound(string name, AudioClip clip)
        {
            if (clip != null)
            {
                _soundLibrary[name] = clip;
            }
        }
        #endregion

        #region Play Methods
        /// <summary>
        /// Play sound by name
        /// </summary>
        public void PlaySound(string soundName, float volumeMultiplier = 1f)
        {
            if (_soundLibrary.ContainsKey(soundName))
            {
                PlaySound(_soundLibrary[soundName], volumeMultiplier);
            }
            else
            {
                Debug.LogWarning($"[SoundManager] Sound '{soundName}' not found");
            }
        }

        /// <summary>
        /// Play AudioClip
        /// </summary>
        public void PlaySound(AudioClip clip, float volumeMultiplier = 1f)
        {
            if (clip == null) return;

            AudioSource source = GetAvailableAudioSource();
            if (source != null)
            {
                source.clip = clip;
                source.volume = sfxVolume * masterVolume * volumeMultiplier;
                source.Play();
            }
        }

        /// <summary>
        /// Play random sound from array
        /// </summary>
        public void PlayRandomSound(AudioClip[] clips, float volumeMultiplier = 1f)
        {
            if (clips == null || clips.Length == 0) return;

            AudioClip randomClip = clips[Random.Range(0, clips.Length)];
            PlaySound(randomClip, volumeMultiplier);
        }

        /// <summary>
        /// Play sound at 3D position
        /// </summary>
        public void PlaySound3D(AudioClip clip, Vector3 position, float volumeMultiplier = 1f, float maxDistance = 10f)
        {
            if (clip == null) return;

            AudioSource source = GetAvailableAudioSource();
            if (source != null)
            {
                source.transform.position = position;
                source.spatialBlend = 1f; // 3D
                source.maxDistance = maxDistance;
                source.clip = clip;
                source.volume = sfxVolume * masterVolume * volumeMultiplier;
                source.Play();
            }
        }
        #endregion

        #region Category Methods
        /// <summary>
        /// Play grab sound
        /// </summary>
        public void PlayGrabSound(Vector3 position)
        {
            if (grabSounds != null && grabSounds.Length > 0)
            {
                PlaySound3D(grabSounds[Random.Range(0, grabSounds.Length)], position, 1f, 5f);
            }
        }

        /// <summary>
        /// Play drop sound
        /// </summary>
        public void PlayDropSound(Vector3 position)
        {
            if (dropSounds != null && dropSounds.Length > 0)
            {
                PlaySound3D(dropSounds[Random.Range(0, dropSounds.Length)], position, 1f, 5f);
            }
        }

        /// <summary>
        /// Play collision sound based on impact
        /// </summary>
        public void PlayCollisionSound(Vector3 position, float impactForce)
        {
            if (collisionSounds != null && collisionSounds.Length > 0)
            {
                float volume = Mathf.Clamp01(impactForce / 5f);
                PlaySound3D(collisionSounds[Random.Range(0, collisionSounds.Length)], position, volume, 8f);
            }
        }

        /// <summary>
        /// Play celebration sound
        /// </summary>
        public void PlayCelebration(CelebrationType type)
        {
            switch (type)
            {
                case CelebrationType.Cheer:
                    PlayRandomSound(cheerSounds);
                    break;
                case CelebrationType.Applause:
                    PlayRandomSound(applauseSounds);
                    break;
                case CelebrationType.CorrectAnswer:
                    PlaySound(correctAnswerSound);
                    break;
                case CelebrationType.LevelUp:
                    PlaySound(levelUpSound);
                    break;
                case CelebrationType.Sparkle:
                    PlaySound(magicSparkleSound);
                    break;
                case CelebrationType.Firework:
                    PlaySound(fireworkSound);
                    break;
            }
        }

        public enum CelebrationType
        {
            Cheer,
            Applause,
            CorrectAnswer,
            LevelUp,
            Sparkle,
            Firework
        }

        /// <summary>
        /// Play encouragement sound
        /// </summary>
        public void PlayEncouragement(EncouragementType type)
        {
            switch (type)
            {
                case EncouragementType.TryAgain:
                    PlayRandomSound(tryAgainSounds);
                    break;
                case EncouragementType.Almost:
                    PlayRandomSound(almostSounds);
                    break;
                case EncouragementType.GoodJob:
                    PlayRandomSound(goodJobSounds);
                    break;
            }
        }

        public enum EncouragementType
        {
            TryAgain,
            Almost,
            GoodJob
        }

        /// <summary>
        /// Play character voice
        /// </summary>
        public void PlayCharacterVoice(CharacterType character, int clipIndex = -1)
        {
            AudioClip[] voiceClips = null;

            switch (character)
            {
                case CharacterType.ProfessorAl:
                    voiceClips = professorAlVoices;
                    break;
                case CharacterType.Ella:
                    voiceClips = ellaVoices;
                    break;
                case CharacterType.Gus:
                    voiceClips = gusVoices;
                    break;
            }

            if (voiceClips != null && voiceClips.Length > 0)
            {
                AudioClip clip;
                if (clipIndex >= 0 && clipIndex < voiceClips.Length)
                {
                    clip = voiceClips[clipIndex];
                }
                else
                {
                    clip = voiceClips[Random.Range(0, voiceClips.Length)];
                }

                PlaySound(clip, voiceVolume);
            }
        }

        public enum CharacterType
        {
            ProfessorAl,
            Ella,
            Gus
        }
        #endregion

        #region Music
        /// <summary>
        /// Play background music
        /// </summary>
        public void PlayMusic(AudioClip musicClip, bool loop = true, float fadeInDuration = 2f)
        {
            if (musicClip == null) return;

            StopMusic();

            _musicSource.clip = musicClip;
            _musicSource.loop = loop;
            _musicSource.volume = 0f;
            _musicSource.Play();

            // Fade in
            StartCoroutine(FadeMusic(_musicSource, musicVolume * masterVolume, fadeInDuration));

            Debug.Log($"[SoundManager] Playing music: {musicClip.name}");
        }

        /// <summary>
        /// Stop music
        /// </summary>
        public void StopMusic(float fadeOutDuration = 1f)
        {
            if (_musicSource.isPlaying)
            {
                StartCoroutine(FadeMusic(_musicSource, 0f, fadeOutDuration, stopAfter: true));
            }
        }

        /// <summary>
        /// Play ambience sound
        /// </summary>
        public void PlayAmbience(AudioClip ambienceClip, bool loop = true)
        {
            if (ambienceClip == null) return;

            _ambienceSource.clip = ambienceClip;
            _ambienceSource.loop = loop;
            _ambienceSource.Play();
        }

        private System.Collections.IEnumerator FadeMusic(AudioSource source, float targetVolume, float duration, bool stopAfter = false)
        {
            float startVolume = source.volume;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                source.volume = Mathf.Lerp(startVolume, targetVolume, elapsed / duration);
                yield return null;
            }

            source.volume = targetVolume;

            if (stopAfter)
            {
                source.Stop();
            }
        }
        #endregion

        #region Volume Control
        /// <summary>
        /// Set master volume
        /// </summary>
        public void SetMasterVolume(float volume)
        {
            masterVolume = Mathf.Clamp01(volume);
            UpdateAllVolumes();
        }

        /// <summary>
        /// Set SFX volume
        /// </summary>
        public void SetSFXVolume(float volume)
        {
            sfxVolume = Mathf.Clamp01(volume);
        }

        /// <summary>
        /// Set music volume
        /// </summary>
        public void SetMusicVolume(float volume)
        {
            musicVolume = Mathf.Clamp01(volume);
            _musicSource.volume = musicVolume * masterVolume;
        }

        /// <summary>
        /// Set voice volume
        /// </summary>
        public void SetVoiceVolume(float volume)
        {
            voiceVolume = Mathf.Clamp01(volume);
        }

        private void UpdateAllVolumes()
        {
            _musicSource.volume = musicVolume * masterVolume;
            _ambienceSource.volume = 0.3f * masterVolume;
        }
        #endregion

        #region Audio Source Management
        private AudioSource GetAvailableAudioSource()
        {
            // Find available source
            foreach (var source in _audioSourcePool)
            {
                if (!source.isPlaying)
                {
                    return source;
                }
            }

            // All busy, use oldest
            Debug.LogWarning("[SoundManager] All audio sources busy, reusing oldest");
            return _audioSourcePool[0];
        }
        #endregion

        #region Utility
        /// <summary>
        /// Stop all sounds
        /// </summary>
        public void StopAllSounds()
        {
            foreach (var source in _audioSourcePool)
            {
                source.Stop();
            }

            Debug.Log("[SoundManager] Stopped all sounds");
        }

        /// <summary>
        /// Pause all sounds
        /// </summary>
        public void PauseAll()
        {
            foreach (var source in _audioSourcePool)
            {
                source.Pause();
            }
            _musicSource.Pause();
            _ambienceSource.Pause();
        }

        /// <summary>
        /// Resume all sounds
        /// </summary>
        public void ResumeAll()
        {
            foreach (var source in _audioSourcePool)
            {
                source.UnPause();
            }
            _musicSource.UnPause();
            _ambienceSource.UnPause();
        }
        #endregion
    }
}
