import { createId, hashJson } from "./hash.js";
import type { MemoryClient } from "./memory.js";
import type { MemoryRecord, RiskDecision, RiskFinding } from "./types.js";

export type CasperAgentActionSurface =
  | "x402"
  | "mcp"
  | "casper-mcp"
  | "cspr-trade"
  | "cspr-cloud"
  | "cspr-click"
  | "odra"
  | "streaming"
  | "eip-712"
  | "manual";

export type CasperAgentActionType =
  | "x402_payment"
  | "defi_swap"
  | "liquidity_action"
  | "contract_deploy"
  | "contract_upgrade"
  | "rwa_attestation"
  | "chain_query"
  | "event_monitoring"
  | "typed_data_signing"
  | "tool_call";

export type CasperMcpRisk = "read" | "write" | "danger";

export type CasperAiToolkitSurface =
  | "x402-facilitator"
  | "casper-mcp-server"
  | "cspr-trade-mcp"
  | "cspr-click-skill"
  | "cspr-cloud-skill"
  | "odra-framework"
  | "casper-eip-712";

export type CasperToolkitProfileInput = {
  agentId: string;
  surfaces?: CasperAiToolkitSurface[];
  sourceUrl?: string;
};

export type CasperAgentGuardrailPolicy = {
  allowedServices: string[];
  allowedMcpServers: string[];
  maxSpendPerRequestUsd: number;
  maxSessionSpendUsd: number;
  maxRequestsPerSession: number;
  maxQuoteAgeMs: number;
  requireHumanForX402AboveUsd: number;
  requireHumanForDeFiWrites: boolean;
  requireHumanForContractDeploys: boolean;
  blockDangerousMcpTools: boolean;
};

export type CasperAgentGuardrailPolicyInput = Partial<CasperAgentGuardrailPolicy> & {
  agentId: string;
  title?: string;
  notes?: string;
};

export type CasperX402QuoteInput = {
  agentId: string;
  service: string;
  endpoint: string;
  amountUsd?: string | number;
  amountCspr?: string | number;
  currency?: "CSPR" | "USDC" | string;
  facilitator?: string;
  observedAt?: string;
  expiresAt?: string;
  raw?: Record<string, unknown>;
};

export type CasperX402HeadersInput = {
  agentId: string;
  service: string;
  endpoint: string;
  headers: Record<string, string | number | undefined>;
  amountUsd?: string | number;
  observedAt?: string;
};

export type CasperX402PaymentStatus = "quoted" | "signed" | "settled" | "failed";

export type CasperX402PaymentAttemptInput = CasperX402QuoteInput & {
  status: CasperX402PaymentStatus;
  paymentAddress?: string;
  paymentAmount?: string | number;
  paymentNetwork?: string;
  paymentProof?: string;
  transactionHash?: string;
  error?: string;
};

export type CasperMcpObservationInput = {
  agentId: string;
  server: string;
  tool: string;
  risk: CasperMcpRisk;
  observedAt?: string;
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
  summary?: string;
};

export type CasperStreamingEventType =
  | "deploy"
  | "transfer"
  | "contract_call"
  | "contract_state"
  | "balance"
  | "staking";

export type CasperStreamingEventInput = {
  agentId: string;
  eventType: CasperStreamingEventType;
  source?: "cspr-cloud" | "casper-mcp" | "manual";
  eventId?: string;
  blockHeight?: string | number;
  deployHash?: string;
  account?: string;
  contractHash?: string;
  contractPackageHash?: string;
  amount?: string | number;
  observedAt?: string;
  summary?: string;
  raw?: Record<string, unknown>;
};

export type CasperContractWorkflowStage =
  | "generated"
  | "tested"
  | "deploy_planned"
  | "deployed"
  | "upgrade_planned"
  | "upgraded"
  | "failed";

