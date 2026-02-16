using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.XR;
using UnityEngine.XR.Interaction.Toolkit;

namespace EG.OASIS
{
    /// <summary>
    /// VR Input Handler - Manages VR controller input and interactions
    /// Supports Meta Quest 3 controllers and hand tracking
    /// </summary>
    public class VRInputHandler : MonoBehaviour
    {
        #region Public Properties
        public bool IsLeftControllerActive { get; private set; }
        public bool IsRightControllerActive { get; private set; }
        #endregion

        #region Inspector Settings
        [Header("Controller References")]
        [SerializeField] private XRController leftController;
        [SerializeField] private XRController rightController;

        [Header("Input Settings")]
        [SerializeField] private float triggerThreshold = 0.1f;
        [SerializeField] private float gripThreshold = 0.1f;

        [Header("Debug")]
        [SerializeField] private bool debugMode = true;
        [SerializeField] private bool showInputValues = false;
        #endregion

        #region Private Fields
        private InputDevice _leftHandDevice;
        private InputDevice _rightHandDevice;

        // Input values
        private bool _leftTriggerPressed;
        private bool _rightTriggerPressed;
        private bool _leftGripPressed;
        private bool _rightGripPressed;
        private Vector2 _leftThumbstick;
        private Vector2 _rightThumbstick;
        #endregion

        #region Events
        public event Action<XRNode> OnTriggerPressed;
        public event Action<XRNode> OnTriggerReleased;
        public event Action<XRNode> OnGripPressed;
        public event Action<XRNode> OnGripReleased;
        public event Action<XRNode, Vector2> OnThumbstickMoved;
        public event Action<XRNode> OnPrimaryButtonPressed;
        public event Action<XRNode> OnSecondaryButtonPressed;
        #endregion

        #region Unity Lifecycle
        private void Start()
        {
            InitializeControllers();
        }

        private void Update()
        {
            UpdateControllerStates();
            ProcessInput();

            if (showInputValues)
            {
                DisplayInputValues();
            }
        }
        #endregion

        #region Initialization
        private void InitializeControllers()
        {
            Log("Initializing VR controllers...");

            // Get left hand device
            var leftHandDevices = new List<InputDevice>();
            InputDevices.GetDevicesAtXRNode(XRNode.LeftHand, leftHandDevices);
            if (leftHandDevices.Count > 0)
            {
                _leftHandDevice = leftHandDevices[0];
                IsLeftControllerActive = true;
                Log($"Left controller connected: {_leftHandDevice.name}");
            }

            // Get right hand device
            var rightHandDevices = new List<InputDevice>();
            InputDevices.GetDevicesAtXRNode(XRNode.RightHand, rightHandDevices);
            if (rightHandDevices.Count > 0)
            {
                _rightHandDevice = rightHandDevices[0];
                IsRightControllerActive = true;
                Log($"Right controller connected: {_rightHandDevice.name}");
            }

            // Subscribe to device connection events
            InputDevices.deviceConnected += OnDeviceConnected;
            InputDevices.deviceDisconnected += OnDeviceDisconnected;
        }

        private void OnDestroy()
        {
            InputDevices.deviceConnected -= OnDeviceConnected;
            InputDevices.deviceDisconnected -= OnDeviceDisconnected;
        }
        #endregion

        #region Device Management
        private void OnDeviceConnected(InputDevice device)
        {
            Log($"Device connected: {device.name}");

            if (device.characteristics.HasFlag(InputDeviceCharacteristics.Left))
            {
                _leftHandDevice = device;
                IsLeftControllerActive = true;
            }
            else if (device.characteristics.HasFlag(InputDeviceCharacteristics.Right))
            {
                _rightHandDevice = device;
                IsRightControllerActive = true;
            }
        }

        private void OnDeviceDisconnected(InputDevice device)
        {
            Log($"Device disconnected: {device.name}");

            if (device == _leftHandDevice)
            {
                IsLeftControllerActive = false;
            }
            else if (device == _rightHandDevice)
            {
                IsRightControllerActive = false;
            }
        }

