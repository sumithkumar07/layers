import requests
import json

JWT = "eyJhbGciOiJIUzI1NiIsImtpZCI6IlVaNWxuVDI4a1dYZjNZK2wiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NhaW13dmV0Z3V5Z2FrbmFnem1uLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiZTgyYzY3MS0xY2UwLTQ4YWEtYTFkOS05NGUyNjAyYmUwZjMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY0NzY5OTU1LCJpYXQiOjE3NjQ3NjYzNTUsImVtYWlsIjoiYWdlbnRfdGVzdF92MUBleGFtcGxlLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJhZ2VudF90ZXN0X3YxQGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiYmU4MmM2NzEtMWNlMC00OGFhLWExZDktOTRlMjYwMmJlMGYzIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjQ3NjYzNTV9XSwic2Vzc2lvbl9pZCI6IjBjN2YxZWNkLTE5OTAtNGVlZS1iNzc0LTRjYzNjYjM0MzBiYiIsImlzX2Fub255bW91cyI6ZmFsc2V9.nekgToXLe02SWiTsc2QxSnWmmEl03eUh-VDRotReg-o"
URL = "http://localhost:8000/verify"

payload = {
    "claim": "The earth is flat",
    "context": "Scientific consensus"
}

headers = {
    "Authorization": f"Bearer {JWT}",
    "Content-Type": "application/json"
}

print(f"Testing API at {URL} with JWT...")
try:
    response = requests.post(URL, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response Text:")
    print(response.text)
    try:
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
    except:
        print("Could not parse JSON.")
    
    if response.status_code == 200:
        print("[PASS] API Verification PASSED")
    else:
        print("[FAIL] API Verification FAILED")
except Exception as e:
    print(f"[ERROR] Error: {e}")
