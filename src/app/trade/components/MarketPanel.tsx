"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { HyperLiquidContext } from "@/providers/hyperliquid";

// ── types from HL SDK responses (loose; we treat strings as numbers via parseFloat) ──

interface Candle {
  t: number; T: number;
  o: string; c: string; h: string; l: string;
  v: string; n: number;
}

interface BookLevel { px: string; sz: string; n: number }

interface AssetCtx {
  prevDayPx: string;
  dayNtlVlm: string;
  markPx: string;
  midPx: string | null;
  funding: string;
  openInterest: string;
}

const INTERVALS = ["5m", "15m", "1h", "4h", "1d"] as const;
type Interval = (typeof INTERVALS)[number];
const INTERVAL_MS: Record<Interval, number> = {
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "1h": 60 * 60_000,
  "4h": 4 * 60 * 60_000,
  "1d": 24 * 60 * 60_000,
};
const CANDLE_COUNT = 60;

const POPULAR_TICKERS = ["BTC", "ETH", "SOL", "HYPE", "ARB", "OP", "DOGE", "AVAX"];

function fmtPrice(p: number | null | undefined, decimals = 2): string {
  if (p == null || !Number.isFinite(p)) return "—";
  if (p >= 10_000) return p.toLocaleString("en-US", { maximumFractionDigits: decimals });
  if (p >= 1) return p.toFixed(decimals);
  if (p >= 0.01) return p.toFixed(4);
  return p.toFixed(6);
}

function fmtCompactUsd(n: number): string {
  const v = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (v >= 1e9) return `${sign}$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${sign}$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${sign}$${(v / 1e3).toFixed(1)}k`;
  return `${sign}$${v.toFixed(2)}`;
}

