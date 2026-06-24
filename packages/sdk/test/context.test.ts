import { describe, expect, it } from "vitest";
import { ZeroGMem } from "../src/index.js";

describe("context retrieval", () => {
  it("deduplicates repeated memory by kind and title", async () => {
    const sdk = new ZeroGMem();
    const memory = {
      agentId: "agent",
      kind: "policy" as const,
      title: "Owner Risk Policy",
      content: {
        allowedContracts: ["0x1111111111111111111111111111111111111111"]
      }
    };

    await sdk.ogmem.memory.add(memory);
    await sdk.ogmem.memory.add(memory);

    const context = await sdk.ogmem.context.forTradePlan({
      agentId: "agent",
      intent: "Use owner policy",
      txs: [
        {
          chainId: 16602,
          to: "0x1111111111111111111111111111111111111111",
          data: "0x",
          value: "0"
        }
      ],
      metadata: {}
    });

    expect(context.memories.map((item) => item.title)).toEqual([
      "Owner Risk Policy"
    ]);
  });

  it("always includes baseline policy memory even when the query does not match it", async () => {
    const sdk = new ZeroGMem();
    await sdk.ogmem.memory.add({
      agentId: "agent",
      kind: "policy",
      title: "Owner Risk Policy",
      content: {
        maxNativeValueWei: "0",
        maxTokenApprovalAmount: "10"
      }
    });
    await sdk.ogmem.memory.add({
      agentId: "agent",
      kind: "failure_lesson",
      title: "Vault route failed",
      content: {
        lesson: "Vault routing failed during volatility"
      }
    });

    const context = await sdk.ogmem.context.forTradePlan({
      agentId: "agent",
      intent: "Deposit into yield route",
      txs: [
        {
          chainId: 16602,
          to: "0x1111111111111111111111111111111111111111",
          data: "0x",
          value: "0"
        }
      ],
      metadata: {}
    });

    expect(context.memories.map((item) => item.title)).toContain("Owner Risk Policy");
  });
});
