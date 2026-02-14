"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ---------- Types ----------
export interface PositionTx {
  type: "buy" | "sell";
  amt: number;
  size: number;
  price: number;
  date: string;
  via: string | null;
}

export interface PositionDetailData {
  id: number;
  token: string;
  pair: string;
  iconUrl: string;
  color: string;
  size: number;
  sizeUsd: number;
  pnl: number;
  pnlPercent: number;
  entry: number;
  currentPrice: number;
  txs: PositionTx[];
}

interface TradeMarker {
  idx: number;
  type: "buy" | "sell";
  amt: number;
  avgPrice: number;
  orders: number;
  i: number;
}

// ---------- Static data ----------
const timeframes = [
  { label: "1H", candles: 60 },
  { label: "4H", candles: 48 },
  { label: "1D", candles: 96 },
  { label: "7D", candles: 168 },
  { label: "1M", candles: 180 },
  { label: "ALL", candles: 200 },
];

const tradeMarkersMap: Record<string, { idx: number; type: "buy" | "sell"; amt: number; avgPrice: number; orders: number }[]> = {
  BTC: [
    { idx: 0.12, type: "buy", amt: 12500, avgPrice: 47200, orders: 4 },
    { idx: 0.32, type: "sell", amt: -3200, avgPrice: 48100, orders: 1 },
    { idx: 0.55, type: "buy", amt: 8200, avgPrice: 47800, orders: 3 },
    { idx: 0.78, type: "buy", amt: 3980, avgPrice: 47650, orders: 2 },
  ],
  ETH: [
    { idx: 0.15, type: "buy", amt: 9600, avgPrice: 1920, orders: 2 },
    { idx: 0.4, type: "sell", amt: -2800, avgPrice: 1905, orders: 1 },
    { idx: 0.65, type: "buy", amt: 6220, avgPrice: 1830, orders: 3 },
  ],
  SOL: [
    { idx: 0.1, type: "buy", amt: 3275, avgPrice: 65.5, orders: 1 },
    { idx: 0.35, type: "sell", amt: -1200, avgPrice: 68.0, orders: 1 },
    { idx: 0.6, type: "buy", amt: 4550, avgPrice: 65.0, orders: 2 },
    { idx: 0.82, type: "buy", amt: 2125, avgPrice: 64.2, orders: 1 },
  ],
  HYPE: [
    { idx: 0.3, type: "buy", amt: 3840, avgPrice: 1.14, orders: 1 },
  ],
};

// ---------- Extended position data ----------
export const positionExtendedData: Record<string, { color: string; currentPrice: number; txs: PositionTx[] }> = {
  BTC: {
    color: "#f7931a",
    currentPrice: 48734.5,
    txs: [
      { type: "buy", amt: 12500, size: 0.26, price: 47200, date: "Feb 7, 14:32", via: "@geddard" },
      { type: "sell", amt: -3200, size: -0.07, price: 48100, date: "Feb 6, 18:05", via: null },
      { type: "buy", amt: 8200, size: 0.25, price: 47800, date: "Feb 5, 09:15", via: "@cryptoking" },
      { type: "buy", amt: 3980, size: 0.08, price: 47650, date: "Feb 2, 21:40", via: null },
    ],
  },
  ETH: {
    color: "#627eea",
    currentPrice: 1884.5,
    txs: [
      { type: "buy", amt: 9600, size: 5.0, price: 1920, date: "Feb 6, 11:20", via: "@daytrader" },
      { type: "sell", amt: -2800, size: -1.5, price: 1905, date: "Feb 5, 08:30", via: null },
      { type: "buy", amt: 6220, size: 4.9, price: 1830, date: "Feb 3, 16:45", via: "@geddard" },
    ],
  },
  SOL: {
    color: "#9945ff",
    currentPrice: 70.0,
    txs: [
      { type: "buy", amt: 3275, size: 50, price: 65.5, date: "Feb 8, 08:00", via: "@geddard" },
      { type: "sell", amt: -1200, size: -20, price: 68.0, date: "Feb 6, 13:10", via: null },
      { type: "buy", amt: 4550, size: 70, price: 65.0, date: "Feb 4, 19:30", via: "@daytrader" },
      { type: "buy", amt: 2125, size: 25, price: 64.2, date: "Feb 1, 10:15", via: "@cryptoking" },
    ],
  },
  HYPE: {
    color: "#00d4aa",
    currentPrice: 1.2,
    txs: [
      { type: "buy", amt: 3840, size: 3200, price: 1.14, date: "Feb 7, 22:05", via: "@geddard" },
    ],
  },
};

// ---------- Helpers ----------
const getTimestamp = (idx: number, total: number, tfLabel: string): string => {
  const pct = idx / (total - 1);
  switch (tfLabel) {
    case "1H": { const m = Math.floor(pct * 59); const h = new Date(); h.setMinutes(h.getMinutes() - (59 - m)); return `${h.getHours()}:${h.getMinutes().toString().padStart(2, "0")}`; }
    case "4H": { const m = Math.floor(pct * 47) * 5; const h = new Date(); h.setMinutes(h.getMinutes() - (235 - m)); return `${h.getHours()}:${h.getMinutes().toString().padStart(2, "0")}`; }
    case "1D": { const m = Math.floor(pct * 95) * 15; const hrs = Math.floor(m / 60); const mins = m % 60; const ampm = hrs >= 12 ? "PM" : "AM"; const h12 = hrs % 12 || 12; return `${h12}:${mins.toString().padStart(2, "0")} ${ampm}`; }
    case "7D": { const h = Math.floor(pct * 167); const d = Math.floor(h / 24); const hr = h % 24; const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]; return `${days[d % 7]} ${hr}:00`; }
    case "1M": { const h = Math.floor(pct * 179) * 4; const d = Math.floor(h / 24) + 1; const hr = h % 24; return `Jan ${d}, ${hr}:00`; }
    case "ALL": { const w = Math.floor(pct * 199); const d = Math.floor(w / 7) + 1; const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; const mIdx = Math.floor((d - 1) / 30); const day = ((d - 1) % 30) + 1; return `${months[mIdx % 12]} ${day}`; }
    default: return "";
  }
};

