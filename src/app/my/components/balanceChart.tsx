"use client";

import {
  LineChart,
  Line,
  XAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  TooltipContentProps,
} from "recharts";

// Mock 数据
const data = [
  { month: "FEB", value: 14200 },
  { month: "MAR", value: 12500 },
  { month: "APR", value: 11200 },
  { month: "MAY", value: 13000 },
  { month: "JUN", value: 13800 },
  { month: "JUL", value: 10800 },
  { month: "AUG", value: 14800 },
  { month: "SEP", value: 14200 },
  { month: "OCT", value: 16500 },
];

// 自定义 Tooltip 组件
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div
        className="px-3 py-2 rounded-lg shadow-lg"
        style={{
          backgroundColor: "rgba(23, 42, 48, 0.95)",
          border: "1px solid rgba(80, 210, 193, 0.4)",
        }}
      >
        <p className="text-xs mb-1" style={{ color: "rgba(165, 176, 176, 1)" }}>
          {data.payload.month}
        </p>
        <p
          className="text-sm font-semibold"
          style={{ color: "rgba(80, 210, 193, 1)" }}
        >
          ${data.value?.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const BalanceChart = () => {
  return (
    <div className="w-full h-full chart-container">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .chart-container,
          .chart-container *,
          .chart-container svg,
          .recharts-wrapper,
          .recharts-wrapper *,
          .recharts-surface,
          .recharts-layer {
            outline: none !important;
          }
          .chart-container *:focus,
          .recharts-wrapper *:focus {
            outline: none !important;
          }
        `,
        }}
      />
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
        >
          {/* X轴 */}
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "rgba(165, 176, 176, 0.5)",
              fontSize: 11,
              fontWeight: 400,
            }}
            dy={3}
          />

          {/* Tooltip 提示框 */}
          <Tooltip
            content={(props) => <CustomTooltip {...props} />}
            cursor={{
              stroke: "rgba(80, 210, 193, 0.3)",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />

          {/* 红色虚线基准线 */}
          <ReferenceLine
            y={12500}
            stroke="rgba(135, 62, 62, 1)"
            strokeDasharray="8 4"
            strokeWidth={1}
          />

          {/* 折线 */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="rgba(80, 210, 193, 1)"
            strokeWidth={1}
            dot={{
              fill: "rgba(199, 255, 248, 1)",
              r: 2,
              strokeWidth: 1,
              stroke: "rgba(80, 210, 193, 1)",
            }}
            activeDot={{
              r: 3,
              fill: "rgba(199, 255, 248, 1)",
              stroke: "rgba(80, 210, 193, 1)",
              strokeWidth: 1,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BalanceChart;
