import requests
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# 1. Login to get JWT
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

email = os.environ.get("SUPABASE_EMAIL")
password = os.environ.get("SUPABASE_PASSWORD")

if not email or not password:
    raise ValueError("SUPABASE_EMAIL and SUPABASE_PASSWORD environment variables must be set")

print("Logging in...")
res = supabase.auth.sign_in_with_password({"email": email, "password": password})
jwt = res.session.access_token

# 2. Call API
BASE_URL = "http://localhost:8000"
headers = {"Authorization": f"Bearer {jwt}"}
payload = {
    "content": "This is a REAL memory stored in the REAL database.",
    "tags": ["real_mode", "verification"]
}

print("Sending request to /memory/add...")
response = requests.post(f"{BASE_URL}/memory/add", json=payload, headers=headers)

print(f"Status: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code == 200:
    print("SUCCESS: Real Memory Inserted!")
else:
    print("FAILURE: Could not insert memory.")
