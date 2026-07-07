import type { PrivateReasoning, OxysConfig } from "./types.js";

export type ComputePurpose = "risk_review" | "failure_reflection";

export type ComputePrompt = {
  purpose: ComputePurpose;
  system: string;
  user: string;
};

export interface ComputeClient {
  generate(prompt: ComputePrompt): Promise<PrivateReasoning>;
}

export class LocalComputeClient implements ComputeClient {
  async generate(prompt: ComputePrompt): Promise<PrivateReasoning> {
    return {
      provider: "local",
      model: "local-deterministic",
      summary: summarizeLocally(prompt)
    };
  }
}

export function createComputeFromConfig(
  compute: OxysConfig["compute"] = { provider: "local" }
): ComputeClient {
  return new LocalComputeClient();
}

function summarizeLocally(prompt: ComputePrompt): string {
  if (prompt.purpose === "risk_review") {
    return "Local deterministic review completed for the Casper agent.";
  }

  return "Local deterministic reflection completed for the Casper agent.";
}
