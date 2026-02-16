using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using Newtonsoft.Json;

namespace EG.OASIS
{
    /// <summary>
    /// Python Bridge - Handles all communication with Python backend services
    /// Uses HTTP REST API and WebSocket for real-time communication
    /// </summary>
    public class PythonBridge : MonoBehaviour
    {
        #region Public Properties
        public bool IsConnected { get; private set; }
        public string SessionID { get; private set; }
        #endregion

        #region Private Fields
        private string _backendURL;
        private string _websocketURL;
        private bool _debugMode;
        private string _authToken;
        #endregion

        #region Initialization
        public void Initialize(string backendURL, string websocketURL, bool debugMode)
        {
            _backendURL = backendURL.TrimEnd('/');
            _websocketURL = websocketURL;
            _debugMode = debugMode;

            Log("Python Bridge initialized");
        }
        #endregion

        #region Connection
        /// <summary>
        /// Connect to Python backend and start VR session
        /// </summary>
        public IEnumerator ConnectToBackend(string parentToken, int childId, string vrPlatform)
        {
            Log("Connecting to Python backend...");

            // Prepare request data
            var requestData = new
            {
                child_id = childId,
                parent_token = parentToken,
                vr_platform = vrPlatform
            };

            string jsonData = JsonConvert.SerializeObject(requestData);

            // Send HTTP request to start session
            using (UnityWebRequest request = new UnityWebRequest($"{_backendURL}/api/vr/session/start", "POST"))
            {
                byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");

                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.Success)
                {
                    string responseText = request.downloadHandler.text;
                    var response = JsonConvert.DeserializeObject<SessionStartResponse>(responseText);

                    if (response != null && response.success)
                    {
                        SessionID = response.session_id;
                        _authToken = response.auth_token;
                        IsConnected = true;

                        Log($"Connected successfully - Session ID: {SessionID}");
                    }
                    else
                    {
                        LogError($"Failed to start session: {response?.message}");
                    }
                }
                else
                {
                    LogError($"Connection failed: {request.error}");
                }
            }
        }

        /// <summary>
        /// Disconnect from backend
        /// </summary>
        public void Disconnect()
        {
            if (!IsConnected) return;

            Log("Disconnecting from Python backend...");

            // Send disconnect request (fire and forget)
            StartCoroutine(SendDisconnectRequest());

            IsConnected = false;
            SessionID = null;
            _authToken = null;
        }

