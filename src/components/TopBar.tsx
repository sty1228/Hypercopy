"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UserMenu from "@/components/UserMenu";

/* ── Coin SVG ── */
const CoinIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="rgba(234,179,8,0.15)" stroke="#d97706" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="7" fill="none" stroke="#eab308" strokeWidth="0.8" opacity="0.4" />
    <path
      d="M12 7v1.5m0 7V17m-2.5-6.5c0-.83.67-1.5 1.5-1.5h2c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-2c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h2"
      stroke="#eab308"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ── Person SVG ── */
const PersonIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(45,212,191,1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/* ── Tooltip wrapper ── */
const IconWithTooltip = ({
  tooltip,
  children,
}: {
  tooltip: string;
  children: React.ReactNode;
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(timer);
  }, [show]);

  return (
    <div className="relative" onClick={() => setShow((p) => !p)}>
      {children}
      <div
        className="absolute top-full right-0 mt-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap text-[10px] font-medium pointer-events-none transition-all duration-200 z-50"
        style={{
          background: "rgba(15,20,25,0.95)",
          border: "1px solid rgba(45,212,191,0.3)",
          color: "rgba(255,255,255,0.9)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0)" : "translateY(-4px)",
        }}
      >
        {tooltip}
      </div>
    </div>
  );
};

/* ── Types ── */
export interface TopBarProps {
  /** Number of currently open trades */
  activeTrades?: number;
  /** User's leaderboard rank */
  rank?: number | string | null;
  /** Reward points to show next to coin */
  rewardsPoints?: number;
  /** Handler when coin icon is clicked (e.g. open rewards overlay) */
  onCoinClick?: () => void;
  /** Extra elements inserted before UserMenu on the right */
  extraRight?: React.ReactNode;
}

export default function TopBar({
  activeTrades = 0,
  rank,
  rewardsPoints = 0,
  onCoinClick,
  extraRight,
}: TopBarProps) {
  const router = useRouter();

  const handleCoinClick = () => {
    if (onCoinClick) onCoinClick();
    else router.push("/dashboard");
  };

  return (
    <div className="relative z-10 mt-2 mb-1.5 flex items-center justify-between px-3">
      {/* ═══ LEFT: Coin (Rewards points) ═══ */}
      <div className="flex items-center gap-1.5">
        <IconWithTooltip tooltip="Rewards Points">
          <div
            onClick={handleCoinClick}
            className="flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-all hover:bg-amber-400/10 active:scale-95"
            style={{
              background: "rgba(234,179,8,0.06)",
              border: "1px solid rgba(234,179,8,0.15)",
            }}
          >
            <CoinIcon />
            <span
              className="text-[10px] font-semibold"
              style={{ color: "#d4a017" }}
            >
              {rewardsPoints.toLocaleString()}
            </span>
          </div>
        </IconWithTooltip>
      </div>

      {/* ═══ RIGHT: Active Trades + Rank + extras + UserMenu ═══ */}
      <div className="flex items-center gap-1.5">
        {/* Active Trades */}
        <IconWithTooltip tooltip="Active Trades">
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-all hover:bg-white/10"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(45,212,191,1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            <span className="text-[10px] font-semibold text-teal-400 tabular-nums">
              {activeTrades}
            </span>
          </div>
        </IconWithTooltip>

        {/* Rank — person icon */}
        <IconWithTooltip tooltip="Your Rank">
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-all hover:bg-white/10"
            style={{
              background:
                "linear-gradient(135deg, rgba(45,212,191,0.15), rgba(45,212,191,0.08))",
              border: "1px solid rgba(45,212,191,0.25)",
              boxShadow: "0 0 15px rgba(45,212,191,0.2)",
            }}
          >
            <PersonIcon />
            <span className="text-[10px] font-semibold text-teal-400">
              #{rank ?? "—"}
            </span>
          </div>
        </IconWithTooltip>

        {extraRight}
        <UserMenu />
      </div>
    </div>
  );
}