from fastapi import APIRouter, Header, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, List
from src.api.auth import get_current_user, supabase
from src.utils.logger import logger
from src.api.billing import check_credits, deduct_credits

router = APIRouter(prefix="/memory", tags=["Memory"])

class MemoryAddRequest(BaseModel):
    content: str
    tags: Optional[List[str]] = []

class MemoryVerifiedRequest(BaseModel):
    claim: str
    evidence: Optional[str] = None
    tags: Optional[List[str]] = []

class MemorySearchRequest(BaseModel):
    query: str

class MemoryCaptureRequest(BaseModel):
    url: str
    verify: bool = False
    tags: Optional[List[str]] = []

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """
    Splits text into overlapping chunks.
    """
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")
    if overlap < 0 or overlap >= chunk_size:
        raise ValueError("overlap must be >= 0 and < chunk_size")
    
    if len(text) <= chunk_size:
        return [text]
        
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += (chunk_size - overlap)
        
    return chunks

@router.post("/add")
async def add_memory(request: Request, body: MemoryAddRequest, user_id: str = Depends(get_current_user)):
    memory_engine = request.app.state.memory_engine
    if not memory_engine:
        raise HTTPException(status_code=503, detail="Memory Engine not available")

    # 1. Chunk the content
    chunks = chunk_text(body.content)
    cost_per_chunk = 2
    total_cost = len(chunks) * cost_per_chunk
    
    saved_ids = []
    
    # 2. Process each chunk
    # 2. Process chunks and prepare batch
    memories_data = []
    for i, chunk in enumerate(chunks):
        # Embed (Potential for batching here too if engine supports it)
        embedding = memory_engine.embed_text(chunk)
        
        chunk_tags = body.tags + ([f"chunk:{i+1}/{len(chunks)}"] if len(chunks) > 1 else [])
        
        memories_data.append({
            "user_id": user_id,
            "content": chunk,
            "embedding": embedding,
            "tags": chunk_tags
        })
        
    # 3. Atomic Execution (Deduct + Insert)
    try:
        # Calculate Cost
        total_cost = len(memories_data) * cost_per_chunk
        
        response = supabase.rpc("capture_memory_atomic", {
            "p_user_id": user_id,
            "p_cost": total_cost,
            "p_memories": memories_data,
            "p_action": f"memory_add_{len(memories_data)}_chunks"
        }).execute()
        
        result = response.data
        
        if not result or 'inserted_ids' not in result:
             raise HTTPException(status_code=500, detail="Failed to save memories (No IDs returned)")
             
        saved_ids = result['inserted_ids']
        actual_cost = total_cost # RPC handles deduction
        
    except Exception as e:
        print(f"Error saving batch: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save batch: {str(e)}")

    return {
        "status": "success", 
        "ids": saved_ids, 
        "chunks_created": len(saved_ids),
        "credits_deducted": actual_cost
    }

@router.post("/verified")
async def add_verified_memory(request: Request, body: MemoryVerifiedRequest, user_id: str = Depends(get_current_user)):
    """
    Layer 1 + Layer 2: Verify first, then Store.
    """
    # Cost: 3 Credits (1 Verify + 2 Save)
    inference_engine = request.app.state.inference_engine
    memory_engine = request.app.state.memory_engine
    
    if not inference_engine or not memory_engine:
        raise HTTPException(status_code=503, detail="Engines not available")

    # 1. Verify with Trust OS (Layer 1)
    prediction = inference_engine.verify_claim(body.claim, body.evidence)
    
    if prediction["result"] == "FALSE":
        # Charge 1 credit for the verification attempt
        await deduct_credits(user_id, 1, "verify_reject")
        return {
            "status": "rejected", 
            "reason": "Trust OS determined this is FALSE.", 
            "confidence": prediction["confidence"]
        }
    
    # 2. If TRUE, Store in Memory (Layer 2)
    full_content = f"{body.claim} (Evidence: {prediction['evidence']})"
    
    embedding = memory_engine.embed_text(full_content)
    
    data = {
        "user_id": user_id,
        "content": full_content,
        "embedding": embedding,
        "tags": body.tags + ["verified", "trust-os"]
    }
    
    try:
        response = supabase.table("memories").insert(data).execute()
        memory_id = response.data[0]['id']
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save memory: {str(e)}")
    
    # Deduct Full Amount
    await deduct_credits(user_id, 3, "memory_verified")
    
    return {
        "status": "success", 
        "id": memory_id, 
        "verification": prediction
    }

