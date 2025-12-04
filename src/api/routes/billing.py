from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
import razorpay
import os
from src.api.auth import get_current_user, supabase
from src.utils.logger import logger

router = APIRouter()

# Initialize Razorpay Client
# using environment variables or placeholders
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_PLACEHOLDER")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "secret_PLACEHOLDER")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

class CreateOrderRequest(BaseModel):
    amount: int  # Amount in INR (e.g., 500 for ₹500)
    credits: int # Number of credits to buy

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@router.post("/create-order")
async def create_order(req: CreateOrderRequest, user=Depends(get_current_user)):
    try:
        amount_in_paise = req.amount * 100  # Convert to paise
        
        # MOCK MODE: If keys are placeholders, return a fake order so UI can test flow
        if "YOUR_KEY_ID" in RAZORPAY_KEY_ID or "PLACEHOLDER" in RAZORPAY_KEY_ID:
            logger.warning("Using Mock Razorpay Order (Invalid Keys)")
            return {
                "id": f"order_mock_{os.urandom(4).hex()}",
                "amount": amount_in_paise,
                "currency": "USD",
                "key_id": RAZORPAY_KEY_ID
            }

        data = {
            "amount": amount_in_paise,
            "currency": "USD",
            "receipt": f"receipt_{user['id'][:8]}",
            "notes": {
                "user_id": user['id'],
                "credits": str(req.credits)
            }
        }
        
        order = client.order.create(data=data)
        
        # Log transaction in DB as pending
        supabase.table("transactions").insert({
            "user_id": user['id'],
            "amount": amount_in_paise,
            "credits_amount": req.credits,
            "razorpay_order_id": order['id'],
            "status": "pending"
        }).execute()
        
        return {
            "id": order['id'],
            "amount": order['amount'],
            "currency": order['currency'],
            "key_id": RAZORPAY_KEY_ID
        }
        
    except Exception as e:
        logger.error(f"Error creating Razorpay order: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-payment")
async def verify_payment(req: VerifyPaymentRequest, user=Depends(get_current_user)):
    try:
        # Verify Signature
        params_dict = {
            'razorpay_order_id': req.razorpay_order_id,
            'razorpay_payment_id': req.razorpay_payment_id,
            'razorpay_signature': req.razorpay_signature
        }
        
        # This will raise an error if verification fails
        client.utility.verify_payment_signature(params_dict)
        
        # 1. Update Transaction Status
        supabase.table("transactions").update({
            "status": "success",
            "razorpay_payment_id": req.razorpay_payment_id,
            "updated_at": "now()"
        }).eq("razorpay_order_id", req.razorpay_order_id).execute()
        
        # 2. Add Credits to User (using our atomic refund function as a credit adder)
        # We need to fetch the credits amount from the transaction first to be safe, 
        # or trust the frontend? Better to fetch from DB.
        
        tx_res = supabase.table("transactions").select("credits_amount").eq("razorpay_order_id", req.razorpay_order_id).single().execute()
        if not tx_res.data:
            raise HTTPException(status_code=404, detail="Transaction not found")
            
        credits_to_add = tx_res.data['credits_amount']
        
        # Use the atomic function we defined in schema.sql
        # refund_credits_atomic adds credits
        supabase.rpc("refund_credits_atomic", {
            "p_user_id": user['id'],
            "p_amount": credits_to_add,
            "p_action": f"purchase_{req.razorpay_payment_id}"
        }).execute()
        
        return {"status": "success", "message": "Payment verified and credits added"}
        
    except razorpay.errors.SignatureVerificationError:
        logger.error("Razorpay signature verification failed")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        logger.error(f"Error verifying payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))
