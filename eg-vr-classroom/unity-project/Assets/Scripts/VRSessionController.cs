using System;
using UnityEngine;
using UnityEngine.XR;

namespace EG.OASIS
{
    /// <summary>
    /// VR Session Controller - Manages VR session state and safety features
    /// Handles COPPA-compliant session limits and parental controls
    /// </summary>
    public class VRSessionController : MonoBehaviour
    {
        #region Public Properties
        public bool IsSessionActive { get; private set; }
        public float SessionDuration { get; private set; }
        public float SessionTimeRemaining => _maxSessionDuration - SessionDuration;
        #endregion

        #region Inspector Settings
        [Header("Session Limits (COPPA Compliance)")]
        [SerializeField] private float maxSessionDurationMinutes = 30f;
        [SerializeField] private float warningTimeMinutes = 5f;

        [Header("Safety Features")]
        [SerializeField] private bool enableEmergencyStop = true;
        [SerializeField] private KeyCode emergencyStopKey = KeyCode.Escape;

        [Header("Debug")]
        [SerializeField] private bool debugMode = true;
        #endregion

        #region Private Fields
        private float _maxSessionDuration;
        private float _warningTime;
        private bool _warningShown = false;
        private float _sessionStartTime;
        #endregion

        #region Events
        public event Action OnSessionStarted;
        public event Action OnSessionEnded;
        public event Action OnSessionWarning;
        public event Action OnEmergencyStop;
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            _maxSessionDuration = maxSessionDurationMinutes * 60f;
            _warningTime = warningTimeMinutes * 60f;
        }

        private void Update()
        {
            if (!IsSessionActive) return;

            // Update session duration
            SessionDuration = Time.time - _sessionStartTime;

            // Check for session time limit
            if (SessionDuration >= _maxSessionDuration)
            {
                Log("Session time limit reached");
                EndSession("Time limit reached");
                return;
            }

            // Show warning when approaching time limit
            if (!_warningShown && SessionTimeRemaining <= _warningTime)
            {
                Log($"Session warning - {warningTimeMinutes} minutes remaining");
                _warningShown = true;
                OnSessionWarning?.Invoke();
            }

            // Check for emergency stop
            if (enableEmergencyStop && Input.GetKeyDown(emergencyStopKey))
            {
                Log("Emergency stop activated");
                EmergencyStop();
            }
        }
        #endregion

        #region Session Management
        /// <summary>
        /// Start VR session
        /// </summary>
        public void StartSession()
        {
            if (IsSessionActive)
            {
                LogWarning("Session already active");
                return;
            }

            Log("Starting VR session");

            IsSessionActive = true;
            _sessionStartTime = Time.time;
            SessionDuration = 0f;
            _warningShown = false;

            OnSessionStarted?.Invoke();

            Log($"Session started - Max duration: {maxSessionDurationMinutes} minutes");
        }

        /// <summary>
        /// End VR session
        /// </summary>
        public void EndSession(string reason = "User requested")
        {
            if (!IsSessionActive)
            {
                LogWarning("No active session to end");
                return;
            }

            Log($"Ending VR session - Reason: {reason}, Duration: {SessionDuration / 60f:F1} minutes");

            IsSessionActive = false;

            OnSessionEnded?.Invoke();

            Log("Session ended");
        }

        /// <summary>
        /// Emergency stop - immediately stops session and disables VR
        /// </summary>
        public void EmergencyStop()
        {
            LogWarning("EMERGENCY STOP ACTIVATED");

            IsSessionActive = false;

            OnEmergencyStop?.Invoke();

            // Stop VR
            if (OASISManager.Instance != null)
            {
                OASISManager.Instance.StopVR();
                OASISManager.Instance.StopSession();
            }

            LogWarning("Emergency stop complete - VR disabled");
        }
        #endregion

        #region Session Info
        /// <summary>
        /// Get session info as formatted string
        /// </summary>
        public string GetSessionInfo()
        {
            if (!IsSessionActive)
            {
                return "No active session";
            }

            float durationMinutes = SessionDuration / 60f;
            float remainingMinutes = SessionTimeRemaining / 60f;

            return $"Session Active\n" +
                   $"Duration: {durationMinutes:F1} min\n" +
                   $"Remaining: {remainingMinutes:F1} min";
        }
        #endregion

        #region Logging
        private void Log(string message)
        {
            if (debugMode)
            {
                Debug.Log($"[VRSession] {message}");
            }
        }

        private void LogWarning(string message)
        {
            if (debugMode)
            {
                Debug.LogWarning($"[VRSession] {message}");
            }
        }
        #endregion
    }
}
