import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  JsonFileStorage,
  Oxys,
  OxysApiClient,
  memoryInputSchema,
  tradePlanSchema,
  type MemoryInput,
  type TradePlan
} from "@oxys/sdk";
import {
  callCsprTradeTool,
  classifyCsprTradeTool,
  listCsprTradeTools,
  resolveCsprTradeEndpoint,
  resolveCsprTradeNetwork
} from "./cspr-trade.js";
import { getCsprCloudRest } from "./cspr-cloud.js";

export type CreateOxysMcpServerOptions = {
  apiBaseUrl?: string;
  apiKey?: string;
  allowLocalFallback?: boolean;
  memoryPath?: string;
  csprTradeMcpUrl?: string;
  allowCsprTradeSubmit?: boolean;
};

export function createOxysMcpServer(options: CreateOxysMcpServerOptions = {}) {
  const sdk = options.allowLocalFallback
    ? new Oxys(
        {},
        new JsonFileStorage(options.memoryPath ?? ".oxys/mcp-memory.json")
      )
    : undefined;
  const apiClient = options.apiKey
    ? new OxysApiClient({
        apiKey: options.apiKey,
        baseUrl: options.apiBaseUrl ?? "http://127.0.0.1:8787"
      })
    : undefined;

  const server = new McpServer({
    name: "oxys",
    version: "0.1.0"
  });
  const csprTradeNetwork = resolveCsprTradeNetwork();
  const csprTradeMcpUrl = resolveCsprTradeEndpoint({
    endpoint: options.csprTradeMcpUrl,
    network: csprTradeNetwork
  });
  const allowCsprTradeSubmit =
    options.allowCsprTradeSubmit ??
    process.env.OXYS_CSPR_TRADE_ALLOW_SUBMIT === "true";

  server.tool(
    "oxys_add_memory",
    "Store policy, strategy, trade, feedback, protocol, risk, or lesson memory for an agent.",
    memoryInputSchema.shape,
    async (input: MemoryInput) => {
      const memory = apiClient
        ? await apiClient.memory.add(input)
        : await requireLocalSdk(sdk).oxys.memory.add(input);
      return jsonResult({ memory });
    }
  );

  server.tool(
    "oxys_get_profile",
    "Return stable agent profile memory plus recent dynamic memory and optional search results.",
    {
      agentId: z.string().min(1),
      query: z.string().optional(),
      limit: z.number().int().positive().max(50).optional()
    },
    async (input: { agentId: string; query?: string; limit?: number }) => {
      const profile = apiClient
        ? await apiClient.profile.get(input)
        : await requireLocalSdk(sdk).oxys.profile.get(input);
      return jsonResult({ profile });
    }
  );

  server.tool(
    "oxys_context_for_trade_plan",
    "Retrieve relevant context for a transaction plan before risk review.",
    tradePlanSchema.shape,
    async (input: TradePlan) => {
      const context = apiClient
        ? await apiClient.context.forTradePlan(input)
        : await requireLocalSdk(sdk).oxys.context.forTradePlan(input);
      return jsonResult({ context });
    }
  );

  server.tool(
    "oxys_review_plan",
    "Review a transaction plan and return ALLOW, WARN, BLOCK, or REQUIRE_HUMAN.",
    tradePlanSchema.shape,
    async (input) => {
      if (apiClient) {
        const review = await apiClient.aegis.risk.reviewPlan(input);
        return jsonResult(review);
      }

      const localSdk = requireLocalSdk(sdk);
      const context = await localSdk.oxys.context.forTradePlan(input);
      const verdict = await localSdk.aegis.risk.reviewPlan({ ...input, context });
      const proof = await localSdk.proofs.recordDecision({
        agentId: input.agentId,
        planHash: verdict.planHash,
        reportHash: verdict.reportHash,
        decision: verdict.decision
      });
      return jsonResult({ context, verdict, proof });
    }
  );

  server.tool(
    "oxys_record_outcome",
    "Record what happened after a transaction plan was executed, failed, reverted, or skipped.",
    {
      agentId: z.string().min(1),
      planId: z.string().min(1),
      txHashes: z.array(z.string()).default([]),
      status: z.enum(["executed", "failed", "reverted", "skipped"]),
      pnlUsd: z.number().optional(),
      reason: z.string().optional(),
      notes: z.string().optional()
    },
    async (input) => {
      const outcome = apiClient
        ? await apiClient.trades.recordOutcome(input)
        : await requireLocalSdk(sdk).trades.recordOutcome(input);
      return jsonResult({ outcome });
    }
  );

  server.tool(
    "oxys_reflect_failure",
    "Create a failure lesson for a plan using stored outcome and context memory.",
    {
      agentId: z.string().min(1),
      planId: z.string().min(1)
    },
    async (input) => {
      const lesson = apiClient
        ? await apiClient.learning.reflect(input)
        : await requireLocalSdk(sdk).learning.reflect(input);
      return jsonResult({ lesson });
    }
  );

  server.tool(
    "cspr_trade_list_tools",
    "List live tools exposed by the configured CSPR.trade MCP server. Defaults to the public Casper mainnet endpoint.",
    {},
    async () => {
      const result = await listCsprTradeTools({
        endpoint: csprTradeMcpUrl,
        network: csprTradeNetwork,
        allowSubmitTransaction: allowCsprTradeSubmit
      });
      return jsonResult({
        endpoint: csprTradeMcpUrl ?? "self-hosted stdio",
        network: csprTradeNetwork,
        tools: result.tools
      });
    }
  );

  server.tool(
    "cspr_trade_call_tool",
    "Call a live CSPR.trade MCP tool through Oxys and always store the observation as agent memory. submit_transaction is blocked unless explicitly enabled.",
    {
      toolName: z.string().min(1),
      toolArgs: z.record(z.unknown()).default({}),
      agentId: z.string().min(1),
      saveMemory: z.literal(true).default(true),
      summary: z.string().optional()
    },
    async (input: {
      toolName: string;
      toolArgs: Record<string, unknown>;
      agentId: string;
      saveMemory: true;
      summary?: string;
    }) => {
      ensureMemorySink(apiClient, sdk);
      const risk = classifyCsprTradeTool(input.toolName);
      const requestMemory =
        risk === "read"
          ? undefined
          : await addMemory(apiClient, sdk, {
              agentId: input.agentId,
              kind: "risk_report",
              title: `CSPR.trade ${input.toolName} ${risk} request`,
              content: {
                network: "casper",
                casperNetwork: csprTradeNetwork,
                protocol: "cspr.trade",
                source: "cspr-trade-mcp",
                endpoint: csprTradeMcpUrl ?? "self-hosted stdio",
                reportType: "cspr_trade_tool_request",
                toolName: input.toolName,
                toolArgs: input.toolArgs,
                risk,
                status: "requested",
                observedAt: new Date().toISOString(),
                summary: input.summary
              },
              tags: ["casper", "cspr-trade", "mcp", input.toolName, risk, "request"]
            });
      let result: unknown;
      try {
        result = await callCsprTradeTool(
          {
            toolName: input.toolName,
            toolArgs: input.toolArgs
          },
          {
            endpoint: csprTradeMcpUrl,
            network: csprTradeNetwork,
            allowSubmitTransaction: allowCsprTradeSubmit
          }
        );
      } catch (error) {
        await addMemory(apiClient, sdk, {
          agentId: input.agentId,
          kind: risk === "submit" ? "blocked_action" : "risk_report",
          title: `CSPR.trade ${input.toolName} ${risk} failed`,
          content: {
            network: "casper",
            casperNetwork: csprTradeNetwork,
            protocol: "cspr.trade",
            source: "cspr-trade-mcp",
            endpoint: csprTradeMcpUrl ?? "self-hosted stdio",
            reportType: "cspr_trade_tool_failure",
            toolName: input.toolName,
            toolArgs: input.toolArgs,
            risk,
            status: "failed",
            observedAt: new Date().toISOString(),
            summary: input.summary,
            error: errorMessage(error)
          },
          tags: ["casper", "cspr-trade", "mcp", input.toolName, risk, "failed"]
        });
        throw error;
      }
      const memory = await addMemory(apiClient, sdk, {
        agentId: input.agentId,
        kind: risk === "read" ? "protocol_profile" : "risk_report",
        title: `CSPR.trade ${input.toolName} ${risk} observation`,
        content: {
          network: "casper",
          casperNetwork: csprTradeNetwork,
          protocol: "cspr.trade",
          source: "cspr-trade-mcp",
          endpoint: csprTradeMcpUrl ?? "self-hosted stdio",
          reportType: "cspr_trade_tool_observation",
          toolName: input.toolName,
          toolArgs: input.toolArgs,
          risk,
          status: "completed",
          observedAt: new Date().toISOString(),
          summary: input.summary,
          result
        },
        tags: ["casper", "cspr-trade", "mcp", input.toolName, risk, "observation"]
      });

      return jsonResult({ result, requestMemory, memory });
    }
  );

  server.tool(
    "cspr_trade_review_action",
    "Call or review a CSPR.trade action, store the observation, and return ALLOW, WARN, BLOCK, or REQUIRE_HUMAN before any signing/submission.",
    {
      agentId: z.string().min(1),
      toolName: z.string().min(1),
      toolArgs: z.record(z.unknown()).default({}),
      callTool: z.boolean().default(true),
      saveMemory: z.literal(true).default(true),
      summary: z.string().optional(),
      humanConfirmed: z.boolean().default(false),
      maxSpendCSPR: z.number().positive().default(10),
      maxPriceImpactPct: z.number().positive().default(2),
      maxSlippagePct: z.number().positive().default(1),
      observedSpendCSPR: z.number().nonnegative().optional(),
      observedPriceImpactPct: z.number().nonnegative().optional(),
      observedSlippagePct: z.number().nonnegative().optional()
    },
    async (input: {
      agentId: string;
      toolName: string;
      toolArgs: Record<string, unknown>;
      callTool: boolean;
      saveMemory: true;
      summary?: string;
      humanConfirmed: boolean;
      maxSpendCSPR: number;
      maxPriceImpactPct: number;
      maxSlippagePct: number;
      observedSpendCSPR?: number;
      observedPriceImpactPct?: number;
      observedSlippagePct?: number;
    }) => {
      ensureMemorySink(apiClient, sdk);
      const risk = classifyCsprTradeTool(input.toolName);
      const shouldCallTool =
        input.callTool && !(risk === "submit" && !allowCsprTradeSubmit);
      const requestMemory =
        shouldCallTool && risk !== "read"
          ? await addMemory(apiClient, sdk, {
              agentId: input.agentId,
              kind: "risk_report",
              title: `CSPR.trade ${input.toolName} ${risk} review request`,
              content: {
                network: "casper",
                casperNetwork: csprTradeNetwork,
                protocol: "cspr.trade",
                source: "cspr-trade-mcp",
                endpoint: csprTradeMcpUrl ?? "self-hosted stdio",
                reportType: "cspr_trade_review_request",
                toolName: input.toolName,
                toolArgs: input.toolArgs,
                risk,
                status: "requested",
                observedAt: new Date().toISOString(),
                summary: input.summary
              },
              tags: ["casper", "cspr-trade", "review", input.toolName, risk, "request"]
            })
          : undefined;
      const result = shouldCallTool
        ? await callCsprTradeTool(
            {
              toolName: input.toolName,
              toolArgs: input.toolArgs
            },
            {
              endpoint: csprTradeMcpUrl,
              network: csprTradeNetwork,
              allowSubmitTransaction: allowCsprTradeSubmit
            }
          )
        : undefined;
      const metrics = {
        spendCSPR:
          input.observedSpendCSPR ?? extractNumericMetric(result, ["amountIn", "spendCSPR", "csprAmount"]),
        priceImpactPct:
          input.observedPriceImpactPct ??
          extractNumericMetric(result, ["priceImpactPct", "priceImpact", "priceImpactPercent"]),
        slippagePct:
          input.observedSlippagePct ??
          extractNumericMetric(result, ["slippagePct", "slippage", "slippagePercent"])
      };
      const findings = reviewCsprTradeAction({
        risk,
        humanConfirmed: input.humanConfirmed,
        metrics,
        maxSpendCSPR: input.maxSpendCSPR,
        maxPriceImpactPct: input.maxPriceImpactPct,
        maxSlippagePct: input.maxSlippagePct
      });
      const decision = decideFindings(findings);
      const memory = await addMemory(apiClient, sdk, {
        agentId: input.agentId,
        kind: decision === "BLOCK" ? "blocked_action" : "risk_report",
        title: `CSPR.trade ${decision}: ${input.toolName}`,
        content: {
          network: "casper",
          casperNetwork: csprTradeNetwork,
          protocol: "cspr.trade",
          source: "cspr-trade-mcp",
          endpoint: csprTradeMcpUrl ?? "self-hosted stdio",
          reportType: "cspr_trade_action_review",
          toolName: input.toolName,
          toolArgs: input.toolArgs,
          risk,
          status: "reviewed",
          observedAt: new Date().toISOString(),
          summary: input.summary,
          policy: {
            maxSpendCSPR: input.maxSpendCSPR,
            maxPriceImpactPct: input.maxPriceImpactPct,
            maxSlippagePct: input.maxSlippagePct,
            submitTransactionsAllowed: allowCsprTradeSubmit
          },
          metrics,
          humanConfirmed: input.humanConfirmed,
          decision,
          findings,
          result
        },
        tags: ["casper", "cspr-trade", "review", input.toolName, decision.toLowerCase()]
      });

      return jsonResult({
        network: csprTradeNetwork,
        decision,
        findings,
        metrics,
        result,
        requestMemory,
        memory
      });
    }
  );

  server.tool(
    "cspr_cloud_rest_get",
    "Read CSPR.cloud REST API data and optionally store the response as agent memory. Requires CSPR_CLOUD_API_TOKEN or CSPR_CLOUD_ACCESS_TOKEN.",
    {
      path: z.string().min(1),
      query: z.record(z.union([z.string(), z.number(), z.boolean(), z.undefined()])).default({}),
      network: z.enum(["mainnet", "testnet"]).default("mainnet"),
      agentId: z.string().min(1).optional(),
      saveMemory: z.boolean().default(true),
      summary: z.string().optional()
    },
    async (input: {
      path: string;
      query: Record<string, string | number | boolean | undefined>;
      network: "mainnet" | "testnet";
      agentId?: string;
      saveMemory: boolean;
      summary?: string;
    }) => {
      const response = await getCsprCloudRest({
        path: input.path,
        query: input.query,
        network: input.network
      });
      const memory =
        input.agentId && input.saveMemory
          ? await addMemory(apiClient, sdk, {
              agentId: input.agentId,
              kind: "protocol_profile",
              title: `CSPR.cloud ${input.network} ${input.path}`,
              content: {
                network: "casper",
                source: "cspr-cloud-rest",
                apiNetwork: input.network,
                path: input.path,
                query: input.query,
                observedAt: new Date().toISOString(),
                summary: input.summary,
                response
              },
              tags: ["casper", "cspr-cloud", "rest", input.network]
            })
          : undefined;

      return jsonResult({ response, memory });
    }
  );

  return server;
}