const genLine = (base: number, count: number): number[] => {
  const p: number[] = []; let v = base;
  for (let i = 0; i < count; i++) { v += v * 0.007 * (Math.random() - 0.42); p.push(v); }
  return p;
};

interface CandleData { o: number; cl: number; h: number; l: number; }

const genCandles = (base: number, count: number): CandleData[] => {
  const c: CandleData[] = []; let p = base;
  for (let i = 0; i < count; i++) {
    const ch = p * 0.012 * (Math.random() - 0.42);
    const o = p, cl = o + ch;
    c.push({ o, cl, h: Math.max(o, cl) + Math.abs(ch) * Math.random() * 0.5, l: Math.min(o, cl) - Math.abs(ch) * Math.random() * 0.5 });
    p = cl;
  }
  return c;
};

// ---------- useAnimatedNumber hook ----------
const useAnimatedNumber = (target: number, duration = 600) => {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const from = prevRef.current;
    const diff = target - from;
    if (Math.abs(diff) < 0.001) { setDisplay(target); prevRef.current = target; return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + diff * ease);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
      else prevRef.current = target;
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
};

// ---------- FadeIn wrapper ----------
const FadeIn = ({ children, delay = 0, duration = 400, y = 12, className = "" }: {
  children: React.ReactNode; delay?: number; duration?: number; y?: number; className?: string;
}) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : `translateY(${y}px)`,
      transition: `opacity ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}ms, transform ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}ms`,
    }}>{children}</div>
  );
};

// ---------- PriceChart ----------
interface CrosshairData { price: number; change: number; label: string | null; }

