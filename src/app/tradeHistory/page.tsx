"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import copyCountIcon from "@/assets/icons/copy-count.png";
import copyRankIcon from "@/assets/icons/copy-rank.png";
import { ChevronLeft, TrendingUp, TrendingDown, Filter, ArrowUpDown, Loader2, Heart, MessageCircle, Repeat2 } from "lucide-react";
import { getTradeHistory, TradeHistoryItem, TradesSummary, getOpenPositions, PositionItem, TradeSignalSummary } from "@/service";
import { getProfileData } from "@/service";
import { useLiveMids } from "@/hooks/useLiveMids";

type TabKey = "active" | "all" | "long" | "short";

type CardItem = {
  id: string;
  ticker: string;
  direction: "long" | "short";
  entry_price: number;
  ref_price: number | null;
  ref_label: "Exit" | "Mark";
  size_usd: number;
  leverage: number;
  pnl_usd: number | null;
  pnl_pct: number | null;
  trader_username: string | null;
  opened_at: string;
  closed_at: string | null;
  // Source tweet — present only on closed/copy/counter trades.
  // Active-tab items (PositionItem) have no signal concept.
  signal?: TradeSignalSummary | null;
};

const cardStyle = {
  background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
};

// ── helpers ──

function formatDuration(openedAt: string, closedAt: string | null): string {
  const end = closedAt ? new Date(closedAt).getTime() : Date.now();
  const ms = end - new Date(openedAt).getTime();
  if (ms < 0) return "—";
  const totalMin = Math.floor(ms / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtPrice(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  if (n > 0) return `$${n.toFixed(8).replace(/0+$/, "").replace(/\.$/, "")}`;
  return "$0";
}

function fmtSize(n: number): string {
  if (n >= 10000) return `$${(n / 1000).toFixed(0)}K`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
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
  const { getMid } = useLiveMids();
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [imgErrIds, setImgErrIds] = useState<Set<string>>(new Set());

  const [trades, setTrades] = useState<TradeHistoryItem[]>([]);
  const [openPositions, setOpenPositions] = useState<PositionItem[]>([]);
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

  // Initial probe: load both datasets in parallel and pick the default tab.
  // Default to Active iff at least one position is open, else fall back to All.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [open, closed] = await Promise.all([
          getOpenPositions().catch(() => [] as PositionItem[]),
          getTradeHistory("closed", "all", 200).catch(() => null),
        ]);
        if (cancelled) return;
        setOpenPositions(open);
        if (closed) {
          setTrades(closed.trades);
          setSummary(closed.summary);
          setTotalCount(closed.total_count);
        }
        setActiveTab(open.length > 0 ? "active" : "all");
      } catch (e: unknown) {
        if (!cancelled) {
          console.error("Failed to load trades:", e);
          setError("Failed to load trade history");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Subsequent tab changes — refetch the relevant slice.
  // The ref skips the first fire that follows the initial probe completing.
  const skipNextFetchRef = useRef(true);
  const refetchForTab = useCallback(async (tab: TabKey) => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "active") {
        const open = await getOpenPositions();
        setOpenPositions(open);
      } else {
        const res = await getTradeHistory("closed", tab, 200);
        setTrades(res.trades);
        setSummary(res.summary);
        setTotalCount(res.total_count);
      }
    } catch (e: unknown) {
      console.error("Failed to load trades:", e);
      setError("Failed to load trade history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activeTab) return;
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
    refetchForTab(activeTab);
  }, [activeTab, refetchForTab]);

  // derived from summary
  const totalPnl = summary?.total_pnl ?? 0;
  const wins = summary?.wins ?? 0;
  const losses = summary?.losses ?? 0;
  const winRate = Math.round(summary?.win_rate ?? 0);

  // Unified card list: open positions when on Active tab, closed trades otherwise.
  // Active items carry mark price as their reference; closed carry exit price.
  const cards: CardItem[] = activeTab === "active"
    ? openPositions
        .slice()
        .sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime())
        .map((p): CardItem => {
          // Mark + PnL: prefer the live HL mid; fall back to BE's last
          // current_price + pnl_usd/pnl_pct snapshot when offline.
          const isLong = p.direction !== "short";
          const liveMid = getMid(p.ticker);
          const mark = liveMid ?? p.current_price;
          const livePnl = (liveMid != null && p.entry_price > 0 && p.size_qty > 0)
            ? (liveMid - p.entry_price) * p.size_qty * (isLong ? 1 : -1)
            : null;
          const livePnlPct = (liveMid != null && p.entry_price > 0)
            ? ((liveMid - p.entry_price) / p.entry_price) * 100 * (isLong ? 1 : -1) * p.leverage
            : null;
          return {
            id: p.id,
            ticker: p.ticker,
            direction: (p.direction === "short" ? "short" : "long"),
            entry_price: p.entry_price,
            ref_price: mark,
            ref_label: "Mark",
            size_usd: p.size_usd,
            leverage: p.leverage,
            pnl_usd: livePnl ?? p.pnl_usd,
            pnl_pct: livePnlPct ?? p.pnl_pct,
            trader_username: p.trader_username,
            opened_at: p.opened_at,
            closed_at: null,
          };
        })
    : trades.map((t): CardItem => ({
          id: t.id,
          ticker: t.ticker,
          direction: t.direction,
          entry_price: t.entry_price,
          ref_price: t.exit_price,
          ref_label: "Exit",
          size_usd: t.size_usd,
          leverage: t.leverage,
          pnl_usd: t.pnl_usd,
          pnl_pct: t.pnl_pct,
          trader_username: t.trader_username,
          opened_at: t.opened_at,
          closed_at: t.closed_at,
          signal: t.signal ?? null,
        }));

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
        @keyframes activePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
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
          {(["active", "all", "long", "short"] as const).map((f) => {
            const selected = activeTab === f;
            const isShort = f === "short";
            return (
              <button
                key={f}
                onClick={() => setActiveTab(f)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all duration-200 capitalize cursor-pointer active:scale-95 flex items-center gap-1"
                style={{
                  background: selected ? (isShort ? "rgba(244,63,94,0.15)" : "rgba(45,212,191,0.15)") : "rgba(255,255,255,0.03)",
                  color: selected ? (isShort ? "#f43f5e" : "#2dd4bf") : "rgba(255,255,255,0.4)",
                  border: selected ? (isShort ? "1px solid rgba(244,63,94,0.3)" : "1px solid rgba(45,212,191,0.3)") : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {f === "active" && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: "#2dd4bf",
                      boxShadow: selected ? "0 0 6px rgba(45,212,191,0.8)" : "none",
                      animation: "activePulse 1.6s ease-in-out infinite",
                    }}
                  />
                )}
                {f}
              </button>
            );
          })}
        </div>
        <span className="text-[10px] text-gray-500 tabular-nums">
          {activeTab === "active" ? `${openPositions.length} active` : `${trades.length} trades`}
        </span>
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
              onClick={() => activeTab && refetchForTab(activeTab)}
              className="text-xs text-teal-400 px-3 py-1.5 rounded-lg cursor-pointer active:scale-95"
              style={{ background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)" }}
            >
              Retry
            </button>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ArrowUpDown size={32} className="text-gray-600 mb-3" />
            <p className="text-sm text-gray-500">
              {activeTab === "active"
                ? "No active trades yet"
                : `No ${activeTab === "all" ? "" : activeTab + " "}trades yet`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {cards.map((card, idx) => {
              const pnl = card.pnl_usd ?? 0;
              const pnlPct = card.pnl_pct ?? 0;
              const isWin = pnl >= 0;
              const isExpanded = expandedId === card.id;
              const duration = formatDuration(card.opened_at, card.closed_at);
              const dateLabel = card.closed_at ? formatDate(card.closed_at) : formatDate(card.opened_at);

              return (
                <div
                  key={card.id}
                  onClick={() => setExpandedId(isExpanded ? null : card.id)}
                  className="rounded-xl overflow-hidden cursor-pointer transition-all duration-200 trade-row"
                  style={{ ...cardStyle, animationDelay: `${0.38 + idx * 0.06}s` }}
                >
                  {/* Main row */}
                  <div className="px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200 ${card.direction === "long" ? "bg-teal-400/10" : "bg-rose-400/10"}`}
                        style={{ transform: isExpanded ? "scale(1.1)" : "scale(1)" }}
                      >
                        {card.direction === "long"
                          ? <TrendingUp size={14} className="text-teal-400" />
                          : <TrendingDown size={14} className="text-rose-400" />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-white">{card.ticker}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded capitalize font-medium ${card.direction === "long" ? "bg-teal-400/10 text-teal-400" : "bg-rose-400/10 text-rose-400"}`}>
                            {card.direction}
                          </span>
                          {card.trader_username && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded text-gray-400" style={{ background: "rgba(255,255,255,0.05)" }}>
                              via @{card.trader_username}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500">{dateLabel} · {duration}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isWin ? "text-teal-400" : "text-rose-400"}`}>
                        {isWin ? "+" : "-"}${Math.abs(pnl).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </p>
                      <p className={`text-[10px] ${isWin ? "text-teal-400/70" : "text-rose-400/70"}`}>
                        {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5 whitespace-nowrap font-normal">
                        Entry {fmtPrice(card.entry_price)} · {card.ref_label} {card.ref_price != null ? fmtPrice(card.ref_price) : "—"} · {fmtSize(card.size_usd)}
                      </p>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <div
                    className="overflow-hidden transition-all duration-300 ease-out"
                    style={{
                      // Generous cap when a signal is attached so tweet text +
                      // optional 180px image + engagement row all fit; tighter
                      // cap on signal-less trades preserves the original feel.
                      maxHeight: isExpanded ? (card.signal ? 520 : 120) : 0,
                      opacity: isExpanded ? 1 : 0,
                    }}
                  >
                    <div className="px-3 pb-2.5 pt-0">
                      <div className="h-px mb-2" style={{ background: isWin ? "rgba(45,212,191,0.1)" : "rgba(244,63,94,0.1)" }} />
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: "Entry", val: `$${card.entry_price.toLocaleString()}` },
                          { label: card.ref_label, val: card.ref_price != null ? `$${card.ref_price.toLocaleString()}` : "—" },
                          { label: "Size", val: `$${card.size_usd.toLocaleString()}` },
                          { label: "Leverage", val: `${card.leverage}×` },
                        ].map((d, i) => (
                          <div key={i} style={{ opacity: isExpanded ? 1 : 0, transform: isExpanded ? "translateY(0)" : "translateY(6px)", transition: `all 0.3s cubic-bezier(0.25,0.46,0.45,0.94) ${0.05 + i * 0.05}s` }}>
                            <p className="text-[8px] text-gray-500 uppercase">{d.label}</p>
                            <p className="text-[11px] text-white font-medium">{d.val}</p>
                          </div>
                        ))}
                      </div>

                      {card.signal && (() => {
                        const sig = card.signal;
                        const hasImage = !!sig.tweet_image_url && !imgErrIds.has(card.id);
                        const eng = (sig.likes ?? 0) + (sig.retweets ?? 0) + (sig.replies ?? 0);
                        return (
                          <div
                            style={{
                              opacity: isExpanded ? 1 : 0,
                              transform: isExpanded ? "translateY(0)" : "translateY(6px)",
                              transition: "all 0.3s cubic-bezier(0.25,0.46,0.45,0.94) 0.3s",
                            }}
                          >
                            <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.06)" }} />
                            <p className="text-[8px] text-gray-500 uppercase tracking-wide mb-1">From this tweet</p>
                            {sig.tweet_text && (
                              <p
                                className="text-[11px] leading-relaxed line-clamp-2"
                                style={{ color: "rgba(255,255,255,0.7)" }}
                              >
                                {sig.tweet_text}
                              </p>
                            )}
                            {hasImage && (
                              <div
                                className="mt-2 rounded-lg overflow-hidden"
                                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={sig.tweet_image_url!}
                                  alt=""
                                  className="w-full max-h-[180px] object-cover block"
                                  loading="lazy"
                                  onError={() =>
                                    setImgErrIds((prev) => {
                                      const next = new Set(prev);
                                      next.add(card.id);
                                      return next;
                                    })
                                  }
                                />
                              </div>
                            )}
                            {eng > 0 && (
                              <div className="flex items-center gap-3 mt-2">
                                {sig.likes > 0 && (
                                  <span className="flex items-center gap-1 text-[10px] text-gray-500">
                                    <Heart size={10} className="text-rose-400/60" />
                                    {sig.likes.toLocaleString()}
                                  </span>
                                )}
                                {sig.retweets > 0 && (
                                  <span className="flex items-center gap-1 text-[10px] text-gray-500">
                                    <Repeat2 size={10} className="text-teal-400/60" />
                                    {sig.retweets.toLocaleString()}
                                  </span>
                                )}
                                {sig.replies > 0 && (
                                  <span className="flex items-center gap-1 text-[10px] text-gray-500">
                                    <MessageCircle size={10} className="text-blue-400/60" />
                                    {sig.replies.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
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