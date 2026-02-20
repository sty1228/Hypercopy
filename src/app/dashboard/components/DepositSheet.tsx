"use client";

import { useState, useEffect, useCallback, useContext } from "react";
import { createPortal } from "react-dom";
import {
  X, Download, Loader2, CheckCircle, AlertCircle,
  ExternalLink, Wallet, ArrowRight, Shield, AlertTriangle,
} from "lucide-react";
import { useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import * as hl from "@nktkas/hyperliquid";
import { toast } from "sonner";
import { depositToHyperliquid, getArbUSDCBalance } from "@/helpers/arbitrum";
import { recordDeposit, getSubAccount, saveSubAccount } from "@/service";
import { HyperLiquidContext } from "@/providers/hyperliquid";

const ARBITRUM_CHAIN_ID = 42161;
const HL_CHAIN_ID = 1337;
const ARB_CHAIN_ID_HEX = "0xa4b1";
const HL_CHAIN_ID_HEX = "0x" + HL_CHAIN_ID.toString(16); // 0x539

type DepositStep = "input" | "switching" | "approving" | "transferring" | "success" | "error";

interface DepositSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (txHash?: string, amount?: string) => void;
}

// ────────────────────────────────────────────────────────────────
// Bypass Privy + wallet extension chainId validation
//
// Problem:
//   HL SDK signL1Action → domain.chainId = 1337
//   → Privy rejects (chainId mismatch)
//   → Even raw Rabby rejects (current chain ≠ 1337)
//
// Solution:
//   1. Get the RAW extension provider (skip Privy entirely)
//   2. Before signing, switch raw provider to chain 1337
//   3. Sign with eth_signTypedData_v4
//   4. Switch back to Arbitrum
//
// This works with Rabby, MetaMask, and any EIP-1193 wallet.
// ────────────────────────────────────────────────────────────────

function getRawExtensionProvider(): any {
  const win = window as any;
  if (win.ethereum?.providers?.length) {
    const rabby = win.ethereum.providers.find((p: any) => p.isRabby);
    if (rabby) return rabby;
    const mm = win.ethereum.providers.find((p: any) => p.isMetaMask);
    if (mm) return mm;
    return win.ethereum.providers[0];
  }
  if (win.rabby) return win.rabby;
  return win.ethereum;
}

/** Ensure chain 1337 is registered in the wallet (no-op if already exists) */
async function ensureHLChainRegistered(provider: any): Promise<void> {
  try {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: HL_CHAIN_ID_HEX,
        chainName: "Hyperliquid L1",
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
        rpcUrls: ["https://api.hyperliquid.xyz/evm"],
        blockExplorerUrls: ["https://explorer.hyperliquid.xyz"],
      }],
    });
  } catch {
    // Already registered or wallet doesn't support addChain — fine
  }
}

/** Switch raw provider to a specific chain */
async function switchRawChain(provider: any, chainIdHex: string): Promise<void> {
  await provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: chainIdHex }],
  });
}

async function createDirectSignExchClient(walletAddress: string): Promise<hl.ExchangeClient | null> {
  const rawProvider = getRawExtensionProvider();
  if (!rawProvider) {
    console.warn("[DirectSign] No raw extension provider found");
    return null;
  }
  console.log("[DirectSign] Raw provider:", rawProvider.isRabby ? "Rabby" : rawProvider.isMetaMask ? "MetaMask" : "unknown");

  // Pre-register chain 1337 so switch won't fail later
  await ensureHLChainRegistered(rawProvider);

  const customWallet = {
    address: walletAddress as `0x${string}`,
    getAddresses: async () => [walletAddress as `0x${string}`],

    // viem-style single-param signTypedData (SDK detects by .length === 1)
    signTypedData: async (args: {
      domain: any; types: any; primaryType: string; message: any;
    }) => {
      const { domain, types, primaryType, message } = args;

      const targetChainId = typeof domain.chainId === "bigint"
        ? Number(domain.chainId) : (domain.chainId ?? HL_CHAIN_ID);

      const targetChainHex = "0x" + targetChainId.toString(16);

      // ── Switch to the domain's chain so wallet validation passes ──
      try {
        await switchRawChain(rawProvider, targetChainHex);
        console.log("[DirectSign] Switched to chain", targetChainId);
      } catch (e) {
        console.warn("[DirectSign] Chain switch failed:", e);
        // Continue anyway — some wallets may not require it
      }

      const payload = JSON.stringify({
        types,
        domain: { ...domain, chainId: targetChainId },
        primaryType,
        message,
      });

      console.log("[DirectSign] Signing with domain.chainId:", targetChainId);

      let sig: string;
      try {
        sig = await rawProvider.request({
          method: "eth_signTypedData_v4",
          params: [walletAddress, payload],
        });
      } finally {
        // ── Always switch back to Arbitrum ──
        try {
          await switchRawChain(rawProvider, ARB_CHAIN_ID_HEX);
          console.log("[DirectSign] Switched back to Arbitrum");
        } catch (e) {
          console.warn("[DirectSign] Switch-back to Arbitrum failed:", e);
        }
      }

      return sig as `0x${string}`;
    },
  };

  try {
    const client = new hl.ExchangeClient({
      wallet: customWallet as any,
      transport: new hl.HttpTransport(),
    });
    console.log("[DirectSign] ExchangeClient created successfully");
    return client;
  } catch (e) {
    console.error("[DirectSign] Failed to create ExchangeClient:", e);
    return null;
  }
}

