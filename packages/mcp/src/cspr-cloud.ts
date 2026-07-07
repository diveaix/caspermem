export type CsprCloudNetwork = "mainnet" | "testnet";

export type CsprCloudGetInput = {
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  network?: CsprCloudNetwork;
};

const BASE_URLS: Record<CsprCloudNetwork, string> = {
  mainnet: "https://api.cspr.cloud",
  testnet: "https://api.testnet.cspr.cloud"
};

export async function getCsprCloudRest(
  input: CsprCloudGetInput,
  accessToken = process.env.CSPR_CLOUD_API_TOKEN ??
    process.env.CSPR_CLOUD_ACCESS_TOKEN
) {
  if (!accessToken) {
    throw new Error(
      "CSPR.cloud REST requests require CSPR_CLOUD_API_TOKEN or CSPR_CLOUD_ACCESS_TOKEN."
    );
  }

  const network = input.network ?? "mainnet";
  const url = buildCsprCloudUrl(BASE_URLS[network], input.path, input.query);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: accessToken
    }
  });
  const text = await response.text();
  const body = parseJsonOrText(text);

  if (!response.ok) {
    throw new Error(
      `CSPR.cloud request failed: ${response.status} ${JSON.stringify(body)}`
    );
  }

  return {
    network,
    url,
    data: body
  };
}

function buildCsprCloudUrl(
  baseUrl: string,
  path: string,
  query: CsprCloudGetInput["query"] = {}
) {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    throw new Error("CSPR.cloud path must be a relative absolute path, e.g. /blocks.");
  }

  const url = new URL(path, baseUrl);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function parseJsonOrText(text: string): unknown {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
