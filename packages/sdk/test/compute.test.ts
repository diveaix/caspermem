import { afterEach, describe, expect, it, vi } from "vitest";
import { ZeroGComputeClient } from "../src/index.js";

describe("0G Compute client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls an OpenAI-compatible 0G chat completions endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: "Private risk review complete."
              }
            }
          ]
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new ZeroGComputeClient({
      apiKey: "sk-test",
      baseUrl: "https://router-api-testnet.integratenetwork.work/v1/",
      model: "zai-org/GLM-5-FP8"
    });

    const result = await client.generate({
      purpose: "risk_review",
      system: "system",
      user: "user"
    });

    expect(result.provider).toBe("0g");
    expect(result.summary).toBe("Private risk review complete.");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://router-api-testnet.integratenetwork.work/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer sk-test"
        }
      })
    );
  });
});
