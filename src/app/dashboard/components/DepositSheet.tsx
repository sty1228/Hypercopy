"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X, Download, Loader2, CheckCircle, AlertCircle,
  ExternalLink, Wallet, ArrowRight, Shield,
} from "lucide-react";
import { useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { toast } from "sonner";

// ─── Constants ───
// Arbitrum One
const ARBITRUM_CHAIN_ID = 42161;
const ARBITRUM_CHAIN_ID_HEX = "0xa4b1";

// USDC on Arbitrum (native, 6 decimals)
const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

// HyperLiquid Bridge on Arbitrum
// TODO: Verify this is the correct bridge address for your deployment
const HYPERLIQUID_BRIDGE = "0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
];

// TODO: Replace with actual HyperLiquid bridge ABI
// This is a common pattern — check HyperLiquid docs for exact function signature
const BRIDGE_ABI = [
  "function depositUsd(uint64 amount) external",
  // Alternative signatures that HL might use:
  // "function deposit(address user, uint256 amount) external",
  // "function sendUsd(address destination, uint64 amount) external",
];

type DepositStep = "input" | "switching" | "approving" | "depositing" | "success" | "error";

interface DepositSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DepositSheet({ isOpen, onClose }: DepositSheetProps) {
  const { wallets } = useWallets();
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

  // ─── Helper: get ethers provider from Privy wallet ───
  const getProvider = useCallback(async () => {
    if (!wallet) throw new Error("No wallet");
    const eip1193 = await wallet.getEthereumProvider();
    // @ts-ignore - ethers v5/v6 compat
    return new (ethers as any).providers.Web3Provider(eip1193);
  }, [wallet]);

  // ─── Load USDC balance on Arbitrum ───
  const loadBalance = useCallback(async () => {
    if (!wallet) return;
    setLoadingBalance(true);
    try {
      // Ensure we're on Arbitrum
      await wallet.switchChain(ARBITRUM_CHAIN_ID);
      const provider = await getProvider();
      // @ts-ignore - ethers v5/v6 compat
      const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
      const bal = await usdc.balanceOf(wallet.address);
      const decimals = await usdc.decimals();
      // @ts-ignore - ethers v5/v6 compat
      setUsdcBalance(ethers.utils.formatUnits(bal, decimals));
    } catch (err) {
      console.error("Failed to load USDC balance:", err);
      setUsdcBalance("0");
    } finally {
      setLoadingBalance(false);
    }
  }, [wallet, getProvider]);

  // ─── Deposit flow ───
  const handleDeposit = async () => {
    if (!wallet || !amount || parseFloat(amount) <= 0) return;

    const depositAmount = parseFloat(amount);
    const balNum = parseFloat(usdcBalance || "0");
    if (depositAmount > balNum) {
      toast.error("Insufficient USDC balance");
      return;
    }

    try {
      // Step 1: Switch to Arbitrum if needed
      setStep("switching");
      await wallet.switchChain(ARBITRUM_CHAIN_ID);

      const provider = await getProvider();
      const signer = provider.getSigner();
      // @ts-ignore - ethers v5/v6 compat
      const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);

      // USDC has 6 decimals
      // @ts-ignore - ethers v5/v6 compat
      const amountRaw = ethers.utils.parseUnits(amount, 6);

      // Step 2: Check allowance & approve if needed
      setStep("approving");
      const currentAllowance = await usdc.allowance(wallet.address, HYPERLIQUID_BRIDGE);

      if (currentAllowance.lt(amountRaw)) {
        const approveTx = await usdc.approve(HYPERLIQUID_BRIDGE, amountRaw);
        await approveTx.wait();
      }

      // Step 3: Deposit to HyperLiquid bridge
      setStep("depositing");
      // @ts-ignore - ethers v5/v6 compat
      const bridge = new ethers.Contract(HYPERLIQUID_BRIDGE, BRIDGE_ABI, signer);

      // HyperLiquid expects amount as uint64 in raw units (6 decimals)
      // TODO: Verify the exact function call — this may vary
      const depositTx = await bridge.depositUsd(amountRaw);
      const receipt = await depositTx.wait();

      setTxHash(receipt.transactionHash);
      setStep("success");
      toast.success(`Deposited $${depositAmount.toFixed(2)} USDC`);

      // Refresh balance
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
  const isValid = parsedAmount > 0 && parsedAmount <= balNum;

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] transition-opacity duration-300"
        style={{
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          opacity: sheetVisible ? 1 : 0,
        }}
        onClick={step === "input" || step === "success" || step === "error" ? handleClose : undefined}
      />

