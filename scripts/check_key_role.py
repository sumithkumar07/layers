"""
Debugging utility to inspect the role claim in a Supabase JWT token.

WARNING: This script disables JWT signature verification and should ONLY
be used for inspecting trusted tokens in development. Never use this
approach in production code or with untrusted tokens.
"""
import os
import sys
import jwt
from dotenv import load_dotenv

load_dotenv()

key = os.environ.get("SUPABASE_KEY")
if not key:
    print("No SUPABASE_KEY found.")
    exit(1)

try:
    # WARNING: Signature verification disabled - for debugging only!
    # This allows inspection of token claims without validating authenticity
    decoded = jwt.decode(key, options={"verify_signature": False})
    print(f"Role: {decoded.get('role')}")
except (jwt.DecodeError, jwt.InvalidTokenError) as e:
    print(f"Error decoding JWT: {e}")
    sys.exit(1)
except Exception as e:
    # Catch any other unexpected errors
    print(f"Unexpected error: {e}")
    sys.exit(1)
