"""
API module initialization
Registers all API blueprints for Flask application
"""

from flask import Flask
from .vr_endpoints import vr_api

def create_api_app() -> Flask:
    """
    Create and configure Flask application for VR API

    Returns:
        Configured Flask application
    """
    app = Flask(__name__)

    # Register blueprints
    app.register_blueprint(vr_api)

    # CORS configuration for Unity client
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        return response

    return app
