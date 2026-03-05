"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import UserMenu from "@/components/UserMenu";

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

const PersonIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(45,212,191,1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export interface TopBarProps {
  activeTrades?: number;
  rank?: number | string | null;
  rewardsPoints?: number;
  showBack?: boolean;
  onBackClick?: () => void;
  onCoinClick?: () => void;
  flashState?: "win" | "loss" | null;
  extraRight?: React.ReactNode;
}

export default function TopBar({
  activeTrades = 0,
  rank,
  rewardsPoints = 0,
  showBack = true,
  onBackClick,
  onCoinClick,
  flashState = null,
  extraRight,
}: TopBarProps) {
  const router = useRouter();
  const [flash, setFlash] = useState<"win" | "loss" | null>(null);
  const prevCount = useRef(activeTrades);

  useEffect(() => {
    if (flashState) {
      setFlash(flashState);
      const t = setTimeout(() => setFlash(null), 1500);
      return () => clearTimeout(t);
    }
  }, [flashState]);

  useEffect(() => {
    if (prevCount.current > activeTrades && activeTrades >= 0) {
      if (!flashState) {
        setFlash("win");
        const t = setTimeout(() => setFlash(null), 1500);
        return () => clearTimeout(t);
      }
    }
    prevCount.current = activeTrades;
  }, [activeTrades, flashState]);

  const handleBack = () => {
    if (onBackClick) onBackClick();
    else router.back();
  };

  const handleCoinClick = () => {
    if (onCoinClick) onCoinClick();
    else router.push("/dashboard");
  };

  const dotColor =
    flash === "win" ? "#22c55e" : flash === "loss" ? "#ef4444" : "#eab308";

  return (
    <>
      <style jsx global>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 4px var(--dot-color), 0 0 8px color-mix(in srgb, var(--dot-color) 40%, transparent); }
          50% { opacity: 0.55; transform: scale(0.8); box-shadow: 0 0 2px var(--dot-color); }
        }
        @keyframes flashPing {
          0% { transform: scale(1); opacity: 0.75; }
          100% { transform: scale(3); opacity: 0; }
        }
      `}</style>

      <div className="relative z-10 mt-2 mb-1.5 flex items-center justify-between px-3">
        <div className="flex items-center gap-1.5">
          {showBack && (
            <div
              onClick={handleBack}
              className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-all hover:bg-white/10 active:scale-95"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <ChevronLeft size={14} className="text-gray-400" />
            </div>
          )}

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
        </div>

        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition-all hover:bg-white/10"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div className="relative flex items-center justify-center" style={{ width: 12, height: 12 }}>
              <div
                className="w-2 h-2 rounded-full"
                style={
                  {
                    "--dot-color": dotColor,
                    background: dotColor,
                    boxShadow: `0 0 4px ${dotColor}, 0 0 8px ${dotColor}60`,
                    animation: !flash ? "pulseDot 2s ease-in-out infinite" : "none",
                  } as React.CSSProperties
                }
              />
              {flash && (
                <div
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: dotColor,
                    animation: "flashPing 0.8s ease-out forwards",
                  }}
                />
              )}
            </div>
            <span className="text-[10px] font-semibold text-teal-400 tabular-nums">
              {activeTrades}
            </span>
          </div>

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

          {extraRight}
          <UserMenu />
        </div>
      </div>
    </>
  );
}