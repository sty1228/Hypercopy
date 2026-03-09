"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  getFollowedTraders,
  getTraderSettings,
  updateTraderSettings,
  getTradeHistory,
  FollowedTrader,
  DefaultFollowSettings,
  TradeHistoryItem,
} from "@/service";
import {
  Loader2,
  Settings2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  RefreshCw,
  Copy,
  Eye,
  X,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Bell,
  Info,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { createPortal } from "react-dom";

// ─── Styles ───
const cardStyle: React.CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
};

// ─── Helpers ───
function getAvatarColor(name: string) {
  const cols = [
    "#3b82f6",
    "#6366f1",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#8b5cf6",
    "#f97316",
    "#ef4444",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++)
    h = name.charCodeAt(i) + ((h << 5) - h);
  return cols[Math.abs(h) % cols.length];
}

function modeBadge(t: FollowedTrader) {
  if (t.is_copy_trading)
    return {
      label: "COPYING",
      color: "#2dd4bf",
      bg: "rgba(45,212,191,0.12)",
      border: "rgba(45,212,191,0.25)",
    };
  if (t.is_counter_trading)
    return {
      label: "COUNTERING",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
      border: "rgba(245,158,11,0.25)",
    };
  return {
    label: "WATCHING",
    color: "rgba(255,255,255,0.4)",
    bg: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.1)",
  };
}