// ────────────────────────────────────────────────────────────────

export default function DepositSheet({ isOpen, onClose, onSuccess }: DepositSheetProps) {
  const { wallets } = useWallets();
  const { mainExchClient, infoClient } = useContext(HyperLiquidContext);
  const [mounted, setMounted] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [step, setStep] = useState<DepositStep>("input");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [hlWithdrawable, setHlWithdrawable] = useState<number | null>(null);
  const [hlHasPositions, setHlHasPositions] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setSheetVisible(true));
      loadBalance();
      loadHLState();
    } else {
      setSheetVisible(false);
    }
  }, [isOpen]);

  const wallet = wallets?.[0];

  const getProvider = useCallback(async () => {
    if (!wallet) throw new Error("No wallet");
    const eip1193 = await wallet.getEthereumProvider();
    return new (ethers as any).providers.Web3Provider(eip1193);
  }, [wallet]);

  const loadBalance = useCallback(async () => {
    if (!wallet) return;
    setLoadingBalance(true);
    try {
      const bal = await getArbUSDCBalance(wallet.address);
      setUsdcBalance(bal);
    } catch {
      setUsdcBalance("0");
    } finally {
      setLoadingBalance(false);
    }
  }, [wallet]);

  const loadHLState = useCallback(async () => {
    if (!infoClient || !wallet) return;
    try {
      const state = await infoClient.clearinghouseState({ user: wallet.address as `0x${string}` });
      const w = parseFloat(state?.withdrawable ?? "0");
      const pos = parseFloat(state?.marginSummary?.totalNtlPos ?? "0");
      console.log("[Deposit] HL withdrawable:", w, "totalNtlPos:", pos);
      setHlWithdrawable(w);
      setHlHasPositions(pos > 0);
    } catch (e) {
      console.error("[Deposit] Failed to load HL state:", e);
      setHlWithdrawable(null);
      setHlHasPositions(false);
    }
  }, [infoClient, wallet]);

  const parsedAmount = parseFloat(amount) || 0;
  const balNum = parseFloat(usdcBalance || "0");
  const hasBlockingPositions = hlHasPositions && hlWithdrawable !== null && hlWithdrawable < parsedAmount && parsedAmount > 0;

  const getOrCreateSubAccount = async (exchClient: hl.ExchangeClient): Promise<string | null> => {
    // 1. Check backend cache
    try {
      const res = await getSubAccount();
      if (res.sub_account_address) {
        console.log("[SubAccount] Found in backend:", res.sub_account_address);
        return res.sub_account_address;
      }
    } catch (e) {
      console.log("[SubAccount] Backend lookup failed:", e);
    }

    // 2. Check if sub-account already exists on HL (e.g. user created manually)
    try {
      const subs = await (exchClient as any).subAccounts?.();
      if (subs?.length) {
        const existing = subs.find((s: any) => s.name === "HyperCopy");
        if (existing?.address) {
          console.log("[SubAccount] Found on-chain:", existing.address);
          await saveSubAccount(existing.address);
          return existing.address;
        }
      }
    } catch (e) {
      console.log("[SubAccount] On-chain lookup skipped:", e);
    }

    // 3. Create new
    try {
      console.log("[SubAccount] Creating sub-account...");
      const result = await exchClient.createSubAccount({ name: "HyperCopy" });
      console.log("[SubAccount] Result:", JSON.stringify(result));
      const addr = result.response.data;
      if (addr) {
        console.log("[SubAccount] Created address:", addr);
        await saveSubAccount(addr);
        return addr;
      }
    } catch (e: any) {
      console.error("[SubAccount] createSubAccount failed:", e);
      console.error("[SubAccount] Detail:", e?.message);
    }
    return null;
  };

  /** Poll HL main-account withdrawable until deposit lands or timeout */
  const waitForHLCredit = async (expectedAmount: number, timeoutMs = 120_000): Promise<number> => {
    if (!infoClient || !wallet) return 0;

    const startWithdrawable = hlWithdrawable ?? 0;
    const interval = 5_000;
    const maxAttempts = Math.ceil(timeoutMs / interval);

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, interval));
      try {
        const state = await infoClient.clearinghouseState({ user: wallet.address as `0x${string}` });
        const current = parseFloat(state?.withdrawable ?? "0");
        console.log(`[Deposit] Polling HL credit: attempt ${i + 1}, withdrawable: ${current}`);
        // Credit landed if withdrawable increased by at least 90% of expected (bridge fees)
        if (current >= startWithdrawable + expectedAmount * 0.9) {
          return current;
        }
      } catch (e) {
        console.warn("[Deposit] Polling error:", e);
      }
    }
    console.warn("[Deposit] Timed out waiting for HL credit");
    // Return whatever we have — transfer will use actual available amount
    try {
      const state = await infoClient.clearinghouseState({ user: wallet.address as `0x${string}` });
      return parseFloat(state?.withdrawable ?? "0");
    } catch {
      return startWithdrawable;
    }
  };

  const handleDeposit = async () => {
    if (!wallet || !amount || parsedAmount <= 0) return;
    if (parsedAmount > balNum) { toast.error("Insufficient USDC balance"); return; }
    if (!mainExchClient) { toast.error("Enable trading first"); return; }
    if (hasBlockingPositions) {
      toast.error("Reduce your HL positions first — no free margin for isolation.");
      return;
    }

    try {
      setStep("switching");

      // Create direct-sign ExchangeClient (bypasses Privy + handles chain switching)
      const directClient = await createDirectSignExchClient(wallet.address);
      if (!directClient) {
        throw new Error("Failed to create signing client. Please use an external wallet like Rabby or MetaMask.");
      }

      // Create/get sub-account (signs with chainId 1337 → switches chain automatically)
      const subAddr = await getOrCreateSubAccount(directClient);

      // Switch Privy wallet to Arbitrum for USDC deposit
      await wallet.switchChain(ARBITRUM_CHAIN_ID);
      const provider = await getProvider();
      const signer = provider.getSigner();

      // Deposit USDC to HL bridge
      setStep("approving");
      const result = await depositToHyperliquid(signer, amount);
      setTxHash(result.hash || null);

      // Wait for HL credit with polling instead of fixed timeout
      setStep("transferring");
      const actualWithdrawable = await waitForHLCredit(parsedAmount);

      if (subAddr) {
        try {
          // Calculate actual transfer amount (bridge may deduct fees)
          const startW = hlWithdrawable ?? 0;
          const credited = actualWithdrawable - startW;
          const transferAmount = Math.max(0, Math.floor(credited * 1e6));

          if (transferAmount <= 0) {
            throw new Error("No funds credited to HL yet");
          }

          console.log(`[SubAccount] Transferring ${transferAmount / 1e6} USDC to sub-account`);
          await directClient.subAccountTransfer({
            subAccountUser: subAddr as `0x${string}`,
            isDeposit: true,
            usd: transferAmount,
          });
          console.log("[SubAccount] Transfer succeeded");
        } catch (e) {
          console.error("[SubAccount] Transfer failed:", e);
          toast.warning("Funds deposited to HL but sub-account transfer failed. Your funds are safe in your main HL account.");
        }
      } else {
        console.warn("[SubAccount] No address, skipping transfer");
        toast.warning("Funds deposited to HL but sub-account creation failed. Your funds are safe in your main HL account.");
      }

      try { await recordDeposit(parsedAmount, result.hash); } catch {}

      setStep("success");
      toast.success(`Deposited ${parsedAmount.toFixed(2)} USDC`);
      onSuccess?.(result.hash, amount);
      await loadBalance();
    } catch (err: any) {
      console.error("Deposit failed:", err);
      setStep("error");
      setErrorMsg(
        err?.code === "ACTION_REJECTED" || err?.code === 4001
          ? "Transaction rejected by user"
          : err?.reason || err?.message || "Deposit failed. Please try again."
      );
    }
  };

  const handleClose = () => {
    setStep("input");
    setAmount("");
    setTxHash(null);
    setErrorMsg("");
    onClose();
  };

  const isValid = parsedAmount >= 5 && parsedAmount <= balNum && !hasBlockingPositions;

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9998] transition-opacity duration-300"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", opacity: sheetVisible ? 1 : 0 }}
        onClick={step === "input" || step === "success" || step === "error" ? handleClose : undefined}
      />

      <div
        className="fixed left-0 right-0 z-[9999] mx-auto transition-transform duration-500"
        style={{
          bottom: 48, maxWidth: "580px",
          transform: sheetVisible ? "translateY(0)" : "translateY(110%)",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="rounded-t-3xl overflow-hidden" style={{ background: "linear-gradient(180deg, #111820 0%, #0a0f14 100%)", border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none" }}>
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          <div className="flex items-center justify-between px-5 pt-1 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(45,212,191,0.15)" }}>
                <Download size={16} className="text-teal-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Deposit USDC</h2>
                <span className="text-[10px] text-gray-500">Arbitrum → HyperLiquid</span>
              </div>
            </div>
            <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          <div className="px-5 pb-6">
            {step === "input" && (
              <div className="space-y-4">
                <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2">
                    <Wallet size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-400">Wallet USDC</span>
                  </div>
                  {loadingBalance ? <Loader2 size={14} className="text-gray-500 animate-spin" /> : (
                    <span className="text-sm font-semibold text-white">
                      {balNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                    </span>
                  )}
                </div>

                <div>
                  <div className="rounded-xl px-4 py-4 flex items-center gap-3" style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${parsedAmount > balNum ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}` }}>
                    <span className="text-xl text-gray-500 font-medium">$</span>
                    <input
                      type="text" inputMode="decimal" placeholder="0.00" value={amount}
                      onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, ""); if (v.split(".").length <= 2) setAmount(v); }}
                      className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-gray-600"
                    />
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center"><span className="text-[8px] font-bold text-white">$</span></div>
                      <span className="text-xs font-semibold text-white">USDC</span>
                    </div>
                  </div>
                  {parsedAmount > balNum && <p className="text-[10px] text-red-400 mt-1 ml-1">Insufficient balance</p>}
                  {parsedAmount > 0 && parsedAmount < 5 && <p className="text-[10px] text-red-400 mt-1 ml-1">Minimum deposit is 5 USDC</p>}
                </div>

                {hasBlockingPositions && (
                  <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)" }}>
                    <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-yellow-300 font-semibold mb-0.5">Cannot isolate funds</p>
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        Your HL main account has positions using all margin (withdrawable: ${hlWithdrawable?.toFixed(2) ?? "0.00"}). Deposited funds would be absorbed by existing positions.
                      </p>
                      <a href="https://app.hyperliquid.xyz/trade" target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-yellow-400 font-semibold hover:text-yellow-300">
                        Reduce positions on HyperLiquid <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                )}

                {!hasBlockingPositions && (
                  <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(45,212,191,0.04)", border: "1px solid rgba(45,212,191,0.1)" }}>
                    <Shield size={12} className="text-teal-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      Your USDC goes <span className="text-teal-400 font-semibold">directly into your own HyperLiquid sub-account</span> — HyperCopy never holds or controls your funds.
                    </p>
                  </div>
                )}

                <button onClick={handleDeposit} disabled={!isValid || !wallet || !mainExchClient}
                  className="w-full py-3.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    background: isValid ? "rgba(45,212,191,1)" : "rgba(45,212,191,0.3)", color: "#0a0f14",
                    boxShadow: isValid ? "0 0 25px rgba(45,212,191,0.4)" : "none",
                    opacity: isValid && wallet ? 1 : 0.5,
                  }}>
                  <Download size={16} />
                  {!wallet ? "Connect Wallet First" : !mainExchClient ? "Enable Trading First"
                    : hasBlockingPositions ? "Reduce HL Positions First" : `Deposit $${parsedAmount.toFixed(2)}`}
                </button>
              </div>
            )}

            {(step === "switching" || step === "approving" || step === "transferring") && (
              <div className="py-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(45,212,191,0.08)", border: "1.5px solid rgba(45,212,191,0.2)" }}>
                  <Loader2 size={28} className="text-teal-400 animate-spin" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  {step === "switching" && "Preparing sub-account..."}
                  {step === "approving" && "Approving & Depositing..."}
                  {step === "transferring" && "Moving to your sub-account..."}
                </h3>
                <p className="text-[11px] text-gray-400 max-w-[240px]">
                  {step === "switching" && "Sign the sub-account creation request in your wallet"}
                  {step === "approving" && "Approve USDC spending, then confirm the deposit"}
                  {step === "transferring" && "Waiting for funds to land on HyperLiquid, then isolating into your sub-account..."}
                </p>
                <div className="flex items-center gap-2 mt-6">
                  {["Setup", "Deposit", "Isolate"].map((s, i) => {
                    const stepIdx = step === "switching" ? 0 : step === "approving" ? 1 : 2;
                    const done = i < stepIdx; const active = i === stepIdx;
                    return (
                      <div key={s} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
                          style={{
                            background: done ? "rgba(45,212,191,0.2)" : active ? "rgba(45,212,191,0.1)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${done ? "rgba(45,212,191,0.4)" : active ? "rgba(45,212,191,0.3)" : "rgba(255,255,255,0.08)"}`,
                            color: done || active ? "#2dd4bf" : "rgba(255,255,255,0.3)",
                          }}>
                          {done ? <CheckCircle size={12} /> : i + 1}
                        </div>
                        <span className="text-[9px]" style={{ color: done || active ? "#2dd4bf" : "rgba(255,255,255,0.3)" }}>{s}</span>
                        {i < 2 && <ArrowRight size={10} style={{ color: "rgba(255,255,255,0.15)" }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {step === "success" && (
              <div className="py-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(45,212,191,0.15)", border: "1.5px solid rgba(45,212,191,0.3)" }}>
                  <CheckCircle size={28} className="text-teal-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Deposit Complete!</h3>
                <p className="text-[11px] text-gray-400 mb-1">${parsedAmount.toFixed(2)} USDC secured in your HyperCopy sub-account</p>
                <div className="rounded-lg px-3 py-2 mt-2 mb-3 flex items-start gap-2" style={{ background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.15)" }}>
                  <Shield size={12} className="text-teal-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-teal-300/90 leading-relaxed">
                    Funds are in <strong>your dedicated sub-account</strong> — completely isolated from your other HL positions.
                  </p>
                </div>
                {txHash && (
                  <a href={`https://arbiscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] text-teal-400 mb-5 hover:underline">
                    <span>View on Arbiscan</span> <ExternalLink size={10} />
                  </a>
                )}
                <button onClick={handleClose} className="px-8 py-2.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all active:scale-95" style={{ background: "rgba(45,212,191,1)", color: "#0a0f14" }}>
                  Done
                </button>
              </div>
            )}

            {step === "error" && (
              <div className="py-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(239,68,68,0.1)", border: "1.5px solid rgba(239,68,68,0.2)" }}>
                  <AlertCircle size={28} className="text-red-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Deposit Failed</h3>
                <p className="text-[11px] text-gray-400 mb-5 max-w-[260px]">{errorMsg}</p>
                <div className="flex gap-3">
                  <button onClick={handleClose} className="px-6 py-2.5 rounded-xl text-[11px] font-semibold cursor-pointer" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    Cancel
                  </button>
                  <button onClick={() => { setStep("input"); setErrorMsg(""); }} className="px-6 py-2.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all active:scale-95" style={{ background: "rgba(45,212,191,1)", color: "#0a0f14" }}>
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}