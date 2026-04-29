"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X as XIcon, TrendingUp, TrendingDown, Clock, Wallet,
  Target, ShieldAlert, Hand, Pencil, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  closePosition, updateTradeTpSl,
  type PositionItem, type FollowedTrader, type DefaultFollowSettings,
} from "@/service";

// ── helpers ─────────────────────────────────────────────

function fmtUsd(n: number, opts: { sign?: boolean } = {}): string {
  const sign = opts.sign ? (n > 0 ? "+" : n < 0 ? "−" : "") : (n < 0 ? "−" : "");
  const v = Math.abs(n);
  if (v >= 1000) return `${sign}$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `${sign}$${v.toFixed(2)}`;
}

function fmtPrice(p: number | null | undefined): string {
  if (p == null || !Number.isFinite(p)) return "—";
  if (p >= 10_000) return p.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (p >= 1) return p.toFixed(2);
  if (p >= 0.01) return p.toFixed(4);
  return p.toFixed(6);
}

function fmtRelative(iso: string): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// Rough liquidation price estimate (no MMR — close enough for a UI display).
function approxLiq(entry: number, leverage: number, direction: "long" | "short"): number | null {
  if (!entry || !leverage || leverage <= 0) return null;
  const drop = 1 / leverage;
  return direction === "long" ? entry * (1 - drop) : entry * (1 + drop);
}

// ── component ───────────────────────────────────────────

interface Props {
  position: PositionItem;
  traders: FollowedTrader[];
  defaults: DefaultFollowSettings | null;
  onClose: () => void;
  onClosed: () => void;
}

export default function PositionCard({ position, traders, defaults, onClose, onClosed }: Props) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [editingRisk, setEditingRisk] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 240);
  };

  // Match KOL from followedTraders for avatar / counter detection.
  const trader = useMemo(() => {
    if (!position.trader_username) return null;
    return traders.find((t) => t.trader_username === position.trader_username) ?? null;
  }, [position.trader_username, traders]);

  const isCounter = trader?.is_counter_trading ?? false;
  const isManual = !position.trader_username;
  const direction = (position.direction === "short" ? "short" : "long") as "long" | "short";
  const isLong = direction === "long";

  // Source label
  const sourceLabel = isManual
    ? "Manual trade"
    : isCounter
      ? `Counter-trading @${position.trader_username}`
      : `Copying @${position.trader_username}`;

  // PnL & accent color
  const pnl = position.pnl_usd ?? 0;
  const pnlPct = position.pnl_pct ?? 0;
  const positive = pnl >= 0;
  const accent = positive ? "#2dd4bf" : "#fb7185";
  const accent2 = positive ? "#34d399" : "#f43f5e";

  // Mark / liq / size
  const mark = position.current_price ?? null;
  const liq = approxLiq(position.entry_price, position.leverage, direction);

  // TP / SL inferred from defaults — backend doesn't expose per-trade
  // overrides yet. PCT type only; USD type left blank.
  const tpPctDefault =
    defaults?.tp?.type === "PCT" && defaults.tp.value > 0 ? defaults.tp.value : null;
  const slPctDefault =
    defaults?.sl?.type === "PCT" && defaults.sl.value > 0 ? defaults.sl.value : null;

  const tpPrice = tpPctDefault != null
    ? isLong
      ? position.entry_price * (1 + tpPctDefault / 100)
      : position.entry_price * (1 - tpPctDefault / 100)
    : null;
  const slPrice = slPctDefault != null
    ? isLong
      ? position.entry_price * (1 - slPctDefault / 100)
      : position.entry_price * (1 + slPctDefault / 100)
    : null;

  // Tilt effect — desktop only; mobile gets a static card.
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(1000px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg) scale(1)`;
  };
  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg)";
    }
  };

  const handleClosePosition = async () => {
    if (closing) return;
    setClosing(true);
    try {
      await closePosition(position.id);
      toast.success(`Closed ${position.ticker}`);
      onClosed();
      handleClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to close position");
    } finally {
      setClosing(false);
    }
  };

  const content = (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 9997,
        background: "rgba(0,0,0,0.78)",
        backdropFilter: "blur(8px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.24s ease",
      }}
      onClick={handleClose}
    >
      <div
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-[92%] max-w-[400px] mx-4 rounded-3xl"
        style={{
          background: positive
            ? "linear-gradient(160deg, #0a1f1c 0%, #061111 60%, #050608 100%)"
            : "linear-gradient(160deg, #1f0a0e 0%, #110608 60%, #050608 100%)",
          border: `1.5px solid ${accent}55`,
          boxShadow: `0 30px 80px rgba(0,0,0,0.7), 0 0 60px ${accent}1f, inset 0 0 60px ${accent}0a`,
          transform: visible
            ? "perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)"
            : "perspective(1000px) rotateY(0deg) rotateX(0deg) scale(0.92)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.42s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.32s ease, box-shadow 0.3s ease",
          transformStyle: "preserve-3d",
          overflow: "hidden",
        }}
      >
        {/* Holographic foil stripe at top */}
        <div
          aria-hidden
          style={{
            height: 14,
            background: `conic-gradient(from 180deg at 50% 50%, #ff4d8d 0deg, #fbbf24 60deg, #34d399 120deg, #38bdf8 180deg, #a78bfa 240deg, #ff4d8d 360deg)`,
            backgroundSize: "200% 100%",
            opacity: 0.7,
            filter: "saturate(1.4) blur(0.3px)",
            position: "relative",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
              animation: "foilShimmer 4s linear infinite",
              mixBlendMode: "overlay",
            }}
          />
        </div>
        <style jsx>{`
          @keyframes foilShimmer {
            0%   { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-3 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ top: 22, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}
          aria-label="Close"
        >
          <XIcon size={14} className="text-gray-300" />
        </button>

        {/* Card body */}
        <div className="px-5 pt-5 pb-5">
          {/* Symbol header + KOL stamp */}
          <div className="flex items-start justify-between mb-3 pr-10">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-[10px] font-extrabold uppercase tracking-[0.18em] px-1.5 py-0.5 rounded"
                  style={{
                    background: `${accent}20`,
                    color: accent,
                    border: `1px solid ${accent}55`,
                  }}
                >
                  {direction}
                </span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}
                >
                  {position.leverage}×
                </span>
              </div>
              <h2
                className="text-3xl font-extrabold tracking-tight text-white"
                style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
              >
                {position.ticker}
              </h2>
            </div>

            {/* KOL stamp top-right */}
            <KolStamp
              avatarUrl={trader?.avatar_url ?? null}
              username={position.trader_username}
              isCounter={isCounter}
              isManual={isManual}
            />
          </div>

          {/* Source line */}
          <div
            className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 rounded-lg"
            style={{
              background: "rgba(0,0,0,0.35)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Hand size={11} style={{ color: isCounter ? "#fbbf24" : isManual ? "#a78bfa" : "#2dd4bf" }} />
            <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
              {sourceLabel}
            </span>
          </div>

          {/* PnL hero */}
          <div
            className="rounded-2xl px-4 py-3 mb-3 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${accent}1a 0%, ${accent}05 100%)`,
              border: `1px solid ${accent}33`,
            }}
          >
            <div className="text-[9px] uppercase tracking-[0.18em] mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              Unrealized PnL
            </div>
            <div className="flex items-end gap-2">
              <span
                className="text-3xl font-extrabold tabular-nums tracking-tight"
                style={{ color: accent, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
              >
                {fmtUsd(pnl, { sign: true })}
              </span>
              <span
                className="text-[12px] font-bold pb-1 tabular-nums"
                style={{ color: accent2 }}
              >
                {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Stat label="Size" value={fmtUsd(position.size_usd)} sub={`${position.size_qty.toFixed(4)} ${position.ticker}`} />
            <Stat label="Entry" value={`$${fmtPrice(position.entry_price)}`} mono />
            <Stat label="Mark" value={mark != null ? `$${fmtPrice(mark)}` : "—"} mono />
            <Stat label="Liq ≈" value={liq != null ? `$${fmtPrice(liq)}` : "—"} mono color="#fb7185" />
          </div>

          {/* TP / SL */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <RiskCell
              icon={<Target size={11} className="text-emerald-400" />}
              label="Take Profit"
              price={tpPrice}
              pct={tpPctDefault}
              positive
            />
            <RiskCell
              icon={<ShieldAlert size={11} className="text-rose-400" />}
              label="Stop Loss"
              price={slPrice}
              pct={slPctDefault}
              positive={false}
            />
          </div>

          {/* opened-at */}
          <div className="flex items-center gap-1.5 mb-4 text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            <Clock size={10} />
            <span>Opened {fmtRelative(position.opened_at)}</span>
            {trader?.copy_mode === "next" && (
              <span
                className="ml-auto px-1.5 py-0.5 rounded text-[8px] font-bold"
                style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}
              >
                NEXT 1
              </span>
            )}
          </div>

          {/* Action buttons */}
          {editingRisk ? (
            <RiskEditor
              tradeId={position.id}
              onCancel={() => setEditingRisk(false)}
              onSaved={() => {
                setEditingRisk(false);
                onClosed();
              }}
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setEditingRisk(true)}
                className="py-3 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                <Pencil size={12} />
                Adjust TP/SL
              </button>
              <button
                onClick={handleClosePosition}
                disabled={closing}
                className="py-3 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #f43f5e, #e11d48)",
                  color: "#fff",
                  boxShadow: "0 4px 18px rgba(244,63,94,0.25)",
                }}
              >
                {closing ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <>
                    <XIcon size={12} />
                    Close Position
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(content, document.body);
}

// ─── subcomponents ──────────────────────────────────────

function KolStamp({
  avatarUrl, username, isCounter, isManual,
}: {
  avatarUrl: string | null;
  username: string | null;
  isCounter: boolean;
  isManual: boolean;
}) {
  if (isManual) {
    return (
      <div
        className="shrink-0 flex flex-col items-center"
        title="Manual trade"
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-[10px] tracking-wider"
          style={{
            background: "rgba(168,85,247,0.12)",
            color: "#a78bfa",
            border: "2px solid rgba(168,85,247,0.55)",
            boxShadow: "0 0 18px rgba(168,85,247,0.25)",
          }}
        >
          MAN
        </div>
        <span className="text-[8px] mt-1 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.45)" }}>
          Manual
        </span>
      </div>
    );
  }

  const stampColor = isCounter ? "#fbbf24" : "#2dd4bf";
  const initial = username?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="shrink-0 flex flex-col items-center" title={`@${username}`}>
      <div
        className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-extrabold text-sm relative"
        style={{
          background: `${stampColor}14`,
          border: `2px solid ${stampColor}aa`,
          boxShadow: `0 0 18px ${stampColor}33, inset 0 0 0 2px rgba(0,0,0,0.4)`,
        }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={username ?? ""}
            className="w-full h-full object-cover"
            onError={(ev) => {
              (ev.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span style={{ color: stampColor }}>{initial}</span>
        )}
      </div>
      <span
        className="text-[8px] mt-1 uppercase tracking-wider font-bold truncate max-w-[70px]"
        style={{ color: stampColor }}
      >
        {isCounter ? "COUNTER" : "COPY"}
      </span>
    </div>
  );
}

function Stat({
  label, value, sub, color, mono,
}: {
  label: string; value: string; sub?: string; color?: string; mono?: boolean;
}) {
  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{
        background: "rgba(0,0,0,0.35)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="text-[8px] uppercase tracking-[0.16em] mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
        {label}
      </div>
      <div
        className="text-[14px] font-extrabold tabular-nums"
        style={{
          color: color ?? "#fff",
          fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
        }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[9px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function RiskCell({
  icon, label, price, pct, positive,
}: {
  icon: React.ReactNode;
  label: string;
  price: number | null;
  pct: number | null;
  positive: boolean;
}) {
  const accent = positive ? "#34d399" : "#fb7185";
  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{
        background: price != null ? `${accent}0a` : "rgba(0,0,0,0.35)",
        border: `1px solid ${price != null ? accent + "33" : "rgba(255,255,255,0.06)"}`,
      }}
    >
      <div className="flex items-center gap-1 mb-0.5">
        {icon}
        <span className="text-[8px] uppercase tracking-[0.14em] font-bold" style={{ color: "rgba(255,255,255,0.45)" }}>
          {label}
        </span>
      </div>
      {price != null ? (
        <>
          <div
            className="text-[13px] font-extrabold tabular-nums"
            style={{ color: accent, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
          >
            ${fmtPrice(price)}
          </div>
          <div className="text-[9px] tabular-nums" style={{ color: `${accent}aa` }}>
            {positive ? "+" : "−"}{pct!.toFixed(1)}%
          </div>
        </>
      ) : (
        <div className="text-[12px] font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
          —
        </div>
      )}
    </div>
  );
}

function RiskEditor({
  tradeId, onCancel, onSaved,
}: { tradeId: string; onCancel: () => void; onSaved: () => void }) {
  const [tp, setTp] = useState("");
  const [sl, setSl] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const tpVal = tp.trim() ? parseFloat(tp) : null;
      const slVal = sl.trim() ? parseFloat(sl) : null;
      await updateTradeTpSl(tradeId, tpVal, slVal);
      toast.success("TP/SL updated");
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to update TP/SL");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div
          className="px-3 py-2 rounded-xl flex items-center justify-between"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(52,211,153,0.25)" }}
        >
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">TP %</span>
          <input
            type="text"
            inputMode="decimal"
            value={tp}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || /^\d*\.?\d*$/.test(v)) setTp(v);
            }}
            placeholder="—"
            className="w-16 text-right bg-transparent border-none outline-none text-[13px] font-bold"
            style={{ color: "#34d399" }}
          />
        </div>
        <div
          className="px-3 py-2 rounded-xl flex items-center justify-between"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(244,63,94,0.25)" }}
        >
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">SL %</span>
          <input
            type="text"
            inputMode="decimal"
            value={sl}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || /^\d*\.?\d*$/.test(v)) setSl(v);
            }}
            placeholder="—"
            className="w-16 text-right bg-transparent border-none outline-none text-[13px] font-bold"
            style={{ color: "#fb7185" }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onCancel}
          className="py-2.5 rounded-xl text-[11px] font-bold"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="py-2.5 rounded-xl text-[11px] font-bold disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #2dd4bf, #14b8a6)", color: "#000" }}
        >
          {saving ? "Saving…" : "Save TP/SL"}
        </button>
      </div>
      <p className="text-[9px] text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
        Engine applies on next 15s tick. Leave blank to clear.
      </p>
    </div>
  );
}
