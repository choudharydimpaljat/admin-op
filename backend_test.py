#!/usr/bin/env python3
"""
Backend API Testing Script for FastAPI Application
Tests the basic health endpoints as per review request.
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://feature-parity-app-1.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def test_health_endpoint():
    """Test GET /api - should return Hello World"""
    print("🔍 Testing GET /api endpoint...")
    try:
        response = requests.get(f"{API_BASE}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "Hello World":
                print("✅ GET /api test PASSED - Hello World returned")
                return True
            else:
                print(f"❌ GET /api test FAILED - Expected 'Hello World', got: {data}")
                return False
        else:
            print(f"❌ GET /api test FAILED - Expected 200, got: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ GET /api test FAILED - Exception: {str(e)}")
        return False

def test_post_status():
    """Test POST /api/status - should create a status record"""
    print("\n🔍 Testing POST /api/status endpoint...")
    
    test_data = {
        "client_name": f"TestClient_{datetime.now().strftime('%H%M%S')}"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/status",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if all(key in data for key in ["id", "client_name", "timestamp"]):
                if data["client_name"] == test_data["client_name"]:
                    print("✅ POST /api/status test PASSED - Record created successfully")
                    return True, data
                else:
                    print(f"❌ POST /api/status test FAILED - Client name mismatch")
                    return False, None
            else:
                print(f"❌ POST /api/status test FAILED - Missing required fields in response")
                return False, None
        else:
            print(f"❌ POST /api/status test FAILED - Expected 200, got: {response.status_code}")
            return False, None
            
    except Exception as e:
        print(f"❌ POST /api/status test FAILED - Exception: {str(e)}")
        return False, None

def test_get_status():
    """Test GET /api/status - should list status records"""
    print("\n🔍 Testing GET /api/status endpoint...")
    try:
        response = requests.get(f"{API_BASE}/status")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: Found {len(data)} status records")
            
            if isinstance(data, list):
                if len(data) > 0:
                    # Check if the records have the expected structure
                    sample_record = data[0]
                    if all(key in sample_record for key in ["id", "client_name", "timestamp"]):
                        print("✅ GET /api/status test PASSED - Records retrieved successfully")
                        return True
                    else:
                        print(f"❌ GET /api/status test FAILED - Records missing required fields")
                        return False
                else:
                    print("✅ GET /api/status test PASSED - Empty list returned (no records yet)")
                    return True
            else:
                print(f"❌ GET /api/status test FAILED - Expected list, got: {type(data)}")
                return False
        else:
            print(f"❌ GET /api/status test FAILED - Expected 200, got: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ GET /api/status test FAILED - Exception: {str(e)}")
        return False

def main():
    """Run all backend tests"""
    print("=" * 60)
    print("🚀 STARTING FASTAPI BACKEND TESTS")
    print(f"Testing against: {API_BASE}")
    print("=" * 60)
    
    # Test results
    results = {}
    
    # Test 1: Health endpoint
    results['health'] = test_health_endpoint()
    
    # Test 2: Create status record
    results['post_status'], created_record = test_post_status()
    
    # Test 3: List status records
    results['get_status'] = test_get_status()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    print(f"GET /api (Health): {'✅ PASS' if results['health'] else '❌ FAIL'}")
    print(f"POST /api/status: {'✅ PASS' if results['post_status'] else '❌ FAIL'}")
    print(f"GET /api/status: {'✅ PASS' if results['get_status'] else '❌ FAIL'}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL BACKEND TESTS PASSED!")
        return 0
    else:
        print("⚠️  SOME BACKEND TESTS FAILED!")
        return 1

if __name__ == "__main__":
    sys.exit(main())