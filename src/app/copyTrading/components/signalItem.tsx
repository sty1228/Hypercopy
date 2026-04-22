"use client";

import { UserSignalItem, getWalletBalance, placeSignalTrade } from "@/service";
import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

function formatPct(v: number): string {
  if (v === 0) return "0.0%";
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
}

function parseTweetContent(text: string): { clean: string; url: string | null } {
  const re = /https?:\/\/t\.co\/\S+/g;
  const matches = text.match(re);
  return {
    clean: text.replace(re, "").replace(/\s+$/, "").trim(),
    url: matches ? matches[matches.length - 1] : null,
  };
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const then = new Date(iso).getTime();
    if (isNaN(then)) return "";
    const diff = Date.now() - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return "";
  }
}

const MIN_HL_EQUITY = 5;

export default function SignalItem({
  data,
  onClick,
  currentClickItemId,
  index = 0,
  onDetail,
}: {
  data: UserSignalItem;
  onClick: (signalId: number) => void;
  currentClickItemId: number | null;
  index?: number;
  onDetail?: (data: UserSignalItem) => void;
}) {
  const { authenticated, login } = usePrivy();
  const router = useRouter();
  const [placing, setPlacing] = useState(false);
  const [tweetImgError, setTweetImgError] = useState(false);

  const isExpanded = currentClickItemId === data.signal_id;
  const change = data?.change_since_tweet || 0;
  const isPositiveChange = change >= 0;
  const isBullish = data.bull_or_bear === "bullish";
  const tweetImage = data.tweet_image_url && !tweetImgError ? data.tweet_image_url : null;
  const { clean: cleanContent, url: tweetUrl } = parseTweetContent(data?.content || "");

  const hasPeak = data.max_gain_pct != null && data.max_gain_pct > 0.1;

  const handleTrade = async (side: "copy" | "counter") => {
    if (!authenticated) { login(); return; }
    if (placing) return;
    setPlacing(true);

    try {
      let bal;
      try {
        bal = await getWalletBalance();
      } catch {
        toast.error("No wallet found. Please deposit funds first.");
        router.push("/dashboard");
        return;
      }

      if (bal.hl_equity < MIN_HL_EQUITY) {
        toast.error(`Balance too low ($${bal.hl_equity.toFixed(2)}). Please deposit first.`);
        router.push("/dashboard");
        return;
      }

      const result = await placeSignalTrade(data.signal_id, side);
      toast.success(
        `${result.direction === "long" ? "↑ Long" : "↓ Short"} ${result.ticker} placed · $${result.size_usd.toFixed(0)} @ $${result.entry_price.toFixed(2)}`
      );
    } catch (err: any) {
      const detail: string = err?.response?.data?.detail || err?.message || "";
      if (detail === "insufficient_balance") {
        toast.error("Insufficient balance. Please deposit funds.");
        router.push("/dashboard");
      } else if (detail === "no_wallet") {
        toast.error("Please set up your wallet first.");
        router.push("/dashboard");
      } else {
        toast.error(detail || "Failed to place order");
      }
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div
      onClick={() => {
        if (onDetail) {
          onDetail(data);
        } else {
          onClick(data.signal_id);
        }
      }}
      className="rounded-2xl cursor-pointer relative overflow-hidden"
      style={{
        background: isExpanded
          ? "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)"
          : isBullish
            ? "linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(45,212,191,0.02) 100%)"
            : "linear-gradient(135deg, rgba(251,113,133,0.06) 0%, rgba(251,113,133,0.02) 100%)",
        border: isExpanded ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.06)",
        boxShadow: isExpanded ? "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1)" : "none",
        transform: isExpanded ? "scale(1.02) translateY(-2px)" : "scale(1) translateY(0)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        animation: `fadeInUp 0.5s ease-out ${index * 0.08}s both`,
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 rounded-l-2xl transition-all duration-300"
        style={{
          width: isExpanded ? "4px" : "3px",
          background: isBullish ? "linear-gradient(180deg, #2dd4bf 0%, #14b8a6 100%)" : "linear-gradient(180deg, #fb7185 0%, #f43f5e 100%)",
          boxShadow: isExpanded ? (isBullish ? "0 0 12px rgba(45,212,191,0.6)" : "0 0 12px rgba(251,113,133,0.6)") : "none",
        }}
      />

      <div className="relative pl-4 pr-3 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{data.updateTime}</span>
            </div>
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all duration-300 ${isBullish ? "text-teal-400" : "text-rose-400"}`}
              style={{
                background: isBullish ? "rgba(45,212,191,0.15)" : "rgba(251,113,133,0.15)",
                boxShadow: isExpanded ? (isBullish ? "0 0 8px rgba(45,212,191,0.4)" : "0 0 8px rgba(251,113,133,0.4)") : "none",
              }}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                {isBullish ? <path d="M7 17L17 7M17 7H10M17 7V14" /> : <path d="M7 7L17 17M17 17H10M17 17V10" />}
              </svg>
              <span>{isBullish ? "Bullish" : "Bearish"}</span>
            </div>

            {hasPeak && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  background: "linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(245,158,11,0.1) 100%)",
                  border: "1px solid rgba(251,191,36,0.35)",
                  color: "#fbbf24",
                  boxShadow: "0 0 8px rgba(251,191,36,0.15)",
                }}
                title={data.max_gain_at ? `Peaked ${formatRelative(data.max_gain_at)}` : ""}
              >
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M17 7H10M17 7V14" />
                </svg>
                <span>PEAK +{data.max_gain_pct!.toFixed(1)}%</span>
              </div>
            )}
          </div>
          <button className="text-gray-600 hover:text-gray-400 transition-colors px-1">•••</button>
        </div>

        <p className="text-sm text-gray-200 leading-relaxed mb-2">{cleanContent}</p>

        {tweetImage && (
          <div className="mb-2 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <img
              src={tweetImage}
              alt="Tweet image"
              className="w-full max-h-48 object-cover"
              loading="lazy"
              onError={() => setTweetImgError(true)}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-gray-500 text-xs">
            <span className="flex items-center gap-1.5 hover:text-gray-300 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              {data?.commentsCount ?? 0}
            </span>
            <span className="flex items-center gap-1.5 hover:text-gray-300 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              {data?.retweetsCount ?? 0}
            </span>
            <span className="flex items-center gap-1.5 hover:text-rose-400 transition-colors">
              <svg className="w-4 h-4 text-rose-400/60" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {data?.likesCount ?? 0}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {tweetUrl && (
              <a
                href={tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-gray-400 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                View
              </a>
            )}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24" }}>
              ${data?.ticker || "-"}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-[9px] text-gray-600 uppercase tracking-wide">SPOT CHG</span>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{
                  background: isPositiveChange ? "rgba(74,222,128,0.12)" : "rgba(251,113,133,0.12)",
                  border: isPositiveChange ? "1px solid rgba(74,222,128,0.25)" : "1px solid rgba(251,113,133,0.25)",
                  color: isPositiveChange ? "#4ade80" : "#fb7185",
                }}
              >
                {formatPct(change)}
              </span>
            </span>
          </div>
        </div>

        {isExpanded ? (
          <div className="flex gap-3 mt-3 pt-3 border-t border-white/10" style={{ animation: "slideUp 0.3s ease-out" }}>
            <button
              onClick={(e) => { e.stopPropagation(); handleTrade("counter"); }}
              disabled={placing}
              className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
              style={{ background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.3)", animation: "slideUp 0.3s ease-out 0.05s both" }}
            >
              <span className="text-rose-400">{placing ? "Placing..." : "Counter"}</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleTrade("copy"); }}
              disabled={placing}
              className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
              style={{ background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.3)", animation: "slideUp 0.3s ease-out 0.1s both" }}
            >
              <span className="text-teal-400">{placing ? "Placing..." : "Copy"}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center mt-1">
            <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
