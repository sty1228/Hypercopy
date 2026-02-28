"use client";

import { useState, useEffect } from "react";
import { getFollowedTraders } from "@/service";

// ---------- Types ----------
interface TraderData {
  name: string;
  handle: string;
  pnl: number;
  pnlPct: number;
  coins: string[];
  is_copy_trading: boolean;
}

interface CopyingSheetProps {
  mode: "copying" | "copiers";
  onClose: () => void;
}

// ---------- Helpers ----------
const avatarColors = ["#e74c3c", "#8e44ad", "#2980b9", "#27ae60", "#f39c12", "#1abc9c", "#d35400", "#c0392b", "#7f8c8d", "#2c3e50", "#16a085", "#e67e22"];

const coinIcons: Record<string, { color: string; label: string }> = {
  BTC: { color: "#f7931a", label: "B" },
  ETH: { color: "#627eea", label: "E" },
  SOL: { color: "#9945ff", label: "S" },
  DOGE: { color: "#c3a634", label: "D" },
  HYPE: { color: "#00d4aa", label: "H" },
  ARB: { color: "#28a0f0", label: "A" },
  AVAX: { color: "#e84142", label: "AV" },
  LINK: { color: "#2a5ada", label: "L" },
  UNI: { color: "#ff007a", label: "U" },
};

const getAvatarColor = (name: string) => {
  const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length;
  return { c1: avatarColors[idx], c2: avatarColors[(idx + 3) % avatarColors.length] };
};

const sortTraders = (data: TraderData[], sort: string) => {
  const d = [...data];
  switch (sort) {
    case "pnl_desc": return d.sort((a, b) => b.pnl - a.pnl);
    case "pnl_asc": return d.sort((a, b) => a.pnl - b.pnl);
    case "pct_desc": return d.sort((a, b) => b.pnlPct - a.pnlPct);
    default: return d;
  }
};

// ---------- Sub-components ----------
const CoinBubble = ({ coin }: { coin: string }) => {
  const c = coinIcons[coin] || { color: "#555", label: coin?.[0] || "?" };
  return (
    <div className="flex items-center justify-center rounded-full text-white font-bold -ml-1 flex-shrink-0"
      style={{ width: 18, height: 18, fontSize: 7, background: c.color, border: "2px solid rgba(10,14,19,0.9)" }}>
      {c.label}
    </div>
  );
};

const MedalBadge = ({ rank }: { rank: number }) => {
  const colors: Record<number, string> = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };
  const textColors: Record<number, string> = { 1: "#1a1200", 2: "#1a1a1a", 3: "#1a0f00" };
  if (rank > 3) return null;
  return (
    <div className="absolute -bottom-0.5 -left-0.5 flex items-center justify-center rounded-full font-extrabold"
      style={{ width: 16, height: 16, fontSize: 8, background: colors[rank], color: textColors[rank], border: "2px solid #0e1319", boxShadow: `0 2px 6px ${colors[rank]}44` }}>
      {rank}
    </div>
  );
};

