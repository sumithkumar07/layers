import requests
import os
from typing import Optional, List, Dict, Any

class LayersClient:
    """
    Official Python Client for Layers API.
    """
    def __init__(self, api_key: Optional[str] = None, token: Optional[str] = None, base_url: str = "http://localhost:8000", timeout: int = 30):
        self.api_key = api_key
        self.token = token
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        
        self.headers = {
            "Content-Type": "application/json"
        }
        
        if self.token:
            self.headers["Authorization"] = f"Bearer {self.token}"
        elif self.api_key:
            self.headers["X-API-Key"] = self.api_key
        else:
            # Allow init without credentials for public endpoints if any, or raise warning
            pass

    def verify_text(self, claim: str, evidence: Optional[str] = None) -> Dict[str, Any]:
        """
        Layer 1: Trust OS - Verify a text claim.
        """
        payload = {"claim": claim}
        if evidence:
            payload["evidence"] = evidence
            
        try:
            response = requests.post(
                f"{self.base_url}/verify",
                json=payload,
                headers=self.headers,
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": str(e), "status": "failed"}

    def add_memory(self, content: str, tags: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Layer 2: Memory (Synapse) - Store information.
        """
        if tags is None:
            tags = []
        try:
            response = requests.post(
                f"{self.base_url}/memory/add",
                json={"content": content, "tags": tags},
                headers=self.headers,
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": str(e), "status": "failed"}

    def search_memory(self, query: str) -> Dict[str, Any]:
        """
        Layer 2: Memory (Synapse) - Search stored information.
        """
        try:
            response = requests.post(
                f"{self.base_url}/memory/search",
                json={"query": query},
                headers=self.headers,
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": str(e), "status": "failed"}

    def check_image(self, image_path: str) -> Dict[str, Any]:
        """
        Layer 3: Vision (VeriSnap) - Analyze an image for manipulation.
        """
        if not os.path.exists(image_path):
            return {"error": "File not found", "status": "failed"}
            
        try:
            with open(image_path, "rb") as f:
                files = {"file": f}
                # Note: Don't set Content-Type header for files, requests handles it
                headers = {"X-API-Key": self.api_key}
                response = requests.post(
                    f"{self.base_url}/images/verify",
                    files=files,
                    headers=headers,
                    timeout=self.timeout
                )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": str(e), "status": "failed"}
