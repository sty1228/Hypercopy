"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import copyCountIcon from "@/assets/icons/copy-count.png";
import copyRankIcon from "@/assets/icons/copy-rank.png";
import { ChevronLeft, ArrowUpDown, TrendingUp, TrendingDown, Filter } from "lucide-react";

interface Position {
  id: number;
  token: string;
  pair: string;
  iconUrl: string;
  size: number;
  sizeUsd: number;
  pnl: number;
  pnlPercent: number;
  entry: number;
}

interface ActiveTradesSheetProps {
  positions: Position[];
  onClose: () => void;
  onSelectPosition: (pos: Position) => void;
}

const cardStyle = {
  background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const AnimNum = ({ value, prefix = "", suffix = "", decimals = 1, className = "" }: {
  value: number; prefix?: string; suffix?: string; decimals?: number; className?: string;
}) => {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const dur = 1200, start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      setDisplay(value * (1 - Math.pow(1 - t, 3)));
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);
  return (
    <span className={className}>
      {prefix}{Math.abs(display).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  );
};

const WinRateRing = ({ pct }: { pct: number }) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => { const t = setTimeout(() => setProgress(pct), 200); return () => clearTimeout(t); }, [pct]);
  const r = 14, c = 2 * Math.PI * r, offset = c - (progress / 100) * c;
  return (
    <div className="flex items-center gap-2">
      <svg width="36" height="36" viewBox="0 0 36 36" className="transform -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <circle cx="18" cy="18" r={r} fill="none" stroke="#2dd4bf" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.25,0.46,0.45,0.94)" }} />
      </svg>
      <span className="text-sm font-bold text-white">{pct}%</span>
    </div>
  );
};

