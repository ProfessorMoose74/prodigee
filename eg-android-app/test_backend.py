#!/usr/bin/env python3
"""
Lightweight test backend for Elemental Genius mobile app integration testing.
Implements essential API endpoints without heavy dependencies.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import jwt
import datetime
import json
from typing import Dict, Any

app = Flask(__name__)
app.config['SECRET_KEY'] = 'test-secret-key-for-mobile-integration'
CORS(app, origins="*")
socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)

# Mock data store
users = {
    "demo@elementalgenius.com": {
        "id": 1,
        "name": "Demo Parent",
        "email": "demo@elementalgenius.com",
        "password": "demo123",
        "subscription_tier": "premium",
        "children": [
            {
                "id": 1,
                "name": "Demo Child",
                "age": 5,
                "current_week": 3,
                "avatar": "🌟"
            }
        ]
    }
}

active_sessions = {}
parent_rooms = {}

def generate_token(user_id: int, user_type: str) -> str:
    """Generate JWT token for authentication"""
    payload = {
        'user_id': user_id,
        'user_type': user_type,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token: str) -> Dict[str, Any]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    except jwt.InvalidTokenError:
        raise Exception("Invalid token")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Elemental Genius Test Backend",
        "version": "1.0.0",
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

@app.route('/parent/login', methods=['POST'])
def parent_login():
    """Parent login endpoint"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    user = users.get(email)
    if user and user['password'] == password:
        token = generate_token(user['id'], 'parent')
        
        return jsonify({
            "success": True,
            "token": token,
            "parent": {
                "id": user['id'],
                "name": user['name'],
                "email": user['email'],
                "subscription_tier": user['subscription_tier']
            },
            "expires_in_hours": 24
        })
    
    return jsonify({
        "success": False,
        "message": "Invalid credentials"
    }), 401

