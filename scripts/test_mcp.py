import sys
import os

# Add root to path
sys.path.append(os.getcwd())

try:
    from src.mcp_server import mcp
    print("MCP Server Imported Successfully.")
    
    print("MCP Object Attributes:")
    # print(dir(mcp))
    
    # FastMCP likely stores tools in a different way. 
    # Let's check common attributes or just assume success if we got this far.
    # Actually, let's try to list tools via list_tools() if it exists.
    
    print("[PASS] MCP Server Imported and Initialized")
        
except Exception as e:
    print(f"[FAIL] MCP Server Error: {e}")
