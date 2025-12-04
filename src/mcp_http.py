import uvicorn
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
# FastMCP doesn't directly support SSE via .run() usually, but we can use the underlying server if needed.
# However, for simplicity and since we want to expose this via HTTP, we will use the standard MCP SSE transport pattern
# if FastMCP doesn't support it.
# BUT, looking at the library, FastMCP might not be the best choice for SSE if it's opinionated about stdio.
# Let's use the low-level Server + Starlette pattern which is standard for SSE.

from mcp.server import Server
from mcp.server.sse import SseServerTransport
from starlette.applications import Starlette
from starlette.routing import Route
from starlette.requests import Request
from starlette.responses import Response

# Create Low-Level Server
server = Server("Layers Verification")

# Register Tools
@server.list_tools()
async def handle_list_tools() -> list:
    from mcp.types import Tool, TextContent, ImageContent, EmbeddedResource
    # We need to manually define the tool schemas if we use low-level Server
    # This is verbose. 
    # ALTERNATIVE: FastMCP might have a way to export tools.
    # Let's stick to FastMCP if we can.
    pass

# WAIT. FastMCP is much easier. Let's see if we can use it.
# If I use FastMCP, I can't easily attach SSE.
# Let's try to use the FastMCP instance and see if we can mount it?
# No, FastMCP is a wrapper around the Server class.
# Let's use the low-level Server but use the functions we have.
# We need to define the schemas.

# Actually, let's use a simpler approach.
# We will define the tools using the Server decorator.

import mcp.types as types

# Re-register tools with the low-level server
@server.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="verify_claim",
            description="Verifies a claim against a piece of evidence using the Layers AI model.",
            inputSchema={
                "type": "object",
                "properties": {
                    "claim": {"type": "string"},
                    "evidence": {"type": "string"}
                },
                "required": ["claim", "evidence"]
            }
        ),
        types.Tool(
            name="check_reputation",
            description="Checks if a domain is in the known bad domains blocklist.",
            inputSchema={
                "type": "object",
                "properties": {
                    "domain": {"type": "string"}
                },
                "required": ["domain"]
            }
        ),
        types.Tool(
            name="save_memory",
            description="Saves a verified memory to the user's second brain.",
            inputSchema={
                "type": "object",
                "properties": {
                    "text": {"type": "string"}
                },
                "required": ["text"]
            }
        ),
        types.Tool(
            name="recall_memory",
            description="Searches the user's second brain for relevant memories.",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string"}
                },
                "required": ["query"]
            }
        ),
        types.Tool(
            name="verify_image_forensics",
            description="Analyzes an image for fraud, manipulation, and AI generation.",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {"type": "string"}
                },
                "required": ["file_path"]
            }
        ),
        types.Tool(
            name="check_liveness",
            description="Performs a liveness check by verifying if the user is performing the expected gesture.",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {"type": "string"},
                    "expected_gesture": {"type": "integer"}
                },
                "required": ["file_path", "expected_gesture"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
    if name == "verify_claim":
        result = await verify_claim(arguments["claim"], arguments["evidence"])
        return [types.TextContent(type="text", text=result)]
    
    elif name == "check_reputation":
        result = await check_reputation(arguments["domain"])
        return [types.TextContent(type="text", text=result)]
        
    elif name == "save_memory":
        result = await save_memory(arguments["text"])
        return [types.TextContent(type="text", text=result)]
        
    elif name == "recall_memory":
        result = await recall_memory(arguments["query"])
        return [types.TextContent(type="text", text=result)]
        
    elif name == "verify_image_forensics":
        result = await verify_image_forensics(arguments["file_path"])
        return [types.TextContent(type="text", text=result)]
        
    elif name == "check_liveness":
        result = await check_liveness(arguments["file_path"], arguments["expected_gesture"])
        return [types.TextContent(type="text", text=result)]
        
    else:
        raise ValueError(f"Unknown tool: {name}")

# SSE Transport Setup
sse = SseServerTransport("/messages")

async def handle_sse(request: Request):
    async with sse.connect_sse(request.scope, request.receive, request._send) as streams:
        await server.run(streams[0], streams[1], server.create_initialization_options())

async def handle_messages(request: Request):
    await sse.handle_post_message(request.scope, request.receive, request._send)

app = Starlette(routes=[
    Route("/sse", endpoint=handle_sse),
    Route("/messages", endpoint=handle_messages, methods=["POST"])
])

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
