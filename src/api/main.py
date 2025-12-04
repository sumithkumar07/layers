from fastapi import FastAPI, Depends, HTTPException, Header, BackgroundTasks
from pydantic import BaseModel
from contextlib import asynccontextmanager
import sys
import os
import asyncio
from typing import Optional, List

# Add src to path to import inference_engine
sys.path.append(os.path.join(os.getcwd(), 'src'))

from inference_engine import InferenceEngine
from api.auth import get_current_user, get_user_from_key, supabase
from api.gpu_lock import get_gpu_lock

# Global Variables (for backward compatibility if needed, but prefer app.state)
bad_domains = set()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Initializing API...")
    
    # Load Inference Engine
    try:
        app.state.inference_engine = InferenceEngine()
        print("Inference Engine Loaded.")
    except Exception as e:
        print(f"Failed to load Inference Engine: {e}")
        app.state.inference_engine = None

    # Load Memory Engine
    try:
        from src.memory_engine import MemoryEngine
        app.state.memory_engine = MemoryEngine()
        print("Memory Engine Loaded.")
    except Exception as e:
        print(f"Failed to load Memory Engine: {e}")
        app.state.memory_engine = None
        
    # Load Reputation List
    try:
        if os.path.exists("data/bad_domains.txt"):
            with open("data/bad_domains.txt", "r") as f:
                bad_domains = set(line.strip() for line in f)
            print(f"Loaded {len(bad_domains)} bad domains.")
        else:
            print("Warning: data/bad_domains.txt not found.")
    except Exception as e:
        print(f"Failed to load bad_domains: {e}")
        
    yield
    # Shutdown
    print("Shutting down API...")

app = FastAPI(title="Layers Verification API", lifespan=lifespan)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin
        for origin in [
            os.environ.get("CORS_ORIGIN_1"),
            os.environ.get("CORS_ORIGIN_2"),
        ]
        if origin  # Filter out None values
    ] or ["http://localhost:3000"],  # Safe default for development only
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Import and Include Routers
# Note: We import here to avoid circular dependency if router imports main (it shouldn't)
from api.routes import memory, keys, images, billing
app.include_router(memory.router)
app.include_router(keys.router)
app.include_router(images.router)
app.include_router(billing.router, prefix="/billing", tags=["Billing"])

# --- Models ---
class VerifyRequest(BaseModel):
    claim: str
    evidence: Optional[str] = None

class VerifyResponse(BaseModel):
    result: str
    confidence: float
    claim: str
    evidence: str
    sources: List[str] = []

# --- Endpoints ---

@app.post("/verify", response_model=VerifyResponse)
async def verify_claim(
    request: VerifyRequest, 
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
    lock: asyncio.Lock = Depends(get_gpu_lock)
):
    inference_engine = getattr(app.state, "inference_engine", None)
    if not inference_engine:
        raise HTTPException(status_code=503, detail="Inference Engine not ready")

    # Async Lock for GPU (Queueing)
    async with lock:
        prediction = inference_engine.verify_claim(request.claim, request.evidence)
    
    # Log to Supabase (Background)
    def log_to_supabase():
        try:
            supabase.table("logs").insert({
                "user_id": user_id,
                "claim": request.claim,
                "evidence": prediction["evidence"],
                "result": prediction["result"],
                "confidence": prediction["confidence"]
            }).execute()
        except Exception as e:
            print(f"Logging Error: {e}")
            
    background_tasks.add_task(log_to_supabase)
    
    # Deduct Credits (Synchronous - CRITICAL: Must succeed before response)
    # This prevents revenue loss from silent background task failures
    from api.billing import deduct_credits
    try:
        await deduct_credits(user_id, 1, "verify_claim")
    except HTTPException:
        # Re-raise HTTP exceptions as-is (insufficient credits, user not found, etc.)
        raise
    except Exception as e:
        # Log unexpected billing errors
        print(f"CRITICAL - Billing Error: {e}")
        raise HTTPException(status_code=500, detail="Billing failed. Please try again.")
    
    return VerifyResponse(
        result=prediction["result"],
        confidence=prediction["confidence"],
        claim=prediction["claim"],
        evidence=prediction["evidence"],
        sources=prediction.get("sources", [])
    )

@app.get("/reputation")
async def check_reputation(domain: str):
    if domain in bad_domains:
        return {"status": "BLOCKED", "domain": domain}
    return {"status": "OK", "domain": domain}

@app.get("/openai.json")
async def openai_spec():
    import json
    try:
        with open("trust-os-web/public/openapi.json", "r") as f:
            return json.load(f)
    except Exception as e:
        return {"error": f"Failed to load spec: {str(e)}"}
