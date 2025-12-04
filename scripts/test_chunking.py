import requests
import os

# Configuration
BASE_URL = "http://localhost:8000"
API_KEY = os.getenv("API_KEY", "sk-layers-demo")

# Warn if using fallback key
if API_KEY == "sk-layers-demo":
    print("WARNING: Using fallback demo API key. Set API_KEY environment variable for production testing.")

def test_chunking():
    # 1. Create a large text (approx 2500 chars)
    # Chunk size is 1000, so this should create 3 chunks.
    large_text = "This is a test sentence. " * 100 
    print(f"Text Length: {len(large_text)}")
    
    payload = {
        "content": large_text,
        "tags": ["test-chunking"]
    }
    
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/memory/add", json=payload, headers=headers)
        
        if response.status_code == 401:
            print("Auth failed. Please provide a valid API Key.")
            return

        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_chunking()
