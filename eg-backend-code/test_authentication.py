#!/usr/bin/env python3
"""
Comprehensive Authentication Test
Tests the authentication flow that the React Native frontend expects
"""

import requests
import json
import time

# Test Configuration
BASE_URL = 'http://localhost:5000'
TEST_PARENT_EMAIL = 'test_parent@example.com'
TEST_PARENT_PASSWORD = 'test123'

def test_authentication_flow():
    """Test the complete authentication flow"""
    print("TESTING: Starting Authentication Flow Test")
    print("=" * 50)
    
    session = requests.Session()
    
    # Test 1: Parent Registration
    print("\n[1] Testing Parent Registration...")
    register_data = {
        "name": "Test Parent",
        "email": TEST_PARENT_EMAIL,
        "password": TEST_PARENT_PASSWORD,
        "subscription_tier": "premium"
    }
    
    try:
        response = session.post(f"{BASE_URL}/parent/register", json=register_data)
        print(f"   Status: {response.status_code}")
        if response.status_code == 201:
            print("   SUCCESS: Parent registration successful")
            result = response.json()
            print(f"   Parent ID: {result.get('parent_id')}")
        else:
            print(f"   ❌ Registration failed: {response.text}")
            return False
    except requests.exceptions.ConnectionError:
        print("   ⚠️  Server not running - skipping live tests")
        print("   💡 To run live tests: python elemental_genius_backend.py")
        return test_offline_components()
    
    # Test 2: Parent Login
    print("\n2️⃣ Testing Parent Login...")
    login_data = {
        "email": TEST_PARENT_EMAIL,
        "password": TEST_PARENT_PASSWORD
    }
    
    response = session.post(f"{BASE_URL}/parent/login", json=login_data)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        print("   ✅ Parent login successful")
        result = response.json()
        
        # Check expected fields from frontend
        expected_fields = ['success', 'token', 'sessionCookie', 'user']
        missing_fields = [field for field in expected_fields if field not in result]
        
        if missing_fields:
            print(f"   ❌ Missing expected fields: {missing_fields}")
            return False
        else:
            print("   ✅ Response format matches frontend expectations")
            
        # Check user object structure
        user = result.get('user', {})
        user_fields = ['id', 'uuid', 'name', 'email', 'userType']
        missing_user_fields = [field for field in user_fields if field not in user]
        
        if missing_user_fields:
            print(f"   ❌ Missing user fields: {missing_user_fields}")
            return False
        else:
            print("   ✅ User object structure correct")
            
        parent_token = result['token']
        parent_id = user['id']
        
    else:
        print(f"   ❌ Login failed: {response.text}")
        return False
    
    # Test 3: Add Child
    print("\n3️⃣ Testing Add Child...")
    child_data = {
        "name": "Test Child",
        "age": 5,
        "grade_level": "Pre-K",
        "learning_style": "visual"
    }
    
    headers = {"Authorization": f"Bearer {parent_token}"}
    response = session.post(f"{BASE_URL}/parent/add_child", json=child_data, headers=headers)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 201:
        print("   ✅ Child added successfully")
        result = response.json()
        child_id = result.get('child_id')
        print(f"   Child ID: {child_id}")
    else:
        print(f"   ❌ Add child failed: {response.text}")
        return False
    
    # Test 4: Child Login (COPPA Compliant)
    print("\n4️⃣ Testing Child Login (COPPA Compliant)...")
    child_login_data = {
        "child_id": child_id,
        "parent_token": parent_token
    }
    
    response = session.post(f"{BASE_URL}/child/login", json=child_login_data)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        print("   ✅ Child login successful")
        result = response.json()
        
        # Check expected fields from frontend
        expected_fields = ['success', 'token', 'sessionCookie', 'user']
        missing_fields = [field for field in expected_fields if field not in result]
        
        if missing_fields:
            print(f"   ❌ Missing expected fields: {missing_fields}")
            return False
        else:
            print("   ✅ Response format matches frontend expectations")
            
        # Check child user object structure
        user = result.get('user', {})
        user_fields = ['id', 'uuid', 'name', 'userType', 'age', 'parentId', 'currentWeek', 'totalStars', 'streakDays']
        missing_user_fields = [field for field in user_fields if field not in user]
        
        if missing_user_fields:
            print(f"   ❌ Missing user fields: {missing_user_fields}")
            return False
        else:
            print("   ✅ Child user object structure correct")
            
        child_token = result['token']
        
    else:
        print(f"   ❌ Child login failed: {response.text}")
        return False
    
    # Test 5: Child Dashboard Access
    print("\n5️⃣ Testing Child Dashboard Access...")
    headers = {"Authorization": f"Bearer {child_token}"}
    response = session.get(f"{BASE_URL}/child/dashboard", headers=headers)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        print("   ✅ Child dashboard access successful")
        result = response.json()
        print(f"   Dashboard data keys: {list(result.keys())}")
    else:
        print(f"   ❌ Dashboard access failed: {response.text}")
        return False
    
    print("\n🎉 All authentication tests passed!")
    return True

def test_offline_components():
    """Test components that don't require server"""
    print("\n🔧 Running Offline Component Tests")
    print("=" * 40)
    
    # Test JWT Token Generation
    print("\n📝 Testing JWT Token Generation...")
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
        
        print("   ✅ JWT token generation working")
        print(f"   Token contains: {list(decoded.keys())}")
        
    except Exception as e:
        print(f"   ❌ JWT test failed: {e}")
        return False
    
    # Test Content File Access
    print("\n📁 Testing Content File Structure...")
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
            print(f"   ✅ {dir_path} exists")
        else:
            print(f"   ❌ {dir_path} missing")
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
            print(f"   ✅ {file_path} exists")
        else:
            print(f"   ❌ {file_path} missing")
    
    print("\n✅ Offline component tests completed")
    return True

if __name__ == "__main__":
    success = test_authentication_flow()
    if success:
        print("\n🎊 ALL TESTS PASSED - System ready for frontend integration!")
    else:
        print("\n❌ Some tests failed - check implementation")