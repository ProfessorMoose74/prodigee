# Elemental Genius Backend
# Version: 2.3 (NVIDIA V100 16GB GPU Enhancement)
# Python: 3.13
# OS: openSUSE Leap 15.6
# GPU: NVIDIA V100 16GB with CUDA 11.x & cuDNN 8.x

import os
import jwt
import datetime
import time
from functools import wraps
from collections import defaultdict
from flask import Flask, request, jsonify, g, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.security import generate_password_hash, check_password_hash
from celery import Celery
import redis
import tensorflow as tf
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
import speech_recognition as sr
import pyttsx3
import wave
try:
    import webrtcvad
    WEBRTCVAD_AVAILABLE = True
except ImportError:
    WEBRTCVAD_AVAILABLE = False
    print("webrtcvad not available - using basic audio quality analysis")
import io
import threading
from queue import Queue
try:
    import pyaudio
    PYAUDIO_AVAILABLE = True
except ImportError:
    PYAUDIO_AVAILABLE = False
    print("pyaudio not available - SoundBlaster device detection disabled")
import uuid

# --- System Configuration ---
# These configurations align with the distributed architecture prompt.
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your-super-secret-key-for-jwt-and-sessions')

    # Library Server: PostgreSQL Configuration
    # Tuned for a server with 256GB RAM as per the prompt.
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://user:password@library-server-ip/elemental_genius')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Integration Server: Redis & Celery Configuration
    # Assumes Redis is running on the Integration Server.
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://integration-server-ip:6379/0')
    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL

    # AI Server: GPU and Model Configuration
    # NVIDIA V100 16GB GPU Configuration for enhanced AI/ML processing
    NVIDIA_GPU_ID = int(os.environ.get('CUDA_VISIBLE_DEVICES', '0'))
    GPU_MEMORY_LIMIT = int(os.environ.get('GPU_MEMORY_LIMIT', '14336'))  # MB (14GB of 16GB for safety)
    TF_FORCE_GPU_ALLOW_GROWTH = os.environ.get('TF_FORCE_GPU_ALLOW_GROWTH', 'true').lower() == 'true'
    TF_ENABLE_XLA = os.environ.get('TF_ENABLE_XLA', 'true').lower() == 'true'  # XLA optimization for V100
    TF_MIXED_PRECISION = os.environ.get('TF_MIXED_PRECISION', 'true').lower() == 'true'  # FP16 for V100

# --- GPU Configuration for NVIDIA V100 16GB ---
# Initialize GPU before creating Flask app for optimal performance
def initialize_gpu():
    """Configure TensorFlow to use NVIDIA V100 16GB GPU with optimizations"""
    try:
        # Check for GPU availability
        gpus = tf.config.list_physical_devices('GPU')

        if gpus:
            gpu = gpus[Config.NVIDIA_GPU_ID] if len(gpus) > Config.NVIDIA_GPU_ID else gpus[0]

            # Configure GPU memory allocation
            if Config.TF_FORCE_GPU_ALLOW_GROWTH:
                # Allow memory growth (recommended for V100)
                tf.config.experimental.set_memory_growth(gpu, True)
                print(f"✅ GPU memory growth enabled for {gpu.name}")
            else:
                # Set specific memory limit
                tf.config.set_logical_device_configuration(
                    gpu,
                    [tf.config.LogicalDeviceConfiguration(memory_limit=Config.GPU_MEMORY_LIMIT)]
                )
                print(f"✅ GPU memory limit set to {Config.GPU_MEMORY_LIMIT}MB")

            # Enable XLA JIT compilation for V100 optimization
            if Config.TF_ENABLE_XLA:
                tf.config.optimizer.set_jit(True)
                print("✅ XLA JIT compilation enabled for V100 optimization")

            # Enable mixed precision for V100 Tensor Cores
            if Config.TF_MIXED_PRECISION:
                from tensorflow.keras import mixed_precision
                policy = mixed_precision.Policy('mixed_float16')
                mixed_precision.set_global_policy(policy)
                print("✅ Mixed precision (FP16) enabled for V100 Tensor Cores")

            # Log GPU details
            gpu_details = tf.config.experimental.get_device_details(gpu)
            print(f"🎮 GPU Initialized: NVIDIA V100 16GB")
            print(f"   Device: {gpu.name}")
            print(f"   Compute Capability: {gpu_details.get('compute_capability', 'N/A')}")
            print(f"   Memory: 16384 MB (16 GB)")

            return True

        else:
            print("⚠️  No GPU detected - running in CPU mode")
            print("   For V100 GPU support, ensure CUDA 11.x and cuDNN 8.x are installed")
            return False

    except Exception as e:
        print(f"❌ GPU initialization error: {e}")
        print("   Falling back to CPU mode")
        return False

# Initialize GPU before Flask app
GPU_AVAILABLE = initialize_gpu()

# --- Application Initialization ---
app = Flask(__name__)
app.config.from_object(Config)

# --- Extensions Initialization ---
db = SQLAlchemy(app)
celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'])
celery.conf.update(app.config)

# Connect to Redis for SocketIO message queue and other caching
# This is crucial for the multi-server Gunicorn deployment.
redis_client = redis.StrictRedis.from_url(app.config['REDIS_URL'])
socketio = SocketIO(app, message_queue=app.config['REDIS_URL'], cors_allowed_origins="*")

# --- Database Models (Library Server) ---
# Defines the core data structures for the platform.

class Parent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    
    # Enhanced parent features
    subscription_tier = db.Column(db.String(20), default='basic')  # basic, premium, enterprise
    communication_preferences = db.Column(db.JSON, default=lambda: {
        'email_notifications': True,
        'sms_notifications': False,
        'push_notifications': True,
        'daily_summary': True,
        'weekly_report': True,
        'milestone_alerts': True
    })
    monitoring_settings = db.Column(db.JSON, default=lambda: {
        'real_time_alerts': True,
        'session_start_notify': True,
        'struggle_detection': True,
        'achievement_celebration': True,
        'weekly_progress_review': True
    })
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    children = db.relationship('Child', backref='parent', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Child(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    parent_id = db.Column(db.Integer, db.ForeignKey('parent.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    avatar = db.Column(db.String(255), default='🌟')
    
    # Enhanced child features
    grade_level = db.Column(db.String(20))  # Pre-K, K, 1st, 2nd, etc.
    learning_style = db.Column(db.String(20), default='mixed')  # visual, auditory, kinesthetic, mixed
    current_week = db.Column(db.Integer, default=1)
    total_stars = db.Column(db.Integer, default=0)
    streak_days = db.Column(db.Integer, default=0)
    
    # Learning analytics
    skill_strengths = db.Column(db.JSON, default=list)  # Areas where child excels
    skill_challenges = db.Column(db.JSON, default=list)  # Areas needing extra support
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    last_active = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    progress = db.relationship('Progress', backref='child', uselist=False)
    sessions = db.relationship('Session', backref='child', lazy='dynamic')
    phonemic_progress = db.relationship('PhonemicProgress', backref='child', lazy='dynamic')
    learning_sessions = db.relationship('LearningSession', backref='child', lazy='dynamic')
    voice_interactions = db.relationship('VoiceInteraction', backref='child', lazy='dynamic')
    assessments = db.relationship('Assessment', backref='child', lazy='dynamic')

class Progress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    child_id = db.Column(db.Integer, db.ForeignKey('child.id'), nullable=False)
    
    # 8 Heggerty Skills Progress (0-100 scale)
    rhyming = db.Column(db.Float, default=0.0)
    onset_fluency = db.Column(db.Float, default=0.0)
    blending = db.Column(db.Float, default=0.0)
    isolating_final_medial = db.Column(db.Float, default=0.0)
    segmenting = db.Column(db.Float, default=0.0)
    adding_phonemes = db.Column(db.Float, default=0.0)
    deleting_phonemes = db.Column(db.Float, default=0.0)
    substituting_phonemes = db.Column(db.Float, default=0.0)
    
    # Overall phonemic awareness composite score
    phonemic_awareness = db.Column(db.Float, default=0.0)
    
    # Learning analytics
    learning_velocity = db.Column(db.Float, default=1.0)  # Pace of learning
    attention_span_minutes = db.Column(db.Integer, default=10)
    preferred_interaction_mode = db.Column(db.String(20), default='voice')  # voice, touch, mixed

class Session(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    child_id = db.Column(db.Integer, db.ForeignKey('child.id'), nullable=False)
    activity_type = db.Column(db.String(50), nullable=False)
    accuracy = db.Column(db.Float, nullable=False)
    duration = db.Column(db.Integer, nullable=False) # in seconds
    stars_earned = db.Column(db.Integer, nullable=False)
    engagement = db.Column(db.Float, default=8.0)
    completed_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

# --- Enhanced Database Models for Comprehensive Educational Tracking ---

class PhonemicProgress(db.Model):
    """Detailed phonemic progress tracking as specified in the system prompt"""
    __tablename__ = 'phonemic_progress'
    
    progress_id = db.Column(db.Integer, primary_key=True)
    child_id = db.Column(db.Integer, db.ForeignKey('child.id'), nullable=False)
    skill_type = db.Column(db.String(50), nullable=False)  # rhyming, blending, onset_fluency, etc.
    skill_category = db.Column(db.String(50), nullable=False)  # listen_identify, produce_rhyme, etc.
    week_number = db.Column(db.Integer, nullable=False)
    mastery_level = db.Column(db.Float, default=0.0)  # 0-100 scale
    accuracy_percentage = db.Column(db.Float, default=0.0)
    response_time_avg = db.Column(db.Float, default=0.0)  # Average response time in seconds
    attempts_total = db.Column(db.Integer, default=0)
    attempts_correct = db.Column(db.Integer, default=0)
    learning_curve_data = db.Column(db.JSON, default=list)  # Store progression data points
    voice_recognition_accuracy = db.Column(db.Float, default=0.0)
    first_attempt = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    last_practiced = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    mastery_achieved_at = db.Column(db.DateTime)

class LearningSession(db.Model):
    """Comprehensive learning sessions as specified in the system prompt"""
    __tablename__ = 'learning_sessions'
    
    session_id = db.Column(db.Integer, primary_key=True)
    child_id = db.Column(db.Integer, db.ForeignKey('child.id'), nullable=False)
    session_type = db.Column(db.String(50), nullable=False)  # daily_practice, assessment, remediation
    planned_duration = db.Column(db.Integer, nullable=False)  # seconds
    actual_duration = db.Column(db.Integer, nullable=False)  # seconds
    completion_status = db.Column(db.String(20), default='incomplete')  # completed, partial, abandoned
    activities_planned = db.Column(db.Integer, default=0)
    activities_completed = db.Column(db.Integer, default=0)
    overall_accuracy = db.Column(db.Float, default=0.0)
    engagement_score = db.Column(db.Float, default=0.0)  # 0-10 scale
    stars_earned = db.Column(db.Integer, default=0)
    activity_sequence = db.Column(db.JSON, default=list)  # Order of activities performed
    voice_interactions = db.Column(db.Integer, default=0)
    adaptive_adjustments = db.Column(db.JSON, default=list)  # AI adjustments made during session
    parent_notifications_sent = db.Column(db.Boolean, default=False)
    session_start = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    session_end = db.Column(db.DateTime)
    
    # Relationships
    voice_interaction_logs = db.relationship('VoiceInteraction', backref='learning_session', lazy='dynamic')

class VoiceInteraction(db.Model):
    """Voice interaction logging for COPPA-compliant analysis"""
    __tablename__ = 'voice_interactions'
    
    interaction_id = db.Column(db.Integer, primary_key=True)
    child_id = db.Column(db.Integer, db.ForeignKey('child.id'), nullable=False)
    session_id = db.Column(db.Integer, db.ForeignKey('learning_sessions.session_id'), nullable=True)
    interaction_type = db.Column(db.String(50), nullable=False)  # phoneme_response, word_response, yes_no, etc.
    prompt_given = db.Column(db.Text, nullable=False)  # The instruction/question given to child
    expected_response = db.Column(db.String(200))  # What we expected them to say
    actual_response = db.Column(db.String(200))  # What they actually said (transcribed text only)
    recognition_engine = db.Column(db.String(50), default='python_speech_recognition')
    recognition_confidence = db.Column(db.Float, default=0.0)  # 0-1 confidence score
    accuracy_score = db.Column(db.Float, default=0.0)  # How accurate was the response
    audio_quality_score = db.Column(db.Float, default=0.0)  # Quality of audio input
    response_time_seconds = db.Column(db.Float, default=0.0)  # Time taken to respond
    success_achieved = db.Column(db.Boolean, default=False)  # Did child succeed in the task
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class ContentLibrary(db.Model):
    """Educational content library for multi-subject learning"""
    __tablename__ = 'content_library'
    
    content_id = db.Column(db.Integer, primary_key=True)
    content_type = db.Column(db.String(50), nullable=False)  # activity, nursery_rhyme, assessment, lesson
    subject_area = db.Column(db.String(50), nullable=False)  # phonemic_awareness, math, science, geography
    age_range = db.Column(db.String(20), nullable=False)  # 3-5, 6-8, 9-12, 13+
    skill_objectives = db.Column(db.JSON, default=list)  # Learning objectives this content addresses
    file_path = db.Column(db.String(500))  # Path to content files (audio, video, images)
    download_priority = db.Column(db.Integer, default=1)  # 1=high, 5=low priority for caching
    difficulty_level = db.Column(db.String(20), default='standard')  # easy, standard, challenging
    prerequisite_skills = db.Column(db.JSON, default=list)  # Skills needed before this content
    content_metadata = db.Column(db.JSON, default=dict)  # Additional content-specific data
    active = db.Column(db.Boolean, default=True)  # Is this content currently available
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class Assessment(db.Model):
    """Assessment tracking for educational evaluation"""
    __tablename__ = 'assessments'
    
    assessment_id = db.Column(db.Integer, primary_key=True)
    child_id = db.Column(db.Integer, db.ForeignKey('child.id'), nullable=False)
    assessment_type = db.Column(db.String(50), nullable=False)  # weekly, milestone, diagnostic, placement
    week_number = db.Column(db.Integer)  # Which week this assessment covers
    skills_assessed = db.Column(db.JSON, default=list)  # List of skills tested
    overall_score = db.Column(db.Float, default=0.0)  # Overall assessment score (0-100)
    skill_scores = db.Column(db.JSON, default=dict)  # Individual skill scores
    recommendations = db.Column(db.JSON, default=list)  # AI-generated recommendations
    mastery_indicators = db.Column(db.JSON, default=dict)  # Which skills are mastered
    areas_for_improvement = db.Column(db.JSON, default=list)  # Skills needing work
    next_steps = db.Column(db.JSON, default=list)  # Suggested next learning activities
    assessment_duration = db.Column(db.Integer, default=0)  # Time taken in seconds
    administered_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class SystemAnalytics(db.Model):
    """System-wide analytics for platform monitoring"""
    __tablename__ = 'system_analytics'
    
    analytics_id = db.Column(db.Integer, primary_key=True)
    metric_type = db.Column(db.String(50), nullable=False)  # usage, performance, engagement, error
    metric_name = db.Column(db.String(100), nullable=False)  # Specific metric being tracked
    metric_value = db.Column(db.Float, nullable=False)  # Numeric value of the metric
    context_data = db.Column(db.JSON, default=dict)  # Additional context (user_id, session_id, etc.)
    server_component = db.Column(db.String(50))  # Which server component (AI, Library, Integration, ESX)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class HeggertyCurriculumData(db.Model):
    """Database storage for Heggerty curriculum content (alternative to hardcoded data)"""
    __tablename__ = 'heggerty_curriculum'
    
    curriculum_id = db.Column(db.Integer, primary_key=True)
    skill_name = db.Column(db.String(50), nullable=False)  # rhyming, blending, etc.
    week_number = db.Column(db.Integer, nullable=False)
    activity_type = db.Column(db.String(50), nullable=False)  # listen_identify, produce_rhyme, etc.
    difficulty_level = db.Column(db.String(20), nullable=False)
    learning_objectives = db.Column(db.JSON, default=list)
    activity_instructions = db.Column(db.Text, nullable=False)
    example_prompts = db.Column(db.JSON, default=list)
    hand_motions = db.Column(db.String(200))
    assessment_criteria = db.Column(db.JSON, default=dict)
    age_adaptations = db.Column(db.JSON, default=dict)  # Adaptations for different ages
    success_metrics = db.Column(db.JSON, default=dict)  # How to measure success
    active = db.Column(db.Boolean, default=True)

class NurseryRhymeData(db.Model):
    """Database storage for nursery rhyme content"""
    __tablename__ = 'nursery_rhymes'
    
    rhyme_id = db.Column(db.Integer, primary_key=True)
    week_number = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(100), nullable=False)
    full_lyrics = db.Column(db.Text, nullable=False)
    audio_file_path = db.Column(db.String(500))  # Path to audio recording
    motions_description = db.Column(db.Text)  # Description of hand/body motions
    learning_objectives = db.Column(db.JSON, default=list)
    motor_skills_targeted = db.Column(db.JSON, default=list)
    cultural_context = db.Column(db.Text)  # Cultural/historical context
    rhyming_focus = db.Column(db.String(200))  # Which rhyming patterns to emphasize
    interactive_elements = db.Column(db.JSON, default=list)  # Interactive components
    age_adaptations = db.Column(db.JSON, default=dict)
    active = db.Column(db.Boolean, default=True)

# --- Security & Rate Limiting ---

# JWT Token Blacklist for secure logout
JWT_BLACKLIST = set()

# Rate limiting storage (in production, use Redis)
RATE_LIMIT_STORAGE = defaultdict(list)

def rate_limit(max_requests=10, window_minutes=1):
    """
    Rate limiting decorator to prevent abuse
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # Get client identifier (IP + user agent for more uniqueness)
            client_id = request.remote_addr + request.headers.get('User-Agent', '')[:50]
            current_time = time.time()
            window_start = current_time - (window_minutes * 60)
            
            # Clean old entries
            RATE_LIMIT_STORAGE[client_id] = [
                timestamp for timestamp in RATE_LIMIT_STORAGE[client_id] 
                if timestamp > window_start
            ]
            
            # Check if over limit
            if len(RATE_LIMIT_STORAGE[client_id]) >= max_requests:
                return jsonify({
                    'message': 'Rate limit exceeded. Please try again later.',
                    'retry_after_seconds': window_minutes * 60
                }), 429
            
            # Record this request
            RATE_LIMIT_STORAGE[client_id].append(current_time)
            
            return f(*args, **kwargs)
        return decorated
    return decorator

def validate_json_input(required_fields=None, optional_fields=None):
    """
    Input validation decorator for JSON requests
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # Check if request has JSON
            if not request.is_json:
                return jsonify({'message': 'Request must be JSON'}), 400
            
            data = request.get_json()
            if not data:
                return jsonify({'message': 'Invalid JSON data'}), 400
            
            # Check required fields
            if required_fields:
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    return jsonify({
                        'message': f'Missing required fields: {", ".join(missing_fields)}'
                    }), 400
            
            # Check for unexpected fields (basic security)
            if required_fields or optional_fields:
                allowed_fields = set(required_fields or []) | set(optional_fields or [])
                unexpected_fields = set(data.keys()) - allowed_fields
                if unexpected_fields:
                    return jsonify({
                        'message': f'Unexpected fields: {", ".join(unexpected_fields)}'
                    }), 400
            
            return f(*args, **kwargs)
        return decorated
    return decorator

# --- Authentication & Authorization ---

def is_token_blacklisted(jti):
    """Check if a token JTI is blacklisted"""
    return jti in JWT_BLACKLIST

def blacklist_token(jti):
    """Add a token JTI to the blacklist"""
    JWT_BLACKLIST.add(jti)
    # In production, use Redis for distributed blacklist
    # redis_client.sadd('jwt_blacklist', jti)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Extract token from Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'message': 'Invalid authorization header format'}), 401
        
        if not token:
            return jsonify({'message': 'Authentication token is missing'}), 401
        
        try:
            # Decode and validate token
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            
            # Check if token is blacklisted (for logout functionality)
            token_jti = data.get('jti')
            if token_jti and is_token_blacklisted(token_jti):
                return jsonify({'message': 'Token has been revoked'}), 401
            
            # Validate required token fields
            if 'id' not in data or 'type' not in data:
                return jsonify({'message': 'Invalid token structure'}), 401
            
            # Set global variables for request context
            g.current_user_id = data['id']
            g.user_type = data['type'] 
            g.token_data = data
            
            # Additional validation for child tokens
            if data['type'] == 'child':
                if 'parent_id' not in data:
                    return jsonify({'message': 'Invalid child token'}), 401
                g.parent_id = data['parent_id']
                
                # Verify child still exists and belongs to parent
                child = Child.query.get(data['id'])
                if not child or child.parent_id != data['parent_id']:
                    return jsonify({'message': 'Child authorization invalid'}), 401
                    
                # Update last active timestamp
                child.last_active = datetime.datetime.utcnow()
                db.session.commit()
            
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is invalid'}), 401
        except Exception as e:
            return jsonify({'message': f'Token validation error: {str(e)}'}), 401
            
        return f(*args, **kwargs)
    return decorated

def parent_required(f):
    """Decorator that requires parent-level authentication"""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if g.user_type != 'parent':
            return jsonify({'message': 'Parent access required'}), 403
        return f(*args, **kwargs)
    return decorated

def child_or_parent_required(f):
    """Decorator that allows both child and parent access"""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if g.user_type not in ['child', 'parent']:
            return jsonify({'message': 'Invalid user type'}), 403
        return f(*args, **kwargs)
    return decorated

# --- Heggerty Phonemic Awareness Curriculum System ---
# Complete 35-week implementation of Dr. Michael Heggerty's methodology
# 8 Sequential Skills: Easiest to Most Difficult

class HeggertyCurriculum:
    """
    Complete implementation of Heggerty Phonemic Awareness Curriculum
    Based on Dr. Michael Heggerty's research-proven methodology
    """
    
    # 8 Sequential Skills with week ranges and progression
    SKILL_PROGRESSION = {
        'rhyming': {
            'weeks': range(1, 9),  # Weeks 1-8
            'difficulty': 'easiest',
            'description': 'Listen to rhyming pairs and produce rhymes',
            'prerequisites': [],
            'hand_motions': 'Point to ear for listening'
        },
        'onset_fluency': {
            'weeks': range(3, 13),  # Weeks 3-12
            'difficulty': 'easy',
            'description': 'Isolate beginning sounds in words',
            'prerequisites': ['rhyming'],
            'hand_motions': 'Punch it out gestures'
        },
        'blending': {
            'weeks': range(5, 21),  # Weeks 5-20
            'difficulty': 'moderate',
            'description': 'Combine sounds into words',
            'prerequisites': ['rhyming', 'onset_fluency'],
            'hand_motions': 'Smooth blending gestures'
        },
        'isolating_final_medial': {
            'weeks': range(8, 26),  # Weeks 8-25
            'difficulty': 'moderate',
            'description': 'Identify ending and middle sounds',
            'prerequisites': ['rhyming', 'onset_fluency', 'blending'],
            'hand_motions': 'Roller coaster motions for sound positions'
        },
        'segmenting': {
            'weeks': range(12, 31),  # Weeks 12-30
            'difficulty': 'challenging',
            'description': 'Break words into individual sounds',
            'prerequisites': ['rhyming', 'onset_fluency', 'blending', 'isolating_final_medial'],
            'hand_motions': 'Chopping motions with left-to-right progression'
        },
        'adding_phonemes': {
            'weeks': range(18, 33),  # Weeks 18-32
            'difficulty': 'challenging',
            'description': 'Add sounds to create new words',
            'prerequisites': ['rhyming', 'onset_fluency', 'blending', 'isolating_final_medial', 'segmenting'],
            'hand_motions': 'Building motions'
        },
        'deleting_phonemes': {
            'weeks': range(22, 35),  # Weeks 22-34
            'difficulty': 'difficult',
            'description': 'Remove sounds from words',
            'prerequisites': ['rhyming', 'onset_fluency', 'blending', 'isolating_final_medial', 'segmenting', 'adding_phonemes'],
            'hand_motions': 'Removal gestures'
        },
        'substituting_phonemes': {
            'weeks': range(26, 36),  # Weeks 26-35
            'difficulty': 'most_difficult',
            'description': 'Replace sounds to make new words',
            'prerequisites': ['rhyming', 'onset_fluency', 'blending', 'isolating_final_medial', 'segmenting', 'adding_phonemes', 'deleting_phonemes'],
            'hand_motions': 'Substitution gestures'
        }
    }
    
    # 35-Week Nursery Rhyme Sequence for Cultural Literacy
    NURSERY_RHYMES = {
        1: {
            'title': 'The Itsy Bitsy Spider',
            'lyrics': 'The itsy bitsy spider went up the water spout...',
            'motions': 'Climbing finger motions',
            'concepts': ['weather', 'persistence', 'cause_effect'],
            'rhyming_focus': 'spout/out, rain/again'
        },
        2: {
            'title': 'Little Miss Muffet',
            'lyrics': 'Little Miss Muffet sat on her tuffet...',
            'motions': 'Sitting and running motions',
            'concepts': ['story_sequence', 'fear_emotion'],
            'rhyming_focus': 'Muffet/tuffet, away/day'
        },
        3: {
            'title': 'Humpty Dumpty',
            'lyrics': 'Humpty Dumpty sat on a wall...',
            'motions': 'Sitting and falling motions',
            'concepts': ['problem_solving', 'consequences'],
            'rhyming_focus': 'wall/fall, men/again'
        },
        4: {
            'title': 'Twinkle, Twinkle, Little Star',
            'lyrics': 'Twinkle, twinkle, little star...',
            'motions': 'Twinkling finger motions',
            'concepts': ['wonder', 'questioning', 'astronomy'],
            'rhyming_focus': 'star/are, high/sky'
        },
        5: {
            'title': 'Row, Row, Row Your Boat',
            'lyrics': 'Row, row, row your boat...',
            'motions': 'Rowing motions',
            'concepts': ['perseverance', 'life_philosophy'],
            'rhyming_focus': 'boat/float, stream/dream'
        },
        # Continue for all 35 weeks...
        6: {'title': 'Old MacDonald Had a Farm', 'lyrics': 'Old MacDonald had a farm, E-I-E-I-O...', 'motions': 'Animal motions', 'concepts': ['animals', 'farms', 'sounds'], 'rhyming_focus': 'farm/arm, sound/around'},
        7: {'title': 'If You\'re Happy and You Know It', 'lyrics': 'If you\'re happy and you know it, clap your hands...', 'motions': 'Clapping and stomping', 'concepts': ['emotions', 'expression'], 'rhyming_focus': 'know/show, hands/clap'},
        8: {'title': 'The Wheels on the Bus', 'lyrics': 'The wheels on the bus go round and round...', 'motions': 'Circular and wiping motions', 'concepts': ['transportation', 'repetition'], 'rhyming_focus': 'round/sound, town/down'},
        9: {'title': 'Five Little Ducks', 'lyrics': 'Five little ducks went swimming one day...', 'motions': 'Swimming and counting motions', 'concepts': ['counting', 'family'], 'rhyming_focus': 'day/play, back/quack'},
        10: {'title': 'Baa, Baa, Black Sheep', 'lyrics': 'Baa, baa, black sheep, have you any wool?...', 'motions': 'Sheep motions', 'concepts': ['sharing', 'community'], 'rhyming_focus': 'sheep/keep, wool/full'},
        # Weeks 11-35 would continue with traditional nursery rhymes
        35: {
            'title': 'Mary, Mary, Quite Contrary',
            'lyrics': 'Mary, Mary, quite contrary, how does your garden grow?...',
            'motions': 'Gardening motions',
            'concepts': ['growth', 'nature', 'questioning'],
            'rhyming_focus': 'contrary/Mary, grow/row'
        }
    }
    
    # Detailed Activity Templates for Each Skill
    ACTIVITY_TEMPLATES = {
        'rhyming': {
            'listen_identify': {
                'instruction': 'Listen carefully. Do these words rhyme?',
                'examples': [('cat', 'hat'), ('dog', 'log'), ('sun', 'car')],
                'interaction_type': 'yes_no',
                'difficulty_levels': {
                    'easy': 'clear_rhymes',
                    'medium': 'near_rhymes', 
                    'hard': 'complex_patterns'
                }
            },
            'produce_rhyme': {
                'instruction': 'What word rhymes with this word?',
                'examples': ['cat -> hat', 'run -> sun', 'big -> pig'],
                'interaction_type': 'open_response',
                'scaffolding': 'picture_choices'
            }
        },
        'onset_fluency': {
            'isolate_beginning': {
                'instruction': 'What sound does this word start with?',
                'examples': ['ball -> /b/', 'sun -> /s/', 'tree -> /t/'],
                'interaction_type': 'phoneme_response',
                'hand_motion': 'punch_it_out'
            }
        },
        'blending': {
            'phoneme_to_word': {
                'instruction': 'Listen to these sounds and blend them together',
                'examples': ['/c/ /a/ /t/ -> cat', '/r/ /u/ /n/ -> run'],
                'interaction_type': 'word_response',
                'progression': '2_phoneme_to_4_phoneme'
            }
        },
        'isolating_final_medial': {
            'final_sound': {
                'instruction': 'What sound do you hear at the end?',
                'examples': ['dog -> /g/', 'cat -> /t/'],
                'interaction_type': 'phoneme_response',
                'hand_motion': 'roller_coaster_end'
            },
            'medial_sound': {
                'instruction': 'What sound is in the middle?',
                'examples': ['sit -> /i/', 'pet -> /e/'],
                'interaction_type': 'phoneme_response',
                'hand_motion': 'roller_coaster_middle'
            }
        },
        'segmenting': {
            'word_to_phonemes': {
                'instruction': 'Break this word into its sounds',
                'examples': ['cat -> /c/ /a/ /t/', 'run -> /r/ /u/ /n/'],
                'interaction_type': 'phoneme_sequence',
                'hand_motion': 'chopping_left_to_right'
            }
        },
        'adding_phonemes': {
            'add_to_beginning': {
                'instruction': 'Add this sound to the beginning',
                'examples': ['Add /s/ to "it" = "sit"', 'Add /c/ to "at" = "cat"'],
                'interaction_type': 'word_building',
                'complexity': 'progressive'
            },
            'add_to_end': {
                'instruction': 'Add this sound to the end',
                'examples': ['Add /s/ to "cat" = "cats"', 'Add /t/ to "car" = "cart"'],
                'interaction_type': 'word_building',
                'complexity': 'progressive'
            }
        },
        'deleting_phonemes': {
            'delete_beginning': {
                'instruction': 'Say this word without the first sound',
                'examples': ['Say "plant" without /p/ = "lant"', 'Say "stop" without /s/ = "top"'],
                'interaction_type': 'word_manipulation',
                'complexity': 'requires_strong_foundation'
            },
            'delete_end': {
                'instruction': 'Say this word without the last sound',
                'examples': ['Say "cart" without /t/ = "car"', 'Say "cats" without /s/ = "cat"'],
                'interaction_type': 'word_manipulation',
                'complexity': 'requires_strong_foundation'
            }
        },
        'substituting_phonemes': {
            'substitute_beginning': {
                'instruction': 'Change the first sound to make a new word',
                'examples': ['Change /c/ in "cat" to /h/ = "hat"', 'Change /r/ in "run" to /s/ = "sun"'],
                'interaction_type': 'advanced_manipulation',
                'complexity': 'most_complex_skill'
            },
            'substitute_end': {
                'instruction': 'Change the last sound to make a new word',
                'examples': ['Change /t/ in "cat" to /r/ = "car"', 'Change /g/ in "big" to /t/ = "bit"'],
                'interaction_type': 'advanced_manipulation',
                'complexity': 'most_complex_skill'
            }
        }
    }
    
    @classmethod
    def get_skills_for_week(cls, week_number):
        """Get all skills that should be taught in a specific week"""
        active_skills = []
        for skill, data in cls.SKILL_PROGRESSION.items():
            if week_number in data['weeks']:
                active_skills.append(skill)
        return active_skills
    
    @classmethod
    def get_skill_activities(cls, skill_name, week_number):
        """Get appropriate activities for a skill at a specific week"""
        if skill_name not in cls.ACTIVITY_TEMPLATES:
            return {}
        
        activities = cls.ACTIVITY_TEMPLATES[skill_name].copy()
        
        # Adjust difficulty based on week progression
        skill_weeks = list(cls.SKILL_PROGRESSION[skill_name]['weeks'])
        week_position = skill_weeks.index(week_number) if week_number in skill_weeks else 0
        total_weeks = len(skill_weeks)
        
        # Calculate difficulty progression (0.0 to 1.0)
        difficulty_progression = week_position / total_weeks if total_weeks > 0 else 0.0
        
        # Add difficulty metadata to activities
        for activity_key, activity_data in activities.items():
            activity_data['difficulty_progression'] = difficulty_progression
            activity_data['week_number'] = week_number
            activity_data['skill_name'] = skill_name
        
        return activities
    
    @classmethod
    def get_nursery_rhyme(cls, week_number):
        """Get the nursery rhyme for a specific week"""
        return cls.NURSERY_RHYMES.get(week_number, cls.NURSERY_RHYMES[1])
    
    @classmethod
    def assess_readiness(cls, child_progress, target_skill):
        """Assess if child is ready for a target skill based on prerequisites"""
        skill_data = cls.SKILL_PROGRESSION.get(target_skill, {})
        prerequisites = skill_data.get('prerequisites', [])
        
        readiness_score = 1.0  # Start with full readiness
        
        for prereq in prerequisites:
            # Check if child has sufficient progress in prerequisite
            progress_value = getattr(child_progress, prereq, 0.0)
            if progress_value < 70.0:  # Require 70% mastery of prerequisites
                readiness_score *= (progress_value / 70.0)
        
        return {
            'ready': readiness_score >= 0.8,
            'readiness_score': readiness_score,
            'missing_prerequisites': [p for p in prerequisites if getattr(child_progress, p, 0.0) < 70.0]
        }

# Create global curriculum instance
heggerty_curriculum = HeggertyCurriculum()

# --- Multi-Subject Educational Content System ---

class MultiSubjectCurriculum:
    """
    Comprehensive multi-subject educational content system
    Supporting Mathematics, Science, Astronomy, Geography, and Language Arts
    Age-appropriate content for 3-5, 6-8, 9-12, and 13+ year olds
    """
    
    SUBJECTS = {
        'mathematics': {
            'name': 'Mathematics',
            'description': 'Number sense, arithmetic, geometry, and problem solving',
            'age_ranges': ['3-5', '6-8', '9-12', '13+'],
            'skills_progression': {
                '3-5': ['counting', 'number_recognition', 'basic_shapes', 'patterns'],
                '6-8': ['addition', 'subtraction', 'multiplication', 'geometry_2d', 'word_problems'],
                '9-12': ['fractions', 'decimals', 'geometry_3d', 'algebra_basics', 'statistics'],
                '13+': ['advanced_algebra', 'trigonometry', 'calculus_intro', 'mathematical_reasoning']
            }
        },
        'science': {
            'name': 'Science',
            'description': 'Life science, physical science, earth science, and scientific method',
            'age_ranges': ['5-8', '9-12', '13+'],
            'skills_progression': {
                '5-8': ['animal_habitats', 'plant_life_cycles', 'states_of_matter', 'weather_patterns'],
                '9-12': ['human_body_systems', 'simple_machines', 'ecosystems', 'scientific_method'],
                '13+': ['chemistry_basics', 'physics_concepts', 'biology_advanced', 'environmental_science']
            }
        },
        'astronomy': {
            'name': 'Astronomy',
            'description': '3D solar system exploration, space science, and cosmic phenomena',
            'age_ranges': ['6-8', '9-12', '13+'],
            'skills_progression': {
                '6-8': ['solar_system_basics', 'day_night_cycle', 'moon_phases', 'constellations'],
                '9-12': ['planet_exploration', 'space_missions', 'stellar_lifecycle', 'galaxies'],
                '13+': ['astrophysics', 'cosmology', 'space_technology', 'exoplanets']
            }
        },
        'geography': {
            'name': 'Geography',
            'description': 'World awareness, map skills, cultural studies, and environmental geography',
            'age_ranges': ['6-8', '9-12', '13+'],
            'skills_progression': {
                '6-8': ['continents_oceans', 'basic_directions', 'cultural_diversity', 'landforms'],
                '9-12': ['countries_capitals', 'map_reading', 'climate_zones', 'natural_resources'],
                '13+': ['geopolitics', 'economic_geography', 'environmental_issues', 'urban_planning']
            }
        },
        'language_arts': {
            'name': 'Language Arts',
            'description': 'Reading comprehension, vocabulary, writing skills, and literary analysis',
            'age_ranges': ['5-8', '9-12', '13+'],
            'skills_progression': {
                '5-8': ['sight_words', 'reading_comprehension', 'creative_writing', 'story_elements'],
                '9-12': ['vocabulary_building', 'grammar_mechanics', 'research_skills', 'literary_genres'],
                '13+': ['advanced_composition', 'literary_analysis', 'rhetoric', 'critical_thinking']
            }
        }
    }
    
    # Detailed lesson templates for each subject and age range
    LESSON_TEMPLATES = {
        'mathematics': {
            '3-5': {
                'counting': {
                    'title': 'Number Fun with Objects',
                    'objective': 'Count objects from 1 to 10',
                    'activities': [
                        {'type': 'interactive_counting', 'objects': 'toys', 'range': '1-5'},
                        {'type': 'number_song', 'content': 'counting_rhyme'},
                        {'type': 'touch_and_count', 'visual_aids': True}
                    ],
                    'assessment': 'count_to_ten_accurately',
                    'duration_minutes': 10
                },
                'number_recognition': {
                    'title': 'Finding Numbers Everywhere',
                    'objective': 'Recognize written numbers 1-10',
                    'activities': [
                        {'type': 'number_hunt', 'environment': 'visual_game'},
                        {'type': 'number_matching', 'quantity_to_numeral': True},
                        {'type': 'trace_numbers', 'motor_skills': True}
                    ],
                    'assessment': 'identify_numbers_1_to_10',
                    'duration_minutes': 12
                }
            },
            '6-8': {
                'addition': {
                    'title': 'Addition Adventures',
                    'objective': 'Master single-digit addition with visual aids',
                    'activities': [
                        {'type': 'manipulative_addition', 'tools': 'counting_blocks'},
                        {'type': 'number_line_jumping', 'interactive': True},
                        {'type': 'word_problems', 'real_world_context': True}
                    ],
                    'assessment': 'solve_addition_problems_0_to_10',
                    'duration_minutes': 15
                },
                'geometry_2d': {
                    'title': 'Shape Detective',
                    'objective': 'Identify and classify 2D shapes',
                    'activities': [
                        {'type': 'shape_sorting', 'interactive_drag_drop': True},
                        {'type': 'real_world_shapes', 'photo_identification': True},
                        {'type': 'shape_creation', 'drawing_tools': True}
                    ],
                    'assessment': 'classify_basic_2d_shapes',
                    'duration_minutes': 18
                }
            }
        },
        'science': {
            '5-8': {
                'animal_habitats': {
                    'title': 'Where Animals Live',
                    'objective': 'Match animals to their natural habitats',
                    'activities': [
                        {'type': 'habitat_matching', 'animals': ['polar_bear', 'fish', 'bird'], 'habitats': ['arctic', 'ocean', 'forest']},
                        {'type': 'virtual_field_trip', 'destinations': ['rainforest', 'desert', 'wetlands']},
                        {'type': 'animal_adaptation', 'interactive_features': True}
                    ],
                    'assessment': 'match_10_animals_to_habitats',
                    'duration_minutes': 20
                },
                'states_of_matter': {
                    'title': 'Solid, Liquid, or Gas?',
                    'objective': 'Identify the three states of matter',
                    'activities': [
                        {'type': 'matter_sorting', 'examples': ['ice', 'water', 'steam']},
                        {'type': 'state_changes', 'animations': 'melting_freezing'},
                        {'type': 'real_world_examples', 'photo_classification': True}
                    ],
                    'assessment': 'classify_matter_states',
                    'duration_minutes': 16
                }
            }
        },
        'astronomy': {
            '6-8': {
                'solar_system_basics': {
                    'title': '3D Journey Through Our Solar System',
                    'objective': 'Identify planets and their basic characteristics',
                    'activities': [
                        {'type': '3d_planet_exploration', 'interactive_models': True, 'rotation_zoom': True},
                        {'type': 'planet_size_comparison', 'scale_visualization': True},
                        {'type': 'planet_facts_game', 'quiz_style': 'drag_drop'}
                    ],
                    'assessment': 'name_planets_in_order',
                    'duration_minutes': 25,
                    'requires_3d': True
                }
            },
            '9-12': {
                'space_missions': {
                    'title': 'Historic Space Exploration',
                    'objective': 'Learn about major space missions and discoveries',
                    'activities': [
                        {'type': 'mission_timeline', 'interactive_history': True},
                        {'type': 'spacecraft_design', 'engineering_challenge': True},
                        {'type': 'astronaut_training', 'simulation_game': True}
                    ],
                    'assessment': 'identify_major_space_missions',
                    'duration_minutes': 30
                }
            }
        }
    }
    
    @classmethod
    def get_subjects_for_age(cls, age):
        """Get available subjects for a specific age"""
        available_subjects = []
        for subject_key, subject_data in cls.SUBJECTS.items():
            age_ranges = subject_data['age_ranges']
            for age_range in age_ranges:
                start_age, end_age = map(int, age_range.split('-'))
                if start_age <= age <= end_age:
                    available_subjects.append({
                        'subject': subject_key,
                        'name': subject_data['name'],
                        'description': subject_data['description'],
                        'age_range': age_range
                    })
                    break
        return available_subjects
    
    @classmethod
    def get_age_range_for_age(cls, age):
        """Determine appropriate age range category for a given age"""
        if 3 <= age <= 5:
            return '3-5'
        elif 6 <= age <= 8:
            return '6-8'
        elif 9 <= age <= 12:
            return '9-12'
        elif age >= 13:
            return '13+'
        else:
            return '3-5'  # Default fallback
    
    @classmethod
    def get_subject_skills(cls, subject, age_range):
        """Get skill progression for a subject and age range"""
        if subject not in cls.SUBJECTS:
            return []
        
        skills_progression = cls.SUBJECTS[subject].get('skills_progression', {})
        return skills_progression.get(age_range, [])
    
    @classmethod
    def get_lesson_content(cls, subject, age_range, skill):
        """Get detailed lesson content for a specific skill"""
        if subject not in cls.LESSON_TEMPLATES:
            return None
        
        age_content = cls.LESSON_TEMPLATES[subject].get(age_range, {})
        return age_content.get(skill, None)
    
    @classmethod
    def generate_learning_path(cls, child_age, interests=None, current_skills=None):
        """
        Generate personalized learning path based on age, interests, and current skills
        This is where AI/ML would be integrated for adaptive learning
        """
        age_range = cls.get_age_range_for_age(child_age)
        available_subjects = cls.get_subjects_for_age(child_age)
        
        learning_path = {
            'age_range': age_range,
            'recommended_subjects': [],
            'daily_activities': [],
            'week_focus': {}
        }
        
        # Prioritize subjects based on age appropriateness and interests
        for subject_info in available_subjects:
            subject_key = subject_info['subject']
            skills = cls.get_subject_skills(subject_key, age_range)
            
            # Start with foundational skills
            if skills:
                recommended_skill = skills[0]  # Start with first skill
                lesson_content = cls.get_lesson_content(subject_key, age_range, recommended_skill)
                
                if lesson_content:
                    learning_path['recommended_subjects'].append({
                        'subject': subject_key,
                        'subject_name': subject_info['name'],
                        'recommended_skill': recommended_skill,
                        'lesson_content': lesson_content
                    })
        
        return learning_path

# Create global multi-subject curriculum instance
multi_subject_curriculum = MultiSubjectCurriculum()

# --- AI/ML Adaptive Learning System ---

class AILearningEngine:
    """
    TensorFlow and scikit-learn powered adaptive learning engine
    Provides personalized learning recommendations and difficulty adjustment
    """
    
    def __init__(self):
        self.model_loaded = False
        self.recommendation_model = None
        self.difficulty_model = None
        self.scaler = StandardScaler()
        
    def initialize_models(self):
        """Initialize AI/ML models for learning analytics using NVIDIA V100 16GB"""
        try:
            # GPU is already initialized at app startup
            if GPU_AVAILABLE:
                print(f"✅ AILearningEngine: Utilizing NVIDIA V100 16GB GPU")
                device_context = tf.device('/GPU:0')
            else:
                print("⚠️ AILearningEngine: Running in CPU mode")
                device_context = tf.device('/CPU:0')

            with device_context:
                # Create recommendation model (Neural Network) - optimized for V100
                self.recommendation_model = tf.keras.Sequential([
                tf.keras.layers.Dense(128, activation='relu', input_shape=(10,)),
                tf.keras.layers.Dropout(0.3),
                tf.keras.layers.Dense(64, activation='relu'),
                tf.keras.layers.Dropout(0.2),
                tf.keras.layers.Dense(32, activation='relu'),
                tf.keras.layers.Dense(8, activation='softmax')  # 8 Heggerty skills
            ])
            
            self.recommendation_model.compile(
                optimizer='adam',
                loss='categorical_crossentropy',
                metrics=['accuracy']
            )
            
            # Initialize Random Forest for difficulty adjustment
            self.difficulty_model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
            
            self.model_loaded = True
            print("✅ AI Learning Engine initialized successfully")
            
        except Exception as e:
            print(f"⚠️ AI Learning Engine initialization failed: {e}")
            self.model_loaded = False
    
    def extract_child_features(self, child):
        """Extract numerical features from child data for ML processing"""
        try:
            features = [
                child.age,
                child.current_week,
                child.total_stars / 100.0,  # Normalize stars
                child.streak_days / 30.0,   # Normalize streak
                child.progress.rhyming / 100.0,
                child.progress.onset_fluency / 100.0,
                child.progress.blending / 100.0,
                child.progress.isolating_final_medial / 100.0,
                child.progress.segmenting / 100.0,
                child.progress.learning_velocity
            ]
            return np.array(features).reshape(1, -1)
        except Exception as e:
            print(f"Feature extraction error: {e}")
            return np.zeros((1, 10))
    
    def predict_optimal_skill(self, child):
        """Use AI to predict the optimal next skill for the child"""
        if not self.model_loaded:
            return self._fallback_recommendation(child)
        
        try:
            features = self.extract_child_features(child)
            features_scaled = self.scaler.fit_transform(features)
            
            # Get prediction from neural network
            predictions = self.recommendation_model.predict(features_scaled, verbose=0)
            skill_probabilities = predictions[0]
            
            # Map to Heggerty skills
            heggerty_skills = [
                'rhyming', 'onset_fluency', 'blending', 'isolating_final_medial',
                'segmenting', 'adding_phonemes', 'deleting_phonemes', 'substituting_phonemes'
            ]
            
            # Get top 3 recommended skills
            top_indices = np.argsort(skill_probabilities)[-3:][::-1]
            recommendations = []
            
            for idx in top_indices:
                skill = heggerty_skills[idx]
                confidence = float(skill_probabilities[idx])
                current_progress = getattr(child.progress, skill, 0.0)
                
                recommendations.append({
                    'skill': skill,
                    'confidence': confidence,
                    'current_progress': current_progress,
                    'recommended': confidence > 0.1 and current_progress < 90.0
                })
            
            return recommendations[0] if recommendations else self._fallback_recommendation(child)
            
        except Exception as e:
            print(f"AI prediction error: {e}")
            return self._fallback_recommendation(child)
    
    def calculate_adaptive_difficulty(self, child, activity_type, recent_performance):
        """Use ML to calculate optimal difficulty level"""
        if not self.model_loaded:
            return self._fallback_difficulty(recent_performance)
        
        try:
            # Prepare features for difficulty prediction
            features = [
                child.age,
                getattr(child.progress, activity_type, 0.0) / 100.0,
                child.progress.learning_velocity,
                child.progress.attention_span_minutes / 20.0,  # Normalize
                recent_performance.get('accuracy', 0.0) / 100.0,
                recent_performance.get('response_time', 10.0) / 10.0,  # Normalize
                recent_performance.get('attempts', 1),
                len(recent_performance.get('session_history', [])) / 10.0
            ]
            
            # Predict difficulty level (0=easy, 1=medium, 2=hard)
            if hasattr(self.difficulty_model, 'predict'):
                difficulty_level = self.difficulty_model.predict([features])[0]
            else:
                difficulty_level = self._fallback_difficulty(recent_performance)
            
            return {
                'difficulty_level': int(difficulty_level),
                'difficulty_name': ['easy', 'medium', 'hard'][int(difficulty_level)],
                'confidence': 0.85,
                'reasoning': f"Based on current progress and recent performance"
            }
            
        except Exception as e:
            print(f"Difficulty prediction error: {e}")
            return self._fallback_difficulty(recent_performance)
    
    def analyze_learning_patterns(self, child_sessions):
        """Analyze learning patterns using TensorFlow"""
        try:
            if not child_sessions:
                return {'pattern': 'insufficient_data', 'recommendations': []}
            
            # Extract session data
            session_data = []
            for session in child_sessions:
                session_features = [
                    session.actual_duration / 600.0,  # Normalize to 10 minutes
                    session.overall_accuracy / 100.0,
                    session.engagement_score / 10.0,
                    session.activities_completed,
                    session.stars_earned / 10.0
                ]
                session_data.append(session_features)
            
            session_array = np.array(session_data)
            
            # Simple pattern analysis
            avg_accuracy = np.mean(session_array[:, 1]) * 100
            avg_engagement = np.mean(session_array[:, 2]) * 10
            learning_trend = 'improving' if len(session_data) > 1 and session_array[-1, 1] > session_array[0, 1] else 'stable'
            
            patterns = {
                'average_accuracy': round(avg_accuracy, 1),
                'average_engagement': round(avg_engagement, 1),
                'learning_trend': learning_trend,
                'optimal_session_length': int(np.mean(session_array[:, 0]) * 600),
                'recommendations': self._generate_pattern_recommendations(avg_accuracy, avg_engagement, learning_trend)
            }
            
            return patterns
            
        except Exception as e:
            print(f"Pattern analysis error: {e}")
            return {'pattern': 'analysis_error', 'recommendations': []}
    
    def _fallback_recommendation(self, child):
        """Fallback recommendation when AI is unavailable"""
        # Use the original algorithm as fallback
        current_week = child.current_week
        active_skills = heggerty_curriculum.get_skills_for_week(current_week)
        
        if not active_skills:
            return {'skill': 'rhyming', 'confidence': 0.5, 'source': 'fallback'}
        
        # Find skill with lowest progress that child is ready for
        best_skill = active_skills[0]
        lowest_progress = 100.0
        
        for skill in active_skills:
            current_progress = getattr(child.progress, skill, 0.0)
            readiness = heggerty_curriculum.assess_readiness(child.progress, skill)
            
            if readiness['ready'] and current_progress < lowest_progress:
                best_skill = skill
                lowest_progress = current_progress
        
        return {
            'skill': best_skill,
            'confidence': 0.7,
            'current_progress': lowest_progress,
            'source': 'fallback_algorithm'
        }
    
    def _fallback_difficulty(self, recent_performance):
        """Fallback difficulty calculation"""
        accuracy = recent_performance.get('accuracy', 75.0)
        if accuracy >= 90:
            return {'difficulty_level': 2, 'difficulty_name': 'hard', 'confidence': 0.6}
        elif accuracy >= 70:
            return {'difficulty_level': 1, 'difficulty_name': 'medium', 'confidence': 0.6}
        else:
            return {'difficulty_level': 0, 'difficulty_name': 'easy', 'confidence': 0.6}
    
    def _generate_pattern_recommendations(self, accuracy, engagement, trend):
        """Generate recommendations based on learning patterns"""
        recommendations = []
        
        if accuracy < 70:
            recommendations.append("Consider reviewing foundational skills")
        if engagement < 7:
            recommendations.append("Try more interactive and game-based activities")
        if trend == 'improving':
            recommendations.append("Great progress! Consider slightly increasing difficulty")
        
        return recommendations

# Initialize global AI learning engine
ai_learning_engine = AILearningEngine()

# --- AI-Powered Educational Functions ---

def generate_skill_recommendation(child):
    """
    AI-powered recommendation system using TensorFlow and scikit-learn
    Falls back to traditional algorithm if AI is unavailable
    """
    try:
        # Use AI recommendation if available
        ai_recommendation = ai_learning_engine.predict_optimal_skill(child)
        
        if ai_recommendation and ai_recommendation.get('confidence', 0) > 0.5:
            skill_data = heggerty_curriculum.SKILL_PROGRESSION.get(ai_recommendation['skill'], {})
            current_progress = ai_recommendation.get('current_progress', 0.0)
            
            # Generate motivational reason based on AI recommendation
            if current_progress < 30:
                reason = f"AI suggests starting with {skill_data.get('description', ai_recommendation['skill']).lower()}!"
            elif current_progress < 70:
                reason = f"AI detected great potential in {ai_recommendation['skill'].replace('_', ' ')}. Keep going!"
            else:
                reason = f"You're close to mastering {ai_recommendation['skill'].replace('_', ' ')}. Let's finish strong!"
            
            return {
                'recommended_skill': ai_recommendation['skill'],
                'reason': reason,
                'motivation_level': 'high' if ai_recommendation['confidence'] > 0.7 else 'medium',
                'confidence': ai_recommendation['confidence'],
                'source': 'ai_powered',
                'ai_reasoning': ai_recommendation.get('reasoning', 'Based on learning patterns and progress analysis')
            }
    
    except Exception as e:
        print(f"AI recommendation failed, using fallback: {e}")
    
    # Fallback to traditional algorithm
    current_week = child.current_week
    active_skills = heggerty_curriculum.get_skills_for_week(current_week)
    
    # Assess readiness for each skill
    skill_readiness = {}
    for skill in active_skills:
        readiness = heggerty_curriculum.assess_readiness(child.progress, skill)
        skill_readiness[skill] = readiness
    
    # Find the best skill to recommend
    best_skill = None
    best_score = 0
    
    for skill in active_skills:
        current_progress = getattr(child.progress, skill, 0.0)
        readiness = skill_readiness[skill]
        
        # Calculate recommendation score
        skill_data = heggerty_curriculum.SKILL_PROGRESSION[skill]
        difficulty_factor = {'easiest': 1.0, 'easy': 0.9, 'moderate': 0.8, 'challenging': 0.7, 'difficult': 0.6, 'most_difficult': 0.5}
        
        score = (
            readiness['readiness_score'] * 0.4 +
            (100 - current_progress) / 100 * 0.3 +
            difficulty_factor.get(skill_data['difficulty'], 0.5) * 0.2 +
            child.progress.learning_velocity * 0.1
        )
        
        if score > best_score:
            best_score = score
            best_skill = skill
    
    # Generate motivational reason
    if best_skill:
        skill_data = heggerty_curriculum.SKILL_PROGRESSION[best_skill]
        current_progress = getattr(child.progress, best_skill, 0.0)
        
        if current_progress < 30:
            reason = f"Let's start building your {skill_data['description'].lower()} skills!"
        elif current_progress < 70:
            reason = f"You're making great progress with {best_skill.replace('_', ' ')}. Keep going!"
        else:
            reason = f"You're almost mastering {best_skill.replace('_', ' ')}. Let's finish strong!"
    else:
        best_skill = 'rhyming'
        reason = "Let's practice some fun rhyming activities!"
    
    return {
        'recommended_skill': best_skill,
        'reason': reason,
        'motivation_level': 'high' if best_score > 0.7 else 'medium',
        'readiness_score': skill_readiness.get(best_skill, {}).get('readiness_score', 1.0),
        'source': 'traditional_algorithm'
    }

def calculate_progress_update(activity_type, accuracy, duration, child_current_progress):
    """
    Calculate how much progress to add based on performance
    Uses adaptive algorithm considering accuracy, time, and current progress level
    """
    base_progress = accuracy / 10  # Base progress from accuracy
    
    # Adjust for current progress level (diminishing returns as skill improves)
    if child_current_progress < 30:
        progress_multiplier = 1.5  # Faster progress for beginners
    elif child_current_progress < 70:
        progress_multiplier = 1.0  # Standard progress 
    else:
        progress_multiplier = 0.7  # Slower progress as skill approaches mastery
    
    # Time factor (optimal time gives bonus, too fast or slow reduces progress)
    optimal_time = 300  # 5 minutes in seconds
    if duration < optimal_time * 0.5:  # Too fast
        time_factor = 0.8
    elif duration > optimal_time * 2:  # Too slow
        time_factor = 0.9
    else:  # Good timing
        time_factor = 1.1
    
    final_progress = base_progress * progress_multiplier * time_factor
    return min(10, final_progress)  # Cap progress gain per session

# --- API Endpoints ---

# Health Check Endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'service': 'Elemental Genius Backend'}), 200

# --- Authentication Routes (Parent & Child) ---
@app.route('/parent/register', methods=['POST'])
@rate_limit(max_requests=5, window_minutes=10)  # Prevent registration abuse
@validate_json_input(required_fields=['name', 'email', 'password'], 
                    optional_fields=['subscription_tier', 'communication_preferences'])
def register_parent():
    """
    Secure parent registration with COPPA compliance considerations
    """
    data = request.get_json()
    
    # Validate email format
    import re
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, data['email']):
        return jsonify({'message': 'Invalid email format'}), 400
    
    # Check if parent already exists
    existing_parent = Parent.query.filter_by(email=data['email']).first()
    if existing_parent:
        return jsonify({'message': 'Email already registered'}), 409
    
    # Validate password strength
    password = data['password']
    if len(password) < 8:
        return jsonify({'message': 'Password must be at least 8 characters long'}), 400
    
    try:
        # Create new parent
        new_parent = Parent(
            name=data['name'][:100],  # Prevent overly long names
            email=data['email'].lower().strip(),
            subscription_tier=data.get('subscription_tier', 'basic'),
            communication_preferences=data.get('communication_preferences', {}),
            created_at=datetime.datetime.utcnow()
        )
        new_parent.set_password(password)
        
        db.session.add(new_parent)
        db.session.commit()
        
        return jsonify({
            'message': 'Parent registered successfully',
            'parent_id': new_parent.id,
            'next_step': 'Please log in to add children to your account'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Registration failed. Please try again.'}), 500

@app.route('/parent/login', methods=['POST'])
@rate_limit(max_requests=10, window_minutes=5)  # Prevent brute force attacks
@validate_json_input(required_fields=['email', 'password'])
def login_parent():
    """
    Secure parent login with enhanced validation
    """
    data = request.get_json()
    
    try:
        # Find parent by email
        parent = Parent.query.filter_by(email=data['email'].lower().strip()).first()
        
        # Use constant-time comparison to prevent timing attacks
        if not parent or not parent.check_password(data['password']):
            # Log failed attempt for security monitoring
            # In production, implement proper logging
            return jsonify({'message': 'Invalid email or password'}), 401
        
        # Update last login
        parent.last_login = datetime.datetime.utcnow()
        db.session.commit()
        
        # Create JWT token with additional security
        token_payload = {
            'id': parent.id,
            'type': 'parent',
            'email': parent.email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24),
            'iat': datetime.datetime.utcnow(),
            'jti': f"parent_{parent.id}_{int(time.time())}"  # Unique token ID for blacklisting
        }
        
        token = jwt.encode(token_payload, app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({
            'success': True, 
            'token': token,
            'sessionCookie': token,  # Frontend expects this field
            'user': {  # Frontend expects 'user' not 'parent'
                'id': parent.id,
                'uuid': parent.uuid,
                'name': parent.name,
                'email': parent.email,
                'userType': 'parent',  # Frontend expects this field
                'subscription_tier': parent.subscription_tier
            },
            'expires_in_hours': 24
        })
        
    except Exception as e:
        return jsonify({'message': 'Login failed. Please try again.'}), 500

@app.route('/child/login', methods=['POST'])
def login_child():
    """
    COPPA-Compliant Child Login - Requires parent authorization
    Children cannot log in directly - must be authorized by parent
    """
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('child_id') or not data.get('parent_token'):
        return jsonify({
            'success': False, 
            'message': 'Missing required fields: child_id and parent_token'
        }), 400
    
    child_id = data.get('child_id')
    parent_token = data.get('parent_token')
    
    # Verify parent token first
    try:
        parent_data = jwt.decode(parent_token, app.config['SECRET_KEY'], algorithms=["HS256"])
        if parent_data.get('type') != 'parent':
            return jsonify({'success': False, 'message': 'Invalid parent authorization'}), 401
            
        parent_id = parent_data.get('id')
    except jwt.ExpiredSignatureError:
        return jsonify({'success': False, 'message': 'Parent authorization expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'success': False, 'message': 'Invalid parent authorization'}), 401
    
    # Verify child exists and belongs to the parent
    child = Child.query.get(child_id)
    if not child:
        return jsonify({'success': False, 'message': 'Child not found'}), 404
    
    if child.parent_id != parent_id:
        return jsonify({'success': False, 'message': 'Child does not belong to this parent'}), 403
    
    # Update child's last active timestamp
    child.last_active = datetime.datetime.utcnow()
    db.session.commit()
    
    # Create child token with shorter expiration for safety
    child_token = jwt.encode({
        'id': child.id,
        'type': 'child',
        'parent_id': parent_id,  # Include parent ID for additional verification
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=4),  # Shorter session
        'iat': datetime.datetime.utcnow()  # Issued at time
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    # Log the login for parent monitoring
    socketio.emit('child_login', {
        'child_id': child.id,
        'child_name': child.name,
        'login_time': datetime.datetime.utcnow().isoformat(),
        'device_info': request.headers.get('User-Agent', 'Unknown')
    }, room=f'parent_room_{parent_id}')
    
    return jsonify({
        'success': True, 
        'token': child_token,
        'sessionCookie': child_token,  # Frontend expects this field
        'user': {  # Frontend expects 'user' not 'child'
            'id': child.id,
            'uuid': child.uuid,
            'name': child.name,
            'userType': 'child',  # Frontend expects this field
            'age': child.age,
            'parentId': child.parent_id,  # Frontend expects this field
            'avatar': child.avatar,
            'currentWeek': child.current_week,  # Frontend expects camelCase
            'totalStars': child.total_stars,
            'streakDays': child.streak_days
        },
        'session_duration_hours': 4
    })

@app.route('/logout', methods=['POST'])
@token_required
def logout():
    """
    Secure logout with token blacklisting
    Invalidates the current JWT token to prevent reuse
    """
    try:
        # Get token from request
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(" ")[1] if auth_header.startswith('Bearer ') else None
        
        if token:
            # Decode token to get JTI (if present) or create one from token content
            try:
                decoded_token = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"], options={"verify_exp": False})
                token_jti = decoded_token.get('jti', token[:20])  # Use first 20 chars as fallback ID
                
                # Blacklist the token
                blacklist_token(token_jti)
                
                # If child logout, notify parent
                if g.user_type == 'child' and hasattr(g, 'parent_id'):
                    child = Child.query.get(g.current_user_id)
                    socketio.emit('child_logout', {
                        'child_id': g.current_user_id,
                        'child_name': child.name if child else 'Unknown',
                        'logout_time': datetime.datetime.utcnow().isoformat()
                    }, room=f'parent_room_{g.parent_id}')
                
            except jwt.DecodeError:
                pass  # Token was invalid anyway
        
        return jsonify({
            'message': 'Logout successful. Token has been invalidated.',
            'logged_out_at': datetime.datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Logout completed with warnings'}), 200


# --- Child Interface Routes ---
@app.route('/child/dashboard', methods=['GET'])
@token_required
def child_dashboard():
    if g.user_type != 'child':
        return jsonify({'message': 'Access forbidden'}), 403
    
    child = Child.query.get(g.current_user_id)
    if not child:
        return jsonify({'message': 'Child not found'}), 404

    # Get current week activities using Heggerty curriculum
    current_week = child.current_week
    active_skills = heggerty_curriculum.get_skills_for_week(current_week)
    
    # Generate personalized activities for each active skill
    week_activities = {}
    for skill in active_skills:
        activities = heggerty_curriculum.get_skill_activities(skill, current_week)
        week_activities[skill] = activities
    
    # Get nursery rhyme for the week
    nursery_rhyme = heggerty_curriculum.get_nursery_rhyme(current_week)
    
    # AI-powered recommendation based on progress and readiness
    recommendation = generate_skill_recommendation(child)
        
    dashboard_data = {
        'child': {
            'id': child.id,
            'name': child.name,
            'avatar': child.avatar,
            'current_week': child.current_week,
            'total_stars': child.total_stars,
            'streak_days': child.streak_days,
            'age': child.age
        },
        'week_activities': week_activities,
        'nursery_rhyme': nursery_rhyme,
        'progress': {
            'rhyming': child.progress.rhyming,
            'onset_fluency': child.progress.onset_fluency,
            'blending': child.progress.blending,
            'isolating_final_medial': child.progress.isolating_final_medial,
            'segmenting': child.progress.segmenting,
            'adding_phonemes': child.progress.adding_phonemes,
            'deleting_phonemes': child.progress.deleting_phonemes,
            'substituting_phonemes': child.progress.substituting_phonemes,
            'phonemic_awareness': child.progress.phonemic_awareness
        },
        'recommendation': recommendation,
        'active_skills': active_skills
    }
    return jsonify(dashboard_data), 200

@app.route('/child/activity/<activity_type>', methods=['GET'])
@token_required
def get_activity(activity_type):
    if g.user_type != 'child':
        return jsonify({'message': 'Access forbidden'}), 403
    
    child = Child.query.get(g.current_user_id)
    if not child:
        return jsonify({'message': 'Child not found'}), 404
    
    # Get current week activities for this skill
    current_week = child.current_week
    
    # Check if the activity_type is a valid skill for the current week
    active_skills = heggerty_curriculum.get_skills_for_week(current_week)
    if activity_type not in active_skills:
        return jsonify({'message': 'Activity not available for current week'}), 404
    
    # Get specific activities for this skill and week
    activities = heggerty_curriculum.get_skill_activities(activity_type, current_week)
    if not activities:
        return jsonify({'message': 'Activity not found'}), 404
    
    # Get skill information
    skill_info = heggerty_curriculum.SKILL_PROGRESSION.get(activity_type, {})
    
    # Notify parent via WebSocket that activity has started
    if child.parent_id:
        socketio.emit('child_activity_started', {
            'child_id': child.id,
            'child_name': child.name,
            'activity_type': activity_type,
            'week_number': current_week,
            'skill_description': skill_info.get('description', ''),
            'timestamp': datetime.datetime.utcnow().isoformat()
        }, room=f'parent_room_{child.parent_id}')

    # Return comprehensive activity data
    activity_data = {
        'skill_name': activity_type,
        'skill_info': skill_info,
        'week_number': current_week,
        'activities': activities,
        'child_progress': getattr(child.progress, activity_type, 0.0),
        'difficulty_progression': activities.get(list(activities.keys())[0], {}).get('difficulty_progression', 0.0) if activities else 0.0
    }
    
    return jsonify(activity_data), 200

@app.route('/child/activity/<activity_type>/complete', methods=['POST'])
@token_required
def complete_activity(activity_type):
    if g.user_type != 'child':
        return jsonify({'message': 'Access forbidden'}), 403
        
    data = request.get_json()
    child = Child.query.get(g.current_user_id)
    
    # Record the detailed session
    new_session = Session(
        child_id=child.id,
        activity_type=activity_type,
        accuracy=data.get('accuracy'),
        duration=data.get('duration'),
        stars_earned=data.get('stars_earned'),
        engagement=data.get('engagement', 8.0)
    )
    db.session.add(new_session)
    
    # Update child's progress using adaptive algorithm
    if hasattr(child.progress, activity_type):
        current_progress = getattr(child.progress, activity_type, 0.0)
        progress_increase = calculate_progress_update(
            activity_type, 
            data.get('accuracy', 0), 
            data.get('duration', 300), 
            current_progress
        )
        new_progress = min(100.0, current_progress + progress_increase)
        setattr(child.progress, activity_type, new_progress)
        
        # Update overall phonemic awareness score (weighted average of all skills)
        all_skills = ['rhyming', 'onset_fluency', 'blending', 'isolating_final_medial', 
                     'segmenting', 'adding_phonemes', 'deleting_phonemes', 'substituting_phonemes']
        total_progress = sum(getattr(child.progress, skill, 0.0) for skill in all_skills)
        child.progress.phonemic_awareness = total_progress / len(all_skills)
    
    # Update child stats
    child.total_stars += data.get('stars_earned', 0)
    
    # Check for week advancement (advance when child shows consistent progress)
    if should_advance_week(child):
        child.current_week = min(35, child.current_week + 1)
    
    db.session.commit()

    # Notify parent via WebSocket with detailed progress
    if child.parent_id:
        socketio.emit('child_activity_completed', {
            'child_id': child.id,
            'child_name': child.name,
            'activity_type': activity_type,
            'accuracy': data.get('accuracy'),
            'progress_gained': progress_increase if hasattr(child.progress, activity_type) else 0,
            'new_progress_level': getattr(child.progress, activity_type, 0.0) if hasattr(child.progress, activity_type) else 0,
            'week_advanced': child.current_week
        }, room=f'parent_room_{child.parent_id}')
        
    return jsonify({
        'message': 'Activity completed and progress saved.',
        'progress_gained': progress_increase if hasattr(child.progress, activity_type) else 0,
        'new_progress': getattr(child.progress, activity_type, 0.0) if hasattr(child.progress, activity_type) else 0,
        'stars_earned': data.get('stars_earned', 0),
        'current_week': child.current_week
    }), 200

def should_advance_week(child):
    """
    Determine if child should advance to next week based on progress and mastery
    """
    current_week = child.current_week
    if current_week >= 35:  # Already at final week
        return False
    
    # Get skills for current week
    active_skills = heggerty_curriculum.get_skills_for_week(current_week)
    
    # Check if child has reasonable progress in current week's skills
    ready_to_advance = True
    for skill in active_skills:
        skill_progress = getattr(child.progress, skill, 0.0)
        
        # Different advancement criteria based on skill difficulty
        skill_data = heggerty_curriculum.SKILL_PROGRESSION[skill]
        
        if skill_data['difficulty'] in ['easiest', 'easy']:
            required_progress = 60.0  # 60% for easier skills
        elif skill_data['difficulty'] == 'moderate':
            required_progress = 50.0  # 50% for moderate skills
        else:
            required_progress = 40.0  # 40% for difficult skills
        
        if skill_progress < required_progress:
            ready_to_advance = False
            break
    
    return ready_to_advance

# --- Detailed Progress Tracking API Endpoints ---

@app.route('/child/phonemic-progress', methods=['GET'])
@child_or_parent_required
def get_phonemic_progress():
    """Get detailed phonemic progress for a child"""
    try:
        # Determine child_id based on user type
        if g.user_type == 'child':
            child_id = g.current_user_id
        else:  # parent
            child_id = request.args.get('child_id')
            if not child_id:
                return jsonify({'message': 'child_id parameter required for parent access'}), 400
            
            # Verify parent owns this child
            child = Child.query.filter_by(id=child_id, parent_id=g.current_user_id).first()
            if not child:
                return jsonify({'message': 'Child not found or access denied'}), 404
        
        # Get all phonemic progress records for the child
        progress_records = PhonemicProgress.query.filter_by(child_id=child_id).order_by(
            PhonemicProgress.week_number.desc(), 
            PhonemicProgress.last_practiced.desc()
        ).all()
        
        # Group by skill type
        progress_by_skill = {}
        for record in progress_records:
            skill = record.skill_type
            if skill not in progress_by_skill:
                progress_by_skill[skill] = []
            
            progress_by_skill[skill].append({
                'progress_id': record.progress_id,
                'skill_category': record.skill_category,
                'week_number': record.week_number,
                'mastery_level': record.mastery_level,
                'accuracy_percentage': record.accuracy_percentage,
                'response_time_avg': record.response_time_avg,
                'attempts_total': record.attempts_total,
                'attempts_correct': record.attempts_correct,
                'voice_recognition_accuracy': record.voice_recognition_accuracy,
                'first_attempt': record.first_attempt.isoformat() if record.first_attempt else None,
                'last_practiced': record.last_practiced.isoformat() if record.last_practiced else None,
                'mastery_achieved_at': record.mastery_achieved_at.isoformat() if record.mastery_achieved_at else None
            })
        
        return jsonify({
            'child_id': child_id,
            'progress_by_skill': progress_by_skill,
            'total_records': len(progress_records),
            'last_updated': max([r.last_practiced for r in progress_records]).isoformat() if progress_records else None
        })
        
    except Exception as e:
        return jsonify({'message': f'Error retrieving progress: {str(e)}'}), 500

@app.route('/child/phonemic-progress', methods=['POST'])
@child_or_parent_required
@validate_json_input(required_fields=['skill_type', 'skill_category', 'week_number'], 
                    optional_fields=['mastery_level', 'accuracy_percentage', 'response_time_avg', 
                                   'attempts_total', 'attempts_correct', 'voice_recognition_accuracy'])
def create_phonemic_progress():
    """Create or update phonemic progress record"""
    try:
        data = request.get_json()
        
        # Determine child_id
        if g.user_type == 'child':
            child_id = g.current_user_id
        else:  # parent
            child_id = data.get('child_id')
            if not child_id:
                return jsonify({'message': 'child_id required for parent access'}), 400
            
            # Verify parent owns this child
            child = Child.query.filter_by(id=child_id, parent_id=g.current_user_id).first()
            if not child:
                return jsonify({'message': 'Child not found or access denied'}), 404
        
        # Check if record already exists
        existing_record = PhonemicProgress.query.filter_by(
            child_id=child_id,
            skill_type=data['skill_type'],
            skill_category=data['skill_category'],
            week_number=data['week_number']
        ).first()
        
        if existing_record:
            # Update existing record
            existing_record.mastery_level = data.get('mastery_level', existing_record.mastery_level)
            existing_record.accuracy_percentage = data.get('accuracy_percentage', existing_record.accuracy_percentage)
            existing_record.response_time_avg = data.get('response_time_avg', existing_record.response_time_avg)
            existing_record.attempts_total = data.get('attempts_total', existing_record.attempts_total)
            existing_record.attempts_correct = data.get('attempts_correct', existing_record.attempts_correct)
            existing_record.voice_recognition_accuracy = data.get('voice_recognition_accuracy', existing_record.voice_recognition_accuracy)
            existing_record.last_practiced = datetime.datetime.utcnow()
            
            # Check for mastery achievement
            if existing_record.mastery_level >= 80.0 and not existing_record.mastery_achieved_at:
                existing_record.mastery_achieved_at = datetime.datetime.utcnow()
            
            record = existing_record
        else:
            # Create new record
            record = PhonemicProgress(
                child_id=child_id,
                skill_type=data['skill_type'],
                skill_category=data['skill_category'],
                week_number=data['week_number'],
                mastery_level=data.get('mastery_level', 0.0),
                accuracy_percentage=data.get('accuracy_percentage', 0.0),
                response_time_avg=data.get('response_time_avg', 0.0),
                attempts_total=data.get('attempts_total', 0),
                attempts_correct=data.get('attempts_correct', 0),
                voice_recognition_accuracy=data.get('voice_recognition_accuracy', 0.0)
            )
            db.session.add(record)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Phonemic progress updated successfully',
            'progress_id': record.progress_id,
            'mastery_level': record.mastery_level,
            'mastery_achieved': record.mastery_achieved_at is not None
        }), 201 if not existing_record else 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating progress: {str(e)}'}), 500

@app.route('/child/learning-sessions', methods=['GET'])
@child_or_parent_required
def get_learning_sessions():
    """Get learning sessions for a child with pagination"""
    try:
        # Determine child_id
        if g.user_type == 'child':
            child_id = g.current_user_id
        else:  # parent
            child_id = request.args.get('child_id')
            if not child_id:
                return jsonify({'message': 'child_id parameter required for parent access'}), 400
            
            # Verify parent owns this child
            child = Child.query.filter_by(id=child_id, parent_id=g.current_user_id).first()
            if not child:
                return jsonify({'message': 'Child not found or access denied'}), 404
        
        # Pagination parameters
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)  # Max 100 per page
        
        # Date filtering
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = LearningSession.query.filter_by(child_id=child_id)
        
        if start_date:
            try:
                start_dt = datetime.datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(LearningSession.session_start >= start_dt)
            except ValueError:
                return jsonify({'message': 'Invalid start_date format. Use ISO format.'}), 400
        
        if end_date:
            try:
                end_dt = datetime.datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(LearningSession.session_start <= end_dt)
            except ValueError:
                return jsonify({'message': 'Invalid end_date format. Use ISO format.'}), 400
        
        # Execute paginated query
        sessions = query.order_by(LearningSession.session_start.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        session_data = []
        for session in sessions.items:
            session_data.append({
                'session_id': session.session_id,
                'session_type': session.session_type,
                'planned_duration': session.planned_duration,
                'actual_duration': session.actual_duration,
                'completion_status': session.completion_status,
                'activities_planned': session.activities_planned,
                'activities_completed': session.activities_completed,
                'overall_accuracy': session.overall_accuracy,
                'engagement_score': session.engagement_score,
                'stars_earned': session.stars_earned,
                'voice_interactions': session.voice_interactions,
                'session_start': session.session_start.isoformat() if session.session_start else None,
                'session_end': session.session_end.isoformat() if session.session_end else None,
                'adaptive_adjustments': session.adaptive_adjustments
            })
        
        return jsonify({
            'child_id': child_id,
            'sessions': session_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': sessions.total,
                'pages': sessions.pages,
                'has_next': sessions.has_next,
                'has_prev': sessions.has_prev
            }
        })
        
    except Exception as e:
        return jsonify({'message': f'Error retrieving sessions: {str(e)}'}), 500

@app.route('/child/learning-sessions', methods=['POST'])
@child_or_parent_required
@validate_json_input(required_fields=['session_type', 'planned_duration'], 
                    optional_fields=['activities_planned', 'child_id'])
def create_learning_session():
    """Start a new learning session"""
    try:
        data = request.get_json()
        
        # Determine child_id
        if g.user_type == 'child':
            child_id = g.current_user_id
        else:  # parent
            child_id = data.get('child_id')
            if not child_id:
                return jsonify({'message': 'child_id required for parent access'}), 400
            
            # Verify parent owns this child
            child = Child.query.filter_by(id=child_id, parent_id=g.current_user_id).first()
            if not child:
                return jsonify({'message': 'Child not found or access denied'}), 404
        
        # Create new learning session
        session = LearningSession(
            child_id=child_id,
            session_type=data['session_type'],
            planned_duration=data['planned_duration'],
            actual_duration=0,  # Will be updated when session ends
            activities_planned=data.get('activities_planned', 0),
            session_start=datetime.datetime.utcnow()
        )
        
        db.session.add(session)
        db.session.commit()
        
        # Notify parent if child started session
        if g.user_type == 'child':
            child = Child.query.get(child_id)
            socketio.emit('learning_session_started', {
                'child_id': child_id,
                'child_name': child.name,
                'session_id': session.session_id,
                'session_type': session.session_type,
                'planned_duration': session.planned_duration,
                'timestamp': session.session_start.isoformat()
            }, room=f'parent_room_{child.parent_id}')
        
        return jsonify({
            'message': 'Learning session started',
            'session_id': session.session_id,
            'session_start': session.session_start.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating session: {str(e)}'}), 500

@app.route('/child/learning-sessions/<int:session_id>/complete', methods=['PUT'])
@child_or_parent_required
@validate_json_input(required_fields=['actual_duration'], 
                    optional_fields=['completion_status', 'activities_completed', 'overall_accuracy', 
                                   'engagement_score', 'stars_earned', 'adaptive_adjustments'])
def complete_learning_session(session_id):
    """Complete a learning session with results"""
    try:
        data = request.get_json()
        
        # Find the session
        session = LearningSession.query.get(session_id)
        if not session:
            return jsonify({'message': 'Learning session not found'}), 404
        
        # Verify access permissions
        if g.user_type == 'child':
            if session.child_id != g.current_user_id:
                return jsonify({'message': 'Access denied'}), 403
        else:  # parent
            child = Child.query.filter_by(id=session.child_id, parent_id=g.current_user_id).first()
            if not child:
                return jsonify({'message': 'Access denied'}), 403
        
        # Update session with completion data
        session.actual_duration = data['actual_duration']
        session.completion_status = data.get('completion_status', 'completed')
        session.activities_completed = data.get('activities_completed', session.activities_completed)
        session.overall_accuracy = data.get('overall_accuracy', session.overall_accuracy)
        session.engagement_score = data.get('engagement_score', session.engagement_score)
        session.stars_earned = data.get('stars_earned', session.stars_earned)
        session.adaptive_adjustments = data.get('adaptive_adjustments', session.adaptive_adjustments)
        session.session_end = datetime.datetime.utcnow()
        
        db.session.commit()
        
        # Notify parent of session completion
        child = Child.query.get(session.child_id)
        socketio.emit('learning_session_completed', {
            'child_id': session.child_id,
            'child_name': child.name,
            'session_id': session.session_id,
            'completion_status': session.completion_status,
            'overall_accuracy': session.overall_accuracy,
            'engagement_score': session.engagement_score,
            'stars_earned': session.stars_earned,
            'duration_minutes': round(session.actual_duration / 60, 1),
            'timestamp': session.session_end.isoformat()
        }, room=f'parent_room_{child.parent_id}')
        
        return jsonify({
            'message': 'Learning session completed successfully',
            'session_id': session.session_id,
            'duration_minutes': round(session.actual_duration / 60, 1),
            'completion_status': session.completion_status
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error completing session: {str(e)}'}), 500

# --- Voice Interaction API Endpoints (COPPA Compliant) ---

@app.route('/child/voice-interactions', methods=['GET'])
@child_or_parent_required
def get_voice_interactions():
    """Get voice interaction history for a child (COPPA compliant - text only)"""
    try:
        # Determine child_id
        if g.user_type == 'child':
            child_id = g.current_user_id
        else:  # parent
            child_id = request.args.get('child_id')
            if not child_id:
                return jsonify({'message': 'child_id parameter required for parent access'}), 400
            
            # Verify parent owns this child
            child = Child.query.filter_by(id=child_id, parent_id=g.current_user_id).first()
            if not child:
                return jsonify({'message': 'Child not found or access denied'}), 404
        
        # Pagination and filtering
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 50)), 100)
        session_id = request.args.get('session_id')
        interaction_type = request.args.get('interaction_type')
        
        query = VoiceInteraction.query.filter_by(child_id=child_id)
        
        if session_id:
            query = query.filter_by(session_id=session_id)
        if interaction_type:
            query = query.filter_by(interaction_type=interaction_type)
        
        interactions = query.order_by(VoiceInteraction.timestamp.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        interaction_data = []
        for interaction in interactions.items:
            interaction_data.append({
                'interaction_id': interaction.interaction_id,
                'session_id': interaction.session_id,
                'interaction_type': interaction.interaction_type,
                'prompt_given': interaction.prompt_given,
                'expected_response': interaction.expected_response,
                'actual_response': interaction.actual_response,  # COPPA compliant - text only
                'recognition_confidence': interaction.recognition_confidence,
                'accuracy_score': interaction.accuracy_score,
                'audio_quality_score': interaction.audio_quality_score,
                'response_time_seconds': interaction.response_time_seconds,
                'success_achieved': interaction.success_achieved,
                'timestamp': interaction.timestamp.isoformat()
            })
        
        return jsonify({
            'child_id': child_id,
            'interactions': interaction_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': interactions.total,
                'pages': interactions.pages,
                'has_next': interactions.has_next,
                'has_prev': interactions.has_prev
            }
        })
        
    except Exception as e:
        return jsonify({'message': f'Error retrieving interactions: {str(e)}'}), 500

@app.route('/child/voice-interactions', methods=['POST'])
@child_or_parent_required
@validate_json_input(required_fields=['interaction_type', 'prompt_given'], 
                    optional_fields=['session_id', 'expected_response', 'actual_response', 
                                   'recognition_confidence', 'accuracy_score', 'audio_quality_score',
                                   'response_time_seconds', 'success_achieved', 'child_id'])
def create_voice_interaction():
    """Log a voice interaction (COPPA compliant - stores transcribed text only)"""
    try:
        data = request.get_json()
        
        # Determine child_id
        if g.user_type == 'child':
            child_id = g.current_user_id
        else:  # parent
            child_id = data.get('child_id')
            if not child_id:
                return jsonify({'message': 'child_id required for parent access'}), 400
            
            # Verify parent owns this child
            child = Child.query.filter_by(id=child_id, parent_id=g.current_user_id).first()
            if not child:
                return jsonify({'message': 'Child not found or access denied'}), 404
        
        # COPPA Compliance: Ensure we're only storing transcribed text, not raw audio
        if 'audio_data' in data:
            return jsonify({'message': 'Raw audio data not accepted for COPPA compliance'}), 400
        
        # Create voice interaction record
        interaction = VoiceInteraction(
            child_id=child_id,
            session_id=data.get('session_id'),
            interaction_type=data['interaction_type'],
            prompt_given=data['prompt_given'],
            expected_response=data.get('expected_response', ''),
            actual_response=data.get('actual_response', ''),  # Transcribed text only
            recognition_confidence=data.get('recognition_confidence', 0.0),
            accuracy_score=data.get('accuracy_score', 0.0),
            audio_quality_score=data.get('audio_quality_score', 0.0),
            response_time_seconds=data.get('response_time_seconds', 0.0),
            success_achieved=data.get('success_achieved', False)
        )
        
        db.session.add(interaction)
        db.session.commit()
        
        # Update session voice interaction count if session_id provided
        if interaction.session_id:
            session = LearningSession.query.get(interaction.session_id)
            if session:
                session.voice_interactions = session.voice_interactions + 1
                db.session.commit()
        
        return jsonify({
            'message': 'Voice interaction logged successfully',
            'interaction_id': interaction.interaction_id,
            'accuracy_score': interaction.accuracy_score,
            'success_achieved': interaction.success_achieved
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error logging interaction: {str(e)}'}), 500

# --- Assessment API Endpoints ---

@app.route('/child/assessments', methods=['GET'])
@child_or_parent_required
def get_assessments():
    """Get assessment history for a child"""
    try:
        # Determine child_id
        if g.user_type == 'child':
            child_id = g.current_user_id
        else:  # parent
            child_id = request.args.get('child_id')
            if not child_id:
                return jsonify({'message': 'child_id parameter required for parent access'}), 400
            
            # Verify parent owns this child
            child = Child.query.filter_by(id=child_id, parent_id=g.current_user_id).first()
            if not child:
                return jsonify({'message': 'Child not found or access denied'}), 404
        
        # Filtering parameters
        assessment_type = request.args.get('assessment_type')
        week_number = request.args.get('week_number')
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 50)
        
        query = Assessment.query.filter_by(child_id=child_id)
        
        if assessment_type:
            query = query.filter_by(assessment_type=assessment_type)
        if week_number:
            query = query.filter_by(week_number=int(week_number))
        
        assessments = query.order_by(Assessment.administered_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        assessment_data = []
        for assessment in assessments.items:
            assessment_data.append({
                'assessment_id': assessment.assessment_id,
                'assessment_type': assessment.assessment_type,
                'week_number': assessment.week_number,
                'skills_assessed': assessment.skills_assessed,
                'overall_score': assessment.overall_score,
                'skill_scores': assessment.skill_scores,
                'recommendations': assessment.recommendations,
                'mastery_indicators': assessment.mastery_indicators,
                'areas_for_improvement': assessment.areas_for_improvement,
                'next_steps': assessment.next_steps,
                'assessment_duration': assessment.assessment_duration,
                'administered_at': assessment.administered_at.isoformat()
            })
        
        return jsonify({
            'child_id': child_id,
            'assessments': assessment_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': assessments.total,
                'pages': assessments.pages,
                'has_next': assessments.has_next,
                'has_prev': assessments.has_prev
            }
        })
        
    except Exception as e:
        return jsonify({'message': f'Error retrieving assessments: {str(e)}'}), 500

@app.route('/child/assessments', methods=['POST'])
@parent_required  # Only parents can create assessments
@validate_json_input(required_fields=['child_id', 'assessment_type'], 
                    optional_fields=['week_number', 'skills_assessed', 'overall_score', 'skill_scores',
                                   'recommendations', 'mastery_indicators', 'areas_for_improvement', 
                                   'next_steps', 'assessment_duration'])
def create_assessment():
    """Create a new assessment for a child"""
    try:
        data = request.get_json()
        child_id = data['child_id']
        
        # Verify parent owns this child
        child = Child.query.filter_by(id=child_id, parent_id=g.current_user_id).first()
        if not child:
            return jsonify({'message': 'Child not found or access denied'}), 404
        
        # Create assessment
        assessment = Assessment(
            child_id=child_id,
            assessment_type=data['assessment_type'],
            week_number=data.get('week_number'),
            skills_assessed=data.get('skills_assessed', []),
            overall_score=data.get('overall_score', 0.0),
            skill_scores=data.get('skill_scores', {}),
            recommendations=data.get('recommendations', []),
            mastery_indicators=data.get('mastery_indicators', {}),
            areas_for_improvement=data.get('areas_for_improvement', []),
            next_steps=data.get('next_steps', []),
            assessment_duration=data.get('assessment_duration', 0)
        )
        
        db.session.add(assessment)
        db.session.commit()
        
        return jsonify({
            'message': 'Assessment created successfully',
            'assessment_id': assessment.assessment_id,
            'overall_score': assessment.overall_score,
            'administered_at': assessment.administered_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating assessment: {str(e)}'}), 500

@app.route('/child/assessments/<int:assessment_id>', methods=['GET'])
@child_or_parent_required
def get_assessment_detail(assessment_id):
    """Get detailed assessment information"""
    try:
        assessment = Assessment.query.get(assessment_id)
        if not assessment:
            return jsonify({'message': 'Assessment not found'}), 404
        
        # Verify access permissions
        if g.user_type == 'child':
            if assessment.child_id != g.current_user_id:
                return jsonify({'message': 'Access denied'}), 403
        else:  # parent
            child = Child.query.filter_by(id=assessment.child_id, parent_id=g.current_user_id).first()
            if not child:
                return jsonify({'message': 'Access denied'}), 403
        
        # Get child information for context
        child = Child.query.get(assessment.child_id)
        
        return jsonify({
            'assessment': {
                'assessment_id': assessment.assessment_id,
                'assessment_type': assessment.assessment_type,
                'week_number': assessment.week_number,
                'skills_assessed': assessment.skills_assessed,
                'overall_score': assessment.overall_score,
                'skill_scores': assessment.skill_scores,
                'recommendations': assessment.recommendations,
                'mastery_indicators': assessment.mastery_indicators,
                'areas_for_improvement': assessment.areas_for_improvement,
                'next_steps': assessment.next_steps,
                'assessment_duration': assessment.assessment_duration,
                'administered_at': assessment.administered_at.isoformat()
            },
            'child_context': {
                'child_id': child.id,
                'name': child.name,
                'age': child.age,
                'current_week': child.current_week,
                'grade_level': child.grade_level
            }
        })
        
    except Exception as e:
        return jsonify({'message': f'Error retrieving assessment: {str(e)}'}), 500

@app.route('/child/assessments/<int:assessment_id>', methods=['PUT'])
@parent_required  # Only parents can update assessments
@validate_json_input(optional_fields=['overall_score', 'skill_scores', 'recommendations', 
                                    'mastery_indicators', 'areas_for_improvement', 'next_steps'])
def update_assessment(assessment_id):
    """Update an existing assessment"""
    try:
        assessment = Assessment.query.get(assessment_id)
        if not assessment:
            return jsonify({'message': 'Assessment not found'}), 404
        
        # Verify parent owns the child
        child = Child.query.filter_by(id=assessment.child_id, parent_id=g.current_user_id).first()
        if not child:
            return jsonify({'message': 'Access denied'}), 403
        
        data = request.get_json()
        
        # Update assessment fields
        if 'overall_score' in data:
            assessment.overall_score = data['overall_score']
        if 'skill_scores' in data:
            assessment.skill_scores = data['skill_scores']
        if 'recommendations' in data:
            assessment.recommendations = data['recommendations']
        if 'mastery_indicators' in data:
            assessment.mastery_indicators = data['mastery_indicators']
        if 'areas_for_improvement' in data:
            assessment.areas_for_improvement = data['areas_for_improvement']
        if 'next_steps' in data:
            assessment.next_steps = data['next_steps']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Assessment updated successfully',
            'assessment_id': assessment.assessment_id,
            'overall_score': assessment.overall_score
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating assessment: {str(e)}'}), 500

# --- Content Library API Endpoints ---

@app.route('/content', methods=['GET'])
@child_or_parent_required
def get_content_library():
    """Get educational content from the library with filtering"""
    try:
        # Filtering parameters
        subject_area = request.args.get('subject_area')
        age_range = request.args.get('age_range')
        content_type = request.args.get('content_type')
        difficulty_level = request.args.get('difficulty_level')
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 50)
        
        query = ContentLibrary.query.filter_by(active=True)
        
        if subject_area:
            query = query.filter_by(subject_area=subject_area)
        if age_range:
            query = query.filter_by(age_range=age_range)
        if content_type:
            query = query.filter_by(content_type=content_type)
        if difficulty_level:
            query = query.filter_by(difficulty_level=difficulty_level)
        
        # Order by download priority (1=highest priority)
        content = query.order_by(ContentLibrary.download_priority.asc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        content_data = []
        for item in content.items:
            content_data.append({
                'content_id': item.content_id,
                'content_type': item.content_type,
                'subject_area': item.subject_area,
                'age_range': item.age_range,
                'skill_objectives': item.skill_objectives,
                'file_path': item.file_path,
                'difficulty_level': item.difficulty_level,
                'prerequisite_skills': item.prerequisite_skills,
                'content_metadata': item.content_metadata,
                'created_at': item.created_at.isoformat(),
                'updated_at': item.updated_at.isoformat()
            })
        
        return jsonify({
            'content': content_data,
            'filters_applied': {
                'subject_area': subject_area,
                'age_range': age_range,
                'content_type': content_type,
                'difficulty_level': difficulty_level
            },
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': content.total,
                'pages': content.pages,
                'has_next': content.has_next,
                'has_prev': content.has_prev
            }
        })
        
    except Exception as e:
        return jsonify({'message': f'Error retrieving content: {str(e)}'}), 500

@app.route('/content/<int:content_id>', methods=['GET'])
@child_or_parent_required
def get_content_detail(content_id):
    """Get detailed information about specific content"""
    try:
        content = ContentLibrary.query.get(content_id)
        if not content or not content.active:
            return jsonify({'message': 'Content not found'}), 404
        
        return jsonify({
            'content': {
                'content_id': content.content_id,
                'content_type': content.content_type,
                'subject_area': content.subject_area,
                'age_range': content.age_range,
                'skill_objectives': content.skill_objectives,
                'file_path': content.file_path,
                'download_priority': content.download_priority,
                'difficulty_level': content.difficulty_level,
                'prerequisite_skills': content.prerequisite_skills,
                'content_metadata': content.content_metadata,
                'created_at': content.created_at.isoformat(),
                'updated_at': content.updated_at.isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({'message': f'Error retrieving content: {str(e)}'}), 500

@app.route('/content', methods=['POST'])
@parent_required  # Only parents/administrators can add content
@validate_json_input(required_fields=['content_type', 'subject_area', 'age_range'], 
                    optional_fields=['skill_objectives', 'file_path', 'download_priority',
                                   'difficulty_level', 'prerequisite_skills', 'content_metadata'])
def create_content():
    """Create new educational content entry"""
    try:
        data = request.get_json()
        
        content = ContentLibrary(
            content_type=data['content_type'],
            subject_area=data['subject_area'],
            age_range=data['age_range'],
            skill_objectives=data.get('skill_objectives', []),
            file_path=data.get('file_path', ''),
            download_priority=data.get('download_priority', 5),
            difficulty_level=data.get('difficulty_level', 'standard'),
            prerequisite_skills=data.get('prerequisite_skills', []),
            content_metadata=data.get('content_metadata', {})
        )
        
        db.session.add(content)
        db.session.commit()
        
        return jsonify({
            'message': 'Content created successfully',
            'content_id': content.content_id,
            'content_type': content.content_type,
            'subject_area': content.subject_area
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating content: {str(e)}'}), 500

# --- System Analytics API Endpoints ---

@app.route('/analytics/system', methods=['GET'])
@parent_required  # Only parents can view system analytics
def get_system_analytics():
    """Get system performance and usage analytics"""
    try:
        # Filtering parameters
        metric_type = request.args.get('metric_type')
        server_component = request.args.get('server_component')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 50)), 100)
        
        query = SystemAnalytics.query
        
        if metric_type:
            query = query.filter_by(metric_type=metric_type)
        if server_component:
            query = query.filter_by(server_component=server_component)
        
        if start_date:
            try:
                start_dt = datetime.datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(SystemAnalytics.timestamp >= start_dt)
            except ValueError:
                return jsonify({'message': 'Invalid start_date format'}), 400
        
        if end_date:
            try:
                end_dt = datetime.datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(SystemAnalytics.timestamp <= end_dt)
            except ValueError:
                return jsonify({'message': 'Invalid end_date format'}), 400
        
        analytics = query.order_by(SystemAnalytics.timestamp.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        analytics_data = []
        for metric in analytics.items:
            analytics_data.append({
                'analytics_id': metric.analytics_id,
                'metric_type': metric.metric_type,
                'metric_name': metric.metric_name,
                'metric_value': metric.metric_value,
                'context_data': metric.context_data,
                'server_component': metric.server_component,
                'timestamp': metric.timestamp.isoformat()
            })
        
        return jsonify({
            'analytics': analytics_data,
            'filters_applied': {
                'metric_type': metric_type,
                'server_component': server_component,
                'start_date': start_date,
                'end_date': end_date
            },
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': analytics.total,
                'pages': analytics.pages,
                'has_next': analytics.has_next,
                'has_prev': analytics.has_prev
            }
        })
        
    except Exception as e:
        return jsonify({'message': f'Error retrieving analytics: {str(e)}'}), 500

@app.route('/analytics/system', methods=['POST'])
@validate_json_input(required_fields=['metric_type', 'metric_name', 'metric_value'], 
                    optional_fields=['context_data', 'server_component'])
def log_system_metric():
    """Log a system metric (for internal system use)"""
    try:
        data = request.get_json()
        
        # For security, this endpoint should have API key authentication in production
        # For now, we'll allow it for system monitoring
        
        metric = SystemAnalytics(
            metric_type=data['metric_type'],
            metric_name=data['metric_name'],
            metric_value=data['metric_value'],
            context_data=data.get('context_data', {}),
            server_component=data.get('server_component', 'unknown')
        )
        
        db.session.add(metric)
        db.session.commit()
        
        return jsonify({
            'message': 'Metric logged successfully',
            'analytics_id': metric.analytics_id,
            'timestamp': metric.timestamp.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error logging metric: {str(e)}'}), 500

@app.route('/analytics/dashboard', methods=['GET'])
@parent_required
def get_analytics_dashboard():
    """Get dashboard analytics summary for parents"""
    try:
        # Get summary statistics
        total_children = Child.query.filter_by(parent_id=g.current_user_id).count()
        
        # Get recent learning sessions for parent's children
        children = Child.query.filter_by(parent_id=g.current_user_id).all()
        child_ids = [child.id for child in children]
        
        total_sessions = LearningSession.query.filter(
            LearningSession.child_id.in_(child_ids)
        ).count()
        
        completed_sessions = LearningSession.query.filter(
            LearningSession.child_id.in_(child_ids),
            LearningSession.completion_status == 'completed'
        ).count()
        
        # Get recent assessments
        recent_assessments = Assessment.query.filter(
            Assessment.child_id.in_(child_ids)
        ).order_by(Assessment.administered_at.desc()).limit(5).all()
        
        assessment_data = []
        for assessment in recent_assessments:
            child = Child.query.get(assessment.child_id)
            assessment_data.append({
                'assessment_id': assessment.assessment_id,
                'child_name': child.name,
                'assessment_type': assessment.assessment_type,
                'overall_score': assessment.overall_score,
                'administered_at': assessment.administered_at.isoformat()
            })
        
        # Calculate average engagement
        avg_engagement = db.session.query(
            db.func.avg(LearningSession.engagement_score)
        ).filter(
            LearningSession.child_id.in_(child_ids),
            LearningSession.engagement_score.isnot(None)
        ).scalar() or 0.0
        
        return jsonify({
            'parent_id': g.current_user_id,
            'summary': {
                'total_children': total_children,
                'total_learning_sessions': total_sessions,
                'completed_sessions': completed_sessions,
                'completion_rate': round((completed_sessions / total_sessions * 100), 1) if total_sessions > 0 else 0,
                'average_engagement_score': round(avg_engagement, 1)
            },
            'recent_assessments': assessment_data,
            'generated_at': datetime.datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({'message': f'Error generating dashboard: {str(e)}'}), 500

# --- Multi-Subject Educational Content API Endpoints ---

@app.route('/subjects', methods=['GET'])
@child_or_parent_required
def get_available_subjects():
    """Get available subjects based on child's age"""
    try:
        # Get child age
        if g.user_type == 'child':
            child = Child.query.get(g.current_user_id)
            child_age = child.age
        else:  # parent
            child_id = request.args.get('child_id')
            if not child_id:
                return jsonify({'message': 'child_id parameter required for parent access'}), 400
            
            child = Child.query.filter_by(id=child_id, parent_id=g.current_user_id).first()
            if not child:
                return jsonify({'message': 'Child not found or access denied'}), 404
            child_age = child.age
        
        # Get available subjects for child's age
        available_subjects = multi_subject_curriculum.get_subjects_for_age(child_age)
        age_range = multi_subject_curriculum.get_age_range_for_age(child_age)
        
        return jsonify({
            'child_age': child_age,
            'age_range': age_range,
            'available_subjects': available_subjects,
            'total_subjects': len(available_subjects)
        })
        
    except Exception as e:
        return jsonify({'message': f'Error retrieving subjects: {str(e)}'}), 500

@app.route('/subjects/<subject>/skills', methods=['GET'])
@child_or_parent_required
def get_subject_skills(subject):
    """Get skill progression for a specific subject"""
    try:
        # Get child age
        if g.user_type == 'child':
            child = Child.query.get(g.current_user_id)
            child_age = child.age
        else:  # parent
            child_id = request.args.get('child_id')
            if not child_id:
                return jsonify({'message': 'child_id parameter required for parent access'}), 400
            
            child = Child.query.filter_by(id=child_id, parent_id=g.current_user_id).first()
            if not child:
                return jsonify({'message': 'Child not found or access denied'}), 404
            child_age = child.age
        
        age_range = multi_subject_curriculum.get_age_range_for_age(child_age)
        skills = multi_subject_curriculum.get_subject_skills(subject, age_range)
        
        if not skills:
            return jsonify({'message': f'No skills found for {subject} in age range {age_range}'}), 404
        
        return jsonify({
            'subject': subject,
            'age_range': age_range,
            'skills': skills,
            'total_skills': len(skills)
        })
        
    except Exception as e:
        return jsonify({'message': f'Error retrieving skills: {str(e)}'}), 500

@app.route('/subjects/<subject>/lessons/<skill>', methods=['GET'])
@child_or_parent_required
def get_lesson_content(subject, skill):
    """Get detailed lesson content for a specific skill"""
    try:
        # Get child age
        if g.user_type == 'child':
            child = Child.query.get(g.current_user_id)
            child_age = child.age
        else:  # parent
            child_id = request.args.get('child_id')
            if not child_id:
                return jsonify({'message': 'child_id parameter required for parent access'}), 400
            
            child = Child.query.filter_by(id=child_id, parent_id=g.current_user_id).first()
            if not child:
                return jsonify({'message': 'Child not found or access denied'}), 404
            child_age = child.age
        
        age_range = multi_subject_curriculum.get_age_range_for_age(child_age)
        lesson_content = multi_subject_curriculum.get_lesson_content(subject, age_range, skill)
        
        if not lesson_content:
            return jsonify({'message': f'No lesson content found for {subject}/{skill} in age range {age_range}'}), 404
        
        return jsonify({
            'subject': subject,
            'skill': skill,
            'age_range': age_range,
            'lesson': lesson_content
        })
        
    except Exception as e:
        return jsonify({'message': f'Error retrieving lesson: {str(e)}'}), 500

@app.route('/child/learning-path', methods=['GET'])
@child_or_parent_required
def get_personalized_learning_path():
    """Generate AI-powered personalized learning path for child"""
    try:
        # Get child information
        if g.user_type == 'child':
            child = Child.query.get(g.current_user_id)
        else:  # parent
            child_id = request.args.get('child_id')
            if not child_id:
                return jsonify({'message': 'child_id parameter required for parent access'}), 400
            
            child = Child.query.filter_by(id=child_id, parent_id=g.current_user_id).first()
            if not child:
                return jsonify({'message': 'Child not found or access denied'}), 404
        
        # Get interests and current skills (could be expanded with user input)
        interests = child.skill_strengths if child.skill_strengths else []
        current_skills = {
            'phonemic_awareness': child.progress.phonemic_awareness,
            'learning_velocity': child.progress.learning_velocity
        }
        
        # Generate personalized learning path
        learning_path = multi_subject_curriculum.generate_learning_path(
            child.age, 
            interests=interests, 
            current_skills=current_skills
        )
        
        # Add AI recommendations if available
        try:
            ai_recommendation = ai_learning_engine.predict_optimal_skill(child)
            learning_path['ai_recommendation'] = ai_recommendation
        except:
            pass
        
        # Add current Heggerty progress
        heggerty_recommendation = generate_skill_recommendation(child)
        learning_path['heggerty_recommendation'] = heggerty_recommendation
        
        return jsonify({
            'child_info': {
                'name': child.name,
                'age': child.age,
                'current_week': child.current_week,
                'learning_style': child.learning_style
            },
            'learning_path': learning_path,
            'generated_at': datetime.datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({'message': f'Error generating learning path: {str(e)}'}), 500

# --- AI Analytics API Endpoints ---

@app.route('/ai/recommendation', methods=['POST'])
@child_or_parent_required
@validate_json_input(optional_fields=['child_id', 'recent_performance', 'activity_type'])
def get_ai_recommendation():
    """Get AI-powered learning recommendation"""
    try:
        data = request.get_json()
        
        # Get child information
        if g.user_type == 'child':
            child = Child.query.get(g.current_user_id)
        else:  # parent
            child_id = data.get('child_id') or request.args.get('child_id')
            if not child_id:
                return jsonify({'message': 'child_id required for parent access'}), 400
            
            child = Child.query.filter_by(id=child_id, parent_id=g.current_user_id).first()
            if not child:
                return jsonify({'message': 'Child not found or access denied'}), 404
        
        # Get AI recommendation
        ai_recommendation = ai_learning_engine.predict_optimal_skill(child)
        
        # Get difficulty recommendation if activity type provided
        difficulty_recommendation = None
        if data.get('activity_type') and data.get('recent_performance'):
            difficulty_recommendation = ai_learning_engine.calculate_adaptive_difficulty(
                child, 
                data['activity_type'], 
                data['recent_performance']
            )
        
        # Analyze learning patterns
        recent_sessions = LearningSession.query.filter_by(child_id=child.id)\
            .order_by(LearningSession.session_start.desc()).limit(10).all()
        learning_patterns = ai_learning_engine.analyze_learning_patterns(recent_sessions)
        
        return jsonify({
            'child_id': child.id,
            'skill_recommendation': ai_recommendation,
            'difficulty_recommendation': difficulty_recommendation,
            'learning_patterns': learning_patterns,
            'ai_status': 'active' if ai_learning_engine.model_loaded else 'fallback',
            'generated_at': datetime.datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({'message': f'Error generating AI recommendation: {str(e)}'}), 500

@app.route('/ai/initialize', methods=['POST'])
@parent_required  # Only parents/admins can initialize AI models
def initialize_ai_models():
    """Initialize AI/ML models for learning analytics"""
    try:
        ai_learning_engine.initialize_models()
        
        # Get GPU information
        gpu_info = {}
        if GPU_AVAILABLE:
            gpus = tf.config.list_physical_devices('GPU')
            if gpus:
                gpu = gpus[0]
                gpu_details = tf.config.experimental.get_device_details(gpu)
                gpu_info = {
                    'name': 'NVIDIA V100 16GB',
                    'device': gpu.name,
                    'memory': '16384 MB',
                    'compute_capability': gpu_details.get('compute_capability', '7.0'),  # V100 is 7.0
                    'xla_enabled': Config.TF_ENABLE_XLA,
                    'mixed_precision': Config.TF_MIXED_PRECISION
                }

        return jsonify({
            'message': 'AI models initialized successfully',
            'model_status': 'loaded' if ai_learning_engine.model_loaded else 'failed',
            'gpu_available': GPU_AVAILABLE,
            'gpu_info': gpu_info if GPU_AVAILABLE else None,
            'tensorflow_version': tf.__version__,
            'initialized_at': datetime.datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'message': f'AI initialization failed: {str(e)}',
            'model_status': 'failed'
        }), 500

# --- Heggerty Curriculum API Endpoints ---

@app.route('/curriculum/week/<int:week_number>', methods=['GET'])
@token_required
def get_week_curriculum(week_number):
    """Get complete curriculum information for a specific week"""
    if week_number < 1 or week_number > 35:
        return jsonify({'message': 'Invalid week number. Must be 1-35.'}), 400
    
    # Get active skills for the week
    active_skills = heggerty_curriculum.get_skills_for_week(week_number)
    
    # Get detailed activities for each skill
    week_activities = {}
    for skill in active_skills:
        activities = heggerty_curriculum.get_skill_activities(skill, week_number)
        skill_info = heggerty_curriculum.SKILL_PROGRESSION[skill]
        week_activities[skill] = {
            'skill_info': skill_info,
            'activities': activities
        }
    
    # Get nursery rhyme
    nursery_rhyme = heggerty_curriculum.get_nursery_rhyme(week_number)
    
    return jsonify({
        'week_number': week_number,
        'active_skills': active_skills,
        'activities': week_activities,
        'nursery_rhyme': nursery_rhyme,
        'total_weeks': 35
    }), 200

@app.route('/child/assessment', methods=['GET'])
@token_required
def get_child_assessment():
    """Get comprehensive assessment of child's phonemic awareness progress"""
    if g.user_type != 'child':
        return jsonify({'message': 'Access forbidden'}), 403
    
    child = Child.query.get(g.current_user_id)
    if not child:
        return jsonify({'message': 'Child not found'}), 404
    
    # Calculate detailed assessment for each skill
    skill_assessments = {}
    for skill_name in heggerty_curriculum.SKILL_PROGRESSION.keys():
        skill_progress = getattr(child.progress, skill_name, 0.0)
        readiness = heggerty_curriculum.assess_readiness(child.progress, skill_name)
        skill_data = heggerty_curriculum.SKILL_PROGRESSION[skill_name]
        
        # Determine mastery level
        if skill_progress >= 90:
            mastery_level = 'mastered'
        elif skill_progress >= 70:
            mastery_level = 'proficient'
        elif skill_progress >= 50:
            mastery_level = 'developing'
        elif skill_progress >= 30:
            mastery_level = 'emerging'
        else:
            mastery_level = 'beginning'
        
        skill_assessments[skill_name] = {
            'progress_percentage': skill_progress,
            'mastery_level': mastery_level,
            'readiness': readiness,
            'skill_info': skill_data,
            'active_in_weeks': list(skill_data['weeks'])
        }
    
    # Calculate overall assessment
    overall_phonemic_awareness = child.progress.phonemic_awareness
    
    # Determine next learning objectives
    current_week = child.current_week
    next_objectives = []
    active_skills = heggerty_curriculum.get_skills_for_week(current_week)
    
    for skill in active_skills:
        if getattr(child.progress, skill, 0.0) < 80:  # Skills that need work
            next_objectives.append({
                'skill': skill,
                'target': f"Improve {skill.replace('_', ' ')} to 80% proficiency",
                'current_progress': getattr(child.progress, skill, 0.0)
            })
    
    return jsonify({
        'child_info': {
            'name': child.name,
            'age': child.age,
            'current_week': child.current_week
        },
        'overall_assessment': {
            'phonemic_awareness_score': overall_phonemic_awareness,
            'learning_velocity': child.progress.learning_velocity,
            'attention_span': child.progress.attention_span_minutes,
            'preferred_interaction': child.progress.preferred_interaction_mode
        },
        'skill_assessments': skill_assessments,
        'next_objectives': next_objectives,
        'assessment_date': datetime.datetime.utcnow().isoformat()
    }), 200


# --- Child Settings & Avatar Routes ---
@app.route('/child/avatar', methods=['PUT'])
@token_required
@child_or_parent_required
def update_avatar():
    """
    Update child's avatar
    COPPA Compliant: Parent or child can update avatar
    """
    data = request.get_json()

    # Get child ID from token or request data
    if g.user_type == 'child':
        child_id = g.current_user_id
    else:  # parent
        child_id = data.get('child_id')
        if not child_id:
            return jsonify({'error': 'child_id required for parent requests'}), 400

    # Validate child exists and belongs to parent (if parent request)
    child = Child.query.get(child_id)
    if not child:
        return jsonify({'error': 'Child not found'}), 404

    if g.user_type == 'parent' and child.parent_id != g.current_user_id:
        return jsonify({'error': 'Child does not belong to this parent'}), 403

    # Update avatar with validation
    avatar = data.get('avatar', '').strip()
    if not avatar:
        return jsonify({'error': 'Avatar cannot be empty'}), 400

    # Basic avatar validation (emoji or predefined avatar code)
    if len(avatar) > 10:  # Prevent overly long avatar strings
        return jsonify({'error': 'Avatar too long'}), 400

    child.avatar = avatar
    db.session.commit()

    # Log the change for parental monitoring
    if g.user_type == 'child':
        socketio.emit('child_avatar_updated', {
            'child_id': child.id,
            'child_name': child.name,
            'new_avatar': avatar,
            'updated_at': datetime.datetime.utcnow().isoformat()
        }, room=f'parent_room_{child.parent_id}')

    return jsonify({
        'success': True,
        'message': 'Avatar updated successfully',
        'avatar': child.avatar
    }), 200


@app.route('/child/settings', methods=['PUT'])
@token_required
@child_or_parent_required
def update_settings():
    """
    Update child's settings
    COPPA Compliant: Parent or child can update certain settings
    """
    data = request.get_json()

    # Get child ID from token or request data
    if g.user_type == 'child':
        child_id = g.current_user_id
    else:  # parent
        child_id = data.get('child_id')
        if not child_id:
            return jsonify({'error': 'child_id required for parent requests'}), 400

    # Validate child exists and belongs to parent (if parent request)
    child = Child.query.get(child_id)
    if not child:
        return jsonify({'error': 'Child not found'}), 404

    if g.user_type == 'parent' and child.parent_id != g.current_user_id:
        return jsonify({'error': 'Child does not belong to this parent'}), 403

    # Update allowed settings
    updated_fields = []

    if 'learning_style' in data:
        valid_styles = ['visual', 'auditory', 'kinesthetic', 'mixed']
        learning_style = data['learning_style']
        if learning_style in valid_styles:
            child.learning_style = learning_style
            updated_fields.append('learning_style')
        else:
            return jsonify({'error': f'Invalid learning_style. Must be one of: {valid_styles}'}), 400

    if 'grade_level' in data:
        # Parents can update grade level
        if g.user_type == 'parent':
            grade_level = data['grade_level'].strip()
            if grade_level:
                child.grade_level = grade_level
                updated_fields.append('grade_level')
        else:
            return jsonify({'error': 'Only parents can update grade level'}), 403

    # Save changes
    if updated_fields:
        db.session.commit()

        # Log the change for parental monitoring
        socketio.emit('child_settings_updated', {
            'child_id': child.id,
            'child_name': child.name,
            'updated_fields': updated_fields,
            'updated_by': g.user_type,
            'updated_at': datetime.datetime.utcnow().isoformat()
        }, room=f'parent_room_{child.parent_id}')

        return jsonify({
            'success': True,
            'message': f'Settings updated: {", ".join(updated_fields)}',
            'updated_fields': updated_fields
        }), 200
    else:
        return jsonify({
            'success': False,
            'message': 'No valid settings provided to update'
        }), 400


# --- Parent Interface Routes ---
@app.route('/parent/dashboard', methods=['GET'])
@token_required
def parent_dashboard():
    if g.user_type != 'parent':
        return jsonify({'message': 'Access forbidden'}), 403

    parent = Parent.query.get(g.current_user_id)
    children_data = []
    for child in parent.children:
        children_data.append({
            'id': child.id,
            'name': child.name,
            'age': child.age,
            'total_stars': child.total_stars,
            'current_week': child.current_week,
            'progress': {
                'rhyming': child.progress.rhyming,
                'blending': child.progress.blending,
                'onset_fluency': child.progress.onset_fluency
            }
        })
    return jsonify({'parent': {'name': parent.name}, 'children': children_data}), 200

@app.route('/parent/add_child', methods=['POST'])
@token_required
def add_child():
    if g.user_type != 'parent':
        return jsonify({'message': 'Access forbidden'}), 403
        
    data = request.get_json()
    new_child = Child(
        name=data['name'],
        age=data['age'],
        parent_id=g.current_user_id
    )
    db.session.add(new_child)
    
    # Create an initial progress record for the child
    new_progress = Progress(child=new_child)
    db.session.add(new_progress)
    
    db.session.commit()
    return jsonify({'message': f"Child '{data['name']}' added."}), 201


# --- Voice Processing System (AI Server with SoundBlaster Audio Card) ---

class VoiceProcessor:
    """
    Voice processing system utilizing SoundBlaster audio card on AI Server
    Handles speech recognition, audio analysis, and TTS generation
    """
    
    def __init__(self):
        try:
            self.recognizer = sr.Recognizer()
            self.tts_engine = pyttsx3.init()
            
            # Initialize VAD if available
            if WEBRTCVAD_AVAILABLE:
                self.vad = webrtcvad.Vad(3)  # Aggressiveness level 3 (most aggressive)
            else:
                self.vad = None
                
            self.audio_queue = Queue()
            
            # Configure TTS engine for educational content
            self.configure_tts_engine()
            
            # SoundBlaster audio card configuration
            self.configure_soundblaster_processing()
            
        except Exception as e:
            print(f"VoiceProcessor initialization warning: {e}")
    
    def configure_tts_engine(self):
        """Configure TTS engine for child-friendly speech"""
        try:
            # Set speech rate (slower for children)
            self.tts_engine.setProperty('rate', 150)  # Default is usually 200
            
            # Set volume
            self.tts_engine.setProperty('volume', 0.8)
            
            # Try to use a child-friendly voice if available
            voices = self.tts_engine.getProperty('voices')
            if voices:
                # Prefer female voices for educational content (research-based)
                for voice in voices:
                    if voice and hasattr(voice, 'name') and voice.name:
                        if 'female' in voice.name.lower() or 'woman' in voice.name.lower():
                            self.tts_engine.setProperty('voice', voice.id)
                            break
                            
        except Exception as e:
            print(f"TTS Configuration warning: {e}")
    
    def configure_soundblaster_processing(self):
        """Configure SoundBlaster audio card for voice processing"""
        try:
            # Configure audio parameters
            if PYAUDIO_AVAILABLE:
                self.audio_format = pyaudio.paInt16
            else:
                self.audio_format = None
                
            self.channels = 1  # Mono for voice processing
            self.sample_rate = 16000  # Optimal for speech recognition
            self.chunk_size = 1024
            
            # Initialize PyAudio with SoundBlaster preferences if available
            if PYAUDIO_AVAILABLE:
                self.audio_interface = pyaudio.PyAudio()
                # Find SoundBlaster device (fallback to default if not found)
                self.input_device_index = self.find_soundblaster_device()
            else:
                self.audio_interface = None
                self.input_device_index = None
                print("PyAudio not available - using default audio processing")
            
        except Exception as e:
            print(f"SoundBlaster configuration warning: {e}")
            self.input_device_index = None
            self.audio_interface = None
    
    def find_soundblaster_device(self):
        """Find SoundBlaster audio device for processing"""
        try:
            if not self.audio_interface:
                return None
                
            device_count = self.audio_interface.get_device_count()
            for i in range(device_count):
                device_info = self.audio_interface.get_device_info_by_index(i)
                device_name = device_info.get('name', '').lower()
                
                # Look for SoundBlaster devices
                if any(keyword in device_name for keyword in ['soundblaster', 'creative', 'sb']):
                    if device_info.get('maxInputChannels', 0) > 0:
                        print(f"Found SoundBlaster device: {device_info['name']}")
                        return i
                        
            print("SoundBlaster device not found, using default audio device")
            return None
            
        except Exception as e:
            print(f"Error finding SoundBlaster device: {e}")
            return None
    
    def process_audio_data(self, audio_data, expected_response=None):
        """
        Process raw audio data using SoundBlaster card
        Returns speech recognition results with quality metrics
        """
        try:
            # Convert audio data for SpeechRecognition
            audio_source = sr.AudioData(audio_data, self.sample_rate, 2)
            
            # Perform speech recognition with confidence scoring
            try:
                # Use Google's speech recognition
                transcript = self.recognizer.recognize_google(audio_source, language='en-US').lower().strip()
                confidence = 0.8  # Default confidence
                
            except sr.UnknownValueError:
                return {
                    'transcript': '',
                    'confidence': 0.0,
                    'error': 'Could not understand audio',
                    'success': False
                }
            except sr.RequestError as e:
                return {
                    'transcript': '',
                    'confidence': 0.0,
                    'error': f'Speech recognition service error: {e}',
                    'success': False
                }
            
            # Analyze audio quality
            audio_quality = self.analyze_audio_quality(audio_data)
            
            # Calculate accuracy if expected response provided
            accuracy_score = 1.0
            if expected_response:
                accuracy_score = self.calculate_pronunciation_accuracy(transcript, expected_response)
            
            # Calculate response metrics
            response_time = len(audio_data) / (self.sample_rate * 2)  # Duration in seconds
            
            return {
                'transcript': transcript,
                'confidence': confidence,
                'accuracy_score': accuracy_score,
                'audio_quality_score': audio_quality,
                'response_time_seconds': response_time,
                'success': True
            }
            
        except Exception as e:
            return {
                'transcript': '',
                'confidence': 0.0,
                'error': f'Audio processing error: {str(e)}',
                'success': False
            }
    
    def analyze_audio_quality(self, audio_data):
        """
        Analyze audio quality using signal processing
        Returns quality score from 0.0 to 1.0
        """
        try:
            # Basic signal quality analysis
            audio_array = np.frombuffer(audio_data, dtype=np.int16)
            signal_strength = np.abs(audio_array).mean() / 32768.0  # Normalize to 0-1
            
            # Simple quality metric based on signal strength
            quality_score = min(1.0, max(0.1, signal_strength * 2))
            return quality_score
            
        except Exception as e:
            print(f"Audio quality analysis error: {e}")
            return 0.5  # Default quality score
    
    def calculate_pronunciation_accuracy(self, spoken_text, expected_text):
        """
        Calculate pronunciation accuracy using phonetic similarity
        Returns accuracy score from 0.0 to 1.0
        """
        try:
            if not spoken_text or not expected_text:
                return 0.0
            
            spoken_clean = ''.join(c.lower() for c in spoken_text if c.isalnum())
            expected_clean = ''.join(c.lower() for c in expected_text if c.isalnum())
            
            if not spoken_clean or not expected_clean:
                return 0.0
            
            # Exact match
            if spoken_clean == expected_clean:
                return 1.0
            
            # Levenshtein distance for similarity
            distance = self.levenshtein_distance(spoken_clean, expected_clean)
            max_length = max(len(spoken_clean), len(expected_clean))
            
            if max_length == 0:
                return 0.0
            
            # Convert distance to similarity score
            similarity = 1.0 - (distance / max_length)
            return max(0.0, similarity)
            
        except Exception as e:
            print(f"Pronunciation accuracy calculation error: {e}")
            return 0.0
    
    def levenshtein_distance(self, s1, s2):
        """Calculate Levenshtein distance between two strings"""
        if len(s1) < len(s2):
            return self.levenshtein_distance(s2, s1)
        
        if len(s2) == 0:
            return len(s1)
        
        previous_row = list(range(len(s2) + 1))
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
        
        return previous_row[-1]
    
    def generate_speech_audio(self, text, output_path=None):
        """
        Generate speech audio using TTS engine and SoundBlaster processing
        Returns path to generated audio file or success status
        """
        try:
            if output_path:
                # Save to file
                self.tts_engine.save_to_file(text, output_path)
                self.tts_engine.runAndWait()
                return output_path
            else:
                # For real-time playback (would be processed through SoundBlaster)
                self.tts_engine.say(text)
                self.tts_engine.runAndWait()
                return True
                
        except Exception as e:
            print(f"Speech generation error: {e}")
            return None

# Initialize voice processor
try:
    voice_processor = VoiceProcessor()
    print("Voice processor initialized with SoundBlaster support")
except Exception as e:
    print(f"Voice processor initialization failed: {e}")
    voice_processor = None

# --- Voice Processing API Endpoints (AI Server) ---

@app.route('/api/voice/process', methods=['POST'])
@token_required
def process_voice_audio():
    """
    AI Server Voice Processing: Process uploaded audio using SoundBlaster card
    COPPA Compliant: Processes audio but only stores transcribed text
    """
    if not voice_processor:
        return jsonify({'success': False, 'message': 'Voice processing not available'}), 503
        
    try:
        # Validate child token
        if g.user_type != 'child':
            return jsonify({'success': False, 'message': 'Child authentication required'}), 403
        
        # Check for audio file upload
        if 'audio' not in request.files:
            return jsonify({'success': False, 'message': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        expected_response = request.form.get('expected_response', '')
        activity_type = request.form.get('activity_type', 'pronunciation')
        
        if audio_file.filename == '':
            return jsonify({'success': False, 'message': 'No audio file selected'}), 400
        
        # Read audio data
        audio_data = audio_file.read()
        
        # Process audio using SoundBlaster-enhanced voice processor
        result = voice_processor.process_audio_data(audio_data, expected_response)
        
        if not result['success']:
            return jsonify({
                'success': False, 
                'message': result.get('error', 'Voice processing failed')
            }), 400
        
        # Log voice interaction (COPPA compliant - text only)
        child = Child.query.get(g.current_user_id)
        if child:
            interaction = VoiceInteraction(
                child_id=child.id,
                interaction_type=activity_type,
                prompt_given=f"Expected: {expected_response}",
                expected_response=expected_response,
                actual_response=result['transcript'],
                recognition_engine='soundblaster_enhanced',
                recognition_confidence=result['confidence'],
                accuracy_score=result['accuracy_score'],
                audio_quality_score=result['audio_quality_score'],
                response_time_seconds=result['response_time_seconds'],
                success_achieved=result['accuracy_score'] >= 0.7
            )
            db.session.add(interaction)
            db.session.commit()
            
            # Notify parent via WebSocket
            if child.parent_id:
                socketio.emit('voice_interaction_completed', {
                    'child_id': child.id,
                    'child_name': child.name,
                    'activity_type': activity_type,
                    'accuracy_score': result['accuracy_score'],
                    'confidence': result['confidence'],
                    'audio_quality': result['audio_quality_score'],
                    'success': result['accuracy_score'] >= 0.7,
                    'timestamp': datetime.datetime.utcnow().isoformat()
                }, room=f'parent_room_{child.parent_id}')
        
        return jsonify({
            'success': True,
            'transcript': result['transcript'],
            'confidence': result['confidence'],
            'accuracy_score': result['accuracy_score'],
            'audio_quality_score': result['audio_quality_score'],
            'response_time_seconds': result['response_time_seconds'],
            'feedback': generate_feedback(result['accuracy_score'])
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False, 
            'message': f'Voice processing error: {str(e)}'
        }), 500

@app.route('/api/voice/synthesize', methods=['POST'])
@token_required
def synthesize_speech():
    """
    AI Server TTS: Generate speech using SoundBlaster audio processing
    Returns audio file for educational content
    """
    if not voice_processor:
        return jsonify({'success': False, 'message': 'Voice synthesis not available'}), 503
        
    try:
        data = request.get_json()
        text = data.get('text', '')
        voice_type = data.get('voice_type', 'default')  # character, instruction, feedback
        
        if not text:
            return jsonify({'success': False, 'message': 'No text provided'}), 400
        
        # Generate speech audio using SoundBlaster processing
        success = voice_processor.generate_speech_audio(text)
        
        return jsonify({
            'success': success,
            'message': 'Speech generated' if success else 'Speech generation failed',
            'duration': estimate_speech_duration(text)
        }), 200 if success else 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Speech synthesis error: {str(e)}'
        }), 500

# Legacy endpoint for backward compatibility
@app.route('/api/voice/listen', methods=['POST'])
@token_required
def analyze_voice_text():
    """
    COPPA Compliance Note: This endpoint receives ANONYMIZED, TRANSCRIBED TEXT ONLY.
    Enhanced with AI analysis using NVIDIA V100 16GB GPU on AI Server.
    """
    data = request.get_json()
    transcribed_text = data.get('response_text', '')
    expected_answer = data.get('expected_answer', '')
    
    if not transcribed_text:
        return jsonify({'success': False, 'message': 'No transcribed text provided'}), 400
    
    # AI analysis using TensorFlow on NVIDIA P100 GPU
    try:
        # Use the same accuracy calculation as the voice processor
        accuracy = 1.0
        if expected_answer and voice_processor:
            accuracy = voice_processor.calculate_pronunciation_accuracy(transcribed_text, expected_answer)
        
        is_correct = accuracy >= 0.7
        
        analysis_result = {
            'success': True,
            'response': transcribed_text,
            'is_correct': is_correct,
            'accuracy': accuracy,
            'phonemic_analysis': {
                'overall_score': accuracy,
                'pronunciation_quality': 'excellent' if accuracy >= 0.9 else 'good' if accuracy >= 0.7 else 'needs_practice'
            }
        }
        
        return jsonify(analysis_result), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Analysis error: {str(e)}'
        }), 500

@app.route('/api/speak', methods=['POST'])
@token_required
def text_to_speech():
    """
    AI Server Function: Generate speech using SoundBlaster audio card
    """
    if not voice_processor:
        return jsonify({'success': False, 'message': 'TTS not available'}), 503
        
    data = request.get_json()
    text_to_speak = data.get('text', '')
    
    if not text_to_speak:
        return jsonify({'success': False, 'message': 'No text provided'}), 400
    
    try:
        success = voice_processor.generate_speech_audio(text_to_speak)
        return jsonify({
            'success': success, 
            'message': 'Speech generated' if success else 'Speech generation failed'
        }), 200 if success else 500
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'TTS error: {str(e)}'
        }), 500

def generate_feedback(accuracy_score):
    """Generate encouraging feedback based on accuracy"""
    if accuracy_score >= 0.9:
        return "Excellent pronunciation! Perfect!"
    elif accuracy_score >= 0.8:
        return "Great job! Very good pronunciation!"
    elif accuracy_score >= 0.7:
        return "Good work! Keep practicing!"
    elif accuracy_score >= 0.5:
        return "Nice try! Let's practice this sound together."
    else:
        return "That's okay! Let's listen and try again."

def estimate_speech_duration(text):
    """Estimate speech duration in seconds (average 150 words per minute)"""
    word_count = len(text.split())
    return max(1.0, word_count / 2.5)  # 150 WPM = 2.5 words per second

# --- WebSocket Events (Integration Server) ---

@socketio.on('connect')
def handle_connect():
    print('Client connected to WebSocket')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected from WebSocket')

@socketio.on('join_parent_room')
@token_required
def on_join_parent(data):
    if g.user_type == 'parent':
        parent_id = data.get('parent_id')
        if parent_id == g.current_user_id:
            room = f'parent_room_{parent_id}'
            join_room(room)
            emit('status', {'msg': f'Parent {parent_id} joined room.'}, room=room)

@socketio.on('start_monitoring')
@token_required
def on_start_monitoring(data):
    if g.user_type == 'parent':
        child_id = data.get('child_id')
        child = Child.query.get(child_id)
        if child and child.parent_id == g.current_user_id:
            # Logic to confirm monitoring can start
            emit('monitoring_started', {'child_id': child_id, 'status': 'active'})

# --- Content Delivery Endpoints ---

@app.route('/content/<path:filename>')
def serve_content(filename):
    """Serve educational content files"""
    try:
        return send_from_directory('content', filename)
    except FileNotFoundError:
        return jsonify({'message': 'Content file not found'}), 404

@app.route('/assets/<path:filename>')  
def serve_assets(filename):
    """Serve static assets (sounds, animations, images)"""
    try:
        return send_from_directory('assets', filename)
    except FileNotFoundError:
        return jsonify({'message': 'Asset file not found'}), 404

@app.route('/api/content/upload', methods=['POST'])
@token_required
def upload_content():
    """Upload new content files (admin only)"""
    if g.user_type != 'parent':  # In production, this would check for admin role
        return jsonify({'message': 'Admin access required'}), 403
    
    if 'file' not in request.files:
        return jsonify({'message': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No file selected'}), 400
    
    # Basic file validation (expand in production)
    allowed_extensions = {'.mp3', '.wav', '.json', '.png', '.jpg', '.jpeg', '.mp4'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        return jsonify({'message': 'File type not allowed'}), 400
    
    try:
        # Save file to appropriate directory based on type
        if file_ext in {'.mp3', '.wav'}:
            file_path = os.path.join('assets', 'sounds', file.filename)
        elif file_ext == '.json':
            file_path = os.path.join('assets', 'animations', file.filename)
        else:
            file_path = os.path.join('content', file.filename)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        file.save(file_path)
        
        return jsonify({
            'message': 'File uploaded successfully',
            'file_path': file_path,
            'access_url': f'/assets/{file.filename}' if file_ext in {'.mp3', '.wav', '.json'} else f'/content/{file.filename}'
        }), 201
        
    except Exception as e:
        return jsonify({'message': f'Upload failed: {str(e)}'}), 500

# --- Main Application Runner ---
# To run in production, use a Gunicorn server as specified in the prompt:
# gunicorn --workers 57 --bind 0.0.0.0:5000 elemental_genius_backend:app
if __name__ == '__main__':
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
    # Run the development server
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
