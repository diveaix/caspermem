# Oxys Casper AI Submission

Oxys is a Casper-native memory and guardrail layer for AI agents that use CSPR.trade and CSPR.cloud.

## What We Built

- CSPR.trade MCP bridge inside the existing MCP server.
- CSPR.cloud read-only REST helper.
- Pre-signing review for CSPR.trade actions.
- Mandatory memory persistence for every Casper trade call and review.
- Default block for `submit_transaction`.
- Web control plane rebranded to Oxys and aligned to Casper AI operators.

## Why It Matters

AI agents need durable memory before they touch money. Oxys gives Casper agents a place to store policies, market observations, review results, blocked attempts, outcomes, and failure lessons.

The agent can still own strategy and signing. Oxys owns context, review, and audit memory.

## Demo Commands

```bash
npm run build
npm test
npm run mcp:cspr:probe
npm run example:casper
```

## Casper Tools Used

- Casper AI Toolkit: https://www.casper.network/ai
- CSPR.trade MCP: https://mcp.cspr.trade/
- CSPR.cloud: https://docs.cspr.cloud/

## Mainnet Safety

The current integration defaults to Casper mainnet for read and review flows. Direct submit remains blocked unless `OXYS_CSPR_TRADE_ALLOW_SUBMIT=true` is explicitly configured.
