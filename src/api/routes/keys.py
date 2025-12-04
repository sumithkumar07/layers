from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import List, Optional
from src.api.auth import get_current_user, supabase
from src.utils.logger import logger
import secrets
import bcrypt
import hashlib

router = APIRouter(prefix="/auth/keys", tags=["Auth"])

class KeyCreateRequest(BaseModel):
    name: str

class KeyResponse(BaseModel):
    id: str
    name: str
    prefix: str
    created_at: str
    last_used_at: Optional[str] = None
    api_key: Optional[str] = None # Only returned on creation

@router.get("", response_model=List[KeyResponse])
async def list_keys(user_id: str = Depends(get_current_user)):
    try:
        response = supabase.table("api_keys").select("*").eq("user_id", user_id).execute()
        keys = []
        for k in response.data:
            keys.append({
                "id": k['id'],
                "name": k['name'],
                "prefix": k.get('key_prefix') or "sk-layers-...", # Fallback if migration pending
                "created_at": k['created_at'],
                "last_used_at": k['last_used_at']
            })
        return keys
    except Exception as e:
        logger.error(f"List Keys Error: {e}", exc_info=True)
        return []

@router.post("", response_model=KeyResponse)
async def create_key(body: KeyCreateRequest, user_id: str = Depends(get_current_user)):
    # Generate a new key
    new_key = "sk-layers-" + secrets.token_urlsafe(32)
    
    # Hash the key with bcrypt
    # Hash the key with bcrypt
    
    key_hash = bcrypt.hashpw(new_key.encode(), bcrypt.gensalt()).decode('utf-8')
    lookup_hash = hashlib.sha256(new_key.encode()).hexdigest()
    
    data = {
        "user_id": user_id,
        "name": body.name,
        "api_key_hash": key_hash,
        "key_hash": key_hash, # Legacy support
        "lookup_hash": lookup_hash,
        "key_prefix": new_key[:20] + "...",
        "prefix": new_key[:20] + "..." # Legacy support
    }
    
    try:
        response = supabase.table("api_keys").insert(data).execute()
        created = response.data[0]
        
        return {
            "id": created['id'],
            "name": created['name'],
            "prefix": created['key_prefix'],
            "created_at": created['created_at'],
            "api_key": new_key # Return full key once
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{key_id}")
async def delete_key(key_id: str, user_id: str = Depends(get_current_user)):
    try:
        supabase.table("api_keys").delete().eq("id", key_id).eq("user_id", user_id).execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