export type CasperContractWorkflowInput = {
  agentId: string;
  contractName: string;
  framework?: "odra" | "casper-wasm" | "manual";
  workflowStage: CasperContractWorkflowStage;
  docsSource?: string;
  files?: string[];
  tests?: {
    passed?: number;
    failed?: number;
    command?: string;
  };
  contractHash?: string;
  contractPackageHash?: string;
  deployHash?: string;
  upgradeable?: boolean;
  observedAt?: string;
  summary?: string;
  raw?: Record<string, unknown>;
};

export type CasperAgentActionReviewInput = {
  agentId: string;
  intent?: string;
  surface: CasperAgentActionSurface;
  actionType: CasperAgentActionType;
  service?: string;
  endpoint?: string;
  paymentUsd?: string | number;
  sessionSpendUsd?: string | number;
  requestsInSession?: number;
  quoteObservedAt?: string;
  mcpServer?: string;
  mcpTool?: string;
  mcpRisk?: CasperMcpRisk;
  readOnlyMcp?: boolean;
  humanConfirmed?: boolean;
  proposedAt?: string;
  policy?: Partial<CasperAgentGuardrailPolicy>;
  rawAction?: Record<string, unknown>;
};

export type CasperAgentActionVerdict = {
  actionId: string;
  actionHash: string;
  reportHash: string;
  decision: RiskDecision;
  riskScore: number;
  reason: string;
  findings: RiskFinding[];
  matchedPolicyTitle?: string;
  report: MemoryRecord;
};

const DEFAULT_CASPER_POLICY: CasperAgentGuardrailPolicy = {
  allowedServices: [],
  allowedMcpServers: [],
  maxSpendPerRequestUsd: 5,
  maxSessionSpendUsd: 25,
  maxRequestsPerSession: 20,
  maxQuoteAgeMs: 5 * 60 * 1000,
  requireHumanForX402AboveUsd: 1,
  requireHumanForDeFiWrites: true,
  requireHumanForContractDeploys: true,
  blockDangerousMcpTools: true
};

const DEFAULT_TOOLKIT_SURFACES: CasperAiToolkitSurface[] = [
  "x402-facilitator",
  "casper-mcp-server",
  "cspr-trade-mcp",
  "cspr-click-skill",
  "cspr-cloud-skill",
  "odra-framework",
  "casper-eip-712"
];

const TOOLKIT_SURFACE_MEMORY: Record<
  CasperAiToolkitSurface,
  {
    kind: "skill" | "protocol_profile";
    title: string;
    capabilities: string[];
    tags: string[];
  }
> = {
  "x402-facilitator": {
    kind: "protocol_profile",
    title: "Casper x402 Facilitator",
    capabilities: [
      "HTTP 402 payment-required flow",
      "pay-per-request agent commerce",
      "cryptographic payment proof verification"
    ],
    tags: ["x402", "micropayments", "facilitator"]
  },
  "casper-mcp-server": {
    kind: "protocol_profile",
    title: "Casper MCP Server",
    capabilities: [
      "query balances",
      "submit deploys",
      "read contract state",
      "chain access through natural language tools"
    ],
    tags: ["mcp", "chain-query", "deploys"]
  },
  "cspr-trade-mcp": {
    kind: "protocol_profile",
    title: "CSPR.trade MCP Server",
    capabilities: [
      "get swap quotes",
      "trade through a DEX MCP server",
      "provide liquidity",
      "manage DeFi portfolios"
    ],
    tags: ["mcp", "defi", "cspr-trade"]
  },
  "cspr-click-skill": {
    kind: "skill",
    title: "CSPR.click AI Agent Skill",
    capabilities: [
      "wallet creation and key management",
      "transaction building and signing",
      "event handling",
      "CSPR.cloud API access"
    ],
    tags: ["agent-skill", "wallet", "signing"]
  },
  "cspr-cloud-skill": {
    kind: "skill",
    title: "CSPR.cloud AI Agent Skill",
    capabilities: [
      "REST API access",
      "Streaming API access",
      "Node API access",
      "read and write Casper data at scale"
    ],
    tags: ["agent-skill", "cspr-cloud", "streaming"]
  },
  "odra-framework": {
    kind: "skill",
    title: "Odra Framework",
    capabilities: [
      "AI-discoverable llms.txt documentation",
      "generate Casper smart contracts",
      "test Casper contracts",
      "deploy Casper contracts"
    ],
    tags: ["odra", "smart-contracts", "llms"]
  },
  "casper-eip-712": {
    kind: "protocol_profile",
    title: "casper-eip-712",
    capabilities: [
      "off-chain typed-data signing",
      "gasless meta-transaction support",
      "human-readable signing payloads",
      "structured verification for agent commerce"
    ],
    tags: ["eip-712", "typed-data", "signing"]
  }
};

