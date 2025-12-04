import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set")
    exit(1)

email = os.environ.get("TEST_USER_EMAIL")
password = os.environ.get("TEST_USER_PASSWORD")

if not email or not password:
    print("Error: TEST_USER_EMAIL and TEST_USER_PASSWORD must be set")
    exit(1)

supabase = create_client(url, key)

# 1. Get User ID from Auth
print(f"Signing in as {email}...")
try:
    res = supabase.auth.sign_in_with_password({"email": email, "password": password})
    user_id = res.user.id
    print(f"User ID: {user_id}")
    
    # Authenticate Postgrest
    existing = supabase.table("users").select("*").eq("id", user_id).execute()
    
    if not existing.data:
        print("User not found in public.users. Inserting...")
        data = {
            "id": user_id,
            "email": email,
            "full_name": "Agent Test V1",
            "credits": 100,
            "is_active": True
        }
        try:
            supabase.table("users").insert(data).execute()
            print("SUCCESS: User synced to public.users.")
        except Exception as insert_err:
            print(f"Error inserting user: {insert_err}")
            exit(1)
    else:
        print("User already exists in public.users.")
        print(existing.data)

    print("Sync completed successfully.")
    exit(0)
        
except Exception as e:
    print(f"Error: {e}")
    exit(1)
