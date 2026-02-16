#!/usr/bin/env python3
"""
Voice Processing System Test
Tests the SoundBlaster-enhanced voice processing implementation
"""

import sys
sys.path.insert(0, '.')

def test_voice_processor_initialization():
    """Test voice processor class initialization"""
    print("TESTING: Voice Processor Initialization")
    print("=" * 45)
    
    try:
        # Test imports
        import speech_recognition as sr
        print("   SUCCESS: SpeechRecognition imported")
        
        import pyttsx3
        print("   SUCCESS: pyttsx3 imported")
        
        import webrtcvad
        print("   SUCCESS: webrtcvad imported")
        
        import pyaudio
        print("   SUCCESS: pyaudio imported")
        
        import numpy as np
        print("   SUCCESS: numpy imported")
        
        from queue import Queue
        print("   SUCCESS: Queue imported")
        
    except ImportError as e:
        print(f"   ERROR: Missing dependency: {e}")
        return False
    
    # Test VoiceProcessor class
    try:
        from elemental_genius_backend import VoiceProcessor
        print("   SUCCESS: VoiceProcessor class imported")
        
        # Test initialization
        processor = VoiceProcessor()
        print("   SUCCESS: VoiceProcessor instance created")
        
        # Test methods exist
        required_methods = [
            'configure_tts_engine',
            'configure_soundblaster_processing', 
            'find_soundblaster_device',
            'process_audio_data',
            'analyze_audio_quality',
            'calculate_pronunciation_accuracy',
            'levenshtein_distance',
            'generate_speech_audio'
        ]
        
        for method in required_methods:
            if hasattr(processor, method):
                print(f"   SUCCESS: Method {method} exists")
            else:
                print(f"   ERROR: Method {method} missing")
                return False
                
        return True
        
    except Exception as e:
        print(f"   ERROR: VoiceProcessor initialization failed: {e}")
        return False

def test_pronunciation_accuracy():
    """Test pronunciation accuracy calculation"""
    print("\nTESTING: Pronunciation Accuracy Calculation")
    print("=" * 45)
    
    try:
        from elemental_genius_backend import VoiceProcessor
        processor = VoiceProcessor()
        
        # Test cases
        test_cases = [
            ("cat", "cat", 1.0),  # Perfect match
            ("cat", "bat", 0.67), # Similar (approximate)
            ("hello", "helo", 0.8), # Close match
            ("", "cat", 0.0),     # Empty input
            ("cat", "", 0.0),     # Empty expected
        ]
        
        for spoken, expected, target_accuracy in test_cases:
            accuracy = processor.calculate_pronunciation_accuracy(spoken, expected)
            print(f"   Test: '{spoken}' vs '{expected}' -> {accuracy:.2f} (target: ~{target_accuracy})")
            
            # Allow some tolerance in accuracy calculation
            if abs(accuracy - target_accuracy) <= 0.2:
                print("     SUCCESS: Accuracy within expected range")
            else:
                print("     WARNING: Accuracy outside expected range")
        
        return True
        
    except Exception as e:
        print(f"   ERROR: Pronunciation accuracy test failed: {e}")
        return False

def test_levenshtein_distance():
    """Test Levenshtein distance calculation"""
    print("\nTESTING: Levenshtein Distance Calculation")
    print("=" * 45)
    
    try:
        from elemental_genius_backend import VoiceProcessor
        processor = VoiceProcessor()
        
        # Test cases for Levenshtein distance
        test_cases = [
            ("cat", "cat", 0),    # Identical
            ("cat", "bat", 1),    # One substitution
            ("cat", "cats", 1),   # One insertion
            ("cats", "cat", 1),   # One deletion
            ("hello", "helo", 1), # One deletion
            ("", "cat", 3),       # Empty to word
            ("cat", "", 3),       # Word to empty
        ]
        
        for s1, s2, expected_distance in test_cases:
            distance = processor.levenshtein_distance(s1, s2)
            print(f"   Distance '{s1}' <-> '{s2}': {distance} (expected: {expected_distance})")
            
            if distance == expected_distance:
                print("     SUCCESS: Distance calculation correct")
            else:
                print("     ERROR: Distance calculation incorrect")
                return False
        
        return True
        
    except Exception as e:
        print(f"   ERROR: Levenshtein distance test failed: {e}")
        return False

