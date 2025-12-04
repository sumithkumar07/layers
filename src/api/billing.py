from src.api.auth import supabase
from fastapi import HTTPException
import asyncio
from src.utils.logger import logger

async def check_credits(user_id: str, amount: int) -> bool:
    """
    DEPRECATED: This function creates a TOCTOU (Time-of-Check to Time-of-Use) race condition.
    Use deduct_credits() directly instead, which performs atomic validation and deduction.
    
    This function is kept only for potential UI/display purposes where you need to 
    check credits WITHOUT deducting them. Never use this as a gate before deduct_credits().
    """
    def _check():
        try:
            response = supabase.table("users").select("credits").eq("id", user_id).single().execute()
            if not response.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            current_credits = response.data.get("credits", 0)
            if current_credits < amount:
                raise HTTPException(status_code=402, detail=f"Insufficient credits. Required: {amount}, Available: {current_credits}")
            
            return True
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error checking credits for user {user_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Failed to check credits")
    
    return await asyncio.to_thread(_check)

async def deduct_credits(user_id: str, amount: int, action: str):
    """
    Deducts credits atomically using the database RPC function.
    Runs the synchronous supabase call in a thread pool to avoid blocking the event loop.
    """
    def _deduct():
        try:
            response = supabase.rpc("deduct_credits_atomic", {
                "p_user_id": user_id,
                "p_amount": amount,
                "p_action": action
            }).execute()
            
            return response.data
        except HTTPException:
            # Re-raise HTTP exceptions as-is
            raise
        except Exception as e:
            # Map DB error to HTTP exception with better error detection
            error_msg = str(e).lower()
            
            # Check for specific error patterns
            if "insufficient credits" in error_msg or "not enough credits" in error_msg:
                logger.warning(f"Insufficient credits for user {user_id}, action: {action}, amount: {amount}")
                raise HTTPException(
                    status_code=402, 
                    detail=f"Insufficient credits for {action}. Cost: {amount}"
                )
            # Check for user-not-found scenarios
            # Note: PostgREST error codes (pgrst*) are not reliable for FK violations
            # We check for specific error patterns instead
            elif (
                "user not found" in error_msg 
                or "no user" in error_msg 
                or "users_id_fkey" in error_msg  # Specific FK constraint on user_id
                or ("foreign key" in error_msg and "users" in error_msg and '"id"' in error_msg)  # More specific: quoted column name
            ):                logger.error(f"User not found for credit deduction: {user_id}")
                raise HTTPException(status_code=404, detail="User not found for billing")

            else:
                # Log unexpected errors with full context
                logger.error(
                    f"Credit deduction failed - user: {user_id}, action: {action}, amount: {amount}, error: {e}",
                    exc_info=True
                )
                raise HTTPException(status_code=500, detail="Credit deduction failed")
    
    return await asyncio.to_thread(_deduct)

async def refund_credits(user_id: str, amount: int, action: str):

    """
    Refunds credits atomically using the dedicated refund RPC function.
    """
    def _refund():
        try:
            response = supabase.rpc("refund_credits_atomic", {
                "p_user_id": user_id,
                "p_amount": amount,
                "p_action": action
            }).execute()
            
            return response.data
        except HTTPException:
            raise
        except Exception as e:
            logger.error(
                f"Credit refund failed - user: {user_id}, action: {action}, amount: {amount}, error: {e}",
                exc_info=True
            )
            raise HTTPException(status_code=500, detail="Refund failed")

    return await asyncio.to_thread(_refund)
