"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X, Download, Loader2, Copy, CheckCircle,
  ExternalLink, Shield, RefreshCw, AlertTriangle,
  ChevronDown, Zap, Search, Check,
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


// ── Chain Icons (inline SVG) ──

function ChainIcon({ chain, size = 20 }: { chain: ChainConfig; size?: number }) {
  const s = size;
  const icons: Record<string, React.ReactNode> = {
    arbitrum: (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#2D374B"/>
        <path d="M21.8 15.4l5.1 8.2-2.3 1.4-5.1-8.2 2.3-1.4z" fill="#28A0F0"/>
        <path d="M27.4 24.4l2-1.2 1.4 2.3-2 1.2-1.4-2.3z" fill="#28A0F0"/>
        <path d="M14.1 25.2l5.1-8.2 2.3 1.4-5.1 8.2-2.3-1.4z" fill="white"/>
        <path d="M11.2 25.5l1.4-2.3 2 1.2-1.4 2.3-2-1.2z" fill="white"/>
        <path d="M20 10l-9 15.5 2.2 1.3L20 14.5l6.8 12.3 2.2-1.3L20 10z" fill="none" stroke="#96BEDC" strokeWidth="0.5"/>
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
  return icons[key] || <div style={{ width: s, height: s, borderRadius: "50%", background: chain.color }} />;
}

// ── Types ──

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

type TxStatus = "idle" | "switching" | "approving" | "quoting" | "sending" | "confirming" | "success" | "error";

const STATUS_LABELS: Record<TxStatus, string> = {
  idle: "",
  switching: "Switching network…",
  approving: "Approving USDC…",
  quoting: "Estimating bridge fee…",
  sending: "Confirm in wallet…",
  confirming: "Waiting for confirmation…",
  success: "Deposit sent!",
  error: "Transaction failed",
};

// ── Helpers ──

const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

async function readUSDCBalance(chain: ChainConfig, address: string): Promise<number> {
  const provider = new JsonRpcProvider(chain.rpcUrl);
  const contract = new Contract(chain.usdc, ERC20_ABI, provider);
  const bal = await contract.balanceOf(address);
  return parseFloat(formatUnits(bal, chain.usdcDecimals));
}

function padAddress(addr: string): string {
  return hexZeroPad(addr, 32);
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
    return CHAIN_LIST.filter(
      (c) => c.name.toLowerCase().includes(q) || c.shortName.toLowerCase().includes(q)
    );
  }, [chainSearch]);

  // ── Mount / open ──

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setSheetVisible(true));
      initWallet();
      abortRef.current = false;
    } else {
      setSheetVisible(false);
      setTxStatus("idle");
      setTxHash("");
      setTxError("");
      setAmount("");
      setBridgeFee(null);
      setShowManual(false);
      setChainOpen(false);
      setChainSearch("");
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

  // ── Backend wallet init ──

  const initWallet = async () => {
    setLoading(true);
    setError("");
    try {
      await createOrGetWallet();
      await refreshBalance();
    } catch (e: any) {
      setError(e?.message || "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    try { setWallet(await getWalletBalance()); } catch {}
  };

  const loadSourceBalance = async () => {
    if (!privyWallet?.address) return;
    setLoadingBalance(true);
    setSourceBalance(null);
    try {
      setSourceBalance(await readUSDCBalance(selectedChain, privyWallet.address));
    } catch (e) {
      console.error("Balance read failed:", e);
      setSourceBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  // ── Get signer ──

  const getSignerOnChain = async () => {
    if (!privyWallet) throw new Error("Wallet not connected");
    const rawProvider = await privyWallet.getEthereumProvider();
    const provider = new Web3Provider(rawProvider as any);
    const network = await provider.getNetwork();

    if (network.chainId !== selectedChain.chainId) {
      setTxStatus("switching");
      await privyWallet.switchChain(selectedChain.chainId);
      await new Promise((r) => setTimeout(r, 500));
      const p2 = await privyWallet.getEthereumProvider();
      return new Web3Provider(p2 as any).getSigner();
    }
    return provider.getSigner();
  };

  // ── Deposit: Arbitrum direct ──

  const depositArbitrum = async () => {
    if (!wallet?.address) return;
    const signer = await getSignerOnChain();
    const raw = parseUnits(amount, selectedChain.usdcDecimals);
    const usdc = new Contract(selectedChain.usdc, ERC20_ABI, signer);
    setTxStatus("sending");
    const tx = await usdc.transfer(wallet.address, raw);
    setTxHash(tx.hash);
    setTxStatus("confirming");
    await tx.wait();
  };

  // ── Deposit: Stargate V2 ──

  const depositStargate = async () => {
    if (!wallet?.address || !selectedChain.stargatePool) return;
    const signer = await getSignerOnChain();
    const raw = parseUnits(amount, selectedChain.usdcDecimals);
    const min = raw.mul(995).div(1000);
    const to32 = padAddress(wallet.address);

    const sp = {
      dstEid: ARB_LZ_EID, to: to32, amountLD: raw, minAmountLD: min,
      extraOptions: "0x", composeMsg: "0x", oftCmd: "0x",
    };

    setTxStatus("approving");
    const usdc = new Contract(selectedChain.usdc, ERC20_ABI, signer);
    const addr = await signer.getAddress();
    const allow = await usdc.allowance(addr, selectedChain.stargatePool);
    if (allow.lt(raw)) {
      const atx = await usdc.approve(selectedChain.stargatePool, MaxUint256);
      await atx.wait();
    }
    if (abortRef.current) return;

    setTxStatus("quoting");
    const pool = new Contract(selectedChain.stargatePool, STARGATE_POOL_ABI, signer);
    const [msgFee] = await pool.quoteSend(sp, false);
    const nFee = msgFee.nativeFee.mul(110).div(100);
    const fee = { nativeFee: nFee, lzTokenFee: 0 };
    setBridgeFee(formatEther(nFee));
    if (abortRef.current) return;

    setTxStatus("sending");
    const tx = await pool.sendToken(sp, fee, addr, { value: nFee });
    setTxHash(tx.hash);
    setTxStatus("confirming");
    await tx.wait();
  };

  const handleDeposit = async () => {
    const n = parseFloat(amount);
    if (!n || n < 1) { toast.error("Minimum deposit is 1 USDC"); return; }
    if (sourceBalance !== null && n > sourceBalance) { toast.error("Insufficient USDC balance"); return; }

    setTxStatus("idle"); setTxError(""); setTxHash(""); abortRef.current = false;

    try {
      if (!selectedChain.stargatePool) await depositArbitrum();
      else await depositStargate();
      setTxStatus("success");
      toast.success("Deposit sent! Funds will arrive in ~1-3 minutes.");
      onSuccess?.();
      loadSourceBalance();
      refreshBalance();
    } catch (e: any) {
      if (abortRef.current) return;
      console.error("Deposit failed:", e);
      const msg = e?.reason || e?.message || "Transaction failed";
      setTxError(msg.length > 120 ? msg.slice(0, 120) + "…" : msg);
      setTxStatus("error");
      toast.error("Deposit failed");
    }
  };

  const copyAddress = () => {
    if (!wallet?.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Derived ──

  const totalBal = (wallet?.hl_equity ?? 0) + (wallet?.arb_usdc ?? 0);
  const isArb = !selectedChain.stargatePool;
  const amtNum = parseFloat(amount) || 0;
  const canDeposit = amtNum >= 1 && (sourceBalance === null || amtNum <= sourceBalance) && txStatus === "idle" && wallet?.address;
  const isBusy = !["idle", "success", "error"].includes(txStatus);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] transition-opacity duration-300"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", opacity: sheetVisible ? 1 : 0 }}
        onClick={isBusy ? undefined : onClose}
      />

      {/* Sheet */}
      <div
        className="fixed left-0 right-0 z-[9999] mx-auto transition-transform duration-500"
        style={{
          bottom: 48, maxWidth: "580px",
          transform: sheetVisible ? "translateY(0)" : "translateY(110%)",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          maxHeight: "85vh",
        }}
      >
        <div
          className="rounded-t-3xl overflow-y-auto"
          style={{
            background: "linear-gradient(180deg, #111820 0%, #0a0f14 100%)",
            border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none",
            maxHeight: "85vh",
          }}
        >
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
            <button onClick={isBusy ? undefined : onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          <div className="px-5 pb-6">
            {loading && (
              <div className="py-12 flex flex-col items-center">
                <Loader2 size={24} className="text-teal-400 animate-spin mb-3" />
                <p className="text-xs text-gray-500">Setting up your deposit address…</p>
              </div>
            )}

            {!loading && error && (
              <div className="py-12 text-center">
                <p className="text-xs text-red-400 mb-3">{error}</p>
                <button onClick={initWallet} className="px-4 py-2 rounded-lg text-[11px] text-white" style={{ background: "rgba(255,255,255,0.1)" }}>Retry</button>
              </div>
            )}

            {!loading && !error && wallet && (
              <div className="space-y-4">

                {/* ── Balance ── */}
                <div className="rounded-xl px-4 py-3 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] text-gray-500 mb-1">Copy Trading Balance</p>
                  <p className="text-2xl font-bold text-white">${fmt(totalBal)}</p>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    <span className="text-[10px] text-gray-500">Active: ${fmt(wallet.hl_equity)}</span>
                    <span className="text-[10px] text-gray-500">Pending: ${fmt(wallet.arb_usdc)}</span>
                    <button onClick={refreshBalance} className="text-gray-500 hover:text-teal-400 transition-colors"><RefreshCw size={10} /></button>
                  </div>
                </div>

                {/* ── Chain selector (dropdown) ── */}
                <div>
                  <p className="text-[11px] text-gray-400 font-medium mb-2 ml-1">Select Network</p>

                  {/* Selected chain button */}
                  <button
                    onClick={() => { if (!isBusy) setChainOpen(!chainOpen); }}
                    className="w-full rounded-xl px-3.5 py-2.5 flex items-center gap-3 transition-all"
                    style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${chainOpen ? "rgba(45,212,191,0.3)" : "rgba(255,255,255,0.08)"}` }}
                  >
                    <ChainIcon chain={selectedChain} size={24} />
                    <div className="flex-1 text-left">
                      <span className="text-[12px] font-semibold text-white">{selectedChain.name}</span>
                      {!selectedChain.stargatePool && (
                        <span className="ml-2 px-1.5 py-[1px] rounded text-[7px] font-bold uppercase tracking-wider" style={{ background: "rgba(45,212,191,0.2)", color: "#2dd4bf" }}>
                          No fee
                        </span>
                      )}
                      {selectedChain.stargatePool && (
                        <span className="ml-2 text-[9px] text-gray-600">via Stargate V2</span>
                      )}
                    </div>
                    <ChevronDown size={14} className={`text-gray-500 transition-transform ${chainOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown */}
                  {chainOpen && (
                    <div
                      className="mt-2 rounded-xl overflow-hidden"
                      style={{ background: "rgba(15,20,28,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      {/* Search */}
                      <div className="px-3 pt-3 pb-2">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <Search size={12} className="text-gray-500 shrink-0" />
                          <input
                            type="text"
                            placeholder="Search networks…"
                            value={chainSearch}
                            onChange={(e) => setChainSearch(e.target.value)}
                            className="flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-gray-600"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Chain list */}
                      <div className="max-h-[200px] overflow-y-auto px-1.5 pb-1.5" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
                        {filteredChains.length === 0 && (
                          <p className="text-[10px] text-gray-600 text-center py-4">No networks found</p>
                        )}
                        {filteredChains.map((c) => {
                          const sel = c.chainId === selectedChain.chainId;
                          return (
                            <button
                              key={c.chainId}
                              onClick={() => {
                                setSelectedChain(c);
                                setChainOpen(false);
                                setChainSearch("");
                                setAmount("");
                                setBridgeFee(null);
                                setTxStatus("idle");
                                setTxError("");
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                              style={{ background: sel ? "rgba(45,212,191,0.08)" : "transparent" }}
                              onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                              onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = "transparent"; }}
                            >
                              <ChainIcon chain={c} size={22} />
                              <div className="flex-1 text-left">
                                <span className={`text-[11px] font-semibold ${sel ? "text-teal-400" : "text-white"}`}>{c.name}</span>
                                <span className="text-[10px] text-gray-600 ml-1.5">{c.shortName}</span>
                              </div>
                              {!c.stargatePool && (
                                <span className="px-1.5 py-[1px] rounded text-[7px] font-bold uppercase" style={{ background: "rgba(45,212,191,0.15)", color: "#2dd4bf" }}>
                                  No fee
                                </span>
                              )}
                              {c.stargatePool && (
                                <span className="text-[9px] text-gray-600">~0.06%</span>
                              )}
                              {sel && <Check size={13} className="text-teal-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Amount ── */}
                <div>
                  <div className="flex items-center justify-between mb-2 ml-1">
                    <p className="text-[11px] text-gray-400 font-medium">Amount</p>
                    <div className="flex items-center gap-1">
                      {loadingBalance ? (
                        <Loader2 size={10} className="text-gray-500 animate-spin" />
                      ) : sourceBalance !== null ? (
                        <span className="text-[10px] text-gray-500">Balance: {fmt(sourceBalance)} USDC</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <input
                      type="number" inputMode="decimal" placeholder="0.00"
                      value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isBusy}
                      className="flex-1 bg-transparent text-white text-lg font-semibold outline-none placeholder:text-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[11px] text-gray-500 font-medium">USDC</span>
                    {sourceBalance !== null && sourceBalance > 0 && (
                      <button
                        onClick={() => setAmount(String(Math.floor(sourceBalance * 100) / 100))}
                        disabled={isBusy}
                        className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider"
                        style={{ background: "rgba(45,212,191,0.12)", color: "#2dd4bf" }}
                      >Max</button>
                    )}
                  </div>
                </div>

                {/* ── Bridge fee (non-Arb) ── */}
                {!isArb && amtNum > 0 && (
                  <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center gap-2">
                      <Zap size={12} className="text-yellow-400" />
                      <span className="text-[10px] text-gray-400">Bridge via Stargate V2</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400">Fee: ~{fmt(amtNum * 0.0006)} USDC + gas</p>
                      <p className="text-[9px] text-gray-600">Arrives in ~1-3 min</p>
                    </div>
                  </div>
                )}

                {/* ── Deposit button ── */}
                <button
                  onClick={handleDeposit}
                  disabled={!canDeposit || isBusy}
                  className="w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: canDeposit ? "linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)" : "rgba(255,255,255,0.08)",
                    color: canDeposit ? "#0a0f14" : "#666",
                  }}
                >
                  {isBusy ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      {STATUS_LABELS[txStatus]}
                    </span>
                  ) : txStatus === "success" ? (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle size={14} /> Deposit Sent!
                    </span>
                  ) : (
                    `Deposit${amtNum > 0 ? ` $${fmt(amtNum)}` : ""} USDC${!isArb ? " via Stargate" : ""}`
                  )}
                </button>

                {/* ── Tx details ── */}
                {txHash && (
                  <a href={`${selectedChain.explorerUrl}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 text-[10px] text-teal-400 hover:underline">
                    View transaction <ExternalLink size={10} />
                  </a>
                )}

                {txStatus === "error" && txError && (
                  <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <AlertTriangle size={12} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-red-300/80">{txError}</p>
                  </div>
                )}

                {txStatus === "success" && (
                  <div className="rounded-xl p-3 text-center" style={{ background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.15)" }}>
                    <p className="text-[10px] text-gray-400">
                      {isArb ? "USDC will be bridged to HyperLiquid automatically (~2 min)." : "USDC is bridging to Arbitrum (~1-3 min), then auto-deposits to HyperLiquid."}
                    </p>
                    <button
                      onClick={() => { setTxStatus("idle"); setAmount(""); setTxHash(""); }}
                      className="mt-2 px-4 py-1.5 rounded-lg text-[10px] text-teal-400 font-medium"
                      style={{ background: "rgba(45,212,191,0.1)" }}
                    >Deposit More</button>
                  </div>
                )}

                {/* ── Manual ── */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <button onClick={() => setShowManual(!showManual)}
                    className="text-[9px] text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1">
                    Or send manually <ChevronDown size={10} className={`transition-transform ${showManual ? "rotate-180" : ""}`} />
                  </button>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                </div>

                {showManual && (
                  <div className="space-y-3">
                    <button onClick={copyAddress}
                      className="w-full rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-all active:scale-[0.98]"
                      style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${copied ? "rgba(45,212,191,0.4)" : "rgba(255,255,255,0.08)"}` }}>
                      <code className="text-[10px] text-white font-mono truncate">{wallet.address}</code>
                      <div className="shrink-0 flex items-center gap-1.5">
                        {copied
                          ? <><span className="text-[9px] text-teal-400">Copied</span><CheckCircle size={12} className="text-teal-400" /></>
                          : <><span className="text-[9px] text-gray-500">Copy</span><Copy size={12} className="text-gray-400" /></>}
                      </div>
                    </button>
                    <p className="text-[9px] text-gray-600 text-center">
                      Send <strong className="text-gray-400">USDC on Arbitrum</strong> to this address. Min 5 USDC. Auto-deposits to HyperLiquid.
                    </p>
                  </div>
                )}

                {/* ── Warning ── */}
                <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-red-300/90 font-semibold mb-0.5">Important</p>
                    <ul className="space-y-1">
                      <li className="text-[9.5px] text-red-300/70 leading-relaxed flex items-start gap-1.5">
                        <span className="shrink-0 mt-[3px]">•</span>
                        <span>Only <strong className="text-red-300/90">USDC</strong> is supported. Other tokens will be <strong className="text-red-300/90">permanently lost</strong>.</span>
                      </li>
                      {!isArb && (
                        <li className="text-[9.5px] text-red-300/70 leading-relaxed flex items-start gap-1.5">
                          <span className="shrink-0 mt-[3px]">•</span>
                          <span>Cross-chain via <strong className="text-red-300/90">Stargate V2</strong>. ~0.06% fee + native gas.</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* ── Safety ── */}
                <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(45,212,191,0.04)", border: "1px solid rgba(45,212,191,0.1)" }}>
                  <Shield size={12} className="text-teal-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    <span className="text-teal-400 font-semibold">Your dedicated copy-trading wallet.</span> All positions verifiable on-chain. Withdrawals only to your connected wallet.
                  </p>
                </div>

                <a href={`https://arbiscan.io/address/${wallet.address}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500 hover:text-teal-400 transition-colors py-1">
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