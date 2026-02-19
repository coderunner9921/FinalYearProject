import requests
import os

BASE_URL = "http://localhost:8000"

def test_production_errors():
    print("=" * 60)
    print("TESTING PRODUCTION ERROR HANDLING")
    print("=" * 60)
    
    # Test malformed JSON
    print("\n1. Sending malformed JSON...")
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data="not json",
        headers={"Content-Type": "application/json"}
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print(f"✅ Correct if shows: {{'detail': 'Invalid request data'}}")
    
    # Test missing fields
    print("\n2. Sending incomplete data...")
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "test@example.com"
        # missing password
    })
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print(f"✅ Correct if shows: {{'detail': 'Invalid request data'}}")
    
    # Test 404
    print("\n3. Accessing non-existent endpoint...")
    response = requests.get(f"{BASE_URL}/nonexistent")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print(f"✅ Correct if shows: {{'detail': 'An error occurred'}}")

if __name__ == "__main__":
    test_production_errors()