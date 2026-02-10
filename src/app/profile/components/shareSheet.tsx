"use client";
import React, { useState } from "react";
import { X, Copy, Check, Download } from "lucide-react";

/* ── Types ──────────────────────────────────────── */
interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  traderData: {
    name: string;
    handle: string;
    avatar: string;
    avatarBg: string;
    rank: number;
    grade: string;
    gradeColor: string;
    gradeGlow: string;
    tags: { label: string; color: string }[];
    radar: Record<string, number>;
    cumulative: number;
    streak: number;
    signalPct: number;
    bestTrade: { token: string; pnl: number };
    tradersCopying: number;
  };
}

/* ── Radar for Share Card ───────────────────────── */
const ShareRadar = ({ data, size = 190 }: { data: Record<string, number>; size?: number }) => {
  const dims = [
    { key: "accuracy", label: "Accuracy" },
    { key: "winRate", label: "Win Rate" },
    { key: "riskReward", label: "R/R" },
    { key: "consistency", label: "Consist." },
    { key: "timing", label: "Timing" },
    { key: "transparency", label: "Transp." },
    { key: "engagement", label: "Engage." },
    { key: "trackRecord", label: "Track Rec." },
  ];
  const cx = size / 2,
    cy = size / 2,
    r = size * 0.34,
    n = dims.length;
  const ang = (i: number) => (360 / n) * i - 90;
  const pt = (a: number, R: number) => ({
    x: cx + Math.cos((a * Math.PI) / 180) * R,
    y: cy + Math.sin((a * Math.PI) / 180) * R,
  });
  const dPts = dims.map((d, i) => pt(ang(i), (data[d.key] / 100) * r));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block", margin: "0 auto" }}
    >
      <defs>
        <linearGradient id="srg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(45,212,191,0.4)" />
          <stop offset="100%" stopColor="rgba(45,212,191,0.05)" />
        </linearGradient>
        <filter id="srglow">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="scg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(45,212,191,0.12)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r * 0.3} fill="url(#scg)" />
      {[0.33, 0.66, 1].map((ring, ri) => {
        const ps = dims.map((_, j) => pt(ang(j), r * ring));
        return (
          <polygon
            key={ri}
            points={ps.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.8"
          />
        );
      })}
      {dims.map((_, i) => {
        const p = pt(ang(i), r);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.8"
          />
        );
      })}
      <polygon
        points={dPts.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="url(#srg)"
        stroke="rgba(45,212,191,0.9)"
        strokeWidth="1.5"
        filter="url(#srglow)"
      />
      <polygon
        points={dPts.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none"
        stroke="rgba(45,212,191,0.15)"
        strokeWidth="5"
        style={{ filter: "blur(3px)" }}
      />
      {dPts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="rgba(45,212,191,0.2)" />
          <circle
            cx={p.x}
            cy={p.y}
            r="2.5"
            fill="#2dd4bf"
            style={{ filter: "drop-shadow(0 0 4px rgba(45,212,191,0.8))" }}
          />
        </g>
      ))}
      {dims.map((d, i) => {
        const p = pt(ang(i), r + 18);
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            fill="rgba(255,255,255,0.5)"
            fontSize="7.5"
            textAnchor="middle"
            dominantBaseline="middle"
            fontWeight="500"
          >
            {d.label}
          </text>
        );
      })}
      {dims.map((d, i) => {
        const p = pt(ang(i), (data[d.key] / 100) * r + 11);
        return (
          <text
            key={`v${i}`}
            x={p.x}
            y={p.y}
            fill="rgba(45,212,191,0.8)"
            fontSize="7"
            textAnchor="middle"
            dominantBaseline="middle"
            fontWeight="700"
          >
            {data[d.key]}
          </text>
        );
      })}
    </svg>
  );
};

/* ── Mini PnL Sparkline ─────────────────────────── */
const MiniPnL = () => {
  const pts = [12, 28, 18, 45, 38, 62, 55, 78, 72, 95, 88, 110, 105, 118, 130];
  const w = 200,
    h = 32,
    py = 2;
  const max = Math.max(...pts),
    min = Math.min(...pts);
  const mapped = pts.map((v, i) => ({
    x: (i / (pts.length - 1)) * w,
    y: py + (1 - (v - min) / (max - min)) * (h - py * 2),
  }));
  const line = mapped.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${mapped[mapped.length - 1].x},${h} L${mapped[0].x},${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="mpg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(45,212,191,0.25)" />
          <stop offset="100%" stopColor="rgba(45,212,191,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#mpg)" />
      <path
        d={line}
        fill="none"
        stroke="rgba(45,212,191,0.8)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={mapped[mapped.length - 1].x}
        cy={mapped[mapped.length - 1].y}
        r="2.5"
        fill="#2dd4bf"
        style={{ filter: "drop-shadow(0 0 4px rgba(45,212,191,0.8))" }}
      />
    </svg>
  );
};

