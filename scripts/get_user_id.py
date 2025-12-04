import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")

supabase = create_client(url, key)

email = os.environ.get("SUPABASE_EMAIL")
password = os.environ.get("SUPABASE_PASSWORD")

if not email or not password:
    raise ValueError("SUPABASE_EMAIL and SUPABASE_PASSWORD environment variables must be set")

try:
    res = supabase.auth.sign_in_with_password({"email": email, "password": password})
    print(f"User ID: {res.user.id}")
except Exception as e:
    print(f"Error: {e}")
