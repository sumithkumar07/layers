import asyncio
import sys
import os

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from utils.supabase import supabase
import httpx

API_URL = "http://127.0.0.1:8000"
TEST_KEY = "sk_test_verification_key"
TEST_USER_ID = "test-user-verification"

async def setup_user():
    print(f"Setting up test user with key: {TEST_KEY}")
    # Check if user exists
    res = supabase.table("users").select("*").eq("id", TEST_USER_ID).execute()
    if not res.data:
        supabase.table("users").insert({"id": TEST_USER_ID, "api_key": TEST_KEY}).execute()
    else:
        # Update key just in case
        supabase.table("users").update({"api_key": TEST_KEY}).eq("id", TEST_USER_ID).execute()

async def run_tests():
    await setup_user()
    
    headers = {"X-API-Key": TEST_KEY, "Content-Type": "application/json"}
    
    # 1. The Lie Test
    print("\n--- [10.1] The 'Lie' Test ---")
    claim = "The moon is made of cheese."
    print(f"Sending: '{claim}'")
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{API_URL}/memory/verified", json={"claim": claim}, headers=headers)
        data = res.json()
        print(f"Status: {res.status_code}")
        print(f"Response: {data}")
        
        if data.get("status") == "rejected":
            print("✅ PASS: Lie was rejected.")
        else:
            print("❌ FAIL: Lie was NOT rejected.")

    # 2. The Fact Test
    print("\n--- [10.2] The 'Fact' Test ---")
    claim = "Project X is due on Friday."
    print(f"Sending: '{claim}'")
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{API_URL}/memory/verified", json={"claim": claim}, headers=headers)
        data = res.json()
        print(f"Status: {res.status_code}")
        print(f"Response: {data}")
        
        if data.get("status") == "success":
            print("✅ PASS: Fact was saved.")
        else:
            print("❌ FAIL: Fact was rejected.")

    # 3. The Recall Test
    print("\n--- [10.3] The Recall Test ---")
    query = "When is Project X due?"
    print(f"Querying: '{query}'")
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{API_URL}/memory/search", json={"query": query}, headers=headers)
        data = res.json()
        print(f"Response: {data}")
        
        results = data.get("results", [])
        found = any("Friday" in r["content"] for r in results)
        
        if found:
            print("✅ PASS: Fact was recalled.")
        else:
            print("❌ FAIL: Fact was NOT recalled.")

    # 4. Supermemory Mode Test (Layer 2 Only)
    print("\n--- [10.4] Supermemory Mode (Raw Add) ---")
    # We try to save a LIE. In Supermemory mode, it should be SAVED because there is no filter.
    claim = "The earth is flat."
    print(f"Sending Lie to Raw Memory: '{claim}'")
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{API_URL}/memory/add", json={"content": claim}, headers=headers)
        data = res.json()
        print(f"Status: {res.status_code}")
        print(f"Response: {data}")
        
        if data.get("status") == "success":
            print("✅ PASS: Lie was SAVED (as expected for Raw Mode).")
        else:
            print("❌ FAIL: Lie was rejected (Unexpected for Raw Mode).")

    # 5. Trust OS Mode Test (Layer 1 Only)
    print("\n--- [10.5] Trust OS Mode (Verify Only) ---")
    # We verify the same lie. It should be FALSE.
    print(f"Verifying Lie: '{claim}'")
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{API_URL}/verify", json={"claim": claim}, headers=headers)
        data = res.json()
        print(f"Status: {res.status_code}")
        print(f"Response: {data}")
        
        if data.get("result") == "FALSE":
            print("✅ PASS: Trust OS detected the lie.")
        else:
            print("❌ FAIL: Trust OS failed to detect the lie.")

if __name__ == "__main__":
    asyncio.run(run_tests())
