"use client";

import {
  LineChart,
  Line,
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
        className="px-3 py-2 rounded-lg shadow-lg"
        style={{
          backgroundColor: "rgba(23, 42, 48, 0.95)",
          border: "1px solid rgba(80, 210, 193, 0.4)",
        }}
      >
        <p className="text-xs mb-1" style={{ color: "rgba(165, 176, 176, 1)" }}>
          {d.payload.label}
        </p>
        <p className="text-sm font-semibold" style={{ color: "rgba(80, 210, 193, 1)" }}>
          ${d.value?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
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
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          {chartData.length <= 12 && (
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={{ fill: "rgba(165, 176, 176, 0.5)", fontSize: 9, fontWeight: 400 }}
              dy={3}
            />
          )}

          <Tooltip
            content={(props) => <CustomTooltip {...props} />}
            cursor={{
              stroke: "rgba(80, 210, 193, 0.3)",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />

          <ReferenceLine
            y={refValue}
            stroke="rgba(135, 62, 62, 1)"
            strokeDasharray="8 4"
            strokeWidth={1}
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke="rgba(80, 210, 193, 1)"
            strokeWidth={1.5}
            dot={{
              fill: "rgba(199, 255, 248, 1)",
              r: 2,
              strokeWidth: 1,
              stroke: "rgba(80, 210, 193, 1)",
            }}
            activeDot={{
              r: 4,
              fill: "rgba(199, 255, 248, 1)",
              stroke: "rgba(80, 210, 193, 1)",
              strokeWidth: 2,
            }}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BalanceChart;