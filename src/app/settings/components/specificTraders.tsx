"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  AlertTriangle,
  Bell,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { TradeSizeType } from "@/service";

interface TraderSettings {
  tradeSize: number;
  tradeSizeType: TradeSizeType;
  leverage: number;
  leverageType: "cross" | "isolated";
  cutLoss: number;
  cutLossType: TradeSizeType;
  takeProfit: number;
  takeProfitType: TradeSizeType;
  copyDirection: "all" | "longs" | "shorts";
  notifications: boolean;
}

type XVerification = "blue" | "gold" | "business" | null;

interface Trader {
  id: number;
  name: string;
  handle: string;
  color: string;
  winRate: number;
  pnl: number;
  useCustom: boolean;
  counterTrading: boolean;
  xVerification: XVerification;
  settings: TraderSettings;
}

interface CopiedTrade {
  id: number;
  traderName: string;
  traderColor: string;
  asset: string;
  direction: "long" | "short";
  type: "entry" | "exit";
  size: number;
  entryPrice: number;
  currentPrice: number;
  exitPrice?: number;
  pnl: number;
  pnlPct: number;
  leverage: number;
  timestamp: string;
  status: "open" | "closed";
}

// ─── Tooltip ───
function Tooltip({
  children,
  text,
  wide = false,
}: {
  children: React.ReactNode;
  text: string;
  wide?: boolean;
}) {
  const [show, setShow] = useState(false);
  const popupClass = wide
    ? "absolute bottom-full mb-2 px-3 py-2 rounded-lg text-[10px] leading-relaxed text-white z-50 pointer-events-none w-56 whitespace-normal left-0"
    : "absolute bottom-full mb-2 px-3 py-2 rounded-lg text-[10px] leading-relaxed text-white z-50 pointer-events-none whitespace-nowrap left-1/2 -translate-x-1/2";
  const arrowClass = wide
    ? "absolute top-full w-0 h-0 left-4"
    : "absolute top-full w-0 h-0 left-1/2 -translate-x-1/2";

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => setShow((p) => !p)}
    >
      {children}
      {show && (
        <div
          className={popupClass}
          style={{
            background: "rgba(20,25,30,0.98)",
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
          }}
        >
          {text}
          <div
            className={arrowClass}
            style={{
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop: "4px solid rgba(20,25,30,0.98)",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── X Verification Icon ───
function XVerificationIcon({ type }: { type: XVerification }) {
  if (!type) return null;
  const cfg: Record<string, { fill: string; tip: string }> = {
    blue: { fill: "#1d9bf0", tip: "Verified on X" },
    gold: { fill: "#e2b719", tip: "Gold Organization" },
    business: { fill: "#6b7280", tip: "Affiliated Business" },
  };
  const { fill, tip } = cfg[type];
  return (
    <Tooltip text={tip}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
        <path
          d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.93-.81-3.94s-2.55-1.27-3.94-.81C14.64 2.63 13.43 1.75 12 1.75S9.36 2.63 8.69 3.91c-1.39-.46-2.93-.2-3.94.81s-1.27 2.55-.81 3.94C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.93.81 3.94s2.55 1.27 3.94.81c.67 1.28 1.88 2.16 3.31 2.16s2.64-.88 3.31-2.16c1.39.46 2.93.2 3.94-.81s1.27-2.55.81-3.94c1.31-.67 2.19-1.91 2.19-3.34z"
          fill={fill}
        />
        <path d="M10 15.17l-3.59-3.58L7.83 10 10 12.17l6.17-6.17 1.42 1.41L10 15.17z" fill="white" />
      </svg>
    </Tooltip>
  );
}

// ─── Toggle ───
function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className="w-11 h-6 rounded-full transition-all relative"
      style={{ background: enabled ? "rgba(45,212,191,1)" : "rgba(255,255,255,0.1)" }}
    >
      <div
        className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
        style={{ left: enabled ? "22px" : "2px" }}
      />
    </button>
  );
}

// ─── Leverage Slider ───
function LeverageSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const min = 1, max = 20;
  const pct = ((value - min) / (max - min)) * 100;

  const calcValue = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return value;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(ratio * (max - min) + min);
    },
    [value]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onChange(calcValue(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 0) return;
    onChange(calcValue(e.clientX));
  };

  const thumbColor = value >= 15 ? "rgba(239,68,68,1)" : value >= 10 ? "rgba(251,146,60,1)" : "rgba(45,212,191,1)";
  const trackColor = value >= 15 ? "rgba(239,68,68,0.6)" : value >= 10 ? "rgba(251,146,60,0.6)" : "rgba(45,212,191,0.6)";

  return (
    <div className="w-full">
      <div ref={trackRef} className="relative h-8 flex items-center cursor-pointer"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onClick={(e) => e.stopPropagation()}>
        <div className="absolute left-0 right-0 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="absolute left-0 h-1.5 rounded-full transition-colors" style={{ width: `${pct}%`, background: trackColor }} />
        <div className="absolute w-5 h-5 rounded-full border-2 border-white transition-colors"
          style={{ left: `calc(${pct}% - 10px)`, background: thumbColor, boxShadow: `0 0 10px ${thumbColor}` }} />
      </div>
      <div className="flex justify-between mt-0.5 px-0.5">
        {[1, 5, 10, 15, 20].map((v) => (
          <button key={v} onClick={(e) => { e.stopPropagation(); onChange(v); }}
            className="text-[10px] transition-all cursor-pointer"
            style={{ color: v === value ? "rgba(45,212,191,1)" : "rgba(255,255,255,0.3)" }}>
            {v}x
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Copy Direction Selector ───
function CopyDirectionSelector({ value, onChange }: { value: "all" | "longs" | "shorts"; onChange: (v: "all" | "longs" | "shorts") => void }) {
  const opts: { key: "all" | "longs" | "shorts"; label: string }[] = [
    { key: "all", label: "All" }, { key: "longs", label: "Longs Only" }, { key: "shorts", label: "Shorts Only" },
  ];
  return (
    <div className="flex gap-1.5">
      {opts.map((o) => (
        <button key={o.key} onClick={(e) => { e.stopPropagation(); onChange(o.key); }}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer"
          style={value === o.key
            ? { background: "rgba(45,212,191,0.15)", color: "rgba(45,212,191,1)", border: "1px solid rgba(45,212,191,0.4)" }
            : { background: "transparent", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }
          }>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Type Toggle Button ───
function TypeBtn({ active, label, onClick }: { active: boolean; label: string; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button onClick={onClick} className="w-7 h-7 rounded text-xs font-medium transition-all"
      style={active
        ? { backgroundColor: "rgba(45,212,191,1)", color: "#0a0f14" }
        : { border: "1px solid rgba(45,212,191,0.4)", color: "rgba(45,212,191,0.8)" }
      }>
      {label}
    </button>
  );
}

// ─── History Filter Tab ───
function HistoryFilterTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
      style={active
        ? { background: "rgba(45,212,191,0.15)", color: "rgba(45,212,191,1)", border: "1px solid rgba(45,212,191,0.3)" }
        : { background: "transparent", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }
      }>
      {label}
    </button>
  );
}

// ─── Mock data ───
const MOCK_TRADERS: Trader[] = [
  { id: 1, name: "Damian Terry", handle: "@damian", color: "#3b82f6", winRate: 68, pnl: 12450, useCustom: false, counterTrading: false, xVerification: "blue",
    settings: { tradeSize: 500, tradeSizeType: "USD", leverage: 5, leverageType: "isolated", cutLoss: 100, cutLossType: "USD", takeProfit: 150, takeProfitType: "USD", copyDirection: "all", notifications: true } },
  { id: 2, name: "Gerry Gedard", handle: "@gedderd", color: "#22c55e", winRate: 72, pnl: 28300, useCustom: true, counterTrading: false, xVerification: "gold",
    settings: { tradeSize: 500, tradeSizeType: "USD", leverage: 3, leverageType: "cross", cutLoss: 80, cutLossType: "USD", takeProfit: 200, takeProfitType: "USD", copyDirection: "all", notifications: true } },
  { id: 3, name: "Harry Freman", handle: "@daytrader", color: "#a855f7", winRate: 55, pnl: -4200, useCustom: true, counterTrading: true, xVerification: null,
    settings: { tradeSize: 300, tradeSizeType: "USD", leverage: 5, leverageType: "isolated", cutLoss: 50, cutLossType: "USD", takeProfit: 100, takeProfitType: "USD", copyDirection: "longs", notifications: true } },
  { id: 4, name: "Maria Feticia", handle: "@mariaeficia88", color: "#06b6d4", winRate: 81, pnl: 45600, useCustom: true, counterTrading: false, xVerification: "business",
    settings: { tradeSize: 300, tradeSizeType: "USD", leverage: 10, leverageType: "isolated", cutLoss: 60, cutLossType: "USD", takeProfit: 120, takeProfitType: "USD", copyDirection: "shorts", notifications: false } },
  { id: 5, name: "Emerson Curtis", handle: "@emercurt", color: "#22c55e", winRate: 63, pnl: 8900, useCustom: false, counterTrading: false, xVerification: "blue",
    settings: { tradeSize: 200, tradeSizeType: "USD", leverage: 5, leverageType: "cross", cutLoss: 40, cutLossType: "USD", takeProfit: 80, takeProfitType: "USD", copyDirection: "all", notifications: true } },
];

const MOCK_TRADE_HISTORY: CopiedTrade[] = [
  { id: 1, traderName: "Damian Terry", traderColor: "#3b82f6", asset: "ETH-USDC", direction: "long", type: "entry", size: 500, entryPrice: 3245.5, currentPrice: 3312.8, pnl: 103.6, pnlPct: 4.15, leverage: 5, timestamp: "2025-02-10T14:32:00", status: "open" },
  { id: 2, traderName: "Gerry Gedard", traderColor: "#22c55e", asset: "BTC-USDC", direction: "long", type: "entry", size: 500, entryPrice: 97420.0, currentPrice: 98150.0, pnl: 56.25, pnlPct: 1.13, leverage: 3, timestamp: "2025-02-10T12:15:00", status: "open" },
  { id: 3, traderName: "Maria Feticia", traderColor: "#06b6d4", asset: "SOL-USDC", direction: "short", type: "exit", size: 300, entryPrice: 198.4, currentPrice: 185.2, exitPrice: 185.2, pnl: 199.5, pnlPct: 6.65, leverage: 10, timestamp: "2025-02-10T10:45:00", status: "closed" },
  { id: 4, traderName: "Damian Terry", traderColor: "#3b82f6", asset: "ARB-USDC", direction: "long", type: "exit", size: 500, entryPrice: 1.12, currentPrice: 1.05, exitPrice: 1.05, pnl: -31.25, pnlPct: -6.25, leverage: 5, timestamp: "2025-02-09T22:10:00", status: "closed" },
  { id: 5, traderName: "Harry Freman", traderColor: "#a855f7", asset: "DOGE-USDC", direction: "long", type: "entry", size: 300, entryPrice: 0.2534, currentPrice: 0.2489, pnl: -5.32, pnlPct: -1.77, leverage: 5, timestamp: "2025-02-09T18:30:00", status: "open" },
  { id: 6, traderName: "Gerry Gedard", traderColor: "#22c55e", asset: "ETH-USDC", direction: "short", type: "exit", size: 500, entryPrice: 3380.0, currentPrice: 3312.8, exitPrice: 3290.0, pnl: 39.94, pnlPct: 2.66, leverage: 3, timestamp: "2025-02-09T15:20:00", status: "closed" },
];

const LEVERAGE_TOOLTIP =
  "The higher the leverage allotted for a trader, the less margin you will use for their trades, with higher risk inherited. E.g. $500 position with 10x leverage = $50 margin per trade. All trades are done on Isolated Margin.";

// ─── Helpers ───
function fmtPnl(v: number): string {
  const s = v >= 0 ? "+" : "-";
  const a = Math.abs(v);
  if (a >= 1_000_000) return `${s}$${(a / 1_000_000).toFixed(a >= 10_000_000 ? 1 : 2)}M`;
  if (a >= 1000) return `${s}$${(a / 1000).toFixed(a >= 10000 ? 1 : 2)}k`;
  return `${s}$${a.toFixed(0)}`;
}
function fmtTradePnl(v: number): string { return `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`; }
function fmtTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
function fmtDate(ts: string): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getSizeBadgeStyle(t: Trader): React.CSSProperties {
  if (t.counterTrading) return { background: "rgba(239,68,68,0.15)", color: "rgba(239,68,68,1)", border: "1px solid rgba(239,68,68,0.3)" };
  if (t.useCustom) return { background: "rgba(45,212,191,0.15)", color: "rgba(45,212,191,1)", border: "1px solid rgba(45,212,191,0.25)" };
  return { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" };
}
function getPnlBadgeStyle(pnl: number): React.CSSProperties {
  return pnl >= 0
    ? { background: "rgba(74,222,128,0.08)", color: "rgba(74,222,128,1)", border: "1px solid rgba(74,222,128,0.2)" }
    : { background: "rgba(239,68,68,0.08)", color: "rgba(239,68,68,1)", border: "1px solid rgba(239,68,68,0.2)" };
}

// ═══════════════════════════════════════════════════════
// ─── Copied Trades History Panel (slide-up overlay) ───
// ═══════════════════════════════════════════════════════
function CopiedTradesPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [mounted, setMounted] = useState(false);
  const filtered = MOCK_TRADE_HISTORY.filter((t) => filter === "all" || t.status === filter);

  const openTrades = MOCK_TRADE_HISTORY.filter((t) => t.status === "open");
  const closedTrades = MOCK_TRADE_HISTORY.filter((t) => t.status === "closed");
  const totalPnl = MOCK_TRADE_HISTORY.reduce((s, t) => s + t.pnl, 0);

  useEffect(() => { setMounted(true); }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[9998]"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className="fixed bottom-0 left-1/2 z-[9999] transition-transform duration-300 ease-out w-full"
        style={{
          transform: open ? "translate(-50%, 0)" : "translate(-50%, 100%)",
          pointerEvents: open ? "auto" : "none",
          maxWidth: "580px",
        }}
      >
        <div
          className="rounded-t-3xl overflow-hidden flex flex-col"
          style={{
            background: "linear-gradient(180deg, rgba(16,20,26,1) 0%, rgba(10,14,20,1) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderBottom: "none",
            maxHeight: "80vh",
          }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-1 pb-3 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-teal-400" />
                <p className="text-base font-semibold text-white">Copied Trades</p>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 ml-6">
                Entries & exits from followed traders
              </p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          {/* Summary row */}
          <div className="flex gap-2 px-5 mb-3 flex-shrink-0">
            <div className="flex-1 rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Total PnL</p>
              <p className="text-sm font-semibold" style={{ color: totalPnl >= 0 ? "rgba(74,222,128,1)" : "rgba(239,68,68,1)" }}>
                {fmtTradePnl(totalPnl)}
              </p>
            </div>
            <div className="flex-1 rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Open</p>
              <p className="text-sm font-semibold text-teal-400">{openTrades.length}</p>
            </div>
            <div className="flex-1 rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Closed</p>
              <p className="text-sm font-semibold text-white">{closedTrades.length}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 px-5 mb-3 flex-shrink-0">
            <HistoryFilterTab active={filter === "all"} label={`All (${MOCK_TRADE_HISTORY.length})`} onClick={() => setFilter("all")} />
            <HistoryFilterTab active={filter === "open"} label={`Open (${openTrades.length})`} onClick={() => setFilter("open")} />
            <HistoryFilterTab active={filter === "closed"} label={`Closed (${closedTrades.length})`} onClick={() => setFilter("closed")} />
          </div>

          {/* Trade list — scrollable */}
          <div className="flex-1 overflow-y-auto px-5 pb-8 min-h-0">
            <div className="space-y-2">
              {filtered.map((trade) => (
                <div key={trade.id} className="rounded-xl p-3"
                  style={{
                    background: "linear-gradient(135deg, rgba(45,212,191,0.03) 0%, rgba(45,212,191,0.01) 100%)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: trade.traderColor }}>
                        {trade.traderName[0]}
                      </div>
                      <span className="text-xs text-gray-400">{trade.traderName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={trade.status === "open"
                          ? { background: "rgba(45,212,191,0.1)", color: "rgba(45,212,191,0.8)" }
                          : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)" }
                        }>
                        {trade.status === "open" ? "Open" : "Closed"}
                      </span>
                      <Tooltip text={fmtDate(trade.timestamp)}>
                        <span className="text-[10px] text-gray-600">{fmtTime(trade.timestamp)}</span>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {trade.direction === "long"
                        ? <ArrowUpRight size={14} style={{ color: "rgba(74,222,128,0.8)" }} />
                        : <ArrowDownRight size={14} style={{ color: "rgba(239,68,68,0.8)" }} />}
                      <span className="text-sm font-medium text-white">{trade.asset}</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase"
                        style={trade.direction === "long"
                          ? { background: "rgba(74,222,128,0.1)", color: "rgba(74,222,128,0.8)" }
                          : { background: "rgba(239,68,68,0.1)", color: "rgba(239,68,68,0.8)" }
                        }>
                        {trade.direction}
                      </span>
                      <span className="text-[10px] text-gray-500">{trade.leverage}x</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold"
                        style={{ color: trade.pnl >= 0 ? "rgba(74,222,128,1)" : "rgba(239,68,68,1)" }}>
                        {fmtTradePnl(trade.pnl)}
                      </p>
                      <p className="text-[10px]"
                        style={{ color: trade.pnl >= 0 ? "rgba(74,222,128,0.6)" : "rgba(239,68,68,0.6)" }}>
                        {trade.pnlPct >= 0 ? "+" : ""}{trade.pnlPct.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-500">Size <span className="text-gray-400">${trade.size}</span></span>
                      <span className="text-[10px] text-gray-500">Entry <span className="text-gray-400">${trade.entryPrice.toLocaleString()}</span></span>
                    </div>
                    <span className="text-[10px] text-gray-500">
                      {trade.status === "closed" ? "Exit" : "Current"}{" "}
                      <span className="text-gray-400">${(trade.exitPrice ?? trade.currentPrice).toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="rounded-xl py-8 flex flex-col items-center justify-center"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <Clock size={20} className="text-gray-600 mb-2" />
                <p className="text-xs text-gray-500">No {filter} trades yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ═══════════════════════════════════════
// ─── Main Component ───
// ═══════════════════════════════════════
export default function SpecificTraders() {
  const [traders, setTraders] = useState<Trader[]>(MOCK_TRADERS);
  const [expandedTrader, setExpandedTrader] = useState<number | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const openTradesCount = MOCK_TRADE_HISTORY.filter((t) => t.status === "open").length;
  const totalPnl = MOCK_TRADE_HISTORY.reduce((s, t) => s + t.pnl, 0);

  const updateTraderSetting = <K extends keyof TraderSettings>(id: number, key: K, val: TraderSettings[K]) => {
    setTraders((p) => p.map((t) => t.id === id ? { ...t, settings: { ...t.settings, [key]: val } } : t));
    setHasChanges(true);
  };
  const toggleTraderCustom = (id: number) => {
    setTraders((p) => p.map((t) => (t.id === id ? { ...t, useCustom: !t.useCustom } : t)));
    setHasChanges(true);
  };
  const unfollowTrader = (id: number) => {
    setTraders((p) => p.filter((t) => t.id !== id));
    setExpandedTrader(null);
    setHasChanges(true);
  };
  const handleSave = () => { setHasChanges(false); toast.success("Settings saved successfully"); };

  return (
    <div>
      {/* Search */}
      <div className="rounded-2xl h-12 flex items-center px-4 gap-3 mb-4"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <Search size={16} className="text-gray-500" />
        <input type="text" placeholder="Search traders to follow..." value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-500" />
      </div>

      {/* Followed Traders */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500">Followed Traders ({traders.length})</p>
          <div className="flex items-center flex-shrink-0 pr-3">
            <div className="w-5" />
            <div className="ml-1 flex items-center justify-center" style={{ minWidth: "62px" }}>
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">PnL</span>
            </div>
            <div className="ml-1.5 flex items-center justify-center" style={{ minWidth: "62px" }}>
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">Size</span>
            </div>
            <div className="ml-1.5 w-4" />
          </div>
        </div>

        <div className="space-y-2">
          {traders.map((trader) => {
            const isExpanded = expandedTrader === trader.id;
            return (
              <div key={trader.id}>
                <div className="rounded-2xl p-3 cursor-pointer transition-all"
                  style={{
                    background: isExpanded
                      ? "linear-gradient(135deg, rgba(45,212,191,0.08) 0%, rgba(45,212,191,0.02) 100%)"
                      : "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)",
                    border: isExpanded ? "1px solid rgba(45,212,191,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  }}
                  onClick={() => setExpandedTrader(isExpanded ? null : trader.id)}>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: trader.color }}>
                        {trader.name[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-white truncate">{trader.name}</p>
                          <XVerificationIcon type={trader.xVerification} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{trader.handle}</span>
                          <span className="text-xs text-teal-400">{trader.winRate}% win</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center flex-shrink-0">
                      <div className="w-5 flex items-center justify-center">
                        {trader.useCustom && trader.settings.leverage >= 10 && (
                          <Tooltip text="High leverage — increased liquidation risk">
                            <AlertTriangle size={14} className="text-orange-400" />
                          </Tooltip>
                        )}
                      </div>
                      <div className="h-7 rounded-lg flex items-center justify-center text-xs font-semibold ml-1"
                        style={{ minWidth: "62px", ...getPnlBadgeStyle(trader.pnl) }}>
                        {fmtPnl(trader.pnl)}
                      </div>
                      <div className="h-7 rounded-lg flex items-center justify-center text-xs font-semibold ml-1.5"
                        style={{ minWidth: "62px", ...getSizeBadgeStyle(trader) }}>
                        {trader.useCustom ? `$${trader.settings.tradeSize}` : "Default"}
                      </div>
                      <div className="ml-1.5">
                        {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-1 rounded-2xl p-4" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <div>
                        <p className="text-sm text-white">Custom Settings</p>
                        <p className="text-xs text-gray-500">Override default follow settings</p>
                      </div>
                      <Toggle enabled={trader.useCustom} onToggle={() => toggleTraderCustom(trader.id)} />
                    </div>
                    {trader.useCustom ? (
                      <div className="space-y-3">
                        {trader.settings.leverage >= 10 && (
                          <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.2)" }}>
                            <AlertTriangle size={14} className="text-orange-400 flex-shrink-0" />
                            <span className="text-xs text-orange-300">High leverage increases liquidation risk</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Trade Size</span>
                          <div className="flex items-center gap-2">
                            <input type="text" value={trader.settings.tradeSize}
                              onChange={(e) => updateTraderSetting(trader.id, "tradeSize", Number(e.target.value) || 0)}
                              className="w-16 bg-transparent text-right text-sm text-white outline-none" onClick={(e) => e.stopPropagation()} />
                            <div className="flex gap-1">
                              <TypeBtn active={trader.settings.tradeSizeType === "USD"} label="$"
                                onClick={(e) => { e.stopPropagation(); updateTraderSetting(trader.id, "tradeSizeType", "USD"); }} />
                              <TypeBtn active={trader.settings.tradeSizeType === "PCT"} label="%"
                                onClick={(e) => { e.stopPropagation(); updateTraderSetting(trader.id, "tradeSizeType", "PCT"); }} />
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-xs text-gray-500">Leverage</span>
                            <Tooltip text={LEVERAGE_TOOLTIP} wide>
                              <Info size={14} className="text-gray-500 cursor-help" />
                            </Tooltip>
                            <span className="text-xs font-semibold ml-auto" style={{ color: "rgba(45,212,191,1)" }}>{trader.settings.leverage}x</span>
                          </div>
                          <LeverageSlider value={trader.settings.leverage} onChange={(v) => updateTraderSetting(trader.id, "leverage", v)} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Copy Direction</span>
                          <CopyDirectionSelector value={trader.settings.copyDirection}
                            onChange={(v) => updateTraderSetting(trader.id, "copyDirection", v)} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Stop Loss</span>
                          <div className="flex items-center gap-2">
                            <input type="text" value={trader.settings.cutLoss}
                              onChange={(e) => updateTraderSetting(trader.id, "cutLoss", Number(e.target.value) || 0)}
                              className="w-16 bg-transparent text-right text-sm text-white outline-none" onClick={(e) => e.stopPropagation()} />
                            <div className="flex gap-1">
                              <TypeBtn active={trader.settings.cutLossType === "USD"} label="$"
                                onClick={(e) => { e.stopPropagation(); updateTraderSetting(trader.id, "cutLossType", "USD"); }} />
                              <TypeBtn active={trader.settings.cutLossType === "PCT"} label="%"
                                onClick={(e) => { e.stopPropagation(); updateTraderSetting(trader.id, "cutLossType", "PCT"); }} />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Take Profit</span>
                          <div className="flex items-center gap-2">
                            <input type="text" value={trader.settings.takeProfit}
                              onChange={(e) => updateTraderSetting(trader.id, "takeProfit", Number(e.target.value) || 0)}
                              className="w-16 bg-transparent text-right text-sm text-white outline-none" onClick={(e) => e.stopPropagation()} />
                            <div className="flex gap-1">
                              <TypeBtn active={trader.settings.takeProfitType === "USD"} label="$"
                                onClick={(e) => { e.stopPropagation(); updateTraderSetting(trader.id, "takeProfitType", "USD"); }} />
                              <TypeBtn active={trader.settings.takeProfitType === "PCT"} label="%"
                                onClick={(e) => { e.stopPropagation(); updateTraderSetting(trader.id, "takeProfitType", "PCT"); }} />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 mt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                          <div className="flex items-center gap-2">
                            <Bell size={14} className="text-gray-500" />
                            <span className="text-xs text-gray-500">Notifications</span>
                          </div>
                          <Toggle enabled={trader.settings.notifications}
                            onToggle={() => updateTraderSetting(trader.id, "notifications", !trader.settings.notifications)} />
                        </div>
                        <div className="pt-3 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                          <button onClick={(e) => { e.stopPropagation(); unfollowTrader(trader.id); }}
                            className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors">
                            <X size={14} /><span>Unfollow {trader.name.split(" ")[0]}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                          <Check size={14} className="text-teal-400" /><span>Using default follow settings</span>
                        </div>
                        <div className="pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                          <button onClick={(e) => { e.stopPropagation(); unfollowTrader(trader.id); }}
                            className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors">
                            <X size={14} /><span>Unfollow {trader.name.split(" ")[0]}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <div className="space-y-3 mt-6">
        <button className="w-full h-14 rounded-2xl font-semibold text-sm transition-all"
          style={{
            background: hasChanges ? "rgba(45,212,191,1)" : "rgba(45,212,191,0.5)",
            color: "#0a0f14",
            boxShadow: hasChanges ? "0 0 25px rgba(45,212,191,0.4)" : "none",
          }}
          onClick={handleSave}>
          Save Changes
        </button>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* Copied Trades — entry button (replaces inline list) */}
      {/* ═══════════════════════════════════════════ */}
      <button
        onClick={() => setShowHistory(true)}
        className="w-full mt-5 rounded-2xl p-4 flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
        style={{
          background: "linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(45,212,191,0.02) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(45,212,191,0.1)" }}
          >
            <Clock size={16} className="text-teal-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Copied Trades History</p>
            <p className="text-xs text-gray-500">
              {openTradesCount} open · {MOCK_TRADE_HISTORY.length} total ·{" "}
              <span style={{ color: totalPnl >= 0 ? "rgba(74,222,128,0.8)" : "rgba(239,68,68,0.8)" }}>
                {fmtTradePnl(totalPnl)}
              </span>
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-gray-500" />
      </button>

      {/* Slide-up history panel */}
      <CopiedTradesPanel open={showHistory} onClose={() => setShowHistory(false)} />
    </div>
  );
}