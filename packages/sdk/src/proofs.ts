import { hashJson } from "./hash.js";
import type {
  OxysConfig,
  ProofRecordInput,
  ProofRecordResult
} from "./types.js";

export interface ProofRecorder {
  recordDecision(input: ProofRecordInput): Promise<ProofRecordResult>;
}

export class LocalProofRecorder implements ProofRecorder {
  async recordDecision(input: ProofRecordInput): Promise<ProofRecordResult> {
    return {
      proofHash: hashJson(input),
      provider: "local"
    };
  }
}

export class ProofsClient {
  constructor(private readonly recorder: ProofRecorder = new LocalProofRecorder()) {}

  async recordDecision(input: ProofRecordInput): Promise<ProofRecordResult> {
    return this.recorder.recordDecision(input);
  }
}

export function createProofRecorderFromConfig(
  _chain: OxysConfig["chain"] = { provider: "local" }
): ProofRecorder {
  return new LocalProofRecorder();
}
