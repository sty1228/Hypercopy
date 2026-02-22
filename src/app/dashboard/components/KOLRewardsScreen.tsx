// ================================================================
// FILE: dashboard/components/KOLRewardsScreen.tsx
// ================================================================

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X, TrendingUp, Wallet, BarChart3, Link2, Target,
  User, Settings, Diamond, Sparkles, ChevronRight,
  Crown, RefreshCw, Flame, Clock, Star, Zap, ArrowRight,
} from "lucide-react";

const PHASES = {
  beta: {
    label: "BETA PHASE", duration: "3 Months", multiplier: "2-5x",
    refCommission: "75%", revShare: "50%", socialMultiplier: "3x",
    copyShare: "30%", airdropPool: "8-10%", kolRefBonus: "5x",
    accent: "#2dd4bf", accent2: "#a78bfa",
    glowA: "rgba(45,212,191,0.12)", glowB: "rgba(45,212,191,0.03)",
    greenCandle: "#2dd4bf", redCandle: "#1a6b5f", wickColor: "rgba(45,212,191,0.4)",
    bg: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)",
    cardBg: "rgba(45,212,191,0.03)", tagline: "EARLY ACCESS",
  },
  season1: {
    label: "SEASON 1", duration: "8 Months", multiplier: "1x → 2x",
    refCommission: "30%", revShare: "25%", socialMultiplier: "1x",
    copyShare: "30%", airdropPool: "40-50%", kolRefBonus: "3x",
    accent: "#c4a35a", accent2: "#a78bfa",
    glowA: "rgba(196,163,90,0.08)", glowB: "rgba(160,130,60,0.02)",
    greenCandle: "#22C55E", redCandle: "#6b3a3a", wickColor: "rgba(196,163,90,0.3)",
    bg: "linear-gradient(180deg, #0c0d0f 0%, #090a0c 100%)",
    cardBg: "rgba(196,163,90,0.02)", tagline: "THE MAIN EVENT",
  },
} as const;

type Phase = keyof typeof PHASES;

// ── Animated Background ──

