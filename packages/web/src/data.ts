import type { LucideIcon } from "lucide-react";
import {
  Braces,
  Brain,
  CandlestickChart,
  Cloud,
  Database,
  GitBranch,
  KeyRound,
  Link2,
  Plug,
  RadioTower,
  ShieldCheck,
  Workflow,
  UserCircle2
} from "lucide-react";

export type Decision = "ALLOW" | "WARN" | "BLOCK" | "REQUIRE_HUMAN";

export type MemoryKind =
  | "agent_profile"
  | "skill"
  | "strategy"
  | "policy"
  | "trade_plan"
  | "executed_trade"
  | "risk_report"
  | "blocked_action"
  | "failure_lesson"
  | "human_feedback"
  | "protocol_profile";

export type MemorySource = "SDK" | "MCP" | "API" | "Manual";

export type MemoryNode = {
  id: string;
  kind: MemoryKind;
  title: string;
  detail: string;
  agentId: string;
  agentName: string;
  source: MemorySource;
  from: string;
  age: string;
  size: number;
  x: number;
  y: number;
  confidence: number;
  tags: string[];
  linked: string[];
  status: "synced" | "local";
};

export type ConnectionMethod = {
  id: "sdk" | "api" | "mcp" | "casper";
  title: string;
  subtitle: string;
  icon: LucideIcon;
  command: string;
  bullets: string[];
};

export const kindLabels: Record<MemoryKind, string> = {
  agent_profile: "Agent profile",
  skill: "Skill",
  strategy: "Strategy",
  policy: "Policy",
  trade_plan: "Trade plan",
  executed_trade: "Executed trade",
  risk_report: "Risk report",
  blocked_action: "Blocked action",
  failure_lesson: "Failure lesson",
  human_feedback: "Human feedback",
  protocol_profile: "Protocol profile"
};

export const sourceMeta: Record<
  MemorySource,
  { label: string; color: string; soft: string; detail: string }
> = {
  SDK: {
    label: "SDK",
    color: "#d64242",
    soft: "rgba(214, 66, 66, 0.08)",
    detail: "native Casper agent runtime"
  },
  MCP: {
    label: "MCP",
    color: "#2563eb",
    soft: "rgba(37, 99, 235, 0.08)",
    detail: "CSPR.trade or LLM tool call"
  },
  API: {
    label: "API",
    color: "#059669",
    soft: "rgba(5, 150, 105, 0.08)",
    detail: "HTTP service or worker"
  },
  Manual: {
    label: "Manual",
    color: "#d97706",
    soft: "rgba(217, 119, 6, 0.08)",
    detail: "operator dashboard entry"
  }
};

export const agentOptions = [
  { id: "agent-casper-01", name: "Casper Sentinel" },
  { id: "agent-cspr-trade-02", name: "CSPR Trade Guard" },
  { id: "agent-provenance-03", name: "CSPR Cloud Watch" }
];

export const stackItems = [
  {
    title: "CSPR.trade MCP",
    detail: "Live Casper mainnet market data, tokens, pairs, quote analysis, transaction-build review, and blocked submit paths.",
    icon: RadioTower
  },
  {
    title: "CSPR.cloud",
    detail: "Read-only Casper REST provenance for blocks, deploys, account data, and network state when an API token is configured.",
    icon: Cloud
  },
  {
    title: "Oxys Memory",
    detail: "Every Casper tool call and trade review is saved as workspace-scoped memory before it can affect future decisions.",
    icon: Database
  },
  {
    title: "Pre-signing Guardrails",
    detail: "Spend, slippage, price-impact, human-confirmation, and submit-transaction checks run before a signer sees an action.",
    icon: ShieldCheck
  }
];

export const connectionMethods: ConnectionMethod[] = [
  {
    id: "sdk",
    title: "TypeScript SDK",
    subtitle: "Best for teams wrapping Casper agents from Node or a TypeScript execution service.",
    icon: Braces,
    command: "npm install @oxys/sdk",
    bullets: [
      "Write Casper observations and policies from the agent runtime",
      "Fetch memory context before a CSPR.trade action",
      "Record reviews, outcomes, blocked actions, and lessons"
    ]
  },
  {
    id: "mcp",
    title: "Oxys MCP",
    subtitle: "Best for Codex, Claude, and LLM agents that need memory and risk tools beside CSPR.trade tools.",
    icon: Plug,
    command: "https://oxys-backend-production.up.railway.app/mcp",
    bullets: [
      "Expose memory, context, review, outcome, and reflection tools",
      "Force Casper trade calls to include agentId and saved memory",
      "Keep submit_transaction blocked unless explicitly enabled"
    ]
  },
  {
    id: "api",
    title: "REST API",
    subtitle: "Best for Python agents, monitoring workers, notebooks, and hosted risk services.",
    icon: Link2,
    command: "https://oxys-backend-production.up.railway.app/v1",
    bullets: [
      "POST /memory",
      "GET /profile and POST /context",
      "POST /review-plan and POST /learning/reflect"
    ]
  },
  {
    id: "casper",
    title: "Casper Integrations",
    subtitle: "Best for live Casper agents that need CSPR.trade tools, CSPR.cloud reads, and pre-signing review.",
    icon: CandlestickChart,
    command: "npm run mcp:cspr:probe",
    bullets: [
      "List and call CSPR.trade mainnet MCP tools through Oxys",
      "Persist every Casper call or review as agent memory",
      "Read CSPR.cloud provenance when CSPR_CLOUD_API_TOKEN is configured"
    ]
  }
];

