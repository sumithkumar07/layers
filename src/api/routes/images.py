from fastapi import APIRouter, UploadFile, File, HTTPException, Header, Request, Depends
from pydantic import BaseModel
from typing import Optional, List
import hashlib
import logging
from src.api.auth import get_current_user, supabase
from src.api.billing import check_credits, deduct_credits
from src.provenance_engine import ProvenanceEngine

router = APIRouter(prefix="/images", tags=["VeriSnap"])
provenance_engine = ProvenanceEngine()

class ImageSignRequest(BaseModel):
    hash: str
    metadata: dict

@router.post("/verify")
async def verify_image(request: Request, file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    """
    Layer 3: VeriSnap Analysis.
    Upload an image to detect manipulation.
    Runs Visual + Replay + Geo engines in parallel.
    Cost: 10 Credits.
    """
    # Cost: 10 Credits (Premium Forensic Analysis)
    try:
        contents = await file.read()
        
        # Run Forensics (Visual + Geo + Metadata)
        report = provenance_engine.analyze_image(contents)
        
        # Check Replay (Anti-Replay Engine)
        image_hash = hashlib.sha256(contents).hexdigest()
        existing = supabase.table("image_provenance").select("*").eq("image_hash", image_hash).execute()        
        if existing.data:
            report["score"] = 0
            report["flags"].append("REPLAY DETECTED: Image previously registered.")
            report["details"]["replay"] = {"detected": True, "original_id": existing.data[0]['id']}
        else:
            report["details"]["replay"] = {"detected": False}

        # Deduct Credits
        await deduct_credits(user_id, 10, "image_verify")
        
        # Determine Status
        status = "REAL" if report["score"] > 80 else "FAKE"
        if report["score"] > 50 and report["score"] <= 80:
            status = "SUSPICIOUS"

        # Log to Supabase (for History/Dashboard)
        try:
            supabase.table("logs").insert({
                "user_id": user_id,
                "claim": "Image Analysis",
                "evidence": f"Score: {report['score']}, Flags: {len(report['flags'])}",
                "result": status,
                "confidence": report["score"] / 100.0
            }).execute()
        except Exception as e:
            logging.error(f"Failed to log verification result: {e}")
        
        return {
            "status": status,
            "score": report["score"],
            "flags": report["flags"],
            "details": report["details"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/liveness")
async def check_liveness(
    request: Request, 
    challenge: int = File(...), 
    file: UploadFile = File(...), 
    user_id: str = Depends(get_current_user)
):
    """
    Challenge-Response Liveness Check.
    User must upload a photo showing 'challenge' number of fingers.
    Cost: 5 Credits.
    """
    # Cost: 5 Credits (Liveness Detection)
    try:
        contents = await file.read()
        
        # Run Liveness Engine
        result = provenance_engine.analyze_liveness(contents, int(challenge))
        
        await deduct_credits(user_id, 5, "liveness_check")
        
        status = "PASSED" if result["passed"] else "FAILED"
        
        return {
            "status": status,
            "challenge": challenge,
            "detected_fingers": result["finger_count"],
            "details": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sign")
async def sign_image(request: Request, file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    """
    Registers a 'REAL' image to prevent replay attacks.
    """
    # Cost: 1 Credit (Registration)
    try:
        contents = await file.read()
        
        # Generate Hash (SHA256)
        image_hash = hashlib.sha256(contents).hexdigest()
        
        # Check if already exists
        existing = supabase.table("image_provenance").select("*").eq("image_hash", image_hash).execute()
        if existing.data:
            return {"status": "exists", "message": "Image already registered.", "id": existing.data[0]['id']}
            
        # Extract GPS for storage
        from PIL import Image
        import io
        pil_image = Image.open(io.BytesIO(contents))
        geo_data = provenance_engine.analyze_geo(pil_image)
        
        # Store
        data = {
            "user_id": user_id,
            "image_hash": image_hash,
            "filename": file.filename,
            "gps_data": geo_data if geo_data["has_gps"] else None
        }
        
        response = supabase.table("image_provenance").insert(data).execute()
        
        # Deduct Credits
        await deduct_credits(user_id, 1, "image_sign")
        
        return {"status": "success", "hash": image_hash, "id": response.data[0]['id']}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
