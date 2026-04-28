"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, TrendingDown, ChevronLeft, Loader2, Wallet, Settings2,
  X as XIcon, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getTradeHistory,
  getWalletBalance,
  placeManualTrade,
  updateTradeTpSl,
  partialClosePosition,
  closePosition,
  type TradeHistoryItem,
} from "@/service";
import MarketPanel from "./components/MarketPanel";

const cardBg = {
  background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const POPULAR_TICKERS = ["BTC", "ETH", "SOL", "HYPE", "ARB", "OP", "DOGE", "AVAX"];

function fmtUsd(n: number): string {
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(n);
  if (v >= 1000) return `${sign}$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `${sign}$${v.toFixed(2)}`;
}

function fmtPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (p >= 1) return p.toFixed(2);
  if (p >= 0.01) return p.toFixed(4);
  return p.toFixed(6);
}

export default function ManualTradePage() {
  const router = useRouter();

  // ── form state ──
  const [ticker, setTicker] = useState("BTC");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [sizeUsd, setSizeUsd] = useState(50);
  const [leverage, setLeverage] = useState(5);
  const [riskOpen, setRiskOpen] = useState(false);
  const [tpPct, setTpPct] = useState<string>("");
  const [slPct, setSlPct] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // ── data ──
  const [balance, setBalance] = useState<number | null>(null);
  const [withdrawable, setWithdrawable] = useState<number | null>(null);
  const [positions, setPositions] = useState<TradeHistoryItem[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(true);

  // ── per-position UI state ──
  const [editingTpSl, setEditingTpSl] = useState<string | null>(null);
  const [partialPctById, setPartialPctById] = useState<Record<string, number>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const refreshBalance = useCallback(() => {
    getWalletBalance()
      .then((b) => {
        setBalance(b.hl_equity);
        setWithdrawable(b.hl_withdrawable);
      })
      .catch(() => {});
  }, []);

  const refreshPositions = useCallback(async () => {
    setLoadingPositions(true);
    try {
      const res = await getTradeHistory("open", "all", 100);
      setPositions(res.trades);
    } catch {
      // ignore
    } finally {
      setLoadingPositions(false);
    }
  }, []);

  useEffect(() => {
    refreshBalance();
    refreshPositions();
  }, [refreshBalance, refreshPositions]);

  // size convenience presets
  const presetPct = (pct: number) => {
    if (withdrawable == null) return;
    const target = Math.max(10, Math.floor(withdrawable * (pct / 100)));
    setSizeUsd(target);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!ticker.trim()) { toast.error("Enter a ticker"); return; }
    if (sizeUsd <= 0) { toast.error("Size must be greater than 0"); return; }
    if (orderType === "limit" && !limitPrice) { toast.error("Enter a limit price"); return; }

    setSubmitting(true);
    try {
      const lp = orderType === "limit" ? parseFloat(limitPrice) : null;
      if (orderType === "limit" && (!lp || lp <= 0)) {
        toast.error("Limit price must be > 0");
        setSubmitting(false);
        return;
      }
      const tp = tpPct.trim() ? parseFloat(tpPct) : null;
      const sl = slPct.trim() ? parseFloat(slPct) : null;

      const trade = await placeManualTrade({
        ticker: ticker.trim().toUpperCase(),
        direction,
        size_usd: sizeUsd,
        leverage,
        order_type: orderType,
        limit_price: lp,
        tp_pct: tp,
        sl_pct: sl,
      });
      toast.success(
        `${trade.direction === "long" ? "↑ Long" : "↓ Short"} ${trade.ticker} placed · $${trade.size_usd.toFixed(0)} @ $${fmtPrice(trade.entry_price)}`
      );
      refreshBalance();
      refreshPositions();
    } catch (err: any) {
      const detail: string =
        err?.response?.data?.detail || err?.message || "Failed to place order";
      if (detail === "insufficient_balance" || detail.includes("insufficient")) {
        toast.error("Insufficient balance. Please deposit funds.");
        router.push("/dashboard?deposit=1");
      } else if (err?.response?.status === 409) {
        toast.error(`You already have an open position on ${ticker.toUpperCase()}`);
      } else {
        toast.error(detail);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)" }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 left-1/3 w-[300px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)", filter: "blur(60px)" }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 mt-4 mb-3 flex items-center justify-between px-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:bg-white/10"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <ChevronLeft size={18} className="text-gray-400" />
        </button>
        <span className="text-base font-semibold text-white">Manual Trading</span>
        <div className="w-10" />
      </div>

      {/* Market panel — chart + orderbook + live price */}
      <div className="relative z-10 px-4 mb-3">
        <MarketPanel ticker={ticker} onTickerChange={setTicker} />
      </div>

      {/* Balance card */}
      <div className="relative z-10 px-4 mb-3">
        <div className="rounded-2xl px-4 py-3 flex items-center justify-between" style={cardBg}>
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(45,212,191,0.1)" }}
            >
              <Wallet size={16} className="text-teal-400" />
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Equity</div>
              <div className="text-base font-bold text-white">
                {balance == null ? "—" : fmtUsd(balance)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Withdrawable</div>
            <div className="text-sm font-semibold text-teal-400">
              {withdrawable == null ? "—" : fmtUsd(withdrawable)}
            </div>
          </div>
        </div>
      </div>

      {/* Order entry */}
      <div className="relative z-10 px-4 mb-4">
        <div className="rounded-2xl p-4" style={cardBg}>
          {/* Direction tabs */}
          <div className="flex gap-2 mb-3">
            {(["long", "short"] as const).map((d) => {
              const active = direction === d;
              const isLong = d === "long";
              const accent = isLong ? "rgba(45,212,191,1)" : "rgba(244,63,94,1)";
              return (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all"
                  style={{
                    background: active ? `${accent}20` : "rgba(255,255,255,0.03)",
                    border: active ? `1px solid ${accent}55` : "1px solid rgba(255,255,255,0.06)",
                    color: active ? accent : "rgba(255,255,255,0.4)",
                    boxShadow: active ? `0 0 18px ${accent}22` : "none",
                  }}
                >
                  {isLong ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {isLong ? "Long" : "Short"}
                </button>
              );
            })}
          </div>

          {/* Ticker */}
          <div className="mb-3">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Ticker</div>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="BTC"
              className="w-full bg-transparent border-none outline-none text-2xl font-extrabold text-white tracking-wide"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {POPULAR_TICKERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTicker(t)}
                  className="px-2 py-1 rounded-md text-[10px] font-semibold transition-all"
                  style={{
                    background: ticker === t ? "rgba(45,212,191,0.15)" : "rgba(255,255,255,0.03)",
                    color: ticker === t ? "#2dd4bf" : "rgba(255,255,255,0.4)",
                    border: ticker === t ? "1px solid rgba(45,212,191,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Order type */}
          <div className="mb-3">
            <div className="flex gap-2">
              {(["market", "limit"] as const).map((ot) => {
                const active = orderType === ot;
                return (
                  <button
                    key={ot}
                    onClick={() => setOrderType(ot)}
                    className="flex-1 py-2 rounded-lg text-[11px] font-semibold capitalize transition-all"
                    style={{
                      background: active ? "rgba(45,212,191,0.12)" : "rgba(255,255,255,0.03)",
                      color: active ? "#2dd4bf" : "rgba(255,255,255,0.4)",
                      border: active ? "1px solid rgba(45,212,191,0.3)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {ot}
                  </button>
                );
              })}
            </div>
            {orderType === "limit" && (
              <div
                className="mt-2 px-3 py-2.5 rounded-lg flex items-center justify-between"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="text-[11px] text-gray-500">Limit Price</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={limitPrice}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^\d*\.?\d*$/.test(v)) setLimitPrice(v);
                  }}
                  placeholder="0.00"
                  className="w-28 text-right bg-transparent border-none outline-none text-sm font-bold text-white"
                />
              </div>
            )}
          </div>

          {/* Size */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Size (USD)</span>
              <div className="flex gap-1">
                {[25, 50, 75, 100].map((p) => (
                  <button
                    key={p}
                    onClick={() => presetPct(p)}
                    disabled={withdrawable == null}
                    className="px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all disabled:opacity-30"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
            <div
              className="px-3 py-2.5 rounded-lg flex items-center justify-between"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-sm text-gray-500">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={String(sizeUsd)}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") { setSizeUsd(0); return; }
                  if (/^\d*\.?\d*$/.test(v)) setSizeUsd(parseFloat(v) || 0);
                }}
                className="flex-1 ml-2 text-right bg-transparent border-none outline-none text-base font-bold text-white"
              />
            </div>
          </div>

          {/* Leverage */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Leverage</span>
              <span className="text-sm font-bold text-teal-400">{leverage}×</span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={leverage}
              onChange={(e) => setLeverage(parseInt(e.target.value, 10))}
              className="w-full"
              style={{ accentColor: "rgba(45,212,191,1)" }}
            />
            <div className="flex justify-between mt-0.5 text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
              <span>1×</span><span>10×</span><span>20×</span><span>30×</span><span>40×</span><span>50×</span>
            </div>
          </div>

          {/* Risk management toggle */}
          <button
            onClick={() => setRiskOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-semibold transition-all mb-2"
            style={{
              background: riskOpen ? "rgba(45,212,191,0.06)" : "rgba(255,255,255,0.025)",
              border: riskOpen ? "1px solid rgba(45,212,191,0.2)" : "1px solid rgba(255,255,255,0.06)",
              color: riskOpen ? "#2dd4bf" : "rgba(255,255,255,0.55)",
            }}
          >
            <span className="flex items-center gap-1.5">
              <Settings2 size={12} />
              Risk Management {riskOpen ? "" : "(optional)"}
            </span>
            <span className="text-[10px]">{riskOpen ? "Hide" : "Show"}</span>
          </button>

          {riskOpen && (
            <div className="space-y-2 mb-2">
              <div
                className="px-3 py-2.5 rounded-lg flex items-center justify-between"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="text-[11px] text-gray-500">Take Profit %</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={tpPct}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^\d*\.?\d*$/.test(v)) setTpPct(v);
                  }}
                  placeholder="—"
                  className="w-20 text-right bg-transparent border-none outline-none text-sm font-bold"
                  style={{ color: "#34d399" }}
                />
              </div>
              <div
                className="px-3 py-2.5 rounded-lg flex items-center justify-between"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="text-[11px] text-gray-500">Stop Loss %</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={slPct}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^\d*\.?\d*$/.test(v)) setSlPct(v);
                  }}
                  placeholder="—"
                  className="w-20 text-right bg-transparent border-none outline-none text-sm font-bold"
                  style={{ color: "#fb7185" }}
                />
              </div>
            </div>
          )}

          {/* Summary */}
          <div
            className="text-center text-[11px] py-2 rounded-full mb-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}
          >
            ${sizeUsd} · {leverage}× · ~${(sizeUsd * leverage).toFixed(0)} notional
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: submitting
                ? "rgba(255,255,255,0.05)"
                : direction === "long"
                  ? "linear-gradient(135deg, #2dd4bf, #14b8a6)"
                  : "linear-gradient(135deg, #f43f5e, #e11d48)",
              color: submitting ? "rgba(255,255,255,0.3)" : direction === "long" ? "#000" : "#fff",
              border: "none",
              boxShadow: submitting
                ? "none"
                : direction === "long"
                  ? "0 0 24px rgba(45,212,191,0.25)"
                  : "0 0 24px rgba(244,63,94,0.25)",
            }}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Placing…
              </span>
            ) : (
              <>
                {direction === "long" ? "Buy / Long" : "Sell / Short"} {ticker || "—"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Open positions */}
      <div className="relative z-10 px-4 pb-24">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-bold text-white">Open Positions</span>
          <button
            onClick={() => { refreshBalance(); refreshPositions(); }}
            className="flex items-center gap-1 text-[10px] text-teal-400"
          >
            <RefreshCw size={11} /> Refresh
          </button>
        </div>

        {loadingPositions ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={18} className="text-teal-400 animate-spin" />
          </div>
        ) : positions.length === 0 ? (
          <div className="rounded-xl py-8 text-center" style={cardBg}>
            <p className="text-[11px] text-gray-500">No open positions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {positions.map((p) => {
              const pnl = p.pnl_usd ?? 0;
              const pnlPct = p.pnl_pct ?? 0;
              const isWin = pnl >= 0;
              const partialPct = partialPctById[p.id] ?? 50;
              const isEditing = editingTpSl === p.id;
              const isBusy = busyId === p.id;
              return (
                <div key={p.id} className="rounded-xl p-3" style={cardBg}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.direction === "long" ? "bg-teal-400/10" : "bg-rose-400/10"}`}
                      >
                        {p.direction === "long"
                          ? <TrendingUp size={14} className="text-teal-400" />
                          : <TrendingDown size={14} className="text-rose-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-white">{p.ticker}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded capitalize font-medium ${p.direction === "long" ? "bg-teal-400/10 text-teal-400" : "bg-rose-400/10 text-rose-400"}`}
                          >
                            {p.direction}
                          </span>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded text-gray-400"
                            style={{ background: "rgba(255,255,255,0.05)" }}
                          >
                            {p.leverage}×
                          </span>
                          {p.source === "manual" && (
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                              style={{ background: "rgba(168,85,247,0.12)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.25)" }}
                            >
                              MANUAL
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          ${p.size_usd.toFixed(2)} · entry ${fmtPrice(p.entry_price)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isWin ? "text-teal-400" : "text-rose-400"}`}>
                        {isWin ? "+" : "-"}${Math.abs(pnl).toFixed(2)}
                      </p>
                      <p className={`text-[10px] ${isWin ? "text-teal-400/70" : "text-rose-400/70"}`}>
                        {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* Partial close slider */}
                  <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">Close</span>
                      <span className="text-[11px] font-bold text-white">{partialPct}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={5}
                        max={100}
                        step={5}
                        value={partialPct}
                        onChange={(e) =>
                          setPartialPctById((s) => ({ ...s, [p.id]: parseInt(e.target.value, 10) }))
                        }
                        className="flex-1"
                        style={{ accentColor: "rgba(244,63,94,1)" }}
                      />
                      <div className="flex gap-1">
                        {[25, 50, 100].map((q) => (
                          <button
                            key={q}
                            onClick={() => setPartialPctById((s) => ({ ...s, [p.id]: q }))}
                            className="px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all"
                            style={{
                              background: partialPct === q ? "rgba(244,63,94,0.15)" : "rgba(255,255,255,0.04)",
                              color: partialPct === q ? "#fb7185" : "rgba(255,255,255,0.5)",
                              border: partialPct === q ? "1px solid rgba(244,63,94,0.3)" : "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={async () => {
                          if (isBusy) return;
                          setBusyId(p.id);
                          try {
                            if (partialPct >= 100) {
                              await closePosition(p.id);
                              toast.success(`Closed ${p.ticker}`);
                            } else {
                              await partialClosePosition(p.id, partialPct);
                              toast.success(`Closed ${partialPct}% of ${p.ticker}`);
                            }
                            refreshBalance();
                            refreshPositions();
                          } catch (err: any) {
                            toast.error(err?.response?.data?.detail || "Failed to close");
                          } finally {
                            setBusyId(null);
                          }
                        }}
                        disabled={isBusy}
                        className="flex-1 py-2 rounded-lg text-[11px] font-bold transition-all disabled:opacity-50"
                        style={{
                          background: "rgba(244,63,94,0.12)",
                          border: "1px solid rgba(244,63,94,0.25)",
                          color: "#fb7185",
                        }}
                      >
                        {isBusy ? "Working…" : `Close ${partialPct}%`}
                      </button>
                      <button
                        onClick={() => setEditingTpSl(isEditing ? null : p.id)}
                        className="px-3 py-2 rounded-lg text-[11px] font-bold transition-all"
                        style={{
                          background: isEditing ? "rgba(45,212,191,0.15)" : "rgba(255,255,255,0.04)",
                          border: isEditing ? "1px solid rgba(45,212,191,0.3)" : "1px solid rgba(255,255,255,0.06)",
                          color: isEditing ? "#2dd4bf" : "rgba(255,255,255,0.6)",
                        }}
                      >
                        {isEditing ? <XIcon size={12} /> : "TP/SL"}
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <TpSlEditor
                      tradeId={p.id}
                      onSaved={() => {
                        setEditingTpSl(null);
                        refreshPositions();
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TpSlEditor({ tradeId, onSaved }: { tradeId: string; onSaved: () => void }) {
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
    <div className="mt-2 pt-2 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="grid grid-cols-2 gap-2">
        <div
          className="px-2.5 py-2 rounded-lg flex items-center justify-between"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="text-[10px] text-gray-500">TP %</span>
          <input
            type="text"
            inputMode="decimal"
            value={tp}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || /^\d*\.?\d*$/.test(v)) setTp(v);
            }}
            placeholder="—"
            className="w-14 text-right bg-transparent border-none outline-none text-[12px] font-bold"
            style={{ color: "#34d399" }}
          />
        </div>
        <div
          className="px-2.5 py-2 rounded-lg flex items-center justify-between"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="text-[10px] text-gray-500">SL %</span>
          <input
            type="text"
            inputMode="decimal"
            value={sl}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || /^\d*\.?\d*$/.test(v)) setSl(v);
            }}
            placeholder="—"
            className="w-14 text-right bg-transparent border-none outline-none text-[12px] font-bold"
            style={{ color: "#fb7185" }}
          />
        </div>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="w-full py-1.5 rounded-lg text-[11px] font-bold transition-all"
        style={{ background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.3)", color: "#2dd4bf" }}
      >
        {saving ? "Saving…" : "Save TP/SL"}
      </button>
      <p className="text-[9px] text-gray-500 text-center">
        Leave blank to clear. Engine applies on next 15s tick.
      </p>
    </div>
  );
}
