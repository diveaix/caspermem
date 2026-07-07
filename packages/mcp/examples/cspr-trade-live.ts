import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { DEFAULT_CSPR_TRADE_NETWORK } from "../src/cspr-trade.js";
import { createOxysMcpServer } from "../src/create-server.js";

const network =
  (process.env.OXYS_CSPR_TRADE_NETWORK as "testnet" | "mainnet" | undefined) ??
  DEFAULT_CSPR_TRADE_NETWORK;
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const server = createOxysMcpServer({
  allowLocalFallback: true,
  memoryPath: ".oxys/casper-probe-memory.json"
});
const client = new Client({
  name: "oxys-cspr-trade-probe",
  version: "0.1.0"
});

try {
  await server.connect(serverTransport);
  await client.connect(clientTransport);

  const tools = await callJsonTool("cspr_trade_list_tools", {});
  const tokens = await callJsonTool("cspr_trade_call_tool", {
    agentId: "agent-casper-mainnet-probe",
    toolName: "get_tokens",
    toolArgs: {},
    summary: "Probe live CSPR.trade token metadata and persist it to Oxys memory."
  });

  console.log(
    JSON.stringify(
      {
        status: "ok",
        story:
          "Oxys MCP can reach CSPR.trade and persists the sample Casper call as memory.",
        network,
        toolCount: Array.isArray(tools.tools) ? tools.tools.length : 0,
        toolNames: Array.isArray(tools.tools)
          ? tools.tools.map((tool: { name: string }) => tool.name)
          : [],
        sampleToolCall: {
          toolName: "get_tokens",
          result: tokens.result,
          memory: tokens.memory
        }
      },
      null,
      2
    )
  );
} catch (error) {
  console.log(
    JSON.stringify(
      {
        status: "unavailable",
        story: "Oxys could not reach the configured CSPR.trade MCP endpoint.",
        network,
        nextStep:
          "Check https://mcp.cspr.trade/mcp or set OXYS_CSPR_TRADE_MCP_URL to another reachable MCP endpoint.",
        error: error instanceof Error ? error.message : String(error)
      }
    )
  );
} finally {
  await client.close().catch(() => {});
  await server.close().catch(() => {});
}

async function callJsonTool(name: string, args: Record<string, unknown>) {
  const result = await client.callTool({
    name,
    arguments: args
  });
  const text = result.content.find((item) => item.type === "text")?.text ?? "{}";
  return JSON.parse(text) as Record<string, unknown>;
}
