import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { JsonFileStorage, Oxys } from "../src/index.js";

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe("JsonFileStorage", () => {
  it("persists memory across SDK instances", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "oxys-"));
    const filePath = join(tempDir, "memory.json");
    const first = new Oxys(
      {},
      new JsonFileStorage(filePath)
    );

    await first.oxys.memory.add({
      agentId: "agent",
      kind: "policy",
      title: "Policy",
      content: {
        allowedContracts: ["0x1111111111111111111111111111111111111111"]
      }
    });

    const second = new Oxys(
      {},
      new JsonFileStorage(filePath)
    );
    const results = await second.oxys.memory.search({
      agentId: "agent",
      query: "Policy"
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.storageUri).toMatch(/^file:\/\//);
  });
});
