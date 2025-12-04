import requests
import json

url = "http://127.0.0.1:8000/verify"
# Use a valid API key from your database or the one generated in dashboard
# For this test, we might get 403 if we don't have a key, but we can check if the server accepts the request structure.
# Actually, the server requires a key. I will use a dummy key and expect 403, or I should use the key from the user's session if I knew it.
# Better approach: I'll run a unit test on the SearchEngine class directly to verify it works, 
# as I can't easily get a valid API key without DB access in this script context (unless I query DB).

from src.search_engine import SearchEngine

def test_search():
    print("Testing Search Engine...")
    engine = SearchEngine()
    claim = "The capital of France is Paris"
    evidence = engine.get_evidence(claim)
    print(f"Claim: {claim}")
    print(f"Evidence Found: {len(evidence)} chars")
    print(f"Snippet: {evidence[:100]}...")
    
    if len(evidence) > 50:
        print("✅ Search Engine Works")
    else:
        print("❌ Search Engine Failed")

if __name__ == "__main__":
    test_search()
