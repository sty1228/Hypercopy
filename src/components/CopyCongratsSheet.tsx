"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRewards } from "@/providers/RewardsContext";

export default function CopyCongratsSheet() {
  const { showCongrats, congratsTrigger, dismissCongrats, viewRewardsFromPrompt } = useRewards();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure we only use portal after hydration (SSR safety)
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (showCongrats) {
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [showCongrats]);

  if (!showCongrats || !mounted) return null;

  const isFirstCopy = congratsTrigger === "first_copy_trade";

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center"
      style={{
        background: visible ? "rgba(0,0,0,0.6)" : "transparent",
        transition: "background 0.3s ease",
      }}
      onClick={dismissCongrats}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s ease-out",
          background: "linear-gradient(180deg, #0f1419 0%, #0a0f14 100%)",
          border: "1px solid rgba(45,212,191,0.2)",
          borderBottom: "none",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.5), 0 0 30px rgba(45,212,191,0.08)",
          maxWidth: "393px",
          width: "100%",
        }}
        className="rounded-t-2xl px-6 pt-6 pb-8 relative overflow-hidden"
      >
        {/* Glow accent */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[2px] rounded-full"
          style={{ background: "linear-gradient(90deg, transparent, rgba(45,212,191,0.6), transparent)" }}
        />

        {/* Close handle */}
        <div className="flex justify-center mb-5">
          <div className="w-8 h-1 rounded-full bg-white/20" />
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(45,212,191,0.15) 0%, rgba(45,212,191,0.05) 100%)",
              border: "1px solid rgba(45,212,191,0.25)",
              boxShadow: "0 0 20px rgba(45,212,191,0.15)",
            }}
          >
            <svg className="w-7 h-7 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3
          className="text-center text-base font-semibold text-white mb-2"
          style={{ textShadow: "0 0 20px rgba(45,212,191,0.2)" }}
        >
          {isFirstCopy ? "First Copy Trade Points Earned" : "Points Earned"}
        </h3>

        {/* Description */}
        <p className="text-center text-xs text-gray-400 leading-relaxed mb-6 px-2">
          {isFirstCopy
            ? "You earn 70% of trade points as a copier. The KOL you copied earns the other 30%. The more you trade, the more you earn."
            : "Your activity just earned you points in the Rewards Program."}
        </p>

        {/* CTA */}
        <button
          onClick={viewRewardsFromPrompt}
          className="w-full py-3 rounded-xl text-sm font-semibold text-[#0a0f14] cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)",
            boxShadow: "0 0 25px rgba(45,212,191,0.4), 0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          View Rewards Program
        </button>

        {/* Dismiss */}
        <button
          onClick={dismissCongrats}
          className="w-full mt-3 py-2.5 text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );

  // Portal: render to document.body, escaping all transform/scroll/overflow issues
  return createPortal(content, document.body);
}