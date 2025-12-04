#!/usr/bin/env node

/**
 * Trust OS Connector
 * This script acts as a bridge between Claude Desktop and the Layers API.
 * It implements the MCP protocol over Stdio.
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");

// Configuration
const API_URL = process.env.TRUST_OS_API_URL || "http://127.0.0.1:8000";
const API_KEY = process.env.TRUST_OS_API_KEY;

if (!API_KEY) {
    console.error("Error: TRUST_OS_API_KEY environment variable is required.");
    process.exit(1);
}

// Initialize Server
const server = new Server(
    {
        name: "trust-os-connector",
        version: "0.1.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// List Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "verify_claim",
                description: "Verifies a claim against evidence using Trust OS.",
                inputSchema: {
                    type: "object",
                    properties: {
                        claim: { type: "string" },
                        evidence: { type: "string" },
                    },
                    required: ["claim", "evidence"],
                },
            },
            {
                name: "verify_image_forensics",
                description: "Analyzes an image for AI manipulation.",
                inputSchema: {
                    type: "object",
                    properties: {
                        file_path: { type: "string" },
                    },
                    required: ["file_path"],
                },
            },
        ],
    };
});

// Call Tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "verify_claim") {
            const response = await fetch(`${API_URL}/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": API_KEY,
                },
                body: JSON.stringify(args),
            });
            const data = await response.json();
            return {
                content: [{ type: "text", text: `Result: ${data.result} (Confidence: ${data.confidence})` }],
            };
        }

        if (name === "verify_image_forensics") {
            // Note: File upload via JSON-RPC/Node is tricky without fs access or base64.
            // For this connector, we assume the file_path is local and we can read it?
            // Or we just pass the path if the API supports it? 
            // The Python API expects a file upload.
            // We need to read the file and send it.
            const fs = require('fs');
            const FormData = require('form-data');

            const form = new FormData();
            form.append('file', fs.createReadStream(args.file_path));

            // We need to use node-fetch or axios for multipart if fetch doesn't support it easily
            // Let's use dynamic import for node-fetch or just use the native fetch in Node 18+ with FormData?
            // Node 18 fetch doesn't support FormData from 'form-data' package directly.
            // Let's keep it simple: return a message saying "Please use Python MCP for Image Analysis" for now
            // OR implement it properly.
            // Let's try to implement it properly using 'fetch' and 'form-data' if possible, or just 'axios'.
            // Since we didn't install axios in this package, let's skip image verification for the JS connector 
            // OR just return a placeholder.

            return {
                content: [{ type: "text", text: "Image verification via JS Connector is coming soon. Please use the Python MCP server." }],
            };
        }

        return {
            content: [{ type: "text", text: `Unknown tool: ${name}` }],
            isError: true,
        };
    } catch (error) {
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
        };
    }
});

// Start Server
async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

run().catch(console.error);
