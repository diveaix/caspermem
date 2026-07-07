import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  StdioClientTransport,
  getDefaultEnvironment
} from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

export const DEFAULT_CSPR_TRADE_MCP_URL = "https://mcp.cspr.trade/mcp";
export const DEFAULT_CSPR_TRADE_NETWORK = "mainnet";

const DEFAULT_BLOCKED_TOOLS = new Set(["submit_transaction"]);

export type CsprTradeNetwork = "testnet" | "mainnet";

export type CsprTradeMcpClientOptions = {
  endpoint?: string;
  network?: CsprTradeNetwork;
  command?: string;
  args?: string[];
  allowSubmitTransaction?: boolean;
};

export async function listCsprTradeTools(
  options: CsprTradeMcpClientOptions = {}
) {
  return withCsprTradeClient(options, (client) => client.listTools());
}

export async function callCsprTradeTool(
  input: {
    toolName: string;
    toolArgs?: Record<string, unknown>;
  },
  options: CsprTradeMcpClientOptions = {}
) {
  assertAllowedTool(input.toolName, options);
  return withCsprTradeClient(options, (client) =>
    client.callTool({
      name: input.toolName,
      arguments: input.toolArgs ?? {}
    })
  );
}

export function classifyCsprTradeTool(toolName: string): "read" | "build" | "submit" {
  if (toolName === "submit_transaction") return "submit";
  if (toolName.startsWith("build_")) return "build";
  return "read";
}

export function resolveCsprTradeNetwork(
  options: CsprTradeMcpClientOptions = {}
): CsprTradeNetwork {
  return (
    options.network ??
    (process.env.OXYS_CSPR_TRADE_NETWORK as CsprTradeNetwork | undefined) ??
    DEFAULT_CSPR_TRADE_NETWORK
  );
}

export function resolveCsprTradeEndpoint(
  options: CsprTradeMcpClientOptions = {},
  network = resolveCsprTradeNetwork(options)
) {
  const configuredEndpoint =
    options.endpoint ?? process.env.OXYS_CSPR_TRADE_MCP_URL;
  if (configuredEndpoint) return configuredEndpoint;

  const usesCustomStdio =
    options.command ??
    process.env.OXYS_CSPR_TRADE_COMMAND ??
    options.args ??
    process.env.OXYS_CSPR_TRADE_ARGS;
  if (network === "mainnet" && !usesCustomStdio) {
    return DEFAULT_CSPR_TRADE_MCP_URL;
  }

  return undefined;
}

async function withCsprTradeClient<T>(
  options: CsprTradeMcpClientOptions,
  callback: (client: Client) => Promise<T>
): Promise<T> {
  const network = resolveCsprTradeNetwork(options);
  assertAllowedNetwork(network, options);
  const client = new Client({
    name: "oxys-cspr-trade-proxy",
    version: "0.1.0"
  });
  const transport = createTransport(options, network);

  try {
    await client.connect(transport);
    return await callback(client);
  } finally {
    await transport.close().catch(() => {});
    await client.close().catch(() => {});
  }
}

function createTransport(
  options: CsprTradeMcpClientOptions,
  network: CsprTradeNetwork
): Transport {
  const endpoint = resolveCsprTradeEndpoint(options, network);
  if (endpoint) {
    return new StreamableHTTPClientTransport(new URL(endpoint));
  }

  return new StdioClientTransport({
    command: options.command ?? process.env.OXYS_CSPR_TRADE_COMMAND ?? "npx",
    args:
      options.args ??
      (process.env.OXYS_CSPR_TRADE_ARGS
        ? process.env.OXYS_CSPR_TRADE_ARGS.split(" ")
        : ["-y", "@make-software/cspr-trade-mcp"]),
    env: {
      ...getDefaultEnvironment(),
      CSPR_TRADE_NETWORK: network
    },
    stderr: "pipe"
  });
}

function assertAllowedNetwork(
  network: CsprTradeNetwork,
  options: CsprTradeMcpClientOptions
) {
  const endpoint = resolveCsprTradeEndpoint(options, network);

  if (
    network === "testnet" &&
    endpoint &&
    new URL(endpoint).hostname === "mcp.cspr.trade"
  ) {
    throw new Error(
      "The public mcp.cspr.trade endpoint is mainnet. For testnet, omit OXYS_CSPR_TRADE_MCP_URL and use the self-hosted stdio server."
    );
  }
}

function assertAllowedTool(
  toolName: string,
  options: CsprTradeMcpClientOptions
) {
  if (!toolName || !/^[a-zA-Z0-9_:-]+$/.test(toolName)) {
    throw new Error("CSPR.trade toolName must be a simple MCP tool name.");
  }

  if (
    DEFAULT_BLOCKED_TOOLS.has(toolName) &&
    options.allowSubmitTransaction !== true
  ) {
    throw new Error(
      "submit_transaction is blocked by default. Set OXYS_CSPR_TRADE_ALLOW_SUBMIT=true only for signed-deploy submission demos."
    );
  }
}
