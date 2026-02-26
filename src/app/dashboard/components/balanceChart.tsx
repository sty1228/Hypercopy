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

/* ─── Color constants ─── */
const TEAL = "#2dd4bf";
const ROSE = "#fb7185";
const TEAL_RGBA = "rgba(45,212,191,";
const ROSE_RGBA = "rgba(251,113,133,";

/* ─── Tooltip ─── */
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
          boxShadow: `0 4px 20px ${color === ROSE ? "rgba(251,113,133,0.15)" : "rgba(45,212,191,0.15)"}, 0 0 10px ${color === ROSE ? "rgba(251,113,133,0.08)" : "rgba(45,212,191,0.08)"}`,
        }}
      >
        <p className="text-[10px] mb-0.5" style={{ color: "rgba(165,176,176,0.8)" }}>
          {d.payload.label}
        </p>
        <p className="text-sm font-bold tracking-tight" style={{ color, textShadow: `0 0 8px ${color === ROSE ? "rgba(251,113,133,0.4)" : "rgba(45,212,191,0.4)"}` }}>
          {prefix}{display}
        </p>
      </div>
    );
  }
  return null;
};

/* ─── Glow dots ─── */
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

/* ─── Main component ─── */
interface BalanceChartProps {
  timeRange?: TimeRange;
  chartData: BalanceChartData[];
  /** "balance" = classic account value chart; "pnl" = P&L with zero baseline */
  mode?: "balance" | "pnl";
}

const BalanceChart = ({ timeRange = "M", chartData, mode = "balance" }: BalanceChartProps) => {
  const isPnl = mode === "pnl";

  /* ─── Empty state ─── */
  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <svg width="100%" height="100%" viewBox="0 0 100 80" preserveAspectRatio="none">
          <defs>
            <linearGradient id="emptyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TEAL} stopOpacity="0.06" />
              <stop offset="100%" stopColor={TEAL} stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1="40" x2="100" y2="40" stroke={TEAL} strokeWidth="0.5" vectorEffect="non-scaling-stroke" opacity="0.3" />
          <rect x="0" y="40" width="100" height="40" fill="url(#emptyGrad)" />
          <circle cx="0" cy="40" r="1.5" fill={TEAL} opacity="0.4" />
          <circle cx="100" cy="40" r="1.5" fill={TEAL} opacity="0.4" />
        </svg>
      </div>
    );
  }

  /* ─── Color logic ─── */
  // P&L mode: color based on last value (positive = teal, negative = rose)
  // Balance mode: always teal
  const lastVal = chartData[chartData.length - 1]?.value ?? 0;
  const isPositive = isPnl ? lastVal >= 0 : true;
  const mainColor = isPositive ? TEAL : ROSE;
  const mainRgba = isPositive ? TEAL_RGBA : ROSE_RGBA;

  // Reference line: y=0 for P&L, y=first value for balance
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

  /* ─── Unique IDs to avoid SVG filter/gradient collisions ─── */
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
              <stop offset="0%" stopColor={mainColor} stopOpacity={0.2} />
              <stop offset="40%" stopColor={mainColor} stopOpacity={0.08} />
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
                <text
                  x={Number(x)}
                  y={Number(y) + 10}
                  textAnchor="middle"
                  fill="rgba(165,176,176,0.5)"
                  fontSize={9}
                  fontWeight={400}
                >
                  {payload.value}
                </text>
              );
            }}
          />

          <Tooltip
            content={(props) => <CustomTooltip {...props} mode={mode} color={mainColor} />}
            cursor={{
              stroke: `${mainRgba}0.25)`,
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />

          {/* Reference line: y=0 for P&L, y=first balance for balance mode */}
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