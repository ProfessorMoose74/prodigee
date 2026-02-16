import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import voiceService from '../../services/voiceService';
import {
  startRecording,
  stopRecording,
  setAudioBlob,
  setRecognitionResult,
  setVoiceFeedback,
  updateAudioLevels,
  setVoiceActivity,
  setError,
  setMicrophonePermission,
  setBrowserSupport
} from '../../store/slices/voiceSlice';

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

const waveAnimation = keyframes`
  0%, 100% { height: 20px; }
  50% { height: 60px; }
`;

const RecorderContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  border: 2px solid ${({ isRecording, theme }) =>
    isRecording ? theme.colors.primary.green : theme.colors.gray[200]
  };
  max-width: 400px;
  width: 100%;
`;

const MicButton = styled(motion.button)`
  width: 120px;
  height: 120px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ isRecording, theme }) =>
    isRecording 
      ? `linear-gradient(135deg, ${theme.colors.primary.green}, ${theme.colors.primary.blue})`
      : `linear-gradient(135deg, ${theme.colors.gray[300]}, ${theme.colors.gray[400]})`
  };
  border: 4px solid ${({ theme }) => theme.colors.white};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: ${({ theme }) => theme.colors.white};
  position: relative;
  
  ${({ isRecording }) => isRecording && `
    animation: ${pulse} 1.5s ease-in-out infinite;
  `}
  
  &:hover {
    transform: scale(1.05);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RecordingIndicator = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  color: ${({ theme }) => theme.colors.primary.green};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const RecordingDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme }) => theme.colors.primary.green};
  animation: ${pulse} 1s ease-in-out infinite;
`;

const VolumeVisualizer = styled.div`
  display: flex;
  align-items: end;
  justify-content: center;
  gap: 2px;
  height: 60px;
  width: 200px;
`;

const VolumeBar = styled.div`
  width: 4px;
  background: ${({ level, theme }) => {
    if (level > 0.7) return theme.colors.primary.green;
    if (level > 0.4) return theme.colors.primary.blue;
    if (level > 0.2) return theme.colors.primary.yellow;
    return theme.colors.gray[300];
  }};
  border-radius: 2px;
  height: ${({ level, isActive }) => 
    isActive ? `${Math.max(4, level * 60)}px` : '4px'
  };
  transition: height 0.1s ease-out;
  
  ${({ isActive, index }) => isActive && `
    animation: ${waveAnimation} ${1 + (index % 3) * 0.2}s ease-in-out infinite;
  `}
`;

const StatusMessage = styled(motion.div)`
  text-align: center;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PermissionPrompt = styled(motion.div)`
  background: ${({ theme }) => theme.colors.primary.yellow}20;
  border: 2px solid ${({ theme }) => theme.colors.primary.yellow};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing[4]};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const PermissionButton = styled(motion.button)`
  background: ${({ theme }) => theme.colors.primary.blue};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  margin-top: ${({ theme }) => theme.spacing[3]};
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary.purple};
  }
