"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import {
  LeaderboardItem,
  UserSignalResponse,
  userSignals,
  followTrader,
  checkFollowStatus,
  toggleCopyTrading,
  updateDefaultSettings,
  DefaultFollowSettings,
} from "@/service";
import BigNumber from "bignumber.js";
import SignalItem from "./signalItem";
import { useRewards } from "@/providers/RewardsContext";

// localStorage key — marks whether user has EVER copied/countered anyone
const LS_HAS_COPIED = "hc_has_copied_before";

function hasEverCopied(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(LS_HAS_COPIED) === "1";
}

function markHasCopied(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_HAS_COPIED, "1");
}

// ═══════════════════════════════════════════════════════════════
//  QUICK SETTINGS SHEET (Bottom Sheet with Portal)
//  Only shown on the user's FIRST-EVER copy action
// ═══════════════════════════════════════════════════════════════

function QuickSettingsSheet({
  traderName,
  action,
  onConfirm,
  onClose,
}: {
  traderName: string;
  action: "copy" | "counter";
  onConfirm: (cfg: any) => void;
  onClose: () => void;
}) {
  const [sizeVal, setSizeVal] = useState(10);
  const [sizeType, setSizeType] = useState<"USD" | "PCT">("PCT");
  const [leverage, setLeverage] = useState(8);
  const [tpVal, setTpVal] = useState(15);
  const [tpType, setTpType] = useState<"USD" | "PCT">("PCT");
  const [slVal, setSlVal] = useState(35);
  const [slType, setSlType] = useState<"USD" | "PCT">("PCT");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm({ sizeVal, sizeType, leverage, tpVal, tpType, slVal, slType });
    setLoading(false);
  };

  const TypeToggle = ({
    val,
    onChange,
    accent = "rgba(45,212,191,1)",
  }: {
    val: string;
    onChange: (v: "USD" | "PCT") => void;
    accent?: string;
  }) => (
    <div className="flex gap-1">
      {(["$", "%"] as const).map((t) => {
        const mapped = t === "$" ? "USD" : "PCT";
        const active = val === mapped;
        return (
          <button
            key={t}
            onClick={() => onChange(mapped)}
            className="w-8 h-8 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: active ? `${accent}18` : "rgba(255,255,255,0.04)",
              color: active ? accent : "rgba(255,255,255,0.25)",
              border: active ? `1px solid ${accent}35` : "1px solid transparent",
            }}
          >
            {t}
          </button>
        );
      })}
    </div>
  );

  const isCopy = action === "copy";
  const accentColor = isCopy ? "rgba(45,212,191,1)" : "rgba(244,63,94,1)";
  const accentBg = isCopy ? "rgba(45,212,191,0.08)" : "rgba(244,63,94,0.08)";
  const accentBorder = isCopy ? "rgba(45,212,191,0.2)" : "rgba(244,63,94,0.2)";

  const content = (
    <div
      className="fixed inset-0 flex items-end justify-center"
      style={{ zIndex: 9998 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          opacity: visible ? 1 : 0,
        }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full transition-transform duration-300 ease-out"
        style={{
          maxWidth: 393,
          background: "linear-gradient(180deg, #111820 0%, #0d1117 100%)",
          borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "none",
          maxHeight: "88vh",
          overflowY: "auto",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
        }}
      >
        <div className="p-5 pb-8">
          {/* Handle */}
          <div
            className="w-10 h-1 rounded-full mx-auto mb-5"
            style={{ background: "rgba(255,255,255,0.12)" }}
          />

          {/* Header — encouraging tone */}
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
              style={{
                background: isCopy
                  ? "linear-gradient(135deg, #06b6d4, #2dd4bf)"
                  : "linear-gradient(135deg, #f43f5e, #fb7185)",
                color: "#fff",
              }}
            >
              {traderName[0]?.toUpperCase()}
            </div>
            <div>
              <h3 className="text-white text-base font-bold m-0">
                {isCopy ? "Copy" : "Counter"} @{traderName}
              </h3>
              <p className="text-xs m-0" style={{ color: "rgba(255,255,255,0.35)" }}>
                Set up once, trade automatically
              </p>
            </div>
          </div>

          <p
            className="text-xs mb-5 pl-[52px]"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            You can change these anytime in Settings
          </p>

          {/* ── Position Size ─────────────────────── */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3 pl-0.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{
                  background: accentBg,
                  border: `1px solid ${accentBorder}`,
                }}
              >
                📊
              </div>
              <span className="text-white text-sm font-semibold">
                Position Size
              </span>
            </div>

            {/* Trade Size */}
            <div
              className="flex items-center justify-between px-4 py-3.5 rounded-xl mb-2.5"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                Trade Size
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={sizeVal}
                  onChange={(e) => setSizeVal(Number(e.target.value) || 0)}
                  className="w-16 text-right bg-transparent border-none outline-none text-base font-bold"
                  style={{ color: accentColor }}
                />
                <TypeToggle val={sizeType} onChange={setSizeType} accent={accentColor} />
              </div>
            </div>

            {/* Leverage */}
            <div
              className="px-4 py-3.5 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Leverage
                </span>
                <span className="text-base font-bold" style={{ color: accentColor }}>
                  {leverage}x
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: accentColor }}
              />
              <div className="flex justify-between mt-1 text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                <span>1x</span><span>5x</span><span>10x</span><span>15x</span><span>20x</span>
              </div>
            </div>
          </div>

          {/* ── Risk Controls ─────────────────────── */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3 pl-0.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{
                  background: "rgba(251,113,133,0.08)",
                  border: "1px solid rgba(251,113,133,0.15)",
                }}
              >
                🛡️
              </div>
              <span className="text-white text-sm font-semibold">
                Risk Controls
              </span>
            </div>

            {/* Stop Loss */}
            <div
              className="flex items-center justify-between px-4 py-3.5 rounded-xl mb-2.5"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                Stop Loss
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={slVal}
                  onChange={(e) => setSlVal(Number(e.target.value) || 0)}
                  className="w-16 text-right bg-transparent border-none outline-none text-base font-bold"
                  style={{ color: "#fb7185" }}
                />
                <TypeToggle val={slType} onChange={setSlType} accent="#fb7185" />
              </div>
            </div>

            {/* Take Profit */}
            <div
              className="flex items-center justify-between px-4 py-3.5 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                Take Profit
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={tpVal}
                  onChange={(e) => setTpVal(Number(e.target.value) || 0)}
                  className="w-16 text-right bg-transparent border-none outline-none text-base font-bold"
                  style={{ color: "#34d399" }}
                />
                <TypeToggle val={tpType} onChange={setTpType} accent="#34d399" />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div
            className="px-4 py-3 rounded-xl mb-4 text-xs"
            style={{
              background: `${accentColor}06`,
              border: `1px solid ${accentColor}12`,
              color: "rgba(255,255,255,0.4)",
            }}
          >
            {sizeType === "PCT" ? `${sizeVal}%` : `$${sizeVal}`} per trade · {leverage}x ·{" "}
            SL {slType === "PCT" ? `${slVal}%` : `$${slVal}`} ·{" "}
            TP {tpType === "PCT" ? `${tpVal}%` : `$${tpVal}`}
          </div>

          {/* Lightweight risk note — encouraging, not scary */}
          <p
            className="text-center text-[10px] mb-4"
            style={{ color: "rgba(255,255,255,0.2)", lineHeight: 1.5 }}
          >
            Start small, learn as you go. You can adjust settings anytime.
          </p>

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full py-4 rounded-2xl text-sm font-bold transition-all duration-300"
            style={{
              background: loading
                ? "rgba(255,255,255,0.05)"
                : isCopy
                ? "linear-gradient(135deg, #2dd4bf, #14b8a6)"
                : "linear-gradient(135deg, #f43f5e, #e11d48)",
              color: loading ? "rgba(255,255,255,0.3)" : isCopy ? "#000" : "#fff",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : `0 0 30px ${accentColor}25`,
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> Setting up...
              </span>
            ) : (
              `Start ${isCopy ? "Copying" : "Countering"} @${traderName}`
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(content, document.body);
}


// ═══════════════════════════════════════════════════════════════
//  SUCCESS SHEET (Bottom Sheet with Portal)
//  Only shown on the user's FIRST-EVER copy action
// ═══════════════════════════════════════════════════════════════

function SuccessSheet({
  traderName,
  action,
  onViewRewards,
  onDone,
}: {
  traderName: string;
  action: "copy" | "counter";
  onViewRewards: () => void;
  onDone: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const isCopy = action === "copy";
  const accentColor = isCopy ? "#2dd4bf" : "#fb7185";

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleDone = () => {
    setVisible(false);
    setTimeout(onDone, 300);
  };

  const handleRewards = () => {
    setVisible(false);
    setTimeout(onViewRewards, 300);
  };

  const content = (
    <div
      className="fixed inset-0 flex items-end justify-center"
      style={{ zIndex: 9999 }}
    >
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          opacity: visible ? 1 : 0,
        }}
      />

      <div
        className="relative w-full transition-transform duration-300 ease-out text-center"
        style={{
          maxWidth: 393,
          background: "linear-gradient(180deg, #111820 0%, #0d1117 100%)",
          borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "none",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
        }}
      >
        <div className="p-6 pb-9">
          {/* Success icon */}
          <div
            className="w-[72px] h-[72px] rounded-3xl mx-auto mb-5 flex items-center justify-center"
            style={{
              background: `${accentColor}10`,
              border: `2px solid ${accentColor}30`,
              boxShadow: `0 0 40px ${accentColor}15`,
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke={accentColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h3 className="text-white text-xl font-bold mb-2">
            You&apos;re Now {isCopy ? "Copying" : "Countering"}
          </h3>
          <p className="text-base font-semibold mb-2" style={{ color: accentColor }}>
            @{traderName}
          </p>
          <p
            className="text-xs mb-6 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Trades will execute automatically based on your settings.
            <br />
            You&apos;ll be notified when new positions open.
          </p>

          {/* Points earned */}
          <div
            className="rounded-2xl p-4 mb-6"
            style={{
              background: `linear-gradient(135deg, ${accentColor}06, ${accentColor}02)`,
              border: `1px solid ${accentColor}18`,
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xl">🎉</span>
              <span className="text-2xl font-extrabold" style={{ color: accentColor }}>
                +50
              </span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                points earned
              </span>
            </div>
            <p
              className="text-[11px] m-0"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Earn points on every copy trade · Top KOLs earn fee share rewards
            </p>
          </div>

          {/* Buttons */}
          <button
            onClick={handleRewards}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold mb-2.5 transition-all"
            style={{
              background: `${accentColor}10`,
              border: `1px solid ${accentColor}20`,
              color: accentColor,
            }}
          >
            View Rewards Program →
          </button>

          <button
            onClick={handleDone}
            className="w-full py-3 rounded-2xl text-xs transition-all"
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(content, document.body);
}


// ═══════════════════════════════════════════════════════════════
//  MAIN: KolDetailSheet
// ═══════════════════════════════════════════════════════════════

export default function KolDetailSheet({
  data,
  isOpen,
  handleClose,
}: {
  data: LeaderboardItem;
  isOpen: boolean;
  handleClose: () => void;
}) {
  const [userSignalsData, setUserSignalsData] = useState<UserSignalResponse | null>(null);
  const [currentClickItemId, setCurrentClickItemId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copyAction, setCopyAction] = useState<"copy" | "counter">("copy");
  const [isFollowed, setIsFollowed] = useState(false);
  const [toggling, setToggling] = useState(false); // loading state for toggle-off

  const { authenticated, login } = usePrivy();
  const { triggerFirstCopyTrade, viewRewardsFromPrompt } = useRewards();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      fetchUserSignals();
      checkIfFollowed();
    } else {
      setTimeout(() => {
        setUserSignalsData(null);
        setCurrentClickItemId(null);
      }, 500);
    }
  }, [isOpen]);

  const fetchUserSignals = async () => {
    try {
      const response = await userSignals(data.x_handle);
      setUserSignalsData(response);
    } catch (e) {
      console.error("Failed to fetch signals:", e);
    }
  };

  const checkIfFollowed = async () => {
    try {
      const status = await checkFollowStatus(data.x_handle);
      setIsFollowed(status?.is_copy_trading || false);
    } catch {
      // not followed
    }
  };

  // ── Core action handler ──────────────────────────────────
  const handleCopyAction = async (action: "copy" | "counter") => {
    if (!authenticated) {
      login();
      return;
    }

    // Already copy trading this trader → TOGGLE OFF (uncopy)
    if (isFollowed) {
      setToggling(true);
      try {
        await toggleCopyTrading(data.x_handle);
        setIsFollowed(false);
      } catch (e) {
        console.error("Failed to stop copy trading:", e);
      } finally {
        setToggling(false);
      }
      return;
    }

    setCopyAction(action);

    // First time EVER copying anyone → show settings sheet
    if (!hasEverCopied()) {
      setShowSettings(true);
      return;
    }

    // Subsequent copies → directly start with saved default settings
    await startCopyDirect();
  };

  // ── Direct copy (no settings sheet) ──────────────────────
  const startCopyDirect = async () => {
    try {
      await followTrader(data.x_handle, true);
      setIsFollowed(true);
      // No SuccessSheet, no rewards — just a quick visual confirmation
    } catch (e: any) {
      console.error("Copy failed:", e);
      alert(e?.message || "Failed to start copy trading. Please try again.");
    }
  };

  // ── Settings confirm (first-time only path) ─────────────
  const handleSettingsConfirm = async (cfg: any) => {
    try {
      // 1. Save settings to backend
      const settingsPayload: DefaultFollowSettings = {
        tradeSizeType: cfg.sizeType,
        tradeSize: cfg.sizeVal,
        leverage: cfg.leverage,
        leverageType: "cross",
        tp: { type: cfg.tpType, value: cfg.tpVal },
        sl: { type: cfg.slType, value: cfg.slVal },
        orderType: "market",
      };
      await updateDefaultSettings(settingsPayload);

      // 2. Follow trader with copy trading enabled
      await followTrader(data.x_handle, true);

      // 3. Mark first-time done BEFORE showing success
      markHasCopied();

      // 4. Close settings, show success + rewards (first time only)
      setShowSettings(false);
      setIsFollowed(true);

      setTimeout(() => {
        setShowSuccess(true);
        triggerFirstCopyTrade();
      }, 200);
    } catch (e: any) {
      console.error("Copy setup failed:", e);
      alert(e?.message || "Failed to start copy trading. Please try again.");
    }
  };

  const handleSuccessDone = () => {
    setShowSuccess(false);
  };

  const handleViewRewards = () => {
    setShowSuccess(false);
    viewRewardsFromPrompt();
  };

  const profit = data?.results_pct || 0;
  const isPositive = profit >= 0;

  if (!data) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 z-40 transition-opacity duration-500 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className={`absolute inset-0 z-50 transition-transform duration-500 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)",
        }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-20 left-1/3 w-[300px] h-[300px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)",
              filter: "blur(60px)",
            }}
          />
          <div
            className="absolute bottom-1/3 -right-20 w-[200px] h-[200px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 60%)",
              filter: "blur(40px)",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full overflow-y-auto">
          {/* Header */}
          <div className="mt-4 mb-3 flex items-center justify-between px-4">
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:bg-white/10"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span className="text-base font-semibold text-white">
              {data.x_handle}
            </span>
            <div className="w-10" />
          </div>

          {/* Profile Card */}
          <div className="px-4">
            <div
              className="rounded-2xl p-4 mb-4 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(45,212,191,0.01) 100%)",
                border: "1px solid rgba(45,212,191,0.2)",
                boxShadow:
                  "0 0 30px rgba(45,212,191,0.1), inset 0 0 40px rgba(45,212,191,0.03)",
              }}
            >
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at top left, rgba(45,212,191,0.15) 0%, transparent 60%)",
                }}
              />

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl text-white"
                      style={{
                        background:
                          data.avatarColor ||
                          "linear-gradient(135deg, #06b6d4, #3b82f6)",
                      }}
                    >
                      {data.x_handle?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-semibold">
                        {data.x_handle}
                      </div>
                      <div className="text-gray-500 text-xs">
                        @{data.x_handle}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-lg font-bold ${
                        isPositive ? "text-teal-400" : "text-rose-400"
                      }`}
                      style={{
                        textShadow: isPositive
                          ? "0 0 10px rgba(45,212,191,0.3)"
                          : "0 0 10px rgba(251,113,133,0.3)",
                      }}
                    >
                      {isPositive ? "+" : ""}
                      {new BigNumber(profit).decimalPlaces(2).toNumber()}%
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div
                    className="text-center py-3 rounded-xl"
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      className={`text-sm font-bold ${
                        isPositive ? "text-teal-400" : "text-rose-400"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {new BigNumber(profit).decimalPlaces(2).toNumber()}%
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase mt-1">
                      Result
                    </div>
                  </div>
                  <div
                    className="text-center py-3 rounded-xl"
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="text-sm font-bold text-white">
                      {data.streak || 0}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase mt-1">
                      Streak
                    </div>
                  </div>
                  <div
                    className="text-center py-3 rounded-xl"
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      className="text-sm font-bold"
                      style={{
                        background:
                          "linear-gradient(135deg, #ffd700 0%, #ffec8b 25%, #ffd700 50%, #daa520 75%, #ffd700 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {data.profit_grade || "-"}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase mt-1">
                      Grade
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleCopyAction("counter")}
                    disabled={toggling}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: "rgba(244,63,94,0.12)",
                      border: "1px solid rgba(244,63,94,0.25)",
                      opacity: toggling ? 0.5 : 1,
                    }}
                  >
                    <span className="text-rose-400">Counter All</span>
                  </button>
                  <button
                    onClick={() => handleCopyAction("copy")}
                    disabled={toggling}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: isFollowed
                        ? "rgba(45,212,191,0.25)"
                        : "rgba(45,212,191,0.12)",
                      border: "1px solid rgba(45,212,191,0.25)",
                      opacity: toggling ? 0.5 : 1,
                    }}
                  >
                    <span className="text-teal-400">
                      {toggling
                        ? "Stopping..."
                        : isFollowed
                        ? "Copying ✓"
                        : "Copy All"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Signals Header */}
          <div className="px-4 mb-3 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-teal-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M12 20v-8" />
              <circle cx="12" cy="9" r="3" fill="currentColor" stroke="none" />
              <path d="M8.5 8.5a5 5 0 0 1 7 0" />
              <path d="M6 6a8 8 0 0 1 12 0" />
              <path d="M3.5 3.5a11 11 0 0 1 17 0" />
            </svg>
            <span className="text-white text-sm font-semibold">Signals</span>
            <span className="text-gray-500 text-xs">
              ({userSignalsData?.tweetsCount || 0})
            </span>
          </div>

          {/* Signals List */}
          <div className="px-4 space-y-4 pb-24">
            {userSignalsData?.signals.map((signal, index) => (
              <SignalItem
                key={signal.signal_id}
                data={signal}
                index={index}
                currentClickItemId={currentClickItemId}
                onClick={() =>
                  setCurrentClickItemId(
                    currentClickItemId === signal.signal_id
                      ? null
                      : signal.signal_id
                  )
                }
              />
            ))}
          </div>
        </div>

        {/* Quick Settings Sheet — first-time only */}
        {showSettings && (
          <QuickSettingsSheet
            traderName={data.x_handle}
            action={copyAction}
            onConfirm={handleSettingsConfirm}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Success Sheet — first-time only */}
        {showSuccess && (
          <SuccessSheet
            traderName={data.x_handle}
            action={copyAction}
            onViewRewards={handleViewRewards}
            onDone={handleSuccessDone}
          />
        )}
      </div>
    </>
  );
}