        private void UpdateControllerStates()
        {
            // Refresh device states
            if (!_leftHandDevice.isValid)
            {
                var leftHandDevices = new List<InputDevice>();
                InputDevices.GetDevicesAtXRNode(XRNode.LeftHand, leftHandDevices);
                if (leftHandDevices.Count > 0)
                {
                    _leftHandDevice = leftHandDevices[0];
                }
            }

            if (!_rightHandDevice.isValid)
            {
                var rightHandDevices = new List<InputDevice>();
                InputDevices.GetDevicesAtXRNode(XRNode.RightHand, rightHandDevices);
                if (rightHandDevices.Count > 0)
                {
                    _rightHandDevice = rightHandDevices[0];
                }
            }
        }
        #endregion

        #region Input Processing
        private void ProcessInput()
        {
            ProcessTriggerInput();
            ProcessGripInput();
            ProcessThumbstickInput();
            ProcessButtonInput();
        }

        private void ProcessTriggerInput()
        {
            // Left trigger
            if (_leftHandDevice.isValid)
            {
                if (_leftHandDevice.TryGetFeatureValue(CommonUsages.trigger, out float leftTrigger))
                {
                    bool isPressed = leftTrigger > triggerThreshold;
                    if (isPressed && !_leftTriggerPressed)
                    {
                        _leftTriggerPressed = true;
                        OnTriggerPressed?.Invoke(XRNode.LeftHand);
                    }
                    else if (!isPressed && _leftTriggerPressed)
                    {
                        _leftTriggerPressed = false;
                        OnTriggerReleased?.Invoke(XRNode.LeftHand);
                    }
                }
            }

            // Right trigger
            if (_rightHandDevice.isValid)
            {
                if (_rightHandDevice.TryGetFeatureValue(CommonUsages.trigger, out float rightTrigger))
                {
                    bool isPressed = rightTrigger > triggerThreshold;
                    if (isPressed && !_rightTriggerPressed)
                    {
                        _rightTriggerPressed = true;
                        OnTriggerPressed?.Invoke(XRNode.RightHand);
                    }
                    else if (!isPressed && _rightTriggerPressed)
                    {
                        _rightTriggerPressed = false;
                        OnTriggerReleased?.Invoke(XRNode.RightHand);
                    }
                }
            }
        }

        private void ProcessGripInput()
        {
            // Left grip
            if (_leftHandDevice.isValid)
            {
                if (_leftHandDevice.TryGetFeatureValue(CommonUsages.grip, out float leftGrip))
                {
                    bool isPressed = leftGrip > gripThreshold;
                    if (isPressed && !_leftGripPressed)
                    {
                        _leftGripPressed = true;
                        OnGripPressed?.Invoke(XRNode.LeftHand);
                    }
                    else if (!isPressed && _leftGripPressed)
                    {
                        _leftGripPressed = false;
                        OnGripReleased?.Invoke(XRNode.LeftHand);
                    }
                }
            }

            // Right grip
            if (_rightHandDevice.isValid)
            {
                if (_rightHandDevice.TryGetFeatureValue(CommonUsages.grip, out float rightGrip))
                {
                    bool isPressed = rightGrip > gripThreshold;
                    if (isPressed && !_rightGripPressed)
                    {
                        _rightGripPressed = true;
                        OnGripPressed?.Invoke(XRNode.RightHand);
                    }
                    else if (!isPressed && _rightGripPressed)
                    {
                        _rightGripPressed = false;
                        OnGripReleased?.Invoke(XRNode.RightHand);
                    }
                }
            }
        }