@router.post("/search")
async def search_memory(request: Request, body: MemorySearchRequest, user_id: str = Depends(get_current_user)):
    # Cost: 1 Credit (Search)
    memory_engine = request.app.state.memory_engine
    if not memory_engine:
        raise HTTPException(status_code=503, detail="Memory Engine not available")

    # 1. Embed Query
    query_embedding = memory_engine.embed_text(body.query)
    
    results = []
    try:
        # 2. Hybrid Search (RPC)
        rpc_params = {
            "query_embedding": query_embedding,
            "query_text": body.query,
            "match_threshold": 0.5,
            "match_count": 20
        }
        
        response = supabase.rpc("match_memories_hybrid", rpc_params).execute()
        results = response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

    # Deduct Credits
    await deduct_credits(user_id, 1, "memory_search")
    
    if not results:
        return {"results": []}
    
    return {"results": results}

from bs4 import BeautifulSoup
import httpx

@router.post("/capture")
async def capture_memory(request: Request, body: MemoryCaptureRequest, user_id: str = Depends(get_current_user)):
    """
    Captures content from a URL.
    """
    # Cost: 2 Credits (Storage)
    memory_engine = request.app.state.memory_engine
    inference_engine = request.app.state.inference_engine
    
    if not memory_engine:
        raise HTTPException(status_code=503, detail="Memory Engine not available")

    # 1. Scrape URL
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(body.url, follow_redirects=True)
            resp.raise_for_status()
            
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Basic cleanup
        for script in soup(["script", "style", "nav", "footer"]):
            script.decompose()
            
        text = soup.get_text(separator=' ', strip=True)
        content = text[:4000]
        title = soup.title.string if soup.title else body.url
        
        full_content = f"Source: {body.url}\nTitle: {title}\n\n{content}"
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")

    # 2. Verify (Optional)
    verification_result = None
    if body.verify:
        if not inference_engine:
             raise HTTPException(status_code=503, detail="Inference Engine not available for verification")
             
        prediction = inference_engine.verify_claim(title, content[:500])
        verification_result = prediction
        
        if prediction["result"] == "FALSE":
            # Deduct partial (Verify only)
            await deduct_credits(user_id, 1, "capture_reject")
            return {
                "status": "rejected",
                "reason": "Trust OS found the title/content to be misleading or false.",
                "confidence": prediction["confidence"]
            }

    # 3. Chunk & Prepare Data
    chunks = chunk_text(full_content)
    
    # Calculate Total Cost
    storage_cost = len(chunks) * 2
    verify_cost = 1 if body.verify else 0
    total_cost = storage_cost + verify_cost
    
    memories_data = []
    for i, chunk in enumerate(chunks):
        embedding = memory_engine.embed_text(chunk)
        chunk_tags = body.tags + ([f"chunk:{i+1}/{len(chunks)}"] if len(chunks) > 1 else [])
        
        memories_data.append({
            "content": chunk,
            "embedding": embedding,
            "tags": chunk_tags
        })
        
    # 4. Atomic Execution (Deduct + Insert)
    try:
        response = supabase.rpc("capture_memory_atomic", {
            "p_user_id": user_id,
            "p_cost": total_cost,
            "p_memories": memories_data,
            "p_action": f"memory_capture_{len(chunks)}_chunks"
        }).execute()
        
        result = response.data
        
        if result is None or not isinstance(result, dict) or 'inserted_ids' not in result or 'new_balance' not in result:
            logger.error(f"Unexpected RPC response structure: {result}")
            raise HTTPException(status_code=500, detail="Failed to capture memory. No credits were deducted.")
        
        return {
            "status": "success", 
            "ids": result['inserted_ids'],
            "title": title,
            "chunks_created": len(chunks),
            "verification": verification_result,
            "credits_deducted": total_cost,
            "new_balance": result['new_balance']
        }        
    except Exception as e:
        # Map DB errors to HTTP exceptions
        error_msg = str(e).lower()
        if "insufficient credits" in error_msg:
             raise HTTPException(status_code=402, detail=f"Insufficient credits. Required: {total_cost}")
        
        from src.utils.logger import logger
        logger.error(f"Atomic capture failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to capture memory. No credits were deducted.")
