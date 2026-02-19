"use client";

import { useState, useEffect, useContext } from "react";
import { createPortal } from "react-dom";
import {
  X, Upload, Loader2, CheckCircle, AlertCircle,
  Wallet, ArrowRight, Shield,
} from "lucide-react";
import { useWallets } from "@privy-io/react-auth";
import { toast } from "sonner";
import { HyperLiquidContext } from "@/providers/hyperliquid";
import { recordWithdraw, getSubAccount } from "@/service";

type WithdrawStep = "input" | "signing" | "processing" | "success" | "error";

interface WithdrawSheetProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onSuccess?: (amount?: string) => void;
}

export default function WithdrawSheet({ isOpen, onClose, availableBalance, onSuccess }: WithdrawSheetProps) {
  const { wallets } = useWallets();
  const wallet = wallets?.[0];
  const { mainExchClient, infoClient } = useContext(HyperLiquidContext);

  const [mounted, setMounted] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<WithdrawStep>("input");
  const [errorMsg, setErrorMsg] = useState("");

  // 子账户真实余额
  const [subBalance, setSubBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setSheetVisible(true));
      loadSubBalance();
    } else {
      setSheetVisible(false);
      setSubBalance(null);
    }
  }, [isOpen]);

  const loadSubBalance = async () => {
    if (!infoClient) return;
    setLoadingBalance(true);
    try {
      const res = await getSubAccount();
      if (!res.sub_account_address) {
        // 还没有子账户，fallback 到 BalanceSnapshot
        setSubBalance(availableBalance);
        return;
      }
      const state = await infoClient.clearinghouseState({ user: res.sub_account_address });
      const bal = parseFloat(state?.marginSummary?.accountValue ?? "0");
      setSubBalance(bal);
    } catch {
      setSubBalance(availableBalance);
    } finally {
      setLoadingBalance(false);
    }
  };

  // 可提金额 = min(HyperCopy记录余额, 子账户真实余额)，防止双向漂移
  const effectiveMax = subBalance !== null
    ? Math.min(availableBalance, subBalance)
    : availableBalance;
  const effectiveMaxRounded = Math.floor(effectiveMax * 100) / 100;

  const handleWithdraw = async () => {
    if (!wallet || !mainExchClient || !amount || parseFloat(amount) <= 0) return;

    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount > effectiveMaxRounded) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      setStep("signing");

      // Step 1: 子账户 → 主账户
      let subAddr: string | null = null;
      try {
        const res = await getSubAccount();
        subAddr = res.sub_account_address;
      } catch {}

      if (subAddr) {
        await (mainExchClient as any).subAccountTransfer({
          subAccountUser: subAddr,
          isDeposit: false, // false = 子账户 → 主账户
          usd: Math.floor(withdrawAmount * 1e6),
        });
        // 等 HL 结算
        await new Promise(r => setTimeout(r, 1500));
      }

      setStep("processing");

      // Step 2: 主账户 → Arbitrum (withdraw3)
      await (mainExchClient as any).withdraw3({
        destination: wallet.address,
        amount: withdrawAmount.toFixed(2),
      });

      // 记录到后端
      try { await recordWithdraw(withdrawAmount); } catch (e) {
        console.error("Failed to record withdrawal:", e);
      }

      setStep("success");
      toast.success(`Withdrew ${withdrawAmount.toFixed(2)} USDC`);
      onSuccess?.(amount);
    } catch (err: any) {
      console.error("Withdraw failed:", err);
      setStep("error");
      setErrorMsg(
        err?.code === "ACTION_REJECTED" || err?.code === 4001
          ? "Transaction rejected by user"
          : err?.reason || err?.message || "Withdrawal failed. Please try again."
      );
    }
  };

  const handleClose = () => {
    setStep("input");
    setAmount("");
    setErrorMsg("");
    onClose();
  };

  const parsedAmount = parseFloat(amount) || 0;
  const isValid = parsedAmount > 0 && parsedAmount <= effectiveMaxRounded;

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
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(168,85,247,0.15)" }}>
                <Upload size={16} className="text-purple-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Withdraw USDC</h2>
                <span className="text-[10px] text-gray-500">HyperLiquid → Arbitrum</span>
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
                    <span className="text-xs text-gray-400">Available to Withdraw</span>
                  </div>
                  {loadingBalance ? (
                    <Loader2 size={14} className="text-gray-400 animate-spin" />
                  ) : (
                    <div className="text-right">
                      <span className="text-sm font-semibold text-white">
                        {effectiveMaxRounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                      </span>
                      {subBalance !== null && subBalance < availableBalance && (
                        <p className="text-[9px] text-yellow-400 mt-0.5">
                          Adjusted due to trading PnL
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div className="rounded-xl px-4 py-4 flex items-center gap-3" style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${parsedAmount > effectiveMaxRounded ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}` }}>
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
                  {parsedAmount > effectiveMaxRounded && <p className="text-[10px] text-red-400 mt-1 ml-1">Insufficient balance</p>}
                  {effectiveMaxRounded > 0 && (
                    <button onClick={() => setAmount(effectiveMaxRounded.toString())} className="text-[10px] font-semibold text-purple-400 mt-1.5 ml-1 cursor-pointer hover:text-purple-300">
                      Max
                    </button>
                  )}
                </div>

                <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.1)" }}>
                  <Shield size={12} className="text-purple-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Funds are withdrawn from your <span className="text-purple-400 font-semibold">dedicated HyperCopy sub-account</span> back to your Arbitrum wallet. Your other HL positions are never affected.
                  </p>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={!isValid || !wallet || !mainExchClient || loadingBalance}
                  className="w-full py-3.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    background: isValid ? "rgba(168,85,247,1)" : "rgba(168,85,247,0.3)",
                    color: "#ffffff",
                    boxShadow: isValid ? "0 0 25px rgba(168,85,247,0.4)" : "none",
                    opacity: isValid && wallet ? 1 : 0.5,
                  }}
                >
                  <Upload size={16} />
                  {!wallet ? "Connect Wallet First"
                    : !mainExchClient ? "Enable Trading First"
                    : loadingBalance ? "Loading balance..."
                    : `Withdraw $${parsedAmount.toFixed(2)}`}
                </button>
              </div>
            )}

            {/* ─── Processing ─── */}
            {(step === "signing" || step === "processing") && (
              <div className="py-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(168,85,247,0.08)", border: "1.5px solid rgba(168,85,247,0.2)" }}>
                  <Loader2 size={28} className="text-purple-400 animate-spin" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  {step === "signing" ? "Moving from sub-account..." : "Sending to your wallet..."}
                </h3>
                <p className="text-[11px] text-gray-400 max-w-[240px]">
                  {step === "signing"
                    ? "Transferring funds from your HyperCopy sub-account to main account"
                    : "Initiating withdrawal to your Arbitrum wallet"}
                </p>
                <div className="flex items-center gap-2 mt-6">
                  {["Sub→Main", "Withdraw"].map((s, i) => {
                    const stepIdx = step === "signing" ? 0 : 1;
                    const done = i < stepIdx;
                    const active = i === stepIdx;
                    return (
                      <div key={s} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
                          style={{
                            background: done ? "rgba(168,85,247,0.2)" : active ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${done ? "rgba(168,85,247,0.4)" : active ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.08)"}`,
                            color: done || active ? "#a855f7" : "rgba(255,255,255,0.3)",
                          }}>
                          {done ? <CheckCircle size={12} /> : i + 1}
                        </div>
                        <span className="text-[9px]" style={{ color: done || active ? "#a855f7" : "rgba(255,255,255,0.3)" }}>{s}</span>
                        {i < 1 && <ArrowRight size={10} style={{ color: "rgba(255,255,255,0.15)" }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── Success ─── */}
            {step === "success" && (
              <div className="py-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(168,85,247,0.15)", border: "1.5px solid rgba(168,85,247,0.3)" }}>
                  <CheckCircle size={28} className="text-purple-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Withdrawal Submitted!</h3>
                <p className="text-[11px] text-gray-400 mb-1">${parsedAmount.toFixed(2)} USDC on its way to your Arbitrum wallet</p>
                <div className="rounded-lg px-3 py-2 mt-2 mb-5 flex items-start gap-2" style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
                  <Loader2 size={12} className="text-purple-400 animate-spin shrink-0 mt-0.5" />
                  <p className="text-[10px] text-purple-300/90 leading-relaxed">
                    Funds are leaving your sub-account and heading to Arbitrum. Typically arrives within <strong>3–4 minutes</strong>.
                  </p>
                </div>
                <button onClick={handleClose} className="px-8 py-2.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all active:scale-95" style={{ background: "rgba(168,85,247,1)", color: "#ffffff" }}>
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
                <h3 className="text-sm font-bold text-white mb-1">Withdrawal Failed</h3>
                <p className="text-[11px] text-gray-400 mb-5 max-w-[260px]">{errorMsg}</p>
                <div className="flex gap-3">
                  <button onClick={handleClose} className="px-6 py-2.5 rounded-xl text-[11px] font-semibold cursor-pointer" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    Cancel
                  </button>
                  <button onClick={() => { setStep("input"); setErrorMsg(""); }} className="px-6 py-2.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all active:scale-95" style={{ background: "rgba(168,85,247,1)", color: "#ffffff" }}>
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