from src.api.auth import supabase
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_rpc():
    print("Verifying Database Setup...")
    
    # Dummy vector (384 dimensions)
    dummy_vector = [0.1] * 384
    
    rpc_params = {
        "query_embedding": dummy_vector,
        "query_text": "test",
        "match_threshold": 0.5,
        "match_count": 1
    }
    
    try:
        # Try to call the function
        response = supabase.rpc("match_memories_hybrid", rpc_params).execute()
        print("[SUCCESS] The 'match_memories_hybrid' function exists.")
        print(f"Response: {response.data}")
    except Exception as e:
        print("[ERROR] The database setup might be incomplete.")
        print(f"Details: {e}")

if __name__ == "__main__":
    test_rpc()