        private IEnumerator SendDisconnectRequest()
        {
            if (string.IsNullOrEmpty(SessionID)) yield break;

            using (UnityWebRequest request = UnityWebRequest.Get($"{_backendURL}/api/vr/session/stop?session_id={SessionID}"))
            {
                request.SetRequestHeader("Authorization", $"Bearer {_authToken}");
                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.Success)
                {
                    Log("Disconnected successfully");
                }
            }
        }
        #endregion

        #region Heartbeat
        /// <summary>
        /// Send heartbeat to keep session alive
        /// </summary>
        public void SendHeartbeat()
        {
            if (!IsConnected) return;

            StartCoroutine(SendHeartbeatRequest());
        }

        private IEnumerator SendHeartbeatRequest()
        {
            var requestData = new
            {
                session_id = SessionID,
                timestamp = DateTime.UtcNow.ToString("o")
            };

            string jsonData = JsonConvert.SerializeObject(requestData);

            using (UnityWebRequest request = new UnityWebRequest($"{_backendURL}/api/vr/session/heartbeat", "POST"))
            {
                byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("Authorization", $"Bearer {_authToken}");

                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.Success)
                {
                    Log("Heartbeat sent");
                }
                else
                {
                    LogWarning($"Heartbeat failed: {request.error}");
                }
            }
        }
        #endregion

        #region Curriculum
        /// <summary>
        /// Get current curriculum content for the child
        /// </summary>
        public IEnumerator GetCurriculumContent(Action<CurriculumContent> onSuccess, Action<string> onError)
        {
            if (!IsConnected)
            {
                onError?.Invoke("Not connected to backend");
                yield break;
            }

            using (UnityWebRequest request = UnityWebRequest.Get($"{_backendURL}/api/curriculum/current?child_id={SessionID}"))
            {
                request.SetRequestHeader("Authorization", $"Bearer {_authToken}");
                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.Success)
                {
                    string responseText = request.downloadHandler.text;
                    var content = JsonConvert.DeserializeObject<CurriculumContent>(responseText);
                    onSuccess?.Invoke(content);
                }
                else
                {
                    onError?.Invoke(request.error);
                }
            }
        }

        /// <summary>
        /// Submit progress for an activity
        /// </summary>
        public IEnumerator SubmitProgress(int activityId, bool completed, float score, Action<bool> onComplete)
        {
            if (!IsConnected)
            {
                onComplete?.Invoke(false);
                yield break;
            }

            var requestData = new
            {
                session_id = SessionID,
                activity_id = activityId,
                completed = completed,
                score = score,
                timestamp = DateTime.UtcNow.ToString("o")
            };

            string jsonData = JsonConvert.SerializeObject(requestData);

            using (UnityWebRequest request = new UnityWebRequest($"{_backendURL}/api/progress/submit", "POST"))
            {
                byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("Authorization", $"Bearer {_authToken}");

                yield return request.SendWebRequest();

                onComplete?.Invoke(request.result == UnityWebRequest.Result.Success);
            }
        }
        #endregion

        #region Translation
        /// <summary>
        /// Translate text to child's language
        /// </summary>
        public IEnumerator TranslateText(string text, string targetLanguage, Action<string> onSuccess, Action<string> onError)
        {
            if (!IsConnected)
            {
                onError?.Invoke("Not connected to backend");
                yield break;
            }

            var requestData = new
            {
                text = text,
                target_language = targetLanguage,
                source_language = "en"
            };

            string jsonData = JsonConvert.SerializeObject(requestData);

            using (UnityWebRequest request = new UnityWebRequest($"{_backendURL}/api/translation/translate", "POST"))
            {
                byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("Authorization", $"Bearer {_authToken}");

                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.Success)
                {
                    var response = JsonConvert.DeserializeObject<TranslationResponse>(responseText: request.downloadHandler.text);
                    onSuccess?.Invoke(response.translated_text);
                }
                else
                {
                    onError?.Invoke(request.error);
                }
            }
        }
        #endregion

        #region Library
        /// <summary>
        /// Get 3D model from library
        /// </summary>
        public IEnumerator GetModel(string modelId, Action<byte[]> onSuccess, Action<string> onError)
        {
            if (!IsConnected)
            {
                onError?.Invoke("Not connected to backend");
                yield break;
            }

            using (UnityWebRequest request = UnityWebRequest.Get($"{_backendURL}/api/library/model/{modelId}"))
            {
                request.SetRequestHeader("Authorization", $"Bearer {_authToken}");
                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.Success)
                {
                    onSuccess?.Invoke(request.downloadHandler.data);
                }
                else
                {
                    onError?.Invoke(request.error);
                }
            }
        }
        #endregion

        #region Logging
        private void Log(string message)
        {
            if (_debugMode)
            {
                Debug.Log($"[PythonBridge] {message}");
            }
        }

        private void LogWarning(string message)
        {
            if (_debugMode)
            {
                Debug.LogWarning($"[PythonBridge] {message}");
            }
        }

        private void LogError(string message)
        {
            Debug.LogError($"[PythonBridge] {message}");
        }
        #endregion

        #region Response Data Classes
        [Serializable]
        public class SessionStartResponse
        {
            public bool success;
            public string session_id;
            public string auth_token;
            public string message;
        }

        [Serializable]
        public class CurriculumContent
        {
            public int activity_id;
            public string title;
            public string description;
            public string content_type;
            public Dictionary<string, object> data;
        }

        [Serializable]
        public class TranslationResponse
        {
            public string translated_text;
            public string source_language;
            public string target_language;
        }
        #endregion
    }
}
