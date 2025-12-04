import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: Missing Supabase URL or Key in .env")
    exit(1)

supabase: Client = create_client(url, key)

tables = ["users", "api_keys", "memories", "credit_logs", "transactions"]

print("--- Database Table Check ---")
for table in tables:
    try:
        # Try to select 1 row. If table doesn't exist, it usually throws an error.
        # Note: With RLS, we might get 0 rows but no error if table exists.
        # If table does NOT exist, Supabase/PostgREST usually returns a 404 or specific error.
        response = supabase.table(table).select("id").limit(1).execute()
        print(f"[OK] Table '{table}' exists.")
    except Exception as e:
        print(f"[FAIL] Table '{table}' check failed: {e}")

print("\n--- Transaction Schema Check ---")
try:
    import uuid
    import time
    
    # 1. Create/Sign-in a Test User
    test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "password123"
    
    print(f"Creating test user: {test_email}")
    auth_res = supabase.auth.sign_up({
        "email": test_email,
        "password": test_password
    })
    
    if not auth_res.user:
        # Maybe sign up disabled or confirm required. Try sign in if exists (unlikely for random)
        print("[WARN] Sign up didn't return user immediately (maybe confirm required).")
        # If confirm required, we can't proceed easily without service key to auto-confirm.
        # But let's assume for dev env it might work or we use a known user.
        # Let's try to use the user provided in the chat history if any? No.
        # Let's try to just insert into public.users directly? No, RLS/FK will fail.
        raise Exception("Could not create test user for verification.")

    user_id = auth_res.user.id
    print(f"Test User ID: {user_id}")
    
    # 1.5 Verify Public User Trigger (Login/Signup Check)
    print("Checking if public.users row was auto-created...")
    # Give trigger a moment
    time.sleep(2) 
    public_user = supabase.table("users").select("*").eq("id", user_id).execute()
    if public_user.data:
        print(f"[OK] Public user profile created: {public_user.data[0]['email']}")
    else:
        print(f"[FAIL] Public user profile NOT created. Trigger 'on_auth_user_created' might be missing/broken.")
        raise Exception("User Trigger Failed")

    # 1.6 Verify API Key Generation (RLS Check)
    print("Testing API Key Generation...")
    api_key_data = {
        "user_id": user_id,
        "name": "Test Key",
        "key_prefix": "sk_test",
        "prefix": "sk_test", # Sending BOTH
        "api_key_hash": "dummy_hash",
        "api_key_hash": "dummy_hash",
        "key_hash": "dummy_hash", # Sending BOTH to satisfy potential double constraint
        "lookup_hash": "dummy_lookup"
    }
    try:
        ak_res = supabase.table("api_keys").insert(api_key_data).execute()
        print(f"[OK] API Key created successfully: {ak_res.data[0]['id']}")
    except Exception as e:
        print(f"[FAIL] API Key creation failed (RLS Issue?): {e}")
        raise e

    # 2. Insert Transaction
    dummy_order_id = f"test_{uuid.uuid4().hex[:8]}"
    data = {
        "user_id": user_id,
        "amount": 100,
        "currency": "USD",
        "credits_amount": 10,
        "razorpay_order_id": dummy_order_id,
        "status": "test_pending"
    }
    
    # We need to use the authenticated client
    # supabase.auth.sign_in_with_password ... actually sign_up returns session usually
    
    res = supabase.table("transactions").insert(data).execute()
    print(f"[OK] Transaction inserted successfully: {res.data[0]['id']}")
    
    # 3. Cleanup
    # We can't delete the user easily with anon key, but we can delete the transaction
    supabase.table("transactions").delete().eq("razorpay_order_id", dummy_order_id).execute()
    print("[OK] Test transaction cleaned up.")

except Exception as e:
    print(f"[FAIL] Transaction schema check failed: {e}")
