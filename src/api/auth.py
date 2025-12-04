from fastapi import HTTPException, Security, Depends, Header
from fastapi.security.api_key import APIKeyHeader
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from functools import lru_cache
import time
import logging
import bcrypt
import hashlib

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

# Simple in-memory cache for API keys to reduce Supabase latency
# Format: {api_key: (user_id, timestamp)}
_key_cache = {}
CACHE_TTL = 60  # seconds

def _check_and_migrate_legacy_key(api_key: str):
    """
    Lazy migration: Check unmigrated keys (lookup_hash is NULL) in api_keys table.
    If found, backfill lookup_hash and return user_id.
    Returns: user_id (str), False (inactive), or None (not found)
    """
    try:
        # Rate limit: only attempt migration once per key per minute
        migration_cache_key = f"migration_attempt:{hashlib.sha256(api_key.encode()).hexdigest()[:16]}"
        if migration_cache_key in _key_cache:
            _, timestamp = _key_cache[migration_cache_key]
            if time.time() - timestamp < CACHE_TTL:
                return None
        _key_cache[migration_cache_key] = (None, time.time())

        # Fetch all unmigrated keys
        response = supabase.table("api_keys").select("id, user_id, api_key_hash").is_("lookup_hash", "null").limit(100).execute()
        
        if not response.data:
            return None
            
        for record in response.data:
            try:
                if bcrypt.checkpw(api_key.encode(), record['api_key_hash'].encode()):
                    # Found match! Backfill lookup_hash
                    new_lookup_hash = hashlib.sha256(api_key.encode()).hexdigest()
                    
                    # Update DB
                    supabase.table("api_keys").update({
                        "lookup_hash": new_lookup_hash
                    }).eq("id", record['id']).execute()
                    
                    logging.info(f"Lazily migrated API key for user {record['user_id'][:8]}...")                    
                        
                    return record['user_id']
            except Exception as e:
                logging.warning(f"Error checking legacy key: {e}")
                continue
                
        return None
    except Exception as e:
        logging.error(f"Lazy migration check failed: {e}")
        return None

# Simple TTL Cache implementation to avoid adding cachetools dependency
class SimpleTTLCache:
    def __init__(self, ttl_seconds: int = 300, maxsize: int = 1000):
        self.cache = {}
        self.ttl = ttl_seconds
        self.maxsize = maxsize
    
    def get(self, key):
        if key in self.cache:
            value, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl:
                return value
            else:
                del self.cache[key]
        return None
    
    def set(self, key, value):
        if value is None:
            return  # Don't cache None/failures
            
        if len(self.cache) >= self.maxsize:
            # Simple eviction: remove first item (FIFO-ish)
            try:
                self.cache.pop(next(iter(self.cache)))
            except StopIteration:
                pass
        self.cache[key] = (value, time.time())

# Initialize JWT cache
_jwt_cache = SimpleTTLCache(ttl_seconds=300, maxsize=1000)

def _verify_jwt_cached(token: str):
    """
    Cache JWT validation with TTL to avoid repeated Supabase calls.
    Does NOT cache failures (None), allowing retries for transient errors.
    """
    # Check cache first
    cached_user_id = _jwt_cache.get(token)
    if cached_user_id:
        return cached_user_id
        
    try:
        user = supabase.auth.get_user(token)
        if user and user.user:
            user_id = user.user.id
            # Cache success
            _jwt_cache.set(token, user_id)
            return user_id
        return None
    except Exception as e:
        logging.warning(f"JWT Verification Failed: {e}")
        return None

async def get_current_user(
    api_key: str = Security(api_key_header),
    authorization: str = Header(None)
):
    current_time = time.time()
    
    # 1. Check for Bearer Token (JWT) - Preferred for Dashboard
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        
        # Use Cached Verification
        user_id = _verify_jwt_cached(token)
        if user_id:
            return user_id
            
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # 2. Check API Key (Legacy/External)
    if not api_key:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Check cache
    if api_key in _key_cache:
        user_id, timestamp = _key_cache[api_key]
        if current_time - timestamp < CACHE_TTL:
            return user_id
    
    # Verify against Supabase
    try:
        # Verify API key using bcrypt
        
        # First check 'api_keys' table (New System)
        lookup_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        # Direct lookup by hash (indexed column)
        # logging.debug(f"Checking key with lookup_hash: {lookup_hash}")
        response = supabase.table("api_keys").select("user_id, api_key_hash, is_active").eq("lookup_hash", lookup_hash).execute()
        
        if response.data:
            # Should be at most one record due to indexed lookup
            key_record = response.data[0]
            try:
                if bcrypt.checkpw(api_key.encode(), key_record['api_key_hash'].encode()):
                    if not key_record.get('is_active', True):
                        raise HTTPException(status_code=403, detail="API Key is inactive")
                    
                    # Found matching key
                    user_id = key_record['user_id']
                    # Update cache
                    _key_cache[api_key] = (user_id, current_time)
                    return user_id
            except Exception as e:
                logging.warning(f"bcrypt verification failed for api_key lookup: {e}")

        # 1.5 Lazy Migration Check
        migrated_user_id = _check_and_migrate_legacy_key(api_key)
        if migrated_user_id is False:  # Inactive
            raise HTTPException(status_code=403, detail="API Key is inactive")
        if migrated_user_id:
            _key_cache[api_key] = (migrated_user_id, current_time)
            return migrated_user_id
            
        # Fallback: Check 'users' table (Legacy System)
        response = supabase.table("users").select("id, is_active").eq("api_key", api_key).execute()
        
        if not response.data:
            raise HTTPException(status_code=403, detail="Invalid API Key")
            
        user = response.data[0]
        
        if not user.get("is_active"):
            raise HTTPException(status_code=403, detail="API Key is inactive")
            
        user_id = user["id"]
        
        # Update cache
        _key_cache[api_key] = (user_id, current_time)
        
        return user_id
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logging.error(f"Auth Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Authentication Service Unavailable")

async def get_user_from_key(api_key: str):
    """
    Helper to get user object from API key directly (not as dependency).
    """
    if not api_key:
        return None
        
    try:
        # Check new api_keys table first (using bcrypt verification)
        # Check new api_keys table first (using bcrypt verification)
        lookup_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        # Direct lookup by hash (indexed column)
        response = supabase.table("api_keys").select("user_id, api_key_hash").eq("lookup_hash", lookup_hash).execute()
        
        if response.data:
            key_record = response.data[0]
            try:
                if bcrypt.checkpw(api_key.encode(), key_record['api_key_hash'].encode()):
                    user_id = key_record['user_id']
                    # Fetch full user object
                    user_response = supabase.table("users").select("id, is_active").eq("id", user_id).execute()
                    if user_response.data:
                        user = user_response.data[0]
                        if user.get("is_active", False):
                            return user
                        return None  # Inactive user
            except Exception as e:
                logging.warning(f"get_user_from_key bcrypt check failed: {e}")
                pass
        
        # Lazy Migration Check
        migrated_user_id = _check_and_migrate_legacy_key(api_key)
        if migrated_user_id and migrated_user_id is not False:
             # Fetch full user
             user_response = supabase.table("users").select("id, is_active").eq("id", migrated_user_id).execute()
             if user_response.data:
                 user = user_response.data[0]
                 if user.get("is_active", False):
                     return user
                 return None

        # Fallback to legacy lookup
        response = supabase.table("users").select("id, is_active").eq("api_key", api_key).execute()
        if response.data:
            return response.data[0]
        return None
    except Exception as e:
        logging.warning(f"get_user_from_key failed: {e}")
        return None
