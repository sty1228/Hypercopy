
"use client";

import { Gift, ArrowRight } from "lucide-react";

interface KOLRewardsCardProps {
  onOpen: () => void;
  phase?: "beta" | "season1";
}

const PHASE_META = {
  beta: {
    label: "BETA PHASE",
    accent: "#00F0FF",
    sub: "2-5x points multiplier · 50% rev share",
  },
  season1: {
    label: "SEASON 1",
    accent: "#F5A623",
    sub: "Up to 2x multiplier · 40-50% airdrop pool",
  },
};

export function KOLRewardsCard({ onOpen, phase = "beta" }: KOLRewardsCardProps) {
  const m = PHASE_META[phase];

  return (
    <div
      onClick={onOpen}
      className="relative overflow-hidden rounded-xl px-3.5 py-3 flex items-center gap-3 cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background: `linear-gradient(135deg, ${m.accent}12 0%, ${m.accent}04 100%)`,
        border: `1px solid ${m.accent}25`,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${m.accent}80, transparent)` }}
      />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, ${m.accent}22, ${m.accent}08)`,
          border: `1px solid ${m.accent}25`,
        }}
      >
        <Gift size={20} color={m.accent} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-bold text-white/90">KOL Rewards</span>
          <span
            className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded"
            style={{
              color: m.accent,
              background: `${m.accent}15`,
              border: `1px solid ${m.accent}25`,
            }}
          >
            {m.label}
          </span>
        </div>
        <p className="text-[11px] text-gray-500 truncate">{m.sub}</p>
      </div>
      <ArrowRight size={16} className="text-white/25 flex-shrink-0" />
    </div>
  );
}
