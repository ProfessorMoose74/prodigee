# app/routes.py
import os
import requests
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from . import db, socketio
from .models import User, Profile, LibraryContent

bp = Blueprint('api', __name__, url_prefix='/api/v1')

# --- Authentication ---
@bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already exists"}), 409
    
    new_user = User(email=data['email'])
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User created"}), 201

@bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if user and user.check_password(data['password']):
        access_token = create_access_token(identity=str(user.id))
        return jsonify(access_token=access_token)
    return jsonify({"error": "Invalid credentials"}), 401

# --- AI Gateway ---
@bp.route('/voice/recognize', methods=['POST'])
@jwt_required()
def recognize_voice():
    # This endpoint proxies the audio data directly to the AI server
    audio_data = request.data
    ollama_url = f"{os.getenv('OLLAMA_API_URL')}/api/stt" # Custom endpoint on AI server
    
    try:
        response = requests.post(ollama_url, data=audio_data, headers={'Content-Type': 'application/octet-stream'}, timeout=20)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"AI service unavailable: {e}"}), 503

@bp.route('/character', methods=['POST'])
@jwt_required()
def get_character_dialogue():
    # This endpoint proxies the prompt to the AI server
    data = request.get_json()
    ollama_url = f"{os.getenv('OLLAMA_API_URL')}/api/generate"
    
    try:
        response = requests.post(ollama_url, json=data, timeout=60)
        response.raise_for_status()
        # The AI server should return JSON with text and an audio URL/data
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"AI service unavailable: {e}"}), 503

# --- Library ---
@bp.route('/library/ingest', methods=['POST'])
def ingest_content():
    # Secure this endpoint tightly (e.g., firewall, internal network only)
    if request.headers.get('X-Internal-API-Key') != os.getenv('INTERNAL_API_KEY'):
        return jsonify({"error": "Unauthorized"}), 403
        
    data = request.get_json()
    new_content = LibraryContent(
        source_url=data.get('source'),
        full_text=data.get('text'),
        summary=data.get('summary')
        # Vector embedding would be handled here
    )
    db.session.add(new_content)
    db.session.commit()
    return jsonify({"message": "Content ingested"}), 201

@bp.route('/library/search', methods=['GET'])
@jwt_required()
def search_library():
    query = request.args.get('q')
    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400
    
    # In a real implementation, this would be a semantic vector search.
    # For this example, we perform a simple text search.
    results = LibraryContent.query.filter(LibraryContent.full_text.ilike(f'%{query}%')).limit(10).all()
    
    output = [{"id": str(item.id), "text": item.full_text[:200]} for item in results]
    return jsonify(results=output)