import { stableJson } from "./hash.js";
import { createMemoryRecord, InMemoryStorage } from "./storage.js";
import type { MemoryInput, MemoryRecord } from "./types.js";

export type ZeroGStorageAdapterOptions = {
  indexerRpc: string;
  evmRpc: string;
  privateKey: string;
};

export class ZeroGStorageAdapter extends InMemoryStorage {
  constructor(private readonly options: ZeroGStorageAdapterOptions) {
    super();
  }

  override async add(input: MemoryInput): Promise<MemoryRecord> {
    const { Indexer, MemData } = await load0GStorageSdk();
    const { JsonRpcProvider, Wallet } = await loadEthers();
    const indexer = new Indexer(this.options.indexerRpc);
    const wallet = new Wallet(
      this.options.privateKey,
      new JsonRpcProvider(this.options.evmRpc)
    );
    const draft = createMemoryRecord(input);
    const bytes = new TextEncoder().encode(stableJson(draft));
    const data = new MemData(bytes);
    const [, treeErr] = await data.merkleTree();

    if (treeErr !== null) {
      throw new Error(`0G memory merkle tree error: ${treeErr.message}`);
    }

    const [upload, uploadErr] = await indexer.upload(
      data,
      this.options.evmRpc,
      wallet
    );

    if (uploadErr !== null) {
      throw new Error(`0G memory upload error: ${uploadErr.message}`);
    }

    const storageUri =
      "rootHash" in upload
        ? `0g://${upload.rootHash}`
        : `0g://${upload.rootHashes.join(",")}`;

    const record = {
      ...draft,
      storageUri
    };

    this.save(record);
    return record;
  }
}

export function createZeroGStorageAdapter(
  options: ZeroGStorageAdapterOptions
): ZeroGStorageAdapter {
  return new ZeroGStorageAdapter(options);
}

type StorageSdk = {
  Indexer: new (url: string) => {
    upload(
      file: unknown,
      blockchainRpc: string,
      signer: unknown
    ): Promise<[
      { txHash: string; rootHash: string; txSeq: number } | {
        txHashes: string[];
        rootHashes: string[];
        txSeqs: number[];
      },
      Error | null
    ]>;
  };
  MemData: new (data: ArrayLike<number>) => {
    merkleTree(): Promise<[unknown, Error | null]>;
  };
};

type EthersSdk = {
  JsonRpcProvider: new (url: string) => unknown;
  Wallet: new (privateKey: string, provider: unknown) => unknown;
};

const dynamicImport = new Function(
  "specifier",
  "return import(specifier)"
) as (specifier: string) => Promise<unknown>;

async function load0GStorageSdk(): Promise<StorageSdk> {
  try {
    return (await dynamicImport("@0gfoundation/0g-storage-ts-sdk")) as StorageSdk;
  } catch (error) {
    throw new Error(
      "0G Storage adapter requires optional dependency @0gfoundation/0g-storage-ts-sdk. Install it with ethers@^6.17.0 to use provider: '0g'.",
      { cause: error }
    );
  }
}

async function loadEthers(): Promise<EthersSdk> {
  try {
    return (await dynamicImport("ethers")) as EthersSdk;
  } catch (error) {
    throw new Error(
      "0G Storage adapter requires optional dependency ethers@^6.17.0.",
      { cause: error }
    );
  }
}
