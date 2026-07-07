# Oxys SDK

Memory, guardrail, and audit SDK for Casper AI agents.

```bash
npm install @oxys/sdk
```

```ts
import { Oxys } from "@oxys/sdk";

const oxys = new Oxys();

await oxys.memory.add({
  agentId: "agent-casper-01",
  kind: "policy",
  title: "CSPR.trade signing limits",
  content: {
    maxSpendCSPR: 10,
    maxSlippagePct: 1
  }
});
```

Oxys is designed to sit around the agent runtime: the agent keeps its strategy, wallet, signer, and execution path, while Oxys stores memory, reviews risky actions, and records outcomes.