const TraderRow = ({ trader, rank, delay }: { trader: TraderData; rank: number | null; delay: number }) => {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  const up = trader.pnl >= 0;
  const { c1, c2 } = getAvatarColor(trader.name);

  return (
    <div
      className="flex items-center justify-between py-3.5 px-4 transition-all duration-200 cursor-pointer"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(10px)",
        transition: "all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div
            className="flex items-center justify-center rounded-full text-white font-bold"
            style={{
              width: 40, height: 40, fontSize: 15,
              background: `linear-gradient(135deg, ${c1}, ${c2})`,
              border: rank && rank <= 3 ? `2px solid ${rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : "#CD7F32"}` : "2px solid rgba(255,255,255,0.08)",
            }}
          >
            {trader.name[0].toUpperCase()}
          </div>
          {rank && <MedalBadge rank={rank} />}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-white font-bold">{trader.name}</span>
            {trader.is_copy_trading && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold"
                style={{ background: "rgba(45,212,191,0.15)", color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.25)" }}>
                COPY
              </span>
            )}
          </div>
          <span className="text-[11px] block" style={{ color: "rgba(255,255,255,0.35)" }}>{trader.handle}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span className="text-sm font-bold" style={{ color: up ? "#22c55e" : "#ef4444" }}>
          {up ? "+" : "−"}${Math.abs(trader.pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <div className="flex items-center pl-1">
          {trader.coins.slice(0, 3).map((c, i) => <CoinBubble key={i} coin={c} />)}
          {trader.coins.length > 3 && (
            <div className="flex items-center justify-center rounded-full font-semibold -ml-0.5"
              style={{ width: 22, height: 18, fontSize: 9, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {trader.coins.length - 3}+
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <div className="w-12 h-12 rounded-full flex items-center justify-center"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <svg className="w-5 h-5" style={{ color: "rgba(255,255,255,0.2)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    </div>
    <span className="text-xs text-center max-w-[220px]" style={{ color: "rgba(255,255,255,0.3)" }}>{message}</span>
  </div>
);

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
      style={{ borderColor: "rgba(45,212,191,0.3)", borderTopColor: "transparent" }} />
    <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Loading...</span>
  </div>
);

// ---------- Main Component ----------
const CopyingSheet = ({ mode, onClose }: CopyingSheetProps) => {
  const [closing, setClosing] = useState(false);
  const [sort, setSort] = useState("pnl_desc");
  const [traders, setTraders] = useState<TraderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (mode === "copying") {
      fetchCopying();
    } else {
      // No copiers API yet — show empty state
      setLoading(false);
      setTraders([]);
    }
  }, [mode]);

  const fetchCopying = async () => {
    setLoading(true);
    try {
      const res = await getFollowedTraders("30d");
      const list: TraderData[] = (res || []).map((item) => ({
        name: item.display_name || item.trader_username || "Unknown",
        handle: `@${item.trader_username}`,
        pnl: item.total_profit_usd || 0,
        pnlPct: item.avg_return_pct || 0,
        coins: [],
        is_copy_trading: item.is_copy_trading || false,
      }));
      setTraders(list);
    } catch (err) {
      console.error("Failed to fetch follows:", err);
      setTraders([]);
    } finally {
      setLoading(false);
    }
  };

  const sorted = sortTraders(traders, sort);
  const title = mode === "copying" ? "Copying" : "Copiers";

  const handleClose = () => { setClosing(true); setTimeout(onClose, 280); };

  const sortOptions = [
    { key: "pnl_desc", label: "Top Gains" },
    { key: "pnl_asc", label: "Top Losses" },
    { key: "pct_desc", label: "% Best" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={handleClose}>
      <div className="absolute inset-0 transition-opacity duration-300" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)", opacity: closing ? 0 : 1 }} />
      <div
        className="relative w-full max-w-md overflow-hidden transition-transform duration-300"
        onClick={e => e.stopPropagation()}
        style={{
          background: "linear-gradient(180deg, #0e1319 0%, #0a0e13 100%)",
          borderRadius: "24px 24px 0 0",
          maxHeight: "88vh",
          overflowY: "auto",
          transform: closing ? "translateY(100%)" : "translateY(0)",
          animation: closing ? "none" : "sheetUp 0.32s cubic-bezier(0.32,0.72,0,1)",
          boxShadow: "0 -8px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}} button{cursor:pointer;}`}</style>

        {/* Handle */}
        <div className="pt-3 pb-2"><div className="w-8 h-1 rounded-full mx-auto" style={{ background: "rgba(255,255,255,0.1)" }} /></div>

        {/* Header */}
        <div className="px-5 pb-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-white text-base font-extrabold">{title}</span>
            <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.25)" }}>{traders.length}</span>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-white/10 active:scale-90"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Sort Bar */}
        {traders.length > 0 && (
          <div className="flex gap-1.5 px-5 pb-3 overflow-x-auto">
            {sortOptions.map(o => (
              <button
                key={o.key}
                onClick={() => setSort(o.key)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 whitespace-nowrap"
                style={{
                  background: sort === o.key ? "rgba(45,212,191,0.1)" : "rgba(255,255,255,0.03)",
                  border: sort === o.key ? "1px solid rgba(45,212,191,0.25)" : "1px solid rgba(255,255,255,0.06)",
                  color: sort === o.key ? "#2dd4bf" : "rgba(255,255,255,0.35)",
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <LoadingState />
        ) : traders.length === 0 ? (
          <EmptyState
            message={
              mode === "copying"
                ? "You're not following any traders yet. Head to the leaderboard to find KOLs to copy."
                : "Copiers feature coming soon."
            }
          />
        ) : (
          <div className="mx-4 mb-6 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            {sorted.map((t, i) => (
              <TraderRow
                key={t.handle}
                trader={t}
                rank={sort === "pnl_desc" ? i + 1 : null}
                delay={i * 50}
              />
            ))}
          </div>
        )}

        <div className="h-10" />
      </div>
    </div>
  );
};

export default CopyingSheet;