      {/* Sheet */}
      <div
        className="fixed left-0 right-0 z-[9999] mx-auto transition-transform duration-500"
        style={{
          bottom: 48,
          maxWidth: "580px",
          transform: sheetVisible ? "translateY(0)" : "translateY(110%)",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div
          className="rounded-t-3xl overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #111820 0%, #0a0f14 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderBottom: "none",
          }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-1 pb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(45,212,191,0.15)" }}
              >
                <Download size={16} className="text-teal-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Deposit USDC</h2>
                <span className="text-[10px] text-gray-500">Arbitrum → HyperLiquid</span>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          <div className="px-5 pb-6">
            {/* ─── Input Step ─── */}
            {step === "input" && (
              <div className="space-y-4">
                {/* Balance display */}
                <div
                  className="rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Wallet size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-400">Wallet USDC</span>
                  </div>
                  {loadingBalance ? (
                    <Loader2 size={14} className="text-gray-500 animate-spin" />
                  ) : (
                    <span className="text-sm font-semibold text-white">
                      {balNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                    </span>
                  )}
                </div>

                {/* Amount input */}
                <div>
                  <div
                    className="rounded-xl px-4 py-4 flex items-center gap-3"
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: `1px solid ${parsedAmount > balNum ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    <span className="text-xl text-gray-500 font-medium">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9.]/g, "");
                        if (v.split(".").length <= 2) setAmount(v);
                      }}
                      className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-gray-600"
                    />
                    <div
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-white">$</span>
                      </div>
                      <span className="text-xs font-semibold text-white">USDC</span>
                    </div>
                  </div>
                  {parsedAmount > balNum && (
                    <p className="text-[10px] text-red-400 mt-1 ml-1">Insufficient balance</p>
                  )}
                </div>

                {/* Info */}
                <div
                  className="rounded-xl p-3 flex items-start gap-2"
                  style={{
                    background: "rgba(45,212,191,0.04)",
                    border: "1px solid rgba(45,212,191,0.1)",
                  }}
                >
                  <Shield size={12} className="text-teal-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    USDC will be deposited from your Arbitrum wallet to your HyperLiquid perps account. Deposits typically confirm within a few minutes.
                  </p>
                </div>

                {/* Deposit button */}
                <button
                  onClick={handleDeposit}
                  disabled={!isValid || !wallet}
                  className="w-full py-3.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    background: isValid ? "rgba(45,212,191,1)" : "rgba(45,212,191,0.3)",
                    color: "#0a0f14",
                    boxShadow: isValid ? "0 0 25px rgba(45,212,191,0.4)" : "none",
                    opacity: isValid && wallet ? 1 : 0.5,
                  }}
                >
                  <Download size={16} />
                  {!wallet ? "Connect Wallet First" : `Deposit $${parsedAmount.toFixed(2)}`}
                </button>
              </div>
            )}

            {/* ─── Processing Steps ─── */}
            {(step === "switching" || step === "approving" || step === "depositing") && (
              <div className="py-8 flex flex-col items-center text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{
                    background: "rgba(45,212,191,0.08)",
                    border: "1.5px solid rgba(45,212,191,0.2)",
                  }}
                >
                  <Loader2 size={28} className="text-teal-400 animate-spin" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  {step === "switching" && "Switching to Arbitrum..."}
                  {step === "approving" && "Approving USDC..."}
                  {step === "depositing" && "Depositing to HyperLiquid..."}
                </h3>
                <p className="text-[11px] text-gray-400 max-w-[240px]">
                  {step === "switching" && "Please confirm the network switch in your wallet"}
                  {step === "approving" && "Approve USDC spending for the HyperLiquid bridge"}
                  {step === "depositing" && "Confirm the deposit transaction in your wallet"}
                </p>

                {/* Progress steps */}
                <div className="flex items-center gap-2 mt-6">
                  {["Switch", "Approve", "Deposit"].map((s, i) => {
                    const stepIdx = step === "switching" ? 0 : step === "approving" ? 1 : 2;
                    const done = i < stepIdx;
                    const active = i === stepIdx;
                    return (
                      <div key={s} className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
                          style={{
                            background: done ? "rgba(45,212,191,0.2)" : active ? "rgba(45,212,191,0.1)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${done ? "rgba(45,212,191,0.4)" : active ? "rgba(45,212,191,0.3)" : "rgba(255,255,255,0.08)"}`,
                            color: done || active ? "#2dd4bf" : "rgba(255,255,255,0.3)",
                          }}
                        >
                          {done ? <CheckCircle size={12} /> : i + 1}
                        </div>
                        <span className="text-[9px]" style={{ color: done || active ? "#2dd4bf" : "rgba(255,255,255,0.3)" }}>{s}</span>
                        {i < 2 && (
                          <ArrowRight size={10} style={{ color: "rgba(255,255,255,0.15)" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── Success ─── */}
            {step === "success" && (
              <div className="py-8 flex flex-col items-center text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{
                    background: "rgba(45,212,191,0.15)",
                    border: "1.5px solid rgba(45,212,191,0.3)",
                  }}
                >
                  <CheckCircle size={28} className="text-teal-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Deposit Successful!</h3>
                <p className="text-[11px] text-gray-400 mb-1">
                  ${parsedAmount.toFixed(2)} USDC deposited to HyperLiquid
                </p>
                <p className="text-[10px] text-gray-500 mb-5">
                  Funds will appear in your perps account shortly
                </p>

                {txHash && (
                  <a
                    href={`https://arbiscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] text-teal-400 mb-5 hover:underline"
                  >
                    <span>View on Arbiscan</span>
                    <ExternalLink size={10} />
                  </a>
                )}

                <button
                  onClick={handleClose}
                  className="px-8 py-2.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all active:scale-95"
                  style={{ background: "rgba(45,212,191,1)", color: "#0a0f14" }}
                >
                  Done
                </button>
              </div>
            )}

            {/* ─── Error ─── */}
            {step === "error" && (
              <div className="py-8 flex flex-col items-center text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1.5px solid rgba(239,68,68,0.2)",
                  }}
                >
                  <AlertCircle size={28} className="text-red-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Deposit Failed</h3>
                <p className="text-[11px] text-gray-400 mb-5 max-w-[260px]">{errorMsg}</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="px-6 py-2.5 rounded-xl text-[11px] font-semibold cursor-pointer"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      color: "rgba(255,255,255,0.6)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { setStep("input"); setErrorMsg(""); }}
                    className="px-6 py-2.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all active:scale-95"
                    style={{ background: "rgba(45,212,191,1)", color: "#0a0f14" }}
                  >
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