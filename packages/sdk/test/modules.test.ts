import { describe, expect, it } from "vitest";
import { ZeroGMem, ZeroGMemCore, AegisModule } from "../src/index.js";

describe("SDK module boundaries", () => {
  it("exposes 0G-Mem core and Aegis as separate modules in one SDK", async () => {
    const sdk = new ZeroGMem();

    expect(sdk.ogmem).toBeInstanceOf(ZeroGMemCore);
    expect(sdk.aegis).toBeInstanceOf(AegisModule);
    expect(sdk.memory).toBe(sdk.ogmem.memory);
    expect(sdk.context).toBe(sdk.ogmem.context);
    expect(sdk.risk).toBe(sdk.aegis.risk);
  });
});
