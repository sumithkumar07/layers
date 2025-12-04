import os
import sys
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
if not url or not key:
    print("ERROR: SUPABASE_URL and SUPABASE_KEY must be set in .env")
    sys.exit(1)
supabase = create_client(url, key)
email = "agent_test_v6@example.com"
password = "password123"

print(f"--- STARTING SIGNUP FOR {email} ---")

try:
    # 1. Sign Up
    print("1. Calling sign_up...")
    res = supabase.auth.sign_up({
        "email": email, 
        "password": password,
        "options": {
            "data": {
                "full_name": "Agent Test V6"
            }
        }
    })
    
    if not res.user:
        print("FAILURE: No user returned from sign_up.")
        sys.exit(1)
        
    print(f"SUCCESS: User created. ID: {res.user.id}")
    print(f"User Role: {res.user.role}")
    
    # 2. Check Session
    if res.session:
        print("SUCCESS: Session returned immediately (Auto-confirm ON).")
        token = res.session.access_token
    else:
        print("WARNING: No session returned. Email confirmation might be required.")
        # Try to sign in to see if it works anyway
        print("Attempting sign_in_with_password...")
        try:
            login_res = supabase.auth.sign_in_with_password({"email": email, "password": password})
            if login_res.session:
                print("SUCCESS: Login successful despite no initial session.")
                token = login_res.session.access_token
            else:
                print("FAILURE: Login failed (No session).")
                sys.exit(1)
        except Exception as e:
            print(f"FAILURE: Login failed with error: {e}")
            sys.exit(1)

    # 3. Check public.users
    print("3. Checking public.users table...")
    supabase.postgrest.auth(token)
    
    try:
        user_row = supabase.table("users").select("*").eq("id", res.user.id).execute()
        if user_row.data:
            print("SUCCESS: Trigger worked! User found in public.users.")
            print(user_row.data)
        else:
            print("FAILURE: User NOT found in public.users (Trigger failed).")
            # Try to insert manually to see if RLS allows it now
            print("Attempting manual insert (Self-Service)...")
            try:
                data = {
                    "id": res.user.id,
                    "email": email,
                    "full_name": "Agent Test V6",
                    "credits": 100
                }
                supabase.table("users").insert(data).execute()
                print("SUCCESS: Manual insert worked!")
            except Exception as insert_e:
                print(f"FAILURE: Manual insert failed: {insert_e}")
                
    except Exception as e:
        print(f"Error checking public.users: {e}")

except Exception as e:
    print(f"CRITICAL ERROR: {e}")
    sys.exit(1)