const ActiveTradesSheet = ({ positions, onClose, onSelectPosition }: ActiveTradesSheetProps) => {
  const [filter, setFilter] = useState<"all" | "profit" | "loss">("all");
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    setMounted(true);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const filtered = positions.filter((p) => {
    if (filter === "profit") return p.pnl >= 0;
    if (filter === "loss") return p.pnl < 0;
    return true;
  });

  const totalPnl = positions.reduce((s, p) => s + p.pnl, 0);
  const totalSize = positions.reduce((s, p) => s + p.sizeUsd, 0);
  const profitCount = positions.filter((p) => p.pnl >= 0).length;
  const lossCount = positions.filter((p) => p.pnl < 0).length;
  const winRate = positions.length > 0 ? Math.round((profitCount / positions.length) * 100) : 0;

  return (
    <div
      className="absolute inset-0 z-50 min-h-screen text-white overflow-y-auto overflow-x-hidden transition-all duration-300"
      style={{
        background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(100%)",
      }}
    >
      <style jsx>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        .fade-up { opacity: 0; animation: fadeInUp 0.5s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .fade-left { opacity: 0; animation: fadeInLeft 0.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .slide-right { opacity: 0; animation: slideInRight 0.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .scale-in { opacity: 0; animation: scaleIn 0.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .trade-row { opacity: 0; animation: fadeInUp 0.45s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .trade-row:hover { background: rgba(255,255,255,0.02); }
        .trade-row:active { transform: scale(0.995); }
        .stat-card { transition: all 0.2s; }
        .stat-card:hover { transform: translateY(-1px); border-color: rgba(45,212,191,0.2) !important; }
      `}</style>

      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/3 w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/3 -right-20 w-[200px] h-[200px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.04) 0%, transparent 60%)", filter: "blur(40px)" }} />
      </div>

      {/* Header */}
      <div className="relative z-10 mt-4 mb-3 flex items-center justify-between px-4">
        <div
          onClick={handleClose}
          className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-white/10 active:scale-90 fade-left"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", animationDelay: "0.05s" }}
        >
          <ChevronLeft size={18} className="text-gray-400" />
        </div>
        <div className="flex items-center gap-3 slide-right" style={{ animationDelay: "0.1s" }}>
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
      <div className="relative z-10 px-4 mb-3 fade-up" style={{ animationDelay: "0.12s" }}>
        <h1 className="text-lg font-bold text-white">Active Trades</h1>
      </div>

      {/* Summary strip */}
      <div className="relative z-10 px-4 mb-3">
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl px-3 py-2 stat-card scale-in" style={{ ...cardStyle, animationDelay: "0.18s" }}>
            <p className="text-[9px] text-gray-500 mb-0.5">Unrealized PnL</p>
            <AnimNum
              value={totalPnl}
              prefix={totalPnl >= 0 ? "+$" : "-$"}
              decimals={1}
              className={`text-sm font-bold ${totalPnl >= 0 ? "text-teal-400" : "text-rose-400"}`}
            />
          </div>
          <div className="flex-1 rounded-xl px-3 py-2 stat-card scale-in" style={{ ...cardStyle, animationDelay: "0.24s" }}>
            <p className="text-[9px] text-gray-500 mb-0.5">Total Size</p>
            <AnimNum
              value={totalSize}
              prefix="$"
              decimals={0}
              className="text-sm font-bold text-white"
            />
          </div>
          <div className="flex-1 rounded-xl px-3 py-2 stat-card scale-in" style={{ ...cardStyle, animationDelay: "0.30s" }}>
            <p className="text-[9px] text-gray-500 mb-0.5">Profit Rate</p>
            {mounted && <WinRateRing pct={winRate} />}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="relative z-10 px-4 mb-3 flex items-center justify-between fade-up" style={{ animationDelay: "0.35s" }}>
        <div className="flex items-center gap-1.5">
          <Filter size={12} className="text-gray-500" />
          {(["all", "profit", "loss"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all duration-200 capitalize cursor-pointer active:scale-95"
              style={{
                background: filter === f ? (f === "loss" ? "rgba(244,63,94,0.15)" : "rgba(45,212,191,0.15)") : "rgba(255,255,255,0.03)",
                color: filter === f ? (f === "loss" ? "#f43f5e" : "#2dd4bf") : "rgba(255,255,255,0.4)",
                border: filter === f ? (f === "loss" ? "1px solid rgba(244,63,94,0.3)" : "1px solid rgba(45,212,191,0.3)") : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {f === "all" ? "All" : f === "profit" ? "Long" : "Short"}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-gray-500 tabular-nums">{filtered.length} trades</span>
      </div>

      {/* Positions List */}
      <div className="relative z-10 px-4 pb-24">
        <div className="space-y-2">
          {filtered.map((pos, idx) => {
            const isWin = pos.pnl >= 0;
            return (
              <div
                key={pos.id}
                onClick={() => onSelectPosition(pos)}
                className="rounded-xl overflow-hidden cursor-pointer transition-all duration-200 trade-row"
                style={{ ...cardStyle, animationDelay: `${0.38 + idx * 0.06}s` }}
              >
                <div className="px-3 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isWin ? "bg-teal-400/10" : "bg-rose-400/10"}`}>
                      {isWin
                        ? <TrendingUp size={14} className="text-teal-400" />
                        : <TrendingDown size={14} className="text-rose-400" />
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white">{pos.token}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${isWin ? "bg-teal-400/10 text-teal-400" : "bg-rose-400/10 text-rose-400"}`}>
                          {isWin ? "Long" : "Short"}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500">{pos.size} {pos.token} · Entry ${pos.entry.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isWin ? "text-teal-400" : "text-rose-400"}`}>
                      {isWin ? "+" : "-"}${Math.abs(pos.pnl).toLocaleString("en-US", { minimumFractionDigits: 1 })}
                    </p>
                    <p className={`text-[10px] ${isWin ? "text-teal-400/70" : "text-rose-400/70"}`}>
                      {pos.pnlPercent >= 0 ? "+" : ""}{pos.pnlPercent}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <ArrowUpDown size={32} className="text-gray-600 mb-3" />
            <p className="text-sm text-gray-500">No {filter} trades</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveTradesSheet;