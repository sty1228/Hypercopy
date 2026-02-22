// ================================================================
// FILE: dashboard/components/KOLRewardsScreen.tsx
// ================================================================

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X, TrendingUp, Wallet, BarChart3, Link2, Target,
  User, Settings, Diamond, Sparkles, ChevronRight,
  Crown, RefreshCw, Flame, Clock, Star, Zap,
} from "lucide-react";

// ── Phase Config ──

const PHASES = {
  beta: {
    label: "BETA PHASE", duration: "3 Months", multiplier: "2-5x",
    refCommission: "75%", revShare: "50%", socialMultiplier: "3x",
    copyShare: "30%", airdropPool: "8-10%", kolRefBonus: "5x",
    accent: "#2dd4bf", accentSoft: "rgba(45,212,191,0.12)",
    glowA: "rgba(45,212,191,0.10)", glowB: "rgba(45,212,191,0.04)",
    greenCandle: "#2dd4bf", redCandle: "#1a6b5f", wickColor: "rgba(45,212,191,0.5)",
    bg: "#0a0f14", cardBg: "rgba(45,212,191,0.03)", tagline: "EARLY ACCESS",
  },
  season1: {
    label: "SEASON 1", duration: "8 Months", multiplier: "1x → 2x",
    refCommission: "30%", revShare: "25%", socialMultiplier: "1x",
    copyShare: "30%", airdropPool: "40-50%", kolRefBonus: "3x",
    accent: "#c4a35a", accentSoft: "rgba(196,163,90,0.10)",
    glowA: "rgba(196,163,90,0.08)", glowB: "rgba(160,130,60,0.03)",
    greenCandle: "#22C55E", redCandle: "#6b3a3a", wickColor: "rgba(196,163,90,0.35)",
    bg: "#0a0d0f", cardBg: "rgba(196,163,90,0.025)", tagline: "THE MAIN EVENT",
  },
} as const;

type Phase = keyof typeof PHASES;

interface KOLRewardsData {
  phase: Phase;
  smart_follower_count: number;
  boost_multiplier: number;
}

// ── Candlestick Background ──

function CandlestickBg({ phase }: { phase: Phase }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ candles: [] as any[], orbs: [] as any[], anim: 0, phase });

  useEffect(() => { stateRef.current.phase = phase; }, [phase]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const dpr = window.devicePixelRatio || 2;
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr; ctx.scale(dpr, dpr);

    const st = stateRef.current;
    st.candles = [];
    for (let i = 0; i < 20; i++) {
      const bH = Math.random() * 14 + 4, wT = Math.random() * 10 + 2, wB = Math.random() * 6 + 1;
      st.candles.push({
        x: Math.random() * w, y: Math.random() * h,
        bw: Math.random() * 3 + 1.5, bH, wT, wB, tH: wT + bH + wB,
        g: Math.random() > 0.45, op: Math.random() * 0.18 + 0.03,
        vy: -Math.random() * 0.15 - 0.04, vx: (Math.random() - 0.5) * 0.06,
        dr: Math.random() * Math.PI * 2, ds: Math.random() * 0.005 + 0.002,
        da: Math.random() * 0.25 + 0.08,
        pp: Math.random() * Math.PI * 2, ps: Math.random() * 0.01 + 0.004,
      });
    }
    st.orbs = [];
    for (let i = 0; i < 3; i++) {
      st.orbs.push({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 60 + 30,
        vx: (Math.random() - 0.5) * 0.06, vy: (Math.random() - 0.5) * 0.06,
        op: Math.random() * 0.03 + 0.01, ph: Math.random() * Math.PI * 2,
      });
    }

    function draw() {
      const p = PHASES[st.phase as Phase];
      ctx.clearRect(0, 0, w, h);

      st.orbs.forEach((o: any) => {
        o.x += o.vx; o.y += o.vy; o.ph += 0.003;
        const pl = o.op + Math.sin(o.ph) * 0.008;
        if (o.x < -80) o.x = w + 80; if (o.x > w + 80) o.x = -80;
        if (o.y < -80) o.y = h + 80; if (o.y > h + 80) o.y = -80;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, p.accent + "18"); g.addColorStop(0.6, p.accent + "06"); g.addColorStop(1, "transparent");
        ctx.globalAlpha = Math.max(0, pl); ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
      });

      st.candles.forEach((c: any) => {
        c.dr += c.ds; c.pp += c.ps;
        c.x += c.vx + Math.sin(c.dr) * c.da; c.y += c.vy;
        if (c.y < -c.tH - 10) { c.y = h + 10; c.x = Math.random() * w; c.g = Math.random() > 0.45; }
        if (c.x < -10) c.x = w + 10; if (c.x > w + 10) c.x = -10;
        const al = c.op * (1 + Math.sin(c.pp) * 0.12);
        const bc = c.g ? p.greenCandle : p.redCandle;
        const t = c.y, b = c.y + c.bH, cx = c.x, hw = c.bw / 2;
        ctx.globalAlpha = al * 0.5; ctx.strokeStyle = p.wickColor; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(cx, t - c.wT); ctx.lineTo(cx, t); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, b); ctx.lineTo(cx, b + c.wB); ctx.stroke();
        ctx.globalAlpha = al; ctx.fillStyle = bc;
        const r = Math.min(1, hw * 0.3);
        ctx.beginPath();
        ctx.moveTo(cx - hw + r, t); ctx.lineTo(cx + hw - r, t);
        ctx.quadraticCurveTo(cx + hw, t, cx + hw, t + r);
        ctx.lineTo(cx + hw, b - r); ctx.quadraticCurveTo(cx + hw, b, cx + hw - r, b);
        ctx.lineTo(cx - hw + r, b); ctx.quadraticCurveTo(cx - hw, b, cx - hw, b - r);
        ctx.lineTo(cx - hw, t + r); ctx.quadraticCurveTo(cx - hw, t, cx - hw + r, t);
        ctx.fill();
        if (c.g && al > 0.08) {
          ctx.globalAlpha = al * 0.2; ctx.shadowColor = bc; ctx.shadowBlur = 4;
          ctx.fillRect(cx - hw, t, c.bw, c.bH); ctx.shadowBlur = 0;
        }
      });
      ctx.globalAlpha = 1;
      st.anim = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(st.anim);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />;
}