/* ── Stat Box ───────────────────────────────────── */
const StatBox = ({
  label,
  value,
  color = "#fff",
}: {
  label: string;
  value: string;
  color?: string;
}) => (
  <div
    style={{
      flex: 1,
      padding: "10px 12px",
      borderRadius: 10,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontSize: 9,
        color: "rgba(255,255,255,0.35)",
        fontWeight: 500,
        marginBottom: 3,
        letterSpacing: "0.03em",
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 16,
        fontWeight: 800,
        color,
        letterSpacing: "-0.02em",
      }}
    >
      {value}
    </div>
  </div>
);

/* ── Share Sheet ────────────────────────────────── */
export default function ShareSheet({ isOpen, onClose, traderData }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 300);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(`https://hypercopy.xyz/trader/${traderData.handle.replace("@", "")}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShareX = () => {
    const text = encodeURIComponent(
      `Check out ${traderData.name}'s trading profile on HyperCopy 🔥\n\n📊 Cumulative: +${traderData.cumulative}%\n🏆 Best Trade: +${traderData.bestTrade.pnl}% on $${traderData.bestTrade.token}\n🔥 Win Streak: ${traderData.streak}\n👥 ${traderData.tradersCopying} traders copying\n\nhypercopy.xyz/trader/${traderData.handle.replace("@", "")}`
    );
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md"
        onClick={onClose}
        style={{ animation: "shareBackdropFade 0.3s ease" }}
      />

      {/* Sheet */}
      <div
        className="fixed left-0 right-0 z-50 max-w-md mx-auto rounded-t-3xl overflow-hidden"
        style={{
          bottom: 48,
          background: "linear-gradient(180deg, #111820 0%, #0a0f14 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderBottom: "none",
          maxHeight: "88vh",
          animation: "shareSheetSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h2 className="text-base font-bold text-white">Share Profile</h2>
            <span className="text-[11px] text-gray-500">
              Preview your share card
            </span>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-white/10"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          className="overflow-y-auto px-4 pb-6"
          style={{ maxHeight: "calc(90vh - 80px)" }}
        >
          <style jsx>{`
            @keyframes shareCardFloat {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-3px); }
            }
            @keyframes shareShimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
            @keyframes shareGlowPulse {
              0%, 100% { opacity: 0.3; }
              50% { opacity: 0.6; }
            }
            @keyframes shareSheetSlideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
            @keyframes shareBackdropFade {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes shareSheetSlideDown {
              from { transform: translateY(0); }
              to { transform: translateY(100%); }
            }
            @keyframes shareBackdropFadeOut {
              from { opacity: 1; }
              to { opacity: 0; }
            }
          `}</style>

          {/* ═══ SHARE CARD ═══ */}
          <div
            className="rounded-2xl overflow-hidden relative mb-4"
            style={{
              background:
                "linear-gradient(160deg, #0c1219 0%, #080d12 40%, #0a1018 100%)",
              border: "1px solid rgba(45,212,191,0.12)",
              boxShadow:
                "0 8px 40px rgba(0,0,0,0.5), 0 0 80px rgba(45,212,191,0.06)",
              animation: "shareCardFloat 6s ease-in-out infinite",
            }}
          >
            {/* BG effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              <div
                className="absolute rounded-full"
                style={{
                  top: -60,
                  right: -60,
                  width: 200,
                  height: 200,
                  background:
                    "radial-gradient(circle, rgba(45,212,191,0.08), transparent 70%)",
                  filter: "blur(40px)",
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  bottom: -40,
                  left: -40,
                  width: 150,
                  height: 150,
                  background:
                    "radial-gradient(circle, rgba(99,102,241,0.06), transparent 70%)",
                  filter: "blur(30px)",
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(45,212,191,0.03), transparent)",
                  animation: "shareShimmer 5s ease-in-out infinite",
                }}
              />
            </div>

            <div className="relative z-10 p-5">
              {/* Header: Avatar + Name + Grade */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white"
                    style={{
                      backgroundColor: traderData.avatarBg,
                      boxShadow: `0 0 20px ${traderData.avatarBg}50`,
                    }}
                  >
                    {traderData.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-bold text-white">
                        {traderData.name}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{
                          background:
                            "linear-gradient(135deg, #f59e0b, #d97706)",
                          color: "#000",
                        }}
                      >
                        #{traderData.rank}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="rgba(255,255,255,0.4)"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      <span className="text-[11px] text-teal-400/80">
                        {traderData.handle}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Grade */}
                <div className="text-center">
                  <div
                    className="relative flex items-center justify-center"
                    style={{ width: 50, height: 50 }}
                  >
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(from 0deg, ${traderData.gradeColor}, ${traderData.gradeColor}22, ${traderData.gradeColor}, ${traderData.gradeColor}22, ${traderData.gradeColor})`,
                        animation:
                          "shareGlowPulse 3s ease-in-out infinite",
                      }}
                    />
                    <div
                      className="absolute rounded-full flex items-center justify-center"
                      style={{
                        inset: 2,
                        background:
                          "linear-gradient(145deg, #141c24, #0a0f14)",
                      }}
                    >
                      <span
                        className="text-lg font-black"
                        style={{
                          color: traderData.gradeColor,
                          textShadow: `0 0 12px ${traderData.gradeGlow}`,
                        }}
                      >
                        {traderData.grade}
                      </span>
                    </div>
                  </div>
                  <div
                    className="text-[7px] mt-0.5 tracking-widest font-semibold"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    GRADE
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex gap-1.5 mb-4">
                {traderData.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[9px] font-semibold px-2.5 py-1 rounded-md"
                    style={{
                      color: tag.color,
                      background: `${tag.color}10`,
                      border: `1px solid ${tag.color}20`,
                    }}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>

              {/* Radar Chart */}
              <div className="mb-4">
                <ShareRadar data={traderData.radar} size={190} />
              </div>

              {/* Key Stats Row */}
              <div className="flex gap-1.5 mb-3">
                <StatBox
                  label="CUMULATIVE"
                  value={`+${traderData.cumulative}%`}
                  color="#2dd4bf"
                />
                <StatBox
                  label="WIN STREAK"
                  value={`${traderData.streak} 🔥`}
                />
                <StatBox
                  label="SIGNAL"
                  value={`${traderData.signalPct}%`}
                  color="#2dd4bf"
                />
              </div>

              {/* PnL curve + Best Trade */}
              <div
                className="flex items-center justify-between rounded-xl p-3 mb-4"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div>
                  <div
                    className="text-[8px] font-medium mb-1"
                    style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}
                  >
                    PERFORMANCE
                  </div>
                  <MiniPnL />
                </div>
                <div className="text-right">
                  <div
                    className="text-[8px] font-medium mb-0.5"
                    style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}
                  >
                    BEST TRADE
                  </div>
                  <div className="text-lg font-extrabold text-teal-400">
                    +{traderData.bestTrade.pnl}%
                  </div>
                  <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                    ${traderData.bestTrade.token} 🚀
                  </div>
                </div>
              </div>

              {/* Footer: Branding + Copiers */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black"
                    style={{
                      background: "linear-gradient(135deg, #2dd4bf, #00b8d4)",
                      color: "#0a0f14",
                    }}
                  >
                    H
                  </div>
                  <div>
                    <div
                      className="text-[10px] font-bold"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      HyperCopy
                    </div>
                    <div className="text-[7px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                      hypercopy.xyz
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]" style={{ color: "rgba(45,212,191,0.7)" }}>
                    👥
                  </span>
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: "rgba(45,212,191,0.7)" }}
                  >
                    {traderData.tradersCopying.toLocaleString()} copying
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ ACTION BUTTONS ═══ */}
          <div className="flex gap-2.5">
            <button
              onClick={handleCopy}
              className="flex-1 py-3 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: copied ? "#2dd4bf" : "rgba(255,255,255,0.7)",
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={handleShareX}
              className="flex-[1.3] py-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 relative overflow-hidden"
              style={{
                background: "#000",
                color: "#fff",
                boxShadow: "0 2px 15px rgba(0,0,0,0.3)",
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
                  animation: "shareShimmer 3s ease-in-out infinite",
                }}
              />
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="#fff"
                className="relative z-10"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="relative z-10">Share on X</span>
            </button>
          </div>

          <p className="text-center text-[9px] text-gray-600 mt-3">
            Share your edge. Grow your audience.
          </p>
        </div>
      </div>
    </>
  );
}