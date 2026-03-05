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

const TEAL = "#2dd4bf";
const ROSE = "#fb7185";
const TEAL_RGBA = "rgba(45,212,191,";
const ROSE_RGBA = "rgba(251,113,133,";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, mode, color }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0];
    const val = d.value as number;
    const isPnl = mode === "pnl";
    const prefix = isPnl ? (val >= 0 ? "+$" : "-$") : "$";
    const display = isPnl
      ? Math.abs(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : val?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (
      <div
        className="px-3 py-2 rounded-xl shadow-lg backdrop-blur-md"
        style={{
          background: "linear-gradient(135deg, rgba(23,42,48,0.95) 0%, rgba(15,30,35,0.95) 100%)",
          border: `1px solid ${color === ROSE ? "rgba(251,113,133,0.35)" : "rgba(80,210,193,0.35)"}`,
          boxShadow: `0 4px 20px ${color === ROSE ? "rgba(251,113,133,0.15)" : "rgba(45,212,191,0.15)"}`,
        }}
      >
        <p className="text-[10px] mb-0.5" style={{ color: "rgba(165,176,176,0.8)" }}>{d.payload.label}</p>
        <p className="text-sm font-bold tracking-tight" style={{ color, textShadow: `0 0 8px ${color === ROSE ? "rgba(251,113,133,0.4)" : "rgba(45,212,191,0.4)"}` }}>
          {prefix}{display}
        </p>
      </div>
    );
  }
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GlowDot = (props: any) => {
  const { cx, cy, index, color } = props;
  if (cx == null || cy == null) return null;
  const isLast = props.dataLength && index === props.dataLength - 1;
  const c = color || TEAL;
  const cLight = c === ROSE ? "#ffd6dd" : "#c7fff8";
  return (
    <g>
      {isLast && (
        <>
          <circle cx={cx} cy={cy} r={10} fill={`${c}14`}>
            <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0.15;0.6" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={cx} cy={cy} r={5} fill={`${c}33`}>
            <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
        </>
      )}
      {!isLast && (
        <>
          <circle cx={cx} cy={cy} r={6} fill={`${c}1F`} />
          <circle cx={cx} cy={cy} r={3.5} fill={`${c}40`} />
        </>
      )}
      <circle cx={cx} cy={cy} r={isLast ? 3 : 2} fill={cLight} stroke={c} strokeWidth={isLast ? 1.2 : 0.8} />
    </g>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ActiveGlowDot = (props: any) => {
  const { cx, cy, color } = props;
  if (cx == null || cy == null) return null;
  const c = color || TEAL;
  const cLight = c === ROSE ? "#ffd6dd" : "#c7fff8";
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

      {/* Subtle gradient below the line */}
      <rect x="0" y="50" width="400" height="50" fill="url(#flatGlow)" style={{ animation: "flatPulse 4s ease-in-out infinite" }} />

      {/* Dashed center line */}
      <line
        x1="10" y1="50" x2="390" y2="50"
        stroke="url(#flatLineGrad)"
        strokeWidth="1.5"
        strokeDasharray="8 6"
        vectorEffect="non-scaling-stroke"
        style={{ animation: "flatLineDraw 2s ease-out forwards" }}
      />

      {/* Moving dot — small solid core only */}
      <circle cy="50" r="2" fill={TEAL} opacity="0.85">
        <animate attributeName="cx" values="10;390;10" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
        <animate attributeName="opacity" values="0;0.85;0.85;0.85;0" dur="5s" repeatCount="indefinite" keyTimes="0;0.05;0.5;0.95;1" />
      </circle>

      {/* Soft glow behind moving dot — kept tight */}
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
  chartData: BalanceChartData[];
  mode?: "balance" | "pnl";
}

const BalanceChart = ({ timeRange = "M", chartData, mode = "balance" }: BalanceChartProps) => {
  const isPnl = mode === "pnl";

  /* ─── Empty: no data at all ─── */
  if (!chartData || chartData.length === 0) {
    return <FlatState hasData={false} />;
  }

  /* ─── Flat: all values are the same (e.g. all 0) ─── */
  const allSame = chartData.every((d) => d.value === chartData[0].value);
  if (allSame) {
    return <FlatState hasData={chartData[0].value !== 0} />;
  }

  /* ─── Color logic ─── */
  const lastVal = chartData[chartData.length - 1]?.value ?? 0;
  const isPositive = isPnl ? lastVal >= 0 : true;
  const mainColor = isPositive ? TEAL : ROSE;
  const mainRgba = isPositive ? TEAL_RGBA : ROSE_RGBA;
  const refValue = isPnl ? 0 : (chartData[0]?.value ?? 0);

  /* ─── Tick label logic ─── */
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
            dot={<GlowDot color={mainColor} />}
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