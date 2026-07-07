import { describe, expect, it } from "vitest";
import { Oxys, OxysCore, AegisModule } from "../src/index.js";

describe("SDK module boundaries", () => {
  it("exposes Oxys core and risk modules in one SDK", async () => {
    const sdk = new Oxys();

    expect(sdk.oxys).toBeInstanceOf(OxysCore);
    expect(sdk.aegis).toBeInstanceOf(AegisModule);
    expect(sdk.memory).toBe(sdk.oxys.memory);
    expect(sdk.context).toBe(sdk.oxys.context);
    expect(sdk.risk).toBe(sdk.aegis.risk);
  });
});
