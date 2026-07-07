import { createId, hashJson } from "./hash.js";
import type { ComputeClient } from "./compute.js";
import type { ContextClient } from "./context.js";
import { decodeTransaction, MAX_UINT_256 } from "./decoder.js";
import type { MemoryClient } from "./memory.js";
import {
  tradePlanSchema,
  type ContextResult,
  type DecodedTransaction,
  type MemoryRecord,
  type RiskDecision,
  type RiskFinding,
  type RiskVerdict,
  type TradePlan
} from "./types.js";

export class AegisRiskClient {
  constructor(
    private readonly memory: MemoryClient,
    private readonly context: ContextClient,
    private readonly compute: ComputeClient
  ) {}

  async reviewPlan(input: TradePlan & { context?: ContextResult }): Promise<RiskVerdict> {
    const plan = tradePlanSchema.parse(input);
    const context = input.context ?? (await this.context.forTradePlan(plan));
    const decodedTransactions = plan.txs.map((tx, index) =>
      decodeTransaction(tx, index)
    );
    const findings = evaluatePlan(plan, context.memories, decodedTransactions);
    const riskScore = calculateRiskScore(findings);
    const decision = decide(findings, riskScore);
    const planHash = hashJson(plan);
    const planId = createId("plan");
    const reason = summarizeDecision(decision, findings);
    const privateReasoning = await this.compute.generate({
      purpose: "risk_review",
      system:
        "You are Oxys Risk, a private safety reviewer for autonomous trading agents. Return concise, practical risk reasoning. Do not provide trading alpha or execution advice.",
      user: JSON.stringify({
        intent: plan.intent,
        decodedTransactions,
        deterministicFindings: findings,
        matchedMemories: context.memories.map((memory) => ({
          kind: memory.kind,
          title: memory.title,
          content: memory.content
        }))
      })
    });

    const report = await this.memory.add({
      agentId: plan.agentId,
      kind: decision === "BLOCK" ? "blocked_action" : "risk_report",
      title: `${decision}: ${plan.intent}`,
      content: {
        planId,
        planHash,
        decision,
        riskScore,
        reason,
        privateReasoning,
        decodedTransactions,
        findings,
        intent: plan.intent,
        txCount: plan.txs.length
      },
      tags: ["oxys-risk", decision.toLowerCase()]
    });

    return {
      planId,
      planHash,
      reportHash: report.hash,
      decision,
      riskScore,
      reason,
      decodedTransactions,
      findings,
      matchedMemories: context.memories.map((memory) => memory.title),
      privateReasoning
    };
  }
}

function evaluatePlan(
  plan: TradePlan,
  memories: MemoryRecord[],
  decodedTransactions: DecodedTransaction[]
): RiskFinding[] {
  const findings: RiskFinding[] = [];
  const policy = collectPolicy(memories);

  if (plan.txs.length > policy.maxBatchTransactions) {
    findings.push({
      code: "BATCH_SIZE_LIMIT",
      severity: "warning",
      message: `Plan has ${plan.txs.length} transactions, above maxBatchTransactions ${policy.maxBatchTransactions}.`
    });
  }

  for (const [txIndex, tx] of plan.txs.entries()) {
    const to = tx.to.toLowerCase();
    const decoded = decodedTransactions[txIndex];

    if (policy.allowedContracts.size > 0 && !policy.allowedContracts.has(to)) {
      findings.push({
        code: "UNKNOWN_CONTRACT",
        severity: "warning",
        txIndex,
        message: `Transaction target ${tx.to} is not in allowedContracts.`
      });
    }

    if (
      decoded?.selector &&
      policy.blockedSelectors.has(decoded.selector.toLowerCase())
    ) {
      findings.push({
        code: "BLOCKED_SELECTOR",
        severity: "critical",
        txIndex,
        message: `Method selector ${decoded.selector} is blocked by policy.`
      });
    }

    if (
      decoded?.selector &&
      policy.allowedSelectors.size > 0 &&
      !policy.allowedSelectors.has(decoded.selector.toLowerCase())
    ) {
      findings.push({
        code: "UNKNOWN_SELECTOR",
        severity: "warning",
        txIndex,
        message: `Method selector ${decoded.selector} is not in allowedSelectors.`
      });
    }

    if (BigInt(tx.value) > policy.maxNativeValueWei) {
      findings.push({
        code: "NATIVE_VALUE_LIMIT",
        severity: "critical",
        txIndex,
        message: `Transaction native value exceeds maxNativeValueWei.`
      });
    }

    if (decoded?.kind === "erc20_approve") {
      const spender = decoded.args.spender;
      const amount = parseDecodedUint(decoded.args.amount);
      const spenderTrusted = spender ? policy.trustedSpenders.has(spender) : false;

      if (amount > policy.maxTokenApprovalAmount) {
        findings.push({
          code: "TOKEN_APPROVAL_LIMIT",
          severity: "critical",
          txIndex,
          message: `Approval amount exceeds maxTokenApprovalAmount.`
        });
      }

      if (amount === MAX_UINT_256 && !spenderTrusted) {
        findings.push({
          code: "UNLIMITED_APPROVAL_UNKNOWN_SPENDER",
          severity: "critical",
          txIndex,
          message: `Unlimited approval to unknown spender ${spender ?? "unknown"}.`
        });
      } else if (amount === MAX_UINT_256) {
        findings.push({
          code: "UNLIMITED_APPROVAL",
          severity: "warning",
          txIndex,
          message: `Unlimited approval detected.`
        });
      } else if (!spenderTrusted) {
        findings.push({
          code: "UNKNOWN_SPENDER",
          severity: "warning",
          txIndex,
          message: `Approval spender ${spender ?? "unknown"} is not trusted.`
        });
      }
    }

    if (decoded?.kind === "erc20_transfer") {
      const recipient = decoded.args.recipient;
      if (recipient && !policy.trustedRecipients.has(recipient)) {
        findings.push({
          code: "UNKNOWN_RECIPIENT",
          severity: "warning",
          txIndex,
          message: `Transfer recipient ${recipient} is not trusted.`
        });
      }
    }

    if (decoded?.kind === "erc20_transfer_from") {
      const recipient = decoded.args.recipient;
      if (recipient && !policy.trustedRecipients.has(recipient)) {
        findings.push({
          code: "UNKNOWN_TRANSFER_FROM_RECIPIENT",
          severity: "warning",
          txIndex,
          message: `transferFrom recipient ${recipient} is not trusted.`
        });
      }
    }
  }

  if (findings.length === 0) {
    findings.push({
      code: "NO_BLOCKING_RISK_FOUND",
      severity: "info",
      message: "No deterministic blocking risk found for this plan."
    });
  }

  return findings;
}

