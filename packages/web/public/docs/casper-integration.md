# Oxys Casper Integration

Oxys connects Casper agents to CSPR.trade MCP, CSPR.cloud, and workspace memory.

## Defaults

- Network: Casper mainnet
- CSPR.trade MCP: `https://mcp.cspr.trade/mcp`
- CSPR.cloud: read-only REST with `CSPR_CLOUD_API_TOKEN`
- Transaction submission: blocked by default

## Memory Rule

Every Casper CSPR.trade call or review requires an `agentId` and is saved as Oxys memory. Build and submit paths write a request memory before any external call, and blocked submit attempts write a blocked/failure record.

## Demo Commands

```bash
npm run mcp:cspr:probe
npm run example:casper
```
