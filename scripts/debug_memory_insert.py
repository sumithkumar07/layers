import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set in environment")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
# 1. Get a User ID (from email)
email = "agent_test_v5@example.com"
user_resp = supabase.table("users").select("id").eq("email", email).execute()
if not user_resp.data:
    print("User not found!")
    exit(1)

user_id = user_resp.data[0]['id']
print(f"User ID: {user_id}")

# 2. Try Insert
data = {
    "user_id": user_id,
    "content": "Debug Memory Insert",
    "embedding": [0.1] * 384, # Assuming 384 dim
    "tags": ["debug"]
}

try:
    print("Attempting insert...")
    response = supabase.table("memories").insert(data).execute()
    print("Success:", response.data)
except Exception as e:
    print("Error:", e)
