import { createDemoSdk } from "./shared.js";

const sdk = createDemoSdk();
const agentId = "agent-casper-01";
const observedAt = new Date(Date.now() - 7 * 60 * 1000).toISOString();

const toolkitMemories = await sdk.casper.seedAiToolkitProfile({ agentId });

const policy = await sdk.casper.createAgentGuardrailPolicy({
  agentId,
  allowedServices: ["cspr-market-data", "rwa-price-oracle"],
  allowedMcpServers: ["cspr-cloud", "cspr-trade", "casper-mcp"],
  maxSpendPerRequestUsd: 2,
  maxSessionSpendUsd: 10,
  maxRequestsPerSession: 12,
  requireHumanForX402AboveUsd: 0.5,
  requireHumanForDeFiWrites: true,
  requireHumanForContractDeploys: true,
  notes:
    "Casper Buildathon demo policy: agents may pay small x402 quotes and read chain data, but DeFi writes and contract deploys require operator review."
});

const quote = await sdk.casper.rememberX402QuoteFromHeaders({
  agentId,
  service: "cspr-market-data",
  endpoint: "/v1/rwa/nav/latest",
  amountUsd: 0.75,
  observedAt,
  headers: {
    "X-Payment-Address": "01a3b5c7d9f8e2",
    "X-Payment-Amount": "1000000",
    "X-Payment-Network": "casper"
  }
});

const paymentAttempt = await sdk.casper.rememberX402PaymentAttempt({
  agentId,
  service: "cspr-market-data",
  endpoint: "/v1/rwa/nav/latest",
  status: "signed",
  amountUsd: 0.75,
  amountCspr: "0.001",
  paymentAddress: "01a3b5c7d9f8e2",
  paymentAmount: "1000000",
  paymentNetwork: "casper",
  paymentProof: "casper:01a3b5c7d9f8e2:1000000:sig_ed25519_demo",
  observedAt: new Date().toISOString()
});

const observation = await sdk.casper.rememberMcpObservation({
  agentId,
  server: "cspr-trade",
  tool: "swap",
  risk: "write",
  observedAt: new Date().toISOString(),
  request: {
    from: "CSPR",
    to: "USDC",
    amount: "500"
  },
  summary: "Agent prepared a CSPR.trade swap after reading market context."
});

const streamingEvent = await sdk.casper.rememberStreamingEvent({
  agentId,
  eventType: "deploy",
  source: "cspr-cloud",
  blockHeight: "24500123",
  deployHash: "deploy-demo-9f7a",
  account: "01f4a2b8c3",
  summary: "CSPR.cloud streaming feed observed the agent's latest Casper deploy."
});

const contractWorkflow = await sdk.casper.rememberContractWorkflow({
  agentId,
  contractName: "rwa_guardrail_registry",
  workflowStage: "tested",
  files: ["contracts/rwa_guardrail_registry.rs"],
  tests: {
    passed: 4,
    failed: 0,
    command: "cargo test"
  },
  upgradeable: true,
  summary: "Odra-generated Casper contract passed local tests before deploy review."
});

const x402Verdict = await sdk.casper.assessAgentAction({
  agentId,
  intent: "Pay an x402 market-data endpoint before updating an RWA valuation model",
  surface: "x402",
  actionType: "x402_payment",
  service: "cspr-market-data",
  endpoint: "/v1/rwa/nav/latest",
  paymentUsd: 0.75,
  sessionSpendUsd: 4.25,
  requestsInSession: 8,
  quoteObservedAt: observedAt,
  humanConfirmed: false
});

const defiVerdict = await sdk.casper.assessAgentAction({
  agentId,
  intent: "Swap CSPR into USDC using the CSPR.trade MCP server",
  surface: "cspr-trade",
  actionType: "defi_swap",
  mcpServer: "cspr-trade",
  mcpTool: "swap",
  mcpRisk: "write",
  readOnlyMcp: false,
  humanConfirmed: false,
  rawAction: {
    from: "CSPR",
    to: "USDC",
    amount: "500"
  }
});

const deployVerdict = await sdk.casper.assessAgentAction({
  agentId,
  intent: "Deploy the Odra-generated RWA guardrail registry contract",
  surface: "odra",
  actionType: "contract_deploy",
  mcpServer: "casper-mcp",
  mcpTool: "submit_deploy",
  mcpRisk: "write",
  readOnlyMcp: false,
  humanConfirmed: false,
  rawAction: {
    contractName: "rwa_guardrail_registry",
    framework: "odra"
  }
});

console.log(
  JSON.stringify(
    {
      story:
        "Casper AI Toolkit agent -> x402/MCP observations -> BIT/MEM memory -> guardrail review -> auditable report",
      memoryPath: ".bit-mem/demo-memory.json",
      memories: {
        toolkit: toolkitMemories.map((memory) => ({
          title: memory.title,
          hash: memory.hash
        })),
        policy: {
          id: policy.id,
          hash: policy.hash
        },
        quote: {
          id: quote.id,
          hash: quote.hash
        },
        paymentAttempt: {
          id: paymentAttempt.id,
          hash: paymentAttempt.hash
        },
        observation: {
          id: observation.id,
          hash: observation.hash
        },
        streamingEvent: {
          id: streamingEvent.id,
          hash: streamingEvent.hash
        },
        contractWorkflow: {
          id: contractWorkflow.id,
          hash: contractWorkflow.hash
        }
      },
      verdicts: {
        x402: {
          decision: x402Verdict.decision,
          riskScore: x402Verdict.riskScore,
          reason: x402Verdict.reason,
          reportHash: x402Verdict.reportHash,
          findings: x402Verdict.findings
        },
        defi: {
          decision: defiVerdict.decision,
          riskScore: defiVerdict.riskScore,
          reason: defiVerdict.reason,
          reportHash: defiVerdict.reportHash,
          findings: defiVerdict.findings
        },
        deploy: {
          decision: deployVerdict.decision,
          riskScore: deployVerdict.riskScore,
          reason: deployVerdict.reason,
          reportHash: deployVerdict.reportHash,
          findings: deployVerdict.findings
        }
      }
    },
    null,
    2
  )
);