`;

const ErrorMessage = styled(motion.div)`
  background: ${({ theme }) => theme.colors.error}20;
  border: 2px solid ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[3]};
  color: ${({ theme }) => theme.colors.error};
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const VoiceRecorder = ({
  expectedResponse = null,
  onRecordingComplete = null,
  onRecognitionResult = null,
  autoStop = true,
  showVisualizer = true,
  className = '',
  disabled = false
}) => {
  const dispatch = useDispatch();
  const {
    isRecording,
    microphonePermission,
    browserSupport,
    error,
    audioLevels,
    isVoiceActive
  } = useSelector(state => state.voice);

  const [volume, setVolume] = useState(0);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState('Click microphone to start recording');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  
  const durationRef = useRef();
  const volumeHistory = useRef([]);

  // Initialize voice service and check support
  useEffect(() => {
    const initializeVoice = async () => {
      // Check browser support
      const supported = voiceService.isSupported();
      dispatch(setBrowserSupport({
        mediaRecorder: !!window.MediaRecorder,
        webAudio: !!(window.AudioContext || window.webkitAudioContext),
        speechRecognition: !!window.SpeechRecognition || !!window.webkitSpeechRecognition,
        speechSynthesis: !!window.speechSynthesis
      }));

      if (!supported) {
        setStatus('Voice recording not supported in this browser');
        return;
      }

      // Check microphone permission
      try {
        const permission = await voiceService.getPermissionStatus();
        dispatch(setMicrophonePermission(permission.state));
        
        if (permission.state === 'denied') {
          setShowPermissionPrompt(true);
          setStatus('Microphone permission needed for voice activities');
        }
      } catch (error) {
        console.error('Permission check failed:', error);
      }
    };

    initializeVoice();
  }, [dispatch]);

  // Set up voice service callbacks
  useEffect(() => {
    voiceService.onRecordingStart = () => {
      dispatch(startRecording());
      setStatus('Recording... Speak now!');
      startDurationTimer();
    };

    voiceService.onRecordingStop = (audioBlob) => {
      dispatch(stopRecording());
      dispatch(setAudioBlob(audioBlob));
      setStatus('Processing your voice...');
      stopDurationTimer();
      
      if (onRecordingComplete) {
        onRecordingComplete(audioBlob);
      }
    };

    voiceService.onError = (error) => {
      dispatch(setError(error.message));
      setStatus('Recording error occurred');
      stopDurationTimer();
    };

    voiceService.onVolumeChange = (newVolume) => {
      setVolume(newVolume);
      
      // Update volume history for visualizer
      volumeHistory.current.push(newVolume);
      if (volumeHistory.current.length > 50) {
        volumeHistory.current.shift();
      }
      
      dispatch(updateAudioLevels(volumeHistory.current.slice(-20)));
      
      // Voice activity detection
      const isActive = newVolume > 0.1;
      dispatch(setVoiceActivity({
        isActive,
        timestamp: Date.now()
      }));
    };

    voiceService.onDataAvailable = async (data) => {
      const { localAnalysis, serverResponse, audioBlob, error } = data;
      
      if (error) {
        setStatus('Using offline voice processing');
      } else {
        setStatus('Voice processing complete!');
      }

      // Handle recognition result
      const result = serverResponse || localAnalysis;
      if (result) {
        dispatch(setRecognitionResult({
          result: result.recognizedText || 'Voice detected',
          confidence: result.confidence || 0.5,
          accuracy: result.accuracy || 0.5
        }));

        if (result.feedback) {
          dispatch(setVoiceFeedback(result.feedback));
        }

        if (onRecognitionResult) {
          onRecognitionResult(result, audioBlob);
        }
      }
    };

    return () => {
      // Cleanup callbacks
      voiceService.onRecordingStart = null;
      voiceService.onRecordingStop = null;
      voiceService.onError = null;
      voiceService.onVolumeChange = null;
      voiceService.onDataAvailable = null;
    };
  }, [dispatch, onRecordingComplete, onRecognitionResult]);

  const startDurationTimer = () => {
    setDuration(0);
    durationRef.current = setInterval(() => {
      setDuration(prev => prev + 0.1);
    }, 100);
  };

  const stopDurationTimer = () => {
    if (durationRef.current) {
      clearInterval(durationRef.current);
      durationRef.current = null;
    }
  };

  const handleMicClick = async () => {
    if (disabled) return;

    try {
      if (isRecording) {
        voiceService.stopRecording();
      } else {
        if (microphonePermission === 'denied') {
          setShowPermissionPrompt(true);
          return;
        }

        await voiceService.startRecording();
        setShowPermissionPrompt(false);
        dispatch(setMicrophonePermission('granted'));
      }
    } catch (error) {
      dispatch(setError(error.message));
      if (error.message.includes('permission')) {
        setShowPermissionPrompt(true);
        dispatch(setMicrophonePermission('denied'));
      }
    }
  };

  const handlePermissionRequest = async () => {
    try {
      await voiceService.requestMicrophonePermission();
      dispatch(setMicrophonePermission('granted'));
      setShowPermissionPrompt(false);
      setStatus('Permission granted! Click microphone to start recording');
    } catch (error) {
      dispatch(setError('Microphone permission is required for voice activities'));
      dispatch(setMicrophonePermission('denied'));
    }
  };

  const formatDuration = (duration) => {
    return `${duration.toFixed(1)}s`;
  };

  const renderVolumeVisualizer = () => {
    if (!showVisualizer) return null;

    return (
      <VolumeVisualizer>
        {Array(40).fill(0).map((_, index) => (
          <VolumeBar
            key={index}
            level={audioLevels[index] || 0}
            isActive={isRecording}
            index={index}
          />
        ))}
      </VolumeVisualizer>
    );
  };

  return (
    <RecorderContainer
      className={className}
      isRecording={isRecording}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence>
        {showPermissionPrompt && (
          <PermissionPrompt
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div>🎤 Microphone access needed for voice activities</div>
            <PermissionButton
              onClick={handlePermissionRequest}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Enable Microphone
            </PermissionButton>
          </PermissionPrompt>
        )}

        {error && (
          <ErrorMessage
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {error}
          </ErrorMessage>
        )}
      </AnimatePresence>

      <MicButton
        isRecording={isRecording}
        onClick={handleMicClick}
        disabled={disabled || !browserSupport.mediaRecorder}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
      >
        {isRecording ? '⏹️' : '🎤'}
      </MicButton>

      {renderVolumeVisualizer()}

      <AnimatePresence>
        {isRecording && (
          <RecordingIndicator
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <RecordingDot />
            <span>Recording {formatDuration(duration)}</span>
          </RecordingIndicator>
        )}
      </AnimatePresence>

      <StatusMessage
        key={status}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {status}
      </StatusMessage>
    </RecorderContainer>
  );
};

export default VoiceRecorder;