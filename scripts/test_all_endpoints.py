import requests
import json
import os

import requests
import json
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

email = os.environ.get("SUPABASE_EMAIL")
password = os.environ.get("SUPABASE_PASSWORD")

if not email or not password:
    raise ValueError("SUPABASE_EMAIL and SUPABASE_PASSWORD environment variables must be set")

# Get Fresh Token
try:
    res = supabase.auth.sign_in_with_password({"email": email, "password": password})
    JWT = res.session.access_token
    print(f"Got fresh JWT: {JWT[:10]}...")
except Exception as e:
    print(f"Failed to login: {e}")
    exit(1)

BASE_URL = "http://localhost:8000"

headers = {
    "Authorization": f"Bearer {JWT}",
    "Content-Type": "application/json"
}

def test_endpoint(name, method, endpoint, payload=None):
    print(f"Testing {name} ({endpoint})...")
    try:
        if method == "POST":
            response = requests.post(f"{BASE_URL}{endpoint}", json=payload, headers=headers)
        else:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("[PASS]")
        else:
            print(f"[FAIL] {response.text}")
    except Exception as e:
        print(f"[ERROR] {e}")
    print("-" * 20)

# 1. Verify (Already tested, but good to double check)
test_endpoint("Trust Engine", "POST", "/verify", {
    "claim": "The sky is blue",
    "evidence": "Visual observation"
})

# 2. Memory Add
test_endpoint("Memory Add", "POST", "/memory/add", {
    "content": "My favorite color is blue",
    "tags": ["personal", "preference"]
})

# 3. Memory Search
test_endpoint("Memory Search", "POST", "/memory/search", {
    "query": "favorite color"
})

# 4. Vision (Mock check, since we need a file)
# We'll skip file upload for this script unless we create a dummy file.
# Let's create a dummy file.
with open("test_image.txt", "w") as f:
    f.write("fake image content")

print("Testing Vision (Image Verify)...")
try:
    files = {'file': open('test_image.txt', 'rb')}
    # Note: requests sets boundary automatically, so don't set Content-Type manually for files
    headers_files = {"Authorization": f"Bearer {JWT}"} 
    response = requests.post(f"{BASE_URL}/images/verify", files=files, headers=headers_files)
    print(f"Status: {response.status_code}")
    if response.status_code == 200 or response.status_code == 400: # 400 is acceptable for fake image
        print("[PASS] (400 is expected for text file)")
    else:
        print(f"[FAIL] {response.text}")
except Exception as e:
    print(f"[ERROR] {e}")
print("-" * 20)