export class CasperAgentInfraClient {
  constructor(private readonly memory: MemoryClient) {}

  async seedAiToolkitProfile(input: CasperToolkitProfileInput): Promise<MemoryRecord[]> {
    const sourceUrl = input.sourceUrl ?? "https://www.casper.network/ai";
    const surfaces = input.surfaces ?? DEFAULT_TOOLKIT_SURFACES;

    return Promise.all(
      surfaces.map((surface) => {
        const item = TOOLKIT_SURFACE_MEMORY[surface];
        return this.memory.add({
          agentId: input.agentId,
          kind: item.kind,
          title: item.title,
          content: {
            network: "casper",
            surface,
            sourceUrl,
            capabilityType: "casper_ai_toolkit_surface",
            capabilities: item.capabilities
          },
          tags: ["casper", "ai-toolkit", surface, ...item.tags]
        });
      })
    );
  }

  async createAgentGuardrailPolicy(
    input: CasperAgentGuardrailPolicyInput
  ): Promise<MemoryRecord> {
    const policy = normalizePolicy(input);
    return this.memory.add({
      agentId: input.agentId,
      kind: "policy",
      title: input.title ?? "Casper agent x402 and MCP guardrails",
      content: {
        network: "casper",
        surface: "casper-ai-toolkit",
        policyType: "casper_agent_guardrails",
        ...policy,
        notes: input.notes
      },
      tags: ["casper", "policy", "x402", "mcp", "agent-guardrails"]
    });
  }

  async rememberX402Quote(input: CasperX402QuoteInput): Promise<MemoryRecord> {
    const observedAt = input.observedAt ?? new Date().toISOString();
    const service = normalizeName(input.service);
    return this.memory.add({
      agentId: input.agentId,
      kind: "protocol_profile",
      title: `Casper x402 quote: ${service} ${input.endpoint}`,
      content: {
        network: "casper",
        surface: "x402",
        snapshotType: "payment_quote",
        service,
        endpoint: input.endpoint,
        amountUsd: coerceNumber(input.amountUsd),
        amountCspr: input.amountCspr === undefined ? undefined : String(input.amountCspr),
        currency: input.currency ?? "CSPR",
        facilitator: input.facilitator ?? "casper-x402",
        observedAt,
        expiresAt: input.expiresAt,
        raw: input.raw
      },
      tags: ["casper", "x402", "payment-quote", service]
    });
  }

  async rememberX402QuoteFromHeaders(input: CasperX402HeadersInput): Promise<MemoryRecord> {
    return this.rememberX402Quote(createCasperX402QuoteFromHeaders(input));
  }

  async rememberX402PaymentAttempt(
    input: CasperX402PaymentAttemptInput
  ): Promise<MemoryRecord> {
    const observedAt = input.observedAt ?? new Date().toISOString();
    const service = normalizeName(input.service);
    return this.memory.add({
      agentId: input.agentId,
      kind: input.status === "failed" ? "risk_report" : "protocol_profile",
      title: `Casper x402 ${input.status}: ${service} ${input.endpoint}`,
      content: {
        network: "casper",
        surface: "x402",
        snapshotType: "payment_attempt",
        status: input.status,
        service,
        endpoint: input.endpoint,
        amountUsd: coerceNumber(input.amountUsd),
        amountCspr: input.amountCspr === undefined ? undefined : String(input.amountCspr),
        currency: input.currency ?? "CSPR",
        facilitator: input.facilitator ?? "casper-x402",
        paymentAddress: input.paymentAddress,
        paymentAmount: input.paymentAmount === undefined ? undefined : String(input.paymentAmount),
        paymentNetwork: input.paymentNetwork,
        paymentProof: input.paymentProof,
        transactionHash: input.transactionHash,
        error: input.error,
        observedAt,
        expiresAt: input.expiresAt,
        raw: input.raw
      },
      tags: ["casper", "x402", "payment-attempt", input.status, service]
    });
  }

