import httpx
import os

API_URL = "http://127.0.0.1:8000"
API_KEY = "test-key-123"  # In prod, load from env or config

async def verify_claim(claim: str, evidence: str) -> str:
    """
    Verifies a claim against a piece of evidence using the Layers AI model.
    Returns TRUE if the evidence supports the claim, FALSE if it contradicts, 
    or UNCERTAIN if the confidence is low.
    """
    url = f"{API_URL}/verify"
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "claim": claim,
        "evidence": evidence
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            return f"Result: {data['result']} (Confidence: {data['confidence']:.2f})"
        except httpx.HTTPStatusError as e:
            return f"Error: API returned {e.response.status_code} - {e.response.text}"
        except Exception as e:
            return f"Error connecting to Verification API: {str(e)}"

async def check_reputation(domain: str) -> str:
    """
    Checks if a domain is in the known bad domains blocklist.
    Returns 'BLOCKED' or 'OK'.
    """
    url = f"{API_URL}/reputation"
    params = {"domain": domain}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            return f"Status: {data['status']} for {data.get('domain', domain)}"
        except Exception as e:
            return f"Error checking reputation: {str(e)}"

async def save_memory(text: str) -> str:
    """
    Saves a verified memory to the user's second brain.
    This tool calls the Trust OS first to verify the information.
    If the information is FALSE, it will be rejected.
    """
    url = f"{API_URL}/memory/verified"
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }
    # We treat the input text as the claim to be verified and stored
    payload = {
        "claim": text
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers)
            data = response.json()
            
            if data.get("status") == "rejected":
                return f"REJECTED: Trust OS found this to be FALSE. Reason: {data.get('reason')}"
            
            return f"SAVED: Memory ID {data.get('id')} (Confidence: {data.get('verification', {}).get('confidence', 0):.2f})"
        except Exception as e:
            return f"Error saving memory: {str(e)}"

async def recall_memory(query: str) -> str:
    """
    Searches the user's second brain for relevant memories.
    Use this to answer questions based on previously stored information.
    """
    url = f"{API_URL}/memory/search"
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "query": query
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            results = data.get("results", [])
            if not results:
                return "No relevant memories found."
            
            # Format results for Claude
            formatted = "\n".join([f"- {r['content']} (Score: {r['score']:.2f})" for r in results])
            return f"Found Memories:\n{formatted}"
        except Exception as e:
            return f"Error recalling memory: {str(e)}"

async def verify_image_forensics(file_path: str) -> str:
    """
    Analyzes an image for fraud, manipulation, and AI generation.
    Input: Absolute path to the image file.
    Output: Forensic report including ELA, Noise Analysis, and Screen Detection.
    """
    url = f"{API_URL}/images/verify"
    headers = {
        "X-API-Key": API_KEY
    }
    
    if not os.path.exists(file_path):
        return f"Error: File not found at {file_path}"
        
    async with httpx.AsyncClient() as client:
        try:
            with open(file_path, "rb") as f:
                files = {"file": (os.path.basename(file_path), f, "image/jpeg")}
                response = await client.post(url, files=files, headers=headers)
                
            response.raise_for_status()
            data = response.json()
            
            status = data.get("status", "UNKNOWN")
            score = data.get("score", 0)
            flags = data.get("flags", [])
            
            report = f"Forensic Analysis Result: {status}\nAuthenticity Score: {score}/100\n"
            if flags:
                report += "Flags Detected:\n" + "\n".join([f"- {flag}" for flag in flags])
            else:
                report += "No manipulation flags detected."
                
            return report
            
        except httpx.HTTPStatusError as e:
            return f"Error: API returned {e.response.status_code} - {e.response.text}"
        except Exception as e:
            return f"Error verifying image: {str(e)}"

async def check_liveness(file_path: str, expected_gesture: int) -> str:
    """
    Performs a liveness check by verifying if the user is performing the expected gesture (finger count).
    Input: 
      - file_path: Absolute path to the image file.
      - expected_gesture: Number of fingers expected (integer).
    Output: Pass/Fail status.
    """
    url = f"{API_URL}/images/liveness"
    headers = {
        "X-API-Key": API_KEY
    }
    
    if not os.path.exists(file_path):
        return f"Error: File not found at {file_path}"
        
    async with httpx.AsyncClient() as client:
        try:
            with open(file_path, "rb") as f:
                # Send 'challenge' as form field and 'file' as file
                data = {"challenge": str(expected_gesture)}
                files = {"file": (os.path.basename(file_path), f, "image/jpeg")}
                response = await client.post(url, data=data, files=files, headers=headers)
                
            response.raise_for_status()
            data = response.json()
            
            status = data.get("status", "UNKNOWN")
            detected = data.get("detected_fingers", "Unknown")
            
            return f"Liveness Check: {status}\nExpected: {expected_gesture} fingers\nDetected: {detected} fingers"
            
        except httpx.HTTPStatusError as e:
            return f"Error: API returned {e.response.status_code} - {e.response.text}"
        except Exception as e:
            return f"Error checking liveness: {str(e)}"
