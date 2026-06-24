import { LearningClient } from "./learning.js";
import { AegisModule } from "./aegis.js";
import { createComputeFromConfig } from "./compute.js";
import type { ComputeClient } from "./compute.js";
import { createStorageFromConfig, ZeroGMemCore } from "./ogmem.js";
import { createProofRecorderFromConfig, ProofsClient } from "./proofs.js";
import type { AegisRiskClient } from "./risk.js";
import type { ContextClient } from "./context.js";
import type { MemoryClient } from "./memory.js";
import type { ProfileClient } from "./profile.js";
import type { MemoryStorage } from "./storage.js";
import { TradesClient } from "./trades.js";
import type { ZeroGMemConfig } from "./types.js";

export class ZeroGMem {
  readonly ogmem: ZeroGMemCore;
  readonly aegis: AegisModule;
  readonly memory: MemoryClient;
  readonly context: ContextClient;
  readonly profile: ProfileClient;
  readonly risk: AegisRiskClient;
  readonly trades: TradesClient;
  readonly learning: LearningClient;
  readonly proofs: ProofsClient;
  private readonly compute: ComputeClient;

  constructor(
    readonly config: ZeroGMemConfig = {},
    storage: MemoryStorage = createStorageFromConfig(config.storage),
    compute: ComputeClient = createComputeFromConfig(config.compute)
  ) {
    this.ogmem = new ZeroGMemCore(storage);
    this.compute = compute;
    this.aegis = new AegisModule(
      this.ogmem.memory,
      this.ogmem.context,
      this.compute
    );
    this.memory = this.ogmem.memory;
    this.context = this.ogmem.context;
    this.profile = this.ogmem.profile;
    this.risk = this.aegis.risk;
    this.trades = new TradesClient(this.memory);
    this.learning = new LearningClient(this.memory, this.compute);
    this.proofs = new ProofsClient(createProofRecorderFromConfig(config.chain));
  }
}
