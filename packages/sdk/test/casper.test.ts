import { describe, expect, it } from "vitest";
import { BitMem, createCasperX402QuoteFromHeaders } from "../src/index.js";

describe("Casper agent infra adapter", () => {
  it("stores Casper x402 quotes as protocol memory", async () => {
    const mem = new BitMem();
    const memory = await mem.casper.rememberX402Quote({
      agentId: "agent",
      service: "CSPR-Market-Data",
      endpoint: "/v1/rwa/nav",
      amountUsd: "0.25",
      amountCspr: "10"
    });

    expect(memory.kind).toBe("protocol_profile");
    expect(memory.tags).toEqual(
      expect.arrayContaining(["casper", "x402", "payment-quote", "cspr-market-data"])
    );
    expect(memory.content).toMatchObject({
      network: "casper",
      surface: "x402",
      snapshotType: "payment_quote",
      service: "cspr-market-data",
      endpoint: "/v1/rwa/nav",
      amountUsd: 0.25
    });
  });

  it("seeds Casper AI Toolkit surfaces as agent memory", async () => {
    const mem = new BitMem();
    const memories = await mem.casper.seedAiToolkitProfile({
      agentId: "agent",
      surfaces: ["x402-facilitator", "casper-mcp-server", "odra-framework"]
    });

    expect(memories).toHaveLength(3);
    expect(memories.map((memory) => memory.title)).toEqual(
      expect.arrayContaining([
        "Casper x402 Facilitator",
        "Casper MCP Server",
        "Odra Framework"
      ])
    );
    expect(memories[0]?.content).toMatchObject({
      network: "casper",
      capabilityType: "casper_ai_toolkit_surface"
    });
  });

  it("creates Casper x402 quote inputs from payment headers", async () => {
    const quote = createCasperX402QuoteFromHeaders({
      agentId: "agent",
      service: "market-data",
      endpoint: "/api/v1/market-data",
      headers: {
        "X-Payment-Address": "01a3",
        "X-Payment-Amount": "1000000",
        "X-Payment-Network": "casper"
      }
    });

    expect(quote.amountCspr).toBe("0.001");
    expect(quote.currency).toBe("CSPR");
    expect(quote.raw).toMatchObject({
      paymentAddress: "01a3",
      paymentAmount: "1000000",
      paymentNetwork: "casper"
    });
  });

  it("stores CSPR.cloud streaming events and Odra contract workflows", async () => {
    const mem = new BitMem();
    const event = await mem.casper.rememberStreamingEvent({
      agentId: "agent",
      eventType: "contract_call",
      source: "cspr-cloud",
      blockHeight: 123,
      deployHash: "deploy-hash"
    });
    const workflow = await mem.casper.rememberContractWorkflow({
      agentId: "agent",
      contractName: "guardrail_registry",
      workflowStage: "tested",
      tests: {
        passed: 4,
        failed: 0
      }
    });

    expect(event.content).toMatchObject({
      network: "casper",
      surface: "streaming",
      snapshotType: "streaming_event",
      eventType: "contract_call"
    });
    expect(workflow.content).toMatchObject({
      network: "casper",
      surface: "odra",
      snapshotType: "contract_workflow",
      contractName: "guardrail_registry",
      workflowStage: "tested"
    });
  });

  it("blocks x402 payments that breach service and spend guardrails", async () => {
    const mem = new BitMem();
    await mem.casper.createAgentGuardrailPolicy({
      agentId: "agent",
      allowedServices: ["rwa-price-oracle"],
      maxSpendPerRequestUsd: 1,
      maxSessionSpendUsd: 5,
      requireHumanForX402AboveUsd: 0.5
    });

    const verdict = await mem.casper.assessAgentAction({
      agentId: "agent",
      surface: "x402",
      actionType: "x402_payment",
      service: "unknown-alpha-feed",
      endpoint: "/v1/signal",
      paymentUsd: 3,
      sessionSpendUsd: 7
    });

    expect(verdict.decision).toBe("BLOCK");
    expect(verdict.findings.map((finding) => finding.code)).toEqual(
      expect.arrayContaining([
        "CASPER_SERVICE_NOT_ALLOWED",
        "CASPER_X402_REQUEST_SPEND_LIMIT",
        "CASPER_X402_SESSION_SPEND_LIMIT"
      ])
    );
    expect(verdict.report.kind).toBe("blocked_action");
  });

  it("requires human review for Casper DeFi MCP writes", async () => {
    const mem = new BitMem();
    await mem.casper.createAgentGuardrailPolicy({
      agentId: "agent",
      allowedMcpServers: ["cspr-trade"],
      requireHumanForDeFiWrites: true
    });

    const verdict = await mem.casper.assessAgentAction({
      agentId: "agent",
      surface: "cspr-trade",
      actionType: "defi_swap",
      mcpServer: "cspr-trade",
      mcpTool: "swap",
      mcpRisk: "write",
      readOnlyMcp: false,
      humanConfirmed: false
    });

    expect(verdict.decision).toBe("REQUIRE_HUMAN");
    expect(verdict.findings.map((finding) => finding.code)).toEqual(
      expect.arrayContaining([
        "CASPER_MCP_WRITE_REQUIRES_HUMAN",
        "CASPER_MCP_READ_ONLY_NOT_CONFIRMED",
        "CASPER_DEFI_WRITE_REQUIRES_HUMAN"
      ])
    );
    expect(verdict.report.kind).toBe("risk_report");
  });

  it("requires human review for Odra contract deploys", async () => {
    const mem = new BitMem();
    await mem.casper.createAgentGuardrailPolicy({
      agentId: "agent",
      allowedMcpServers: ["casper-mcp"],
      requireHumanForContractDeploys: true
    });

    const verdict = await mem.casper.assessAgentAction({
      agentId: "agent",
      surface: "odra",
      actionType: "contract_deploy",
      mcpServer: "casper-mcp",
      mcpTool: "submit_deploy",
      mcpRisk: "write",
      readOnlyMcp: false,
      humanConfirmed: false
    });

    expect(verdict.decision).toBe("REQUIRE_HUMAN");
    expect(verdict.findings.map((finding) => finding.code)).toEqual(
      expect.arrayContaining([
        "CASPER_MCP_WRITE_REQUIRES_HUMAN",
        "CASPER_CONTRACT_DEPLOY_REQUIRES_HUMAN"
      ])
    );
  });
});
