import type { ContextClient } from "./context.js";
import type { ComputeClient } from "./compute.js";
import type { MemoryClient } from "./memory.js";
import { AegisRiskClient } from "./risk.js";

export class AegisModule {
  readonly risk: AegisRiskClient;

  constructor(memory: MemoryClient, context: ContextClient, compute: ComputeClient) {
    this.risk = new AegisRiskClient(memory, context, compute);
  }
}
