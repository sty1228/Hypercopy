"use client";
import React, { useState } from "react";
import { X, Search, Users, TrendingUp } from "lucide-react";
import TraderCopyingItem, { CopyingTrader } from "./traderCopyingItem";

interface TradersCopyingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  traders: CopyingTrader[];
  totalPnl: number;
}

export default function TradersCopyingSheet({
  isOpen,
  onClose,
  traders,
  totalPnl,
}: TradersCopyingSheetProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"pnl" | "recent">("pnl");

  const filtered = traders
    .filter(
      (t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.handle.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (sortBy === "pnl" ? b.pnl - a.pnl : 0));

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto rounded-t-3xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #111820 0%, #0a0f14 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderBottom: "none",
          maxHeight: "80vh",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h2 className="text-base font-bold text-white">Traders Copying</h2>
            <span className="text-[11px] text-gray-500">
              {traders.length} traders
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-white/10"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="px-4 pb-3 flex gap-2">
          <div
            className="flex-1 rounded-xl p-2.5 flex items-center gap-2"
            style={{
              background: "rgba(45,212,191,0.06)",
              border: "1px solid rgba(45,212,191,0.15)",
            }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-teal-400/10">
              <Users size={13} className="text-teal-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{traders.length}</p>
              <p className="text-[9px] text-gray-500">Active Copiers</p>
            </div>
          </div>
          <div
            className="flex-1 rounded-xl p-2.5 flex items-center gap-2"
            style={{
              background: "rgba(45,212,191,0.06)",
              border: "1px solid rgba(45,212,191,0.15)",
            }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-teal-400/10">
              <TrendingUp size={13} className="text-teal-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-teal-400">
                +{totalPnl}%
              </p>
              <p className="text-[9px] text-gray-500">Avg. PnL</p>
            </div>
          </div>
        </div>

        {/* Search + Sort */}
        <div className="px-4 pb-3 flex items-center gap-2">
          <div
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Search size={14} className="text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="Search traders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-gray-500 outline-none w-full"
            />
          </div>
          <div className="flex rounded-lg overflow-hidden shrink-0" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            {(["pnl", "recent"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className="px-2.5 py-1.5 text-[10px] font-medium transition-all cursor-pointer capitalize"
                style={{
                  background: sortBy === s ? "rgba(45,212,191,0.15)" : "rgba(255,255,255,0.03)",
                  color: sortBy === s ? "rgba(45,212,191,1)" : "rgba(255,255,255,0.4)",
                }}
              >
                {s === "pnl" ? "PnL" : "Recent"}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div
          className="overflow-y-auto divide-y divide-white/5"
          style={{ maxHeight: "calc(80vh - 240px)" }}
        >
          {filtered.length > 0 ? (
            filtered.map((trader) => (
              <TraderCopyingItem key={trader.id} trader={trader} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="text-sm text-gray-500">No traders found</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}