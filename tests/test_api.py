from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os

# Add src to path
sys.path.append(os.path.join(os.getcwd(), 'src'))

from api.main import app
from api.auth import get_current_user

# Mock Auth to bypass Supabase for logic testing
async def mock_get_current_user():
    return "test-user-id"

app.dependency_overrides[get_current_user] = mock_get_current_user


def run_tests():
    with TestClient(app) as client:
        print("Running Health Check...")
        response = client.get("/health")
        assert response.status_code == 200
        print(f"Health Status: {response.json()}")
        assert response.json()["gpu_ready"] == True, "GPU Not Ready"
        print("Health Check: PASS")

        print("Running Reputation Check...")
        response = client.get("/reputation?domain=google.com")
        assert response.status_code == 200
        print("Reputation Check: PASS")

        print("Running Verify Endpoint...")
        # Test Entailment
        payload = {
            "claim": "The sky is blue.",
            "evidence": "The sky appears blue to the human eye."
        }
        response = client.post("/verify", json=payload)
        if response.status_code != 200:
            print(f"Verify Failed: {response.text}")
        assert response.status_code == 200
        data = response.json()
        assert data["result"] == "TRUE"
        assert data["confidence"] > 0.9
        print("Verify Endpoint: PASS")
        
        print("ALL API TESTS PASSED")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"TEST FAILED: {e}")
        import traceback
        traceback.print_exc()