function AnimatedBg({ phase }: { phase: Phase }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef({ candles: [] as any[], orbs: [] as any[], particles: [] as any[], anim: 0, phase });

  useEffect(() => { st.current.phase = phase; }, [phase]);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 2, 2);
    const resize = () => {
      const w = cv.clientWidth, h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const w = () => cv.clientWidth, h = () => cv.clientHeight;

    const s = st.current;
    s.candles = Array.from({ length: 22 }, () => {
      const bH = Math.random() * 16 + 4, wT = Math.random() * 10 + 2, wB = Math.random() * 6 + 1;
      return {
        x: Math.random() * w(), y: Math.random() * h(),
        bw: Math.random() * 3.5 + 1.5, bH, wT, wB, tH: wT + bH + wB,
        g: Math.random() > 0.42, op: Math.random() * 0.2 + 0.03,
        vy: -Math.random() * 0.18 - 0.04, vx: (Math.random() - 0.5) * 0.08,
        dr: Math.random() * Math.PI * 2, ds: Math.random() * 0.006 + 0.002,
        da: Math.random() * 0.3 + 0.08,
        pp: Math.random() * Math.PI * 2, ps: Math.random() * 0.01 + 0.004,
      };
    });
    s.orbs = Array.from({ length: 4 }, () => ({
      x: Math.random() * w(), y: Math.random() * h(),
      r: Math.random() * 80 + 40,
      vx: (Math.random() - 0.5) * 0.08, vy: (Math.random() - 0.5) * 0.08,
      op: Math.random() * 0.04 + 0.01, ph: Math.random() * Math.PI * 2,
    }));
    s.particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * w(), y: Math.random() * h(),
      r: Math.random() * 1.2 + 0.3, op: Math.random() * 0.3 + 0.05,
      vy: -Math.random() * 0.3 - 0.05, vx: (Math.random() - 0.5) * 0.15,
      pp: Math.random() * Math.PI * 2, ps: Math.random() * 0.02 + 0.005,
    }));

    function draw() {
      const p = PHASES[s.phase as Phase];
      const W = w(), H = h();
      ctx.clearRect(0, 0, W, H);

      // orbs
      s.orbs.forEach((o: any) => {
        o.x += o.vx; o.y += o.vy; o.ph += 0.003;
        if (o.x < -100) o.x = W + 100; if (o.x > W + 100) o.x = -100;
        if (o.y < -100) o.y = H + 100; if (o.y > H + 100) o.y = -100;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, p.accent + "15"); g.addColorStop(0.5, p.accent + "06"); g.addColorStop(1, "transparent");
        ctx.globalAlpha = o.op + Math.sin(o.ph) * 0.01;
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
      });

      // candles
      s.candles.forEach((c: any) => {
        c.dr += c.ds; c.pp += c.ps;
        c.x += c.vx + Math.sin(c.dr) * c.da; c.y += c.vy;
        if (c.y < -c.tH - 10) { c.y = H + 10; c.x = Math.random() * W; c.g = Math.random() > 0.42; }
        if (c.x < -10) c.x = W + 10; if (c.x > W + 10) c.x = -10;
        const al = c.op * (1 + Math.sin(c.pp) * 0.12);
        const bc = c.g ? p.greenCandle : p.redCandle;
        const t = c.y, b = c.y + c.bH, cx = c.x, hw = c.bw / 2;
        ctx.globalAlpha = al * 0.45; ctx.strokeStyle = p.wickColor; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(cx, t - c.wT); ctx.lineTo(cx, t); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, b); ctx.lineTo(cx, b + c.wB); ctx.stroke();
        ctx.globalAlpha = al; ctx.fillStyle = bc;
        ctx.beginPath(); ctx.roundRect(cx - hw, t, c.bw, c.bH, 1); ctx.fill();
        if (c.g && al > 0.06) {
          ctx.globalAlpha = al * 0.15; ctx.shadowColor = bc; ctx.shadowBlur = 6;
          ctx.fill(); ctx.shadowBlur = 0;
        }
      });

      // floating particles
      s.particles.forEach((pt: any) => {
        pt.pp += pt.ps; pt.x += pt.vx; pt.y += pt.vy;
        if (pt.y < -5) { pt.y = H + 5; pt.x = Math.random() * W; }
        if (pt.x < -5) pt.x = W + 5; if (pt.x > W + 5) pt.x = -5;
        const a = pt.op * (0.6 + Math.sin(pt.pp) * 0.4);
        ctx.globalAlpha = a; ctx.fillStyle = p.accent;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.fill();
      });

      ctx.globalAlpha = 1;
      s.anim = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(s.anim);
  }, []);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />;
}

// ── Sub-components ──

function SFBadge({ count, accent }: { count: number; accent: string }) {
  return (
    <div className="flex items-center gap-1 rounded-full text-[10px] font-semibold"
      style={{ background: `${accent}12`, border: `1px solid ${accent}22`, padding: "3px 10px 3px 7px", color: accent }}>
      <Star size={10} fill={accent} color={accent} />
      {count.toLocaleString()} Smart Followers
    </div>
  );
}