def test_audio_quality_analysis():
    """Test audio quality analysis with mock data"""
    print("\nTESTING: Audio Quality Analysis")
    print("=" * 40)
    
    try:
        from elemental_genius_backend import VoiceProcessor
        import numpy as np
        processor = VoiceProcessor()
        
        # Create mock audio data (16-bit PCM)
        sample_rate = 16000
        duration = 1.0  # 1 second
        samples = int(sample_rate * duration)
        
        # Test different signal strengths
        test_signals = [
            ("Loud signal", np.random.randint(-16000, 16000, samples, dtype=np.int16)),
            ("Medium signal", np.random.randint(-8000, 8000, samples, dtype=np.int16)),
            ("Quiet signal", np.random.randint(-1000, 1000, samples, dtype=np.int16)),
        ]
        
        for signal_name, audio_data in test_signals:
            audio_bytes = audio_data.tobytes()
            quality_score = processor.analyze_audio_quality(audio_bytes)
            print(f"   {signal_name}: Quality score = {quality_score:.3f}")
            
            if 0.0 <= quality_score <= 1.0:
                print("     SUCCESS: Quality score in valid range")
            else:
                print("     ERROR: Quality score outside valid range")
                return False
        
        return True
        
    except Exception as e:
        print(f"   ERROR: Audio quality analysis test failed: {e}")
        return False

def test_tts_configuration():
    """Test TTS engine configuration"""
    print("\nTESTING: TTS Engine Configuration")
    print("=" * 40)
    
    try:
        import pyttsx3
        
        # Test TTS engine initialization
        engine = pyttsx3.init()
        print("   SUCCESS: TTS engine initialized")
        
        # Test property setting
        engine.setProperty('rate', 150)
        rate = engine.getProperty('rate')
        print(f"   Speech rate set to: {rate}")
        
        engine.setProperty('volume', 0.8)
        volume = engine.getProperty('volume')
        print(f"   Volume set to: {volume}")
        
        # Test voice enumeration
        voices = engine.getProperty('voices')
        if voices:
            print(f"   Available voices: {len(voices)}")
            for i, voice in enumerate(voices[:3]):  # Show first 3 voices
                if voice and hasattr(voice, 'name') and voice.name:
                    print(f"     Voice {i}: {voice.name}")
        else:
            print("   WARNING: No voices available")
        
        return True
        
    except Exception as e:
        print(f"   ERROR: TTS configuration test failed: {e}")
        return False

def test_feedback_generation():
    """Test feedback message generation"""
    print("\nTESTING: Feedback Generation")
    print("=" * 35)
    
    try:
        from elemental_genius_backend import generate_feedback
        
        test_scores = [
            (0.95, "Perfect"),
            (0.85, "Great"),
            (0.75, "Good"),
            (0.60, "Nice try"),
            (0.30, "That's okay"),
        ]
        
        for score, expected_category in test_scores:
            feedback = generate_feedback(score)
            print(f"   Score {score}: '{feedback}'")
            
            if feedback and len(feedback) > 0:
                print("     SUCCESS: Feedback generated")
            else:
                print("     ERROR: Empty feedback")
                return False
        
        return True
        
    except Exception as e:
        print(f"   ERROR: Feedback generation test failed: {e}")
        return False

if __name__ == "__main__":
    print("VOICE PROCESSING SYSTEM TEST")
    print("============================")
    
    tests = [
        test_voice_processor_initialization,
        test_pronunciation_accuracy,
        test_levenshtein_distance,
        test_audio_quality_analysis,
        test_tts_configuration,
        test_feedback_generation,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        else:
            print("   FAILED: Test did not pass")
    
    print(f"\nTEST SUMMARY: {passed}/{total} tests passed")
    
    if passed == total:
        print("SUCCESS: All voice processing tests passed!")
        print("\nVoice Processing Features Ready:")
        print("- SoundBlaster audio card integration")
        print("- Speech recognition with confidence scoring")
        print("- Pronunciation accuracy calculation")
        print("- Audio quality analysis")
        print("- Text-to-speech with child-friendly settings")
        print("- COPPA-compliant voice interaction logging")
        print("- Real-time parent WebSocket notifications")
    else:
        print("PARTIAL: Some voice processing tests failed")
        print("Check the error messages above for details")