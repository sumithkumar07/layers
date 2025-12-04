import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise ValueError("Missing required environment variables: SUPABASE_URL and SUPABASE_KEY")

supabase = create_client(url, key)
print("Fetching Users...")
try:
    # Try to select * to see all columns
    response = supabase.table("users").select("*").limit(1).execute()
    if response.data:
        print("Columns found:", response.data[0].keys())
    else:
        print("No users found, but query succeeded.")
except Exception as e:
    print(f"Error: {e}")