function BoostBar({ value, accent }: { value: number; accent: string }) {
  const pct = Math.min((value / 10) * 100, 100);
  return (
    <div className="mt-2 w-full">
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div className="h-full rounded-full transition-all duration-1000 ease-out relative"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent}60, ${accent})` }}>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
            style={{ background: accent, boxShadow: `0 0 6px ${accent}80` }} />
        </div>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] text-white/20">1x</span>
        <span className="text-[8px] text-white/20">10x</span>
      </div>
    </div>
  );
}

const TIER_ICONS = [TrendingUp, Wallet, BarChart3, Link2, Target];

function Tier({
  rank, title, subtitle, value, unit, accent, accent2, boost, cardBg, idx,
}: {
  rank: number; title: string; subtitle: string; value: string;
  unit: string; accent: string; accent2: string; boost?: string; cardBg: string; idx: number;
}) {
  const Ic = TIER_ICONS[rank - 1];
  const isTop = rank === 1;
  return (
    <div className="rw-tier flex items-center gap-3 p-3 rounded-xl relative overflow-hidden group"
      style={{
        background: isTop ? `linear-gradient(135deg, ${accent}10, ${accent2}06)` : cardBg,
        border: isTop ? `1px solid ${accent}28` : "1px solid rgba(255,255,255,0.04)",
        animationDelay: `${idx * 50}ms`,
      }}>
      {isTop && <>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}80, transparent)` }} />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 30% 50%, ${accent}08, transparent 60%)` }} />
      </>}
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: rank <= 2 ? `${accent}15` : "rgba(255,255,255,0.025)" }}>
        <Ic size={14} color={rank <= 2 ? accent : "rgba(255,255,255,0.25)"} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-px">
          <span className="text-[8px] font-bold tracking-wider"
            style={{ color: rank <= 2 ? accent : "rgba(255,255,255,0.2)", fontFamily: "var(--font-mono, monospace)" }}>
            #{rank}
          </span>
          <span className="text-[11px] font-semibold text-white/80">{title}</span>
        </div>
        <p className="text-[9.5px] text-white/30 leading-snug">{subtitle}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-[14px] font-bold leading-none"
          style={{ color: accent, fontFamily: "var(--font-mono, monospace)" }}>
          {value}
        </div>
        <p className="text-[8px] text-white/25 mt-0.5">{unit}</p>
      </div>
      {boost && (
        <div className="absolute top-1.5 right-1.5 text-[6.5px] font-bold rounded px-1 py-px"
          style={{ background: `${accent}cc`, color: "#0a0f14" }}>
          {boost}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className="flex-1 rounded-xl p-2.5 text-center relative overflow-hidden group"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 50%, ${accent}08, transparent 70%)` }} />
      <p className="text-[8px] font-semibold text-white/25 uppercase tracking-wider mb-1 relative">{label}</p>
      <p className="text-[17px] font-bold leading-none relative"
        style={{ color: accent, fontFamily: "var(--font-mono, monospace)" }}>
        {value}
      </p>
      {sub && <p className="text-[8px] text-white/20 mt-0.5 relative">{sub}</p>}
    </div>
  );
}

// ── Main ──

interface Props { onClose: () => void; initialPhase?: Phase; }

