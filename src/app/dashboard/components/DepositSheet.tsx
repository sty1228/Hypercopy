"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X, Download, Loader2, Copy, CheckCircle,
  ExternalLink, Shield, RefreshCw, AlertTriangle,
  ChevronDown, Zap, Search, Check, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { ethers } from "ethers";
import { createOrGetWallet, getWalletBalance } from "@/service";
import { useCurrentWallet } from "@/hooks/usePrivyData";
import {
  CHAINS, CHAIN_LIST, ARB_LZ_EID,
  ERC20_ABI, STARGATE_POOL_ABI,
  type ChainConfig,
} from "@/config/chains";

// ethers v5 compat
const _e = ethers as any;
const JsonRpcProvider = _e.providers?.JsonRpcProvider ?? _e.JsonRpcProvider;
const Web3Provider = _e.providers?.Web3Provider ?? _e.BrowserProvider;
const Contract = _e.Contract;
const parseUnits = _e.utils?.parseUnits ?? _e.parseUnits;
const formatUnits = _e.utils?.formatUnits ?? _e.formatUnits;
const formatEther = _e.utils?.formatEther ?? _e.formatEther;
const hexZeroPad = _e.utils?.hexZeroPad ?? _e.zeroPadValue;
const MaxUint256 = _e.constants?.MaxUint256 ?? _e.MaxUint256;

// ── Chain Icons ──