        private void ProcessThumbstickInput()
        {
            // Left thumbstick
            if (_leftHandDevice.isValid)
            {
                if (_leftHandDevice.TryGetFeatureValue(CommonUsages.primary2DAxis, out Vector2 leftStick))
                {
                    if (leftStick != _leftThumbstick)
                    {
                        _leftThumbstick = leftStick;
                        OnThumbstickMoved?.Invoke(XRNode.LeftHand, leftStick);
                    }
                }
            }

            // Right thumbstick
            if (_rightHandDevice.isValid)
            {
                if (_rightHandDevice.TryGetFeatureValue(CommonUsages.primary2DAxis, out Vector2 rightStick))
                {
                    if (rightStick != _rightThumbstick)
                    {
                        _rightThumbstick = rightStick;
                        OnThumbstickMoved?.Invoke(XRNode.RightHand, rightStick);
                    }
                }
            }
        }

        private void ProcessButtonInput()
        {
            // Left primary button (X on Quest)
            if (_leftHandDevice.isValid)
            {
                if (_leftHandDevice.TryGetFeatureValue(CommonUsages.primaryButton, out bool leftPrimary))
                {
                    if (leftPrimary)
                    {
                        OnPrimaryButtonPressed?.Invoke(XRNode.LeftHand);
                    }
                }

                if (_leftHandDevice.TryGetFeatureValue(CommonUsages.secondaryButton, out bool leftSecondary))
                {
                    if (leftSecondary)
                    {
                        OnSecondaryButtonPressed?.Invoke(XRNode.LeftHand);
                    }
                }
            }

            // Right primary button (A on Quest)
            if (_rightHandDevice.isValid)
            {
                if (_rightHandDevice.TryGetFeatureValue(CommonUsages.primaryButton, out bool rightPrimary))
                {
                    if (rightPrimary)
                    {
                        OnPrimaryButtonPressed?.Invoke(XRNode.RightHand);
                    }
                }

                if (_rightHandDevice.TryGetFeatureValue(CommonUsages.secondaryButton, out bool rightSecondary))
                {
                    if (rightSecondary)
                    {
                        OnSecondaryButtonPressed?.Invoke(XRNode.RightHand);
                    }
                }
            }
        }
        #endregion

        #region Public Methods
        /// <summary>
        /// Get controller position
        /// </summary>
        public bool GetControllerPosition(XRNode node, out Vector3 position)
        {
            var device = (node == XRNode.LeftHand) ? _leftHandDevice : _rightHandDevice;
            return device.TryGetFeatureValue(CommonUsages.devicePosition, out position);
        }

        /// <summary>
        /// Get controller rotation
        /// </summary>
        public bool GetControllerRotation(XRNode node, out Quaternion rotation)
        {
            var device = (node == XRNode.LeftHand) ? _leftHandDevice : _rightHandDevice;
            return device.TryGetFeatureValue(CommonUsages.deviceRotation, out rotation);
        }

        /// <summary>
        /// Trigger haptic feedback on controller
        /// </summary>
        public void TriggerHaptic(XRNode node, float amplitude, float duration)
        {
            var device = (node == XRNode.LeftHand) ? _leftHandDevice : _rightHandDevice;

            if (device.isValid)
            {
                HapticCapabilities capabilities;
                if (device.TryGetHapticCapabilities(out capabilities))
                {
                    if (capabilities.supportsImpulse)
                    {
                        device.SendHapticImpulse(0, amplitude, duration);
                    }
                }
            }
        }
        #endregion

        #region Debug
        private void DisplayInputValues()
        {
            string info = "=== VR Input ===\n";
            info += $"Left Controller: {(IsLeftControllerActive ? "Active" : "Inactive")}\n";
            info += $"Right Controller: {(IsRightControllerActive ? "Active" : "Inactive")}\n";
            info += $"Left Trigger: {_leftTriggerPressed}\n";
            info += $"Right Trigger: {_rightTriggerPressed}\n";
            info += $"Left Thumbstick: {_leftThumbstick}\n";
            info += $"Right Thumbstick: {_rightThumbstick}\n";

            Debug.Log(info);
        }
        #endregion

        #region Logging
        private void Log(string message)
        {
            if (debugMode)
            {
                Debug.Log($"[VRInput] {message}");
            }
        }
        #endregion
    }
}
