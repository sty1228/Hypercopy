
"use client";

import { useEffect, useState } from "react";
import { useRewards, type RewardsTrigger } from "@/providers/RewardsContext";

const BANNER_CONTENT: Record<string, { title: string; desc: string }> = {
  first_time_copied: {
    title: "Someone copied your trade",
    desc: "You earned 30% of their trade points as a signal provider.",
  },
  weekly_summary: {
    title: "Weekly points summary ready",
    desc: "See how much you earned this week.",
  },
  smart_follower_milestone: {
    title: "Smart Follower milestone reached",
    desc: "Your boost multiplier just increased.",
  },
  phase_transition: {
    title: "Season 1 is live",
    desc: "Your Beta points carried over. See the new reward structure.",
  },
};

export default function RewardsBanner() {
  const { showBanner, bannerTrigger, dismissBanner, viewRewardsFromPrompt } = useRewards();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (showBanner) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [showBanner]);

  if (!showBanner || !bannerTrigger) return null;

  const content = BANNER_CONTENT[bannerTrigger] || {
    title: "Rewards update",
    desc: "You have a new rewards update.",
  };

  return (
    <div
      className={`relative z-20 mx-3 mt-2 mb-1 rounded-xl overflow-hidden transition-all duration-400 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
      style={{
        background: "linear-gradient(135deg, rgba(45,212,191,0.08) 0%, rgba(45,212,191,0.02) 100%)",
        border: "1px solid rgba(45,212,191,0.2)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2), 0 0 15px rgba(45,212,191,0.06)",
      }}
    >
      <div className="flex items-center justify-between px-3.5 py-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Icon */}
          <div
            className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
            style={{
              background: "rgba(45,212,191,0.12)",
              border: "1px solid rgba(45,212,191,0.2)",
            }}
          >
            <svg className="w-4 h-4 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-white truncate">{content.title}</p>
            <p className="text-[10px] text-gray-400 truncate">{content.desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <button
            onClick={viewRewardsFromPrompt}
            className="text-[10px] font-semibold text-teal-400 px-3 py-1.5 rounded-lg transition-all hover:bg-teal-400/10 cursor-pointer whitespace-nowrap"
            style={{ border: "1px solid rgba(45,212,191,0.25)" }}
          >
            Learn More
          </button>
          <button
            onClick={dismissBanner}
            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors cursor-pointer rounded-md hover:bg-white/5"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}