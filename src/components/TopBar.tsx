"use client";

import { useState, useEffect, useRef } from "react";
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

/* ── Tooltip wrapper ──
   Desktop: show on mouseEnter, hide on mouseLeave
   Mobile: show on tap for 2s
*/
const Tip = ({
  text,
  align = "right",
  children,
}: {
  text: string;
  align?: "left" | "right" | "center";
  children: React.ReactNode;
}) => {
  const [show, setShow] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  };

  // Desktop hover
  const onEnter = () => {
    clear();
    setShow(true);
  };
  const onLeave = () => {
    clear();
    setShow(false);
  };

  // Mobile tap
  const onTap = () => {
    clear();
    setShow(true);
    hideTimer.current = setTimeout(() => setShow(false), 2000);
  };

  useEffect(() => () => clear(), []);

  const alignClass =
    align === "left"
      ? "left-0"
      : align === "center"
      ? "left-1/2 -translate-x-1/2"
      : "right-0";

  return (
    <div
      className="relative"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onTouchStart={onTap}
    >
      {children}
      <div
        className={`absolute top-full ${alignClass} mt-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap text-[10px] font-medium pointer-events-none transition-all duration-200 z-[999]`}
        style={{
          background: "rgba(15,20,25,0.95)",
          border: "1px solid rgba(45,212,191,0.3)",
          color: "rgba(255,255,255,0.9)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0)" : "translateY(-4px)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

/* ── Types ── */
export interface TopBarProps {
  activeTrades?: number;
  rank?: number | string | null;
  rewardsPoints?: number;
  onCoinClick?: () => void;
  /**
   * Set to "win" or "loss" momentarily when a trade closes.
   * The dot will flash green or red then revert to yellow.
   */
  flashState?: "win" | "loss" | null;
  extraRight?: React.ReactNode;
}

export default function TopBar({
  activeTrades = 0,
  rank,
  rewardsPoints = 0,
  onCoinClick,
  flashState = null,
  extraRight,
}: TopBarProps) {
  const router = useRouter();
  const [flash, setFlash] = useState<"win" | "loss" | null>(null);
  const prevCount = useRef(activeTrades);

  /* Flash on explicit prop */
  useEffect(() => {
    if (flashState) {
      setFlash(flashState);
      const t = setTimeout(() => setFlash(null), 1500);
      return () => clearTimeout(t);
    }
  }, [flashState]);

  /* Auto-detect trade close (count drops) */
  useEffect(() => {
    if (prevCount.current > activeTrades && activeTrades >= 0 && !flashState) {
      setFlash("win");
      const t = setTimeout(() => setFlash(null), 1500);
      prevCount.current = activeTrades;
      return () => clearTimeout(t);
    }
    prevCount.current = activeTrades;
  }, [activeTrades, flashState]);

  const handleCoinClick = () => {
    if (onCoinClick) onCoinClick();
    else router.push("/dashboard");
  };

  const dotColor =
    flash === "win" ? "#22c55e" : flash === "loss" ? "#ef4444" : "#eab308";

  return (
    <>
      <style jsx global>{`
        @keyframes topbarPulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.5; }
        }
        @keyframes topbarFlashPing {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(3.5); opacity: 0; }
        }
      `}</style>

      <div className="relative z-10 mt-2 mb-1.5 flex items-center justify-between px-3">
        {/* ═══ LEFT: Coin ═══ */}
        <div className="flex items-center gap-1.5">
          <Tip text="Rewards Points" align="left">
            <div
              onClick={handleCoinClick}
              className="flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-all hover:bg-amber-400/10 active:scale-95"
              style={{
                background: "rgba(234,179,8,0.06)",
                border: "1px solid rgba(234,179,8,0.15)",
              }}
            >
              <CoinIcon />
              <span className="text-[10px] font-semibold" style={{ color: "#d4a017" }}>
                {rewardsPoints.toLocaleString()}
              </span>
            </div>
          </Tip>
        </div>

        {/* ═══ RIGHT ═══ */}
        <div className="flex items-center gap-1.5">
          {/* Active Trades — yellow dot + number */}
          <Tip text="Active Trades">
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition-all hover:bg-white/10"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {/* Dot container */}
              <div className="relative flex items-center justify-center" style={{ width: 10, height: 10 }}>
                {/* Main pulsing dot */}
                <div
                  className="w-[7px] h-[7px] rounded-full"
                  style={{
                    background: dotColor,
                    boxShadow: `0 0 4px ${dotColor}, 0 0 8px ${dotColor}50`,
                    animation: flash
                      ? "none"
                      : "topbarPulseDot 2s ease-in-out infinite",
                    transition: "background 0.3s ease, box-shadow 0.3s ease",
                  }}
                />
                {/* Flash ping ring on trade close */}
                {flash && (
                  <div
                    className="absolute w-[7px] h-[7px] rounded-full"
                    style={{
                      background: dotColor,
                      animation: "topbarFlashPing 0.8s ease-out forwards",
                    }}
                  />
                )}
              </div>
              <span className="text-[10px] font-semibold text-teal-400 tabular-nums">
                {activeTrades}
              </span>
            </div>
          </Tip>

          {/* Rank — person icon */}
          <Tip text="Your Rank">
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-all hover:bg-white/10"
              style={{
                background: "linear-gradient(135deg, rgba(45,212,191,0.15), rgba(45,212,191,0.08))",
                border: "1px solid rgba(45,212,191,0.25)",
                boxShadow: "0 0 15px rgba(45,212,191,0.2)",
              }}
            >
              <PersonIcon />
              <span className="text-[10px] font-semibold text-teal-400">
                #{rank ?? "—"}
              </span>
            </div>
          </Tip>

          {extraRight}
          <UserMenu />
        </div>
      </div>
    </>
  );
}