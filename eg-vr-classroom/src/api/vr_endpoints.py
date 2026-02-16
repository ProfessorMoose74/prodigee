"""
VR API Endpoints - Flask routes for Unity VR client communication
Provides REST API endpoints for VR session management and data exchange
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import jwt
import logging
from typing import Dict, Any, Optional

from src.services import oasis
from src.core.database import db_manager
from src.core.logging_config import get_logger

logger = get_logger(__name__)

# Create Blueprint
vr_api = Blueprint('vr_api', __name__, url_prefix='/api/vr')


# ============================================================================
# Session Management
# ============================================================================

@vr_api.route('/session/start', methods=['POST'])
def start_vr_session():
    """
    Start a VR session for a child

    Request body:
    {
        "child_id": int,
        "parent_token": str (JWT),
        "vr_platform": str (e.g., "meta_quest_3")
    }

    Response:
    {
        "success": bool,
        "session_id": str,
        "auth_token": str (JWT for this session),
        "message": str
    }
    """
    try:
        data = request.get_json()

        # Validate request
        child_id = data.get('child_id')
        parent_token = data.get('parent_token')
        vr_platform = data.get('vr_platform', 'unknown')

        if not all([child_id, parent_token]):
            return jsonify({
                'success': False,
                'message': 'Missing required fields: child_id, parent_token'
            }), 400

        # Verify parent token (simplified - implement proper JWT verification)
        # TODO: Verify parent token against database
        logger.info(f"Starting VR session for child {child_id}")

        # Start session via OASIS service
        session = oasis.start_child_vr_session(
            child_id=child_id,
            parent_token=parent_token,
            vr_platform=vr_platform
        )

        if not session:
            return jsonify({
                'success': False,
                'message': 'Failed to start session'
            }), 500

        # Generate session auth token
        session_token = generate_session_token(child_id, session['session_id'])

        logger.info(f"VR session started - Session ID: {session['session_id']}")

        return jsonify({
            'success': True,
            'session_id': session['session_id'],
            'auth_token': session_token,
            'message': 'Session started successfully',
            'child_name': session.get('child_name', 'Student'),
            'language': session.get('language', 'en')
        }), 200

    except Exception as e:
        logger.error(f"Error starting VR session: {e}")
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500


@vr_api.route('/session/stop', methods=['GET', 'POST'])
def stop_vr_session():
    """
    Stop a VR session

    Query params or body:
    {
        "session_id": str
    }

    Response:
    {
        "success": bool,
        "message": str
    }
    """
    try:
        # Get session ID from query params or body
        session_id = request.args.get('session_id') or request.get_json().get('session_id')

        if not session_id:
            return jsonify({
                'success': False,
                'message': 'Missing session_id'
            }), 400

        # Verify auth token
        auth_header = request.headers.get('Authorization')
        if not verify_session_token(auth_header, session_id):
            return jsonify({
                'success': False,
                'message': 'Invalid or expired token'
            }), 401

        # Stop session
        logger.info(f"Stopping VR session: {session_id}")
        # TODO: Implement session stop logic

        return jsonify({
            'success': True,
            'message': 'Session stopped successfully'
        }), 200

    except Exception as e:
        logger.error(f"Error stopping VR session: {e}")
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500


@vr_api.route('/session/heartbeat', methods=['POST'])
def session_heartbeat():
    """
    Keep session alive with heartbeat

    Request body:
    {
        "session_id": str,
        "timestamp": str (ISO format)
    }

    Response:
    {
        "success": bool,
        "message": str
    }
    """
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        timestamp = data.get('timestamp')

        if not session_id:
            return jsonify({
                'success': False,
                'message': 'Missing session_id'
            }), 400

        # Verify auth token
        auth_header = request.headers.get('Authorization')
        if not verify_session_token(auth_header, session_id):
            return jsonify({
                'success': False,
                'message': 'Invalid or expired token'
            }), 401

        logger.debug(f"Heartbeat received for session {session_id}")

        # TODO: Update session last_active timestamp in database

        return jsonify({
            'success': True,
            'message': 'Heartbeat received'
        }), 200

    except Exception as e:
        logger.error(f"Error processing heartbeat: {e}")
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500


# ============================================================================
# Curriculum & Content
# ============================================================================

@vr_api.route('/curriculum/current', methods=['GET'])
def get_current_curriculum():
    """
    Get current curriculum content for child

    Query params:
    {
        "child_id": int
    }

    Response:
    {
        "activity_id": int,
        "title": str,
        "description": str,
        "content_type": str,
        "data": dict
    }
    """
    try:
        child_id = request.args.get('child_id', type=int)

        if not child_id:
            return jsonify({
                'error': 'Missing child_id'
            }), 400

        # Verify auth
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Missing authorization'}), 401

        # TODO: Get current curriculum for child from backend
        # For now, return sample data
        logger.info(f"Getting curriculum for child {child_id}")

        return jsonify({
            'activity_id': 1,
            'title': 'Phoneme Segmentation: /cat/',
            'description': 'Identify and segment the sounds in the word "cat"',
            'content_type': 'phonemic_awareness',
            'data': {
                'word': 'cat',
                'phonemes': ['/k/', '/æ/', '/t/'],
                'difficulty': 1,
                'hints_available': True
            }
        }), 200

    except Exception as e:
        logger.error(f"Error getting curriculum: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# Progress Tracking
# ============================================================================

@vr_api.route('/progress/submit', methods=['POST'])
def submit_progress():
    """
    Submit activity progress

    Request body:
    {
        "session_id": str,
        "activity_id": int,
        "completed": bool,
        "score": float (0.0 - 1.0),
        "timestamp": str (ISO format),
        "details": dict (optional)
    }

    Response:
    {
        "success": bool,
        "message": str
    }
    """
    try:
        data = request.get_json()

        session_id = data.get('session_id')
        activity_id = data.get('activity_id')
        completed = data.get('completed', False)
        score = data.get('score', 0.0)
        timestamp = data.get('timestamp')
        details = data.get('details', {})

        if not all([session_id, activity_id is not None]):
            return jsonify({
                'success': False,
                'message': 'Missing required fields'
            }), 400

        # Verify auth
        auth_header = request.headers.get('Authorization')
        if not verify_session_token(auth_header, session_id):
            return jsonify({
                'success': False,
                'message': 'Invalid or expired token'
            }), 401

        logger.info(f"Progress submitted - Activity {activity_id}, Score: {score}")

        # TODO: Save progress to database

        return jsonify({
            'success': True,
            'message': 'Progress saved successfully'
        }), 200

    except Exception as e:
        logger.error(f"Error submitting progress: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


# ============================================================================
# Translation
# ============================================================================

@vr_api.route('/translation/translate', methods=['POST'])
def translate_text():
    """
    Translate text to target language

    Request body:
    {
        "text": str,
        "target_language": str (e.g., "es", "fr"),
        "source_language": str (default: "en")
    }

    Response:
    {
        "translated_text": str,
        "source_language": str,
        "target_language": str
    }
    """
    try:
        data = request.get_json()

        text = data.get('text')
        target_language = data.get('target_language')
        source_language = data.get('source_language', 'en')

        if not all([text, target_language]):
            return jsonify({
                'error': 'Missing text or target_language'
            }), 400

        # Verify auth
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Missing authorization'}), 401

        # TODO: Use translation service
        logger.info(f"Translating '{text}' to {target_language}")

        # Placeholder - implement actual translation
        translated_text = f"[{target_language}] {text}"

        return jsonify({
            'translated_text': translated_text,
            'source_language': source_language,
            'target_language': target_language
        }), 200

    except Exception as e:
        logger.error(f"Error translating text: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# Library / Assets
# ============================================================================

@vr_api.route('/library/model/<model_id>', methods=['GET'])
def get_3d_model(model_id: str):
    """
    Get 3D model from library

    Returns binary data (GLB file)
    """
    try:
        # Verify auth
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Missing authorization'}), 401

        logger.info(f"Requesting 3D model: {model_id}")

        # TODO: Fetch model from library service
        # For now, return 404
        return jsonify({
            'error': 'Model not found'
        }), 404

    except Exception as e:
        logger.error(f"Error fetching model: {e}")
        return jsonify({'error': str(e)}), 500


@vr_api.route('/library/audio/<audio_id>', methods=['GET'])
def get_audio(audio_id: str):
    """
    Get audio file from library

    Returns binary data (MP3/WAV file)
    """
    try:
        # Verify auth
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Missing authorization'}), 401

        logger.info(f"Requesting audio: {audio_id}")

        # TODO: Fetch audio from library service
        return jsonify({
            'error': 'Audio not found'
        }), 404

    except Exception as e:
        logger.error(f"Error fetching audio: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# System Status
# ============================================================================

@vr_api.route('/status', methods=['GET'])
def get_vr_system_status():
    """
    Get VR system status

    Response:
    {
        "status": str,
        "version": str,
        "services": dict,
        "active_sessions": int
    }
    """
    try:
        status = oasis.get_system_status()

        return jsonify({
            'status': 'operational',
            'version': '0.1.0',
            'services': status,
            'active_sessions': 0  # TODO: Get from session manager
        }), 200

    except Exception as e:
        logger.error(f"Error getting system status: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


# ============================================================================
# Helper Functions
# ============================================================================

def generate_session_token(child_id: int, session_id: str) -> str:
    """
    Generate JWT token for VR session
    """
    # TODO: Use proper secret key from config
    secret_key = "your-secret-key-change-this"

    payload = {
        'child_id': child_id,
        'session_id': session_id,
        'exp': datetime.utcnow() + timedelta(hours=2),
        'iat': datetime.utcnow()
    }

    token = jwt.encode(payload, secret_key, algorithm='HS256')
    return token


def verify_session_token(auth_header: Optional[str], session_id: str) -> bool:
    """
    Verify JWT session token
    """
    if not auth_header:
        return False

    try:
        # Extract token from "Bearer <token>"
        token = auth_header.split(' ')[1] if ' ' in auth_header else auth_header

        # TODO: Use proper secret key from config
        secret_key = "your-secret-key-change-this"

        payload = jwt.decode(token, secret_key, algorithms=['HS256'])

        # Verify session ID matches
        return payload.get('session_id') == session_id

    except Exception as e:
        logger.warning(f"Token verification failed: {e}")
        return False


# ============================================================================
# Error Handlers
# ============================================================================

@vr_api.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@vr_api.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({'error': 'Internal server error'}), 500
