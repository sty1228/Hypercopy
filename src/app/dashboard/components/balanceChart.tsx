"use client";

import {
  AreaChart,
  Area,
  XAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from "recharts";
import { BalanceChartData } from "../page";

export type TimeRange = "D" | "W" | "M" | "Y" | "ALL";

/** Signal info attached to a chart data point */
export interface ChartSignal {
  ticker: string;
  direction: "long" | "short";
  pct_change?: number | null;
  tweet_text?: string;
  trader_username?: string;
  source?: "copy" | "counter";
}

/** Extended data point — drop a `signal` on any point to mark it */
export interface BalanceChartDataWithSignal extends BalanceChartData {
  signal?: ChartSignal;
}

const TEAL = "#2dd4bf";
const ROSE = "#fb7185";
const AMBER = "#fbbf24";
const TEAL_RGBA = "rgba(45,212,191,";
const ROSE_RGBA = "rgba(251,113,133,";

/* ─── Signal direction color ─── */
const sigColor = (dir: "long" | "short") => (dir === "long" ? TEAL : ROSE);

/* ─── Tooltip ─── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, mode, color }: any) => {
  if (!active || !payload?.length) return null;

  const d = payload[0];
  const val = d.value as number;
  const isPnl = mode === "pnl";
  const prefix = isPnl ? (val >= 0 ? "+$" : "-$") : "$";
  const display = isPnl
    ? Math.abs(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : val?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const sig: ChartSignal | undefined = d.payload.signal;

  return (
    <div
      className="rounded-xl shadow-lg backdrop-blur-md"
      style={{
        background: "linear-gradient(135deg, rgba(23,42,48,0.95) 0%, rgba(15,30,35,0.95) 100%)",
        border: `1px solid ${sig ? "rgba(251,191,36,0.45)" : color === ROSE ? "rgba(251,113,133,0.35)" : "rgba(80,210,193,0.35)"}`,
        boxShadow: sig
          ? "0 4px 24px rgba(251,191,36,0.18)"
          : `0 4px 20px ${color === ROSE ? "rgba(251,113,133,0.15)" : "rgba(45,212,191,0.15)"}`,
        maxWidth: 220,
        overflow: "hidden",
      }}
    >
      {/* ── Signal detail banner ── */}
      {sig && (
        <div
          className="px-3 pt-2.5 pb-2"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(251,191,36,0.06)",
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-[1px] rounded"
              style={{
                background: sig.direction === "long" ? "rgba(45,212,191,0.15)" : "rgba(251,113,133,0.15)",
                color: sigColor(sig.direction),
              }}
            >
              {sig.direction}
            </span>
            <span className="text-[11px] font-semibold text-white tracking-tight">
              {sig.ticker}
            </span>
            {sig.source && (
              <span
                className="text-[8px] uppercase tracking-wider px-1 py-[1px] rounded ml-auto"
                style={{
                  background: sig.source === "counter" ? "rgba(251,191,36,0.15)" : "rgba(45,212,191,0.12)",
                  color: sig.source === "counter" ? AMBER : TEAL,
                }}
              >
                {sig.source}
              </span>
            )}
          </div>

          {sig.pct_change != null && (
            <p className="text-[10px]" style={{ color: sig.pct_change >= 0 ? TEAL : ROSE }}>
              SPOT CHG {sig.pct_change >= 0 ? "+" : ""}{sig.pct_change.toFixed(1)}%
            </p>
          )}

          {sig.tweet_text && (
            <p
              className="text-[9px] mt-1 leading-[1.35]"
              style={{
                color: "rgba(165,176,176,0.7)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {sig.tweet_text}
            </p>
          )}

          {sig.trader_username && (
            <p className="text-[8px] mt-1" style={{ color: "rgba(165,176,176,0.45)" }}>
              @{sig.trader_username}
            </p>
          )}
        </div>
      )}

      {/* ── Value row ── */}
      <div className="px-3 py-2">
        <p className="text-[10px] mb-0.5" style={{ color: "rgba(165,176,176,0.8)" }}>
          {d.payload.label}
        </p>
        <p
          className="text-sm font-bold tracking-tight"
          style={{
            color,
            textShadow: `0 0 8px ${color === ROSE ? "rgba(251,113,133,0.4)" : "rgba(45,212,191,0.4)"}`,
          }}
        >
          {prefix}{display}
        </p>
      </div>
    </div>
  );
};

