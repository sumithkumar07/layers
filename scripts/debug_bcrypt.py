import bcrypt

# The raw key we generated
import os

api_key = os.environ.get("DEBUG_API_KEY")
if not api_key:
    raise ValueError("DEBUG_API_KEY environment variable must be set")
# We don't have the hash from the DB easily without another query, 
# but we can generate a new hash and see if it verifies.
# Or better, let's fetch the hash from the DB using the inspect script logic and verify it here.

from dotenv import load_dotenv
load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
if not url or not key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")

from supabase import create_client

try:
    supabase = create_client(url, key)
except Exception as e:
    print(f"Failed to create Supabase client: {e}")
    exit(1)

response = supabase.table("api_keys").select("key_hash").eq("name", "Agent Deep Test Key (Script)").execute()
if response.data:
    stored_hash = response.data[0]['key_hash']
    print("Stored hash retrieved from database")
    # No need to sign in if we are just verifying the hash locally against the DB record

response = supabase.table("api_keys").select("key_hash").eq("name", "Agent Deep Test Key (Script)").execute()

if response.data:
    stored_hash = response.data[0]['key_hash']
    print(f"Stored Hash: {stored_hash}")
    
    # Test verification
    try:
        if bcrypt.checkpw(api_key.encode(), stored_hash.encode()):
            print("[PASS] Bcrypt Verification PASSED locally")
        else:
            print("[FAIL] Bcrypt Verification FAILED locally")
    except Exception as e:
        print(f"[ERROR] Bcrypt Error: {e}")
else:
    print("Key not found in DB")
