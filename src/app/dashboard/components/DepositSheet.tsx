"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X, Download, Loader2, Copy, CheckCircle,
  ExternalLink, Shield, RefreshCw, AlertTriangle,
  ChevronDown, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { ethers } from "ethers";
import { createOrGetWallet, getWalletBalance } from "@/service";
import { useCurrentWallet } from "@/hooks/usePrivyData";
import {
  CHAINS, CHAIN_LIST, ARB_LZ_EID,
  ERC20_ABI, USDC_DECIMALS, STARGATE_POOL_ABI,
  type ChainConfig,
} from "@/config/chains";

// ethers v5 compat — cast to any to avoid TS errors with dual v5/v6 types
const _ethers = ethers as any;
const JsonRpcProvider = _ethers.providers?.JsonRpcProvider ?? _ethers.JsonRpcProvider;
const Web3Provider = _ethers.providers?.Web3Provider ?? _ethers.BrowserProvider;
const ContractClass = _ethers.Contract;
const parseUnitsFunc = _ethers.utils?.parseUnits ?? _ethers.parseUnits;
const formatUnitsFunc = _ethers.utils?.formatUnits ?? _ethers.formatUnits;
const formatEtherFunc = _ethers.utils?.formatEther ?? _ethers.formatEther;
const hexZeroPadFunc = _ethers.utils?.hexZeroPad ?? _ethers.zeroPadValue;
const MaxUint256 = _ethers.constants?.MaxUint256 ?? _ethers.MaxUint256;

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
  const contract = new ContractClass(chain.usdc, ERC20_ABI, provider);
  const bal = await contract.balanceOf(address);
  return parseFloat(formatUnitsFunc(bal, USDC_DECIMALS));
}

function padAddress(addr: string): string {
  return hexZeroPadFunc(addr, 32);
}

// ── Component ──