/* ─── Dot renderers ─── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GlowDot = (props: any) => {
  const { cx, cy, index, color, payload } = props;
  if (cx == null || cy == null) return null;

  const sig: ChartSignal | undefined = payload?.signal;
  const isLast = props.dataLength && index === props.dataLength - 1;
  const c = color || TEAL;
  const cLight = c === ROSE ? "#ffd6dd" : "#c7fff8";

  /* ── Signal marker: diamond with amber ring ── */
  if (sig) {
    const sc = sigColor(sig.direction);
    return (
      <g>
        {/* Outer glow */}
        <circle cx={cx} cy={cy} r={9} fill={`${AMBER}10`}>
          <animate attributeName="r" values="7;11;7" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0.15;0.5" dur="3s" repeatCount="indefinite" />
        </circle>
        {/* Amber ring */}
        <circle cx={cx} cy={cy} r={5.5} fill="none" stroke={AMBER} strokeWidth={1.2} opacity={0.7} />
        {/* Inner fill = direction color */}
        <circle cx={cx} cy={cy} r={3.5} fill={sc} opacity={0.9} />
        {/* Bright center */}
        <circle cx={cx} cy={cy} r={1.5} fill="#fff" opacity={0.85} />
      </g>
    );
  }

  /* ── Last point: breathing glow ── */
  if (isLast) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={10} fill={`${c}14`}>
          <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.15;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r={5} fill={`${c}33`}>
          <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r={3} fill={cLight} stroke={c} strokeWidth={1.2} />
      </g>
    );
  }

  /* ── Normal point: invisible (no clutter) ── */
  return <g />;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ActiveGlowDot = (props: any) => {
  const { cx, cy, color, payload } = props;
  if (cx == null || cy == null) return null;

  const sig: ChartSignal | undefined = payload?.signal;
  const c = color || TEAL;
  const cLight = c === ROSE ? "#ffd6dd" : "#c7fff8";

  /* Active state on a signal dot */
  if (sig) {
    const sc = sigColor(sig.direction);
    return (
      <g>
        <circle cx={cx} cy={cy} r={14} fill={`${AMBER}12`} />
        <circle cx={cx} cy={cy} r={9} fill={`${AMBER}1A`} />
        <circle cx={cx} cy={cy} r={6} fill="none" stroke={AMBER} strokeWidth={1.5} opacity={0.85} />
        <circle cx={cx} cy={cy} r={3.5} fill={sc} />
        <circle cx={cx} cy={cy} r={1.5} fill="#fff" opacity={0.9} />
      </g>
    );
  }

  return (
    <g>
      <circle cx={cx} cy={cy} r={12} fill={`${c}14`} />
      <circle cx={cx} cy={cy} r={8} fill={`${c}26`} />
      <circle cx={cx} cy={cy} r={5} fill={`${c}40`} />
      <circle cx={cx} cy={cy} r={3} fill={cLight} stroke={c} strokeWidth={1.5} />
    </g>
  );
};