export function ChainIcon({ chain, size = 20 }: { chain: ChainConfig; size?: number }) {
  const s = size;
  const icons: Record<string, React.ReactNode> = {
    arbitrum: (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#2D374B"/>
        <path d="M21.8 15.4l5.1 8.2-2.3 1.4-5.1-8.2 2.3-1.4z" fill="#28A0F0"/>
        <path d="M27.4 24.4l2-1.2 1.4 2.3-2 1.2-1.4-2.3z" fill="#28A0F0"/>
        <path d="M14.1 25.2l5.1-8.2 2.3 1.4-5.1 8.2-2.3-1.4z" fill="white"/>
        <path d="M11.2 25.5l1.4-2.3 2 1.2-1.4 2.3-2-1.2z" fill="white"/>
      </svg>
    ),
    avalanche: (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#E84142"/>
        <path d="M14.5 26h-3.7c-.7 0-1-.3-.7-.9L19.3 10c.3-.6.9-.6 1.2 0l2.1 3.8c.2.3.2.7 0 1L15.2 26c-.2.3-.5.0-.7 0z" fill="white"/>
        <path d="M23.5 26h5.7c.7 0 1-.3.7-.9l-4-7c-.3-.6-.9-.6-1.2 0l-4 7c-.3.6 0 .9.7.9h2.1z" fill="white"/>
      </svg>
    ),
    base: (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#0052FF"/>
        <path d="M19.8 33c7.2 0 13-5.8 13-13s-5.8-13-13-13C13 7 7.5 12.1 7 18.5h17.3v3H7C7.5 27.9 13 33 19.8 33z" fill="white"/>
      </svg>
    ),
    ethereum: (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#627EEA"/>
        <path d="M20 7v10.1l8.5 3.8L20 7z" fill="white" fillOpacity="0.6"/>
        <path d="M20 7l-8.5 13.9L20 17.1V7z" fill="white"/>
        <path d="M20 26.5v6.5l8.5-11.8L20 26.5z" fill="white" fillOpacity="0.6"/>
        <path d="M20 33v-6.5l-8.5-5.3L20 33z" fill="white"/>
        <path d="M20 24.9l8.5-4L20 17.1v7.8z" fill="white" fillOpacity="0.2"/>
        <path d="M11.5 20.9l8.5 4v-7.8l-8.5 3.8z" fill="white" fillOpacity="0.5"/>
      </svg>
    ),
    mantle: (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#000"/>
        <rect x="9" y="14" width="4" height="12" rx="1" fill="white"/>
        <rect x="15" y="10" width="4" height="16" rx="1" fill="white"/>
        <rect x="21" y="14" width="4" height="12" rx="1" fill="white"/>
        <rect x="27" y="10" width="4" height="16" rx="1" fill="white"/>
      </svg>
    ),
    optimism: (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#FF0420"/>
        <path d="M14.7 24.5c-1.3 0-2.3-.4-3-1.1-.7-.7-1-1.7-1-2.9 0-1.6.4-3 1.3-4 .9-1.1 2.1-1.6 3.5-1.6 1.3 0 2.3.4 3 1.1.7.8 1 1.8 1 3-.1 1.6-.5 2.9-1.4 3.9-.8 1.1-2 1.6-3.4 1.6zm.3-2.3c.6 0 1.1-.3 1.5-.9.4-.6.6-1.4.6-2.4 0-.7-.1-1.2-.4-1.6-.3-.4-.7-.6-1.2-.6-.6 0-1.1.3-1.5.9-.4.6-.6 1.4-.6 2.4 0 .7.1 1.3.4 1.6.3.4.7.6 1.2.6z" fill="white"/>
        <path d="M22 24.3l1.6-8.2h3.3c1.1 0 1.9.2 2.4.7.5.5.8 1.1.8 1.9 0 1.1-.4 2-1.1 2.6-.7.6-1.7.9-3 .9h-1.6l-.5 2.1H22zm3.3-4.2h.9c.5 0 1-.1 1.3-.3.3-.2.5-.6.5-1 0-.3-.1-.6-.3-.7-.2-.2-.5-.3-1-.3h-.8l-.6 2.3z" fill="white"/>
      </svg>
    ),
    polygon: (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#8247E5"/>
        <path d="M25.8 16.7c-.4-.2-.9-.2-1.2 0l-2.9 1.7-2 1.1-2.9 1.7c-.4.2-.9.2-1.2 0l-2.3-1.3c-.4-.2-.6-.6-.6-1.1v-2.6c0-.4.2-.9.6-1.1l2.3-1.3c.4-.2.9-.2 1.2 0l2.3 1.3c.4.2.6.6.6 1.1v1.7l2-1.1v-1.7c0-.4-.2-.9-.6-1.1l-4.2-2.5c-.4-.2-.9-.2-1.2 0l-4.3 2.5c-.4.2-.6.6-.6 1.1v4.9c0 .4.2.9.6 1.1l4.3 2.5c.4.2.9.2 1.2 0l2.9-1.7 2-1.1 2.9-1.7c.4-.2.9-.2 1.2 0l2.3 1.3c.4.2.6.6.6 1.1v2.6c0 .4-.2.9-.6 1.1l-2.3 1.3c-.4.2-.9.2-1.2 0l-2.3-1.3c-.4-.2-.6-.6-.6-1.1v-1.7l-2 1.1v1.7c0 .4.2.9.6 1.1l4.3 2.5c.4.2.9.2 1.2 0l4.3-2.5c.4-.2.6-.6.6-1.1v-4.9c0-.4-.2-.9-.6-1.1l-4.4-2.5z" fill="white"/>
      </svg>
    ),
    scroll: (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#FFEEDA"/>
        <path d="M26 13H16c-1.7 0-3 1.3-3 3v8c0 1.7 1.3 3 3 3h7c1.1 0 2-.9 2-2s-.9-2-2-2h-7v-2h10c1.7 0 3-1.3 3-3v-2c0-1.7-1.3-3-3-3zm0 5H16v-2h10v2z" fill="#684B2A"/>
      </svg>
    ),
  };
  const key = Object.keys(CHAINS).find((k) => CHAINS[k].chainId === chain.chainId) || "";
  return <>{icons[key] || <div style={{ width: s, height: s, borderRadius: "50%", background: chain.color }} />}</>;
}

// ── Types ──

interface DepositSheetProps { isOpen: boolean; onClose: () => void; onSuccess?: () => void; }
interface WalletState { address: string; arb_usdc: number; hl_equity: number; hl_withdrawable: number; hl_positions: number; }
type TxStatus = "idle" | "switching" | "approving" | "quoting" | "sending" | "confirming" | "success" | "error";

