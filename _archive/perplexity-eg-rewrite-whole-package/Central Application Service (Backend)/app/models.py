# app/models.py
from . import db
import uuid
from sqlalchemy.dialects.postgresql import UUID, JSONB
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_parent = db.Column(db.Boolean, default=True)
    profiles = db.relationship('Profile', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Profile(db.Model):
    __tablename__ = 'profiles'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    age = db.Column(db.Integer)
    voice_consent = db.Column(db.Boolean, default=False)
    preferred_character = db.Column(db.String(50), default='Professor Al')

class LibraryContent(db.Model):
    __tablename__ = 'library_content'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_url = db.Column(db.Text)
    full_text = db.Column(db.Text, nullable=False)
    summary = db.Column(db.Text)
    # The vector column is managed by the pgvector extension
    # It's added here for completeness but might require raw SQL or a special library
    # embedding = db.Column(Vector(768))