/* ─── Flat / empty state ─── */
const FlatState = ({ hasData }: { hasData: boolean }) => (
  <div className="w-full h-full flex flex-col items-center justify-center relative">
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes flatLineDraw { from { stroke-dashoffset: 600; } to { stroke-dashoffset: 0; } }
      @keyframes flatPulse { 0%,100% { opacity: 0.3; } 50% { opacity: 0.6; } }
    `}} />
    <svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none" className="absolute inset-0">
      <defs>
        <linearGradient id="flatLineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={TEAL} stopOpacity="0" />
          <stop offset="20%"  stopColor={TEAL} stopOpacity="0.25" />
          <stop offset="50%"  stopColor={TEAL} stopOpacity="0.35" />
          <stop offset="80%"  stopColor={TEAL} stopOpacity="0.25" />
          <stop offset="100%" stopColor={TEAL} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="flatGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={TEAL} stopOpacity="0.06" />
          <stop offset="100%" stopColor={TEAL} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="50" width="400" height="50" fill="url(#flatGlow)" style={{ animation: "flatPulse 4s ease-in-out infinite" }} />
      <line x1="10" y1="50" x2="390" y2="50" stroke="url(#flatLineGrad)" strokeWidth="1.5" strokeDasharray="8 6" vectorEffect="non-scaling-stroke" style={{ animation: "flatLineDraw 2s ease-out forwards" }} />
      <circle cy="50" r="2" fill={TEAL} opacity="0.85">
        <animate attributeName="cx" values="10;390;10" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
        <animate attributeName="opacity" values="0;0.85;0.85;0.85;0" dur="5s" repeatCount="indefinite" keyTimes="0;0.05;0.5;0.95;1" />
      </circle>
      <circle cy="50" r="4" fill={TEAL} opacity="0.18">
        <animate attributeName="cx" values="10;390;10" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
        <animate attributeName="opacity" values="0;0.18;0.18;0.18;0" dur="5s" repeatCount="indefinite" keyTimes="0;0.05;0.5;0.95;1" />
      </circle>
    </svg>
    <p className="relative z-10 text-[10px] text-gray-500 mt-2">
      {hasData ? "No change in this period" : "Start trading to see your P&L"}
    </p>
  </div>
);

/* ─── Main component ─── */
interface BalanceChartProps {
  timeRange?: TimeRange;
  chartData: BalanceChartDataWithSignal[];
  mode?: "balance" | "pnl";
}

const BalanceChart = ({ timeRange = "M", chartData, mode = "balance" }: BalanceChartProps) => {
  const isPnl = mode === "pnl";

  if (!chartData || chartData.length === 0) {
    return <FlatState hasData={false} />;
  }

  const allSame = chartData.every((d) => d.value === chartData[0].value);
  if (allSame) {
    return <FlatState hasData={chartData[0].value !== 0} />;
  }

  const lastVal = chartData[chartData.length - 1]?.value ?? 0;
  const isPositive = isPnl ? lastVal >= 0 : true;
  const mainColor = isPositive ? TEAL : ROSE;
  const mainRgba = isPositive ? TEAL_RGBA : ROSE_RGBA;
  const refValue = isPnl ? 0 : (chartData[0]?.value ?? 0);

  /* ─── Tick labels ─── */
  const visibleLabels = new Set<number>();
  const len = chartData.length;
  if (len <= 7) {
    for (let i = 0; i < len; i++) visibleLabels.add(i);
  } else {
    const step = Math.ceil(len / 6);
    for (let i = 0; i < len; i += step) visibleLabels.add(i);
    visibleLabels.add(len - 1);
  }
  const seenLabels = new Set<string>();
  const finalLabels = new Set<number>();
  for (const idx of Array.from(visibleLabels).sort((a, b) => a - b)) {
    const lbl = chartData[idx]?.label || "";
    if (!seenLabels.has(lbl)) {
      seenLabels.add(lbl);
      finalLabels.add(idx);
    }
  }

  const uid = isPnl ? "pnl" : "bal";

  return (
    <div className="w-full h-full chart-container">
      <style dangerouslySetInnerHTML={{ __html: `
        .chart-container, .chart-container *, .chart-container svg,
        .recharts-wrapper, .recharts-wrapper *, .recharts-surface, .recharts-layer {
          outline: none !important;
        }
        .chart-container *:focus, .recharts-wrapper *:focus {
          outline: none !important;
        }
      `}} />
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 25, left: 25, bottom: 0 }}>
          <defs>
            <filter id={`lineGlow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor={mainColor} floodOpacity="0.4" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id={`areaGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={mainColor} stopOpacity={0.2} />
              <stop offset="40%"  stopColor={mainColor} stopOpacity={0.08} />
              <stop offset="100%" stopColor={mainColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            interval={0}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tick={(props: any) => {
              const { x, y, index, payload } = props;
              if (!finalLabels.has(index)) return <g />;
              return (
                <text x={Number(x)} y={Number(y) + 10} textAnchor="middle" fill="rgba(165,176,176,0.5)" fontSize={9} fontWeight={400}>
                  {payload.value}
                </text>
              );
            }}
          />

          <Tooltip
            content={(props) => <CustomTooltip {...props} mode={mode} color={mainColor} />}
            cursor={{ stroke: `${mainRgba}0.25)`, strokeWidth: 1, strokeDasharray: "4 4" }}
          />

          <ReferenceLine
            y={refValue}
            stroke={isPnl ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.12)"}
            strokeDasharray={isPnl ? "4 3" : "6 4"}
            strokeWidth={1}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={mainColor}
            strokeWidth={2}
            fill={`url(#areaGrad-${uid})`}
            filter={`url(#lineGlow-${uid})`}
            dot={<GlowDot color={mainColor} dataLength={len} />}
            activeDot={<ActiveGlowDot color={mainColor} />}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BalanceChart;