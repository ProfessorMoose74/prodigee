#!/usr/bin/env python3
"""
Mobile App Integration Test Script
Tests connectivity between React Native mobile app and Elemental Genius backend
"""

import requests
import json
import time
import asyncio
import websockets
from datetime import datetime

class MobileIntegrationTester:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.parent_token = None
        self.child_token = None
        
    def print_header(self, title):
        print("\n" + "=" * 60)
        print(f"Testing: {title}")
        print("=" * 60)
    
    def print_result(self, test_name, success, details=None):
        status = "PASS" if success else "FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
    
    def test_health_check(self):
        """Test basic server connectivity"""
        self.print_header("Health Check")
        
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                self.print_result("Server Health", True, f"Status: {data['status']}")
                return True
            else:
                self.print_result("Server Health", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.print_result("Server Health", False, f"Connection failed: {e}")
            return False
    
    def test_parent_authentication(self):
        """Test parent login functionality"""
        self.print_header("Parent Authentication")
        
        try:
            login_data = {
                "email": "demo@elementalgenius.com",
                "password": "demo123"
            }
            
            response = self.session.post(
                f"{self.base_url}/parent/login",
                json=login_data,
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.parent_token = data['token']
                    parent_name = data['parent']['name']
                    self.print_result("Parent Login", True, f"Welcome {parent_name}")
                    
                    # Test authenticated endpoint
                    headers = {'Authorization': f'Bearer {self.parent_token}'}
                    dashboard_response = self.session.get(
                        f"{self.base_url}/analytics/dashboard",
                        headers=headers,
                        timeout=5
                    )
                    
                    if dashboard_response.status_code == 200:
                        dashboard_data = dashboard_response.json()
                        child_count = dashboard_data['summary']['total_children']
                        self.print_result("Parent Dashboard", True, f"{child_count} children found")
                        return True
                    else:
                        self.print_result("Parent Dashboard", False, "Dashboard access failed")
                        return False
                else:
                    self.print_result("Parent Login", False, "Login unsuccessful")
                    return False
            else:
                self.print_result("Parent Login", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.print_result("Parent Authentication", False, f"Error: {e}")
            return False
    
    def test_child_authentication(self):
        """Test child login functionality"""
        self.print_header("Child Authentication")
        
        if not self.parent_token:
            self.print_result("Child Login", False, "Parent token required first")
            return False
        
        try:
            child_login_data = {
                "child_id": 1,
                "parent_token": self.parent_token
            }
            
            response = self.session.post(
                f"{self.base_url}/child/login",
                json=child_login_data,
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.child_token = data['token']
                    child_name = data['child']['name']
                    child_age = data['child']['age']
                    self.print_result("Child Login", True, f"{child_name}, age {child_age}")
                    
                    # Test child dashboard
                    headers = {'Authorization': f'Bearer {self.child_token}'}
                    dashboard_response = self.session.get(
                        f"{self.base_url}/child/dashboard",
                        headers=headers,
                        timeout=5
                    )
                    
                    if dashboard_response.status_code == 200:
                        dashboard_data = dashboard_response.json()
                        current_week = dashboard_data['child']['current_week']
                        total_stars = dashboard_data['child']['total_stars']
                        self.print_result("Child Dashboard", True, f"Week {current_week}, {total_stars} stars")
                        return True
                    else:
                        self.print_result("Child Dashboard", False, "Dashboard access failed")
                        return False
                else:
                    self.print_result("Child Login", False, "Login unsuccessful")
                    return False
            else:
                self.print_result("Child Login", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.print_result("Child Authentication", False, f"Error: {e}")
            return False
    
    def test_activity_completion(self):
        """Test activity completion workflow"""
        self.print_header("Activity Completion")
        
        if not self.child_token:
            self.print_result("Activity Completion", False, "Child token required")
            return False
        
        try:
            activity_data = {
                "accuracy": 85.0,
                "duration": 300,
                "stars_earned": 3,
                "engagement": 9.2
            }
            
            headers = {'Authorization': f'Bearer {self.child_token}'}
            response = self.session.post(
                f"{self.base_url}/child/activity/rhyming/complete",
                json=activity_data,
                headers=headers,
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                stars_earned = data.get('stars_earned', 0)
                new_progress = data.get('new_progress', 0)
                self.print_result("Activity Completion", True, f"{stars_earned} stars, {new_progress}% progress")
                return True
            else:
                self.print_result("Activity Completion", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.print_result("Activity Completion", False, f"Error: {e}")
            return False
    
    def test_logout(self):
        """Test logout functionality"""
        self.print_header("Logout")
        
        try:
            if self.child_token:
                headers = {'Authorization': f'Bearer {self.child_token}'}
                response = self.session.post(
                    f"{self.base_url}/logout",
                    headers=headers,
                    timeout=5
                )
                
                if response.status_code == 200:
                    self.print_result("Child Logout", True, "Token invalidated")
                else:
                    self.print_result("Child Logout", False, f"HTTP {response.status_code}")
            
            if self.parent_token:
                headers = {'Authorization': f'Bearer {self.parent_token}'}
                response = self.session.post(
                    f"{self.base_url}/logout",
                    headers=headers,
                    timeout=5
                )
                
                if response.status_code == 200:
                    self.print_result("Parent Logout", True, "Token invalidated")
                    return True
                else:
                    self.print_result("Parent Logout", False, f"HTTP {response.status_code}")
                    return False
            
            return True
                
        except Exception as e:
            self.print_result("Logout", False, f"Error: {e}")
            return False
    
    def test_websocket_connection(self):
        """Test WebSocket/SocketIO connectivity"""
        self.print_header("WebSocket Connection")
        
        try:
            # Test Socket.IO endpoint availability
            socketio_url = f"{self.base_url}/socket.io/?EIO=4&transport=polling"
            response = self.session.get(socketio_url, timeout=5)
            
            if response.status_code == 200:
                self.print_result("WebSocket Connection", True, "Socket.IO endpoint accessible")
                return True
            else:
                self.print_result("WebSocket Connection", False, f"HTTP {response.status_code}")
                return False
                    
        except Exception as e:
            self.print_result("WebSocket Connection", False, f"Connection failed: {e}")
            return False
    
    def run_full_test_suite(self):
        """Run complete integration test suite"""
        print("\n" + "=" * 60)
        print("ELEMENTAL GENIUS MOBILE APP INTEGRATION TEST")
        print("=" * 60)
        print(f"Target Server: {self.base_url}")
        print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        tests = []
        
        # API Tests
        tests.append(("Health Check", self.test_health_check()))
        tests.append(("Parent Auth", self.test_parent_authentication()))
        tests.append(("Child Auth", self.test_child_authentication()))
        tests.append(("Activity Flow", self.test_activity_completion()))
        tests.append(("Logout", self.test_logout()))
        
        # WebSocket Test
        try:
            websocket_result = self.test_websocket_connection()
            tests.append(("WebSocket", websocket_result))
        except Exception as e:
            tests.append(("WebSocket", False))
            print(f"FAIL WebSocket - {e}")
        
        # Results Summary
        self.print_header("Test Results Summary")
        passed = sum(1 for _, result in tests if result)
        total = len(tests)
        
        for test_name, result in tests:
            status = "PASS" if result else "FAIL"
            print(f"{status} {test_name}")
        
        print(f"\nResults: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            print("\nALL TESTS PASSED!")
            print("Mobile app is ready for backend integration")
        else:
            print(f"\n{total-passed} tests failed")
            print("Review failed tests before deploying mobile app")
        
        print("\n" + "=" * 60)
        
        return passed == total

if __name__ == "__main__":
    tester = MobileIntegrationTester()
    success = tester.run_full_test_suite()
    exit(0 if success else 1)