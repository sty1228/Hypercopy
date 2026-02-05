"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import copyCountIcon from "@/assets/icons/copy-count.png";
import copyRankIcon from "@/assets/icons/copy-rank.png";
import { ChevronLeft, TrendingUp, TrendingDown, Filter } from "lucide-react";

interface Trade {
  id: number;
  token: string;
  pair: string;
  side: "long" | "short";
  pnl: number;
  pnlPercent: number;
  entryPrice: number;
  exitPrice: number;
  size: number;
  sizeUsd: number;
  openTime: string;
  closeTime: string;
  duration: string;
  copiedFrom?: string;
}

const mockTrades: Trade[] = [
  { id: 1, token: "BTC", pair: "BTC/USDT", side: "long", pnl: 1234.5, pnlPercent: 5.26, entryPrice: 67500, exitPrice: 71050, size: 0.52, sizeUsd: 35100, openTime: "Jan 28, 14:32", closeTime: "Jan 30, 09:15", duration: "1d 18h", copiedFrom: "@geddard" },
  { id: 2, token: "ETH", pair: "ETH/USDT", side: "short", pnl: 420.3, pnlPercent: 3.12, entryPrice: 2550, exitPrice: 2470, size: 8.4, sizeUsd: 21420, openTime: "Jan 27, 10:05", closeTime: "Jan 28, 22:40", duration: "1d 12h" },
  { id: 3, token: "SOL", pair: "SOL/USDT", side: "long", pnl: -180.6, pnlPercent: -2.15, entryPrice: 98, exitPrice: 95.9, size: 125, sizeUsd: 12250, openTime: "Jan 25, 08:20", closeTime: "Jan 26, 16:55", duration: "1d 8h", copiedFrom: "@daytrader" },
  { id: 4, token: "HYPE", pair: "HYPE/USDT", side: "long", pnl: 892.0, pnlPercent: 12.4, entryPrice: 1.12, exitPrice: 1.26, size: 6400, sizeUsd: 7168, openTime: "Jan 22, 11:00", closeTime: "Jan 24, 19:30", duration: "2d 8h", copiedFrom: "@geddard" },
  { id: 5, token: "BTC", pair: "BTC/USDT", side: "short", pnl: -345.2, pnlPercent: -1.82, entryPrice: 69800, exitPrice: 71070, size: 0.28, sizeUsd: 19544, openTime: "Jan 20, 15:45", closeTime: "Jan 21, 03:20", duration: "11h 35m" },
  { id: 6, token: "ETH", pair: "ETH/USDT", side: "long", pnl: 562.8, pnlPercent: 4.55, entryPrice: 2380, exitPrice: 2488, size: 5.2, sizeUsd: 12376, openTime: "Jan 18, 09:10", closeTime: "Jan 20, 14:00", duration: "2d 4h", copiedFrom: "@cryptoking" },
  { id: 7, token: "SOL", pair: "SOL/USDT", side: "long", pnl: 310.5, pnlPercent: 6.88, entryPrice: 88.5, exitPrice: 94.6, size: 75, sizeUsd: 6637, openTime: "Jan 15, 12:30", closeTime: "Jan 17, 08:45", duration: "1d 20h" },
  { id: 8, token: "HYPE", pair: "HYPE/USDT", side: "short", pnl: -92.4, pnlPercent: -3.2, entryPrice: 1.08, exitPrice: 1.115, size: 3000, sizeUsd: 3240, openTime: "Jan 13, 16:00", closeTime: "Jan 14, 10:20", duration: "18h 20m", copiedFrom: "@daytrader" },
];

const cardStyle = {
  background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
};

