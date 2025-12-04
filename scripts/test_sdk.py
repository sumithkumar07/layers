import sys
import os
import json

# Add packages to path so we can import layers_sdk
sys.path.append(os.path.join(os.getcwd(), 'packages'))

from layers_sdk.client import LayersClient

JWT = "eyJhbGciOiJIUzI1NiIsImtpZCI6IlVaNWxuVDI4a1dYZjNZK2wiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NhaW13dmV0Z3V5Z2FrbmFnem1uLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiZTgyYzY3MS0xY2UwLTQ4YWEtYTFkOS05NGUyNjAyYmUwZjMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY0NzY5OTU1LCJpYXQiOjE3NjQ3NjYzNTUsImVtYWlsIjoiYWdlbnRfdGVzdF92MUBleGFtcGxlLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJhZ2VudF90ZXN0X3YxQGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiYmU4MmM2NzEtMWNlMC00OGFhLWExZDktOTRlMjYwMmJlMGYzIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjQ3NjYzNTV9XSwic2Vzc2lvbl9pZCI6IjBjN2YxZWNkLTE5OTAtNGVlZS1iNzc0LTRjYzNjYjM0MzBiYiIsImlzX2Fub255bW91cyI6ZmFsc2V9.nekgToXLe02SWiTsc2QxSnWmmEl03eUh-VDRotReg-o"

print("Initializing LayersClient with JWT...")
client = LayersClient(token=JWT)

print("Verifying claim: 'The moon is made of cheese'...")
try:
    result = client.verify_text("The moon is made of cheese")
    print("Result:")
    print(json.dumps(result, indent=2))
    
    if result.get("result") == "FALSE":
        print("[PASS] SDK Verification PASSED")
    else:
        print("[FAIL] SDK Verification FAILED (Unexpected result)")
        
except Exception as e:
    print(f"[FAIL] SDK Verification Error: {e}")
