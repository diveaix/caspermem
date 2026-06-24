# Agent Connection Guide

0G-Mem is not the trading agent. It is the memory, risk, learning, and proof layer that a trading agent calls before and after execution.

Agents can connect in three ways. In hosted/API mode, every request must be tied
to a verified user through an API key.

Security rule:

```text
agentId is routing metadata, not security.
The API key decides which workspace owns the memory.
```

Dashboard flow:

1. Open `/#dashboard`.
2. Enter email.
3. Open the confirmation link.
4. Create an API key.
5. Put that key in the agent runtime as `OGMEM_API_KEY`.

## 1. TypeScript SDK

Best for agents running in Node.js or a TypeScript service.

```ts
import { ZeroGMemApiClient } from "@0g-mem/sdk";

const client = new ZeroGMemApiClient({
  apiKey: process.env.OGMEM_API_KEY!,
  baseUrl: "http://127.0.0.1:8787"
});

await client.memory.add(memory);
const context = await client.context.forTradePlan(plan);
const review = await client.aegis.risk.reviewPlan(plan);

if (review.verdict.decision === "BLOCK") {
  throw new Error(review.verdict.reason);
}
```

The agent keeps its own wallet, executor, strategy, and market data. It calls 0G-Mem before execution and records outcomes afterward.

## 2. REST API

Best for Python agents, hosted workers, workflow engines, or services that do not run TypeScript directly.

Start the API:

```bash
npm run api:dev
```

Useful calls:

```text
GET  http://127.0.0.1:8787/health
POST http://127.0.0.1:8787/v1/memory
GET  http://127.0.0.1:8787/v1/profile?agentId=trader-01&query=vault
POST http://127.0.0.1:8787/v1/context
POST http://127.0.0.1:8787/v1/review-plan
POST http://127.0.0.1:8787/v1/trades/outcome
POST http://127.0.0.1:8787/v1/learning/reflect
```

Minimal review request:

```bash
curl -X POST http://127.0.0.1:8787/v1/review-plan \
  -H "Authorization: Bearer $OGMEM_API_KEY" \
  -H "Content-Type: application/json" \
  --data @packages/sdk/examples/fixtures/risky-plan.json
```

The API includes CORS headers and secure session cookies so the web dashboard can
call it during a local demo.

## 3. MCP Server

Best for LLM agents that discover tools through Model Context Protocol.

Start the MCP server:

```bash
npm run mcp:dev
```

When `OGMEM_API_KEY` is present, MCP writes to the authenticated API. Without it,
MCP falls back to local file memory for offline demos.

Available MCP tools:

```text
0gmem_add_memory
0gmem_get_profile
0gmem_context_for_trade_plan
aegis_review_plan
0gmem_record_outcome
0gmem_reflect_failure
```

Example MCP client config:

```json
{
  "mcpServers": {
    "0g-mem": {
      "command": "npm",
      "args": ["run", "mcp:dev"],
      "cwd": "C:/Documents/0G hackathon",
      "env": {
        "OGMEM_API_URL": "http://127.0.0.1:8787",
        "OGMEM_API_KEY": "ogm_live_..."
      }
    }
  }
}
```

## Pre-Execution Workflow

1. Agent prepares a transaction plan.
2. Agent calls `profile` or `context`.
3. Agent calls Aegis risk review.
4. 0G-Mem returns `ALLOW`, `WARN`, `BLOCK`, or `REQUIRE_HUMAN`.
5. Agent executes only when its own policy allows it.
6. Agent records outcome.
7. Failure lessons become future memory.
8. Proof hashes are stored locally or anchored on 0G Chain in live mode.

## Live 0G Mode

Local mode is the demo path. Live 0G mode requires:

- 0G Storage credentials and funded private key
- 0G Compute Router API key
- deployed `AegisProofRegistry`
- 0G Chain private key for proof anchoring

See `docs/LIVE_0G_CHECKLIST.md`.
