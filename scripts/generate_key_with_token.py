import os
from dotenv import load_dotenv
from supabase import create_client
import secrets
import bcrypt
import hashlib

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set.")
    exit(1)

supabase = create_client(url, key)

email = os.environ.get("TEST_USER_EMAIL")
password = os.environ.get("TEST_USER_PASSWORD")

if not email or not password:
    print("Error: TEST_USER_EMAIL and TEST_USER_PASSWORD must be set.")
    exit(1)
print(f"Signing in as {email}...")
try:
    res = supabase.auth.sign_in_with_password({"email": email, "password": password})
    if not res.session or not res.user:
        print("Error: Authentication failed - no session or user returned.")
        exit(1)
    session = res.session
    user_id = res.user.id
except Exception as e:
    print(f"Error during authentication: {e}")
    exit(1)

# Generate secure key
random_key = secrets.token_urlsafe(32)

# Write to file instead of stdout for security (prevents CI log exposure)
output_file = "generated_key.txt"
with open(output_file, "w") as f:
    f.write(random_key)

print(f"\n{'='*60}")
print(f"SUCCESS: API Key generated and written to {output_file}")
print(f"WARNING: This file contains sensitive credentials. Delete it after use.")
print(f"{'='*60}\n")
key_hash = bcrypt.hashpw(random_key.encode(), bcrypt.gensalt()).decode()
lookup_hash = hashlib.sha256(random_key.encode()).hexdigest()
data = {
    "user_id": user_id,
    "name": "Agent Deep Test Key (Script)",
    "key_hash": key_hash,
    "api_key_hash": key_hash,
    "lookup_hash": lookup_hash,
    "key_prefix": random_key[:20] + "...",
    "prefix": random_key[:20] + "...",
    # "_api_key_backup": random_key  # REMOVED: Do not store plaintext key
}

print("Inserting key into api_keys table...")
try:
    # Client is already authenticated from sign_in_with_password
    supabase.table("api_keys").insert(data).execute()
    print(f"SUCCESS! Created key in api_keys with prefix: {random_key[:20]}...")
    
    # LEGACY FALLBACK REMOVED: Do not store plaintext keys in users table
    
except Exception as e:
    print(f"Error inserting key: {e}")
