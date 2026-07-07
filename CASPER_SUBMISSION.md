# BIT/MEM for Casper Agentic Buildathon

## One-Liner

BIT/MEM is memory, risk review, learning, and audit infrastructure for Casper agents that use x402 payments, MCP tools, CSPR.trade-style DeFi actions, and agent-built workflows.

## Casper Narrative

Casper's AI Toolkit positions agents as autonomous economic actors: they can discover tools through MCP, pay for HTTP resources through x402, interact with DeFi services, and eventually deploy or update smart contracts. That creates a missing control-plane problem:

- What is this agent allowed to pay for?
- Which MCP tools did it call before acting?
- Did a paid request or DeFi write exceed policy?
- Should the action be allowed, warned, blocked, or escalated to a human?
- Can the operator later inspect the decision trail?

BIT/MEM answers that layer. It is not the wallet, exchange, or x402 facilitator. It is the memory and guardrail system that a Casper agent calls before and after it acts.

## What We Added For Casper

New SDK module:

```ts
sdk.casper
```

It supports:

- Casper AI Toolkit profile seeding through `seedAiToolkitProfile()`
- Casper x402 quote memory through `rememberX402Quote()`
- HTTP 402 payment-header parsing through `rememberX402QuoteFromHeaders()`
- x402 payment attempt memory through `rememberX402PaymentAttempt()`
- Casper MCP tool-call memory through `rememberMcpObservation()`
- CSPR.cloud-style streaming event memory through `rememberStreamingEvent()`
- Odra contract generation/test/deploy workflow memory through `rememberContractWorkflow()`
- x402/MCP guardrail policy creation through `createAgentGuardrailPolicy()`
- pre-action reviews through `assessAgentAction()`
- decisions of `ALLOW`, `WARN`, `BLOCK`, or `REQUIRE_HUMAN`
- report storage as BIT/MEM memory for later context and audit

Runnable demo:

```bash
npm run example:casper
```

The demo seeds Casper AI Toolkit capability memory, parses an x402 `402 Payment Required` response, stores an x402 payment attempt, records a CSPR.trade-style MCP observation, records a CSPR.cloud-style deploy stream event, stores an Odra contract workflow, reviews an x402 payment, and escalates DeFi/deploy writes that lack human confirmation.

## Best Submission Angle

```text
BIT/MEM for Casper: a memory-backed guardrail and audit layer for autonomous x402/MCP agents.
```

This fits the Casper Agentic Buildathon because the product is about agents that transact, not chatbots. BIT/MEM gives those agents persistent context, spend policy, tool-call memory, and operator-visible risk decisions before a Casper action is executed.

## Demo Story

1. A Casper agent discovers a paid data endpoint or DeFi action through MCP/x402 tooling.
2. BIT/MEM seeds the agent with Casper AI Toolkit capabilities: x402 Facilitator, Casper MCP, CSPR.trade MCP, CSPR.click, CSPR.cloud, Odra, and casper-eip-712.
3. The agent writes the quote, payment attempt, chain event, contract workflow, or tool observation into BIT/MEM.
4. BIT/MEM retrieves the agent's policy and prior action memory.
5. The Casper adapter reviews the proposed action.
6. Safe low-value reads can pass; over-budget payments are blocked; DeFi writes and deploys require human confirmation.
7. The decision report is stored as memory and becomes future context for the same agent.

## What Is Already Built

- TypeScript SDK
- file/local memory mode for demos
- REST API
- Streamable HTTP MCP server
- operator dashboard and API-key management
- Aegis risk review engine
- failure learning
- proof hash infrastructure
- Casper-specific SDK adapter and demo
- Casper AI Toolkit capability memory utilities
- x402 header/payment-attempt utilities
- streaming event and Odra workflow utilities
- tests for Casper x402, MCP, streaming, Odra, and action guardrails

## Honest Status

The current Casper work is an SDK/infrastructure integration around Casper's agent surfaces. It does not deploy a new Casper smart contract or run a live Casper x402 payment in the demo. The defensible claim is that BIT/MEM is the risk, memory, and audit layer for agents that use Casper x402/MCP/CSPR.trade/CSPR.cloud/Odra capabilities.

## Casper References

- Casper AI Toolkit: https://www.casper.network/ai
- Casper Agentic Buildathon: https://dorahacks.io/hackathon/casper-agentic-buildathon/detail
