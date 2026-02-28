"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import copyCountIcon from "@/assets/icons/copy-count.png";
import copyRankIcon from "@/assets/icons/copy-rank.png";
import { ChevronLeft, TrendingUp, TrendingDown, Filter, ArrowUpDown, Loader2 } from "lucide-react";
import { getTradeHistory, TradeHistoryItem, TradesSummary } from "@/service";
import { getProfileData } from "@/service";

const cardStyle = {
  background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
};

// ── helpers ──

function formatDuration(openedAt: string, closedAt: string | null): string {
  if (!closedAt) return "Open";
  const ms = new Date(closedAt).getTime() - new Date(openedAt).getTime();
  if (ms < 0) return "—";
  const totalMin = Math.floor(ms / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${months[d.getMonth()]} ${d.getDate()}, ${hh}:${mm}`;
}

// ── AnimNum ──

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

// ── WinRateRing ──

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

export default function TradeHistoryPage() {
  const router = useRouter();
  const [filterSide, setFilterSide] = useState<"all" | "long" | "short">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [trades, setTrades] = useState<TradeHistoryItem[]>([]);
  const [summary, setSummary] = useState<TradesSummary | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // header stats
  const [profileCopying, setProfileCopying] = useState(0);
  const [profileRank, setProfileRank] = useState<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // fetch profile for header badges
  useEffect(() => {
    getProfileData()
      .then((p) => {
        setProfileCopying(p.followingCount);
      })
      .catch(() => {});
  }, []);

  // fetch trades
  const fetchTrades = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTradeHistory("closed", filterSide, 200);
      setTrades(res.trades);
      setSummary(res.summary);
      setTotalCount(res.total_count);
    } catch (e: unknown) {
      console.error("Failed to load trades:", e);
      setError("Failed to load trade history");
    } finally {
      setLoading(false);
    }
  }, [filterSide]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  // derived from summary
  const totalPnl = summary?.total_pnl ?? 0;
  const wins = summary?.wins ?? 0;
  const losses = summary?.losses ?? 0;
  const winRate = Math.round(summary?.win_rate ?? 0);

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)" }}>
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
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-white/10 active:scale-90 fade-left"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", animationDelay: "0.05s" }}
        >
          <ChevronLeft size={18} className="text-gray-400" />
        </div>
        <div className="flex items-center gap-3 slide-right" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Image src={copyCountIcon} alt="copy-count" width={16} height={16} />
            <span className="text-[13px] font-semibold text-teal-400">{profileCopying}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.15) 0%, rgba(45,212,191,0.08) 100%)", border: "1px solid rgba(45,212,191,0.25)", boxShadow: "0 0 15px rgba(45,212,191,0.2)" }}>
            <Image src={copyRankIcon} alt="copy-rank" width={16} height={16} />
            <span className="text-[13px] font-semibold text-teal-400">{profileRank ? `#${profileRank}` : "—"}</span>
          </div>
          <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: "#2528CA", boxShadow: "0 0 25px rgba(59,130,246,0.4)" }}>
            J
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="relative z-10 px-4 mb-3 fade-up" style={{ animationDelay: "0.12s" }}>
        <h1 className="text-lg font-bold text-white">Trade History</h1>
      </div>

      {/* Summary strip */}
      <div className="relative z-10 px-4 mb-3">
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl px-3 py-2 stat-card scale-in" style={{ ...cardStyle, animationDelay: "0.18s" }}>
            <p className="text-[9px] text-gray-500 mb-0.5">Total PnL</p>
            {summary ? (
              <AnimNum
                value={totalPnl}
                prefix={totalPnl >= 0 ? "+$" : "-$"}
                decimals={1}
                className={`text-sm font-bold ${totalPnl >= 0 ? "text-teal-400" : "text-rose-400"}`}
              />
            ) : (
              <span className="text-sm font-bold text-gray-500">$0</span>
            )}
          </div>
          <div className="flex-1 rounded-xl px-3 py-2 stat-card scale-in" style={{ ...cardStyle, animationDelay: "0.24s" }}>
            <p className="text-[9px] text-gray-500 mb-0.5">Win / Loss</p>
            <p className="text-sm font-bold text-white">
              <span className="text-teal-400">{wins}W</span>
              <span className="text-gray-600 mx-1">/</span>
              <span className="text-rose-400">{losses}L</span>
            </p>
          </div>
          <div className="flex-1 rounded-xl px-3 py-2 stat-card scale-in" style={{ ...cardStyle, animationDelay: "0.30s" }}>
            <p className="text-[9px] text-gray-500 mb-0.5">Win Rate</p>
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
              onClick={() => setFilterSide(f)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all duration-200 capitalize cursor-pointer active:scale-95"
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
        <span className="text-[10px] text-gray-500 tabular-nums">{trades.length} trades</span>
      </div>

      {/* Trade List */}
      <div className="relative z-10 px-4 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 size={28} className="text-teal-400 animate-spin mb-3" />
            <p className="text-sm text-gray-500">Loading trades…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm text-rose-400 mb-2">{error}</p>
            <button
              onClick={fetchTrades}
              className="text-xs text-teal-400 px-3 py-1.5 rounded-lg cursor-pointer active:scale-95"
              style={{ background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)" }}
            >
              Retry
            </button>
          </div>
        ) : trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ArrowUpDown size={32} className="text-gray-600 mb-3" />
            <p className="text-sm text-gray-500">No {filterSide === "all" ? "" : filterSide + " "}trades yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {trades.map((trade, idx) => {
              const pnl = trade.pnl_usd ?? 0;
              const pnlPct = trade.pnl_pct ?? 0;
              const isWin = pnl >= 0;
              const isExpanded = expandedId === trade.id;
              const duration = formatDuration(trade.opened_at, trade.closed_at);
              const closeDate = trade.closed_at ? formatDate(trade.closed_at) : formatDate(trade.opened_at);

              return (
                <div
                  key={trade.id}
                  onClick={() => setExpandedId(isExpanded ? null : trade.id)}
                  className="rounded-xl overflow-hidden cursor-pointer transition-all duration-200 trade-row"
                  style={{ ...cardStyle, animationDelay: `${0.38 + idx * 0.06}s` }}
                >
                  {/* Main row */}
                  <div className="px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200 ${trade.direction === "long" ? "bg-teal-400/10" : "bg-rose-400/10"}`}
                        style={{ transform: isExpanded ? "scale(1.1)" : "scale(1)" }}
                      >
                        {trade.direction === "long"
                          ? <TrendingUp size={14} className="text-teal-400" />
                          : <TrendingDown size={14} className="text-rose-400" />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-white">{trade.ticker}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded capitalize font-medium ${trade.direction === "long" ? "bg-teal-400/10 text-teal-400" : "bg-rose-400/10 text-rose-400"}`}>
                            {trade.direction}
                          </span>
                          {trade.trader_username && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded text-gray-400" style={{ background: "rgba(255,255,255,0.05)" }}>
                              via @{trade.trader_username}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500">{closeDate} · {duration}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isWin ? "text-teal-400" : "text-rose-400"}`}>
                        {isWin ? "+" : "-"}${Math.abs(pnl).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </p>
                      <p className={`text-[10px] ${isWin ? "text-teal-400/70" : "text-rose-400/70"}`}>
                        {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <div
                    className="overflow-hidden transition-all duration-300 ease-out"
                    style={{ maxHeight: isExpanded ? 120 : 0, opacity: isExpanded ? 1 : 0 }}
                  >
                    <div className="px-3 pb-2.5 pt-0">
                      <div className="h-px mb-2" style={{ background: isWin ? "rgba(45,212,191,0.1)" : "rgba(244,63,94,0.1)" }} />
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: "Entry", val: `$${trade.entry_price.toLocaleString()}` },
                          { label: "Exit", val: trade.exit_price ? `$${trade.exit_price.toLocaleString()}` : "—" },
                          { label: "Size", val: `$${trade.size_usd.toLocaleString()}` },
                          { label: "Leverage", val: `${trade.leverage}×` },
                        ].map((d, i) => (
                          <div key={i} style={{ opacity: isExpanded ? 1 : 0, transform: isExpanded ? "translateY(0)" : "translateY(6px)", transition: `all 0.3s cubic-bezier(0.25,0.46,0.45,0.94) ${0.05 + i * 0.05}s` }}>
                            <p className="text-[8px] text-gray-500 uppercase">{d.label}</p>
                            <p className="text-[11px] text-white font-medium">{d.val}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}