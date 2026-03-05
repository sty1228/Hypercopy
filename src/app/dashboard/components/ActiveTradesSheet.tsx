"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ArrowUpDown, TrendingUp, TrendingDown, Filter } from "lucide-react";
import { PositionItem } from "@/service";
import TopBar from "@/components/TopBar";

interface ActiveTradesSheetProps {
  positions: PositionItem[];
  onClose: () => void;
  onSelectPosition: (pos: PositionItem) => void;
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
  const [filter, setFilter] = useState<"all" | "long" | "short">("all");
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
    if (filter === "long") return p.direction === "long";
    if (filter === "short") return p.direction === "short";
    return true;
  });

  const totalPnl = positions.reduce((s, p) => s + (p.pnl_usd ?? 0), 0);
  const totalSize = positions.reduce((s, p) => s + p.size_usd, 0);
  const profitCount = positions.filter((p) => (p.pnl_usd ?? 0) >= 0).length;
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
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        .fade-up { opacity: 0; animation: fadeInUp 0.5s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
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

      {/* Header — using shared TopBar + back button on left */}
      <div className="relative z-10 mt-2 mb-1.5 flex items-center justify-between px-3">
        {/* Left: back + coin */}
        <div className="flex items-center gap-1.5">
          <div
            onClick={handleClose}
            className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-all hover:bg-white/10 active:scale-95"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <ChevronLeft size={14} className="text-gray-400" />
          </div>
        </div>
        {/* Right: reuse TopBar's right side pattern — but this is an overlay so keep it minimal */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="relative flex items-center justify-center" style={{ width: 10, height: 10 }}>
              <div className="w-[7px] h-[7px] rounded-full" style={{ background: "#eab308", boxShadow: "0 0 4px #eab308, 0 0 8px #eab30850", animation: "pulseDotAT 2s ease-in-out infinite" }} />
            </div>
            <span className="text-[10px] font-semibold text-teal-400 tabular-nums">{positions.length}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulseDotAT {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.5; }
        }
      `}</style>

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
          {(["all", "long", "short"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all duration-200 capitalize cursor-pointer active:scale-95"
              style={{
                background: filter === f ? (f === "short" ? "rgba(244,63,94,0.15)" : "rgba(45,212,191,0.15)") : "rgba(255,255,255,0.03)",
                color: filter === f ? (f === "short" ? "#f43f5e" : "#2dd4bf") : "rgba(255,255,255,0.4)",
                border: filter === f ? (f === "short" ? "1px solid rgba(244,63,94,0.3)" : "1px solid rgba(45,212,191,0.3)") : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {f === "all" ? "All" : f === "long" ? "Long" : "Short"}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-gray-500 tabular-nums">{filtered.length} trades</span>
      </div>

      {/* Positions List */}
      <div className="relative z-10 px-4 pb-24">
        <div className="space-y-2">
          {filtered.map((pos, idx) => {
            const pnl = pos.pnl_usd ?? 0;
            const pnlPct = pos.pnl_pct ?? 0;
            const isWin = pnl >= 0;
            const isLong = pos.direction === "long";
            return (
              <div
                key={pos.id}
                onClick={() => onSelectPosition(pos)}
                className="rounded-xl overflow-hidden cursor-pointer transition-all duration-200 trade-row"
                style={{ ...cardStyle, animationDelay: `${0.38 + idx * 0.06}s` }}
              >
                <div className="px-3 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLong ? "bg-teal-400/10" : "bg-rose-400/10"}`}>
                      {isLong
                        ? <TrendingUp size={14} className="text-teal-400" />
                        : <TrendingDown size={14} className="text-rose-400" />
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white">{pos.ticker}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium capitalize ${isLong ? "bg-teal-400/10 text-teal-400" : "bg-rose-400/10 text-rose-400"}`}>
                          {pos.direction}
                        </span>
                        {pos.trader_username && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded text-gray-400" style={{ background: "rgba(255,255,255,0.05)" }}>
                            via @{pos.trader_username}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500">{pos.size_qty} {pos.ticker} · Entry ${pos.entry_price.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isWin ? "text-teal-400" : "text-rose-400"}`}>
                      {isWin ? "+" : "-"}${Math.abs(pnl).toLocaleString("en-US", { minimumFractionDigits: 1 })}
                    </p>
                    <p className={`text-[10px] ${isWin ? "text-teal-400/70" : "text-rose-400/70"}`}>
                      {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
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
            <p className="text-sm text-gray-500">No {filter === "all" ? "" : filter + " "}trades</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveTradesSheet;