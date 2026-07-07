import { LearningClient } from "./learning.js";
import { AegisModule } from "./aegis.js";
import { createComputeFromConfig } from "./compute.js";
import type { ComputeClient } from "./compute.js";
import { createStorageFromConfig, OxysCore } from "./oxys-core.js";
import { createProofRecorderFromConfig, ProofsClient } from "./proofs.js";
import type { AegisRiskClient } from "./risk.js";
import type { ContextClient } from "./context.js";
import type { MemoryClient } from "./memory.js";
import type { ProfileClient } from "./profile.js";
import type { MemoryStorage } from "./storage.js";
import { TradesClient } from "./trades.js";
import type { OxysConfig } from "./types.js";

export class Oxys {
  readonly oxys: OxysCore;
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
    readonly config: OxysConfig = {},
    storage: MemoryStorage = createStorageFromConfig(config.storage),
    compute: ComputeClient = createComputeFromConfig(config.compute)
  ) {
    this.oxys = new OxysCore(storage);
    this.compute = compute;
    this.aegis = new AegisModule(
      this.oxys.memory,
      this.oxys.context,
      this.compute
    );
    this.memory = this.oxys.memory;
    this.context = this.oxys.context;
    this.profile = this.oxys.profile;
    this.risk = this.aegis.risk;
    this.trades = new TradesClient(this.memory);
    this.learning = new LearningClient(this.memory, this.compute);
    this.proofs = new ProofsClient(createProofRecorderFromConfig(config.chain));
  }
}
