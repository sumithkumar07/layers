import os
from dotenv import load_dotenv
from supabase import create_client
import pprint

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

supabase = create_client(url, key)

print("Fetching API Keys...")
try:
    # Use service role key if available, otherwise this might fail with RLS
    # But we have the anon key. Let's try to fetch what we can.
    # Actually, we should use the session token from debug_auth if possible, but let's try anon first.
    
    # We need to sign in to see keys usually due to RLS.
    email = os.environ.get("TEST_USER_EMAIL")
    password = os.environ.get("TEST_USER_PASSWORD")
    
    if not email or not password:
        print("Error: TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables must be set")
        exit(1)
    
    res = supabase.auth.sign_in_with_password({"email": email, "password": password})
    
    response = supabase.table("api_keys").select("*").execute()
    print(f"Found {len(response.data)} keys:")
    for key in response.data:
        print(f"- ID: {key['id']}")
        print(f"  Name: {key['name']}")
        print(f"  Prefix: {key.get('key_prefix')}")
        print("-" * 20)
        
except Exception as e:
    print(f"Error: {e}")
