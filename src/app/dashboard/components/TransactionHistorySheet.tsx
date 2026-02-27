"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X, Download, Upload, Loader2, CheckCircle, Clock,
  AlertCircle, ArrowDownUp, RefreshCw,
} from "lucide-react";
import { getTransactions } from "@/service";

interface Transaction {
  id: string;
  type: "deposit" | "withdraw";
  amount: number;
  status: string;
  tx_hash: string | null;
  created_at: string;
  completed_at: string | null;
}

interface TransactionHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  // Deposit statuses
  detected:   { label: "Detected",   color: "text-yellow-400", icon: Clock },
  bridging:   { label: "Bridging",   color: "text-yellow-400", icon: Loader2 },
  bridged:    { label: "Completed",  color: "text-teal-400",   icon: CheckCircle },
  // Withdraw statuses
  initiated:     { label: "Initiated",   color: "text-yellow-400", icon: Clock },
  hl_withdrawn:  { label: "Processing",  color: "text-yellow-400", icon: Loader2 },
  sending:       { label: "Sending",     color: "text-purple-400", icon: Loader2 },
  completed:     { label: "Completed",   color: "text-teal-400",   icon: CheckCircle },
  timeout:       { label: "Timeout",     color: "text-red-400",    icon: AlertCircle },
  failed:        { label: "Failed",      color: "text-red-400",    icon: AlertCircle },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  if (diff < 60_000) return "Just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  if (diff < 604800_000) return `${Math.floor(diff / 86400_000)}d ago`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function shortenHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

export default function TransactionHistorySheet({
  isOpen,
  onClose,
}: TransactionHistorySheetProps) {
  const [mounted, setMounted] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchTxs = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (e) {
      console.error("[TxHistory] Failed to load:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setSheetVisible(true));
      fetchTxs();
    } else {
      setSheetVisible(false);
    }
  }, [isOpen, fetchTxs]);

  // Auto-refresh if any tx is in-progress
  useEffect(() => {
    if (!isOpen) return;
    const hasPending = transactions.some((t) =>
      ["detected", "bridging", "initiated", "hl_withdrawn", "sending"].includes(t.status)
    );
    if (!hasPending) return;
    const iv = setInterval(() => fetchTxs(false), 5_000);
    return () => clearInterval(iv);
  }, [isOpen, transactions, fetchTxs]);

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
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed left-0 right-0 z-[9999] mx-auto transition-transform duration-500"
        style={{
          bottom: 48,
          maxWidth: "580px",
          maxHeight: "70vh",
          transform: sheetVisible ? "translateY(0)" : "translateY(110%)",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div
          className="rounded-t-3xl overflow-hidden flex flex-col"
          style={{
            background: "linear-gradient(180deg, #111820 0%, #0a0f14 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderBottom: "none",
            maxHeight: "70vh",
          }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-1 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(45,212,191,0.15)" }}
              >
                <ArrowDownUp size={16} className="text-teal-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Transactions</h2>
                <span className="text-[10px] text-gray-500">
                  Deposits & Withdrawals
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchTxs(false)}
                disabled={refreshing}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <RefreshCw size={14} className={`text-gray-400 ${refreshing ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content — scrollable */}
          <div className="flex-1 overflow-y-auto px-5 pb-6">
            {loading ? (
              <div className="py-12 flex flex-col items-center">
                <Loader2 size={24} className="text-gray-500 animate-spin mb-2" />
                <p className="text-[11px] text-gray-500">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-12 flex flex-col items-center">
                <ArrowDownUp size={24} className="text-gray-600 mb-2" />
                <p className="text-[11px] text-gray-500">No transactions yet</p>
                <p className="text-[10px] text-gray-600 mt-1">
                  Deposits and withdrawals will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => {
                  const isDeposit = tx.type === "deposit";
                  const cfg = STATUS_CONFIG[tx.status] || STATUS_CONFIG.failed;
                  const StatusIcon = cfg.icon;
                  const isSpinning = [Loader2].includes(StatusIcon) &&
                    ["bridging", "hl_withdrawn", "sending"].includes(tx.status);

                  return (
                    <div
                      key={tx.id}
                      className="rounded-xl px-4 py-3 transition-all"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        {/* Left: icon + type */}
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{
                              background: isDeposit
                                ? "rgba(45,212,191,0.1)"
                                : "rgba(168,85,247,0.1)",
                            }}
                          >
                            {isDeposit ? (
                              <Download size={14} className="text-teal-400" />
                            ) : (
                              <Upload size={14} className="text-purple-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold text-white">
                              {isDeposit ? "Deposit" : "Withdrawal"}
                            </p>
                            <p className="text-[9px] text-gray-500">
                              {formatTime(tx.created_at)}
                            </p>
                          </div>
                        </div>

                        {/* Right: amount */}
                        <div className="text-right">
                          <p
                            className={`text-[12px] font-bold tabular-nums ${
                              isDeposit ? "text-teal-400" : "text-purple-400"
                            }`}
                          >
                            {isDeposit ? "+" : "-"}$
                            {tx.amount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          <div className={`flex items-center gap-1 justify-end ${cfg.color}`}>
                            <StatusIcon
                              size={9}
                              className={isSpinning ? "animate-spin" : ""}
                            />
                            <span className="text-[9px] font-medium">
                              {cfg.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tx hash link */}
                      {tx.tx_hash && (
                        <div className="ml-[42px]">
                          <a
                            href={`https://arbiscan.io/tx/${tx.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] text-gray-500 hover:text-teal-400 transition-colors"
                          >
                            {shortenHash(tx.tx_hash)} ↗
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}