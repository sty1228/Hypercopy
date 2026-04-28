"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TrendingUp, TrendingDown, X as XIcon, Sparkles, Crown } from "lucide-react";
import type { WelcomeBackSummary } from "@/service";

function fmtDuration(hours: number, capped: boolean): string {
  if (capped) return "30+ days ago";
  if (hours < 48) return `${Math.round(hours)} hours ago`;
  const days = hours / 24;
  return `${days.toFixed(days < 10 ? 1 : 0)} days ago`;
}

function fmtUsd(n: number, opts: { sign?: boolean } = {}): string {
  const sign = opts.sign ? (n > 0 ? "+" : n < 0 ? "−" : "") : (n < 0 ? "−" : "");
  const v = Math.abs(n);
  if (v >= 1000) return `${sign}$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `${sign}$${v.toFixed(2)}`;
}

export default function WelcomeBackPopup({
  summary,
  onClose,
}: {
  summary: WelcomeBackSummary;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const positive = summary.balance_delta_usd >= 0;
  const accent = positive ? "#2dd4bf" : "#fb7185";

  // Detect "no activity" — backend returns full data even when nothing happened.
  const hadActivity =
    summary.trades_opened > 0 ||
    summary.trades_closed > 0 ||
    summary.realized_pnl_usd !== 0 ||
    summary.balance_delta_usd !== 0;

  const tpHit = summary.events?.tp_hit ?? 0;
  const slHit = summary.events?.sl_hit ?? 0;
  const equityProtect = summary.events?.equity_protect ?? 0;

  const winRatePct = (summary.win_rate > 1 ? summary.win_rate : summary.win_rate * 100);

  const content = (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 10000,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.28s ease",
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-[92%] max-w-[420px] mx-4 rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #111820 0%, #0d1117 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
          transition: "transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.28s ease",
          opacity: visible ? 1 : 0,
        }}
      >
        {/* accent bar */}
        <div
          style={{
            height: 3,
            background: positive
              ? "linear-gradient(90deg, transparent, #2dd4bf, transparent)"
              : "linear-gradient(90deg, transparent, #f43f5e, transparent)",
            opacity: 0.7,
          }}
        />

        {/* ambient glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: -60,
            left: "50%",
            transform: "translateX(-50%)",
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}18, transparent 70%)`,
            filter: "blur(40px)",
          }}
        />

        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "rgba(255,255,255,0.06)" }}
          aria-label="Dismiss"
        >
          <XIcon size={14} className="text-gray-400" />
        </button>

        <div className="relative px-5 pt-6 pb-5">
          {/* header */}
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-teal-400" />
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {fmtDuration(summary.duration_hours, summary.capped_at_30d)}
            </span>
            {summary.capped_at_30d && (
              <span
                className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}
              >
                CAPPED
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-white mb-4 tracking-tight">
            Welcome back 👋
          </h2>

          {/* balance card */}
          <div
            className="rounded-2xl p-4 mb-3 relative overflow-hidden"
            style={{
              background: positive
                ? "linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(45,212,191,0.02) 100%)"
                : "linear-gradient(135deg, rgba(244,63,94,0.06) 0%, rgba(244,63,94,0.02) 100%)",
              border: positive ? "1px solid rgba(45,212,191,0.2)" : "1px solid rgba(244,63,94,0.2)",
            }}
          >
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              Balance
            </div>
            <div className="text-3xl font-extrabold text-white mb-1 tracking-tight">
              {fmtUsd(summary.current_balance_usd)}
            </div>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1 text-[12px] font-bold"
                style={{ color: accent }}
              >
                {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {fmtUsd(summary.balance_delta_usd, { sign: true })}
              </div>
              <span
                className="text-[12px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: `${accent}1a`, color: accent }}
              >
                {summary.balance_delta_pct >= 0 ? "+" : ""}{summary.balance_delta_pct.toFixed(2)}%
              </span>
            </div>
          </div>

          {hadActivity ? (
            <>
              {/* activity grid */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <Cell
                  label="Realized"
                  value={fmtUsd(summary.realized_pnl_usd, { sign: true })}
                  color={summary.realized_pnl_usd >= 0 ? "#2dd4bf" : "#fb7185"}
                />
                <Cell
                  label="W / L"
                  value={`${summary.wins}W / ${summary.losses}L`}
                  color="#ffffff"
                />
                <Cell
                  label="Win Rate"
                  value={`${Math.round(winRatePct)}%`}
                  color="#2dd4bf"
                />
                <Cell
                  label="Closed"
                  value={String(summary.trades_closed)}
                  color="#ffffff"
                />
              </div>

              {/* engine events */}
              {(tpHit > 0 || slHit > 0 || equityProtect > 0) && (
                <div
                  className="rounded-xl px-3 py-2 mb-3 flex items-center gap-3 text-[11px]"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {tpHit > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="text-teal-400 font-bold">{tpHit}</span>
                      <span className="text-gray-500">TP hit</span>
                    </span>
                  )}
                  {slHit > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="text-rose-400 font-bold">{slHit}</span>
                      <span className="text-gray-500">SL hit</span>
                    </span>
                  )}
                  {equityProtect > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="text-amber-400 font-bold">{equityProtect}</span>
                      <span className="text-gray-500">protect</span>
                    </span>
                  )}
                </div>
              )}

              {/* highlights */}
              <div className="space-y-1.5 mb-1">
                {summary.best_trade && (
                  <Highlight
                    icon={<TrendingUp size={12} className="text-teal-400" />}
                    label="Best"
                    body={`${summary.best_trade.direction === "long" ? "↑" : "↓"} ${summary.best_trade.ticker}`}
                    pnl={summary.best_trade.pnl_usd ?? null}
                    pnlPct={summary.best_trade.pnl_pct ?? null}
                    via={summary.best_trade.trader_username ?? null}
                  />
                )}
                {summary.worst_trade && (
                  <Highlight
                    icon={<TrendingDown size={12} className="text-rose-400" />}
                    label="Worst"
                    body={`${summary.worst_trade.direction === "long" ? "↑" : "↓"} ${summary.worst_trade.ticker}`}
                    pnl={summary.worst_trade.pnl_usd ?? null}
                    pnlPct={summary.worst_trade.pnl_pct ?? null}
                    via={summary.worst_trade.trader_username ?? null}
                  />
                )}
                {summary.top_trader && (
                  <Highlight
                    icon={<Crown size={12} className="text-amber-400" />}
                    label="Top"
                    body={`@${summary.top_trader.trader_username}`}
                    pnl={summary.top_trader.pnl_usd}
                    pnlPct={null}
                    via={`${summary.top_trader.trade_count} trades`}
                  />
                )}
              </div>
            </>
          ) : (
            <div
              className="rounded-xl px-4 py-5 text-center mb-1"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-[12px] text-gray-400 font-semibold mb-1">No trades to report</p>
              <p className="text-[11px] text-gray-500">Markets were quiet — your account didn&apos;t move.</p>
            </div>
          )}

          {/* dismiss */}
          <button
            onClick={handleClose}
            className="w-full mt-4 py-3 rounded-xl text-[13px] font-bold transition-all"
            style={{
              background: "linear-gradient(135deg, #2dd4bf, #14b8a6)",
              color: "#000",
              boxShadow: "0 4px 24px rgba(45,212,191,0.25)",
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(content, document.body);
}

// ─── small subcomponents ────────────────────────────────

function Cell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="rounded-xl px-2 py-2 text-center"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="text-[8px] uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
        {label}
      </div>
      <div className="text-[12px] font-extrabold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function Highlight({
  icon, label, body, pnl, pnlPct, via,
}: {
  icon: React.ReactNode;
  label: string;
  body: string;
  pnl: number | null;
  pnlPct: number | null;
  via: string | null;
}) {
  const pnlColor = (pnl ?? 0) >= 0 ? "#2dd4bf" : "#fb7185";
  return (
    <div
      className="rounded-xl px-3 py-2 flex items-center justify-between"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
          {label}
        </span>
        <span className="text-[12px] font-bold text-white truncate">{body}</span>
        {via && (
          <span className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
            · {via}
          </span>
        )}
      </div>
      {pnl != null && (
        <div className="text-right shrink-0">
          <div className="text-[12px] font-extrabold" style={{ color: pnlColor }}>
            {pnl >= 0 ? "+" : "−"}${Math.abs(pnl).toFixed(2)}
          </div>
          {pnlPct != null && (
            <div className="text-[9px]" style={{ color: pnlColor, opacity: 0.7 }}>
              {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
            </div>
          )}
        </div>
      )}
    </div>
  );
}