async function addMemory(
  apiClient: OxysApiClient | undefined,
  sdk: Oxys | undefined,
  input: MemoryInput
) {
  return apiClient
    ? apiClient.memory.add(input)
    : requireLocalSdk(sdk).oxys.memory.add(input);
}

function ensureMemorySink(
  apiClient: OxysApiClient | undefined,
  sdk: Oxys | undefined
) {
  if (!apiClient && !sdk) {
    throw new Error(
      "CSPR.trade actions require Oxys memory persistence. Set OXYS_API_KEY or enable local fallback before calling Casper trade tools."
    );
  }
}

function requireLocalSdk(sdk: Oxys | undefined) {
  if (!sdk) {
    throw new Error(
      "Oxys MCP requires an API key. Set OXYS_API_KEY or pass a Bearer token."
    );
  }
  return sdk;
}

function jsonResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

type Finding = {
  code: string;
  severity: "info" | "warning" | "critical";
  message: string;
};

function reviewCsprTradeAction(input: {
  risk: "read" | "build" | "submit";
  humanConfirmed: boolean;
  metrics: {
    spendCSPR?: number;
    priceImpactPct?: number;
    slippagePct?: number;
  };
  maxSpendCSPR: number;
  maxPriceImpactPct: number;
  maxSlippagePct: number;
}): Finding[] {
  const findings: Finding[] = [];

  if (input.risk === "submit") {
    findings.push({
      code: "CSPR_TRADE_SUBMIT_BLOCKED",
      severity: "critical",
      message: "Transaction submission is disabled for this demo."
    });
  }

  if (input.risk === "build" && input.humanConfirmed !== true) {
    findings.push({
      code: "CSPR_TRADE_BUILD_REQUIRES_HUMAN",
      severity: "warning",
      message: "CSPR.trade transaction-build actions require human confirmation before signing."
    });
  }

  if (
    input.metrics.spendCSPR !== undefined &&
    input.metrics.spendCSPR > input.maxSpendCSPR
  ) {
    findings.push({
      code: "CSPR_TRADE_SPEND_LIMIT",
      severity: "critical",
      message: `Observed spend ${input.metrics.spendCSPR} CSPR exceeds maxSpendCSPR ${input.maxSpendCSPR}.`
    });
  }

  if (
    input.metrics.priceImpactPct !== undefined &&
    input.metrics.priceImpactPct > input.maxPriceImpactPct
  ) {
    findings.push({
      code: "CSPR_TRADE_PRICE_IMPACT_LIMIT",
      severity: "warning",
      message: `Observed price impact ${input.metrics.priceImpactPct}% exceeds maxPriceImpactPct ${input.maxPriceImpactPct}%.`
    });
  }

  if (
    input.metrics.slippagePct !== undefined &&
    input.metrics.slippagePct > input.maxSlippagePct
  ) {
    findings.push({
      code: "CSPR_TRADE_SLIPPAGE_LIMIT",
      severity: "warning",
      message: `Observed slippage ${input.metrics.slippagePct}% exceeds maxSlippagePct ${input.maxSlippagePct}%.`
    });
  }

  if (findings.length === 0) {
    findings.push({
      code: "CSPR_TRADE_NO_BLOCKING_RISK_FOUND",
      severity: "info",
      message: "CSPR.trade action matches the configured guardrails."
    });
  }

  return findings;
}

function decideFindings(findings: Finding[]) {
  if (findings.some((finding) => finding.severity === "critical")) return "BLOCK";
  if (findings.some((finding) => finding.severity === "warning")) return "REQUIRE_HUMAN";
  return "ALLOW";
}

function extractNumericMetric(
  value: unknown,
  keys: string[]
): number | undefined {
  const candidates = collectValues(value);
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    for (const [key, raw] of Object.entries(candidate)) {
      if (keys.some((target) => target.toLowerCase() === key.toLowerCase())) {
        const parsed = coerceNumber(raw);
        if (parsed !== undefined) return parsed;
      }
    }
  }
  return undefined;
}

function collectValues(value: unknown): Record<string, unknown>[] {
  if (typeof value === "string") {
    try {
      return collectValues(JSON.parse(value));
    } catch {
      return [];
    }
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectValues(item));
  }
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const nested = Object.values(record).flatMap((item) => {
    if (typeof item === "string") {
      try {
        return collectValues(JSON.parse(item));
      } catch {
        return [];
      }
    }
    return collectValues(item);
  });
  return [record, ...nested];
}

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/%$/, ""));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
