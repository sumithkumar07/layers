from mcp.server.fastmcp import FastMCP
from src.mcp_tools import (
    verify_claim,
    check_reputation,
    save_memory,
    recall_memory,
    verify_image_forensics,
    check_liveness
)

# Initialize FastMCP Server
mcp = FastMCP("Layers Verification")

# Register Tools
mcp.tool()(verify_claim)
mcp.tool()(check_reputation)
mcp.tool()(save_memory)
mcp.tool()(recall_memory)
mcp.tool()(verify_image_forensics)
mcp.tool()(check_liveness)

if __name__ == "__main__":
    # Run as stdio server
    mcp.run()