const STATUS_LABELS: Record<TxStatus, string> = {
  idle: "", switching: "Switching network…", approving: "Approving USDC…",
  quoting: "Estimating bridge fee…", sending: "Confirm in wallet…",
  confirming: "Waiting for confirmation…", success: "Deposit sent!", error: "Transaction failed",
};

const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

async function readUSDCBalance(chain: ChainConfig, addr: string): Promise<number> {
  const p = new JsonRpcProvider(chain.rpcUrl);
  const c = new Contract(chain.usdc, ERC20_ABI, p);
  return parseFloat(formatUnits(await c.balanceOf(addr), chain.usdcDecimals));
}

// ── Component ──

export default function DepositSheet({ isOpen, onClose, onSuccess }: DepositSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [error, setError] = useState("");
  const [selectedChain, setSelectedChain] = useState<ChainConfig>(CHAINS.arbitrum);
  const [chainSearch, setChainSearch] = useState("");
  const [chainOpen, setChainOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [sourceBalance, setSourceBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [bridgeFee, setBridgeFee] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState("");
  const [txError, setTxError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const privyWallet = useCurrentWallet();
  const abortRef = useRef(false);

  const filteredChains = useMemo(() => {
    if (!chainSearch.trim()) return CHAIN_LIST;
    const q = chainSearch.toLowerCase();
    return CHAIN_LIST.filter((c) => c.name.toLowerCase().includes(q) || c.shortName.toLowerCase().includes(q));
  }, [chainSearch]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setSheetVisible(true));
      initWallet(); abortRef.current = false;
    } else {
      setSheetVisible(false); setTxStatus("idle"); setTxHash(""); setTxError("");
      setAmount(""); setBridgeFee(null); setShowManual(false); setChainOpen(false); setChainSearch("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !wallet) return;
    const iv = setInterval(refreshBalance, 15_000);
    return () => clearInterval(iv);
  }, [isOpen, wallet?.address]);

  useEffect(() => {
    if (!isOpen || !privyWallet?.address) return;
    loadSourceBalance();
  }, [isOpen, selectedChain, privyWallet?.address]);

  const initWallet = async () => {
    setLoading(true); setError("");
    try { await createOrGetWallet(); await refreshBalance(); }
    catch (e: any) { setError(e?.message || "Failed to load wallet"); }
    finally { setLoading(false); }
  };

  const refreshBalance = async () => { try { setWallet(await getWalletBalance()); } catch {} };

  const loadSourceBalance = async () => {
    if (!privyWallet?.address) return;
    setLoadingBalance(true); setSourceBalance(null);
    try { setSourceBalance(await readUSDCBalance(selectedChain, privyWallet.address)); }
    catch (e) { console.error("Balance read failed:", e); setSourceBalance(0); }
    finally { setLoadingBalance(false); }
  };

  const getSignerOnChain = async () => {
    if (!privyWallet) throw new Error("Wallet not connected");
    const raw = await privyWallet.getEthereumProvider();
    const prov = new Web3Provider(raw as any);
    const net = await prov.getNetwork();
    if (net.chainId !== selectedChain.chainId) {
      setTxStatus("switching");
      await privyWallet.switchChain(selectedChain.chainId);
      await new Promise((r) => setTimeout(r, 500));
      const r2 = await privyWallet.getEthereumProvider();
      return new Web3Provider(r2 as any).getSigner();
    }
    return prov.getSigner();
  };

  const depositArbitrum = async () => {
    if (!wallet?.address) return;
    const signer = await getSignerOnChain();
    const raw = parseUnits(amount, selectedChain.usdcDecimals);
    const usdc = new Contract(selectedChain.usdc, ERC20_ABI, signer);
    setTxStatus("sending");
    const tx = await usdc.transfer(wallet.address, raw);
    setTxHash(tx.hash); setTxStatus("confirming"); await tx.wait();
  };

  const depositStargate = async () => {
    if (!wallet?.address || !selectedChain.stargatePool) return;
    const signer = await getSignerOnChain();
    const raw = parseUnits(amount, selectedChain.usdcDecimals);
    const min = raw.mul(995).div(1000);
    const sp = { dstEid: ARB_LZ_EID, to: hexZeroPad(wallet.address, 32), amountLD: raw, minAmountLD: min, extraOptions: "0x", composeMsg: "0x", oftCmd: "0x" };

    setTxStatus("approving");
    const usdc = new Contract(selectedChain.usdc, ERC20_ABI, signer);
    const addr = await signer.getAddress();
    const allow = await usdc.allowance(addr, selectedChain.stargatePool);
    if (allow.lt(raw)) { const atx = await usdc.approve(selectedChain.stargatePool, MaxUint256); await atx.wait(); }
    if (abortRef.current) return;

    setTxStatus("quoting");
    const pool = new Contract(selectedChain.stargatePool, STARGATE_POOL_ABI, signer);
    const [msgFee] = await pool.quoteSend(sp, false);
    const nFee = msgFee.nativeFee.mul(110).div(100);
    setBridgeFee(formatEther(nFee));
    if (abortRef.current) return;

    setTxStatus("sending");
    const tx = await pool.sendToken(sp, { nativeFee: nFee, lzTokenFee: 0 }, addr, { value: nFee });
    setTxHash(tx.hash); setTxStatus("confirming"); await tx.wait();
  };

  const handleDeposit = async () => {
    const n = parseFloat(amount);
    if (!n || n < 1) { toast.error("Minimum deposit is 1 USDC"); return; }
    if (sourceBalance !== null && n > sourceBalance) { toast.error("Insufficient USDC balance"); return; }
    setTxStatus("idle"); setTxError(""); setTxHash(""); abortRef.current = false;
    try {
      if (!selectedChain.stargatePool) await depositArbitrum(); else await depositStargate();
      setTxStatus("success"); toast.success("Deposit sent! Funds will arrive in ~1-3 minutes.");
      onSuccess?.(); loadSourceBalance(); refreshBalance();
    } catch (e: any) {
      if (abortRef.current) return;
      const msg = e?.reason || e?.message || "Transaction failed";
      setTxError(msg.length > 120 ? msg.slice(0, 120) + "…" : msg);
      setTxStatus("error"); toast.error("Deposit failed");
    }
  };

  const copyAddress = () => {
    if (!wallet?.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true); toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shortAddr = wallet?.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : "";
  const totalBal = (wallet?.hl_equity ?? 0) + (wallet?.arb_usdc ?? 0);
  const isArb = !selectedChain.stargatePool;
  const amtNum = parseFloat(amount) || 0;
  const canDeposit = amtNum >= 1 && (sourceBalance === null || amtNum <= sourceBalance) && txStatus === "idle" && wallet?.address;
  const isBusy = !["idle", "success", "error"].includes(txStatus);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998] transition-opacity duration-300"
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", opacity: sheetVisible ? 1 : 0 }}
        onClick={isBusy ? undefined : onClose} />

      <div className="fixed left-0 right-0 z-[9999] mx-auto transition-transform duration-500"
        style={{ bottom: 48, maxWidth: "520px", transform: sheetVisible ? "translateY(0)" : "translateY(110%)", transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)", maxHeight: "88vh" }}>
        <div className="rounded-t-3xl overflow-y-auto" style={{ background: "linear-gradient(180deg, #0f1419 0%, #0a0e13 100%)", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none", maxHeight: "88vh" }}>

          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-9 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.2) 0%, rgba(45,212,191,0.05) 100%)", border: "1px solid rgba(45,212,191,0.15)" }}>
                <Download size={17} className="text-teal-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Deposit USDC</h2>
                <p className="text-[10px] text-gray-500 mt-0.5">Fund your copy-trading wallet</p>
              </div>
            </div>
            <button onClick={isBusy ? undefined : onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10" style={{ background: "rgba(255,255,255,0.05)" }}>
              <X size={15} className="text-gray-400" />
            </button>
          </div>

          <div className="px-6 pb-7">
            {loading && (
              <div className="py-16 flex flex-col items-center">
                <Loader2 size={28} className="text-teal-400 animate-spin mb-4" />
                <p className="text-xs text-gray-500">Setting up your deposit wallet…</p>
              </div>
            )}

            {!loading && error && (
              <div className="py-16 text-center">
                <p className="text-xs text-red-400 mb-4">{error}</p>
                <button onClick={initWallet} className="px-5 py-2 rounded-lg text-[11px] text-white font-medium" style={{ background: "rgba(255,255,255,0.08)" }}>Retry</button>
              </div>
            )}

            {!loading && !error && wallet && (
              <div className="space-y-5">

                {/* ═══ BALANCE HERO ═══ */}
                <div className="rounded-2xl px-5 py-5 text-center relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(45,212,191,0.01) 100%)", border: "1px solid rgba(45,212,191,0.1)" }}>
                  {/* Subtle glow */}
                  <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(45,212,191,0.15) 0%, transparent 70%)" }} />
                  <div className="relative">
                    <p className="text-[11px] text-gray-500 uppercase tracking-widest font-medium mb-2">Copy Trading Balance</p>
                    <p className="text-4xl font-bold text-white tracking-tight">
                      ${fmt(totalBal)}
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                        <span className="text-[11px] text-gray-400">Active <span className="text-white font-medium">${fmt(wallet.hl_equity)}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400/60" />
                        <span className="text-[11px] text-gray-400">Pending <span className="text-white font-medium">${fmt(wallet.arb_usdc)}</span></span>
                      </div>
                      <button onClick={refreshBalance} className="text-gray-500 hover:text-teal-400 transition-colors ml-1"><RefreshCw size={11} /></button>
                    </div>
                  </div>
                </div>

                {/* ═══ CHAIN SELECTOR ═══ */}
                <div>
                  <p className="text-[11px] text-gray-500 font-medium mb-2 ml-0.5 uppercase tracking-wider">Network</p>
                  <button
                    onClick={() => { if (!isBusy) setChainOpen(!chainOpen); }}
                    className="w-full rounded-xl px-4 py-3 flex items-center gap-3 transition-all"
                    style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${chainOpen ? "rgba(45,212,191,0.25)" : "rgba(255,255,255,0.07)"}` }}
                  >
                    <ChainIcon chain={selectedChain} size={26} />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-white">{selectedChain.name}</span>
                        {!selectedChain.stargatePool ? (
                          <span className="px-1.5 py-[2px] rounded text-[8px] font-bold uppercase tracking-wider" style={{ background: "rgba(45,212,191,0.15)", color: "#2dd4bf" }}>Direct · No fee</span>
                        ) : (
                          <span className="px-1.5 py-[2px] rounded text-[8px] font-medium uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.05)", color: "#888" }}>Stargate V2</span>
                        )}
                      </div>
                    </div>
                    <ChevronDown size={15} className={`text-gray-500 transition-transform duration-200 ${chainOpen ? "rotate-180" : ""}`} />
                  </button>

                  {chainOpen && (
                    <div className="mt-2 rounded-xl overflow-hidden" style={{ background: "rgba(12,16,22,0.98)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                      <div className="px-3 pt-3 pb-2">
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <Search size={13} className="text-gray-600 shrink-0" />
                          <input type="text" placeholder="Search networks…" value={chainSearch} onChange={(e) => setChainSearch(e.target.value)}
                            className="flex-1 bg-transparent text-[12px] text-white outline-none placeholder:text-gray-600" autoFocus />
                        </div>
                      </div>
                      <div className="max-h-[220px] overflow-y-auto px-1.5 pb-2" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
                        {filteredChains.length === 0 && <p className="text-[11px] text-gray-600 text-center py-6">No networks found</p>}
                        {filteredChains.map((c) => {
                          const sel = c.chainId === selectedChain.chainId;
                          return (
                            <button key={c.chainId}
                              onClick={() => { setSelectedChain(c); setChainOpen(false); setChainSearch(""); setAmount(""); setBridgeFee(null); setTxStatus("idle"); setTxError(""); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
                              style={{ background: sel ? "rgba(45,212,191,0.06)" : "transparent" }}
                              onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                              onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = "transparent"; }}>
                              <ChainIcon chain={c} size={24} />
                              <div className="flex-1 text-left">
                                <span className={`text-[12px] font-semibold ${sel ? "text-teal-400" : "text-white"}`}>{c.name}</span>
                                <span className="text-[10px] text-gray-600 ml-2">{c.shortName}</span>
                              </div>
                              {!c.stargatePool ? (
                                <span className="px-1.5 py-[1px] rounded text-[7px] font-bold uppercase" style={{ background: "rgba(45,212,191,0.12)", color: "#2dd4bf" }}>No fee</span>
                              ) : (
                                <span className="text-[9px] text-gray-600">~0.06% fee</span>
                              )}
                              {sel && <Check size={14} className="text-teal-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* ═══ AMOUNT ═══ */}
                <div>
                  <div className="flex items-center justify-between mb-2 ml-0.5">
                    <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Amount</p>
                    {loadingBalance ? (
                      <Loader2 size={11} className="text-gray-600 animate-spin" />
                    ) : sourceBalance !== null ? (
                      <span className="text-[11px] text-gray-500">
                        Balance: <span className="text-white font-medium">{fmt(sourceBalance)}</span> USDC
                      </span>
                    ) : null}
                  </div>
                  <div className="rounded-xl px-4 py-3.5 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <input type="number" inputMode="decimal" placeholder="0.00" value={amount}
                      onChange={(e) => setAmount(e.target.value)} disabled={isBusy}
                      className="flex-1 bg-transparent text-white text-xl font-bold outline-none placeholder:text-gray-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    <span className="text-[12px] text-gray-500 font-semibold">USDC</span>
                    {sourceBalance !== null && sourceBalance > 0 && (
                      <button onClick={() => setAmount(String(Math.floor(sourceBalance * 100) / 100))} disabled={isBusy}
                        className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all hover:opacity-80"
                        style={{ background: "rgba(45,212,191,0.15)", color: "#2dd4bf" }}>Max</button>
                    )}
                  </div>
                </div>

                {/* ═══ BRIDGE FEE ═══ */}
                {!isArb && amtNum > 0 && (
                  <div className="rounded-xl p-3.5 flex items-center justify-between" style={{ background: "rgba(255,184,0,0.03)", border: "1px solid rgba(255,184,0,0.08)" }}>
                    <div className="flex items-center gap-2">
                      <Zap size={13} className="text-yellow-400" />
                      <span className="text-[11px] text-gray-400">Bridge via Stargate V2</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-gray-300 font-medium">~{fmt(amtNum * 0.0006)} USDC + gas</p>
                      <p className="text-[9px] text-gray-600 mt-0.5">Arrives ~1-3 min</p>
                    </div>
                  </div>
                )}

                {/* ═══ DEPOSIT BUTTON ═══ */}
                <button onClick={handleDeposit} disabled={!canDeposit || isBusy}
                  className="w-full py-4 rounded-xl text-[14px] font-bold transition-all active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed"
                  style={{
                    background: canDeposit ? "linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)" : "rgba(255,255,255,0.06)",
                    color: canDeposit ? "#0a0f14" : "#555",
                    boxShadow: canDeposit ? "0 4px 20px rgba(45,212,191,0.25)" : "none",
                  }}>
                  {isBusy ? (
                    <span className="flex items-center justify-center gap-2"><Loader2 size={15} className="animate-spin" />{STATUS_LABELS[txStatus]}</span>
                  ) : txStatus === "success" ? (
                    <span className="flex items-center justify-center gap-2"><CheckCircle size={15} /> Deposit Sent!</span>
                  ) : (
                    `Deposit${amtNum > 0 ? ` $${fmt(amtNum)}` : ""} USDC${!isArb ? " via Stargate" : ""}`
                  )}
                </button>

                {/* ═══ TX STATUS ═══ */}
                {txHash && (
                  <a href={`${selectedChain.explorerUrl}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 text-[11px] text-teal-400 hover:underline font-medium">
                    View transaction <ExternalLink size={11} />
                  </a>
                )}

                {txStatus === "error" && txError && (
                  <div className="rounded-xl p-3.5 flex items-start gap-2.5" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-300/80 leading-relaxed">{txError}</p>
                  </div>
                )}

                {txStatus === "success" && (
                  <div className="rounded-xl p-4 text-center" style={{ background: "rgba(45,212,191,0.04)", border: "1px solid rgba(45,212,191,0.12)" }}>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      {isArb ? "USDC will be bridged to HyperLiquid automatically (~2 min)." : "USDC is bridging to Arbitrum (~1-3 min), then auto-deposits to HyperLiquid."}
                    </p>
                    <button onClick={() => { setTxStatus("idle"); setAmount(""); setTxHash(""); }}
                      className="mt-3 px-5 py-2 rounded-lg text-[11px] text-teal-400 font-semibold transition-all hover:bg-teal-400/10"
                      style={{ background: "rgba(45,212,191,0.08)" }}>Deposit More</button>
                  </div>
                )}

                {/* ═══ DIVIDER ═══ */}
                <div className="flex items-center gap-4 py-1">
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                  <button onClick={() => setShowManual(!showManual)}
                    className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1.5 font-medium">
                    Advanced: Send manually
                    <ChevronDown size={11} className={`transition-transform duration-200 ${showManual ? "rotate-180" : ""}`} />
                  </button>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                </div>

                {/* ═══ MANUAL DEPOSIT ═══ */}
                {showManual && (
                  <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {/* Header */}
                    <div className="px-4 pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet size={13} className="text-teal-400" />
                        <span className="text-[11px] font-semibold text-white">Your Dedicated Wallet</span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        This wallet is exclusively yours — generated by HyperCopy for isolated copy-trading. 
                        Send <strong className="text-gray-300">USDC on Arbitrum</strong> to this address. Minimum 5 USDC.
                        Funds auto-bridge to HyperLiquid.
                      </p>
                    </div>

                    {/* Address */}
                    <div className="px-4 pb-3">
                      <button onClick={copyAddress}
                        className="w-full rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-all active:scale-[0.98]"
                        style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${copied ? "rgba(45,212,191,0.3)" : "rgba(255,255,255,0.06)"}` }}>
                        <code className="text-[11px] text-white font-mono tracking-wide">{wallet.address}</code>
                        <div className="shrink-0 flex items-center gap-1.5">
                          {copied
                            ? <><span className="text-[10px] text-teal-400 font-medium">Copied</span><CheckCircle size={13} className="text-teal-400" /></>
                            : <><span className="text-[10px] text-gray-500">Copy</span><Copy size={13} className="text-gray-400" /></>}
                        </div>
                      </button>
                    </div>

                    {/* Arbiscan link */}
                    <div className="px-4 pb-4">
                      <a href={`https://arbiscan.io/address/${wallet.address}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all hover:bg-white/[0.03]"
                        style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
                        <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "rgba(45,130,246,0.1)" }}>
                          <ExternalLink size={10} className="text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-gray-400">View on Arbiscan</p>
                          <p className="text-[10px] text-gray-600 font-mono">{shortAddr}</p>
                        </div>
                        <span className="text-[9px] text-gray-600">Arbitrum One</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* ═══ WARNING ═══ */}
                <div className="rounded-xl p-3.5 flex items-start gap-3" style={{ background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.1)" }}>
                  <AlertTriangle size={14} className="text-red-400/80 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-red-300/80 font-semibold mb-1">Important</p>
                    <p className="text-[10px] text-red-300/60 leading-relaxed">
                      Only <strong className="text-red-300/80">USDC</strong> is supported. Sending other tokens will result in permanent loss.
                      {!isArb && <> Cross-chain deposits via Stargate V2 incur ~0.06% fee + native gas.</>}
                    </p>
                  </div>
                </div>

                {/* ═══ SECURITY ═══ */}
                <div className="rounded-xl p-3.5 flex items-start gap-3" style={{ background: "rgba(45,212,191,0.02)", border: "1px solid rgba(45,212,191,0.08)" }}>
                  <Shield size={14} className="text-teal-400/70 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    <span className="text-teal-400 font-semibold">Your dedicated copy-trading wallet.</span>{" "}
                    All positions are publicly verifiable on-chain. Withdrawals are only sent to your connected wallet.
                  </p>
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