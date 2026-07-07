# Oxys

Oxys is memory, guardrail, and audit infrastructure for Casper AI agents.

It connects an agent runtime to CSPR.trade MCP, optional CSPR.cloud reads, and persistent workspace memory. The agent keeps its strategy, wallet, signer, and execution path. Oxys records what the agent saw, reviews proposed Casper actions before signing, and saves every review or blocked action as reusable memory.

## Casper Integration

- CSPR.trade MCP mainnet endpoint: `https://mcp.cspr.trade/mcp`
- CSPR.cloud REST: read-only network provenance with `CSPR_CLOUD_API_TOKEN`
- Oxys MCP tools: memory, profile, context, review, outcome, reflection, CSPR.trade, and CSPR.cloud helpers
- Submit safety: `submit_transaction` is blocked by default
- Memory rule: every Casper CSPR.trade call or review requires `agentId` and is saved

## Quick Start

```bash
npm install
npm run build
npm test
```

Run a live read-only CSPR.trade probe:

```bash
npm run mcp:cspr:probe
```

Run the Casper review demo:

```bash
npm run example:casper
```

Start local services:

```bash
npm run api:dev
npm run mcp:http:dev
npm run web:dev
```

## MCP Tools

Core memory tools:

| Tool | Purpose |
| --- | --- |
| `oxys_add_memory` | Save policy, strategy, trade, feedback, protocol, risk, or lesson memory. |
| `oxys_get_profile` | Return stable agent profile plus recent dynamic memory. |
| `oxys_context_for_trade_plan` | Retrieve context before a risk review. |
| `oxys_review_plan` | Review a transaction plan and save the result. |
| `oxys_record_outcome` | Save executed, failed, reverted, or skipped outcomes. |
| `oxys_reflect_failure` | Create a failure lesson from outcome and context. |

Casper tools:

| Tool | Purpose |
| --- | --- |
| `cspr_trade_list_tools` | List available tools from the configured CSPR.trade MCP server. |
| `cspr_trade_call_tool` | Call a CSPR.trade MCP tool and always save the observation as agent memory. |
| `cspr_trade_review_action` | Review or call a CSPR.trade action with pre-signing guardrails and saved audit memory. |
| `cspr_cloud_rest_get` | Read CSPR.cloud REST data and optionally save it as memory. |

## Mainnet Defaults

The current Casper path defaults to mainnet:

```bash
OXYS_CSPR_TRADE_NETWORK=mainnet
OXYS_CSPR_TRADE_MCP_URL=https://mcp.cspr.trade/mcp
```

Do not enable submit flow for demos unless you intentionally want to pass already-signed Casper deploy JSON:

```bash
OXYS_CSPR_TRADE_ALLOW_SUBMIT=true
```

## What This Project Does

1. Stores Casper agent observations, policies, reviews, blocked actions, outcomes, and lessons.
2. Bridges CSPR.trade MCP into the existing MCP server.
3. Reviews CSPR.trade build/submit actions before signing or submission.
4. Blocks direct submit attempts by default and records the attempt.
5. Reads CSPR.cloud REST provenance when a token is configured.
6. Provides a web control plane branded as Oxys for Casper agent operators.

## More

- Casper integration notes: `docs/CASPER_CSPR_INTEGRATION.md`
- Web docs: `packages/web/public/docs/casper-integration.md`
- Casper AI Toolkit: https://www.casper.network/ai
- CSPR.trade MCP: https://mcp.cspr.trade/
- CSPR.cloud docs: https://docs.cspr.cloud/
