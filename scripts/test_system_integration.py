import asyncio
import os
from unittest.mock import MagicMock, AsyncMock
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set.")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Import route functions
from src.api.routes.memory import capture_memory, MemoryCaptureRequest
from src.api.main import verify_claim, VerifyRequest

# Mocking
async def mock_get_user_from_key(api_key):
    # Return a dummy user
    return {
        "id": "test-user-id",
        "email": "test@example.com",
        "credits": 100
    }

async def test_backend_logic():
    print("=== Starting Backend Logic Test (Direct Calls) ===")
    
    # 1. Setup Mocks
    print("\n[1] Setting up Mocks...")
    
    # Mock Request and App State
    mock_request = MagicMock()
    mock_memory_engine = MagicMock()
    mock_inference_engine = MagicMock()
    
    # Setup Engine Mocks
    mock_memory_engine.embed_text.return_value = [0.1] * 384 # Match DB dimension (384)
    
    # Mock Inference Engine to return FALSE for specific claim
    def mock_verify(claim, evidence=None):
        if "flat" in claim.lower():
            return {"result": "FALSE", "confidence": 0.9, "evidence": "Scientific consensus"}
        return {"result": "TRUE", "confidence": 0.9, "evidence": "Verified"}
    
    mock_inference_engine.verify_claim.side_effect = mock_verify
    
    mock_request.app.state.memory_engine = mock_memory_engine
    mock_request.app.state.inference_engine = mock_inference_engine
    
    # Patch dependencies
    # We need to patch `get_user_from_key` and `check_credits`/`deduct_credits` 
    # OR we just let them run if we have a real DB connection.
    # Since we want to test the DB interaction (billing), we should try to use the REAL billing functions
    # but mock the AUTH.
    
    # We need to patch `src.api.routes.memory.get_user_from_key`
    import src.api.routes.memory
    src.api.routes.memory.get_user_from_key = mock_get_user_from_key
    
    # We also need a real user ID for billing to work.
    # Let's fetch a real user from DB.
    user_res = supabase.table("users").select("*").limit(1).execute()
    if not user_res.data:
        print("No users found. Please seed the database first.")
        return
    
    real_user = user_res.data[0]
    print(f"Using Real User ID: {real_user['id']}")
    
    # Update mock to return real user
    async def mock_get_real_user(api_key):
        return real_user
    src.api.routes.memory.get_user_from_key = mock_get_real_user
    
    # Reset credits
    supabase.table("users").update({"credits": 100}).eq("id", real_user['id']).execute()
    
    # 2. Test Memory Capture (Refund Logic)
    print("\n[2] Testing Memory Capture (Refund Logic)...")
    
    # We need to mock `httpx` in `capture_memory` to avoid real network calls and force content
    # OR we just let it fail to fetch and see exception? 
    # No, we want to test the CHUNK SAVING failure.
    
    # Let's mock `chunk_text` to return known chunks
    src.api.routes.memory.chunk_text = lambda text, **kwargs: ["chunk1", "chunk2", "chunk3"]
    
    # Mock `httpx` to return dummy content
    # Since `capture_memory` uses `httpx.AsyncClient`, it's hard to mock without `unittest.mock.patch` context.
    # Let's just use a real URL that is stable, like example.com
    
    # To test REFUND, we need `supabase.table().insert().execute()` to FAIL for some chunks.
    # We can wrap the supabase client?
    # Or we can patch `src.api.routes.memory.supabase`
    
    original_supabase = src.api.routes.memory.supabase
    
    # Create a wrapper that fails on specific chunks
    class MockSupabaseTable:
        def __init__(self, table_name, client):
            self.table_name = table_name
            self.client = client
            
        def insert(self, data):
            # Fail on 2nd chunk (index 1)
            if self.table_name == "memories":
                if "chunk2" in data.get("content", ""):
                    raise Exception("Simulated DB Error")
                # Return success mock
                return MagicMock(data=[{"id": "mock-memory-id"}])
            return original_supabase.table(self.table_name).insert(data)
            
        def select(self, columns):
            return self
            
        def eq(self, column, value):
            return self
            
        def single(self):
            return self
            
        def execute(self):
            # Return dummy credit data for users table
            if self.table_name == "users":
                return MagicMock(data={"credits": self.client.local_credits})
            return original_supabase.table(self.table_name).select("*").execute()
            
    class MockSupabaseClient:
        def __init__(self):
            self.local_credits = 100
            
        def table(self, name):
            return MockSupabaseTable(name, self)
            
        def rpc(self, name, params):
            if name == "deduct_credits_atomic":
                amount = params.get("p_amount", 0)
                self.local_credits -= amount
                print(f"Mock RPC: Deducted {amount}. New Balance: {self.local_credits}")
                return MagicMock(data=self.local_credits)
            elif name == "refund_credits_atomic":
                amount = params.get("p_amount", 0)
                self.local_credits += amount
                print(f"Mock RPC: Refunded {amount}. New Balance: {self.local_credits}")
                return MagicMock(data=self.local_credits)
            elif name == "capture_memory_atomic":
                cost = params.get("p_cost", 0)
                memories = params.get("p_memories", [])
                
                # Simulate atomic failure if specific content is present
                for m in memories:
                    if "chunk2" in m.get("content", ""):
                        # In atomic mode, this raises exception and rolls back everything
                        raise Exception("Simulated Atomic DB Error")
                
                self.local_credits -= cost
                print(f"Mock RPC: Atomic Capture (Cost {cost}). New Balance: {self.local_credits}")
                
                # Return success structure
                return MagicMock(data={
                    "status": "success",
                    "new_balance": self.local_credits,
                    "inserted_ids": [1, 2, 3]
                })
            return original_supabase.rpc(name, params)

    # Apply Mock to memory route
    mock_client = MockSupabaseClient()
    src.api.routes.memory.supabase = mock_client
    
    # Also mock billing supabase
    import src.api.billing
    src.api.billing.supabase = mock_client
    
    # Mock httpx in capture_memory
    # We need to patch httpx.AsyncClient
    mock_response = MagicMock()
    mock_response.text = "<html><body><p>chunk1 chunk2 chunk3</p></body></html>"
    mock_response.raise_for_status = MagicMock()
    
    mock_client_instance = AsyncMock()
    mock_client_instance.get.return_value = mock_response
    mock_client_instance.__aenter__.return_value = mock_client_instance
    mock_client_instance.__aexit__.return_value = None
    
    # Patch httpx.AsyncClient
    import httpx
    original_client = httpx.AsyncClient
    httpx.AsyncClient = MagicMock(return_value=mock_client_instance)
    
    req = MemoryCaptureRequest(url="https://example.com", verify=False)
    
    try:
        # Check credits before
        credits_before = mock_client.local_credits
        print(f"Credits Before: {credits_before}")
        
        # Run Capture
        # Note: capture_memory is async
        result = await capture_memory(mock_request, req, x_api_key="dummy")
        
        print("Result:", result)
        
        # Check credits after
        credits_after = mock_client.local_credits
        print(f"Credits After: {credits_after}")
        
        # Expected: 3 chunks total. 1 fails. 2 succeed.
        # Initial deduction: 3 * 2 = 6
        # Refund: 1 * 2 = 2
        # Net cost: 4
        
        # Expected: 3 chunks * 2 credits = 6 credits
        # Atomic capture succeeds (we removed the failure simulation for this run or need to handle it)
        # Wait, the mock above simulates failure for "chunk2".
        # So this call SHOULD fail and deduct 0 credits.
        
        # Let's adjust the test to expect FAILURE for this specific input
        print("Result: (Expected Exception)")
        
    except Exception as e:
        print(f"Caught Expected Exception: {e}")
        
        # Check credits after failure
        credits_after = mock_client.local_credits
        print(f"Credits After: {credits_after}")
        
        if credits_before == credits_after:
            print(f"[OK] Atomic Rollback Passed! (Cost: 0)")
        else:
             print(f"[FAIL] Atomic Rollback Failed! (Credits changed)")

    # Test Success Case
    print("\n[3] Testing Atomic Capture (Success Case)...")
    src.api.routes.memory.chunk_text = lambda text, **kwargs: ["chunk1", "chunk3"] # No chunk2
    
    try:
        credits_before = mock_client.local_credits
        result = await capture_memory(mock_request, req, x_api_key="dummy")
        credits_after = mock_client.local_credits
        
        expected_cost = 4 # 2 chunks * 2
        actual_cost = credits_before - credits_after
        
        if actual_cost == expected_cost:
            print(f"[OK] Atomic Capture Passed! (Cost: {actual_cost})")
        else:
            print(f"[FAIL] Atomic Capture Failed! (Expected {expected_cost}, Got {actual_cost})")
            
    except Exception as e:
        print(f"[X] Success Test Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_backend_logic())