export default function DepositSheet({ isOpen, onClose, onSuccess }: DepositSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Wallet state (dedicated wallet on backend)
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [error, setError] = useState("");

  // Chain & deposit state
  const [selectedChain, setSelectedChain] = useState<ChainConfig>(CHAINS.arbitrum);
  const [amount, setAmount] = useState("");
  const [sourceBalance, setSourceBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [bridgeFee, setBridgeFee] = useState<string | null>(null);

  // Tx state
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState("");
  const [txError, setTxError] = useState("");

  // Manual copy fallback
  const [copied, setCopied] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const privyWallet = useCurrentWallet();
  const abortRef = useRef(false);

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
    }
  }, [isOpen]);

  // Auto-refresh dedicated wallet balance
  useEffect(() => {
    if (!isOpen || !wallet) return;
    const iv = setInterval(refreshBalance, 15_000);
    return () => clearInterval(iv);
  }, [isOpen, wallet?.address]);

  // Read source USDC balance when chain changes
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
    try {
      const d = await getWalletBalance();
      setWallet(d);
    } catch {}
  };

  // ── Source chain balance ──

  const loadSourceBalance = async () => {
    if (!privyWallet?.address) return;
    setLoadingBalance(true);
    setSourceBalance(null);
    try {
      const bal = await readUSDCBalance(selectedChain, privyWallet.address);
      setSourceBalance(bal);
    } catch (e) {
      console.error("Balance read failed:", e);
      setSourceBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  // ── Get signer on the selected chain ──

  const getSignerOnChain = async () => {
    if (!privyWallet) throw new Error("Wallet not connected");

    const rawProvider = await privyWallet.getEthereumProvider();
    const provider = new Web3Provider(rawProvider as any);
    const network = await provider.getNetwork();

    if (network.chainId !== selectedChain.chainId) {
      setTxStatus("switching");
      await privyWallet.switchChain(selectedChain.chainId);
      await new Promise((r) => setTimeout(r, 500));
      // Re-get provider after chain switch
      const newRaw = await privyWallet.getEthereumProvider();
      const newProvider = new Web3Provider(newRaw as any);
      return newProvider.getSigner();
    }

    return provider.getSigner();
  };

  // ── Deposit: Arbitrum direct transfer ──

  const depositArbitrum = async () => {
    if (!wallet?.address) return;
    const signer = await getSignerOnChain();
    const rawAmount = parseUnitsFunc(amount, USDC_DECIMALS);
    const usdc = new ContractClass(selectedChain.usdc, ERC20_ABI, signer);

    setTxStatus("sending");
    const tx = await usdc.transfer(wallet.address, rawAmount);
    setTxHash(tx.hash);
    setTxStatus("confirming");
    await tx.wait();
  };

  // ── Deposit: Stargate V2 cross-chain bridge ──

  const depositStargate = async () => {
    if (!wallet?.address || !selectedChain.stargatePool) return;
    const signer = await getSignerOnChain();
    const rawAmount = parseUnitsFunc(amount, USDC_DECIMALS);
    const minAmount = rawAmount.mul(995).div(1000); // 0.5% slippage
    const toBytes32 = padAddress(wallet.address);

    const sendParam = {
      dstEid: ARB_LZ_EID,
      to: toBytes32,
      amountLD: rawAmount,
      minAmountLD: minAmount,
      extraOptions: "0x",
      composeMsg: "0x",
      oftCmd: "0x", // taxi mode
    };

    // 1. Approve USDC to Stargate pool
    setTxStatus("approving");
    const usdc = new ContractClass(selectedChain.usdc, ERC20_ABI, signer);
    const userAddr = await signer.getAddress();
    const allowance = await usdc.allowance(userAddr, selectedChain.stargatePool);
    if (allowance.lt(rawAmount)) {
      const approveTx = await usdc.approve(selectedChain.stargatePool, MaxUint256);
      await approveTx.wait();
    }

    if (abortRef.current) return;

    // 2. Quote bridge fee
    setTxStatus("quoting");
    const pool = new ContractClass(selectedChain.stargatePool, STARGATE_POOL_ABI, signer);
    const [msgFee] = await pool.quoteSend(sendParam, false);
    const nativeFee = msgFee.nativeFee.mul(110).div(100); // 10% buffer
    const fee = { nativeFee, lzTokenFee: 0 };
    setBridgeFee(formatEtherFunc(nativeFee));

    if (abortRef.current) return;

    // 3. Send
    setTxStatus("sending");
    const tx = await pool.sendToken(sendParam, fee, userAddr, { value: nativeFee });
    setTxHash(tx.hash);
    setTxStatus("confirming");
    await tx.wait();
  };

  // ── Deposit handler ──

  const handleDeposit = async () => {
    const amtNum = parseFloat(amount);
    if (!amtNum || amtNum < 1) {
      toast.error("Minimum deposit is 1 USDC");
      return;
    }
    if (sourceBalance !== null && amtNum > sourceBalance) {
      toast.error("Insufficient USDC balance");
      return;
    }

    setTxStatus("idle");
    setTxError("");
    setTxHash("");
    abortRef.current = false;

    try {
      if (!selectedChain.stargatePool) {
        await depositArbitrum();
      } else {
        await depositStargate();
      }

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

  // ── Copy address fallback ──

  const copyAddress = () => {
    if (!wallet?.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Derived ──

  const totalBalance = (wallet?.hl_equity ?? 0) + (wallet?.arb_usdc ?? 0);
  const isArb = !selectedChain.stargatePool;
  const amtNum = parseFloat(amount) || 0;
  const canDeposit = amtNum >= 1 && (sourceBalance === null || amtNum <= sourceBalance) && txStatus === "idle" && wallet?.address;
  const isBusy = txStatus !== "idle" && txStatus !== "success" && txStatus !== "error";

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
            {/* Loading state */}
            {loading && (
              <div className="py-12 flex flex-col items-center">
                <Loader2 size={24} className="text-teal-400 animate-spin mb-3" />
                <p className="text-xs text-gray-500">Setting up your deposit address…</p>
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="py-12 text-center">
                <p className="text-xs text-red-400 mb-3">{error}</p>
                <button onClick={initWallet} className="px-4 py-2 rounded-lg text-[11px] text-white" style={{ background: "rgba(255,255,255,0.1)" }}>Retry</button>
              </div>
            )}

            {/* Main content */}
            {!loading && !error && wallet && (
              <div className="space-y-4">

                {/* ── Balance card ── */}
                <div className="rounded-xl px-4 py-3 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] text-gray-500 mb-1">Copy Trading Balance</p>
                  <p className="text-2xl font-bold text-white">${fmt(totalBalance)}</p>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    <span className="text-[10px] text-gray-500">Active: ${fmt(wallet.hl_equity)}</span>
                    <span className="text-[10px] text-gray-500">Pending: ${fmt(wallet.arb_usdc)}</span>
                    <button onClick={refreshBalance} className="text-gray-500 hover:text-teal-400 transition-colors">
                      <RefreshCw size={10} />
                    </button>
                  </div>
                </div>

                {/* ── Chain selector ── */}
                <div>
                  <p className="text-[11px] text-gray-400 font-medium mb-2 ml-1">Select Network</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {CHAIN_LIST.map((c) => {
                      const active = c.chainId === selectedChain.chainId;
                      return (
                        <button
                          key={c.chainId}
                          onClick={() => {
                            if (isBusy) return;
                            setSelectedChain(c);
                            setAmount("");
                            setBridgeFee(null);
                            setTxStatus("idle");
                            setTxError("");
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl shrink-0 transition-all"
                          style={{
                            background: active ? `${c.color}18` : "rgba(255,255,255,0.04)",
                            border: `1px solid ${active ? `${c.color}50` : "rgba(255,255,255,0.06)"}`,
                          }}
                        >
                          <span className="text-[11px]">{c.icon}</span>
                          <span className={`text-[11px] font-semibold ${active ? "text-white" : "text-gray-500"}`}>
                            {c.shortName}
                          </span>
                          {active && !c.stargatePool && (
                            <span className="px-1 py-[1px] rounded text-[7px] font-bold uppercase tracking-wider" style={{ background: "rgba(45,212,191,0.2)", color: "#2dd4bf" }}>
                              No fee
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Amount input ── */}
                <div>
                  <div className="flex items-center justify-between mb-2 ml-1">
                    <p className="text-[11px] text-gray-400 font-medium">Amount</p>
                    <div className="flex items-center gap-1">
                      {loadingBalance ? (
                        <Loader2 size={10} className="text-gray-500 animate-spin" />
                      ) : sourceBalance !== null ? (
                        <span className="text-[10px] text-gray-500">
                          Balance: {fmt(sourceBalance)} USDC
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div
                    className="rounded-xl px-4 py-3 flex items-center gap-3"
                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={isBusy}
                      className="flex-1 bg-transparent text-white text-lg font-semibold outline-none placeholder:text-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[11px] text-gray-500 font-medium">USDC</span>
                    {sourceBalance !== null && sourceBalance > 0 && (
                      <button
                        onClick={() => setAmount(String(Math.floor(sourceBalance * 100) / 100))}
                        disabled={isBusy}
                        className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors"
                        style={{ background: "rgba(45,212,191,0.12)", color: "#2dd4bf" }}
                      >
                        Max
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Bridge fee estimate (non-Arbitrum) ── */}
                {!isArb && amtNum > 0 && (
                  <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center gap-2">
                      <Zap size={12} className="text-yellow-400" />
                      <span className="text-[10px] text-gray-400">Bridge via Stargate V2</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400">
                        Fee: ~{fmt(amtNum * 0.0006)} USDC + gas
                      </p>
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
                      <CheckCircle size={14} />
                      Deposit Sent!
                    </span>
                  ) : (
                    `Deposit${amtNum > 0 ? ` $${fmt(amtNum)}` : ""} USDC${!isArb ? " via Stargate" : ""}`
                  )}
                </button>

                {/* ── Tx status details ── */}
                {txHash && (
                  <a
                    href={`${selectedChain.explorerUrl}/tx/${txHash}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 text-[10px] text-teal-400 hover:underline"
                  >
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
                      {isArb
                        ? "USDC will be bridged to HyperLiquid automatically (~2 min)."
                        : "USDC is bridging to Arbitrum (~1-3 min), then auto-deposits to HyperLiquid."
                      }
                    </p>
                    <button
                      onClick={() => { setTxStatus("idle"); setAmount(""); setTxHash(""); }}
                      className="mt-2 px-4 py-1.5 rounded-lg text-[10px] text-teal-400 font-medium"
                      style={{ background: "rgba(45,212,191,0.1)" }}
                    >
                      Deposit More
                    </button>
                  </div>
                )}

                {/* ── Divider: manual option ── */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <button
                    onClick={() => setShowManual(!showManual)}
                    className="text-[9px] text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1"
                  >
                    Or send manually <ChevronDown size={10} className={`transition-transform ${showManual ? "rotate-180" : ""}`} />
                  </button>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                </div>

                {/* ── Manual address copy (collapsed) ── */}
                {showManual && (
                  <div className="space-y-3">
                    <button
                      onClick={copyAddress}
                      className="w-full rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-all active:scale-[0.98]"
                      style={{
                        background: "rgba(0,0,0,0.3)",
                        border: `1px solid ${copied ? "rgba(45,212,191,0.4)" : "rgba(255,255,255,0.08)"}`,
                      }}
                    >
                      <code className="text-[10px] text-white font-mono truncate">{wallet.address}</code>
                      <div className="shrink-0 flex items-center gap-1.5">
                        {copied ? (
                          <><span className="text-[9px] text-teal-400">Copied</span><CheckCircle size={12} className="text-teal-400" /></>
                        ) : (
                          <><span className="text-[9px] text-gray-500">Copy</span><Copy size={12} className="text-gray-400" /></>
                        )}
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
                          <span>Cross-chain deposits use <strong className="text-red-300/90">Stargate V2</strong> bridge. A small fee (~0.06%) + native gas applies.</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* ── Safety note ── */}
                <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(45,212,191,0.04)", border: "1px solid rgba(45,212,191,0.1)" }}>
                  <Shield size={12} className="text-teal-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    This is <span className="text-teal-400 font-semibold">your dedicated copy-trading wallet</span>. All positions are verifiable on-chain. Withdrawals only go to your connected wallet.
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