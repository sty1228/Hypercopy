"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, ShieldAlert, Target,
  Wallet, BellOff, Check, Trash2, Loader2,
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { getTradeHistory, TradeHistoryItem } from "@/service";

type FilterType = "all" | "trades" | "pnl";

interface Alert {
  id: string;
  type: "open" | "closed" | "profit" | "loss";
  title: string;
  description: string;
  time: string;
  read: boolean;
  pnl?: number;
  pnlPct?: number;
  token?: string;
  size?: number;
  trader?: string | null;
  source?: string;
}

function relativeTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function tradeToAlert(t: TradeHistoryItem): Alert {
  const trader = t.trader_username ? `@${t.trader_username}` : null;
  const src = t.source === "counter" ? "Counter" : t.source === "copy" ? "Copy" : "Manual";
  const dirLabel = t.direction === "long" ? "↑ Long" : "↓ Short";

  if (t.status === "open") {
    return {
      id: t.id,
      type: "open",
      title: `${src} Trade Opened`,
      description: `${dirLabel} ${t.ticker}${trader ? ` via ${trader}` : ""} · $${t.size_usd.toFixed(0)}`,
      time: relativeTime(t.opened_at),
      read: true,
      token: t.ticker,
      size: t.size_usd,
      trader: t.trader_username,
      source: t.source,
    };
  }

  const pnl = t.pnl_usd ?? 0;
  const pnlPct = t.pnl_pct ?? 0;
  const isProfit = pnl >= 0;

  return {
    id: t.id,
    type: isProfit ? "profit" : "loss",
    title: isProfit ? "Trade Closed — Profit" : "Trade Closed — Loss",
    description: `${dirLabel} ${t.ticker}${trader ? ` via ${trader}` : ""} · $${t.size_usd.toFixed(0)}`,
    time: relativeTime(t.closed_at || t.opened_at),
    read: true,
    pnl,
    pnlPct,
    token: t.ticker,
    trader: t.trader_username,
    source: t.source,
  };
}

function alertIcon(type: Alert["type"]) {
  switch (type) {
    case "open":    return { Icon: TrendingUp,   color: "text-teal-400",  bg: "rgba(45,212,191,0.15)" };
    case "closed":  return { Icon: TrendingDown,  color: "text-gray-400",  bg: "rgba(255,255,255,0.08)" };
    case "profit":  return { Icon: Target,        color: "text-green-400", bg: "rgba(34,197,94,0.15)" };
    case "loss":    return { Icon: ShieldAlert,   color: "text-rose-400",  bg: "rgba(244,63,94,0.15)" };
  }
}

export default function NotificationPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    setLoading(true);
    getTradeHistory("all", "all", 50, 0)
      .then(res => {
        const converted = res.trades.map(tradeToAlert);
        // Mark most recent 3 open trades as unread to give live feel
        converted.forEach((a, i) => { if (i < 3 && a.type === "open") a.read = false; });
        setAlerts(converted);
        setUnread(converted.filter(a => !a.read).length);
      })
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = alerts.filter(a => {
    if (filter === "trades") return a.type === "open" || a.type === "closed";
    if (filter === "pnl")    return a.type === "profit" || a.type === "loss";
    return true;
  });

  const markAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    setUnread(0);
  };

  const markRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const deleteAlert = (id: string) => {
    const a = alerts.find(x => x.id === id);
    setAlerts(prev => prev.filter(x => x.id !== id));
    if (a && !a.read) setUnread(prev => Math.max(0, prev - 1));
  };

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)" }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 left-1/3 w-[300px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)", filter: "blur(60px)" }}
        />
      </div>

      <TopBar activeTrades={0} rank={null} />

      <div className="relative z-10 px-3 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white">Alerts</h1>
            {unread > 0 && (
              <span
                className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                style={{ background: "rgba(45,212,191,0.2)", color: "#2dd4bf" }}
              >
                {unread} new
              </span>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-[9px] text-gray-400 hover:text-teal-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Check size={10} /> Mark all read
            </button>
          )}
        </div>

        {/* Filters */}
        <div
          className="flex p-0.5 rounded-lg mb-3"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {([
            { key: "all",    label: "All" },
            { key: "trades", label: "Opened" },
            { key: "pnl",    label: "P&L" },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all cursor-pointer"
              style={{
                background: filter === f.key ? "rgba(45,212,191,0.15)" : "transparent",
                color: filter === f.key ? "#2dd4bf" : "rgba(255,255,255,0.4)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 px-3 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-teal-400" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-xl p-8 flex flex-col items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(255,255,255,0.05)" }}>
              <BellOff size={22} className="text-gray-500" />
            </div>
            <p className="text-gray-400 text-[12px] mb-1 font-semibold">No activity yet</p>
            <p className="text-gray-600 text-[10px] text-center">
              Start copying a trader to see your trade alerts here.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map(alert => {
              const { Icon, color, bg } = alertIcon(alert.type);
              return (
                <div
                  key={alert.id}
                  className="rounded-lg p-2.5 transition-all duration-200 group cursor-pointer"
                  style={{
                    background: alert.read
                      ? "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)"
                      : "linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(45,212,191,0.02) 100%)",
                    border: alert.read
                      ? "1px solid rgba(255,255,255,0.06)"
                      : "1px solid rgba(45,212,191,0.15)",
                  }}
                  onClick={() => markRead(alert.id)}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: bg }}
                    >
                      <Icon size={14} className={color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-semibold ${alert.read ? "text-gray-300" : "text-white"}`}>
                            {alert.title}
                          </span>
                          {!alert.read && (
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400" style={{ boxShadow: "0 0 6px rgba(45,212,191,0.6)" }} />
                          )}
                        </div>
                        <span className="text-[8px] text-gray-500 shrink-0 ml-2">{alert.time}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mb-1">{alert.description}</p>
                      {/* PnL badge */}
                      {alert.pnl !== undefined && (
                        <div className="flex items-center gap-1.5">
                          {alert.token && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[8px] font-medium"
                              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}
                            >
                              {alert.token}
                            </span>
                          )}
                          <span
                            className="text-[11px] font-bold"
                            style={{ color: alert.pnl >= 0 ? "#2dd4bf" : "#f43f5e" }}
                          >
                            {alert.pnl >= 0 ? "+" : ""}${Math.abs(alert.pnl).toFixed(2)}
                            {alert.pnlPct !== undefined && (
                              <span className="opacity-60 ml-1 text-[9px]">
                                ({alert.pnlPct >= 0 ? "+" : ""}{alert.pnlPct.toFixed(1)}%)
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Delete */}
                    <button
                      onClick={e => { e.stopPropagation(); deleteAlert(alert.id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-white/10 cursor-pointer shrink-0"
                    >
                      <Trash2 size={12} className="text-gray-500 hover:text-rose-400 transition-colors" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}