#!/usr/bin/env node
import type { IncomingMessage, ServerResponse } from "node:http";
import { createOxysMcpHttpApp } from "./http-app.js";

const port = Number(process.env.PORT ?? process.env.OXYS_MCP_HTTP_PORT ?? "8788");
const app = createOxysMcpHttpApp();

app.get("/health", (_req: IncomingMessage, res: ServerResponse) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true, service: "oxys-mcp-http", transport: "streamable-http" }));
});

app.listen(port, (error?: Error) => {
  if (error) {
    console.error("Failed to start Oxys MCP HTTP server:", error);
    process.exit(1);
  }
  console.log(`Oxys Streamable HTTP MCP listening on http://127.0.0.1:${port}/mcp`);
});
