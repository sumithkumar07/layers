import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise ValueError("Missing required environment variables: SUPABASE_URL and/or SUPABASE_KEY")

supabase = create_client(url, key)

# Get credentials from environment variables instead of hardcoding
email = os.environ.get("SIGNUP_EMAIL")
password = os.environ.get("SIGNUP_PASSWORD")
full_name = os.environ.get("SIGNUP_FULL_NAME", "Test User")  # Optional with default

if not email or not password:
    raise ValueError("Missing required environment variables: SIGNUP_EMAIL and/or SIGNUP_PASSWORD")

print(f"Signing up {email[:3]}***@***...")
try:
    res = supabase.auth.sign_up({
        "email": email, 
        "password": password,
        "options": {
            "data": {
                "full_name": full_name
            }
        }
    })
    
    if res.user:
        print(f"SUCCESS: User created with ID: {res.user.id[:8]}...")
        
        # Immediate check for public.users trigger
        # We need to sign in to check (RLS) or check via this session if auto-signed in
        # sign_up usually returns a session if auto-confirm is on.
        
        if res.session:
            print("Session active. Checking public.users...")
            # Authenticate Postgrest
            supabase.postgrest.auth(res.session.access_token)
            
            user_row = supabase.table("users").select("*").eq("id", res.user.id).execute()
            if user_row.data:
                print("SUCCESS: Trigger worked! User found in public.users.")
                print("User data found (masked):", user_row.data[0].keys())
            else:
                print("FAILURE: User NOT found in public.users (Trigger failed).")
        else:
            print("No session returned (Email confirmation might be required).")
            
    else:
        print("Failed to create user (No user object returned).")

except Exception as e:
    print(f"Error signing up: {e}")