const PriceChart = ({ pos, tf, chartMode, onCrosshair }: {
  pos: PositionDetailData;
  tf: typeof timeframes[0];
  chartMode: "line" | "candle";
  onCrosshair: (data: CrosshairData | null) => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lineData, setLineData] = useState<number[]>([]);
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [hover, setHover] = useState<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const drawProgress = useRef(0);
  const animFrame = useRef<number>(0);
  const markers: TradeMarker[] = (tradeMarkersMap[pos.token] || []).map(m => ({ ...m, i: Math.floor(m.idx * tf.candles) }));
  const markerPulse = useRef(0);

  useEffect(() => {
    setLineData(genLine(pos.entry, tf.candles));
    setCandleData(genCandles(pos.entry, tf.candles));
    setHover(null);
    onCrosshair(null);
    drawProgress.current = 0;
  }, [pos.token, tf.label]);

  useEffect(() => {
    const cvs = canvasRef.current; if (!cvs) return;
    const par = cvs.parentElement?.getBoundingClientRect(); if (!par) return;
    const dpr = window.devicePixelRatio || 1, w = par.width, h = par.height;
    cvs.width = w * dpr; cvs.height = h * dpr; cvs.style.width = w + "px"; cvs.style.height = h + "px";
    sizeRef.current = { w, h };

    let startTime = 0;
    const animDuration = 800;

    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      drawProgress.current = Math.min(elapsed / animDuration, 1);
      const ease = drawProgress.current === 1 ? 1 : 1 - Math.pow(2, -10 * drawProgress.current);
      markerPulse.current = (ts % 2000) / 2000;

      const ctx = cvs.getContext("2d"); if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (chartMode === "line") drawLine(ctx, w, h, ease);
      else drawCandle(ctx, w, h, ease);

      if (drawProgress.current < 1 || hover !== null) {
        animFrame.current = requestAnimationFrame(tick);
      }
    };

    cancelAnimationFrame(animFrame.current);
    if (hover !== null) {
      const ctx = cvs.getContext("2d"); if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (chartMode === "line") drawLine(ctx, w, h, 1);
      else drawCandle(ctx, w, h, 1);
    } else {
      animFrame.current = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(animFrame.current);
  }, [lineData, candleData, hover, chartMode]);

  const PAD = { t: 30, b: 10 };

  const drawLine = (ctx: CanvasRenderingContext2D, w: number, h: number, progress = 1) => {
    ctx.clearRect(0, 0, w, h); if (!lineData.length) return;
    const mn = Math.min(...lineData), mx = Math.max(...lineData), rng = mx - mn || 1;
    const yF = (v: number) => PAD.t + (1 - (v - mn) / rng) * (h - PAD.t - PAD.b);
    const xF = (i: number) => (i / (lineData.length - 1)) * w;
    const hIdx = hover !== null ? hover : lineData.length - 1;
    const visCount = hover !== null ? lineData.length : Math.floor(lineData.length * progress);

    const grad = ctx.createLinearGradient(0, PAD.t, 0, h);
    grad.addColorStop(0, "rgba(45,212,191,0.14)"); grad.addColorStop(1, "rgba(45,212,191,0)");
    ctx.beginPath(); ctx.moveTo(xF(0), yF(lineData[0]));
    const drawTo = Math.min(hIdx, visCount - 1);
    for (let i = 1; i <= drawTo && i < lineData.length; i++) ctx.lineTo(xF(i), yF(lineData[i]));
    ctx.lineTo(xF(Math.min(drawTo, lineData.length - 1)), h - PAD.b); ctx.lineTo(0, h - PAD.b); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

    ctx.beginPath(); ctx.moveTo(xF(0), yF(lineData[0]));
    for (let i = 1; i <= drawTo && i < lineData.length; i++) ctx.lineTo(xF(i), yF(lineData[i]));
    ctx.strokeStyle = "#2dd4bf"; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke();

    if (progress < 1 && visCount > 1) {
      const lastX = xF(visCount - 1), lastY = yF(lineData[visCount - 1]);
      const glowGrad = ctx.createRadialGradient(lastX, lastY, 0, lastX, lastY, 20);
      glowGrad.addColorStop(0, "rgba(45,212,191,0.4)");
      glowGrad.addColorStop(1, "rgba(45,212,191,0)");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(lastX - 20, lastY - 20, 40, 40);
    }

    if (hover !== null && hIdx < lineData.length - 1) {
      ctx.beginPath(); ctx.moveTo(xF(hIdx), yF(lineData[hIdx]));
      for (let i = hIdx + 1; i < lineData.length; i++) ctx.lineTo(xF(i), yF(lineData[i]));
      ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(xF(hIdx), 0, w - xF(hIdx), h);
    }

    markers.forEach(m => { if (m.i < visCount) drawMarker(ctx, xF(m.i), yF(lineData[m.i]), m); });
    if (hover !== null) drawCursor(ctx, w, h, xF(hover), yF(lineData[hover]), hover, lineData);
  };

  const drawCandle = (ctx: CanvasRenderingContext2D, w: number, h: number, progress = 1) => {
    ctx.clearRect(0, 0, w, h); if (!candleData.length) return;
    const allV = candleData.flatMap(c => [c.h, c.l]);
    const mn = Math.min(...allV), mx = Math.max(...allV), rng = mx - mn || 1;
    const yF = (v: number) => PAD.t + (1 - (v - mn) / rng) * (h - PAD.t - PAD.b);
    const cw = w / candleData.length; const xF = (i: number) => i * cw + cw / 2;
    const hIdx = hover !== null ? hover : candleData.length - 1;
    const visCount = hover !== null ? candleData.length : Math.floor(candleData.length * progress);

    if (hover !== null && hIdx < candleData.length - 1) {
      ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(xF(hIdx) + cw / 2, 0, w, h);
    }

    candleData.forEach((c, i) => {
      if (i >= visCount && hover === null) return;
      const x = xF(i), bull = c.cl >= c.o, dim = hover !== null && i > hIdx;
      const col = dim ? "rgba(255,255,255,0.05)" : (bull ? "#2dd4bf" : "#f43f5e");
      const bw = Math.max(cw * 0.5, 1);

      let scale = 1;
      if (hover === null && progress < 1) {
        const candleProgress = Math.max(0, Math.min(1, (visCount - i) / 3));
        scale = candleProgress;
      }

      ctx.save();
      if (scale < 1) {
        const cy = (yF(c.h) + yF(c.l)) / 2;
        ctx.translate(x, cy);
        ctx.scale(1, scale);
        ctx.translate(-x, -cy);
      }

      ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, cw * 0.1);
      ctx.beginPath(); ctx.moveTo(x, yF(c.h)); ctx.lineTo(x, yF(c.l)); ctx.stroke();
      ctx.fillStyle = col; const yo = yF(c.o), yc = yF(c.cl);
      ctx.fillRect(x - bw / 2, Math.min(yo, yc), bw, Math.max(Math.abs(yc - yo), 1));
      ctx.restore();
    });

    markers.forEach(m => { if (m.i < visCount) drawMarker(ctx, xF(m.i), yF(candleData[m.i].cl), m); });
    if (hover !== null) {
      const cp = candleData.map(c => c.cl);
      drawCursor(ctx, w, h, xF(hover), yF(candleData[hover].cl), hover, cp);
    }
  };

  const drawMarker = (ctx: CanvasRenderingContext2D, x: number, y: number, m: TradeMarker) => {
    const buy = m.type === "buy";
    const pulse = Math.sin(markerPulse.current * Math.PI * 2) * 0.3 + 0.7;

    ctx.beginPath(); ctx.arc(x, y, 10 + pulse * 4, 0, Math.PI * 2);
    ctx.fillStyle = buy ? `rgba(34,197,94,${0.04 * pulse})` : `rgba(239,68,68,${0.04 * pulse})`; ctx.fill();

    ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = buy ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.strokeStyle = buy ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = buy ? "#22c55e" : "#ef4444"; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = "#fff"; ctx.fill();
  };

  const drawCursor = (ctx: CanvasRenderingContext2D, w: number, h: number, x: number, y: number, idx: number, data: number[]) => {
    ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(x, PAD.t); ctx.lineTo(x, h - PAD.b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    ctx.setLineDash([]);

    const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, 16);
    glowGrad.addColorStop(0, "rgba(45,212,191,0.3)");
    glowGrad.addColorStop(1, "rgba(45,212,191,0)");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(x - 16, y - 16, 32, 32);

    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(45,212,191,0.2)"; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#2dd4bf"; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = "#fff"; ctx.fill();

    const priceLabel = `$${data[idx].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    ctx.font = "600 10px system-ui";
    const plw = ctx.measureText(priceLabel).width + 10;
    ctx.beginPath(); (ctx as any).roundRect(w - plw - 2, y - 10, plw, 20, 4);
    ctx.fillStyle = "rgba(45,212,191,0.15)"; ctx.fill();
    ctx.strokeStyle = "rgba(45,212,191,0.3)"; ctx.lineWidth = 0.5; ctx.stroke();
    ctx.fillStyle = "#2dd4bf"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(priceLabel, w - plw / 2 - 2, y);

    const mk = markers.find(m => Math.abs(m.i - idx) <= Math.max(1, Math.floor(data.length * 0.01)));
    if (mk) {
      const buy = mk.type === "buy";
      const line1 = `${buy ? "Long" : "Short"} $${Math.abs(mk.amt).toLocaleString()} Total`;
      const line2 = `$${mk.avgPrice.toLocaleString()} Average`;
      const line3 = `${mk.orders} Order${mk.orders > 1 ? "s" : ""}`;
      ctx.font = "600 10px system-ui";
      const tw = Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width, ctx.measureText(line3).width) + 20;
      const th = 48;
      let bx = x - tw / 2; bx = Math.max(3, Math.min(bx, w - tw - 3));
      const by = y > 90 ? y - th - 8 : y + 16;
      ctx.beginPath(); (ctx as any).roundRect(bx, by, tw, th, 8);
      ctx.fillStyle = buy ? "rgba(34,197,94,0.92)" : "rgba(239,68,68,0.92)"; ctx.fill();
      ctx.shadowColor = buy ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "700 10px system-ui";
      ctx.fillText(line1, bx + tw / 2, by + 12);
      ctx.font = "500 9px system-ui";
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillText(line2, bx + tw / 2, by + 26);
      ctx.fillText(line3, bx + tw / 2, by + 38);
      ctx.shadowBlur = 0;
      onCrosshair({ price: data[idx], change: ((data[idx] - data[0]) / data[0] * 100), label: line1 });
    } else {
      const ts = getTimestamp(idx, data.length, tf.label);
      ctx.font = "500 10px system-ui"; const tw = ctx.measureText(ts).width + 10;
      let bx = x - tw / 2; bx = Math.max(3, Math.min(bx, w - tw - 3));
      ctx.beginPath(); (ctx as any).roundRect(bx, PAD.t - 6, tw, 18, 4);
      ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(ts, bx + tw / 2, PAD.t + 3);
      onCrosshair({ price: data[idx], change: ((data[idx] - data[0]) / data[0] * 100), label: null });
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    const cvs = canvasRef.current; if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const cx = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const count = chartMode === "line" ? lineData.length : candleData.length;
    if (!count) return;
    setHover(Math.max(0, Math.min(Math.round((cx / sizeRef.current.w) * (count - 1)), count - 1)));
  };
  const handleLeave = () => { setHover(null); onCrosshair(null); };

  return (
    <div className="relative w-full" style={{ height: 220 }}>
      <canvas ref={canvasRef} className="absolute inset-0 cursor-crosshair"
        onMouseMove={handleMove} onMouseLeave={handleLeave}
        onTouchMove={handleMove} onTouchEnd={handleLeave} style={{ touchAction: "none" }} />
    </div>
  );
};

// ---------- TxRow ----------
const TxRow = ({ tx, token, index }: { tx: PositionTx; token: string; index: number }) => {
  const buy = tx.type === "buy";
  return (
    <FadeIn delay={index * 60} y={8}>
      <div className="flex items-center justify-between py-3 px-4 transition-colors duration-200" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110"
            style={{ background: buy ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={buy ? "#22c55e" : "#ef4444"} strokeWidth="2.5" strokeLinecap="round">
              {buy ? <><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></> : <><path d="M12 5v14" /><path d="M19 12l-7 7-7-7" /></>}
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white font-medium">{buy ? "Bought" : "Sold"}</span>
              <span className="text-xs text-gray-500">{Math.abs(tx.size)} {token}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-gray-500">{tx.date}</span>
              {tx.via && <span className="text-[10px] text-teal-400">via {tx.via}</span>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xs font-semibold ${buy ? "text-white" : "text-red-400"}`}>{buy ? "" : "−"}${Math.abs(tx.amt).toLocaleString()}</span>
          <div className="text-[10px] text-gray-500">@ ${tx.price.toLocaleString()}</div>
        </div>
      </div>
    </FadeIn>
  );
};

