#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { createOxysApi } from "@oxys/api";
import { createOxysMcpHttpApp } from "@oxys/mcp/http-app";
import type { OxysConfig } from "@oxys/sdk";

loadEnvFile();

const port = Number(process.env.PORT ?? "8787");
const apiBaseUrl = publicApiBaseUrl();
const memoryPath = process.env.OXYS_API_MEMORY_PATH ?? ".oxys/api-memory.json";
const config = createConfigFromEnv();

const apiServer = createOxysApi({
  config,
  memoryPath,
  auth: {
    appUrl: process.env.OXYS_APP_URL,
    returnDevVerificationToken: process.env.OXYS_RETURN_DEV_TOKENS !== "false"
  }
});
const mcpApp = createOxysMcpHttpApp({ apiBaseUrl });

const server = createServer((request, response) => {
  const url = request.url ?? "/";

  if (request.method === "GET" && url === "/health") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      ok: true,
      service: "oxys-backend",
      rest: "/v1",
      mcp: "/mcp",
      apiBaseUrl
    }));
    return;
  }

  if (url === "/mcp" || url.startsWith("/mcp?")) {
    mcpApp(request, response);
    return;
  }

  apiServer.emit("request", request, response);
});

server.listen(port, () => {
  console.log(`Oxys backend listening on port ${port}`);
  console.log(`REST API available at ${apiBaseUrl}/v1`);
  console.log(`Streamable HTTP MCP available at ${apiBaseUrl}/mcp`);
});

function publicApiBaseUrl() {
  if (process.env.OXYS_API_URL) return process.env.OXYS_API_URL.replace(/\/$/, "");
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  return `http://127.0.0.1:${process.env.PORT ?? "8787"}`;
}

function loadEnvFile(path = ".env") {
  const envPath = resolve(process.cwd(), path);
  if (!existsSync(envPath)) return;

  for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = unquoteEnvValue(rawValue.trim());
  }
}

function unquoteEnvValue(value: string) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function createConfigFromEnv(): OxysConfig {
  return {};
}