export default function MarketPanel({
  ticker,
  onTickerChange,
}: {
  ticker: string;
  onTickerChange: (t: string) => void;
}) {
  const { infoClient } = useContext(HyperLiquidContext);

  const [interval, setInterval_] = useState<Interval>("1h");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [book, setBook] = useState<{ bids: BookLevel[]; asks: BookLevel[] } | null>(null);
  const [ctx, setCtx] = useState<AssetCtx | null>(null);
  const [mid, setMid] = useState<number | null>(null);
  const [marketAvailable, setMarketAvailable] = useState(true);
  const [tickerOpen, setTickerOpen] = useState(false);

  // Track the ticker requested for each in-flight call so we can drop
  // stale responses when the user switches symbols mid-fetch.
  const reqIdRef = useRef(0);

  const tickerNorm = ticker.trim().toUpperCase();

  // ── Fetch candles when ticker / interval changes ──

  useEffect(() => {
    if (!infoClient || !tickerNorm) return;
    const myReq = ++reqIdRef.current;
    const ms = INTERVAL_MS[interval];
    const endTime = Date.now();
    const startTime = endTime - ms * CANDLE_COUNT;

    infoClient
      .candleSnapshot({ coin: tickerNorm, interval, startTime, endTime })
      .then((data) => {
        if (reqIdRef.current !== myReq) return;
        setCandles(data as Candle[]);
        setMarketAvailable(true);
      })
      .catch(() => {
        if (reqIdRef.current !== myReq) return;
        setCandles([]);
        setMarketAvailable(false);
      });
  }, [infoClient, tickerNorm, interval]);

  // ── Poll book + ctx + mid every 2s ──

  useEffect(() => {
    if (!infoClient || !tickerNorm) return;
    let cancelled = false;
    const myReq = ++reqIdRef.current;

    const poll = async () => {
      if (cancelled) return;
      try {
        const [bk, mac, mids] = await Promise.all([
          infoClient.l2Book({ coin: tickerNorm }),
          infoClient.metaAndAssetCtxs(),
          infoClient.allMids(),
        ]);
        if (cancelled || reqIdRef.current !== myReq) return;

        const lvls = (bk as any).levels as [BookLevel[], BookLevel[]] | undefined;
        if (lvls) {
          setBook({ bids: lvls[0] ?? [], asks: lvls[1] ?? [] });
        }

        const [meta, ctxs] = mac as [{ universe: { name: string }[] }, AssetCtx[]];
        const idx = meta.universe.findIndex((u) => u.name === tickerNorm);
        if (idx >= 0 && ctxs[idx]) {
          setCtx(ctxs[idx]);
        }

        const midStr = (mids as Record<string, string>)[tickerNorm];
        if (midStr) setMid(parseFloat(midStr));
        setMarketAvailable(true);
      } catch {
        if (cancelled) return;
        setMarketAvailable(false);
      }
    };

    poll();
    const id = window.setInterval(poll, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [infoClient, tickerNorm]);

  // ── Refresh candles every 60s to advance the latest bar ──

  useEffect(() => {
    if (!infoClient || !tickerNorm) return;
    const id = window.setInterval(() => {
      const ms = INTERVAL_MS[interval];
      const endTime = Date.now();
      const startTime = endTime - ms * CANDLE_COUNT;
      infoClient
        .candleSnapshot({ coin: tickerNorm, interval, startTime, endTime })
        .then((data) => setCandles(data as Candle[]))
        .catch(() => {});
    }, 60_000);
    return () => window.clearInterval(id);
  }, [infoClient, tickerNorm, interval]);

  // ── Derived ──

  const livePrice = mid ?? (ctx?.midPx ? parseFloat(ctx.midPx) : null);
  const prevDay = ctx?.prevDayPx ? parseFloat(ctx.prevDayPx) : null;
  const change24hPct =
    livePrice != null && prevDay && prevDay > 0
      ? ((livePrice - prevDay) / prevDay) * 100
      : null;
  const dayVlm = ctx?.dayNtlVlm ? parseFloat(ctx.dayNtlVlm) : null;
  const fundingPct = ctx?.funding ? parseFloat(ctx.funding) * 100 : null;
  const openInterest = ctx?.openInterest ? parseFloat(ctx.openInterest) : null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)",
      border: "1px solid rgba(255,255,255,0.08)",
    }}>
      {/* ─── Price header ─── */}
      <div className="px-4 pt-3 pb-2 relative">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setTickerOpen((v) => !v)}
            className="flex items-center gap-1 text-white"
          >
            <span className="text-xl font-extrabold tracking-tight">{tickerNorm || "—"}</span>
            <span className="text-[10px] text-gray-500 ml-1">USD</span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>
          <div className="text-right">
            <div className="text-xl font-extrabold text-white tracking-tight tabular-nums">
              ${fmtPrice(livePrice)}
            </div>
            {change24hPct != null && (
              <div
                className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5"
                style={{
                  background: change24hPct >= 0 ? "rgba(45,212,191,0.12)" : "rgba(244,63,94,0.12)",
                  color: change24hPct >= 0 ? "#2dd4bf" : "#fb7185",
                  border: change24hPct >= 0 ? "1px solid rgba(45,212,191,0.25)" : "1px solid rgba(244,63,94,0.25)",
                }}
              >
                {change24hPct >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                {change24hPct >= 0 ? "+" : ""}{change24hPct.toFixed(2)}% 24h
              </div>
            )}
          </div>
        </div>

        {/* Stat row */}
        <div className="flex gap-3 mt-2 text-[10px]">
          <Stat label="24h Vol" value={dayVlm != null ? fmtCompactUsd(dayVlm) : "—"} />
          <Stat
            label="Funding"
            value={fundingPct != null ? `${(fundingPct * 100 >= 0 ? "+" : "")}${(fundingPct * 100).toFixed(4)}%` : "—"}
            color={fundingPct != null && fundingPct < 0 ? "#fb7185" : "#2dd4bf"}
          />
          <Stat
            label="OI"
            value={openInterest != null && livePrice != null ? fmtCompactUsd(openInterest * livePrice) : "—"}
          />
        </div>

        {/* Ticker dropdown */}
        {tickerOpen && (
          <div
            className="absolute left-3 top-12 z-10 rounded-xl p-2 grid grid-cols-4 gap-1.5 shadow-2xl"
            style={{ background: "#111820", border: "1px solid rgba(45,212,191,0.2)", minWidth: 240 }}
          >
            {POPULAR_TICKERS.map((t) => (
              <button
                key={t}
                onClick={() => { onTickerChange(t); setTickerOpen(false); }}
                className="px-2 py-1.5 rounded-md text-[11px] font-semibold transition-all"
                style={{
                  background: t === tickerNorm ? "rgba(45,212,191,0.15)" : "rgba(255,255,255,0.04)",
                  color: t === tickerNorm ? "#2dd4bf" : "rgba(255,255,255,0.55)",
                  border: t === tickerNorm ? "1px solid rgba(45,212,191,0.3)" : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Interval tabs ─── */}
      <div className="px-4 flex gap-1.5 mb-1">
        {INTERVALS.map((i) => (
          <button
            key={i}
            onClick={() => setInterval_(i)}
            className="px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all"
            style={{
              background: interval === i ? "rgba(45,212,191,0.15)" : "transparent",
              color: interval === i ? "#2dd4bf" : "rgba(255,255,255,0.4)",
              border: interval === i ? "1px solid rgba(45,212,191,0.25)" : "1px solid transparent",
            }}
          >
            {i}
          </button>
        ))}
      </div>

      {/* ─── Candle chart ─── */}
      <CandleChart candles={candles} fallback={!marketAvailable} />

      {/* ─── Orderbook ─── */}
      <OrderBookView book={book} />
    </div>
  );
}

// ─── Stat ──────────────────────────────────────────────

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[8px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</div>
      <div className="text-[10px] font-bold" style={{ color: color || "#fff" }}>{value}</div>
    </div>
  );
}

// ─── Candle chart ──────────────────────────────────────

const CHART_W = 360;
const CHART_H = 180;
const CHART_PAD_X = 6;
const CHART_PAD_TOP = 8;
const CHART_PAD_BOTTOM = 24;
const VOL_H = 18;

function CandleChart({ candles, fallback }: { candles: Candle[]; fallback: boolean }) {
  const data = useMemo(() => {
    return candles.map((c) => ({
      t: c.t,
      o: parseFloat(c.o),
      c: parseFloat(c.c),
      h: parseFloat(c.h),
      l: parseFloat(c.l),
      v: parseFloat(c.v),
    }));
  }, [candles]);

  if (fallback || data.length === 0) {
    return (
      <div
        className="mx-4 mb-3 rounded-lg flex flex-col items-center justify-center text-center"
        style={{ height: CHART_H, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}
      >
        <BarChart3 size={20} className="text-gray-600 mb-1" />
        <p className="text-[10px] text-gray-500">
          {fallback ? "Market data unavailable" : "Loading chart…"}
        </p>
      </div>
    );
  }

  const min = Math.min(...data.map((d) => d.l));
  const max = Math.max(...data.map((d) => d.h));
  const range = max - min || 1;
  const innerW = CHART_W - 2 * CHART_PAD_X;
  const innerH = CHART_H - CHART_PAD_TOP - CHART_PAD_BOTTOM;
  const candleW = innerW / data.length;
  const bodyW = Math.max(1.5, candleW * 0.65);

  const yFor = (price: number) => CHART_PAD_TOP + ((max - price) / range) * innerH;

  const maxVol = Math.max(...data.map((d) => d.v), 1);
  const last = data[data.length - 1];
  const lastY = yFor(last.c);

  return (
    <div className="mx-4 mb-3 rounded-lg overflow-hidden" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} width="100%" height={CHART_H} style={{ display: "block" }}>
        {/* horizontal gridlines */}
        {[0.25, 0.5, 0.75].map((p) => {
          const y = CHART_PAD_TOP + p * innerH;
          return (
            <line
              key={p}
              x1={CHART_PAD_X}
              y1={y}
              x2={CHART_W - CHART_PAD_X}
              y2={y}
              stroke="rgba(255,255,255,0.04)"
              strokeDasharray="2 3"
            />
          );
        })}

        {/* y-axis labels (left side) */}
        <text x={CHART_PAD_X + 2} y={CHART_PAD_TOP + 8} fontSize={8} fill="rgba(255,255,255,0.3)">
          {fmtPrice(max)}
        </text>
        <text x={CHART_PAD_X + 2} y={CHART_PAD_TOP + innerH} fontSize={8} fill="rgba(255,255,255,0.3)">
          {fmtPrice(min)}
        </text>

        {/* candles */}
        {data.map((d, i) => {
          const x = CHART_PAD_X + i * candleW + candleW / 2;
          const isGreen = d.c >= d.o;
          const color = isGreen ? "#2dd4bf" : "#f43f5e";
          const top = Math.min(d.o, d.c);
          const bottom = Math.max(d.o, d.c);
          const yTop = yFor(bottom);
          const yBottom = yFor(top);
          const bodyH = Math.max(1, yBottom - yTop);
          return (
            <g key={d.t}>
              <line
                x1={x}
                y1={yFor(d.h)}
                x2={x}
                y2={yFor(d.l)}
                stroke={color}
                strokeWidth={1}
                opacity={0.85}
              />
              <rect
                x={x - bodyW / 2}
                y={yTop}
                width={bodyW}
                height={bodyH}
                fill={color}
                opacity={0.95}
              />
            </g>
          );
        })}

        {/* volume bars at bottom */}
        {data.map((d, i) => {
          const x = CHART_PAD_X + i * candleW + candleW / 2;
          const h = (d.v / maxVol) * VOL_H;
          const isGreen = d.c >= d.o;
          return (
            <rect
              key={`v-${d.t}`}
              x={x - bodyW / 2}
              y={CHART_H - CHART_PAD_BOTTOM + (VOL_H - h)}
              width={bodyW}
              height={h}
              fill={isGreen ? "#2dd4bf" : "#f43f5e"}
              opacity={0.25}
            />
          );
        })}

        {/* last price marker */}
        <line
          x1={CHART_PAD_X}
          y1={lastY}
          x2={CHART_W - CHART_PAD_X}
          y2={lastY}
          stroke="rgba(45,212,191,0.5)"
          strokeWidth={0.8}
          strokeDasharray="3 2"
        />
        <g transform={`translate(${CHART_W - CHART_PAD_X - 50} ${lastY - 7})`}>
          <rect width={48} height={14} rx={3} fill="#2dd4bf" />
          <text x={24} y={10} textAnchor="middle" fontSize={9} fontWeight={700} fill="#0d1117">
            {fmtPrice(last.c)}
          </text>
        </g>
      </svg>
    </div>
  );
}

// ─── Orderbook ─────────────────────────────────────────

const BOOK_ROWS = 8;

function OrderBookView({ book }: { book: { bids: BookLevel[]; asks: BookLevel[] } | null }) {
  if (!book) {
    return (
      <div className="mx-4 mb-3 py-6 text-center" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8 }}>
        <p className="text-[10px] text-gray-500">Loading book…</p>
      </div>
    );
  }

  const bids = book.bids.slice(0, BOOK_ROWS);
  const asks = book.asks.slice(0, BOOK_ROWS);

  const bestBid = bids[0] ? parseFloat(bids[0].px) : null;
  const bestAsk = asks[0] ? parseFloat(asks[0].px) : null;
  const spread = bestBid != null && bestAsk != null ? bestAsk - bestBid : null;
  const spreadPct = spread != null && bestBid ? (spread / bestBid) * 100 : null;

  const maxSize = Math.max(
    ...bids.map((b) => parseFloat(b.sz)),
    ...asks.map((a) => parseFloat(a.sz)),
    0.000001,
  );

  return (
    <div className="px-4 pb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
          Order Book
        </span>
        {spreadPct != null && (
          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            spread {spreadPct.toFixed(3)}%
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <BookSide rows={bids} side="bid" maxSize={maxSize} />
        <BookSide rows={asks} side="ask" maxSize={maxSize} />
      </div>
    </div>
  );
}

function BookSide({
  rows, side, maxSize,
}: {
  rows: BookLevel[];
  side: "bid" | "ask";
  maxSize: number;
}) {
  const isBid = side === "bid";
  const color = isBid ? "#2dd4bf" : "#fb7185";
  // Asks display in ascending price (top = best ask = lowest)
  // Bids in descending price (top = best bid = highest)
  return (
    <div className="rounded-md overflow-hidden" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="grid grid-cols-2 px-2 py-1 text-[8px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <span>{isBid ? "Bid" : "Ask"}</span>
        <span className="text-right">Size</span>
      </div>
      {rows.length === 0 ? (
        <div className="text-center text-[9px] text-gray-500 py-3">empty</div>
      ) : (
        rows.map((r, i) => {
          const sz = parseFloat(r.sz);
          const px = parseFloat(r.px);
          const pct = (sz / maxSize) * 100;
          return (
            <div key={i} className="grid grid-cols-2 px-2 py-0.5 text-[10px] tabular-nums relative">
              <div
                className="absolute inset-y-0"
                style={{
                  width: `${pct}%`,
                  background: `${color}1f`,
                  [isBid ? "right" : "left"]: 0 as any,
                }}
              />
              <span className="relative font-bold" style={{ color }}>{fmtPrice(px)}</span>
              <span className="relative text-right" style={{ color: "rgba(255,255,255,0.7)" }}>{sz.toFixed(4)}</span>
            </div>
          );
        })
      )}
    </div>
  );
}
