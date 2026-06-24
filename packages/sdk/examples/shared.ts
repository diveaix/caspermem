import { readFile } from "node:fs/promises";
import { ZeroGMem } from "../src/index.js";

export const demoMemoryPath = ".0g-mem/demo-memory.json";

export function createDemoSdk(): ZeroGMem {
  return new ZeroGMem({
    storage: {
      provider: "file",
      path: demoMemoryPath
    }
  });
}

export async function readJsonFile<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

export function fixturePath(name: string): string {
  return `packages/sdk/examples/fixtures/${name}`;
}
