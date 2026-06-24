import { createHash, randomUUID } from "node:crypto";

export function createId(prefix: string): string {
  return `${prefix}_${randomUUID().replaceAll("-", "")}`;
}

export function stableJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

export function hashJson(value: unknown): string {
  return `0x${createHash("sha256").update(stableJson(value)).digest("hex")}`;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sortKeys(child)])
    );
  }

  return value;
}
