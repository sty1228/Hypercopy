"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

// ── Trigger types (for analytics / future backend logging) ──
export type RewardsTrigger =
  | "first_copy_trade"      // §8 Primary: after first successful copy trade
  | "first_time_copied"     // §8 Secondary: first time another user copies you
  | "weekly_summary"        // §8 Tertiary: weekly points notification
  | "smart_follower_milestone" // §8 Tertiary: SF threshold crossed (25/50/100/250/500)
  | "phase_transition"      // §8 Tertiary: Beta → Season 1 transition
  | "referral_share";       // §8 Tertiary: before sharing referral link

interface RewardsContextType {
  // State
  showRewards: boolean;
  lastTrigger: RewardsTrigger | null;

  // Direct open/close (for edge cases)
  openRewards: (trigger?: RewardsTrigger) => void;
  closeRewards: () => void;

  // Event-based triggers (call these from other components)
  triggerFirstCopyTrade: () => void;
  triggerFirstTimeCopied: () => void;
  triggerWeeklySummary: () => void;
  triggerSmartFollowerMilestone: (count: number) => void;
  triggerPhaseTransition: () => void;
  triggerReferralShare: () => void;
}

const RewardsContext = createContext<RewardsContextType>({
  showRewards: false,
  lastTrigger: null,
  openRewards: () => {},
  closeRewards: () => {},
  triggerFirstCopyTrade: () => {},
  triggerFirstTimeCopied: () => {},
  triggerWeeklySummary: () => {},
  triggerSmartFollowerMilestone: () => {},
  triggerPhaseTransition: () => {},
  triggerReferralShare: () => {},
});

// ── localStorage keys for one-time triggers ──
const KEYS = {
  firstCopyTrade: "hc_rewards_first_copy_trade_shown",
  firstTimeCopied: "hc_rewards_first_time_copied_shown",
  phaseTransitionSeen: "hc_rewards_phase_transition_seen",
} as const;

// ── Helper: check if a one-time trigger has already fired ──
function hasShown(key: string): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(key) === "1";
}

function markShown(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, "1");
}

// ── Provider ──
export function RewardsProvider({ children }: { children: ReactNode }) {
  const [showRewards, setShowRewards] = useState(false);
  const [lastTrigger, setLastTrigger] = useState<RewardsTrigger | null>(null);

  const openRewards = useCallback((trigger?: RewardsTrigger) => {
    if (trigger) setLastTrigger(trigger);
    setShowRewards(true);
  }, []);

  const closeRewards = useCallback(() => {
    setShowRewards(false);
  }, []);

  // ── §8 Primary: After first successful copy trade ──
  // "The single highest-conversion moment"
  // Call this after a copy/counter trade executes successfully.
  // Only fires ONCE per user (persisted in localStorage).
  const triggerFirstCopyTrade = useCallback(() => {
    if (hasShown(KEYS.firstCopyTrade)) return;
    markShown(KEYS.firstCopyTrade);
    // Small delay so user sees the trade confirmation first
    setTimeout(() => openRewards("first_copy_trade"), 1500);
  }, [openRewards]);

  // ── §8 Secondary: First time being copied ──
  // "Someone just copied your trade — you earned 30% of their trade points"
  // Only fires ONCE per user.
  const triggerFirstTimeCopied = useCallback(() => {
    if (hasShown(KEYS.firstTimeCopied)) return;
    markShown(KEYS.firstTimeCopied);
    setTimeout(() => openRewards("first_time_copied"), 1000);
  }, [openRewards]);

  // ── §8 Tertiary: Weekly points summary ──
  // Triggered by push notification or polling. Can fire multiple times.
  const triggerWeeklySummary = useCallback(() => {
    openRewards("weekly_summary");
  }, [openRewards]);

  // ── §8 Tertiary: Smart Follower milestone ──
  // Thresholds: 25, 50, 100, 250, 500
  const triggerSmartFollowerMilestone = useCallback((count: number) => {
    const thresholds = [25, 50, 100, 250, 500];
    const lastSeenStr = localStorage.getItem("hc_rewards_sf_milestone") || "0";
    const lastSeen = parseInt(lastSeenStr, 10);
    const crossed = thresholds.find((t) => count >= t && lastSeen < t);
    if (!crossed) return;
    localStorage.setItem("hc_rewards_sf_milestone", String(crossed));
    openRewards("smart_follower_milestone");
  }, [openRewards]);

  // ── §8 Tertiary: Phase transition (Beta → S1) ──
  // "Every user should see the updated rewards screen on their next app open"
  // Only fires once per phase transition.
  const triggerPhaseTransition = useCallback(() => {
    if (hasShown(KEYS.phaseTransitionSeen)) return;
    markShown(KEYS.phaseTransitionSeen);
    openRewards("phase_transition");
  }, [openRewards]);

  // ── §8 Tertiary: Before sharing referral link ──
  // "Show condensed Fee Share mechanics so they can speak to the value prop"
  // Can fire every time (not one-shot).
  const triggerReferralShare = useCallback(() => {
    openRewards("referral_share");
  }, [openRewards]);

  return (
    <RewardsContext.Provider
      value={{
        showRewards,
        lastTrigger,
        openRewards,
        closeRewards,
        triggerFirstCopyTrade,
        triggerFirstTimeCopied,
        triggerWeeklySummary,
        triggerSmartFollowerMilestone,
        triggerPhaseTransition,
        triggerReferralShare,
      }}
    >
      {children}
    </RewardsContext.Provider>
  );
}

export function useRewards() {
  return useContext(RewardsContext);
}