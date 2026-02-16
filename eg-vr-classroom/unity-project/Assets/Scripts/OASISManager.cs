using System;
using System.Collections;
using UnityEngine;
using UnityEngine.XR;

namespace EG.OASIS
{
    /// <summary>
    /// Main OASIS Manager - Central controller for the VR classroom experience
    /// Connects to Python backend services and manages VR session lifecycle
    /// </summary>
    public class OASISManager : MonoBehaviour
    {
        #region Singleton
        private static OASISManager _instance;
        public static OASISManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    _instance = FindObjectOfType<OASISManager>();
                    if (_instance == null)
                    {
                        GameObject go = new GameObject("OASISManager");
                        _instance = go.AddComponent<OASISManager>();
                        DontDestroyOnLoad(go);
                    }
                }
                return _instance;
            }
        }
        #endregion

        #region Public Properties
        public bool IsConnected { get; private set; }
        public bool IsVREnabled { get; private set; }
        public string ChildName { get; private set; }
        public int ChildID { get; private set; }
        public string SessionID { get; private set; }
        #endregion

        #region Inspector Settings
        [Header("Python Backend Configuration")]
        [SerializeField] private string pythonBackendURL = "http://localhost:5000";
        [SerializeField] private string websocketURL = "ws://localhost:8765";

        [Header("VR Settings")]
        [SerializeField] private string vrPlatform = "meta_quest_3";
        [SerializeField] private bool enableVROnStart = true;

        [Header("Session Settings")]
        [SerializeField] private float sessionHeartbeatInterval = 30f;
        [SerializeField] private float connectionTimeout = 10f;

        [Header("Debug")]
        [SerializeField] private bool debugMode = true;
        #endregion

        #region Private Fields
        private PythonBridge _pythonBridge;
        private VRSessionController _sessionController;
        private Coroutine _heartbeatCoroutine;
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

            Initialize();
        }

        private void Start()
        {
            if (enableVROnStart)
            {
                StartVR();
            }
        }

        private void OnDestroy()
        {
            if (_instance == this)
            {
                StopSession();
            }
        }

        private void OnApplicationQuit()
        {
            StopSession();
        }
        #endregion

        #region Initialization
        private void Initialize()
        {
            Log("Initializing OASIS Manager...");

            // Initialize Python Bridge
            _pythonBridge = gameObject.AddComponent<PythonBridge>();
            _pythonBridge.Initialize(pythonBackendURL, websocketURL, debugMode);

            // Initialize VR Session Controller
            _sessionController = gameObject.AddComponent<VRSessionController>();

            Log("OASIS Manager initialized successfully");
        }
        #endregion

        #region VR Control
        /// <summary>
        /// Start VR subsystem
        /// </summary>
        public void StartVR()
        {
            Log("Starting VR subsystem...");

            StartCoroutine(InitializeXR());
        }

        private IEnumerator InitializeXR()
        {
            Log("Initializing XR...");

            // Check if XR is supported
            if (!XRSettings.enabled)
            {
                XRSettings.enabled = true;
            }

            // Wait for XR to initialize
            yield return new WaitForSeconds(1f);

            // Check if VR is available
            if (XRSettings.isDeviceActive)
            {
                IsVREnabled = true;
                Log($"VR initialized successfully - Device: {XRSettings.loadedDeviceName}");
            }
            else
            {
                LogWarning("VR device not detected - Running in simulator mode");
                IsVREnabled = false;
            }
        }

        /// <summary>
        /// Stop VR subsystem
        /// </summary>
        public void StopVR()
        {
            Log("Stopping VR subsystem...");
            XRSettings.enabled = false;
            IsVREnabled = false;
        }
        #endregion

        #region Session Management
        /// <summary>
        /// Start a child VR session
        /// </summary>
        public IEnumerator StartChildSession(string parentToken, int childId, string childName)
        {
            Log($"Starting VR session for child: {childName} (ID: {childId})");

            ChildID = childId;
            ChildName = childName;

            // Connect to Python backend
            yield return StartCoroutine(_pythonBridge.ConnectToBackend(parentToken, childId, vrPlatform));

            if (_pythonBridge.IsConnected)
            {
                IsConnected = true;
                SessionID = _pythonBridge.SessionID;

                Log($"Session started successfully - Session ID: {SessionID}");

                // Start heartbeat
                _heartbeatCoroutine = StartCoroutine(SessionHeartbeat());
            }
            else
            {
                LogError("Failed to connect to backend");
            }
        }

        /// <summary>
        /// Stop current session
        /// </summary>
        public void StopSession()
        {
            if (!IsConnected) return;

            Log("Stopping VR session...");

            // Stop heartbeat
            if (_heartbeatCoroutine != null)
            {
                StopCoroutine(_heartbeatCoroutine);
                _heartbeatCoroutine = null;
            }

            // Disconnect from backend
            _pythonBridge.Disconnect();

            IsConnected = false;
            SessionID = null;

            Log("Session stopped");
        }

        private IEnumerator SessionHeartbeat()
        {
            while (IsConnected)
            {
                yield return new WaitForSeconds(sessionHeartbeatInterval);

                // Send heartbeat to backend
                _pythonBridge.SendHeartbeat();
            }
        }
        #endregion

        #region Logging
        private void Log(string message)
        {
            if (debugMode)
            {
                Debug.Log($"[OASIS] {message}");
            }
        }

        private void LogWarning(string message)
        {
            if (debugMode)
            {
                Debug.LogWarning($"[OASIS] {message}");
            }
        }

        private void LogError(string message)
        {
            Debug.LogError($"[OASIS] {message}");
        }
        #endregion
    }
}
