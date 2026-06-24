import type { MemoryClient } from "./memory.js";

export class TradesClient {
  constructor(private readonly memory: MemoryClient) {}

  async recordOutcome(input: {
    agentId: string;
    planId: string;
    txHashes: string[];
    status: "executed" | "failed" | "reverted" | "skipped";
    pnlUsd?: number;
    reason?: string;
    notes?: string;
  }) {
    return this.memory.add({
      agentId: input.agentId,
      kind: "executed_trade",
      title: `Trade outcome: ${input.status}`,
      content: input,
      tags: ["trade-outcome", input.status]
    });
  }
}
