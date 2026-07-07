# Oxys Casper Demo

This demo shows Oxys as the memory and guardrail layer around a Casper AI agent.

## Run

```bash
npm install
npm run build
npm run mcp:cspr:probe
npm run example:casper
```

## Flow

1. Oxys starts the MCP server in process.
2. The server lists or calls CSPR.trade MCP tools on Casper mainnet.
3. The CSPR.trade observation is saved as Oxys memory with an `agentId`.
4. A planned `build_swap` action is reviewed without sending it to a signer.
5. Oxys returns `ALLOW`, `WARN`, `BLOCK`, or `REQUIRE_HUMAN`.
6. The review is saved as future context for the same Casper agent.

## Safety Story

Oxys is not the trading bot and does not custody funds. It sits before the signing path and gives the operator an audit trail:

- what the agent saw from CSPR.trade
- what Casper provenance was read from CSPR.cloud
- which guardrails were applied
- which actions were blocked or required a human
- what the agent should remember next time