  async rememberMcpObservation(input: CasperMcpObservationInput): Promise<MemoryRecord> {
    const observedAt = input.observedAt ?? new Date().toISOString();
    const server = normalizeName(input.server);
    return this.memory.add({
      agentId: input.agentId,
      kind: input.risk === "read" ? "protocol_profile" : "risk_report",
      title: `Casper MCP ${server}.${input.tool} ${input.risk} observation`,
      content: {
        network: "casper",
        surface: "mcp",
        snapshotType: "tool_observation",
        observedAt,
        server,
        tool: input.tool,
        risk: input.risk,
        request: input.request,
        response: input.response,
        summary: input.summary
      },
      tags: ["casper", "mcp", "tool-observation", server, input.risk]
    });
  }

  async rememberStreamingEvent(input: CasperStreamingEventInput): Promise<MemoryRecord> {
    const observedAt = input.observedAt ?? new Date().toISOString();
    return this.memory.add({
      agentId: input.agentId,
      kind: "protocol_profile",
      title: `Casper streaming event: ${input.eventType}`,
      content: {
        network: "casper",
        surface: "streaming",
        snapshotType: "streaming_event",
        source: input.source ?? "cspr-cloud",
        eventType: input.eventType,
        eventId: input.eventId,
        blockHeight: input.blockHeight === undefined ? undefined : String(input.blockHeight),
        deployHash: input.deployHash,
        account: input.account,
        contractHash: input.contractHash,
        contractPackageHash: input.contractPackageHash,
        amount: input.amount === undefined ? undefined : String(input.amount),
        observedAt,
        summary: input.summary,
        raw: input.raw
      },
      tags: ["casper", "streaming", input.eventType, input.source ?? "cspr-cloud"]
    });
  }

  async rememberContractWorkflow(
    input: CasperContractWorkflowInput
  ): Promise<MemoryRecord> {
    const observedAt = input.observedAt ?? new Date().toISOString();
    return this.memory.add({
      agentId: input.agentId,
      kind:
        input.workflowStage === "failed" || input.workflowStage.endsWith("_planned")
          ? "risk_report"
          : "protocol_profile",
      title: `Casper contract ${input.workflowStage}: ${input.contractName}`,
      content: {
        network: "casper",
        surface: "odra",
        snapshotType: "contract_workflow",
        contractName: input.contractName,
        framework: input.framework ?? "odra",
        workflowStage: input.workflowStage,
        docsSource: input.docsSource ?? "https://odra.dev/llms.txt",
        files: input.files,
        tests: input.tests,
        contractHash: input.contractHash,
        contractPackageHash: input.contractPackageHash,
        deployHash: input.deployHash,
        upgradeable: input.upgradeable,
        observedAt,
        summary: input.summary,
        raw: input.raw
      },
      tags: [
        "casper",
        "odra",
        "contract-workflow",
        input.workflowStage,
        normalizeName(input.contractName)
      ]
    });
  }

