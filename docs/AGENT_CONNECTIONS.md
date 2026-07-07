# Oxys Agent Connections

Oxys gives Casper agents three integration paths:

| Path | Use when |
| --- | --- |
| SDK | A Node or TypeScript agent wants to write memory directly. |
| REST API | A hosted worker, notebook, or Python service needs HTTP access. |
| MCP | Codex, Claude, or another MCP client needs tools beside CSPR.trade. |

## Hosted Endpoints

```text
REST API: https://oxys-backend-production.up.railway.app/v1
MCP URL:  https://oxys-backend-production.up.railway.app/mcp
```

Use `OXYS_API_KEY` as the bearer token environment variable for connected agents.

## Casper Flow

1. Agent reads CSPR.trade or CSPR.cloud data.
2. Oxys saves the observation as memory.
3. Agent proposes a CSPR.trade action.
4. Oxys reviews the action against memory and guardrails.
5. Oxys returns `ALLOW`, `WARN`, `BLOCK`, or `REQUIRE_HUMAN`.
6. The signer only sees approved or human-confirmed actions.
7. The result is saved for future context.

## MCP Config

```json
{
  "mcpServers": {
    "oxys": {
      "type": "streamable-http",
      "url": "https://oxys-backend-production.up.railway.app/mcp",
      "bearerTokenEnvVar": "OXYS_API_KEY"
    }
  }
}
```
