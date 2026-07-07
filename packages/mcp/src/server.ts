#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createOxysMcpServer } from "./create-server.js";

const server = createOxysMcpServer({
  allowLocalFallback: true,
  apiBaseUrl:
    process.env.OXYS_API_URL ??
    process.env.OXYS_API_URL ??
    "http://127.0.0.1:8787",
  apiKey: process.env.OXYS_API_KEY ?? process.env.OXYS_API_KEY,
  memoryPath: process.env.OXYS_MCP_MEMORY_PATH ?? ".oxys/mcp-memory.json"
});

const transport = new StdioServerTransport();
await server.connect(transport);
