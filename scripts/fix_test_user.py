import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set in environment")
    exit(1)

supabase = create_client(url, key)

email = os.environ.get("SUPABASE_EMAIL")
password = os.environ.get("SUPABASE_PASSWORD")

if not email or not password:
    raise ValueError("SUPABASE_EMAIL and SUPABASE_PASSWORD environment variables must be set")

print(f"Logging in as {email}...")
try:
    res = supabase.auth.sign_in_with_password({"email": email, "password": password})
    user_id = res.user.id
    print(f"Logged in. ID: {user_id}")
    
    # Check if exists in public.users
    # Use service role key if possible, but here we use the user's token for RLS check
    # Actually, to INSERT, we might need to be careful with RLS.
    # But let's try inserting as the user.
    
    print("Checking public.users...")
    # We need to use the authenticated client
    supabase.postgrest.auth(res.session.access_token)
    
    exists = supabase.table("users").select("id").eq("id", user_id).execute()
    
    if not exists.data:
        print("User missing from public.users. Inserting...")
        data = {
            "id": user_id,
            "email": email,
            "full_name": "Agent Test V3",
            "credits": 100
        }
        try:
            supabase.table("users").insert(data).execute()
            print("SUCCESS: User inserted into public.users.")
        except Exception as e:
            print(f"Failed to insert: {e}")
    else:
        print("User already exists in public.users.")
        
except Exception as e:
    print(f"Error: {e}")
