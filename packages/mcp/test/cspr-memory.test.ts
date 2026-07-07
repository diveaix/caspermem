import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";
import { createOxysMcpServer } from "../src/create-server.js";

const openServers: Array<() => Promise<void>> = [];
const tempDirs: string[] = [];

afterEach(async () => {
  while (openServers.length) {
    await openServers.pop()?.();
  }
  while (tempDirs.length) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe("Casper CSPR.trade memory persistence", () => {
  it("stores every reviewed Casper trade action in Oxys memory", async () => {
    const { client, memoryPath } = await createTestClient();

    const review = await callJsonTool(client, "cspr_trade_review_action", {
      agentId: "agent-casper-memory",
      toolName: "build_swap",
      toolArgs: {
        fromToken: "CSPR",
        toToken: "sCSPR",
        amount: "5"
      },
      callTool: false,
      observedSpendCSPR: 5,
      observedPriceImpactPct: 0.4,
      observedSlippagePct: 0.5,
      humanConfirmed: false
    });

    expect(review.decision).toBe("REQUIRE_HUMAN");
    expect(review.memory).toMatchObject({
      agentId: "agent-casper-memory",
      title: "CSPR.trade REQUIRE_HUMAN: build_swap"
    });

    const memories = readMemories(memoryPath);
    expect(memories).toHaveLength(1);
    expect(memories[0]).toMatchObject({
      agentId: "agent-casper-memory",
      kind: "risk_report",
      title: "CSPR.trade REQUIRE_HUMAN: build_swap",
      content: {
        network: "casper",
        casperNetwork: "mainnet",
        reportType: "cspr_trade_action_review",
        toolName: "build_swap",
        status: "reviewed",
        decision: "REQUIRE_HUMAN"
      }
    });
  });

  it("does not allow Casper trade review memory to be disabled", async () => {
    const { client, memoryPath } = await createTestClient();

    const result = await client.callTool({
      name: "cspr_trade_review_action",
      arguments: {
        agentId: "agent-casper-memory",
        toolName: "build_swap",
        toolArgs: {
          fromToken: "CSPR",
          toToken: "sCSPR",
          amount: "5"
        },
        callTool: false,
        saveMemory: false
      }
    });

    expect(result.isError).toBe(true);
    expect(toolText(result)).toContain("Invalid literal value, expected true");

    expect(readMemories(memoryPath)).toHaveLength(0);
  });

  it("requires an agent id before a direct CSPR.trade call can run", async () => {
    const { client, memoryPath } = await createTestClient();

    const result = await client.callTool({
      name: "cspr_trade_call_tool",
      arguments: {
        toolName: "get_tokens",
        toolArgs: {}
      }
    });

    expect(result.isError).toBe(true);
    expect(toolText(result)).toContain("agentId");

    expect(readMemories(memoryPath)).toHaveLength(0);
  });

  it("stores a blocked review when submit_transaction is requested", async () => {
    const { client, memoryPath } = await createTestClient();

    const review = await callJsonTool(client, "cspr_trade_review_action", {
      agentId: "agent-casper-memory",
      toolName: "submit_transaction",
      toolArgs: {
        deployJson: "{}"
      },
      callTool: true
    });

    expect(review.decision).toBe("BLOCK");
    expect(review.memory).toMatchObject({
      agentId: "agent-casper-memory",
      kind: "blocked_action",
      title: "CSPR.trade BLOCK: submit_transaction"
    });

    const memories = readMemories(memoryPath);
    expect(memories).toHaveLength(1);
    expect(memories[0]).toMatchObject({
      kind: "blocked_action",
      content: {
        reportType: "cspr_trade_action_review",
        toolName: "submit_transaction",
        risk: "submit",
        status: "reviewed",
        decision: "BLOCK"
      }
    });
  });

  it("stores an audit trail before a direct submit_transaction call fails", async () => {
    const { client, memoryPath } = await createTestClient();

    const result = await client.callTool({
      name: "cspr_trade_call_tool",
      arguments: {
        agentId: "agent-casper-memory",
        toolName: "submit_transaction",
        toolArgs: {
          deployJson: "{}"
        }
      }
    });

    expect(result.isError).toBe(true);
    expect(toolText(result)).toContain("submit_transaction is blocked by default");

    const memories = readMemories(memoryPath);
    expect(memories).toHaveLength(2);
    expect(memories[0]).toMatchObject({
      title: "CSPR.trade submit_transaction submit request",
      content: {
        reportType: "cspr_trade_tool_request",
        toolName: "submit_transaction",
        risk: "submit",
        status: "requested"
      }
    });
    expect(memories[1]).toMatchObject({
      kind: "blocked_action",
      title: "CSPR.trade submit_transaction submit failed",
      content: {
        reportType: "cspr_trade_tool_failure",
        toolName: "submit_transaction",
        risk: "submit",
        status: "failed"
      }
    });
  });
});

async function createTestClient() {
  const dir = mkdtempSync(join(tmpdir(), "oxys-cspr-memory-"));
  tempDirs.push(dir);
  const memoryPath = join(dir, "memory.json");
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createOxysMcpServer({
    allowLocalFallback: true,
    memoryPath
  });
  const client = new Client({
    name: "oxys-cspr-memory-test",
    version: "0.1.0"
  });

  await server.connect(serverTransport);
  await client.connect(clientTransport);
  openServers.push(async () => {
    await client.close().catch(() => {});
    await server.close().catch(() => {});
  });

  return { client, memoryPath };
}

function toolText(result: Awaited<ReturnType<Client["callTool"]>>) {
  return result.content.find((item) => item.type === "text")?.text ?? "";
}

async function callJsonTool(
  client: Client,
  name: string,
  args: Record<string, unknown>
) {
  const result = await client.callTool({
    name,
    arguments: args
  });
  const text = result.content.find((item) => item.type === "text")?.text ?? "{}";
  return JSON.parse(text) as Record<string, unknown>;
}

function readMemories(memoryPath: string) {
  try {
    return JSON.parse(readFileSync(memoryPath, "utf8")) as Array<Record<string, unknown>>;
  } catch {
    return [];
  }
}
