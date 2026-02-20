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
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-1 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(45,212,191,0.15)" }}>
                <Download size={16} className="text-teal-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Deposit USDC</h2>
                <span className="text-[10px] text-gray-500">Fund your copy-trading wallet</span>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          {/* ── Network badge ── */}
          <div className="mx-5 mb-4 rounded-xl p-2.5 flex items-center gap-2.5" style={{ background: "rgba(45,130,246,0.06)", border: "1px solid rgba(45,130,246,0.18)" }}>
            {/* Arbitrum logo */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(45,130,246,0.12)" }}>
              <svg width="18" height="18" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M151.8 133.3L128 180.5l-23.8-47.2L128 110l23.8 23.3z" fill="#2D9CDB"/>
                <path d="M128 20L40 128l88 108 88-108L128 20z" fill="none" stroke="#2D9CDB" strokeWidth="12" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-white">Arbitrum Network Only</span>
                <span className="px-1.5 py-[1px] rounded text-[8px] font-bold uppercase tracking-wider" style={{ background: "rgba(45,130,246,0.2)", color: "#5BA8F5" }}>
                  Required
                </span>
              </div>
              <p className="text-[9.5px] text-gray-500 mt-0.5">
                Only send <strong className="text-white">USDC</strong> on <strong className="text-white">Arbitrum (ARB)</strong>. Other tokens or networks will result in permanent loss.
              </p>
            </div>
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

                {/* Step 1: Copy address */}
                <div>
                  <div className="flex items-center gap-2 mb-2 ml-1">
                    <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.3)" }}>
                      <span className="text-[9px] font-bold text-teal-400">1</span>
                    </div>
                    <p className="text-[11px] text-gray-300 font-medium">Copy your deposit address</p>
                  </div>
                  <button
                    onClick={copyAddress}
                    className="w-full rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 transition-all active:scale-[0.98]"
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: `1px solid ${copied ? "rgba(45,212,191,0.4)" : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    <code className="text-[11px] text-white font-mono truncate">{wallet.address}</code>
                    <div className="shrink-0 flex items-center gap-1.5">
                      {copied ? (
                        <>
                          <span className="text-[9px] text-teal-400 font-medium">Copied</span>
                          <CheckCircle size={14} className="text-teal-400" />
                        </>
                      ) : (
                        <>
                          <span className="text-[9px] text-gray-500">Tap to copy</span>
                          <Copy size={14} className="text-gray-400" />
                        </>
                      )}
                    </div>
                  </button>
                </div>

                {/* Step 2: Send USDC instruction */}
                <div>
                  <div className="flex items-center gap-2 mb-2 ml-1">
                    <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.3)" }}>
                      <span className="text-[9px] font-bold text-teal-400">2</span>
                    </div>
                    <p className="text-[11px] text-gray-300 font-medium">Send USDC on Arbitrum to this address</p>
                  </div>
                  <div className="rounded-xl p-3 space-y-2.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-start gap-2.5">
                      <span className="text-[10px] text-gray-500 shrink-0 w-[52px]">Token</span>
                      <span className="text-[10px] text-white font-semibold">USDC</span>
                    </div>
                    <div className="h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
                    <div className="flex items-start gap-2.5">
                      <span className="text-[10px] text-gray-500 shrink-0 w-[52px]">Network</span>
                      <span className="text-[10px] text-white font-semibold">Arbitrum One</span>
                    </div>
                    <div className="h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
                    <div className="flex items-start gap-2.5">
                      <span className="text-[10px] text-gray-500 shrink-0 w-[52px]">Minimum</span>
                      <span className="text-[10px] text-white font-semibold">5 USDC</span>
                    </div>
                  </div>
                </div>

                {/* Step 3: Auto deposit */}
                <div>
                  <div className="flex items-center gap-2 mb-2 ml-1">
                    <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.3)" }}>
                      <span className="text-[9px] font-bold text-teal-400">3</span>
                    </div>
                    <p className="text-[11px] text-gray-300 font-medium">Wait for auto-deposit (~2 min)</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      Funds are automatically bridged to HyperLiquid once your USDC arrives. Your balance above will update in real-time. Copy-trades will begin executing once funds are active.
                    </p>
                  </div>
                </div>

                {/* ── Warning ── */}
                <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-red-300/90 font-semibold mb-0.5">Before you send</p>
                    <ul className="space-y-1">
                      <li className="text-[9.5px] text-red-300/70 leading-relaxed flex items-start gap-1.5">
                        <span className="shrink-0 mt-[3px]">•</span>
                        <span>Only <strong className="text-red-300/90">USDC on Arbitrum</strong> is accepted. Sending any other token or using a different network will result in <strong className="text-red-300/90">permanent loss</strong>.</span>
                      </li>
                      <li className="text-[9.5px] text-red-300/70 leading-relaxed flex items-start gap-1.5">
                        <span className="shrink-0 mt-[3px]">•</span>
                        <span>Deposits below <strong className="text-red-300/90">5 USDC</strong> cannot be recovered.</span>
                      </li>
                    </ul>
                  </div>
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