  async assessAgentAction(
    input: CasperAgentActionReviewInput
  ): Promise<CasperAgentActionVerdict> {
    const policyMemory = await this.findLatestPolicy(input.agentId);
    const policy = normalizePolicy({
      agentId: input.agentId,
      ...(policyMemory?.content ?? {}),
      ...(input.policy ?? {})
    });
    const findings: RiskFinding[] = [];
    let requiresHuman = false;
    const proposedAt = input.proposedAt ?? new Date().toISOString();
    const paymentUsd = coerceNumber(input.paymentUsd);
    const service = input.service ? normalizeName(input.service) : undefined;
    const mcpServer = input.mcpServer ? normalizeName(input.mcpServer) : undefined;

    if (
      service &&
      policy.allowedServices.length > 0 &&
      !policy.allowedServices.map(normalizeName).includes(service)
    ) {
      findings.push({
        code: "CASPER_SERVICE_NOT_ALLOWED",
        severity: "critical",
        message: `${service} is outside the allowed Casper x402 services.`
      });
    }

    if (
      mcpServer &&
      policy.allowedMcpServers.length > 0 &&
      !policy.allowedMcpServers.map(normalizeName).includes(mcpServer)
    ) {
      findings.push({
        code: "CASPER_MCP_SERVER_NOT_ALLOWED",
        severity: "critical",
        message: `${mcpServer} is outside the allowed Casper MCP servers.`
      });
    }

    if (input.actionType === "x402_payment") {
      if (paymentUsd === undefined) {
        findings.push({
          code: "CASPER_X402_AMOUNT_MISSING",
          severity: "warning",
          message: "No USD-equivalent x402 payment amount was available for spend checks."
        });
        requiresHuman = true;
      } else {
        if (paymentUsd > policy.maxSpendPerRequestUsd) {
          findings.push({
            code: "CASPER_X402_REQUEST_SPEND_LIMIT",
            severity: "critical",
            message: `x402 payment ${formatUsd(paymentUsd)} exceeds maxSpendPerRequestUsd ${formatUsd(policy.maxSpendPerRequestUsd)}.`
          });
        }
        if (paymentUsd > policy.requireHumanForX402AboveUsd) {
          findings.push({
            code: "CASPER_X402_HUMAN_THRESHOLD",
            severity: "warning",
            message: `x402 payment ${formatUsd(paymentUsd)} exceeds the human-review threshold ${formatUsd(policy.requireHumanForX402AboveUsd)}.`
          });
          requiresHuman = true;
        }
      }

      const sessionSpendUsd = coerceNumber(input.sessionSpendUsd);
      if (sessionSpendUsd !== undefined && sessionSpendUsd > policy.maxSessionSpendUsd) {
        findings.push({
          code: "CASPER_X402_SESSION_SPEND_LIMIT",
          severity: "critical",
          message: `Projected session spend ${formatUsd(sessionSpendUsd)} exceeds maxSessionSpendUsd ${formatUsd(policy.maxSessionSpendUsd)}.`
        });
      }

      if (
        input.requestsInSession !== undefined &&
        input.requestsInSession > policy.maxRequestsPerSession
      ) {
        findings.push({
          code: "CASPER_X402_REQUEST_COUNT_LIMIT",
          severity: "warning",
          message: `Session request count ${input.requestsInSession} exceeds maxRequestsPerSession ${policy.maxRequestsPerSession}.`
        });
        requiresHuman = true;
      }

      if (
        input.quoteObservedAt &&
        Date.parse(proposedAt) - Date.parse(input.quoteObservedAt) > policy.maxQuoteAgeMs
      ) {
        findings.push({
          code: "CASPER_X402_STALE_QUOTE",
          severity: "warning",
          message: "The x402 payment quote is older than the policy allows."
        });
        requiresHuman = true;
      }
    }

    const mcpRisk = input.mcpRisk;
    if (mcpRisk === "danger" && policy.blockDangerousMcpTools) {
      findings.push({
        code: "CASPER_DANGEROUS_MCP_TOOL",
        severity: "critical",
        message: "The selected Casper MCP tool was marked dangerous by the agent runtime."
      });
    }

    if ((mcpRisk === "write" || mcpRisk === "danger") && input.humanConfirmed !== true) {
      findings.push({
        code: "CASPER_MCP_WRITE_REQUIRES_HUMAN",
        severity: "warning",
        message: "Casper MCP write actions require explicit human confirmation."
      });
      requiresHuman = true;
    }

    if (input.readOnlyMcp === false && mcpRisk !== "read") {
      findings.push({
        code: "CASPER_MCP_READ_ONLY_NOT_CONFIRMED",
        severity: "warning",
        message: "The MCP session was not marked read-only for this review."
      });
      requiresHuman = true;
    }

    if (
      (input.actionType === "defi_swap" || input.actionType === "liquidity_action") &&
      policy.requireHumanForDeFiWrites &&
      input.humanConfirmed !== true
    ) {
      findings.push({
        code: "CASPER_DEFI_WRITE_REQUIRES_HUMAN",
        severity: "warning",
        message: "Casper DeFi write actions require human confirmation by policy."
      });
      requiresHuman = true;
    }

    if (
      (input.actionType === "contract_deploy" ||
        input.actionType === "contract_upgrade") &&
      policy.requireHumanForContractDeploys &&
      input.humanConfirmed !== true
    ) {
      findings.push({
        code: "CASPER_CONTRACT_DEPLOY_REQUIRES_HUMAN",
        severity: "warning",
        message: "Casper contract deploys and upgrades require human confirmation by policy."
      });
      requiresHuman = true;
    }

    if (findings.length === 0) {
      findings.push({
        code: "CASPER_NO_BLOCKING_RISK_FOUND",
        severity: "info",
        message: "Casper agent action matches the available guardrail policy."
      });
    }

    const riskScore = calculateRiskScore(findings);
    const decision = decide(findings, riskScore, requiresHuman);
    const actionId = createId("casper_action");
    const actionHash = hashJson({
      ...input,
      service,
      mcpServer,
      proposedAt
    });
    const reason = summarizeDecision(decision, findings);

    const report = await this.memory.add({
      agentId: input.agentId,
      kind: decision === "BLOCK" ? "blocked_action" : "risk_report",
      title: `Casper ${decision}: ${input.intent ?? input.actionType}`,
      content: {
        network: "casper",
        surface: input.surface,
        reportType: "casper_agent_action_review",
        actionId,
        actionHash,
        proposedAt,
        actionType: input.actionType,
        intent: input.intent,
        service,
        endpoint: input.endpoint,
        paymentUsd,
        sessionSpendUsd: coerceNumber(input.sessionSpendUsd),
        requestsInSession: input.requestsInSession,
        mcpServer,
        mcpTool: input.mcpTool,
        mcpRisk,
        readOnlyMcp: input.readOnlyMcp,
        humanConfirmed: input.humanConfirmed,
        decision,
        riskScore,
        reason,
        findings,
        policy,
        matchedPolicyTitle: policyMemory?.title,
        rawAction: input.rawAction
      },
      tags: ["casper", input.surface, "agent-action-review", decision.toLowerCase()]
    });

    return {
      actionId,
      actionHash,
      reportHash: report.hash,
      decision,
      riskScore,
      reason,
      findings,
      matchedPolicyTitle: policyMemory?.title,
      report
    };
  }

