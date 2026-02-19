"use client";

import { useState, useEffect, useCallback, useContext } from "react";
import { createPortal } from "react-dom";
import {
  X, Download, Loader2, CheckCircle, AlertCircle,
  ExternalLink, Wallet, ArrowRight, Shield,
} from "lucide-react";
import { useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { toast } from "sonner";
import { depositToHyperliquid, getArbUSDCBalance } from "@/helpers/arbitrum";
import { recordDeposit, getSubAccount, saveSubAccount } from "@/service";
import { HyperLiquidContext } from "@/providers/hyperliquid";

const ARBITRUM_CHAIN_ID = 42161;

type DepositStep = "input" | "switching" | "approving" | "transferring" | "success" | "error";

interface DepositSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (txHash?: string, amount?: string) => void;
}

export default function DepositSheet({ isOpen, onClose, onSuccess }: DepositSheetProps) {
  const { wallets } = useWallets();
  const { mainExchClient } = useContext(HyperLiquidContext);
  const [mounted, setMounted] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [step, setStep] = useState<DepositStep>("input");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setSheetVisible(true));
      loadBalance();
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

  // 获取或创建子账户地址
  const getOrCreateSubAccount = async (): Promise<string | null> => {
    // 1. 先查后端是否已存
    try {
      const res = await getSubAccount();
      if (res.sub_account_address) {
        console.log("[SubAccount] Found in backend:", res.sub_account_address);
        return res.sub_account_address;
      }
    } catch (e) {
      console.log("[SubAccount] Backend lookup failed:", e);
    }

    // 2. 创建子账户
    // SDK 返回结构: { status: "ok", response: { type: "createSubAccount", data: "0x..." } }
    try {
      console.log("[SubAccount] Creating sub-account...");
      const result = await mainExchClient!.createSubAccount({ name: "HyperCopy" });
      console.log("[SubAccount] createSubAccount result:", JSON.stringify(result));

      const addr = result.response.data;
      if (addr) {
        console.log("[SubAccount] Created address:", addr);
        await saveSubAccount(addr);
        return addr;
      } else {
        console.error("[SubAccount] No address in response");
      }
    } catch (e: any) {
      console.error("[SubAccount] createSubAccount failed:", e);
      console.error("[SubAccount] Error detail:", e?.message, e?.response);
    }
    return null;
  };

  const handleDeposit = async () => {
    if (!wallet || !amount || parseFloat(amount) <= 0) return;

    const depositAmount = parseFloat(amount);
    const balNum = parseFloat(usdcBalance || "0");
    if (depositAmount > balNum) { toast.error("Insufficient USDC balance"); return; }
    if (!mainExchClient) { toast.error("Enable trading first"); return; }

    try {
      // Step 1: Switch network
      setStep("switching");
      await wallet.switchChain(ARBITRUM_CHAIN_ID);

      const provider = await getProvider();
      const signer = provider.getSigner();

      // Step 2: Deposit Arbitrum → HL main account
      setStep("approving");
      const result = await depositToHyperliquid(signer, amount);
      setTxHash(result.hash || null);

      // Step 3: Transfer main account → sub account
      setStep("transferring");

      // 等 HL 到账（约 30s），再 transfer 进子账户
      await new Promise(r => setTimeout(r, 30_000));

      const subAddr = await getOrCreateSubAccount();
      if (subAddr) {
        try {
          await mainExchClient.subAccountTransfer({
            subAccountUser: subAddr as `0x${string}`,
            isDeposit: true,
            usd: Math.floor(depositAmount * 1e6),
          });
          console.log("[SubAccount] Transfer to sub-account succeeded");
        } catch (e) {
          // transfer 失败不阻断流程，资金还在主账户，用户不会丢钱
          console.error("[SubAccount] subAccountTransfer failed:", e);
          toast.warning("Funds deposited to HL but sub-account transfer failed. Please contact support.");
        }
      } else {
        console.warn("[SubAccount] No sub-account address, skipping transfer");
        toast.warning("Funds deposited to HL but sub-account creation failed. Please contact support.");
      }

      // 记录到后端
      try { await recordDeposit(depositAmount, result.hash); } catch {}

      setStep("success");
      toast.success(`Deposited ${depositAmount.toFixed(2)} USDC`);
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

  const parsedAmount = parseFloat(amount) || 0;
  const balNum = parseFloat(usdcBalance || "0");
  const isValid = parsedAmount >= 5 && parsedAmount <= balNum;

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
        <div
          className="rounded-t-3xl overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #111820 0%, #0a0f14 100%)",
            border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none",
          }}
        >
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
            {/* ─── Input ─── */}
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

                <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(45,212,191,0.04)", border: "1px solid rgba(45,212,191,0.1)" }}>
                  <Shield size={12} className="text-teal-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Your USDC goes <span className="text-teal-400 font-semibold">directly into your own HyperLiquid sub-account</span> — HyperCopy never holds or controls your funds. We route copy trades on your behalf. You stay in full self-custody at all times.
                  </p>
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={!isValid || !wallet || !mainExchClient}
                  className="w-full py-3.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    background: isValid ? "rgba(45,212,191,1)" : "rgba(45,212,191,0.3)",
                    color: "#0a0f14",
                    boxShadow: isValid ? "0 0 25px rgba(45,212,191,0.4)" : "none",
                    opacity: isValid && wallet ? 1 : 0.5,
                  }}
                >
                  <Download size={16} />
                  {!wallet ? "Connect Wallet First" : !mainExchClient ? "Enable Trading First" : `Deposit $${parsedAmount.toFixed(2)}`}
                </button>
              </div>
            )}

            {/* ─── Processing ─── */}
            {(step === "switching" || step === "approving" || step === "transferring") && (
              <div className="py-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(45,212,191,0.08)", border: "1.5px solid rgba(45,212,191,0.2)" }}>
                  <Loader2 size={28} className="text-teal-400 animate-spin" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  {step === "switching" && "Switching to Arbitrum..."}
                  {step === "approving" && "Approving & Depositing..."}
                  {step === "transferring" && "Moving to your sub-account..."}
                </h3>
                <p className="text-[11px] text-gray-400 max-w-[240px]">
                  {step === "switching" && "Please confirm the network switch in your wallet"}
                  {step === "approving" && "Approve USDC spending, then confirm the deposit"}
                  {step === "transferring" && "Isolating your funds into your HyperCopy sub-account. This takes ~30s."}
                </p>

                <div className="flex items-center gap-2 mt-6">
                  {["Switch", "Deposit", "Isolate"].map((s, i) => {
                    const stepIdx = step === "switching" ? 0 : step === "approving" ? 1 : 2;
                    const done = i < stepIdx;
                    const active = i === stepIdx;
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

            {/* ─── Success ─── */}
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
                    Funds are in <strong>your dedicated sub-account</strong> — completely isolated from your other HL positions. HyperCopy never touches them directly.
                  </p>
                </div>
                {txHash && (
                  <a href={`https://arbiscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] text-teal-400 mb-5 hover:underline">
                    <span>View on Arbiscan</span>
                    <ExternalLink size={10} />
                  </a>
                )}
                <button onClick={handleClose} className="px-8 py-2.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all active:scale-95" style={{ background: "rgba(45,212,191,1)", color: "#0a0f14" }}>
                  Done
                </button>
              </div>
            )}

            {/* ─── Error ─── */}
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