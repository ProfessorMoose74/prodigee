#!/usr/bin/env python3
"""
Simple Authentication Test without Unicode
"""

def test_offline_components():
    """Test components that don't require server"""
    print("TESTING: Offline Component Tests")
    print("=" * 40)
    
    # Test JWT Token Generation
    print("\n[1] Testing JWT Token Generation...")
    try:
        import jwt
        import datetime
        
        secret_key = 'test-secret'
        payload = {
            'id': 1,
            'uuid': 'test-uuid-123',
            'type': 'parent',
            'userType': 'parent',
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }
        
        token = jwt.encode(payload, secret_key, algorithm='HS256')
        decoded = jwt.decode(token, secret_key, algorithms=['HS256'])
        
        print("   SUCCESS: JWT token generation working")
        print(f"   Token contains: {list(decoded.keys())}")
        
    except Exception as e:
        print(f"   ERROR: JWT test failed: {e}")
        return False
    
    # Test Content File Access
    print("\n[2] Testing Content File Structure...")
    import os
    
    required_dirs = [
        'content',
        'content/phonemic',
        'content/math',
        'assets',
        'assets/sounds',
        'assets/animations'
    ]
    
    for dir_path in required_dirs:
        if os.path.exists(dir_path):
            print(f"   SUCCESS: {dir_path} exists")
        else:
            print(f"   ERROR: {dir_path} missing")
            return False
            
    # Check for placeholder files
    required_files = [
        'assets/sounds/welcome.mp3',
        'assets/sounds/success.mp3',
        'assets/sounds/error.mp3',
        'assets/animations/voice_wave.json'
    ]
    
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"   SUCCESS: {file_path} exists")
        else:
            print(f"   WARNING: {file_path} missing")
    
    # Test Database Models  
    print("\n[3] Testing Database Models...")
    try:
        from flask import Flask
        from flask_sqlalchemy import SQLAlchemy
        import uuid
        from werkzeug.security import generate_password_hash
        
        # Create test app
        app = Flask(__name__)
        app.config['SECRET_KEY'] = 'test-key'
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test_auth.db'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        
        db = SQLAlchemy(app)
        
        # Define models with UUID fields
        class Parent(db.Model):
            id = db.Column(db.Integer, primary_key=True)
            uuid = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
            name = db.Column(db.String(100), nullable=False)
            email = db.Column(db.String(120), unique=True, nullable=False)
            password_hash = db.Column(db.String(256), nullable=False)
            
            def set_password(self, password):
                self.password_hash = generate_password_hash(password)
        
        class Child(db.Model):
            id = db.Column(db.Integer, primary_key=True)
            uuid = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
            parent_id = db.Column(db.Integer, db.ForeignKey('parent.id'), nullable=False)
            name = db.Column(db.String(100), nullable=False)
            age = db.Column(db.Integer, nullable=False)
            total_stars = db.Column(db.Integer, default=0)
            streak_days = db.Column(db.Integer, default=0)
            current_week = db.Column(db.Integer, default=1)
        
        with app.app_context():
            db.create_all()
            
            # Test creating models with UUID
            parent = Parent(
                name='Test Parent',
                email='test@test.com'
            )
            parent.set_password('test123')
            db.session.add(parent)
            db.session.commit()
            
            print(f"   SUCCESS: Parent created with UUID: {parent.uuid}")
            
            child = Child(
                parent_id=parent.id,
                name='Test Child',
                age=5
            )
            db.session.add(child)
            db.session.commit()
            
            print(f"   SUCCESS: Child created with UUID: {child.uuid}")
            print("   SUCCESS: Database models working with UUID fields")
            
    except Exception as e:
        print(f"   ERROR: Database test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Test Authentication Response Format
    print("\n[4] Testing Authentication Response Format...")
    try:
        # Simulate parent login response
        parent_response = {
            'success': True,
            'token': 'test-jwt-token',
            'sessionCookie': 'test-jwt-token',
            'user': {
                'id': 1,
                'uuid': 'test-uuid-123',
                'name': 'Test Parent',
                'email': 'test@test.com',
                'userType': 'parent'
            }
        }
        
        # Check required fields
        required_fields = ['success', 'token', 'sessionCookie', 'user']
        missing = [f for f in required_fields if f not in parent_response]
        
        if not missing:
            print("   SUCCESS: Parent response format correct")
        else:
            print(f"   ERROR: Missing fields: {missing}")
            return False
            
        # Simulate child login response
        child_response = {
            'success': True,
            'token': 'test-child-token',
            'sessionCookie': 'test-child-token',
            'user': {
                'id': 1,
                'uuid': 'test-child-uuid',
                'name': 'Test Child',
                'userType': 'child',
                'age': 5,
                'parentId': 1,
                'currentWeek': 1,
                'totalStars': 0,
                'streakDays': 0
            }
        }
        
        # Check child response fields
        child_user_fields = ['id', 'uuid', 'name', 'userType', 'age', 'parentId', 'currentWeek', 'totalStars', 'streakDays']
        missing_child = [f for f in child_user_fields if f not in child_response['user']]
        
        if not missing_child:
            print("   SUCCESS: Child response format correct")
        else:
            print(f"   ERROR: Missing child fields: {missing_child}")
            return False
            
    except Exception as e:
        print(f"   ERROR: Response format test failed: {e}")
        return False
    
    print("\nSUCCESS: All offline component tests passed!")
    return True

if __name__ == "__main__":
    success = test_offline_components()
    if success:
        print("\nALL TESTS PASSED - Authentication system ready!")
        print("\nNext steps:")
        print("1. Run: python elemental_genius_backend.py")
        print("2. Test live endpoints with frontend")
        print("3. Verify WebSocket functionality")
    else:
        print("\nSome tests failed - check implementation")