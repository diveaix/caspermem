import { describe, expect, it } from "vitest";
import { decodeTransaction } from "../src/index.js";

describe("transaction decoder", () => {
  it("decodes ERC20 transferFrom calldata", () => {
    const from = "0x1111111111111111111111111111111111111111";
    const recipient = "0x2222222222222222222222222222222222222222";
    const data =
      "0x23b872dd" +
      "000000000000000000000000" +
      from.slice(2) +
      "000000000000000000000000" +
      recipient.slice(2) +
      "2a".padStart(64, "0");

    const decoded = decodeTransaction(
      {
        chainId: 16602,
        to: "0x3333333333333333333333333333333333333333",
        data,
        value: "0"
      },
      0
    );

    expect(decoded).toMatchObject({
      kind: "erc20_transfer_from",
      method: "transferFrom(address,address,uint256)",
      args: {
        from,
        recipient,
        amount: "42"
      }
    });
  });

  it("decodes native transfers", () => {
    const decoded = decodeTransaction(
      {
        chainId: 16602,
        to: "0x3333333333333333333333333333333333333333",
        data: "0x",
        value: "100"
      },
      0
    );

    expect(decoded).toMatchObject({
      kind: "native_transfer",
      method: "native_transfer",
      args: {
        amountWei: "100"
      }
    });
  });
});
