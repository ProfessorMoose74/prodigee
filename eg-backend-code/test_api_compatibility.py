#!/usr/bin/env python3
"""
API Compatibility Test Suite
Tests all endpoints that the Android and Desktop frontends use
"""

import requests
import json
import time
import os

# Test Configuration
BASE_URL = 'http://localhost:5000'
TEST_PARENT_EMAIL = 'test_compatibility@example.com'
TEST_PARENT_PASSWORD = 'test123'

class APICompatibilityTest:
    def __init__(self):
        self.session = requests.Session()
        self.parent_token = None
        self.child_token = None
        self.parent_id = None
        self.child_id = None

    def test_parent_login_response_format(self):
        """Test that parent login returns the format expected by frontends"""
        print("\n🔐 Testing Parent Login Response Format...")

        # First register a test parent
        register_data = {
            "name": "Test Parent",
            "email": TEST_PARENT_EMAIL,
            "password": TEST_PARENT_PASSWORD,
            "subscription_tier": "premium"
        }

        try:
            # Try to register (might already exist)
            response = self.session.post(f"{BASE_URL}/parent/register", json=register_data)
            print(f"   Registration status: {response.status_code}")
        except:
            pass

        # Test login
        login_data = {
            "email": TEST_PARENT_EMAIL,
            "password": TEST_PARENT_PASSWORD
        }

        response = self.session.post(f"{BASE_URL}/parent/login", json=login_data)
        print(f"   Login status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()

            # Check required fields that frontends expect
            required_fields = ['success', 'token', 'sessionCookie', 'user']
            missing_fields = [field for field in required_fields if field not in data]

            if missing_fields:
                print(f"   ❌ Missing fields: {missing_fields}")
                return False

            # Check user object structure
            user = data.get('user', {})
            user_fields = ['id', 'uuid', 'name', 'email', 'userType']
            missing_user_fields = [field for field in user_fields if field not in user]

            if missing_user_fields:
                print(f"   ❌ Missing user fields: {missing_user_fields}")
                return False

            # Store for next tests
            self.parent_token = data['token']
            self.parent_id = user['id']

            print("   ✅ Parent login response format correct")
            return True
        else:
            print(f"   ❌ Login failed: {response.text}")
            return False

    def test_child_login_response_format(self):
        """Test that child login returns the format expected by frontends"""
        print("\n👶 Testing Child Login Response Format...")

        if not self.parent_token:
            print("   ❌ Parent token required for child login test")
            return False

        # First add a test child
        child_data = {
            "name": "Test Child",
            "age": 5,
            "grade_level": "Pre-K",
            "learning_style": "visual"
        }

        headers = {"Authorization": f"Bearer {self.parent_token}"}
        response = self.session.post(f"{BASE_URL}/parent/add_child", json=child_data, headers=headers)

        if response.status_code == 201:
            child_info = response.json()
            self.child_id = child_info.get('child_id')
            print(f"   Test child created: ID {self.child_id}")

        # Test child login
        child_login_data = {
            "child_id": self.child_id,
            "parent_token": self.parent_token
        }

        response = self.session.post(f"{BASE_URL}/child/login", json=child_login_data)
        print(f"   Child login status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()

            # Check required fields that frontends expect
            required_fields = ['success', 'token', 'sessionCookie', 'user']
            missing_fields = [field for field in required_fields if field not in data]

            if missing_fields:
                print(f"   ❌ Missing fields: {missing_fields}")
                return False

            # Check user object structure
            user = data.get('user', {})
            user_fields = ['id', 'uuid', 'name', 'userType', 'age', 'parentId', 'currentWeek', 'totalStars', 'streakDays']
            missing_user_fields = [field for field in user_fields if field not in user]

            if missing_user_fields:
                print(f"   ❌ Missing user fields: {missing_user_fields}")
                return False

            # Store for next tests
            self.child_token = data['token']

            print("   ✅ Child login response format correct")
            return True
        else:
            print(f"   ❌ Child login failed: {response.text}")
            return False

    def test_avatar_endpoint(self):
        """Test the new avatar update endpoint"""
        print("\n🎭 Testing Avatar Update Endpoint...")

        if not self.child_token:
            print("   ❌ Child token required for avatar test")
            return False

        # Test avatar update
        avatar_data = {"avatar": "🌟"}
        headers = {"Authorization": f"Bearer {self.child_token}"}

        response = self.session.put(f"{BASE_URL}/child/avatar", json=avatar_data, headers=headers)
        print(f"   Avatar update status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()

            # Check response format
            required_fields = ['success', 'message', 'avatar']
            missing_fields = [field for field in required_fields if field not in data]

            if missing_fields:
                print(f"   ❌ Missing fields: {missing_fields}")
                return False

            if data['avatar'] != "🌟":
                print(f"   ❌ Avatar not updated correctly: {data['avatar']}")
                return False

            print("   ✅ Avatar endpoint working correctly")
            return True
        else:
            print(f"   ❌ Avatar update failed: {response.text}")
            return False

    def test_settings_endpoint(self):
        """Test the new settings update endpoint"""
        print("\n⚙️ Testing Settings Update Endpoint...")

        if not self.child_token:
            print("   ❌ Child token required for settings test")
            return False

        # Test settings update
        settings_data = {"learning_style": "auditory"}
        headers = {"Authorization": f"Bearer {self.child_token}"}

        response = self.session.put(f"{BASE_URL}/child/settings", json=settings_data, headers=headers)
        print(f"   Settings update status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()

            # Check response format
            required_fields = ['success', 'message', 'updated_fields']
            missing_fields = [field for field in required_fields if field not in data]

            if missing_fields:
                print(f"   ❌ Missing fields: {missing_fields}")
                return False

            if 'learning_style' not in data['updated_fields']:
                print(f"   ❌ Learning style not updated: {data['updated_fields']}")
                return False

            print("   ✅ Settings endpoint working correctly")
            return True
        else:
            print(f"   ❌ Settings update failed: {response.text}")
            return False

    def test_existing_endpoints(self):
        """Test that existing endpoints still work"""
        print("\n📊 Testing Existing Core Endpoints...")

        if not self.child_token:
            print("   ❌ Child token required for endpoint tests")
            return False

        headers = {"Authorization": f"Bearer {self.child_token}"}
        endpoints_to_test = [
            ('/child/dashboard', 'GET'),
            ('/health', 'GET'),
        ]

        all_passed = True
        for endpoint, method in endpoints_to_test:
            try:
                if method == 'GET':
                    response = self.session.get(f"{BASE_URL}{endpoint}", headers=headers)

                if response.status_code in [200, 201]:
                    print(f"   ✅ {method} {endpoint}: OK")
                else:
                    print(f"   ❌ {method} {endpoint}: {response.status_code}")
                    all_passed = False
            except Exception as e:
                print(f"   ❌ {method} {endpoint}: {str(e)}")
                all_passed = False

        return all_passed

    def run_compatibility_tests(self):
        """Run all compatibility tests"""
        print("🚀 Starting API Compatibility Tests")
        print("=" * 50)

        # Check if server is running
        try:
            response = self.session.get(f"{BASE_URL}/health", timeout=5)
            print(f"✅ Server is running (status: {response.status_code})")
        except Exception as e:
            print(f"❌ Server not accessible: {e}")
            print("   💡 Start the backend with: python elemental_genius_backend.py")
            return False

        # Run tests
        tests = [
            ("Parent Login Format", self.test_parent_login_response_format),
            ("Child Login Format", self.test_child_login_response_format),
            ("Avatar Endpoint", self.test_avatar_endpoint),
            ("Settings Endpoint", self.test_settings_endpoint),
            ("Existing Endpoints", self.test_existing_endpoints),
        ]

        passed = 0
        total = len(tests)

        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
                else:
                    print(f"   ⚠️  {test_name} test failed")
            except Exception as e:
                print(f"   ❌ {test_name} test error: {e}")

        print("\n" + "=" * 50)
        print(f"📊 Test Results: {passed}/{total} tests passed")

        if passed == total:
            print("🎉 ALL COMPATIBILITY TESTS PASSED!")
            print("✅ Your Android and Desktop frontends are fully compatible!")
        else:
            print("⚠️  Some tests failed - check the issues above")

        return passed == total

if __name__ == "__main__":
    tester = APICompatibilityTest()
    success = tester.run_compatibility_tests()

    if success:
        print("\n🚀 Ready for production deployment!")
        print("📱 Your frontends can now communicate seamlessly with the backend")
    else:
        print("\n🔧 Fix the issues above before deploying")