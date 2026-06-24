import type { DecodedTransaction, TransactionRequest } from "./types.js";

export const SELECTORS = {
  approve: "0x095ea7b3",
  transfer: "0xa9059cbb",
  transferFrom: "0x23b872dd"
} as const;

export const MAX_UINT_256 = (1n << 256n) - 1n;

export function decodeTransaction(
  tx: TransactionRequest,
  txIndex: number
): DecodedTransaction {
  const data = tx.data.toLowerCase();
  const selector = data.length >= 10 ? data.slice(0, 10) : undefined;

  if (selector === SELECTORS.approve) {
    return {
      txIndex,
      chainId: tx.chainId,
      to: tx.to,
      value: tx.value,
      selector,
      kind: "erc20_approve",
      method: "approve(address,uint256)",
      args: {
        spender: decodeAddressArg(data, 0) ?? "unknown",
        amount: decodeUintArg(data, 1)?.toString() ?? "unknown"
      },
      label: tx.label
    };
  }

  if (selector === SELECTORS.transfer) {
    return {
      txIndex,
      chainId: tx.chainId,
      to: tx.to,
      value: tx.value,
      selector,
      kind: "erc20_transfer",
      method: "transfer(address,uint256)",
      args: {
        recipient: decodeAddressArg(data, 0) ?? "unknown",
        amount: decodeUintArg(data, 1)?.toString() ?? "unknown"
      },
      label: tx.label
    };
  }

  if (selector === SELECTORS.transferFrom) {
    return {
      txIndex,
      chainId: tx.chainId,
      to: tx.to,
      value: tx.value,
      selector,
      kind: "erc20_transfer_from",
      method: "transferFrom(address,address,uint256)",
      args: {
        from: decodeAddressArg(data, 0) ?? "unknown",
        recipient: decodeAddressArg(data, 1) ?? "unknown",
        amount: decodeUintArg(data, 2)?.toString() ?? "unknown"
      },
      label: tx.label
    };
  }

  if (data === "0x" && BigInt(tx.value) > 0n) {
    return {
      txIndex,
      chainId: tx.chainId,
      to: tx.to,
      value: tx.value,
      kind: "native_transfer",
      method: "native_transfer",
      args: {
        recipient: tx.to,
        amountWei: tx.value
      },
      label: tx.label
    };
  }

  return {
    txIndex,
    chainId: tx.chainId,
    to: tx.to,
    value: tx.value,
    selector,
    kind: "contract_call",
    method: selector ? `unknown:${selector}` : "unknown",
    args: {},
    label: tx.label
  };
}

function decodeAddressArg(data: string, index: number): string | undefined {
  const slot = readSlot(data, index);
  if (!slot) return undefined;
  return `0x${slot.slice(24)}`.toLowerCase();
}

function decodeUintArg(data: string, index: number): bigint | undefined {
  const slot = readSlot(data, index);
  if (!slot) return undefined;
  return BigInt(`0x${slot}`);
}

function readSlot(data: string, index: number): string | undefined {
  const normalized = data.startsWith("0x") ? data.slice(2) : data;
  const start = 8 + index * 64;
  const slot = normalized.slice(start, start + 64);
  return slot.length === 64 ? slot : undefined;
}
