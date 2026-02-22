// ================================================================
// FILE: dashboard/components/KOLRewardsCard.tsx
// ================================================================

"use client";

import { Sparkles, ChevronRight, Zap, Star } from "lucide-react";

const PHASES = {
  beta: {
    label: "BETA",
    accent: "#2dd4bf",
    multiplier: "2-5x",
    revShare: "50%",
    refCommission: "75%",
    tagline: "EARLY ACCESS",
  },
  season1: {
    label: "S1",
    accent: "#c4a35a",
    multiplier: "1-2x",
    revShare: "25%",
    refCommission: "30%",
    tagline: "MAIN EVENT",
  },
} as const;

type Phase = keyof typeof PHASES;

interface KOLRewardsCardProps {
  onOpen: () => void;
  phase?: Phase;
}

export function KOLRewardsCard({ onOpen, phase = "beta" }: KOLRewardsCardProps) {
  const p = PHASES[phase];

  return (
    <div
      onClick={onOpen}
      className="rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${p.accent}0a 0%, ${p.accent}03 100%)`,
        border: `1px solid ${p.accent}20`,
      }}
    >
      {/* top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${p.accent}50, transparent)`,
        }}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${p.accent}12` }}
          >
            <Sparkles size={14} color={p.accent} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                className="text-[10px] font-bold"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                KOL Rewards
              </span>
              <span
                className="text-[7px] font-bold tracking-wider rounded px-1 py-px"
                style={{
                  color: p.accent,
                  background: `${p.accent}15`,
                  border: `1px solid ${p.accent}25`,
                }}
              >
                {p.tagline}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5 text-[9px] text-white/40">
                <Zap size={8} color={p.accent} />
                <span style={{ color: p.accent }} className="font-semibold">
                  {p.multiplier}
                </span>{" "}
                mult
              </span>
              <span className="text-white/10">·</span>
              <span className="flex items-center gap-0.5 text-[9px] text-white/40">
                <Star size={8} color={p.accent} />
                <span style={{ color: p.accent }} className="font-semibold">
                  {p.revShare}
                </span>{" "}
                rev share
              </span>
            </div>
          </div>
        </div>

        <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
      </div>
    </div>
  );
}