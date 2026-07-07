import { readFile } from "node:fs/promises";
import { Oxys } from "../src/index.js";

export const demoMemoryPath = ".oxys/demo-memory.json";

export function createDemoSdk(): Oxys {
  return new Oxys({
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
