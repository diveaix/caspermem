# Oxys Casper / CSPR Integration

Oxys integrates with Casper infrastructure through the existing MCP server. The default path is mainnet read/review with no deploy submission.

## CSPR.trade MCP

Oxys defaults to the public Casper mainnet CSPR.trade MCP endpoint:

```bash
OXYS_CSPR_TRADE_NETWORK=mainnet
OXYS_CSPR_TRADE_MCP_URL=https://mcp.cspr.trade/mcp
```

Tools:

| Tool | Purpose |
| --- | --- |
| `cspr_trade_list_tools` | List tools available from the configured CSPR.trade MCP server. |
| `cspr_trade_call_tool` | Call an allowed CSPR.trade MCP tool and always save the result as Oxys agent memory. |
| `cspr_trade_review_action` | Review or call a CSPR.trade action, save the review, and return `ALLOW`, `WARN`, `BLOCK`, or `REQUIRE_HUMAN` before signing/submission. |

Every Casper trade action must be memory-backed. `cspr_trade_call_tool` requires `agentId`, `saveMemory` cannot be set to `false`, and build/submit actions write request memory before any external CSPR.trade call is made.

`submit_transaction` is blocked by default. Keep it blocked for the mainnet demo.

## CSPR.cloud REST

Oxys also exposes a read-only CSPR.cloud REST helper:

| Tool | Purpose |
| --- | --- |
| `cspr_cloud_rest_get` | Call a CSPR.cloud REST path and optionally save the response as Oxys memory. |

Set one of:

```bash
CSPR_CLOUD_API_TOKEN=...
CSPR_CLOUD_ACCESS_TOKEN=...
```

Then call paths such as `/blocks`, `/deploys`, or other CSPR.cloud REST endpoints your access tier allows. The tool defaults to `network: "mainnet"`.

## Demo

```bash
npm run mcp:cspr:probe
npm run example:casper
```

The demo:

1. Starts Oxys MCP in process.
2. Reads CSPR.trade mainnet data when the endpoint is available.
3. Saves the observation as Oxys memory.
4. Reviews a planned `build_swap` action without calling a signer or submitter.
5. Returns a pre-signing decision and saves it as future context.

## Source References

- Casper AI Toolkit: https://www.casper.network/ai
- CSPR.trade MCP: https://mcp.cspr.trade/
- CSPR.trade self-hosting: https://mcp.cspr.trade/docs/self-hosting
- CSPR.cloud docs: https://docs.cspr.cloud/
