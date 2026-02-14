/**
 * HyperLiquid builder fee approval utilities.
 *
 * Based on:
 * - Docs: https://hyperliquid.gitbook.io/hyperliquid-docs/trading/builder-codes
 * - SDK:  https://github.com/hyperliquid-dex/hyperliquid-python-sdk/blob/master/examples/basic_builder_fee.py
 *
 * Flow:
 * 1. User signs EIP-712 ApproveBuilderFee → POST /exchange
 * 2. After that, orders sent with {"b": builder, "f": feeBps} earn us fees
 *
 * Requirements:
 * - Builder address must have ≥100 USDC in perps account
 * - Approval must be signed by user's MAIN wallet (not agent/API wallet)
 * - Max fee: 0.1% on perps, 1% on spot
 * - f is in tenths of basis points (10 = 1bp = 0.01%)
 */

const HL_INFO_API = "https://api.hyperliquid.xyz/info";
const HL_EXCHANGE_API = "https://api.hyperliquid.xyz/exchange";

export const BUILDER_ADDRESS =
  process.env.NEXT_PUBLIC_HL_BUILDER_ADDRESS || "";

// 1 basis point = 0.01%. This is the max the user approves.
// We actually charge HL_DEFAULT_BUILDER_BPS (10 = 1bp) per order.
export const BUILDER_MAX_FEE_RATE = "0.01%";

// ─── EIP-712 Domain (matches HyperLiquid SDK exactly) ────

const EIP712_DOMAIN = {
  name: "HyperliquidSignTransaction",
  version: "1",
  chainId: 42161, // Arbitrum One
  verifyingContract: "0x0000000000000000000000000000000000000000",
};

const EIP712_DOMAIN_TYPE = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

// ─── EIP-712 Types for ApproveBuilderFee ─────────────────
// Must match the SDK's sign_user_signed_action types exactly.
// builder is "address" type, nonce is "uint64".

const APPROVE_BUILDER_FEE_TYPE = [
  { name: "hyperliquidChain", type: "string" },
  { name: "maxFeeRate", type: "string" },
  { name: "builder", type: "address" },
  { name: "nonce", type: "uint64" },
];

// ─── Check if user already approved our builder fee ──────

export async function checkBuilderApproval(
  userAddress: string
): Promise<boolean> {
  if (!BUILDER_ADDRESS) return false;

  try {
    const res = await fetch(HL_INFO_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "maxBuilderFee",
        user: userAddress.toLowerCase(),
        builder: BUILDER_ADDRESS.toLowerCase(),
      }),
    });

    const data = await res.json();

    // HL returns the max approved fee. If > 0, user has approved.
    // Could be number (in tenths of bp) or string like "0.01%"
    if (typeof data === "number") return data > 0;
    if (typeof data === "string") {
      const num = parseFloat(data.replace("%", ""));
      return num > 0;
    }
    return false;
  } catch (err) {
    console.error("checkBuilderApproval failed:", err);
    return false;
  }
}

// ─── Approve builder fee (user signs EIP-712) ────────────
// Per docs: "The user must approve a maximum builder fee for
// each builder, and can revoke permissions at any time."
// This action MUST be signed by user's main wallet.

export async function approveBuilderFee(
  provider: any, // EIP-1193 provider from Privy wallet
  userAddress: string
): Promise<void> {
  if (!BUILDER_ADDRESS) {
    throw new Error("Builder address not configured");
  }

  // Nonce = current time in milliseconds (matches Python SDK: int(time.time() * 1000))
  const nonce = Date.now();

  // The action sent to /exchange
  const action = {
    type: "approveBuilderFee",
    hyperliquidChain: "Mainnet",
    maxFeeRate: BUILDER_MAX_FEE_RATE,
    builder: BUILDER_ADDRESS.toLowerCase(),
    nonce: nonce,
  };

  // EIP-712 typed data for wallet signing
  const typedData = {
    types: {
      EIP712Domain: EIP712_DOMAIN_TYPE,
      "HyperliquidTransaction:ApproveBuilderFee": APPROVE_BUILDER_FEE_TYPE,
    },
    primaryType: "HyperliquidTransaction:ApproveBuilderFee",
    domain: EIP712_DOMAIN,
    message: {
      hyperliquidChain: "Mainnet",
      maxFeeRate: BUILDER_MAX_FEE_RATE,
      builder: BUILDER_ADDRESS.toLowerCase(),
      nonce: nonce,
    },
  };

  // Request EIP-712 signature from user's wallet
  const sig: string = await provider.request({
    method: "eth_signTypedData_v4",
    params: [userAddress, JSON.stringify(typedData)],
  });

  // Parse signature into { r, s, v }
  const r = sig.slice(0, 66);
  const s = "0x" + sig.slice(66, 130);
  let v = parseInt(sig.slice(130, 132), 16);

  // Normalize v: some wallets return 0/1 instead of 27/28
  if (v < 27) v += 27;

  // POST to HyperLiquid exchange endpoint
  const res = await fetch(HL_EXCHANGE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: action,
      nonce: nonce,
      signature: { r, s, v },
    }),
  });

  const result = await res.json();

  // Check response
  if (result.status === "ok") {
    console.log("Builder fee approved successfully");
    return;
  }

  // Handle error
  const errMsg =
    typeof result.response === "string"
      ? result.response
      : JSON.stringify(result);
  throw new Error(`ApproveBuilderFee failed: ${errMsg}`);
}