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
import { BalanceChartData } from "../page";

export type TimeRange = "D" | "W" | "M" | "YTD" | "ALL";

// Mock 数据 - Day (24小时，每小时一个数据点)
const dayData = [
  { label: "00:00", value: 16200 },
  { label: "04:00", value: 15800 },
  { label: "08:00", value: 16400 },
  { label: "12:00", value: 16100 },
  { label: "16:00", value: 16500 },
  { label: "20:00", value: 16300 },
  { label: "24:00", value: 16534 },
];

// Mock 数据 - Week (7天)
const weekData = [
  { label: "Mon", value: 15800 },
  { label: "Tue", value: 26000 },
  { label: "Wed", value: 12000 },
  { label: "Thu", value: 96486 },
  { label: "Fri", value: 23648 },
  { label: "Sat", value: 36554 },
  { label: "Sun", value: 15934 },
];

// Mock 数据 - Month (当前月份的数据，按周)
const monthData = [
  { label: "W1", value: 14200 },
  { label: "W2", value: 69345 },
  { label: "W3", value: 6982 },
  { label: "W4", value: 99755 },
  { label: "W5", value: 16985 },
];

// Mock 数据 - YTD (年初至今，按月)
const ytdData = [
  { label: "JAN", value: 12000 },
  { label: "FEB", value: 14200 },
  { label: "MAR", value: 12500 },
  { label: "APR", value: 11200 },
  { label: "MAY", value: 13000 },
  { label: "JUN", value: 13800 },
  { label: "JUL", value: 10800 },
  { label: "AUG", value: 14800 },
  { label: "SEP", value: 14200 },
  { label: "OCT", value: 16534 },
];

// Mock 数据 - All (所有历史数据，按月)
const allData = [
  { label: "FEB", value: 14200 },
  { label: "MAR", value: 12500 },
  { label: "APR", value: 11200 },
  { label: "MAY", value: 13000 },
  { label: "JUN", value: 13800 },
  { label: "JUL", value: 10800 },
  { label: "AUG", value: 14800 },
  { label: "SEP", value: 14200 },
  { label: "OCT", value: 16500 },
];

// 根据时间范围获取对应的数据
const getDataByTimeRange = (timeRange: TimeRange) => {
  switch (timeRange) {
    case "D":
      return dayData;
    case "W":
      return weekData;
    case "M":
      return monthData;
    case "YTD":
      return ytdData;
    case "ALL":
      return allData;
    default:
      return monthData;
  }
};

// 根据时间范围获取基准线值
const getReferenceLineValue = (timeRange: TimeRange) => {
  const data = getDataByTimeRange(timeRange);
  const values = data.map((d) => d.value);
  return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
};

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
          {data.payload.label}
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

interface BalanceChartProps {
  timeRange?: TimeRange;
  chartData: BalanceChartData[];
}

const BalanceChart = ({ timeRange = "M", chartData }: BalanceChartProps) => {
  console.log(chartData);
  const referenceLineValue = getReferenceLineValue(timeRange);
  console.log(referenceLineValue);
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
          data={chartData}
          margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
        >
          {/* X轴 */}
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            interval={0}
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
            y={referenceLineValue}
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
