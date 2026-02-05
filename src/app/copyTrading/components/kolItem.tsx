"use client";

import { LeaderboardItem } from "@/service";
import { useRouter } from "next/navigation";
import BigNumber from "bignumber.js";

export const randomColor = () => {
  const colors = [
    "linear-gradient(135deg, #06b6d4, #3b82f6)",
    "linear-gradient(135deg, #10b981, #14b8a6)",
    "linear-gradient(135deg, #a855f7, #ec4899)",
    "linear-gradient(135deg, #f59e0b, #f97316)",
    "linear-gradient(135deg, #f43f5e, #ef4444)",
    "linear-gradient(135deg, #6366f1, #8b5cf6)",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export default function KolItem({
  data,
  onClick,
  index = 0,
}: {
  data: LeaderboardItem;
  onClick: () => void;
  index?: number;
}) {
  const router = useRouter();
  const rank = data.rank || index + 1;
  const profit = data.results_pct || 0;
  const isPositive = profit >= 0;

  const getRankStyle = () => {
    if (rank === 1) return { bg: "linear-gradient(135deg, #ffd700 0%, #ffa500 100%)", shadow: "0 0 12px rgba(255,215,0,0.6)", animation: "pulseGold 2s ease-in-out infinite", border: "2px solid #ffd700" };
    if (rank === 2) return { bg: "linear-gradient(135deg, #e8e8e8 0%, #a8a8a8 100%)", shadow: "0 0 10px rgba(192,192,192,0.5)", animation: "pulseSilver 2s ease-in-out infinite", border: "2px solid #c0c0c0" };
    if (rank === 3) return { bg: "linear-gradient(135deg, #cd7f32 0%, #a0522d 100%)", shadow: "0 0 10px rgba(205,127,50,0.5)", animation: "pulseBronze 2s ease-in-out infinite", border: "2px solid #cd7f32" };
    return { bg: "rgba(255,255,255,0.05)", shadow: "none", animation: "none", border: "1px solid rgba(255,255,255,0.1)" };
  };

  const rankStyle = getRankStyle();

  const handleProfileClick = () => {
    router.push(`/profile?handle=${data.x_handle}`);
  };

  const handleSignalsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <div
      onClick={handleProfileClick}
      className="relative rounded-2xl p-3 mb-2 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
      style={{
        background: "linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(45,212,191,0.01) 100%)",
        border: "1px solid rgba(45,212,191,0.2)",
        boxShadow: "0 0 30px rgba(45,212,191,0.1), inset 0 0 40px rgba(45,212,191,0.03)",
        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
      }}
    >
      {/* Green glow effect */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: "radial-gradient(ellipse at top left, rgba(45,212,191,0.15) 0%, transparent 60%)" }} />

      <div className="relative">
        {/* Top Row */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            {/* Rank Badge */}
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: rankStyle.bg, boxShadow: rankStyle.shadow, color: rank <= 3 ? "#000" : "#6b7280", border: rank <= 3 ? "none" : rankStyle.border }}
            >
              {rank}
            </div>

            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm text-white"
              style={{ background: data.avatarColor || "linear-gradient(135deg, #06b6d4, #3b82f6)", border: rank <= 3 ? rankStyle.border : "none", animation: rank <= 3 ? rankStyle.animation : "none" }}
            >
              {data.x_handle?.[0]?.toUpperCase() || "?"}
            </div>

            {/* Name & Badges */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium">{data.x_handle}</span>
                {data.streak && (data.streak as number) > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold" style={{ background: "rgba(251,146,60,0.18)", border: "1px solid rgba(251,146,60,0.3)", color: "#fb923c" }}>
                    🔥{data.streak}
                  </span>
                )}
                {data.profit_grade && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(45,212,191,0.18)", border: "1px solid rgba(45,212,191,0.3)", color: "#2dd4bf" }}>
                    {data.profit_grade}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-gray-500">@{data.x_handle}</div>
            </div>
          </div>

          {/* Profit */}
          <div className="text-right">
            <div className={`text-sm font-bold ${isPositive ? "text-teal-400" : "text-rose-400"}`} style={{ textShadow: isPositive ? "0 0 10px rgba(45,212,191,0.3)" : "0 0 10px rgba(251,113,133,0.3)" }}>
              {isPositive ? "+" : ""}${Math.abs(profit * 1000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wide">Last Tweet</div>
              <div className="text-[11px] text-gray-300 font-medium">{data.how_long_ago || "-"}</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wide">Points</div>
              <div className="text-[11px] text-white font-semibold">{data.points ? new BigNumber(data.points).decimalPlaces(0).toNumber() : "-"}</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wide">Avg Return</div>
              <div className="text-[11px] text-teal-400 font-medium">{data.avg_return ? `+${new BigNumber(data.avg_return as number).decimalPlaces(1).toNumber()}%` : "-"}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[9px] text-gray-500 uppercase tracking-wide">Result</div>
              <div className={`text-[11px] font-semibold ${isPositive ? "text-teal-400" : "text-rose-400"}`}>
                {isPositive ? "+" : ""}{new BigNumber(profit).decimalPlaces(1).toNumber()}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-gray-500 uppercase tracking-wide">Copiers</div>
              <div className="text-[11px] text-white font-medium">{data.copiers || "-"}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-gray-500 uppercase tracking-wide">Win Rate</div>
              <div className="text-[11px] text-white font-medium">{data.win_rate ? `${new BigNumber(data.win_rate).decimalPlaces(1).toNumber()}%` : "-"}</div>
            </div>
          </div>
        </div>

        {/* Footer: signals count + Profile / Signals links */}
        <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-gray-500 flex items-center gap-1">
            <span className="text-teal-400">↑</span>
            {data.total_signals || data.total_tweets || 0} signals
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); handleProfileClick(); }}
              className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all hover:bg-white/10 flex items-center gap-1 cursor-pointer"
              style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Profile
            </button>
            <button
              onClick={handleSignalsClick}
              className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all hover:bg-teal-400/20 flex items-center gap-1 cursor-pointer"
              style={{ color: "rgba(45,212,191,0.9)", background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)" }}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Signals
              <svg className="w-2.5 h-2.5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}