import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createOxysApi } from "./index.js";
import type { OxysConfig } from "@oxys/sdk";

loadEnvFile();

const port = Number(process.env.PORT ?? "8787");
const memoryPath = process.env.OXYS_API_MEMORY_PATH ?? ".oxys/api-memory.json";
const config = createConfigFromEnv();

const server = createOxysApi({ config, memoryPath });

server.listen(port, () => {
  console.log(`Oxys API listening on http://localhost:${port}`);
});

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
