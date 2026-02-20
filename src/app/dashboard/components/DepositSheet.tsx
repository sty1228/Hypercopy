"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X, Download, Loader2, Copy, CheckCircle,
  ExternalLink, Shield, RefreshCw, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { createOrGetWallet, getWalletBalance } from "@/service";

interface DepositSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface WalletState {
  address: string;
  arb_usdc: number;
  hl_equity: number;
  hl_withdrawable: number;
  hl_positions: number;
}

export default function DepositSheet({ isOpen, onClose, onSuccess }: DepositSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setSheetVisible(true));
      initWallet();
    } else {
      setSheetVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !wallet) return;
    const interval = setInterval(refreshBalance, 15_000);
    return () => clearInterval(interval);
  }, [isOpen, wallet?.address]);

  const initWallet = async () => {
    setLoading(true);
    setError("");
    try {
      await createOrGetWallet();
      await refreshBalance();
    } catch (e: any) {
      console.error("Failed to init wallet:", e);
      setError(e?.message || "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    try {
      const data = await getWalletBalance();
      setWallet(data);
    } catch (e) {
      console.error("Balance fetch failed:", e);
    }
  };

  const copyAddress = () => {
    if (!wallet?.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const totalBalance = (wallet?.hl_equity ?? 0) + (wallet?.arb_usdc ?? 0);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9998] transition-opacity duration-300"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", opacity: sheetVisible ? 1 : 0 }}
        onClick={onClose}
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
                <span className="text-[10px] text-gray-500">Send USDC on Arbitrum</span>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          <div className="px-5 pb-6">
            {loading && (
              <div className="py-12 flex flex-col items-center">
                <Loader2 size={24} className="text-teal-400 animate-spin mb-3" />
                <p className="text-xs text-gray-500">Setting up your deposit address...</p>
              </div>
            )}

            {!loading && error && (
              <div className="py-12 text-center">
                <p className="text-xs text-red-400 mb-3">{error}</p>
                <button onClick={initWallet} className="px-4 py-2 rounded-lg text-[11px] text-white" style={{ background: "rgba(255,255,255,0.1)" }}>
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && wallet && (
              <div className="space-y-4">
                {/* Balance */}
                <div className="rounded-xl px-4 py-3 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] text-gray-500 mb-1">Copy Trading Balance</p>
                  <p className="text-2xl font-bold text-white">
                    ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    <span className="text-[10px] text-gray-500">Active: ${wallet.hl_equity.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-500">Pending: ${wallet.arb_usdc.toFixed(2)}</span>
                    <button onClick={refreshBalance} className="text-gray-500 hover:text-teal-400 transition-colors">
                      <RefreshCw size={10} />
                    </button>
                  </div>
                </div>

                {/* Deposit Address */}
                <div>
                  <p className="text-[10px] text-gray-400 mb-2 ml-1">Send USDC (Arbitrum) to this address:</p>
                  <button
                    onClick={copyAddress}
                    className="w-full rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 transition-all active:scale-[0.98]"
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: `1px solid ${copied ? "rgba(45,212,191,0.4)" : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    <code className="text-[11px] text-white font-mono truncate">{wallet.address}</code>
                    <div className="shrink-0">
                      {copied ? <CheckCircle size={16} className="text-teal-400" /> : <Copy size={16} className="text-gray-400" />}
                    </div>
                  </button>
                </div>

                {/* Min deposit warning */}
                <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)" }}>
                  <AlertTriangle size={12} className="text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-yellow-300/80 leading-relaxed">
                    Minimum deposit is <strong>5 USDC</strong>. Amounts below 5 USDC will be lost permanently.
                  </p>
                </div>

                {/* How it works */}
                <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p className="text-[10px] text-gray-500 font-semibold">How it works:</p>
                  {[
                    "Send USDC (Arbitrum) to the address above",
                    "We auto-deposit it to HyperLiquid (~2 min)",
                    "Copy-trades execute from your dedicated wallet",
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)" }}>
                        <span className="text-[8px] font-bold text-teal-400">{i + 1}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">{text}</span>
                    </div>
                  ))}
                </div>

                {/* Safety note */}
                <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(45,212,191,0.04)", border: "1px solid rgba(45,212,191,0.1)" }}>
                  <Shield size={12} className="text-teal-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    This is <span className="text-teal-400 font-semibold">your dedicated copy-trading wallet</span>.
                    All positions and balances are publicly verifiable on-chain. Withdrawals only go to your connected wallet.
                  </p>
                </div>

                {/* Explorer link */}
                <a
                  href={`https://arbiscan.io/address/${wallet.address}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500 hover:text-teal-400 transition-colors py-1"
                >
                  View wallet on Arbiscan <ExternalLink size={10} />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}