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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0];
    return (
      <div
        className="px-3 py-2 rounded-xl shadow-lg backdrop-blur-md"
        style={{
          background: "linear-gradient(135deg, rgba(23,42,48,0.95) 0%, rgba(15,30,35,0.95) 100%)",
          border: "1px solid rgba(80,210,193,0.35)",
          boxShadow: "0 4px 20px rgba(45,212,191,0.15), 0 0 10px rgba(45,212,191,0.08)",
        }}
      >
        <p className="text-[10px] mb-0.5" style={{ color: "rgba(165,176,176,0.8)" }}>
          {d.payload.label}
        </p>
        <p className="text-sm font-bold tracking-tight" style={{ color: "#2dd4bf", textShadow: "0 0 8px rgba(45,212,191,0.4)" }}>
          ${d.value?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

// 自定义发光圆点
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GlowDot = (props: any) => {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return (
    <g>
      {/* 外层 glow */}
      <circle cx={cx} cy={cy} r={6} fill="rgba(45,212,191,0.12)" />
      {/* 中层 glow */}
      <circle cx={cx} cy={cy} r={3.5} fill="rgba(45,212,191,0.25)" />
      {/* 实心点 */}
      <circle cx={cx} cy={cy} r={2} fill="#c7fff8" stroke="#2dd4bf" strokeWidth={0.8} />
    </g>
  );
};

// 自定义 active 发光圆点
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ActiveGlowDot = (props: any) => {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return (
    <g>
      {/* 大 glow 光晕 */}
      <circle cx={cx} cy={cy} r={12} fill="rgba(45,212,191,0.08)" />
      <circle cx={cx} cy={cy} r={8} fill="rgba(45,212,191,0.15)" />
      <circle cx={cx} cy={cy} r={5} fill="rgba(45,212,191,0.25)" />
      {/* 实心点 */}
      <circle cx={cx} cy={cy} r={3} fill="#c7fff8" stroke="#2dd4bf" strokeWidth={1.5} />
    </g>
  );
};

interface BalanceChartProps {
  timeRange?: TimeRange;
  chartData: BalanceChartData[];
}

const BalanceChart = ({ timeRange = "M", chartData }: BalanceChartProps) => {
  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <svg width="100%" height="100%" viewBox="0 0 100 80" preserveAspectRatio="none">
          <defs>
            <linearGradient id="emptyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1="40" x2="100" y2="40" stroke="#2dd4bf" strokeWidth="0.5" vectorEffect="non-scaling-stroke" opacity="0.3" />
          <rect x="0" y="40" width="100" height="40" fill="url(#emptyGrad)" />
          <circle cx="0" cy="40" r="1.5" fill="#2dd4bf" opacity="0.4" />
          <circle cx="100" cy="40" r="1.5" fill="#2dd4bf" opacity="0.4" />
        </svg>
      </div>
    );
  }

  // Reference line = first data point (starting balance)
  const refValue = chartData[0]?.value ?? 0;

  // 判断盈亏方向（最后的值 vs 第一个值）
  const lastValue = chartData[chartData.length - 1]?.value ?? 0;
  const isPositive = lastValue >= refValue;

  // 计算要显示的刻度：最多 5 个，均匀分布
  const tickIndices: number[] = [];
  const len = chartData.length;
  if (len <= 5) {
    for (let i = 0; i < len; i++) tickIndices.push(i);
  } else {
    for (let i = 0; i < 5; i++) {
      tickIndices.push(Math.round((i * (len - 1)) / 4));
    }
  }

  // 去重标签
  const visibleLabels = new Set<number>();
  const seenLabels = new Set<string>();
  for (const idx of tickIndices) {
    const lbl = chartData[idx]?.label || "";
    if (!seenLabels.has(lbl)) {
      seenLabels.add(lbl);
      visibleLabels.add(idx);
    }
  }

  const lineColor = isPositive ? "#2dd4bf" : "#f87171";
  const glowColor = isPositive ? "rgba(45,212,191," : "rgba(248,113,113,";

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
            {/* 线条 glow 滤镜 */}
            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor={lineColor} floodOpacity="0.4" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* 面积填充渐变 */}
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.2} />
              <stop offset="40%" stopColor={lineColor} stopOpacity={0.08} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={({ x, y, index, payload }: { x: number; y: number; index: number; payload: { value: string } }) => {
              if (!visibleLabels.has(index)) return <g />;
              return (
                <text
                  x={x}
                  y={(y as number) + 10}
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
            content={(props) => <CustomTooltip {...props} />}
            cursor={{
              stroke: `${glowColor}0.25)`,
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />

          <ReferenceLine
            y={refValue}
            stroke="rgba(135,62,62,0.8)"
            strokeDasharray="8 4"
            strokeWidth={1}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            fill="url(#areaGradient)"
            filter="url(#lineGlow)"
            dot={<GlowDot />}
            activeDot={<ActiveGlowDot />}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BalanceChart;