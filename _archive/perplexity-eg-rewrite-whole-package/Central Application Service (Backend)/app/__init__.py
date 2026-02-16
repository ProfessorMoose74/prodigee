# app/__init__.py
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()
jwt = JWTManager()
socketio = SocketIO()

def create_app():
    app = Flask(__name__)
    app.config.from_mapping(
        SECRET_KEY=os.getenv('SECRET_KEY'),
        JWT_SECRET_KEY=os.getenv('JWT_SECRET_KEY'),
        SQLALCHEMY_DATABASE_URI=os.getenv('DATABASE_URL'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False
    )

    db.init_app(app)
    jwt.init_app(app)
    # Configure CORS to allow client origins
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    socketio.init_app(app, cors_allowed_origins="*")

    with app.app_context():
        # Import and register blueprints
        from . import routes
        from . import models
        app.register_blueprint(routes.bp)
        
        # Create database tables if they don't exist
        db.create_all()

    return app