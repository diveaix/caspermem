import { ContextClient } from "./context.js";
import { MemoryClient } from "./memory.js";
import { ProfileClient } from "./profile.js";
import { InMemoryStorage, JsonFileStorage, type MemoryStorage } from "./storage.js";
import type { OxysConfig } from "./types.js";

export class OxysCore {
  readonly memory: MemoryClient;
  readonly context: ContextClient;
  readonly profile: ProfileClient;

  constructor(storage: MemoryStorage = new InMemoryStorage()) {
    this.memory = new MemoryClient(storage);
    this.context = new ContextClient(this.memory);
    this.profile = new ProfileClient(this.memory);
  }
}

export function createStorageFromConfig(
  storage: OxysConfig["storage"] = { provider: "local" }
): MemoryStorage {
  if (storage.provider === "file") {
    return new JsonFileStorage(storage.path);
  }

  return new InMemoryStorage();
}
