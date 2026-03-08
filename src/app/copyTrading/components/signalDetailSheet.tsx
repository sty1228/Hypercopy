"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight, X } from "lucide-react";

/** Unified shape accepted by this sheet — maps from both UserSignalItem and BestWorstSignal */
export interface SignalDetailData {
  ticker: string;
  direction?: string | null;        // "long" | "short" | "bullish" | "bearish"
  pct_change?: number | null;
  tweet_text?: string | null;
  tweet_image_url?: string | null;
  likes?: number;
  retweets?: number;
  replies?: number;
  timestamp?: string | null;        // ISO or relative string
  entry_price?: number | null;
  signal_id?: number | string | null;
}

interface Props {
  signal: SignalDetailData | null;
  open: boolean;
  onClose: () => void;
  /** Optional: place trade on this signal */
  onTrade?: (signal: SignalDetailData, side: "copy" | "counter") => void;
  trading?: boolean;
}

function directionInfo(d?: string | null) {
  const bull = d === "long" || d === "bullish";
  return {
    label: bull ? "LONG" : "SHORT",
    color: bull ? "#2dd4bf" : "#f43f5e",
    bg: bull ? "rgba(45,212,191,0.15)" : "rgba(244,63,94,0.15)",
  };
}

export default function SignalDetailSheet({ signal, open, onClose, onTrade, trading }: Props) {
  const [visible, setVisible] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    if (open) {
      setImgErr(false);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  if (!open && !visible) return null;
  if (!signal) return null;  

  const pct = signal.pct_change ?? null;
  const pctColor = pct == null ? "rgba(255,255,255,0.4)" : pct >= 0 ? "#2dd4bf" : "#f43f5e";
  const pctLabel = pct == null ? "—" : `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
  const dir = directionInfo(signal.direction);
  const showImg = !!signal.tweet_image_url && !imgErr;
  const hasEngagement = (signal.likes ?? 0) + (signal.retweets ?? 0) + (signal.replies ?? 0) > 0;
  const canTrade = !!onTrade && !!signal.signal_id;

  const el = (
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: 9990 }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full transition-transform duration-300 ease-out"
        style={{
          maxWidth: 393,
          background: "#0d1117",
          borderRadius: "20px 20px 0 0",
          border: "1px solid rgba(255,255,255,0.07)",
          borderBottom: "none",
          maxHeight: "88vh",
          overflowY: "auto",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.7)",
        }}
      >
        {/* Accent bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${dir.color}, transparent)`, opacity: 0.5 }} />

        <div className="px-5 pt-4 pb-8">
          {/* Handle */}
          <div className="w-9 h-[3px] rounded-full mx-auto mb-4" style={{ background: "rgba(255,255,255,0.1)" }} />

          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
                style={{ background: dir.bg, color: dir.color }}
              >
                {dir.label}
              </span>
              <span className="text-[20px] font-bold text-white">{signal.ticker}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {pct != null && (pct >= 0
                  ? <ArrowUpRight size={14} color={pctColor} />
                  : <ArrowDownRight size={14} color={pctColor} />)}
                <span className="text-[15px] font-bold" style={{ color: pctColor }}>{pctLabel}</span>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <X size={14} color="rgba(255,255,255,0.4)" />
              </button>
            </div>
          </div>

          {/* Entry price */}
          {signal.entry_price != null && signal.entry_price > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Entry</span>
              <span className="text-[13px] font-semibold text-white">
                ${signal.entry_price.toLocaleString()}
              </span>
            </div>
          )}

          {/* Tweet image */}
          {showImg && (
            <div
              className="rounded-xl overflow-hidden mb-4"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <img
                src={signal.tweet_image_url!}
                alt="Signal chart"
                className="w-full object-cover"
                style={{ maxHeight: 240 }}
                loading="lazy"
                onError={() => setImgErr(true)}
              />
            </div>
          )}

          {/* Tweet text */}
          {signal.tweet_text && signal.tweet_text.trim() && (
            <div
              className="rounded-xl p-4 mb-4 text-[12px] text-gray-200 leading-relaxed whitespace-pre-wrap"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {signal.tweet_text.trim()}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Direction</p>
              <p className="text-[13px] font-bold" style={{ color: dir.color }}>{dir.label}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">SPOT CHG</p>
              <p className="text-[13px] font-bold" style={{ color: pctColor }}>{pctLabel}</p>
            </div>
          </div>

          {/* Engagement */}
          {hasEngagement && (
            <div
              className="flex items-center gap-4 py-3 px-4 rounded-xl mb-4 text-[11px] text-gray-400"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              {(signal.likes ?? 0) > 0 && <span>❤️ {signal.likes!.toLocaleString()}</span>}
              {(signal.retweets ?? 0) > 0 && <span>🔁 {signal.retweets!.toLocaleString()}</span>}
              {(signal.replies ?? 0) > 0 && <span>💬 {signal.replies!.toLocaleString()}</span>}
            </div>
          )}

          {/* Timestamp */}
          {signal.timestamp && (
            <p className="text-[10px] text-gray-600 text-center mb-4">{signal.timestamp}</p>
          )}

          {/* Trade buttons */}
          {canTrade && (
            <div className="flex gap-3">
              <button
                onClick={() => onTrade!(signal, "counter")}
                disabled={trading}
                className="flex-1 py-3.5 rounded-xl text-[13px] font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{ background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.25)", color: "#fb7185" }}
              >
                {trading ? "Placing…" : "Counter"}
              </button>
              <button
                onClick={() => onTrade!(signal, "copy")}
                disabled={trading}
                className="flex-1 py-3.5 rounded-xl text-[13px] font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{ background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.25)", color: "#2dd4bf" }}
              >
                {trading ? "Placing…" : "Copy Trade"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(el, document.body);
}