// ---------- ShareSheet (UPDATED with referral link + OG image) ----------
const ShareSheet = ({ pos, onClose }: { pos: PositionDetailData; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);
  const [closing, setClosing] = useState(false);
  const priceUp = pos.pnl >= 0;
  const handleCloseAnim = () => { setClosing(true); setTimeout(onClose, 280); };

  // TODO: Replace with actual user referral code from auth/user context
  const referralCode = "ABCDF";
  const referralLink = `https://hypercopy.io?ref=${referralCode}`;

  // OG image URL — your backend generates a dynamic image from these params
  // Needs: /api/og route using @vercel/og or satori
  const ogImageUrl = `https://hypercopy.io/api/og?token=${pos.token}&pnl=${pos.pnl}&pnlPct=${pos.pnlPercent}&entry=${pos.entry}&current=${pos.currentPrice}&size=${pos.sizeUsd}`;

  // New share text per boss's requirements
  const shareText = `${priceUp ? "📈" : "📉"} I'm up ${priceUp ? "+" : "-"}$${Math.abs(pos.pnl).toLocaleString()} Longing $${pos.token} on Hypercopy.io\n\nUse code ${referralCode} to receive free Copy Trading for life. Limited spots available 🔥\n\n${referralLink}`;

  const platforms = [
    {
      name: "X",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
      bg: "#000",
      border: "rgba(255,255,255,0.15)",
      // X/Twitter: text + url param (url triggers OG card with image)
      action: () => window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(ogImageUrl)}`,
        "_blank"
      ),
    },
    {
      name: "Telegram",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>,
      bg: "#0088cc",
      border: "rgba(0,136,204,0.3)",
      action: () => window.open(
        `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`,
        "_blank"
      ),
    },
    {
      name: "Discord",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" /></svg>,
      bg: "#5865F2",
      border: "rgba(88,101,242,0.3)",
      // Discord: copy to clipboard since no direct share URL
      action: () => {
        navigator.clipboard.writeText(shareText + "\n" + referralLink);
      },
    },
    {
      name: "WhatsApp",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>,
      bg: "#25D366",
      border: "rgba(37,211,102,0.3)",
      action: () => window.open(
        `https://wa.me/?text=${encodeURIComponent(shareText)}`,
        "_blank"
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={handleCloseAnim}>
      <div className="absolute inset-0 transition-opacity duration-300" style={{ background: "#0a0e13", opacity: closing ? 0 : 1 }} />
      <div className="relative w-full max-w-md overflow-hidden overflow-y-auto transition-transform duration-300" onClick={e => e.stopPropagation()}
        style={{ background: "linear-gradient(180deg, #141a22 0%, #0a0e13 100%)", borderRadius: "24px 24px 0 0", maxHeight: "92vh", transform: closing ? "translateY(100%)" : "translateY(0)", animation: closing ? "none" : "sheetUp 0.32s cubic-bezier(0.32,0.72,0,1)", boxShadow: "0 -8px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
        <div className="pt-3 pb-2"><div className="w-8 h-1 rounded-full mx-auto" style={{ background: "rgba(255,255,255,0.1)" }} /></div>
        <div className="px-5 pb-2 flex items-center justify-between">
          <span className="text-white text-sm font-bold">Share Position</span>
          <button onClick={handleCloseAnim} className="w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-150 active:scale-90" style={{ background: "rgba(255,255,255,0.08)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        {/* Share card preview */}
        <FadeIn delay={80} y={16}>
          <div className="mx-5 mb-5 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg, #0f1923 0%, #0a1019 60%, #0d1520 100%)", border: "1px solid rgba(45,212,191,0.12)", boxShadow: "0 0 30px rgba(45,212,191,0.06), 0 12px 40px rgba(0,0,0,0.3)" }}>
            <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: pos.color }}>{pos.token[0]}</div>
                <div><span className="text-white text-sm font-bold">{pos.token}</span><span className="text-gray-500 text-xs ml-1">/ USDT</span></div>
              </div>
              <span className="text-gray-600 text-xs">Feb 9, 2026</span>
            </div>
            <div className="px-4 py-2">
              <svg width="100%" height="56" viewBox="0 0 300 56" preserveAspectRatio="none">
                <defs><linearGradient id="sGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={priceUp ? "#22c55e" : "#ef4444"} stopOpacity="0.18" /><stop offset="100%" stopColor={priceUp ? "#22c55e" : "#ef4444"} stopOpacity="0" /></linearGradient></defs>
                <path d={priceUp ? "M0 48 Q30 44 60 40 T120 30 T180 26 T240 14 T300 8 L300 56 L0 56Z" : "M0 12 Q30 16 60 26 T120 34 T180 38 T240 46 T300 50 L300 56 L0 56Z"} fill="url(#sGrad)" />
                <path d={priceUp ? "M0 48 Q30 44 60 40 T120 30 T180 26 T240 14 T300 8" : "M0 12 Q30 16 60 26 T120 34 T180 38 T240 46 T300 50"} fill="none" stroke={priceUp ? "#22c55e" : "#ef4444"} strokeWidth="2">
                  <animate attributeName="stroke-dasharray" from="0 600" to="600 0" dur="1s" fill="freeze" />
                </path>
              </svg>
            </div>
            <div className="px-4 pb-2.5">
              <div className="rounded-xl p-2.5" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="text-center mb-1.5">
                  <div className={`text-xl font-bold ${priceUp ? "text-green-400" : "text-red-400"}`}>{priceUp ? "+" : ""}${Math.abs(pos.pnl).toLocaleString()}</div>
                  <div className={`text-xs font-medium ${priceUp ? "text-green-400/60" : "text-red-400/60"}`}>{priceUp ? "▲" : "▼"} {Math.abs(pos.pnlPercent)}%</div>
                </div>
                <div className="flex justify-between pt-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  {[{ l: "Entry", v: `$${pos.entry.toLocaleString()}` }, { l: "Current", v: `$${pos.currentPrice.toLocaleString()}` }, { l: "Size", v: `$${pos.sizeUsd.toLocaleString()}` }].map((s, i) => (
                    <div key={i} className="text-center"><span className="text-gray-600 block" style={{ fontSize: 8 }}>{s.l}</span><span className="text-white font-medium" style={{ fontSize: 11 }}>{s.v}</span></div>
                  ))}
                </div>
              </div>
            </div>
            {/* Referral badge */}
            <div className="px-4 pb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: "rgba(45,212,191,0.15)" }}><span style={{ fontSize: 8, color: "#2dd4bf", fontWeight: 700 }}>H</span></div>
                <span className="font-bold" style={{ fontSize: 10, color: "#2dd4bf" }}>HyperCopy</span>
              </div>
              <span className="text-gray-600" style={{ fontSize: 9 }}>Code: <span className="text-teal-400 font-semibold">{referralCode}</span> · 15% boost</span>
            </div>
          </div>
        </FadeIn>
        {/* Platforms */}
        <FadeIn delay={200} y={12}>
          <div className="px-5 mb-4">
            <span className="text-xs text-gray-500 font-medium mb-3 block">Share to</span>
            <div className="flex gap-3">
              {platforms.map((p, i) => (
                <button key={i} onClick={p.action} className="flex-1 flex flex-col items-center gap-2 py-3 rounded-xl transition-all duration-200 active:scale-95 hover:brightness-125" style={{ background: `${p.bg}22`, border: `1px solid ${p.border}` }}>
                  {p.icon}
                  <span className="text-white font-medium" style={{ fontSize: 10 }}>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </FadeIn>
        {/* Copy referral link */}
        <FadeIn delay={300} y={12}>
          <div className="px-5 mb-8">
            <button className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]"
              style={{ background: copied ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${copied ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.08)"}`, color: copied ? "#22c55e" : "#fff" }}
              onClick={() => {
                navigator.clipboard.writeText(referralLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}>
              {copied
                ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>Referral Link Copied!</>
                : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>Copy Referral Link</>}
            </button>
          </div>
        </FadeIn>
      </div>
    </div>
  );
};

// ---------- AddSizeSheet ----------
const AddSizeSheet = ({ pos, onClose }: { pos: PositionDetailData; onClose: () => void }) => {
  const [amount, setAmount] = useState("");
  const [closing, setClosing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [direction, setDirection] = useState<"long" | "short">("long");
  const handleCloseAnim = () => { setClosing(true); setTimeout(onClose, 280); };
  const pct = [25, 50, 75, 100];
  const available = 8876.32;
  const numAmt = parseFloat(amount) || 0;
  const estQty = numAmt > 0 ? (numAmt / pos.currentPrice) : 0;
  const isLong = direction === "long";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={handleCloseAnim}>
      <div className="absolute inset-0 transition-opacity duration-300" style={{ background: "#0a0e13", opacity: closing ? 0 : 1 }} />
      <div className="relative w-full max-w-md overflow-hidden overflow-y-auto transition-transform duration-300" onClick={e => e.stopPropagation()}
        style={{ background: "linear-gradient(180deg, #141a22 0%, #0a0e13 100%)", borderRadius: "24px 24px 0 0", maxHeight: "92vh", transform: closing ? "translateY(100%)" : "translateY(0)", animation: closing ? "none" : "sheetUp 0.32s cubic-bezier(0.32,0.72,0,1)", boxShadow: "0 -8px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
        <div className="pt-3 pb-2"><div className="w-8 h-1 rounded-full mx-auto" style={{ background: "rgba(255,255,255,0.1)" }} /></div>
        <div className="px-5 pb-4 flex items-center justify-between">
          <FadeIn delay={50} y={8}>
            <div>
              <span className="text-white text-sm font-bold block">Add to {pos.token} Position</span>
              <span className="text-[10px] text-gray-500">Market price ~${pos.currentPrice.toLocaleString()}</span>
            </div>
          </FadeIn>
          <button onClick={handleCloseAnim} className="w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-150 active:scale-90" style={{ background: "rgba(255,255,255,0.08)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <FadeIn delay={100} y={10}>
          <div className="mx-5 mb-4 flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
            {(["long", "short"] as const).map(d => (
              <button key={d} onClick={() => setDirection(d)} className="flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5"
                style={{ background: direction === d ? (d === "long" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)") : "transparent", color: direction === d ? (d === "long" ? "#22c55e" : "#ef4444") : "rgba(255,255,255,0.25)", border: direction === d ? `1px solid ${d === "long" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}` : "1px solid transparent", transform: direction === d ? "scale(1.02)" : "scale(1)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={direction === d ? (d === "long" ? "#22c55e" : "#ef4444") : "rgba(255,255,255,0.25)"} strokeWidth="2.5" strokeLinecap="round">
                  {d === "long" ? <><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></> : <><path d="M12 5v14" /><path d="M19 12l-7 7-7-7" /></>}
                </svg>
                {d === "long" ? "Long" : "Short"}
              </button>
            ))}
          </div>
        </FadeIn>
        <FadeIn delay={160} y={10}>
          <div className="mx-5 mb-3">
            <div className="rounded-xl p-4 transition-all duration-300" style={{ background: "rgba(255,255,255,0.03)", border: numAmt > 0 ? `1px solid ${isLong ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` : "1px solid rgba(255,255,255,0.08)", boxShadow: numAmt > 0 ? (isLong ? "0 0 20px rgba(34,197,94,0.05)" : "0 0 20px rgba(239,68,68,0.05)") : "none" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-500">Amount (USD)</span>
                <span className="text-[10px] text-gray-500">Available: <span className="text-teal-400">${available.toLocaleString()}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl text-gray-500 font-bold">$</span>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="flex-1 bg-transparent text-2xl font-bold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: pos.color }}>{pos.token[0]}</div>
                  <span className="text-white text-xs font-semibold">{pos.token}</span>
                </div>
              </div>
              {numAmt > 0 && <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", animation: "fadeInUp 0.3s ease" }}><span className="text-[10px] text-gray-500">≈ {estQty.toFixed(pos.currentPrice < 10 ? 2 : 6)} {pos.token}</span></div>}
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={220} y={10}>
          <div className="mx-5 mb-4 flex gap-2">
            {pct.map(p => { const val = (available * p / 100).toFixed(2); return (
              <button key={p} onClick={() => setAmount(val)} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95"
                style={{ background: amount === val ? (isLong ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)") : "rgba(255,255,255,0.03)", border: `1px solid ${amount === val ? (isLong ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)") : "rgba(255,255,255,0.06)"}`, color: amount === val ? (isLong ? "#22c55e" : "#ef4444") : "rgba(255,255,255,0.4)" }}>{p}%</button>
            ); })}
          </div>
        </FadeIn>
        {numAmt > 0 && (
          <FadeIn delay={0} duration={300} y={8}>
            <div className="mx-5 mb-4 rounded-xl p-3" style={{ background: isLong ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.04)", border: `1px solid ${isLong ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)"}` }}>
              {[
                { l: "Direction", v: isLong ? "↑ Long" : "↓ Short", color: isLong ? "#22c55e" : "#ef4444" },
                { l: "New Position Size", v: `$${(pos.sizeUsd + numAmt).toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
                { l: "New Qty", v: `${(pos.size + estQty).toFixed(pos.currentPrice < 10 ? 2 : 6)} ${pos.token}` },
                { l: "New Avg Entry", v: `~$${((pos.entry * pos.size + pos.currentPrice * estQty) / (pos.size + estQty)).toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
              ].map((r, i) => (
                <div key={i} className={`flex justify-between ${i < 3 ? "mb-2" : ""}`}>
                  <span className="text-[11px] text-gray-500">{r.l}</span>
                  <span className="text-xs text-white font-semibold" style={r.color ? { color: r.color } : undefined}>{r.v}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        )}
        <div className="px-5 pb-10">
          {confirmed ? (
            <div className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", animation: "successPulse 0.5s ease" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>Order Submitted!
            </div>
          ) : (
            <button onClick={() => { if (numAmt > 0) { setConfirmed(true); setTimeout(handleCloseAnim, 1200); } }} className="w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.98]"
              style={{ background: numAmt > 0 ? (isLong ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #ef4444, #dc2626)") : "rgba(255,255,255,0.04)", color: numAmt > 0 ? "#fff" : "rgba(255,255,255,0.2)", boxShadow: numAmt > 0 ? (isLong ? "0 4px 20px rgba(34,197,94,0.25)" : "0 4px 20px rgba(239,68,68,0.25)") : "none", cursor: numAmt > 0 ? "pointer" : "not-allowed" }}>
              {numAmt > 0 ? `${isLong ? "Long" : "Short"} ${estQty.toFixed(pos.currentPrice < 10 ? 2 : 6)} ${pos.token}` : "Enter Amount"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- ConfirmDialog ----------
const ConfirmDialog = ({ title, desc, confirmLabel, confirmColor, onConfirm, onCancel }: {
  title: string; desc: string; confirmLabel: string; confirmColor: string; onConfirm: () => void; onCancel: () => void;
}) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center px-8" onClick={onCancel}>
    <div className="absolute inset-0 bg-black/60" style={{ animation: "fadeIn 0.2s ease" }} />
    <div className="relative w-full max-w-sm rounded-2xl p-5" onClick={e => e.stopPropagation()}
      style={{ background: "linear-gradient(180deg, #1a2030 0%, #0e1319 100%)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", animation: "dialogPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
      <p className="text-white text-base font-bold mb-1">{title}</p>
      <p className="text-gray-400 text-sm mb-5">{desc}</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-95 hover:brightness-125" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>Cancel</button>
        <button onClick={onConfirm} className="flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95" style={{ background: confirmColor, color: "#fff" }}>{confirmLabel}</button>
      </div>
    </div>
  </div>
);

// ========== MAIN COMPONENT ==========
interface PositionDetailProps {
  pos: PositionDetailData;
  onClose: () => void;
}

const PositionDetail = ({ pos, onClose }: PositionDetailProps) => {
  const [tf, setTf] = useState(timeframes[4]);
  const [cross, setCross] = useState<CrosshairData | null>(null);
  const [chartMode, setChartMode] = useState<"line" | "candle">("line");
  const [closing, setClosing] = useState(false);
  const [activeSection, setActiveSection] = useState<"chart" | "activity">("chart");
  const [showShare, setShowShare] = useState(false);
  const [showAddSize, setShowAddSize] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [prevPnl, setPrevPnl] = useState(pos.pnl);
  const [pnlFlash, setPnlFlash] = useState(false);

  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  const handleClose = () => { setClosing(true); setTimeout(onClose, 280); };

  const priceUp = cross ? cross.change >= 0 : pos.pnl >= 0;
  const displayPrice = cross ? cross.price : pos.currentPrice;
  const displayChangeAmt = cross ? (cross.price - pos.entry) * pos.size : pos.pnl;
  const displayChangePct = cross ? cross.change : pos.pnlPercent;

  useEffect(() => {
    if (Math.abs(displayChangeAmt - prevPnl) > 0.01) {
      setPnlFlash(true);
      setPrevPnl(displayChangeAmt);
      const t = setTimeout(() => setPnlFlash(false), 300);
      return () => clearTimeout(t);
    }
  }, [displayChangeAmt]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={handleClose}>
      <div className="absolute inset-0 transition-opacity duration-300" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)", opacity: closing ? 0 : 1 }} />
      <div className="relative w-full max-w-md overflow-hidden transition-transform duration-300" onClick={e => e.stopPropagation()}
        style={{ background: "linear-gradient(180deg, #0e1319 0%, #0a0e13 100%)", borderRadius: "24px 24px 0 0", maxHeight: "92vh", overflowY: "auto", transform: closing ? "translateY(100%)" : "translateY(-48px)", animation: closing ? "none" : "sheetUp 0.32s cubic-bezier(0.32,0.72,0,1)", boxShadow: "0 -8px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
        <style>{`
          button { cursor: pointer; }
          @keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(-48px); } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes dialogPop { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
          @keyframes successPulse { 0% { transform: scale(0.95); opacity: 0.5; } 50% { transform: scale(1.02); } 100% { transform: scale(1); opacity: 1; } }
          @keyframes pnlGlow { 0% { box-shadow: none; } 50% { box-shadow: 0 0 20px rgba(45,212,191,0.15); } 100% { box-shadow: none; } }
          @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
          @keyframes breathe { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
          @keyframes borderGlow {
            0%, 100% { border-color: rgba(34,197,94,0.12); box-shadow: 0 0 0 rgba(34,197,94,0); }
            50% { border-color: rgba(34,197,94,0.25); box-shadow: 0 0 20px rgba(34,197,94,0.06); }
          }
          @keyframes borderGlowRed {
            0%, 100% { border-color: rgba(239,68,68,0.12); box-shadow: 0 0 0 rgba(239,68,68,0); }
            50% { border-color: rgba(239,68,68,0.25); box-shadow: 0 0 20px rgba(239,68,68,0.06); }
          }
          @keyframes flash { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
          .shimmer-btn {
            position: relative;
            overflow: hidden;
          }
          .shimmer-btn::after {
            content: '';
            position: absolute;
            top: 0; left: -100%; width: 50%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
            animation: shimmer 3s infinite;
          }
        `}</style>

        {/* Handle */}
        <div className="pt-3 pb-2"><div className="w-8 h-1 rounded-full mx-auto" style={{ background: "rgba(255,255,255,0.1)" }} /></div>

        {/* Header */}
        <FadeIn delay={50} y={10}>
          <div className="px-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white transition-transform duration-200 hover:scale-110" style={{ background: `linear-gradient(135deg, ${pos.color}dd, ${pos.color}88)` }}>{pos.token[0]}</div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-white text-base font-bold">{pos.token}</span>
                  <span className="text-gray-600 text-xs font-medium">{pos.pair.split("/")[1]}</span>
                  <span className="text-green-400 font-semibold ml-1 px-1 py-0.5 rounded" style={{ fontSize: 9, background: "rgba(34,197,94,0.08)", animation: "breathe 3s ease-in-out infinite" }}>OPEN</span>
                </div>
                <span className="text-[10px] text-gray-500">{pos.txs.length} fills · Since {pos.txs[pos.txs.length - 1]?.date?.split(",")[0]}</span>
              </div>
            </div>
            <button onClick={handleClose} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-white/10 active:scale-90" style={{ background: "rgba(255,255,255,0.04)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </FadeIn>

        {/* PnL hero card */}
        <FadeIn delay={120} y={14}>
          <div className="mx-5 mb-3 rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: priceUp ? "linear-gradient(135deg, rgba(34,197,94,0.06), rgba(34,197,94,0.02))" : "linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))",
              border: `1px solid ${priceUp ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)"}`,
              animation: priceUp ? "borderGlow 4s ease-in-out infinite" : "borderGlowRed 4s ease-in-out infinite",
            }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${priceUp ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)"} 0%, transparent 70%)`, transform: "translate(30%, -30%)" }} />
            <div className="flex justify-between items-start relative z-10">
              <div>
                <span className="text-[10px] text-gray-500 tracking-wide">PRICE</span>
                <div className="text-2xl font-bold text-white mt-0.5 tracking-tight" style={{ transition: "color 0.3s" }}>
                  ${displayPrice.toLocaleString(undefined, { minimumFractionDigits: displayPrice < 10 ? 4 : 2, maximumFractionDigits: displayPrice < 10 ? 4 : 2 })}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-500 tracking-wide">UNREALIZED P&L</span>
                <div className={`text-xl font-bold mt-0.5 ${priceUp ? "text-green-400" : "text-red-400"}`}
                  style={{ transition: "color 0.3s", animation: pnlFlash ? "flash 0.3s ease" : "none" }}>
                  {priceUp ? "+" : ""}${Math.abs(displayChangeAmt).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <span className={`text-[11px] font-medium ${priceUp ? "text-green-400/60" : "text-red-400/60"}`}>{priceUp ? "+" : ""}{displayChangePct.toFixed(2)}%</span>
              </div>
            </div>
            <div className="flex gap-4 mt-3 pt-3 relative z-10" style={{ borderTop: `1px solid ${priceUp ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)"}` }}>
              {[{ l: "Size", v: `$${pos.sizeUsd.toLocaleString()}` }, { l: "Qty", v: `${pos.size} ${pos.token}` }, { l: "Avg Entry", v: `$${pos.entry.toLocaleString()}` }].map((s, i) => (
                <div key={i}><span className="text-[9px] text-gray-500">{s.l}</span><div className="text-xs text-white font-semibold mt-0.5">{s.v}</div></div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Share button */}
        <FadeIn delay={180} y={10}>
          <div className="mx-5 mb-3">
            <button onClick={() => setShowShare(true)} className="shimmer-btn w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] hover:brightness-110" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.08), rgba(45,212,191,0.03))", border: "1px solid rgba(45,212,191,0.15)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
              <span className="text-teal-400">Share Position</span>
            </button>
          </div>
        </FadeIn>

        {/* Section tabs */}
        <FadeIn delay={220} y={10}>
          <div className="mx-5 mb-3 flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
            {(["chart", "activity"] as const).map(s => (
              <button key={s} onClick={() => setActiveSection(s)} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-300 text-center capitalize"
                style={{ background: activeSection === s ? "rgba(255,255,255,0.06)" : "transparent", color: activeSection === s ? "#fff" : "rgba(255,255,255,0.3)", boxShadow: activeSection === s ? "0 1px 3px rgba(0,0,0,0.2)" : "none", transform: activeSection === s ? "scale(1.02)" : "scale(1)" }}>
                {s === "chart" ? "Chart" : `Transactions (${pos.txs.length})`}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Chart */}
        {activeSection === "chart" && (
          <FadeIn delay={50} duration={350} y={6}>
            <div className="px-1"><PriceChart pos={pos} tf={tf} chartMode={chartMode} onCrosshair={setCross} /></div>
            <div className="px-5 flex items-center justify-between mt-1 mb-4">
              <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                {timeframes.map(t => (
                  <button key={t.label} onClick={() => setTf(t)} className="px-2.5 py-1.5 rounded-md font-semibold transition-all duration-200" style={{ fontSize: 11, background: tf.label === t.label ? "rgba(255,255,255,0.08)" : "transparent", color: tf.label === t.label ? "#fff" : "rgba(255,255,255,0.25)", transform: tf.label === t.label ? "scale(1.05)" : "scale(1)" }}>{t.label}</button>
                ))}
              </div>
              <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                <button onClick={() => setChartMode("line")} className="p-1.5 rounded-md transition-all duration-200" style={{ background: chartMode === "line" ? "rgba(45,212,191,0.15)" : "transparent" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={chartMode === "line" ? "#2dd4bf" : "rgba(255,255,255,0.25)"} strokeWidth="2" strokeLinecap="round"><path d="M3 17l6-6 4 4 8-8" /></svg>
                </button>
                <button onClick={() => setChartMode("candle")} className="p-1.5 rounded-md transition-all duration-200" style={{ background: chartMode === "candle" ? "rgba(45,212,191,0.15)" : "transparent" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={chartMode === "candle" ? "#2dd4bf" : "rgba(255,255,255,0.25)"} strokeWidth="1.5">
                    <line x1="7" y1="4" x2="7" y2="20" /><rect x="5" y="8" width="4" height="8" rx="0.5" fill={chartMode === "candle" ? "#2dd4bf" : "rgba(255,255,255,0.25)"} />
                    <line x1="17" y1="2" x2="17" y2="18" /><rect x="15" y="6" width="4" height="8" rx="0.5" fill={chartMode === "candle" ? "#2dd4bf" : "rgba(255,255,255,0.25)"} />
                  </svg>
                </button>
              </div>
            </div>
          </FadeIn>
        )}

        {/* Activity */}
        {activeSection === "activity" && (
          <FadeIn delay={50} duration={300} y={8}>
            <div className="mx-5 mb-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              {pos.txs.map((tx, i) => <TxRow key={i} tx={tx} token={pos.token} index={i} />)}
            </div>
          </FadeIn>
        )}

        {/* Bottom actions */}
        <FadeIn delay={300} y={12}>
          <div className="px-5 pb-10">
            <div className="flex gap-2.5">
              <button onClick={() => setConfirmClose(true)} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 hover:brightness-125" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", color: "#f87171" }}>Close Position</button>
              <button onClick={() => setShowAddSize(true)} className="shimmer-btn flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 hover:brightness-110" style={{ background: "linear-gradient(135deg, #2dd4bf, #14b8a6)", color: "#0a0f14", boxShadow: "0 4px 20px rgba(45,212,191,0.25)" }}>Add Size</button>
            </div>
          </div>
        </FadeIn>

        {showShare && <ShareSheet pos={pos} onClose={() => setShowShare(false)} />}
        {showAddSize && <AddSizeSheet pos={pos} onClose={() => setShowAddSize(false)} />}
        {confirmClose && (
          <ConfirmDialog title="Close Position" desc={`Are you sure you want to close your ${pos.token} position? This will market sell ${pos.size} ${pos.token} (~$${pos.sizeUsd.toLocaleString()}).`}
            confirmLabel="Close Position" confirmColor="rgba(239,68,68,0.85)" onConfirm={() => { setConfirmClose(false); handleClose(); }} onCancel={() => setConfirmClose(false)} />
        )}
      </div>
    </div>
  );
};

export default PositionDetail;