import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";
import {
  ContractFactory,
  JsonRpcProvider,
  Wallet,
  formatEther
} from "ethers";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(rootDir, ".env");
const contractPath = join(rootDir, "contracts", "AegisProofRegistry.sol");
const expectedChainId = 16661n;
const force = process.argv.includes("--force");

const env = await readEnv(envPath);
const rpcUrl = env.OG_EVM_RPC;
const privateKey = env.OG_CHAIN_PRIVATE_KEY;
const existingAddress = env.AEGIS_REGISTRY_ADDRESS;

if (!rpcUrl) {
  throw new Error("OG_EVM_RPC is required in .env.");
}

if (!privateKey || !/^(0x)?[0-9a-fA-F]{64}$/.test(privateKey)) {
  throw new Error("OG_CHAIN_PRIVATE_KEY must be a 32-byte hex private key in .env.");
}

if (existingAddress && !force) {
  console.log(`AEGIS_REGISTRY_ADDRESS is already set: ${existingAddress}`);
  console.log("Use npm run contracts:deploy:aegis -- --force to redeploy.");
  process.exit(0);
}

const { abi, bytecode } = await compile();
const provider = new JsonRpcProvider(rpcUrl);
const network = await provider.getNetwork();

if (network.chainId !== expectedChainId) {
  throw new Error(
    `Refusing to deploy: expected 0G mainnet chain ID ${expectedChainId}, got ${network.chainId}.`
  );
}

const wallet = new Wallet(privateKey, provider);
const balance = await provider.getBalance(wallet.address);
console.log(`Deploying AegisProofRegistry to 0G mainnet (${network.chainId}).`);
console.log(`Deployer: ${wallet.address}`);
console.log(`Balance: ${formatEther(balance)} 0G`);

const factory = new ContractFactory(abi, bytecode, wallet);
const deployTx = await factory.getDeployTransaction();
const estimatedGas = await provider.estimateGas({
  ...deployTx,
  from: wallet.address
});
console.log(`Estimated deploy gas: ${estimatedGas.toString()}`);

const contract = await factory.deploy();
console.log(`Deploy tx: ${contract.deploymentTransaction()?.hash}`);
await contract.waitForDeployment();

const address = await contract.getAddress();
const receipt = await contract.deploymentTransaction()?.wait();
console.log(`AegisProofRegistry deployed: ${address}`);

await writeEnvValue(envPath, "AEGIS_REGISTRY_ADDRESS", address);
await writeDeploymentArtifact({
  address,
  chainId: Number(network.chainId),
  deployer: wallet.address,
  txHash: receipt?.hash ?? contract.deploymentTransaction()?.hash,
  blockNumber: receipt?.blockNumber,
  deployedAt: new Date().toISOString()
});

console.log("Updated .env with AEGIS_REGISTRY_ADDRESS.");

async function compile() {
  const source = await readFile(contractPath, "utf8");
  const input = {
    language: "Solidity",
    sources: {
      "AegisProofRegistry.sol": {
        content: source
      }
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      evmVersion: "cancun",
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object"]
        }
      }
    }
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = output.errors?.filter((error) => error.severity === "error") ?? [];
  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.formattedMessage).join("\n"));
  }
  const contract = output.contracts?.["AegisProofRegistry.sol"]?.AegisProofRegistry;
  if (!contract?.abi || !contract?.evm?.bytecode?.object) {
    throw new Error("Failed to compile AegisProofRegistry.");
  }
  return {
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`
  };
}

async function readEnv(path) {
  const raw = await readFile(path, "utf8");
  const env = {};
  for (const line of raw.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    env[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }
  return env;
}

async function writeEnvValue(path, key, value) {
  const raw = await readFile(path, "utf8");
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/);
  let updated = false;
  const next = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      updated = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!updated) {
    next.push(`${key}=${value}`);
  }
  await writeFile(path, `${next.join("\n").replace(/\n+$/, "")}\n`, "utf8");
}

async function writeDeploymentArtifact(artifact) {
  const path = join(rootDir, "contracts", "deployments", "aegis-proof-registry-mainnet.json");
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
}
