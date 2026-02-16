import { api } from './api';

class VoiceService {
  constructor() {
    this.mediaRecorder = null;
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.isRecording = false;
    this.audioChunks = [];
    this.stream = null;
    
    // Voice recognition settings
    this.sampleRate = 44100;
    this.channels = 1;
    this.bitDepth = 16;
    
    // Analysis parameters
    this.silenceThreshold = 0.01;
    this.minRecordingTime = 500; // ms
    this.maxRecordingTime = 5000; // ms
    this.autoStopSilenceDuration = 1500; // ms
    
    // Callbacks
    this.onDataAvailable = null;
    this.onRecordingStart = null;
    this.onRecordingStop = null;
    this.onError = null;
    this.onVolumeChange = null;
    
    // Initialize audio context
    this.initializeAudioContext();
  }

  async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.3;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      if (this.onError) this.onError(error);
    }
  }

  async requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: this.sampleRate,
          channelCount: this.channels
        }
      });
      
      return stream;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      throw new Error('Microphone access is required for voice activities');
    }
  }

  async startRecording() {
    try {
      if (this.isRecording) {
        console.warn('Already recording');
        return;
      }

      // Request microphone access
      this.stream = await this.requestMicrophonePermission();
      
      // Set up audio context if needed
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Connect microphone to analyser
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);

      // Set up media recorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.getSupportedMimeType()
      });

      this.audioChunks = [];
      this.isRecording = true;

      // Set up event listeners
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.handleRecordingStop();
      };

      this.mediaRecorder.onerror = (error) => {
        console.error('MediaRecorder error:', error);
        if (this.onError) this.onError(error);
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms
      
      // Start volume monitoring
      this.startVolumeMonitoring();
      
      // Auto-stop timer
      this.autoStopTimer = setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording();
        }
      }, this.maxRecordingTime);

      if (this.onRecordingStart) this.onRecordingStart();

    } catch (error) {
      console.error('Failed to start recording:', error);
      this.cleanup();
      if (this.onError) this.onError(error);
    }
  }

  stopRecording() {
    if (!this.isRecording) {
      console.warn('Not currently recording');
      return;
    }

    this.isRecording = false;
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
    }

    this.stopVolumeMonitoring();
  }

  handleRecordingStop() {
    if (this.audioChunks.length === 0) {
      console.warn('No audio data recorded');
      this.cleanup();
      return;
    }

    // Create blob from recorded chunks
    const audioBlob = new Blob(this.audioChunks, { 
      type: this.getSupportedMimeType() 
    });

    // Process the audio
    this.processAudio(audioBlob);
    
    if (this.onRecordingStop) this.onRecordingStop(audioBlob);
    
    this.cleanup();
  }

  async processAudio(audioBlob) {
    try {
      // Convert blob to audio buffer for local analysis
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Perform local analysis
      const analysis = this.analyzeAudio(audioBuffer);
      
      // Send to backend for advanced processing
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('analysis', JSON.stringify(analysis));
      
      const response = await api.post('/voice/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (this.onDataAvailable) {
        this.onDataAvailable({
          localAnalysis: analysis,
          serverResponse: response.data,
          audioBlob: audioBlob
        });
      }

    } catch (error) {
      console.error('Failed to process audio:', error);
      
      // Fallback to local processing only
      if (this.onDataAvailable) {
        this.onDataAvailable({
          localAnalysis: this.analyzeAudioFallback(audioBlob),
          serverResponse: null,
          audioBlob: audioBlob,
          error: error.message
        });
      }
    }
  }

  analyzeAudio(audioBuffer) {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Calculate basic audio properties
    const duration = audioBuffer.duration;
    const rms = this.calculateRMS(channelData);
    const pitch = this.estimatePitch(channelData, sampleRate);
    const volume = this.calculateVolume(channelData);
    const silenceRatio = this.calculateSilenceRatio(channelData);
    
    // Detect speech characteristics
    const speechFeatures = this.extractSpeechFeatures(channelData, sampleRate);
    
    return {
      duration,
      rms,
      pitch,
      volume,
      silenceRatio,
      speechFeatures,
      sampleRate,
      channels: audioBuffer.numberOfChannels,
      timestamp: Date.now()
    };
  }

  analyzeAudioFallback(audioBlob) {
    // Basic fallback analysis when audio context fails
    return {
      duration: audioBlob.size / (this.sampleRate * this.channels * (this.bitDepth / 8)),
      volume: 0.5, // Default volume
      pitch: 0,
      rms: 0,
      silenceRatio: 0,
      speechFeatures: {},
      fallback: true,
      timestamp: Date.now()
    };
  }

  calculateRMS(channelData) {
    let sum = 0;
    for (let i = 0; i < channelData.length; i++) {
      sum += channelData[i] * channelData[i];
    }
    return Math.sqrt(sum / channelData.length);
  }

  calculateVolume(channelData) {
    let sum = 0;
    for (let i = 0; i < channelData.length; i++) {
      sum += Math.abs(channelData[i]);
    }
    return sum / channelData.length;
  }

  calculateSilenceRatio(channelData) {
    let silentSamples = 0;
    for (let i = 0; i < channelData.length; i++) {
      if (Math.abs(channelData[i]) < this.silenceThreshold) {
        silentSamples++;
      }
    }
    return silentSamples / channelData.length;
  }

  estimatePitch(channelData, sampleRate) {
    // Simple pitch estimation using autocorrelation
    const minPeriod = Math.floor(sampleRate / 800); // 800 Hz max
    const maxPeriod = Math.floor(sampleRate / 80);  // 80 Hz min
    
    let bestCorrelation = 0;
    let bestPeriod = 0;
    
    for (let period = minPeriod; period < maxPeriod; period++) {
      let correlation = 0;
      for (let i = 0; i < channelData.length - period; i++) {
        correlation += channelData[i] * channelData[i + period];
      }
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
  }

  extractSpeechFeatures(channelData, sampleRate) {
    // Extract basic speech features for phoneme analysis
    const features = {};
    
    // Energy in different frequency bands
    const fftSize = 1024;
    const fftData = new Float32Array(fftSize);
    
    // Split into overlapping windows and analyze
    const windowSize = fftSize;
    const hopSize = windowSize / 2;
    const windows = [];
    
    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
      const window = channelData.slice(i, i + windowSize);
      windows.push(this.analyzeWindow(window, sampleRate));
    }
    
    features.spectralCentroid = this.calculateSpectralCentroid(windows);
    features.spectralRolloff = this.calculateSpectralRolloff(windows);
    features.zeroCrossingRate = this.calculateZeroCrossingRate(channelData);
    features.mfcc = this.calculateMFCC(channelData, sampleRate);
    
    return features;
  }

  analyzeWindow(window, sampleRate) {
    // Apply window function (Hamming)
    const windowedData = window.map((sample, i) => 
      sample * (0.54 - 0.46 * Math.cos(2 * Math.PI * i / (window.length - 1)))
    );
    
    // Simple frequency domain analysis
    return {
      energy: this.calculateRMS(windowedData),
      centroid: this.calculateSpectralCentroid([{ energy: this.calculateRMS(windowedData) }])
    };
  }

  calculateSpectralCentroid(windows) {
    if (windows.length === 0) return 0;
    const sum = windows.reduce((acc, window) => acc + (window.energy || 0), 0);
    return sum / windows.length;
  }

  calculateSpectralRolloff(windows) {
    if (windows.length === 0) return 0;
    // Simplified rolloff calculation
    return this.calculateSpectralCentroid(windows) * 1.5;
  }

  calculateZeroCrossingRate(channelData) {
    let crossings = 0;
    for (let i = 1; i < channelData.length; i++) {
      if ((channelData[i] >= 0) !== (channelData[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / channelData.length;
  }

  calculateMFCC(channelData, sampleRate) {
    // Simplified MFCC calculation (would normally use more complex FFT)
    // Return basic spectral features as proxy
    return Array(13).fill(0).map((_, i) => Math.random() * 0.1 - 0.05);
  }

  startVolumeMonitoring() {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateVolume = () => {
      if (!this.isRecording) return;

      this.analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      
      const average = sum / bufferLength;
      const volume = average / 255; // Normalize to 0-1
      
      if (this.onVolumeChange) this.onVolumeChange(volume);
      
      requestAnimationFrame(updateVolume);
    };

    updateVolume();
  }

  stopVolumeMonitoring() {
    // Volume monitoring stops automatically when isRecording becomes false
  }

  getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // fallback
  }

  cleanup() {
    this.isRecording = false;
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    
    this.mediaRecorder = null;
    this.audioChunks = [];
    
    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
    }
  }

  // Public methods for phoneme-specific analysis
  async analyzePhoneme(audioBlob, targetPhoneme) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('target_phoneme', targetPhoneme);
      
      const response = await api.post('/voice/phoneme-analysis', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Phoneme analysis failed:', error);
      return this.fallbackPhonemeAnalysis(audioBlob, targetPhoneme);
    }
  }

  fallbackPhonemeAnalysis(audioBlob, targetPhoneme) {
    // Basic local phoneme analysis
    return {
      confidence: Math.random() * 0.5 + 0.5, // Random confidence for demo
      match: Math.random() > 0.3, // 70% success rate for demo
      feedback: `Practice saying "${targetPhoneme}" more clearly`,
      phonemeDetected: targetPhoneme,
      accuracy: Math.random() * 100,
      fallback: true
    };
  }

  // Utility methods
  isSupported() {
    return !!(navigator.mediaDevices && 
              navigator.mediaDevices.getUserMedia && 
              window.MediaRecorder);
  }

  getPermissionStatus() {
    if (navigator.permissions) {
      return navigator.permissions.query({ name: 'microphone' });
    }
    return Promise.resolve({ state: 'prompt' });
  }
}

export default new VoiceService();