// ── Sub-components ──

function SmartFollowerBadge({ count, accent }: { count: number; accent: string }) {
  return (
    <div className="flex items-center gap-1 rounded-full text-[10px] font-semibold"
      style={{ background: `${accent}14`, border: `1px solid ${accent}28`, padding: "3px 10px 3px 7px", color: accent }}>
      <Star size={11} fill={accent} color={accent} />
      {count.toLocaleString()} Smart Followers
    </div>
  );
}

const TIER_ICONS = [TrendingUp, Wallet, BarChart3, Link2, Target];

function EarningTier({
  rank, title, subtitle, value, unit, accent, boost, cardBg, idx,
}: {
  rank: number; title: string; subtitle: string; value: string;
  unit: string; accent: string; boost?: string; cardBg: string; idx: number;
}) {
  const Icon = TIER_ICONS[rank - 1];
  return (
    <div className="rw-tier flex items-center gap-3 p-3 rounded-xl relative overflow-hidden"
      style={{
        background: rank === 1 ? `linear-gradient(135deg, ${accent}12, ${accent}05)` : cardBg,
        border: rank === 1 ? `1px solid ${accent}30` : "1px solid rgba(255,255,255,0.05)",
        animationDelay: `${idx * 60}ms`,
      }}>
      {rank === 1 && <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}90, transparent)` }} />}
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: rank <= 2 ? `${accent}18` : "rgba(255,255,255,0.03)" }}>
        <Icon size={16} color={rank <= 2 ? accent : "rgba(255,255,255,0.3)"} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-px">
          <span className="text-[8px] font-bold tracking-wider"
            style={{ color: rank <= 2 ? accent : "rgba(255,255,255,0.25)", fontFamily: "var(--font-mono, monospace)" }}>
            #{rank}
          </span>
          <span className="text-[12px] font-semibold text-white/85">{title}</span>
        </div>
        <p className="text-[10px] text-white/35 leading-snug">{subtitle}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-[15px] font-bold leading-none"
          style={{ color: accent, fontFamily: "var(--font-mono, monospace)" }}>
          {value}
        </div>
        <p className="text-[9px] text-white/30 mt-0.5">{unit}</p>
      </div>
      {boost && (
        <div className="absolute top-1.5 right-1.5 text-[7px] font-bold rounded px-1 py-px"
          style={{ background: `${accent}dd`, color: "#0a0f14" }}>
          {boost}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className="flex-1 rounded-xl p-2.5 text-center"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <p className="text-[9px] font-semibold text-white/30 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-[18px] font-bold leading-none"
        style={{ color: accent, fontFamily: "var(--font-mono, monospace)" }}>
        {value}
      </p>
      {sub && <p className="text-[9px] text-white/25 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Main ──

interface KOLRewardsScreenProps {
  onClose: () => void;
  initialPhase?: Phase;
}

export function KOLRewardsScreen({ onClose, initialPhase = "beta" }: KOLRewardsScreenProps) {
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [trans, setTrans] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [apiData] = useState<KOLRewardsData>({
    phase: "beta", smart_follower_count: 847, boost_multiplier: 4.2,
  });

  const p = PHASES[phase];
  const s1 = phase === "season1";

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const switchPhase = useCallback((np: Phase) => {
    if (np === phase) return;
    setTrans(true);
    setTimeout(() => { setPhase(np); setTimeout(() => setTrans(false), 60); }, 200);
  }, [phase]);

  const tiers = [
    { rank: 1, title: "Copy Volume Earned", subtitle: "Points from users copying your trades", value: p.copyShare, unit: `of points · ${p.multiplier} mult`, boost: "HIGHEST" },
    { rank: 2, title: "Your Own Trading", subtitle: "Volume from your own copy/counter trades", value: "70%", unit: `of your points · ${p.multiplier} mult` },
    { rank: 3, title: "PnL & Leaderboard Shares", subtitle: "Share PnL cards or leaderboard results", value: p.socialMultiplier, unit: "boosted by Smart Followers", boost: "SF BOOST" },
    { rank: 4, title: "Link X & Share Signals", subtitle: "Connect your account, post signals", value: p.socialMultiplier, unit: "boosted by Smart Followers", boost: "SF BOOST" },
    { rank: 5, title: "Signal Quality Bonus", subtitle: "Tweets your LLM qualifies as tradeable signal", value: p.socialMultiplier, unit: "boosted by Smart Followers", boost: "SF BOOST" },
  ];

  const flowSteps = [
    { label: "User copies your signal", Icon: User, desc: "Trades executed on your calls", hl: false },
    { label: "0.1% builder code fee", Icon: Settings, desc: "Collected on every trade", hl: false },
    { label: `You earn ${p.revShare} of fee`, Icon: Diamond, desc: "Paid in USDC on Arbitrum", hl: true },
    { label: `+ ${p.copyShare} of trade points`, Icon: Sparkles, desc: `At ${p.multiplier} multiplier`, hl: true },
  ];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
      style={{
        background: p.bg,
        transition: "background 0.6s ease",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "none" : "translateY(12px)",
        transitionProperty: "opacity, transform, background",
        transitionDuration: "0.4s, 0.4s, 0.6s",
      }}
    >
      <style jsx>{`
        @keyframes rw-fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rw-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }
        @keyframes rw-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes rw-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes rw-glow-line {
          0% { opacity: 0.3; }
          50% { opacity: 0.8; }
          100% { opacity: 0.3; }
        }
        .rw-ca {
          animation: rw-fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .rw-ca-d1 { animation-delay: 0.05s; }
        .rw-ca-d2 { animation-delay: 0.1s; }
        .rw-ca-d3 { animation-delay: 0.15s; }
        .rw-ca-d4 { animation-delay: 0.2s; }
        .rw-ca-d5 { animation-delay: 0.25s; }
        .rw-ca-d6 { animation-delay: 0.3s; }
        .rw-ca-d7 { animation-delay: 0.35s; }
        .rw-pt .rw-ca {
          opacity: 0 !important;
          transform: translateY(10px) !important;
          transition: all 0.2s ease;
          animation: none;
        }
        .rw-tier {
          animation: rw-fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .rw-glass {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
      `}</style>

      <div className="w-full max-w-[430px] mx-auto relative overflow-hidden min-h-screen">
        <CandlestickBg phase={phase} />

        {/* ambient glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full pointer-events-none transition-all duration-[800ms]"
          style={{ background: `radial-gradient(circle, ${p.glowA}, ${p.glowB} 50%, transparent 70%)`, zIndex: 1 }} />

        {/* accent line at top */}
        <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{ zIndex: 3 }}>
          <div className="h-full w-2/3 mx-auto" style={{ background: `linear-gradient(90deg, transparent, ${p.accent}50, transparent)`, animation: "rw-glow-line 3s ease-in-out infinite" }} />
        </div>

        <div className={`relative z-[2] px-4 pb-12 ${trans ? "rw-pt" : ""}`}>

          {/* Header */}
          <div className="rw-ca pt-12 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-bold tracking-[0.12em] rounded-md px-2 py-0.5"
                  style={{ color: p.accent, background: `${p.accent}10`, border: `1px solid ${p.accent}22` }}>
                  KOL PROGRAM
                </span>
                <span className="text-[8px] font-bold tracking-[0.12em]"
                  style={{ color: s1 ? `${p.accent}cc` : "rgba(255,255,255,0.25)", animation: s1 ? "rw-float 2.5s ease-in-out infinite" : "none" }}>
                  {p.tagline}
                </span>
              </div>
              <button onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-white/10 active:scale-95 rw-glass"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <X size={12} className="text-white/40" />
              </button>
            </div>

            {s1 && (
              <div className="text-[9px] font-bold tracking-[0.14em] mb-1.5"
                style={{ background: `linear-gradient(90deg, ${p.accent}, ${p.accent}aa, ${p.accent})`, backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "rw-shimmer 4s linear infinite" }}>
                SEASON 1 IS LIVE
              </div>
            )}

            <h1 className="text-[24px] font-extrabold tracking-tight leading-none text-white/95">
              {s1 ? "Your Season 1 Rewards" : "Your Rewards"}
            </h1>
            <p className="text-[11px] text-white/35 mt-1 leading-snug">
              {s1 ? "The main event — larger pool, compounding multipliers" : "Earn points and revenue from your trading signals"}
            </p>
          </div>

          {/* Phase Toggle */}
          <div className="rw-ca rw-ca-d1 flex rounded-xl p-[2px] mb-5 rw-glass"
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid rgba(255,255,255,0.06)` }}>
            {(Object.entries(PHASES) as [Phase, (typeof PHASES)[Phase]][]).map(([k, v]) => (
              <button key={k} onClick={() => switchPhase(k)}
                className="flex-1 py-2 rounded-[10px] border-none cursor-pointer text-[10px] font-bold tracking-wider transition-all duration-300 active:scale-[0.97]"
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  background: phase === k ? `${v.accent}12` : "transparent",
                  color: phase === k ? v.accent : "rgba(255,255,255,0.25)",
                  boxShadow: phase === k ? `0 0 16px ${v.accent}12, inset 0 0 8px ${v.accent}06` : "none",
                }}>
                {k === "season1" && phase === k && <Crown size={10} className="inline-block mr-1 align-middle" color={v.accent} />}
                {v.label}
                <span className="block text-[8px] font-medium opacity-50 mt-px">{v.duration}</span>
              </button>
            ))}
          </div>

          {/* S1 Banners */}
          {s1 && (
            <>
              <div className="rw-ca rw-ca-d1 rounded-xl p-3 mb-2 flex items-center gap-3"
                style={{ background: `${p.accent}08`, border: `1px solid ${p.accent}18` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${p.accent}15`, animation: "rw-pulse 2.5s ease-in-out infinite" }}>
                  <Crown size={16} color={p.accent} />
                </div>
                <div>
                  <p className="text-[11px] font-bold" style={{ color: p.accent }}>Airdrop Pool: 5x Larger</p>
                  <p className="text-[10px] text-white/35 mt-px">40-50% of total supply distributed this season</p>
                </div>
              </div>
              <div className="rw-ca rw-ca-d2 rounded-xl p-3 mb-5 flex items-center gap-3"
                style={{ background: "rgba(45,212,191,0.04)", border: "1px solid rgba(45,212,191,0.12)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(45,212,191,0.12)" }}>
                  <RefreshCw size={14} color="#2dd4bf" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#2dd4bf]">Beta Users Carried Over</p>
                  <p className="text-[10px] text-white/35 mt-px leading-snug">Points, referrals, and Smart Follower count carry forward automatically.</p>
                </div>
              </div>
            </>
          )}

          {/* Key Stats */}
          <div className="rw-ca rw-ca-d2 flex gap-2 mb-5">
            <StatCard label="Rev Share" value={p.revShare} sub="of 0.1% fee" accent={p.accent} />
            <StatCard label="Referral" value={p.refCommission} sub="point commission" accent={p.accent} />
            <StatCard label="Airdrop" value={p.airdropPool} sub="of total supply" accent={p.accent} />
          </div>

          {/* Smart Follower Boost */}
          <div className="rw-ca rw-ca-d3 rounded-xl p-3 mb-5 flex items-center justify-between"
            style={{ background: `${p.accent}04`, border: `1px solid ${p.accent}10` }}>
            <div>
              <p className="text-[10px] font-semibold text-white/40 mb-1.5">Your Boost Multiplier</p>
              <div className="flex gap-1.5 flex-wrap items-center">
                <SmartFollowerBadge count={apiData.smart_follower_count} accent={p.accent} />
                <div className="inline-flex items-center gap-0.5 text-[9px] font-bold rounded-md px-1.5 py-0.5"
                  style={{ color: p.accent, background: `${p.accent}10`, border: `1px solid ${p.accent}20` }}>
                  <Zap size={9} color={p.accent} />
                  {apiData.boost_multiplier}x
                </div>
              </div>
            </div>
            <p className="text-[9px] text-white/20 text-right max-w-[70px] leading-tight">More Smart Followers = Higher Boost</p>
          </div>

          {/* Earning Tiers */}
          <div className="rw-ca rw-ca-d4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-bold text-white/85">How You Earn</h2>
              <span className="text-[9px] text-white/25">Ordered by magnitude</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {tiers.map((t, i) => (
                <EarningTier key={t.rank} {...t} accent={p.accent} cardBg={p.cardBg} idx={i} />
              ))}
            </div>
          </div>

          {/* Revenue Flow */}
          <div className="rw-ca rw-ca-d5 rounded-xl p-4 mb-5 relative overflow-hidden"
            style={{ background: `${p.accent}05`, border: `1px solid ${p.accent}12` }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${p.accent}40, transparent)`, animation: "rw-glow-line 4s ease-in-out infinite" }} />
            <h3 className="text-[12px] font-bold text-white/70 mb-3">Revenue Flow</h3>
            <div className="flex flex-col">
              {flowSteps.map((step, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2.5 py-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        background: step.hl ? `${p.accent}14` : "rgba(255,255,255,0.03)",
                        border: step.hl ? `1px solid ${p.accent}25` : "1px solid rgba(255,255,255,0.05)",
                      }}>
                      <step.Icon size={13} color={step.hl ? p.accent : "rgba(255,255,255,0.35)"} />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold" style={{ color: step.hl ? p.accent : "rgba(255,255,255,0.65)" }}>{step.label}</p>
                      <p className="text-[9px] text-white/25 mt-px">{step.desc}</p>
                    </div>
                  </div>
                  {i < 3 && <div className="w-px h-2.5 ml-3.5" style={{ background: `linear-gradient(180deg, ${p.accent}25, transparent)` }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Referral Power */}
          <div className="rw-ca rw-ca-d6 rounded-xl p-3.5 mb-5"
            style={{ background: p.cardBg, border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2 mb-2.5">
              <Flame size={14} color={p.accent} />
              <div>
                <p className="text-[12px] font-bold text-white/85">Referral Power</p>
                <p className="text-[9px] text-white/30">Bring high-volume traders, earn more</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              {[
                { v: p.refCommission, l: "Point Commission", c: p.accent },
                { v: p.kolRefBonus, l: "KOL Ref Bonus", c: "#c4a35a" },
                { v: p.revShare, l: "Fee Revenue", c: "#2dd4bf" },
              ].map((d, i) => (
                <div key={i} className="flex-1 rounded-lg p-2.5 text-center transition-all"
                  style={{
                    background: `${d.c}06`,
                    border: `1px solid ${d.c}12`,
                  }}>
                  <p className="text-[16px] font-bold" style={{ color: d.c, fontFamily: "var(--font-mono, monospace)" }}>{d.v}</p>
                  <p className="text-[9px] text-white/30 mt-px">{d.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Phase Context Banner */}
          <div className="rw-ca rw-ca-d7">
            {!s1 ? (
              <div className="rounded-xl p-3.5 text-center relative overflow-hidden"
                style={{ background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.1)" }}>
                <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-white/35 mb-1">
                  <Clock size={10} className="text-white/30" /> Beta ends, Season 1 begins
                </div>
                <p className="text-[11px] text-white/45 leading-relaxed">
                  Multipliers drop to 1x · Referrals drop to 30%<br />
                  <span className="text-purple-400/90 font-semibold">But the airdrop pool grows 5x larger</span>
                </p>
              </div>
            ) : (
              <div className="rounded-xl p-3.5 text-center relative overflow-hidden"
                style={{ background: `${p.accent}06`, border: `1px solid ${p.accent}15` }}>
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${p.accent}60, transparent)`, animation: "rw-shimmer 5s linear infinite", backgroundSize: "200% auto" }} />
                <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-white/35 mb-1">
                  <Target size={10} className="text-white/30" /> Consistency Bonus Active
                </div>
                <p className="text-[11px] text-white/45 leading-relaxed">
                  Maintain weekly signal quality to earn<br />
                  <span className="font-bold" style={{ color: p.accent }}>
                    up to 2x compounding multiplier over time
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* bottom accent */}
          <div className="mt-6 h-px rounded-full mx-8"
            style={{ background: `linear-gradient(90deg, transparent, ${p.accent}30, transparent)`, animation: "rw-pulse 3s ease-in-out infinite" }} />

        </div>
      </div>
    </div>
  );
}