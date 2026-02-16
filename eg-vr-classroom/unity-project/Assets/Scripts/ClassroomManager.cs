using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace EG.OASIS.Classroom
{
    /// <summary>
    /// Classroom Manager - Controls the 1920s schoolhouse environment
    /// Manages classroom state, interactive elements, and educational activities
    /// </summary>
    public class ClassroomManager : MonoBehaviour
    {
        #region Singleton
        private static ClassroomManager _instance;
        public static ClassroomManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    _instance = FindObjectOfType<ClassroomManager>();
                }
                return _instance;
            }
        }
        #endregion

        #region References
        [Header("Classroom Elements")]
        [SerializeField] private Blackboard blackboard;
        [SerializeField] private List<StudentDesk> studentDesks = new List<StudentDesk>();
        [SerializeField] private Door classroomDoor;
        [SerializeField] private GameObject professorAlPerch;
        [SerializeField] private GameObject ellaCorner;
        [SerializeField] private GameObject gusArea;

        [Header("Environment")]
        [SerializeField] private Light mainLight;
        [SerializeField] private List<Light> accentLights = new List<Light>();
        [SerializeField] private AudioSource ambientAudio;
        #endregion

        #region State
        public bool IsActivityActive { get; private set; }
        public int CurrentActivityId { get; private set; }
        public StudentDesk PlayerDesk { get; private set; }
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
        }

        private void Start()
        {
            InitializeClassroom();
        }
        #endregion

        #region Initialization
        private void InitializeClassroom()
        {
            Debug.Log("[Classroom] Initializing 1920s schoolhouse...");

            // Find blackboard if not assigned
            if (blackboard == null)
            {
                blackboard = FindObjectOfType<Blackboard>();
            }

            // Find all desks if not assigned
            if (studentDesks.Count == 0)
            {
                studentDesks.AddRange(FindObjectsOfType<StudentDesk>());
            }

            // Assign player desk (front center)
            if (studentDesks.Count > 0)
            {
                PlayerDesk = studentDesks[7]; // Assuming 15 desks, #7 is front center
            }

            // Start ambient audio
            if (ambientAudio != null)
            {
                ambientAudio.Play();
            }

            Debug.Log($"[Classroom] Initialized with {studentDesks.Count} desks");
        }
        #endregion

        #region Activity Management
        /// <summary>
        /// Start a new educational activity
        /// </summary>
        public void StartActivity(int activityId, string activityTitle)
        {
            Debug.Log($"[Classroom] Starting activity: {activityTitle}");

            IsActivityActive = true;
            CurrentActivityId = activityId;

            // Display on blackboard
            if (blackboard != null)
            {
                blackboard.SetTitle(activityTitle);
                blackboard.Clear();
            }

            // Highlight player desk
            if (PlayerDesk != null)
            {
                PlayerDesk.Highlight(true);
            }
        }

        /// <summary>
        /// End current activity
        /// </summary>
        public void EndActivity(bool completed, float score)
        {
            Debug.Log($"[Classroom] Activity ended - Completed: {completed}, Score: {score:F2}");

            IsActivityActive = false;

            // Show feedback
            if (completed && score >= 0.7f)
            {
                ShowSuccess();
            }

            // Clear player desk highlight
            if (PlayerDesk != null)
            {
                PlayerDesk.Highlight(false);
            }
        }

        private void ShowSuccess()
        {
            // Play celebration sound
            // Show particle effects
            // Professor Al gives positive feedback
            Debug.Log("[Classroom] 🎉 Great job!");
        }
        #endregion

        #region Environment Control
        /// <summary>
        /// Set time of day lighting
        /// </summary>
        public void SetTimeOfDay(float hour)
        {
            // 0-24 hour format
            // Adjust main light intensity and color
            if (mainLight != null)
            {
                if (hour >= 8 && hour <= 17)
                {
                    // Daytime
                    mainLight.intensity = 1.0f;
                    mainLight.color = new Color(1f, 0.96f, 0.84f);
                }
                else
                {
                    // Evening/Night
                    mainLight.intensity = 0.3f;
                    mainLight.color = new Color(0.8f, 0.8f, 1f);
                }
            }
        }

        /// <summary>
        /// Play ambient classroom sound
        /// </summary>
        public void PlayAmbientSound(AudioClip clip)
        {
            if (ambientAudio != null)
            {
                ambientAudio.clip = clip;
                ambientAudio.Play();
            }
        }
        #endregion

        #region Desk Management
        /// <summary>
        /// Get available desk for child
        /// </summary>
        public StudentDesk GetAvailableDesk()
        {
            foreach (var desk in studentDesks)
            {
                if (!desk.IsOccupied)
                {
                    return desk;
                }
            }
            return null;
        }

        /// <summary>
        /// Assign desk to player
        /// </summary>
        public void AssignPlayerDesk(StudentDesk desk)
        {
            PlayerDesk = desk;
            desk.AssignToPlayer();
        }
        #endregion

        #region Blackboard Control
        /// <summary>
        /// Write text on blackboard
        /// </summary>
        public void WriteOnBlackboard(string text)
        {
            if (blackboard != null)
            {
                blackboard.WriteText(text);
            }
        }

        /// <summary>
        /// Clear blackboard
        /// </summary>
        public void ClearBlackboard()
        {
            if (blackboard != null)
            {
                blackboard.Clear();
            }
        }

        /// <summary>
        /// Display image on blackboard
        /// </summary>
        public void ShowImageOnBlackboard(Texture2D image)
        {
            if (blackboard != null)
            {
                blackboard.DisplayImage(image);
            }
        }
        #endregion

        #region Debug
        [ContextMenu("Test Start Activity")]
        private void TestStartActivity()
        {
            StartActivity(1, "Phoneme Segmentation: /cat/");
        }

        [ContextMenu("Test End Activity")]
        private void TestEndActivity()
        {
            EndActivity(true, 0.95f);
        }
        #endregion
    }
}