export default function TradeHistoryPage() {
  const router = useRouter();
  const [filterSide, setFilterSide] = useState<"all" | "long" | "short">("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = mockTrades.filter((t) => filterSide === "all" || t.side === filterSide);

  const totalPnl = mockTrades.reduce((s, t) => s + t.pnl, 0);
  const wins = mockTrades.filter((t) => t.pnl > 0).length;
  const losses = mockTrades.filter((t) => t.pnl < 0).length;

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)" }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/3 w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)", filter: "blur(60px)" }} />
      </div>

      {/* Header */}
      <div className="relative z-10 mt-4 mb-3 flex items-center justify-between px-4">
        <div
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:bg-white/10"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <ChevronLeft size={18} className="text-gray-400" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Image src={copyCountIcon} alt="copy-count" width={16} height={16} />
            <span className="text-[13px] font-semibold text-teal-400">4</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.15) 0%, rgba(45,212,191,0.08) 100%)", border: "1px solid rgba(45,212,191,0.25)", boxShadow: "0 0 15px rgba(45,212,191,0.2)" }}>
            <Image src={copyRankIcon} alt="copy-rank" width={16} height={16} />
            <span className="text-[13px] font-semibold text-teal-400">#64</span>
          </div>
          <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: "#2528CA", boxShadow: "0 0 25px rgba(59,130,246,0.4)" }}>
            J
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="relative z-10 px-4 mb-3">
        <h1 className="text-lg font-bold text-white">Trade History</h1>
      </div>

      {/* Summary strip */}
      <div className="relative z-10 px-4 mb-3">
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl px-3 py-2" style={cardStyle}>
            <p className="text-[9px] text-gray-500 mb-0.5">Total PnL</p>
            <p className={`text-sm font-bold ${totalPnl >= 0 ? "text-teal-400" : "text-rose-400"}`}>
              {totalPnl >= 0 ? "+" : ""}${Math.abs(totalPnl).toLocaleString("en-US", { minimumFractionDigits: 1 })}
            </p>
          </div>
          <div className="flex-1 rounded-xl px-3 py-2" style={cardStyle}>
            <p className="text-[9px] text-gray-500 mb-0.5">Win / Loss</p>
            <p className="text-sm font-bold text-white">
              <span className="text-teal-400">{wins}W</span>
              <span className="text-gray-600 mx-1">/</span>
              <span className="text-rose-400">{losses}L</span>
            </p>
          </div>
          <div className="flex-1 rounded-xl px-3 py-2" style={cardStyle}>
            <p className="text-[9px] text-gray-500 mb-0.5">Win Rate</p>
            <p className="text-sm font-bold text-white">{Math.round((wins / mockTrades.length) * 100)}%</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="relative z-10 px-4 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Filter size={12} className="text-gray-500" />
          {(["all", "long", "short"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterSide(f)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all capitalize cursor-pointer"
              style={{
                background: filterSide === f ? (f === "short" ? "rgba(244,63,94,0.15)" : "rgba(45,212,191,0.15)") : "rgba(255,255,255,0.03)",
                color: filterSide === f ? (f === "short" ? "#f43f5e" : "#2dd4bf") : "rgba(255,255,255,0.4)",
                border: filterSide === f ? (f === "short" ? "1px solid rgba(244,63,94,0.3)" : "1px solid rgba(45,212,191,0.3)") : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-gray-500">{filtered.length} trades</span>
      </div>

      {/* Trade List */}
      <div className="relative z-10 px-4 pb-24">
        <div className="space-y-2">
          {filtered.map((trade) => {
            const isWin = trade.pnl >= 0;
            const isExpanded = expandedId === trade.id;
            return (
              <div
                key={trade.id}
                onClick={() => setExpandedId(isExpanded ? null : trade.id)}
                className="rounded-xl overflow-hidden cursor-pointer transition-all"
                style={cardStyle}
              >
                {/* Main row */}
                <div className="px-3 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${trade.side === "long" ? "bg-teal-400/10" : "bg-rose-400/10"}`}>
                      {trade.side === "long"
                        ? <TrendingUp size={14} className="text-teal-400" />
                        : <TrendingDown size={14} className="text-rose-400" />
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white">{trade.token}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded capitalize font-medium ${trade.side === "long" ? "bg-teal-400/10 text-teal-400" : "bg-rose-400/10 text-rose-400"}`}>
                          {trade.side}
                        </span>
                        {trade.copiedFrom && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded text-gray-400" style={{ background: "rgba(255,255,255,0.05)" }}>
                            via {trade.copiedFrom}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500">{trade.closeTime} · {trade.duration}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isWin ? "text-teal-400" : "text-rose-400"}`}>
                      {isWin ? "+" : "-"}${Math.abs(trade.pnl).toLocaleString()}
                    </p>
                    <p className={`text-[10px] ${isWin ? "text-teal-400/70" : "text-rose-400/70"}`}>
                      {isWin ? "+" : ""}{trade.pnlPercent}%
                    </p>
                  </div>
                </div>

                {/* Expanded detail */}
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: isExpanded ? 120 : 0, opacity: isExpanded ? 1 : 0 }}
                >
                  <div className="px-3 pb-2.5 pt-0">
                    <div className="h-px bg-white/5 mb-2" />
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <p className="text-[8px] text-gray-500 uppercase">Entry</p>
                        <p className="text-[11px] text-white font-medium">${trade.entryPrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-gray-500 uppercase">Exit</p>
                        <p className="text-[11px] text-white font-medium">${trade.exitPrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-gray-500 uppercase">Size</p>
                        <p className="text-[11px] text-white font-medium">${trade.sizeUsd.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-gray-500 uppercase">Opened</p>
                        <p className="text-[11px] text-white font-medium">{trade.openTime.split(",")[0]}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}