function fmtTradePnl(v: number): string {
  return `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
}

function fmtTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Toggle ───
function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="w-9 h-[18px] rounded-full transition-all relative cursor-pointer"
      style={{
        background: enabled ? "rgba(45,212,191,1)" : "rgba(255,255,255,0.1)",
      }}
    >
      <div
        className="w-3.5 h-3.5 rounded-full bg-white absolute top-[2px] transition-all"
        style={{ left: enabled ? "18px" : "2px" }}
      />
    </button>
  );
}

// ─── TypeBtn ───
function TypeBtn({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-[10px] font-semibold px-2 py-1 rounded cursor-pointer"
      style={{
        background: active ? "rgba(45,212,191,0.2)" : "transparent",
        color: active ? "#2dd4bf" : "rgba(255,255,255,0.25)",
      }}
    >
      {label}
    </button>
  );
}

// ─── ★ NumInputSmall — allows clearing to empty, no stuck zeros ───
function NumInputSmall({
  value,
  onChange,
  color = "white",
}: {
  value: number;
  onChange: (n: number) => void;
  color?: string;
}) {
  const [display, setDisplay] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setDisplay(String(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        const n = parseFloat(display);
        if (isNaN(n) || display === "") {
          setDisplay("0");
          onChange(0);
        }
      }}
      onChange={(e) => {
        e.stopPropagation();
        const raw = e.target.value;
        if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
          setDisplay(raw);
          const n = parseFloat(raw);
          if (!isNaN(n)) onChange(n);
        }
      }}
      onClick={(e) => e.stopPropagation()}
      className="w-16 text-right bg-transparent border-none outline-none text-[13px] font-bold"
      style={{ color }}
    />
  );
}

// ─── Copied Trades History Panel ───
function CopiedTradesPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [trades, setTrades] = useState<TradeHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setLoading(true);
      getTradeHistory("all", "all", 50, 0)
        .then((res) => setTrades(res.trades))
        .catch(() => setTrades([]))
        .finally(() => setLoading(false));
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!mounted) return null;

  const filtered = trades.filter((t) => {
    if (filter === "open") return t.status === "open";
    if (filter === "closed") return t.status === "closed";
    return true;
  });

  const openTrades = trades.filter((t) => t.status === "open");
  const closedTrades = trades.filter((t) => t.status === "closed");
  const totalPnl = trades.reduce((s, t) => s + (t.pnl_usd ?? 0), 0);

  return createPortal(
    <>
      {open && (
        <div
          className="fixed inset-0 z-[9998]"
          style={{
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
          onClick={onClose}
        />
      )}
      <div
        className="fixed bottom-0 left-1/2 z-[9999] transition-transform duration-300 ease-out w-full"
        style={{
          transform: open ? "translate(-50%, 0)" : "translate(-50%, 100%)",
          pointerEvents: open ? "auto" : "none",
          maxWidth: "580px",
        }}
      >
        <div
          className="rounded-t-2xl overflow-hidden flex flex-col"
          style={{
            background:
              "linear-gradient(180deg, rgba(16,20,26,1) 0%, rgba(10,14,20,1) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderBottom: "none",
            maxHeight: "80vh",
          }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
            <div
              className="w-8 h-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.15)" }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-1 pb-2.5 flex-shrink-0">
            <div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-teal-400" />
                <p className="text-sm font-semibold text-white">
                  Copied Trades
                </p>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5 ml-5">
                Entries & exits from followed traders
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <X size={14} className="text-gray-400" />
            </button>
          </div>

          {/* Summary */}
          <div className="flex gap-1.5 px-4 mb-2.5 flex-shrink-0">
            <div
              className="flex-1 rounded-lg p-2"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p className="text-[8px] text-gray-500 uppercase tracking-wider mb-0.5">
                Total PnL
              </p>
              <p
                className="text-[12px] font-semibold"
                style={{
                  color:
                    totalPnl >= 0 ? "rgba(74,222,128,1)" : "rgba(239,68,68,1)",
                }}
              >
                {fmtTradePnl(totalPnl)}
              </p>
            </div>
            <div
              className="flex-1 rounded-lg p-2"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p className="text-[8px] text-gray-500 uppercase tracking-wider mb-0.5">
                Open
              </p>
              <p className="text-[12px] font-semibold text-teal-400">
                {openTrades.length}
              </p>
            </div>
            <div
              className="flex-1 rounded-lg p-2"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p className="text-[8px] text-gray-500 uppercase tracking-wider mb-0.5">
                Closed
              </p>
              <p className="text-[12px] font-semibold text-white">
                {closedTrades.length}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 px-4 mb-2.5 flex-shrink-0">
            {(
              [
                { key: "all", label: `All (${trades.length})` },
                { key: "open", label: `Open (${openTrades.length})` },
                { key: "closed", label: `Closed (${closedTrades.length})` },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="px-2.5 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer"
                style={
                  filter === f.key
                    ? {
                        background: "rgba(45,212,191,0.15)",
                        color: "rgba(45,212,191,1)",
                        border: "1px solid rgba(45,212,191,0.3)",
                      }
                    : {
                        background: "transparent",
                        color: "rgba(255,255,255,0.4)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }
                }
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Trade list */}
          <div className="flex-1 overflow-y-auto px-4 pb-6 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2
                  size={20}
                  className="text-teal-400"
                  style={{ animation: "spin 1s linear infinite" }}
                />
              </div>
            ) : filtered.length === 0 ? (
              <div
                className="rounded-lg py-6 flex flex-col items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <Clock size={18} className="text-gray-600 mb-1.5" />
                <p className="text-[10px] text-gray-500">
                  No {filter === "all" ? "" : filter} trades yet
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filtered.map((trade) => {
                  const pnl = trade.pnl_usd ?? 0;
                  const pnlPct = trade.pnl_pct ?? 0;
                  const isLong = trade.direction === "long";
                  return (
                    <div
                      key={trade.id}
                      className="rounded-lg p-2.5"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(45,212,191,0.03) 0%, rgba(45,212,191,0.01) 100%)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          {trade.trader_username && (
                            <span className="text-[10px] text-gray-400">
                              @{trade.trader_username}
                            </span>
                          )}
                          {trade.source && (
                            <span
                              className="text-[8px] px-1 py-0.5 rounded font-medium"
                              style={{
                                background: "rgba(255,255,255,0.05)",
                                color: "rgba(255,255,255,0.35)",
                              }}
                            >
                              {trade.source}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                            style={
                              trade.status === "open"
                                ? {
                                    background: "rgba(45,212,191,0.1)",
                                    color: "rgba(45,212,191,0.8)",
                                  }
                                : {
                                    background: "rgba(255,255,255,0.05)",
                                    color: "rgba(255,255,255,0.35)",
                                  }
                            }
                          >
                            {trade.status === "open" ? "Open" : "Closed"}
                          </span>
                          <span className="text-[9px] text-gray-600">
                            {fmtTime(trade.opened_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {isLong ? (
                            <ArrowUpRight
                              size={12}
                              style={{ color: "rgba(74,222,128,0.8)" }}
                            />
                          ) : (
                            <ArrowDownRight
                              size={12}
                              style={{ color: "rgba(239,68,68,0.8)" }}
                            />
                          )}
                          <span className="text-[12px] font-medium text-white">
                            {trade.ticker}
                          </span>
                          <span
                            className="text-[9px] font-medium px-1 py-0.5 rounded uppercase"
                            style={
                              isLong
                                ? {
                                    background: "rgba(74,222,128,0.1)",
                                    color: "rgba(74,222,128,0.8)",
                                  }
                                : {
                                    background: "rgba(239,68,68,0.1)",
                                    color: "rgba(239,68,68,0.8)",
                                  }
                            }
                          >
                            {trade.direction}
                          </span>
                          <span className="text-[9px] text-gray-500">
                            {trade.leverage ?? "–"}x
                          </span>
                        </div>
                        <div className="text-right">
                          <p
                            className="text-[12px] font-semibold"
                            style={{
                              color:
                                pnl >= 0
                                  ? "rgba(74,222,128,1)"
                                  : "rgba(239,68,68,1)",
                            }}
                          >
                            {fmtTradePnl(pnl)}
                          </p>
                          <p
                            className="text-[9px]"
                            style={{
                              color:
                                pnl >= 0
                                  ? "rgba(74,222,128,0.6)"
                                  : "rgba(239,68,68,0.6)",
                            }}
                          >
                            {pnlPct >= 0 ? "+" : ""}
                            {pnlPct.toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      <div
                        className="flex items-center justify-between mt-1.5 pt-1.5"
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <span className="text-[9px] text-gray-500">
                          Size{" "}
                          <span className="text-gray-400">
                            ${trade.size_usd.toFixed(0)}
                          </span>
                        </span>
                        <span className="text-[9px] text-gray-500">
                          Entry{" "}
                          <span className="text-gray-400">
                            ${trade.entry_price?.toLocaleString() ?? "–"}
                          </span>
                        </span>
                      </div>
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

// ─── Trader Settings Row ───
interface TraderSettingsRowProps {
  trader: FollowedTrader;
}

function TraderSettingsRow({ trader }: TraderSettingsRowProps) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<DefaultFollowSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const badge = modeBadge(trader);
  const displayName = trader.display_name || trader.trader_username;
  const showAvatar = !!trader.avatar_url && !imgErr;

  const loadSettings = useCallback(async () => {
    if (settings) return;
    setLoading(true);
    try {
      const s = await getTraderSettings(trader.trader_username);
      setSettings(s);
    } catch {
      try {
        const { getDefaultSettings } = await import("@/service");
        setSettings(await getDefaultSettings());
      } catch {
        /* use nulls, form shows defaults */
      }
    } finally {
      setLoading(false);
    }
  }, [trader.trader_username, settings]);

  const handleToggle = async () => {
    if (!open) await loadSettings();
    setOpen((v) => !v);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateTraderSettings(trader.trader_username, settings);
      toast.success(`Settings saved for @${trader.trader_username}`);
      setOpen(false);
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof DefaultFollowSettings, val: any) =>
    setSettings((prev) => (prev ? { ...prev, [key]: val } : prev));

  return (
    <div className="rounded-xl overflow-hidden mb-2" style={cardStyle}>
      {/* Main row */}
      <div
        className="flex items-center gap-3 p-3.5 cursor-pointer"
        onClick={handleToggle}
      >
        {/* Avatar */}
        {showAvatar ? (
          <img
            src={trader.avatar_url!}
            alt={displayName}
            className="w-10 h-10 rounded-xl object-cover shrink-0"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
            style={{ background: getAvatarColor(trader.trader_username) }}
          >
            {displayName[0]?.toUpperCase()}
          </div>
        )}

        {/* Name + badge */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white truncate">
            {displayName}
          </p>
          <p className="text-[10px] text-gray-500">
            @{trader.trader_username}
          </p>
        </div>

        {/* Mode badge */}
        <span
          className="px-2 py-1 rounded-lg text-[9px] font-bold shrink-0"
          style={{
            background: badge.bg,
            color: badge.color,
            border: `1px solid ${badge.border}`,
          }}
        >
          {badge.label}
        </span>

        {/* Stats */}
        <div className="text-right shrink-0 mr-1">
          <p
            className="text-[12px] font-bold"
            style={{
              color: trader.win_rate >= 0.5 ? "#2dd4bf" : "#f43f5e",
            }}
          >
            {(trader.win_rate > 1
              ? trader.win_rate
              : trader.win_rate * 100
            ).toFixed(0)}
            % WR
          </p>
          <p className="text-[9px] text-gray-500">
            {trader.total_signals} signals
          </p>
        </div>

        {/* Chevron */}
        {open ? (
          <ChevronUp size={14} className="text-gray-500 shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-gray-500 shrink-0" />
        )}
      </div>

      {/* Expanded settings */}
      {open && (
        <div
          className="px-4 pb-4 pt-1"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {loading || !settings ? (
            <div className="flex items-center justify-center py-6">
              <Loader2
                size={18}
                className="text-teal-400"
                style={{ animation: "spin 1s linear infinite" }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Trade size */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400">Trade Size</span>
                <div className="flex items-center gap-2">
                  {/* ★ FIXED: NumInputSmall allows clearing */}
                  <NumInputSmall
                    value={settings.tradeSize}
                    onChange={(n) => set("tradeSize", n)}
                    color="white"
                  />
                  <div
                    className="flex"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 6,
                      padding: 2,
                    }}
                  >
                    {(["USD", "PCT"] as const).map((t) => (
                      <TypeBtn
                        key={t}
                        active={settings.tradeSizeType === t}
                        label={t === "USD" ? "$" : "%"}
                        onClick={(e) => {
                          e.stopPropagation();
                          set("tradeSizeType", t);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Leverage */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-gray-400">Leverage</span>
                  <span className="text-[13px] font-bold text-white">
                    {settings.leverage}x
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={settings.leverage}
                  onChange={(e) => set("leverage", Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full"
                  style={{ accentColor: "#2dd4bf" }}
                />
              </div>

              {/* Stop Loss */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400">Stop Loss</span>
                <div className="flex items-center gap-2">
                  {/* ★ FIXED: NumInputSmall allows clearing */}
                  <NumInputSmall
                    value={settings.sl?.value ?? 0}
                    onChange={(n) => set("sl", { ...settings.sl, value: n })}
                    color="#fb7185"
                  />
                  <div
                    className="flex"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 6,
                      padding: 2,
                    }}
                  >
                    {(["USD", "PCT"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={(e) => {
                          e.stopPropagation();
                          set("sl", { ...settings.sl, type: t });
                        }}
                        className="text-[10px] font-semibold px-2 py-1 rounded cursor-pointer"
                        style={{
                          background:
                            settings.sl?.type === t
                              ? "rgba(251,113,133,0.2)"
                              : "transparent",
                          color:
                            settings.sl?.type === t
                              ? "#fb7185"
                              : "rgba(255,255,255,0.25)",
                        }}
                      >
                        {t === "USD" ? "$" : "%"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Take Profit */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400">Take Profit</span>
                <div className="flex items-center gap-2">
                  {/* ★ FIXED: NumInputSmall allows clearing */}
                  <NumInputSmall
                    value={settings.tp?.value ?? 0}
                    onChange={(n) => set("tp", { ...settings.tp, value: n })}
                    color="#34d399"
                  />
                  <div
                    className="flex"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 6,
                      padding: 2,
                    }}
                  >
                    {(["USD", "PCT"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={(e) => {
                          e.stopPropagation();
                          set("tp", { ...settings.tp, type: t });
                        }}
                        className="text-[10px] font-semibold px-2 py-1 rounded cursor-pointer"
                        style={{
                          background:
                            settings.tp?.type === t
                              ? "rgba(52,211,153,0.2)"
                              : "transparent",
                          color:
                            settings.tp?.type === t
                              ? "#34d399"
                              : "rgba(255,255,255,0.25)",
                        }}
                      >
                        {t === "USD" ? "$" : "%"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                disabled={saving}
                className="w-full py-3 rounded-xl text-[12px] font-bold transition-all mt-2 cursor-pointer"
                style={{
                  background: saving
                    ? "rgba(255,255,255,0.05)"
                    : "linear-gradient(135deg, #2dd4bf, #14b8a6)",
                  color: saving ? "rgba(255,255,255,0.3)" : "#000",
                  border: "none",
                }}
              >
                {saving ? "Saving…" : "Save Settings"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// ─── Main Component ───
// ═══════════════════════════════════════
export default function SpecificTraders() {
  const [traders, setTraders] = useState<FollowedTrader[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "copying" | "watching">("all");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    getFollowedTraders("30d")
      .then(setTraders)
      .catch(() => setTraders([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = traders.filter((t) => {
    if (filter === "copying")
      return t.is_copy_trading || t.is_counter_trading;
    if (filter === "watching")
      return !t.is_copy_trading && !t.is_counter_trading;
    return true;
  });

  const copyingCount = traders.filter(
    (t) => t.is_copy_trading || t.is_counter_trading
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2
          size={24}
          className="text-teal-400"
          style={{ animation: "spin 1s linear infinite" }}
        />
      </div>
    );
  }

  if (traders.length === 0) {
    return (
      <div
        className="rounded-xl p-8 flex flex-col items-center text-center"
        style={cardStyle}
      >
        <Eye size={24} className="text-gray-500 mb-3" />
        <p className="text-[13px] font-semibold text-white mb-1">
          No traders followed yet
        </p>
        <p className="text-[10px] text-gray-500">
          Follow traders from the leaderboard to manage their settings here.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-gray-400">
          <span className="text-white font-semibold">{traders.length}</span>{" "}
          followed ·{" "}
          <span className="text-teal-400 font-semibold">{copyingCount}</span>{" "}
          active
        </p>
      </div>

      {/* Filter tabs */}
      <div
        className="flex p-0.5 rounded-lg mb-3"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {(
          [
            { key: "all", label: `All (${traders.length})` },
            { key: "copying", label: `Active (${copyingCount})` },
            {
              key: "watching",
              label: `Watching (${traders.length - copyingCount})`,
            },
          ] as const
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all cursor-pointer"
            style={{
              background:
                filter === f.key ? "rgba(45,212,191,0.15)" : "transparent",
              color:
                filter === f.key ? "#2dd4bf" : "rgba(255,255,255,0.4)",
              border:
                filter === f.key
                  ? "1px solid rgba(45,212,191,0.3)"
                  : "1px solid transparent",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Trader list */}
      <div>
        {filtered.length === 0 ? (
          <p className="text-center text-[11px] text-gray-500 py-6">
            No traders in this category
          </p>
        ) : (
          filtered.map((t) => (
            <TraderSettingsRow key={t.id} trader={t} />
          ))
        )}
      </div>

      {/* Copied Trades — entry button */}
      <button
        onClick={() => setShowHistory(true)}
        className="w-full mt-4 rounded-xl p-3 flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
        style={{
          background:
            "linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(45,212,191,0.02) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(45,212,191,0.1)" }}
          >
            <Clock size={14} className="text-teal-400" />
          </div>
          <div className="text-left">
            <p className="text-[12px] font-medium text-white">
              Copied Trades History
            </p>
            <p className="text-[10px] text-gray-500">
              View all entries & exits
            </p>
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-500" />
      </button>

      {/* Slide-up history panel */}
      <CopiedTradesPanel
        open={showHistory}
        onClose={() => setShowHistory(false)}
      />

      <style jsx global>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}