export const demoPlan = {
  agentId: "agent-casper-01",
  intent: "Review sample transaction before Casper agent handoff",
  txs: [
    {
      chainId: 16661,
      to: "0x1111111111111111111111111111111111111111",
      data: "0x095ea7b30000000000000000000000002222222222222222222222222222222222222222ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      value: "0",
      label: "Sample blocked approval for guardrail demo"
    }
  ],
  metadata: { source: "web-dashboard-demo", network: "casper-mainnet" }
};

export const productPillars = [
  {
    title: "Casper memory before action",
    body: "The agent retrieves CSPR.trade observations, CSPR.cloud provenance, guardrails, prior reviews, and blocked actions before a trade handoff.",
    icon: Database
  },
  {
    title: "Guardrails around signing",
    body: "Oxys reviews CSPR.trade action plans and returns ALLOW, WARN, BLOCK, or REQUIRE_HUMAN without submitting deploys itself.",
    icon: ShieldCheck
  },
  {
    title: "Audit after outcomes",
    body: "Blocked actions, human approvals, failed paths, and Casper observations are stored as reusable evidence for future reviews.",
    icon: GitBranch
  }
];

export type ProductFeature = {
  id: string;
  num: string;
  title: string;
  headline: string;
  body: string;
  icon: LucideIcon;
};

export const productFeatures: ProductFeature[] = [
  {
    id: "memory",
    num: "01",
    title: "Memory",
    headline: "Persistent Casper context",
    body: "CSPR.trade token, pair, quote, slippage, and analysis responses are saved with agent identity before future reviews use them.",
    icon: Brain
  },
  {
    id: "risk",
    num: "02",
    title: "Risk Review",
    headline: "Pre-signing safety checks",
    body: "Casper actions pass through spend, price-impact, slippage, and human-confirmation policy before a signer or submit path is allowed.",
    icon: ShieldCheck
  },
  {
    id: "provenance",
    num: "03",
    title: "Provenance",
    headline: "Casper data attached to memory",
    body: "CSPR.cloud reads can be stored beside reviews so operators can trace network context, deploys, and block state.",
    icon: Cloud
  },
  {
    id: "blocked",
    num: "04",
    title: "Blocked Paths",
    headline: "Submit is off by default",
    body: "submit_transaction remains blocked unless explicitly enabled, and direct submit attempts leave a failure memory trail.",
    icon: KeyRound
  },
  {
    id: "profiles",
    num: "05",
    title: "Profiles",
    headline: "One-call Casper agent state",
    body: "Retrieve an agent profile plus recent CSPR.trade observations, policies, risk reports, and human feedback in one call.",
    icon: UserCircle2
  },
  {
    id: "context",
    num: "06",
    title: "Context",
    headline: "Relevant guardrail context",
    body: "Before an action is reviewed, Oxys retrieves matching policies, prior blocked actions, market observations, and risk memory.",
    icon: Workflow
  }
];

export type ComparisonRow = {
  aspect: string;
  legacy: string;
  oxys: string;
};

export const comparisonRows: ComparisonRow[] = [
  { aspect: "Market context", legacy: "Forgotten MCP responses", oxys: "Persistent CSPR.trade observations" },
  { aspect: "Trade risk", legacy: "Ad hoc checks before signing", oxys: "Spend, slippage, and price-impact guardrails" },
  { aspect: "Execution", legacy: "Agent can jump straight to write tools", oxys: "Build/submit paths gated by review and human approval" },
  { aspect: "Audit", legacy: "No durable trail", oxys: "Saved request, review, failure, and outcome memories" },
  { aspect: "Provenance", legacy: "Network context lost in logs", oxys: "CSPR.cloud reads attached to memory" },
  { aspect: "Control", legacy: "Submit tools exposed too early", oxys: "submit_transaction blocked by default" }
];

export type HowItWorksStep = {
  num: string;
  title: string;
  body: string;
};

export const howItWorksSteps: HowItWorksStep[] = [
  { num: "1", title: "Connect Casper", body: "Use the Oxys MCP server with CSPR.trade mainnet MCP and optional CSPR.cloud credentials." },
  { num: "2", title: "Capture observations", body: "Store token, pair, quote, slippage, account, block, deploy, and tool-call observations." },
  { num: "3", title: "Review action", body: "Submit a CSPR.trade action plan. Oxys checks policy, metrics, and recent memory." },
  { num: "4", title: "Handoff or stop", body: "Return ALLOW, WARN, BLOCK, or REQUIRE_HUMAN before any signing or deploy submission." },
  { num: "5", title: "Record audit", body: "Store the request, review, result, failure, outcome, and human feedback for future reviews." }
];