export function KOLRewardsScreen({ onClose, initialPhase = "beta" }: Props) {
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [trans, setTrans] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sfCount = 847, boostMult = 4.2;

  const p = PHASES[phase];
  const s1 = phase === "season1";

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const sw = useCallback((np: Phase) => {
    if (np === phase) return;
    setTrans(true);
    setTimeout(() => { setPhase(np); setTimeout(() => setTrans(false), 60); }, 200);
  }, [phase]);

  const tiers = [
    { rank: 1, title: "Copy Volume Earned", subtitle: "Points from users copying your trades", value: p.copyShare, unit: `of pts · ${p.multiplier} mult`, boost: "HIGHEST" },
    { rank: 2, title: "Your Own Trading", subtitle: "Volume from your own copy/counter trades", value: "70%", unit: `of your pts · ${p.multiplier} mult` },
    { rank: 3, title: "PnL & Leaderboard Shares", subtitle: "Share PnL cards or leaderboard results", value: p.socialMultiplier, unit: "boosted by Smart Followers", boost: "SF BOOST" },
    { rank: 4, title: "Link X & Share Signals", subtitle: "Connect your account, post signals", value: p.socialMultiplier, unit: "boosted by Smart Followers", boost: "SF BOOST" },
    { rank: 5, title: "Signal Quality Bonus", subtitle: "LLM-qualified tradeable signal tweets", value: p.socialMultiplier, unit: "boosted by Smart Followers", boost: "SF BOOST" },
  ];

  const flow = [
    { label: "User copies your signal", Icon: User, desc: "Trades executed on your calls", hl: false },
    { label: "0.1% builder code fee", Icon: Settings, desc: "Collected on every trade", hl: false },
    { label: `You earn ${p.revShare} of fee`, Icon: Diamond, desc: "Paid in USDC on Arbitrum", hl: true },
    { label: `+ ${p.copyShare} of trade points`, Icon: Sparkles, desc: `At ${p.multiplier} multiplier`, hl: true },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
      style={{
        background: p.bg, transition: "background 0.6s ease, opacity 0.4s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1)",
        opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(8px)",
      }}>
      <style jsx>{`
        @keyframes rw-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes rw-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        @keyframes rw-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes rw-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        @keyframes rw-glow { 0% { opacity: 0.2; } 50% { opacity: 0.7; } 100% { opacity: 0.2; } }
        @keyframes rw-scan { 0% { left: -30%; } 100% { left: 130%; } }
        .rw-s { animation: rw-up 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .d1{animation-delay:.04s} .d2{animation-delay:.08s} .d3{animation-delay:.12s}
        .d4{animation-delay:.16s} .d5{animation-delay:.20s} .d6{animation-delay:.24s} .d7{animation-delay:.28s}
        .rw-t .rw-s { opacity:0!important; transform:translateY(8px)!important; transition:all .2s ease; animation:none; }
        .rw-tier { animation: rw-up 0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .rw-scan { position:relative; overflow:hidden; }
        .rw-scan::after {
          content:''; position:absolute; top:0; width:30%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.03),transparent);
          animation: rw-scan 4s ease-in-out infinite;
        }
      `}</style>

      <div className="relative min-h-screen overflow-hidden">
        <AnimatedBg phase={phase} />

        {/* top glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full pointer-events-none transition-all duration-700"
          style={{ background: `radial-gradient(ellipse, ${p.glowA}, ${p.glowB} 50%, transparent 70%)`, zIndex: 1 }} />

        {/* side accents */}
        <div className="absolute top-0 left-0 w-px h-full pointer-events-none" style={{ zIndex: 3 }}>
          <div className="w-full h-1/3 mt-20" style={{ background: `linear-gradient(180deg, ${p.accent}15, transparent)` }} />
        </div>
        <div className="absolute top-0 right-0 w-px h-full pointer-events-none" style={{ zIndex: 3 }}>
          <div className="w-full h-1/4 mt-32" style={{ background: `linear-gradient(180deg, ${p.accent}10, transparent)` }} />
        </div>

        {/* top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{ zIndex: 3 }}>
          <div className="h-full w-1/2 mx-auto" style={{ background: `linear-gradient(90deg, transparent, ${p.accent}40, transparent)`, animation: "rw-glow 3s ease-in-out infinite" }} />
        </div>

        <div className={`relative z-[2] px-3 pb-12 ${trans ? "rw-t" : ""}`}>

          {/* ── Header ── */}
          <div className="rw-s pt-6 mb-5">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-bold tracking-[0.12em] rounded-md px-1.5 py-0.5"
                  style={{ color: p.accent, background: `${p.accent}0d`, border: `1px solid ${p.accent}1a` }}>
                  KOL PROGRAM
                </span>
                <span className="text-[8px] font-bold tracking-[0.1em]"
                  style={{ color: s1 ? `${p.accent}bb` : "rgba(255,255,255,0.2)", animation: s1 ? "rw-float 3s ease-in-out infinite" : "none" }}>
                  {p.tagline}
                </span>
              </div>
              <button onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-white/8 active:scale-95"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}>
                <X size={11} className="text-white/35" />
              </button>
            </div>

            {s1 && (
              <div className="text-[9px] font-bold tracking-[0.14em] mb-1"
                style={{ background: `linear-gradient(90deg, ${p.accent}ee, ${p.accent}88, ${p.accent}ee)`, backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "rw-shimmer 4s linear infinite" }}>
                SEASON 1 IS LIVE
              </div>
            )}

            <h1 className="text-xl font-extrabold tracking-tight leading-none text-white/93">
              {s1 ? "Your Season 1 Rewards" : "Your Rewards"}
            </h1>
            <p className="text-[11px] text-white/30 mt-1">
              {s1 ? "The main event — larger pool, compounding multipliers" : "Earn points and revenue from your trading signals"}
            </p>
          </div>

          {/* ── Toggle ── */}
          <div className="rw-s d1 flex rounded-xl p-[2px] mb-4"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}>
            {(Object.entries(PHASES) as [Phase, (typeof PHASES)[Phase]][]).map(([k, v]) => (
              <button key={k} onClick={() => sw(k)}
                className="flex-1 py-2 rounded-[10px] cursor-pointer text-[10px] font-bold tracking-wider transition-all duration-300 active:scale-[0.97] border-none"
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  background: phase === k ? `${v.accent}0e` : "transparent",
                  color: phase === k ? v.accent : "rgba(255,255,255,0.2)",
                  boxShadow: phase === k ? `0 0 14px ${v.accent}10, inset 0 0 6px ${v.accent}06` : "none",
                }}>
                {k === "season1" && phase === k && <Crown size={9} className="inline-block mr-1 align-middle" color={v.accent} />}
                {v.label}
                <span className="block text-[8px] font-medium opacity-40 mt-px">{v.duration}</span>
              </button>
            ))}
          </div>

          {/* ── S1 Banners ── */}
          {s1 && <>
            <div className="rw-s d1 rw-scan rounded-xl p-3 mb-2 flex items-center gap-3"
              style={{ background: `linear-gradient(135deg, ${p.accent}08, ${p.accent}03)`, border: `1px solid ${p.accent}15` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${p.accent}12`, animation: "rw-pulse 2.5s ease-in-out infinite" }}>
                <Crown size={14} color={p.accent} />
              </div>
              <div>
                <p className="text-[10.5px] font-bold" style={{ color: p.accent }}>Airdrop Pool: 5x Larger</p>
                <p className="text-[9px] text-white/30 mt-px">40-50% of total supply distributed this season</p>
              </div>
            </div>
            <div className="rw-s d2 rounded-xl p-3 mb-4 flex items-center gap-3"
              style={{ background: "rgba(45,212,191,0.03)", border: "1px solid rgba(45,212,191,0.08)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(45,212,191,0.08)" }}>
                <RefreshCw size={13} color="#2dd4bf" />
              </div>
              <div>
                <p className="text-[10.5px] font-bold text-[#2dd4bf]">Beta Users Carried Over</p>
                <p className="text-[9px] text-white/30 mt-px leading-snug">Points, referrals, and Smart Follower count carry forward.</p>
              </div>
            </div>
          </>}

          {/* ── Stats ── */}
          <div className="rw-s d2 flex gap-2 mb-4">
            <Stat label="Rev Share" value={p.revShare} sub="of 0.1% fee" accent={p.accent} />
            <Stat label="Referral" value={p.refCommission} sub="point commission" accent={p.accent} />
            <Stat label="Airdrop" value={p.airdropPool} sub="of total supply" accent={p.accent} />
          </div>

          {/* ── Boost ── */}
          <div className="rw-s d3 rounded-xl p-3 mb-4 rw-scan"
            style={{ background: `linear-gradient(135deg, ${p.accent}04, transparent)`, border: `1px solid ${p.accent}0c` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-semibold text-white/35 mb-1.5">Your Boost Multiplier</p>
                <div className="flex gap-1.5 items-center">
                  <SFBadge count={sfCount} accent={p.accent} />
                  <div className="flex items-center gap-0.5 text-[9px] font-bold rounded-md px-1.5 py-0.5"
                    style={{ color: p.accent, background: `${p.accent}0d`, border: `1px solid ${p.accent}18` }}>
                    <Zap size={8} color={p.accent} />
                    {boostMult}x
                  </div>
                </div>
              </div>
              <p className="text-[8px] text-white/18 text-right max-w-[65px] leading-tight">More Smart Followers = Higher Boost</p>
            </div>
            <BoostBar value={boostMult} accent={p.accent} />
          </div>

          {/* ── divider ── */}
          <div className="h-px mx-6 mb-4" style={{ background: `linear-gradient(90deg, transparent, ${p.accent}15, transparent)` }} />

          {/* ── Tiers ── */}
          <div className="rw-s d4 mb-4">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-[12px] font-bold text-white/80">How You Earn</h2>
              <span className="text-[8px] text-white/20">Ordered by magnitude</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {tiers.map((t, i) => <Tier key={t.rank} {...t} accent={p.accent} accent2={p.accent2} cardBg={p.cardBg} idx={i} />)}
            </div>
          </div>

          {/* ── Revenue Flow ── */}
          <div className="rw-s d5 rounded-xl p-3.5 mb-4 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${p.accent}05, ${p.accent2}03)`, border: `1px solid ${p.accent}0e` }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${p.accent}35, transparent)`, animation: "rw-glow 4s ease-in-out infinite" }} />
            <h3 className="text-[11px] font-bold text-white/65 mb-3">Revenue Flow</h3>
            {flow.map((s, i) => (
              <div key={i}>
                <div className="flex items-center gap-2.5 py-1.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: s.hl ? `${p.accent}10` : "rgba(255,255,255,0.02)",
                      border: s.hl ? `1px solid ${p.accent}20` : "1px solid rgba(255,255,255,0.04)",
                    }}>
                    <s.Icon size={12} color={s.hl ? p.accent : "rgba(255,255,255,0.3)"} />
                  </div>
                  <div>
                    <p className="text-[10.5px] font-semibold" style={{ color: s.hl ? p.accent : "rgba(255,255,255,0.6)" }}>{s.label}</p>
                    <p className="text-[8.5px] text-white/22 mt-px">{s.desc}</p>
                  </div>
                  {s.hl && <ArrowRight size={10} className="ml-auto text-white/10" />}
                </div>
                {i < 3 && <div className="w-px h-2 ml-3.5" style={{ background: `linear-gradient(180deg, ${p.accent}20, transparent)` }} />}
              </div>
            ))}
          </div>

          {/* ── Referral ── */}
          <div className="rw-s d6 rounded-xl p-3.5 mb-4"
            style={{ background: p.cardBg, border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-2 mb-2.5">
              <Flame size={13} color={p.accent} />
              <div>
                <p className="text-[11px] font-bold text-white/80">Referral Power</p>
                <p className="text-[8.5px] text-white/25">Bring high-volume traders, earn more</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              {[
                { v: p.refCommission, l: "Point Commission", c: p.accent },
                { v: p.kolRefBonus, l: "KOL Ref Bonus", c: "#c4a35a" },
                { v: p.revShare, l: "Fee Revenue", c: "#2dd4bf" },
              ].map((d, i) => (
                <div key={i} className="flex-1 rounded-lg p-2 text-center rw-scan"
                  style={{ background: `${d.c}05`, border: `1px solid ${d.c}0d` }}>
                  <p className="text-[15px] font-bold" style={{ color: d.c, fontFamily: "var(--font-mono, monospace)" }}>{d.v}</p>
                  <p className="text-[8px] text-white/25 mt-px">{d.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Phase Banner ── */}
          <div className="rw-s d7">
            {!s1 ? (
              <div className="rounded-xl p-3.5 text-center relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${p.accent2}06, transparent)`, border: `1px solid ${p.accent2}0e` }}>
                <div className="inline-flex items-center gap-1 text-[9px] font-semibold text-white/30 mb-1">
                  <Clock size={9} /> Beta ends, Season 1 begins
                </div>
                <p className="text-[10px] text-white/40 leading-relaxed">
                  Multipliers drop to 1x · Referrals drop to 30%<br />
                  <span className="font-semibold" style={{ color: `${p.accent2}cc` }}>But the airdrop pool grows 5x larger</span>
                </p>
              </div>
            ) : (
              <div className="rounded-xl p-3.5 text-center relative overflow-hidden"
                style={{ background: `${p.accent}05`, border: `1px solid ${p.accent}10` }}>
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${p.accent}50, transparent)`, animation: "rw-shimmer 5s linear infinite", backgroundSize: "200% auto" }} />
                <div className="inline-flex items-center gap-1 text-[9px] font-semibold text-white/30 mb-1">
                  <Target size={9} /> Consistency Bonus Active
                </div>
                <p className="text-[10px] text-white/40 leading-relaxed">
                  Maintain weekly signal quality to earn<br />
                  <span className="font-bold" style={{ color: p.accent }}>up to 2x compounding multiplier over time</span>
                </p>
              </div>
            )}
          </div>

          {/* bottom glow */}
          <div className="mt-8 h-px mx-10" style={{ background: `linear-gradient(90deg, transparent, ${p.accent}20, transparent)`, animation: "rw-pulse 3s ease-in-out infinite" }} />
        </div>
      </div>
    </div>
  );
}