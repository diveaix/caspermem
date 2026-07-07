import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createOxysMcpServer } from "../src/create-server.js";

const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const server = createOxysMcpServer({
  allowLocalFallback: true,
  memoryPath: ".oxys/casper-demo-memory.json"
});
const client = new Client({
  name: "oxys-casper-review-demo",
  version: "0.1.0"
});

try {
  await server.connect(serverTransport);
  await client.connect(clientTransport);

  const liveRead = await callMainnetRead();

  const plannedBuild = await callJsonTool("cspr_trade_review_action", {
    agentId: "agent-casper-mainnet",
    toolName: "build_swap",
    toolArgs: {
      fromToken: "CSPR",
      toToken: "sCSPR",
      amount: "5"
    },
    callTool: false,
    summary: "Review a planned mainnet swap build before a signer sees it.",
    observedSpendCSPR: 5,
    observedPriceImpactPct: 0.4,
    observedSlippagePct: 0.5,
    maxSpendCSPR: 10,
    maxPriceImpactPct: 2,
    maxSlippagePct: 1,
    humanConfirmed: false
  });

  console.log(
    JSON.stringify(
      {
        story:
          "Mainnet CSPR.trade review data -> Oxys memory -> pre-signing guardrail review.",
        liveRead: summarizeReview(liveRead),
        plannedBuild: summarizeReview(plannedBuild)
      },
      null,
      2
    )
  );
} finally {
  await client.close().catch(() => {});
  await server.close().catch(() => {});
}

async function callMainnetRead() {
  try {
    return await callJsonTool("cspr_trade_review_action", {
      agentId: "agent-casper-mainnet",
      toolName: "get_tokens",
      toolArgs: {},
      summary: "Read mainnet CSPR.trade token metadata before any trade planning.",
      maxSpendCSPR: 10,
      maxPriceImpactPct: 2,
      maxSlippagePct: 1
    });
  } catch (error) {
    return {
      network: "mainnet",
      decision: "SKIPPED",
      findings: [
        {
          code: "CSPR_TRADE_MAINNET_MCP_UNAVAILABLE",
          severity: "warning",
          message:
            "Configured mainnet CSPR.trade MCP was unavailable; continuing with an offline mainnet guardrail review."
        }
      ],
      metrics: {},
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function callJsonTool(name: string, args: Record<string, unknown>) {
  const result = await client.callTool({
    name,
    arguments: args
  });
  const text = result.content.find((item) => item.type === "text")?.text ?? "{}";
  return JSON.parse(text) as Record<string, unknown>;
}

function summarizeReview(review: Record<string, unknown>) {
  const memory = review.memory as { id?: string; hash?: string; title?: string } | undefined;
  return {
    network: review.network,
    decision: review.decision,
    findings: review.findings,
    metrics: review.metrics,
    memory: memory
      ? {
          id: memory.id,
          title: memory.title,
          hash: memory.hash
        }
      : undefined
  };
}
