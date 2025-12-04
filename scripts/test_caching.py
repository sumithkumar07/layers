import time
import requests
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Get Token
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

email = os.environ.get("SUPABASE_EMAIL")
password = os.environ.get("SUPABASE_PASSWORD")

if not email or not password:
    raise ValueError("SUPABASE_EMAIL and SUPABASE_PASSWORD environment variables must be set")

try:
    res = supabase.auth.sign_in_with_password({"email": email, "password": password})
    token = res.session.access_token
except Exception as e:
    print(f"Login failed: {e}. Check SUPABASE_EMAIL and SUPABASE_PASSWORD environment variables")    # Fallback
    token = "mock_token" 

headers = {"Authorization": f"Bearer {token}"}
api_url = "http://localhost:8000/verify"

payload = {
    "claim": "The earth is flat.",
    "evidence": "Scientific consensus and satellite imagery confirm the Earth is an oblate spheroid."
}

print("--- Run 1 (Cold) ---")
start = time.time()
resp = requests.post(api_url, json=payload, headers=headers)
end = time.time()
print(f"Status: {resp.status_code}")
print(f"Time: {end - start:.4f}s")

print("\n--- Run 2 (Cached) ---")
start = time.time()
resp = requests.post(api_url, json=payload, headers=headers)
end = time.time()
print(f"Status: {resp.status_code}")
print(f"Time: {end - start:.4f}s")

if (end - start) < 0.5:
    print("\nSUCCESS: Cache Hit Verified!")
else:
    print("\nFAILURE: Cache Miss (Too Slow)")