  private async findLatestPolicy(agentId: string): Promise<MemoryRecord | undefined> {
    const policies = await this.memory.search({
      agentId,
      kinds: ["policy"],
      query: "casper agent x402 mcp guardrails",
      limit: 10
    });

    return policies.find((policy) => {
      const content = policy.content as Record<string, unknown>;
      return content.network === "casper" && content.policyType === "casper_agent_guardrails";
    });
  }
}

export function defaultCasperAgentPolicy(): CasperAgentGuardrailPolicy {
  return { ...DEFAULT_CASPER_POLICY };
}

export function createCasperX402QuoteFromHeaders(
  input: CasperX402HeadersInput
): CasperX402QuoteInput {
  const paymentAddress = getHeader(input.headers, "x-payment-address");
  const paymentAmount = getHeader(input.headers, "x-payment-amount");
  const paymentNetwork = getHeader(input.headers, "x-payment-network") ?? "casper";
  const paymentProof = getHeader(input.headers, "x-payment");

  return {
    agentId: input.agentId,
    service: input.service,
    endpoint: input.endpoint,
    amountUsd: input.amountUsd,
    amountCspr: paymentAmount ? motesToCspr(paymentAmount) : undefined,
    currency: paymentNetwork.toLowerCase() === "casper" ? "CSPR" : paymentNetwork,
    facilitator: "casper-x402",
    observedAt: input.observedAt,
    raw: {
      paymentAddress,
      paymentAmount,
      paymentNetwork,
      paymentProof,
      headers: input.headers
    }
  };
}

