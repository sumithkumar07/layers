import os
from dotenv import load_dotenv
from supabase import create_client
import secrets
import bcrypt
import hashlib


def seed_key(supabase):
    print("Seeding initial API key...")
    
    # 1. Get the first user
    users = supabase.table("users").select("id").order("created_at").limit(1).execute()
    if not users.data:
        print("No users found! Please sign up first.")
        return

    user_id = users.data[0]['id']
    print("Found user.")    
    # 2. Check if bootstrap key already exists
    existing = supabase.table("api_keys").select("id").eq("user_id", user_id).eq("name", "Dev Bootstrap Key").limit(1).execute()
    if existing.data:
        print("Dev Bootstrap Key already exists for this user.")
        print("Skipping key creation to avoid duplicates.")
        return
    
    # 3. Generate a secure random API key
    random_key = f"sk-layers-{secrets.token_urlsafe(32)}"
    
    # 4. Hash the key with bcrypt for secure storage
    key_hash = bcrypt.hashpw(random_key.encode(), bcrypt.gensalt()).decode('utf-8')
    lookup_hash = hashlib.sha256(random_key.encode()).hexdigest()

    # 5. Insert hashed key with prefix
    data = {
        "user_id": user_id,
        "name": "Dev Bootstrap Key",
        "api_key_hash": key_hash,
        "lookup_hash": lookup_hash,
        "prefix": random_key[:20] + "..."
    }
    
    try:
        supabase.table("api_keys").insert(data).execute()
        print(f"Success! Created key: {random_key}")
        print("IMPORTANT: Save this key securely - it won't be shown again!")
    except Exception as e:
        print(f"Error creating key: {e}")

if __name__ == "__main__":
    load_dotenv()
    
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment")
    
    supabase = create_client(url, key)
    seed_key(supabase)
