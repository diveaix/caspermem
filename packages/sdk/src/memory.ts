import { memoryInputSchema, type MemoryInput, type MemoryRecord } from "./types.js";
import type { MemoryStorage } from "./storage.js";

export class MemoryClient {
  constructor(private readonly storage: MemoryStorage) {}

  async add(input: MemoryInput): Promise<MemoryRecord> {
    const parsed = memoryInputSchema.parse(input);
    return this.storage.add(parsed);
  }

  async list(agentId: string): Promise<MemoryRecord[]> {
    return this.storage.list(agentId);
  }

  async search(input: {
    agentId: string;
    query?: string;
    kinds?: string[];
    limit?: number;
  }): Promise<MemoryRecord[]> {
    return this.storage.search(input);
  }
}
