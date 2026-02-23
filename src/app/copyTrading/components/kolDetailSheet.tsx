// ================================================================
// FILE: copyTrading/components/kolDetailSheet.tsx
// ================================================================
// Changes:
//   - ADDED: useRewards() import + triggerFirstCopyTrade call
//   - When copy/counter trade executes successfully, rewards screen
//     auto-opens if it's the user's first copy trade (§8 Primary Trigger)
// ================================================================

"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { LeaderboardItem, UserSignalResponse, userSignals } from "@/service";
import BigNumber from "bignumber.js";
import SignalItem from "./signalItem";
import { useRewards } from "@/providers/RewardsContext";

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
  const { authenticated, login } = usePrivy();
  const { triggerFirstCopyTrade } = useRewards();

  useEffect(() => {
    if (isOpen) {
      fetchUserSignals();
    } else {
      setTimeout(() => {
        setUserSignalsData(null);
        setCurrentClickItemId(null);
      }, 500);
    }
  }, [isOpen]);

  const fetchUserSignals = async () => {
    const response = await userSignals(data.x_handle);
    setUserSignalsData(response);
  };

  const handleCopyAction = (action: "copy" | "counter") => {
    if (!authenticated) {
      login();
      return;
    }

    // TODO: Replace with actual copy/counter trade execution via wallet_manager.execute_copy_trade()
    // When the trade executes successfully, the trigger below fires.
    console.log(`${action} action for`, data.x_handle);

    // §8 PRIMARY TRIGGER: After first successful copy trade
    // "You just earned your first points — here's how your rewards grow"
    // This only fires ONCE (localStorage guard inside triggerFirstCopyTrade).
    // Move this call to AFTER the actual trade confirmation when copy trading engine is implemented.
    triggerFirstCopyTrade();
  };

  const profit = data?.results_pct || 0;
  const isPositive = profit >= 0;

  if (!data) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 z-40 transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className={`absolute inset-0 z-50 transition-transform duration-500 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{
          background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)",
        }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 left-1/3 w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)", filter: "blur(60px)" }} />
          <div className="absolute bottom-1/3 -right-20 w-[200px] h-[200px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 60%)", filter: "blur(40px)" }} />
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
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-base font-semibold text-white">{data.x_handle}</span>
            <div className="w-10" />
          </div>

          {/* Profile Card */}
          <div className="px-4">
            <div
              className="rounded-2xl p-4 mb-4 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(45,212,191,0.01) 100%)",
                border: "1px solid rgba(45,212,191,0.2)",
                boxShadow: "0 0 30px rgba(45,212,191,0.1), inset 0 0 40px rgba(45,212,191,0.03)",
              }}
            >
              <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: "radial-gradient(ellipse at top left, rgba(45,212,191,0.15) 0%, transparent 60%)" }} />

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl text-white"
                      style={{ background: data.avatarColor || "linear-gradient(135deg, #06b6d4, #3b82f6)" }}
                    >
                      {data.x_handle?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{data.x_handle}</div>
                      <div className="text-gray-500 text-xs">@{data.x_handle}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${isPositive ? "text-teal-400" : "text-rose-400"}`} style={{ textShadow: isPositive ? "0 0 10px rgba(45,212,191,0.3)" : "0 0 10px rgba(251,113,133,0.3)" }}>
                      {isPositive ? "+" : ""}{new BigNumber(profit).decimalPlaces(2).toNumber()}%
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center py-3 rounded-xl" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className={`text-sm font-bold ${isPositive ? "text-teal-400" : "text-rose-400"}`}>
                      {isPositive ? "+" : ""}{new BigNumber(profit).decimalPlaces(2).toNumber()}%
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase mt-1">Result</div>
                  </div>
                  <div className="text-center py-3 rounded-xl" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="text-sm font-bold text-white">🔥{data.streak || 0}</div>
                    <div className="text-[10px] text-gray-500 uppercase mt-1">Streak</div>
                  </div>
                  <div className="text-center py-3 rounded-xl" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div
                      className="text-sm font-bold"
                      style={{
                        background: "linear-gradient(135deg, #ffd700 0%, #ffec8b 25%, #ffd700 50%, #daa520 75%, #ffd700 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {data.profit_grade || "-"}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase mt-1">Grade</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleCopyAction("counter")}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.25)" }}
                  >
                    <span className="text-rose-400">Counter All</span>
                  </button>
                  <button
                    onClick={() => handleCopyAction("copy")}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.25)" }}
                  >
                    <span className="text-teal-400">Copy All</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Signals Header */}
          <div className="px-4 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M12 20v-8" />
              <circle cx="12" cy="9" r="3" fill="currentColor" stroke="none" />
              <path d="M8.5 8.5a5 5 0 0 1 7 0" />
              <path d="M6 6a8 8 0 0 1 12 0" />
              <path d="M3.5 3.5a11 11 0 0 1 17 0" />
            </svg>
            <span className="text-white text-sm font-semibold">Signals</span>
            <span className="text-gray-500 text-xs">({userSignalsData?.tweetsCount || 0})</span>
          </div>

          {/* Signals List */}
          <div className="px-4 space-y-4 pb-24">
            {userSignalsData?.signals.map((signal, index) => (
              <SignalItem
                key={signal.signal_id}
                data={signal}
                index={index}
                currentClickItemId={currentClickItemId}
                onClick={() => setCurrentClickItemId(
                  currentClickItemId === signal.signal_id ? null : signal.signal_id
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}