function collectPolicy(memories: MemoryRecord[]) {
  const allowedContracts = new Set<string>();
  const trustedSpenders = new Set<string>();
  const trustedRecipients = new Set<string>();
  const allowedSelectors = new Set<string>();
  const blockedSelectors = new Set<string>();
  let maxNativeValueWei = 0n;
  let maxTokenApprovalAmount = MAX_UINT_256;
  let maxBatchTransactions = Number.MAX_SAFE_INTEGER;

  for (const memory of memories) {
    const content = memory.content as Record<string, unknown>;
    addAddresses(allowedContracts, content.allowedContracts);
    addAddresses(trustedSpenders, content.trustedSpenders);
    addAddresses(trustedRecipients, content.trustedRecipients);
    addSelectors(allowedSelectors, content.allowedSelectors);
    addSelectors(blockedSelectors, content.blockedSelectors);

    if (typeof content.maxNativeValueWei === "string") {
      maxNativeValueWei = BigInt(content.maxNativeValueWei);
    }

    if (typeof content.maxTokenApprovalAmount === "string") {
      maxTokenApprovalAmount = BigInt(content.maxTokenApprovalAmount);
    }

    if (
      typeof content.maxBatchTransactions === "number" &&
      Number.isInteger(content.maxBatchTransactions) &&
      content.maxBatchTransactions > 0
    ) {
      maxBatchTransactions = content.maxBatchTransactions;
    }
  }

  return {
    allowedContracts,
    trustedSpenders,
    trustedRecipients,
    allowedSelectors,
    blockedSelectors,
    maxNativeValueWei,
    maxTokenApprovalAmount,
    maxBatchTransactions
  };
}

function addAddresses(target: Set<string>, value: unknown): void {
  if (!Array.isArray(value)) return;
  for (const item of value) {
    if (typeof item === "string" && /^0x[a-fA-F0-9]{40}$/.test(item)) {
      target.add(item.toLowerCase());
    }
  }
}

function addSelectors(target: Set<string>, value: unknown): void {
  if (!Array.isArray(value)) return;
  for (const item of value) {
    if (typeof item === "string" && /^0x[a-fA-F0-9]{8}$/.test(item)) {
      target.add(item.toLowerCase());
    }
  }
}

function parseDecodedUint(value: string | undefined): bigint {
  if (!value || value === "unknown") return 0n;
  return BigInt(value);
}

function calculateRiskScore(findings: RiskFinding[]): number {
  const score = findings.reduce((total, finding) => {
    if (finding.severity === "critical") return total + 60;
    if (finding.severity === "warning") return total + 25;
    return total;
  }, 0);

  return Math.min(score, 100);
}

function decide(findings: RiskFinding[], riskScore: number): RiskDecision {
  if (findings.some((finding) => finding.severity === "critical")) return "BLOCK";
  if (riskScore >= 50) return "REQUIRE_HUMAN";
  if (findings.some((finding) => finding.severity === "warning")) return "WARN";
  return "ALLOW";
}

function summarizeDecision(decision: RiskDecision, findings: RiskFinding[]): string {
  const important = findings.find((finding) => finding.severity !== "info") ?? findings[0];
  if (decision === "ALLOW") return "Plan matches available policy and no blocking risk was found.";
  if (decision === "BLOCK") {
    return findings
      .filter((finding) => finding.severity === "critical")
      .slice(0, 3)
      .map((finding) => finding.message)
      .join(" ");
  }
  if (decision === "REQUIRE_HUMAN") return "Multiple warnings require human approval before execution.";
  return important.message;
}
