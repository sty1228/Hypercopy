"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type RewardsTrigger =
  | "first_copy_trade"
  | "first_time_copied"
  | "weekly_summary"
  | "smart_follower_milestone"
  | "phase_transition"
  | "referral_share";

interface RewardsContextType {
  // Full rewards screen
  showRewards: boolean;
  lastTrigger: RewardsTrigger | null;
  openRewards: (trigger?: RewardsTrigger) => void;
  closeRewards: () => void;

  // Intermediate congrats prompt (in-place, after copy action)
  showCongrats: boolean;
  congratsTrigger: RewardsTrigger | null;
  dismissCongrats: () => void;

  // Dashboard banner (non-intrusive, for "first time copied" etc.)
  showBanner: boolean;
  bannerTrigger: RewardsTrigger | null;
  dismissBanner: () => void;

  // Transition: congrats/banner → full rewards screen
  viewRewardsFromPrompt: () => void;

  // Event triggers
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
  showCongrats: false,
  congratsTrigger: null,
  dismissCongrats: () => {},
  showBanner: false,
  bannerTrigger: null,
  dismissBanner: () => {},
  viewRewardsFromPrompt: () => {},
  triggerFirstCopyTrade: () => {},
  triggerFirstTimeCopied: () => {},
  triggerWeeklySummary: () => {},
  triggerSmartFollowerMilestone: () => {},
  triggerPhaseTransition: () => {},
  triggerReferralShare: () => {},
});

const KEYS = {
  firstCopyTrade: "hc_rewards_first_copy_trade_shown",
  firstTimeCopied: "hc_rewards_first_time_copied_shown",
  phaseTransitionSeen: "hc_rewards_phase_transition_seen",
} as const;

function hasShown(key: string): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(key) === "1";
}

function markShown(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, "1");
}

export function RewardsProvider({ children }: { children: ReactNode }) {
  const [showRewards, setShowRewards] = useState(false);
  const [lastTrigger, setLastTrigger] = useState<RewardsTrigger | null>(null);

  const [showCongrats, setShowCongrats] = useState(false);
  const [congratsTrigger, setCongratsT] = useState<RewardsTrigger | null>(null);

  const [showBanner, setShowBanner] = useState(false);
  const [bannerTrigger, setBannerT] = useState<RewardsTrigger | null>(null);

  // ── Direct open (for menu links, settings, etc.) ──
  const openRewards = useCallback((trigger?: RewardsTrigger) => {
    if (trigger) setLastTrigger(trigger);
    setShowRewards(true);
  }, []);

  const closeRewards = useCallback(() => {
    setShowRewards(false);
  }, []);

  // ── Dismiss intermediate UI ──
  const dismissCongrats = useCallback(() => {
    setShowCongrats(false);
    setCongratsT(null);
  }, []);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    setBannerT(null);
  }, []);

  // ── User taps "View Rewards" from congrats or banner ──
  const viewRewardsFromPrompt = useCallback(() => {
    const trigger = congratsTrigger || bannerTrigger;
    setShowCongrats(false);
    setCongratsT(null);
    setShowBanner(false);
    setBannerT(null);
    if (trigger) setLastTrigger(trigger);
    setShowRewards(true);
  }, [congratsTrigger, bannerTrigger]);

  // ── §8 Primary: After first successful copy trade ──
  // NOW: shows in-place congrats prompt instead of full-screen rewards
  const triggerFirstCopyTrade = useCallback(() => {
    if (hasShown(KEYS.firstCopyTrade)) return;
    markShown(KEYS.firstCopyTrade);
    setTimeout(() => {
      setCongratsT("first_copy_trade");
      setShowCongrats(true);
    }, 800);
  }, []);

  // ── §8 Secondary: First time being copied ──
  // NOW: shows dashboard banner instead of full-screen rewards
  const triggerFirstTimeCopied = useCallback(() => {
    if (hasShown(KEYS.firstTimeCopied)) return;
    markShown(KEYS.firstTimeCopied);
    setTimeout(() => {
      setBannerT("first_time_copied");
      setShowBanner(true);
    }, 1000);
  }, []);

  // ── Tertiary triggers: these use banners too ──
  const triggerWeeklySummary = useCallback(() => {
    setBannerT("weekly_summary");
    setShowBanner(true);
  }, []);

  const triggerSmartFollowerMilestone = useCallback((count: number) => {
    const thresholds = [25, 50, 100, 250, 500];
    const lastSeenStr = localStorage.getItem("hc_rewards_sf_milestone") || "0";
    const lastSeen = parseInt(lastSeenStr, 10);
    const crossed = thresholds.find((t) => count >= t && lastSeen < t);
    if (!crossed) return;
    localStorage.setItem("hc_rewards_sf_milestone", String(crossed));
    setBannerT("smart_follower_milestone");
    setShowBanner(true);
  }, []);

  const triggerPhaseTransition = useCallback(() => {
    if (hasShown(KEYS.phaseTransitionSeen)) return;
    markShown(KEYS.phaseTransitionSeen);
    setBannerT("phase_transition");
    setShowBanner(true);
  }, []);

  const triggerReferralShare = useCallback(() => {
    openRewards("referral_share");
  }, [openRewards]);

  return (
    <RewardsContext.Provider
      value={{
        showRewards, lastTrigger, openRewards, closeRewards,
        showCongrats, congratsTrigger, dismissCongrats,
        showBanner, bannerTrigger, dismissBanner,
        viewRewardsFromPrompt,
        triggerFirstCopyTrade, triggerFirstTimeCopied,
        triggerWeeklySummary, triggerSmartFollowerMilestone,
        triggerPhaseTransition, triggerReferralShare,
      }}
    >
      {children}
    </RewardsContext.Provider>
  );
}

export function useRewards() {
  return useContext(RewardsContext);
}