@app.route('/child/login', methods=['POST'])
def child_login():
    """Child login endpoint (requires parent token)"""
    data = request.get_json()
    child_id = data.get('child_id')
    parent_token = data.get('parent_token')
    
    try:
        payload = verify_token(parent_token)
        if payload['user_type'] != 'parent':
            raise Exception("Invalid parent token")
        
        # Find child
        parent_user = next((u for u in users.values() if u['id'] == payload['user_id']), None)
        if not parent_user:
            raise Exception("Parent not found")
        
        child = next((c for c in parent_user['children'] if c['id'] == child_id), None)
        if not child:
            raise Exception("Child not found")
        
        token = generate_token(child_id, 'child')
        
        return jsonify({
            "success": True,
            "token": token,
            "child": child,
            "session_duration_hours": 4
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 401

@app.route('/logout', methods=['POST'])
def logout():
    """Logout endpoint"""
    return jsonify({
        "message": "Logout successful. Token has been invalidated.",
        "logged_out_at": datetime.datetime.utcnow().isoformat()
    })

@app.route('/child/dashboard', methods=['GET'])
def child_dashboard():
    """Child dashboard endpoint"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "Authorization header required"}), 401
    
    token = auth_header.split(' ')[1]
    try:
        payload = verify_token(token)
        if payload['user_type'] != 'child':
            raise Exception("Child token required")
        
        return jsonify({
            "child": {
                "id": payload['user_id'],
                "name": "Demo Child",
                "current_week": 3,
                "total_stars": 45,
                "streak_days": 5
            },
            "week_activities": {
                "rhyming": {
                    "listen_identify": {
                        "instruction": "Listen carefully. Do these words rhyme?",
                        "difficulty_progression": 0.25
                    }
                }
            },
            "nursery_rhyme": {
                "title": "Humpty Dumpty",
                "lyrics": "Humpty Dumpty sat on a wall...",
                "motions": "Sitting and falling motions"
            },
            "progress": {
                "rhyming": 75.0,
                "onset_fluency": 45.0,
                "blending": 20.0
            },
            "recommendation": {
                "recommended_skill": "rhyming",
                "reason": "You're making great progress with rhyming. Keep going!",
                "motivation_level": "high"
            }
        })
        
    except Exception as e:
        return jsonify({"message": str(e)}), 401

@app.route('/child/activity/<activity_type>/complete', methods=['POST'])
def complete_activity(activity_type):
    """Complete activity endpoint"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "Authorization header required"}), 401
    
    token = auth_header.split(' ')[1]
    try:
        payload = verify_token(token)
        data = request.get_json()
        
        # Emit socket event for parent monitoring
        socketio.emit('child_activity_completed', {
            'child_id': payload['user_id'],
            'child_name': 'Demo Child',
            'activity_type': activity_type,
            'accuracy': data.get('accuracy', 0),
            'stars_earned': data.get('stars_earned', 0),
            'duration': data.get('duration', 0)
        }, room=f"parent_1")
        
        return jsonify({
            "message": "Activity completed and progress saved.",
            "progress_gained": 5.2,
            "new_progress": 80.2,
            "stars_earned": data.get('stars_earned', 3),
            "current_week": 3
        })
        
    except Exception as e:
        return jsonify({"message": str(e)}), 401

@app.route('/analytics/dashboard', methods=['GET'])
def analytics_dashboard():
    """Parent analytics dashboard"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "Authorization header required"}), 401
    
    token = auth_header.split(' ')[1]
    try:
        payload = verify_token(token)
        if payload['user_type'] != 'parent':
            raise Exception("Parent token required")
        
        return jsonify({
            "parent_id": payload['user_id'],
            "summary": {
                "total_children": 1,
                "total_learning_sessions": 45,
                "completed_sessions": 42,
                "completion_rate": 93.3,
                "average_engagement_score": 8.7
            },
            "recent_assessments": [
                {
                    "assessment_id": 1,
                    "child_name": "Demo Child",
                    "assessment_type": "weekly",
                    "overall_score": 82.5,
                    "administered_at": datetime.datetime.utcnow().isoformat()
                }
            ]
        })
        
    except Exception as e:
        return jsonify({"message": str(e)}), 401

# Socket.IO events
@socketio.on('connect')
def handle_connect(auth):
    """Handle socket connection"""
    print(f"Client connected: {request.sid}")
    emit('connected', {'message': 'Connected to Elemental Genius server'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle socket disconnection"""
    print(f"Client disconnected: {request.sid}")

@socketio.on('join_parent_room')
def handle_join_parent_room(data):
    """Join parent room for notifications"""
    parent_id = data.get('parent_id')
    if parent_id:
        room = f"parent_{parent_id}"
        join_room(room)
        parent_rooms[request.sid] = room
        emit('joined_room', {'room': room, 'parent_id': parent_id})
        print(f"Parent {parent_id} joined room: {room}")

@socketio.on('start_monitoring')
def handle_start_monitoring(data):
    """Start monitoring a child"""
    child_id = data.get('child_id')
    emit('monitoring_started', {'child_id': child_id, 'status': 'active'})
    print(f"Started monitoring child: {child_id}")

@socketio.on('child_activity_start')
def handle_child_activity_start(data):
    """Handle child activity start notification"""
    child_id = data.get('child_id')
    activity_type = data.get('activity_type')
    
    # Notify parents
    emit('child_activity_started', {
        'child_id': child_id,
        'child_name': 'Demo Child',
        'activity_type': activity_type,
        'timestamp': data.get('timestamp', datetime.datetime.utcnow().isoformat())
    }, room=f"parent_1")
    
    print(f"Child {child_id} started activity: {activity_type}")

if __name__ == '__main__':
    print("=" * 60)
    print("Elemental Genius Test Backend Server")
    print("=" * 60)
    print("Server: http://localhost:5000")
    print("Health: http://localhost:5000/health")
    print("Demo Login: demo@elementalgenius.com / demo123")
    print("=" * 60)
    
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)