function getHeader(
  headers: Record<string, string | number | undefined>,
  name: string
): string | undefined {
  const normalized = name.toLowerCase();
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === normalized);
  const value = key ? headers[key] : undefined;
  return value === undefined ? undefined : String(value);
}

function motesToCspr(value: string): string {
  if (!/^\d+$/.test(value)) return value;
  const padded = value.padStart(10, "0");
  const whole = padded.slice(0, -9) || "0";
  const fractional = padded.slice(-9).replace(/0+$/, "");
  return fractional ? `${whole}.${fractional}` : whole;
}

function normalizePolicy(
  input: Partial<CasperAgentGuardrailPolicy> & { agentId?: string }
): CasperAgentGuardrailPolicy {
  return {
    allowedServices:
      input.allowedServices?.map(normalizeName) ?? DEFAULT_CASPER_POLICY.allowedServices,
    allowedMcpServers:
      input.allowedMcpServers?.map(normalizeName) ?? DEFAULT_CASPER_POLICY.allowedMcpServers,
    maxSpendPerRequestUsd: positiveNumber(
      input.maxSpendPerRequestUsd,
      DEFAULT_CASPER_POLICY.maxSpendPerRequestUsd
    ),
    maxSessionSpendUsd: positiveNumber(
      input.maxSessionSpendUsd,
      DEFAULT_CASPER_POLICY.maxSessionSpendUsd
    ),
    maxRequestsPerSession: positiveNumber(
      input.maxRequestsPerSession,
      DEFAULT_CASPER_POLICY.maxRequestsPerSession
    ),
    maxQuoteAgeMs: positiveNumber(input.maxQuoteAgeMs, DEFAULT_CASPER_POLICY.maxQuoteAgeMs),
    requireHumanForX402AboveUsd: positiveNumber(
      input.requireHumanForX402AboveUsd,
      DEFAULT_CASPER_POLICY.requireHumanForX402AboveUsd
    ),
    requireHumanForDeFiWrites:
      input.requireHumanForDeFiWrites ?? DEFAULT_CASPER_POLICY.requireHumanForDeFiWrites,
    requireHumanForContractDeploys:
      input.requireHumanForContractDeploys ??
      DEFAULT_CASPER_POLICY.requireHumanForContractDeploys,
    blockDangerousMcpTools:
      input.blockDangerousMcpTools ?? DEFAULT_CASPER_POLICY.blockDangerousMcpTools
  };
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function positiveNumber(value: unknown, fallback: number): number {
  const parsed = coerceNumber(value);
  return parsed !== undefined && parsed > 0 ? parsed : fallback;
}

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function calculateRiskScore(findings: RiskFinding[]): number {
  const score = findings.reduce((total, finding) => {
    if (finding.severity === "critical") return total + 60;
    if (finding.severity === "warning") return total + 25;
    return total;
  }, 0);

  return Math.min(score, 100);
}

function decide(
  findings: RiskFinding[],
  riskScore: number,
  requiresHuman: boolean
): RiskDecision {
  if (findings.some((finding) => finding.severity === "critical")) return "BLOCK";
  if (requiresHuman || riskScore >= 50) return "REQUIRE_HUMAN";
  if (findings.some((finding) => finding.severity === "warning")) return "WARN";
  return "ALLOW";
}

function summarizeDecision(decision: RiskDecision, findings: RiskFinding[]): string {
  if (decision === "ALLOW") return "Casper agent action matches the guardrail policy.";
  const important =
    findings.find((finding) => finding.severity === "critical") ??
    findings.find((finding) => finding.severity === "warning") ??
    findings[0];
  if (decision === "BLOCK") {
    return findings
      .filter((finding) => finding.severity === "critical")
      .slice(0, 3)
      .map((finding) => finding.message)
      .join(" ");
  }
  if (decision === "REQUIRE_HUMAN") {
    return `Human confirmation required: ${important.message}`;
  }
  return important.message;
}

function formatUsd(value: number): string {
  return `$${value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  })}`;
}
