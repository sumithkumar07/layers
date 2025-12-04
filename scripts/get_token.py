import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")

supabase = create_client(url, key)

email = os.environ.get("TEST_USER_EMAIL")
password = os.environ.get("TEST_USER_PASSWORD")

if not email or not password:
    print("Error: TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables must be set")
    exit(1)

try:
    res = supabase.auth.sign_in_with_password({"email": email, "password": password})
    token = res.session.access_token
    
    # WARNING: Printing tokens to stdout is a security risk
    # Tokens may be exposed in logs, terminal history, or process monitoring
    print("⚠️  WARNING: This script outputs sensitive credentials")
    print("⚠️  Only use in secure, local development environments")
    print("⚠️  Never run this in production or shared systems\n")
    
    # Show masked token for verification (first 10 chars only)
    print(f"Token (masked): {token[:10]}...{token[-4:]}")
    print(f"Token length: {len(token)} characters")
    
    # Optionally write to secure file instead of printing
    # Uncomment for production use:
    # import os
    # token_file = os.path.expanduser("~/.cache/supabase_token")
    # with open(token_file, 'w') as f:
    #     f.write(token)
    # os.chmod(token_file, 0o600)  # Read/write for owner only
    # print(f"Token written securely to: {token_file}")
    
except Exception as e:
    print(f"Error: {e}")
