import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set.")
    exit(1)

supabase = create_client(url, key)

email = os.environ.get("TEST_EMAIL")
password = os.environ.get("TEST_PASSWORD")

if not email or not password:
    print("Error: TEST_EMAIL and TEST_PASSWORD must be set.")
    exit(1)
print("Attempting to Sign In with test credentials...")
try:
    res = supabase.auth.sign_in_with_password({"email": email, "password": password})
    print("Sign In Successful!")
    # SECURITY: Mask token in logs
    print(f"Access Token: {res.session.access_token[:5]}...[MASKED]")
    print(f"User ID: {res.user.id}")
except Exception as e:
    print(f"Sign In Failed: {e}")
    print("Attempting to Sign Up...")
    try:
        res = supabase.auth.sign_up({"email": email, "password": password})
        print("Sign Up Successful!")
        if res.session:
            # SECURITY: Mask token in logs
            print(f"Access Token: {res.session.access_token[:5]}...[MASKED]")
            print(f"User ID: {res.user.id}")
        else:
            print("Sign Up succeeded but NO SESSION returned. (Likely requires email confirmation)")
            print(f"User ID: {res.user.id}")
    except Exception as e2:
        print(f"Sign Up Failed: {e2}")
