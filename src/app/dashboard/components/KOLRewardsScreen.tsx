
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X, TrendingUp, Wallet, BarChart3, Link2, Target,
  User, Settings, Diamond, Sparkles, ChevronRight,
  Crown, RefreshCw, Flame, Clock, Star,
} from "lucide-react";

const PHASES = {
  beta: {
    label: "BETA PHASE", duration: "3 Months", multiplier: "2-5x",
    refCommission: "75%", revShare: "50%", socialMultiplier: "3x",
    copyShare: "30%", airdropPool: "8-10%", kolRefBonus: "5x",
    accent: "#00F0FF",
    glowA: "rgba(0,240,255,0.12)", glowB: "rgba(0,180,220,0.06)",
    greenCandle: "#00E5A0", redCandle: "#00899A", wickColor: "#00F0FF",
    bg: "#08080D", cardBg: "rgba(0,240,255,0.03)", tagline: "EARLY ACCESS",
  },
  season1: {
    label: "SEASON 1", duration: "8 Months", multiplier: "1x → 2x",
    refCommission: "30%", revShare: "25%", socialMultiplier: "1x",
    copyShare: "30%", airdropPool: "40-50%", kolRefBonus: "3x",
    accent: "#F5A623",
    glowA: "rgba(245,166,35,0.14)", glowB: "rgba(200,120,20,0.08)",
    greenCandle: "#22C55E", redCandle: "#EF4444", wickColor: "rgba(255,255,255,0.25)",
    bg: "#0A0908", cardBg: "rgba(245,166,35,0.03)", tagline: "THE MAIN EVENT",
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
  const candlesRef = useRef<any[]>([]);
  const orbsRef = useRef<any[]>([]);
  const animRef = useRef<number>(0);
  const phaseRef = useRef(phase);

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const w = 393, h = 2200;
    cv.width = w * 2; cv.height = h * 2; ctx.scale(2, 2);

    const cs: any[] = [];
    for (let i = 0; i < 24; i++) {
      const bH = Math.random() * 18 + 6, wT = Math.random() * 12 + 3, wB = Math.random() * 8 + 2;
      cs.push({
        x: Math.random() * w, y: Math.random() * h,
        bw: Math.random() * 4 + 2.5, bH, wT, wB, tH: wT + bH + wB,
        g: Math.random() > 0.4, op: Math.random() * 0.25 + 0.05,
        vy: -Math.random() * 0.2 - 0.06, vx: (Math.random() - 0.5) * 0.1,
        dr: Math.random() * Math.PI * 2, ds: Math.random() * 0.007 + 0.003,
        da: Math.random() * 0.35 + 0.1,
        pp: Math.random() * Math.PI * 2, ps: Math.random() * 0.012 + 0.006,
      });
    }
    candlesRef.current = cs;

    const os: any[] = [];
    for (let i = 0; i < 3; i++) {
      os.push({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 80 + 40,
        vx: (Math.random() - 0.5) * 0.1, vy: (Math.random() - 0.5) * 0.1,
        op: Math.random() * 0.04 + 0.02, ph: Math.random() * Math.PI * 2,
      });
    }
    orbsRef.current = os;

    function draw() {
      const p = PHASES[phaseRef.current];
      ctx.clearRect(0, 0, w, h);

      orbsRef.current.forEach((o) => {
        o.x += o.vx; o.y += o.vy; o.ph += 0.004;
        const pl = o.op + Math.sin(o.ph) * 0.012;
        if (o.x < -100) o.x = w + 100; if (o.x > w + 100) o.x = -100;
        if (o.y < -100) o.y = h + 100; if (o.y > h + 100) o.y = -100;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, p.accent + "12"); g.addColorStop(0.5, p.accent + "05"); g.addColorStop(1, "transparent");
        ctx.globalAlpha = Math.max(0, pl); ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
      });

      candlesRef.current.forEach((c) => {
        c.dr += c.ds; c.pp += c.ps;
        c.x += c.vx + Math.sin(c.dr) * c.da; c.y += c.vy;
        if (c.y < -c.tH - 20) { c.y = h + 20; c.x = Math.random() * w; c.g = Math.random() > 0.4; }
        if (c.x < -20) c.x = w + 20; if (c.x > w + 20) c.x = -20;
        const al = c.op * (1 + Math.sin(c.pp) * 0.15);
        const bc = c.g ? p.greenCandle : p.redCandle;
        const t = c.y, b = c.y + c.bH, cx = c.x, hw = c.bw / 2;
        ctx.globalAlpha = al * 0.6; ctx.strokeStyle = p.wickColor; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(cx, t - c.wT); ctx.lineTo(cx, t); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, b); ctx.lineTo(cx, b + c.wB); ctx.stroke();
        ctx.globalAlpha = al; ctx.fillStyle = bc;
        const r = Math.min(1.2, hw * 0.3);
        ctx.beginPath();
        ctx.moveTo(cx - hw + r, t); ctx.lineTo(cx + hw - r, t);
        ctx.quadraticCurveTo(cx + hw, t, cx + hw, t + r);
        ctx.lineTo(cx + hw, b - r); ctx.quadraticCurveTo(cx + hw, b, cx + hw - r, b);
        ctx.lineTo(cx - hw + r, b); ctx.quadraticCurveTo(cx - hw, b, cx - hw, b - r);
        ctx.lineTo(cx - hw, t + r); ctx.quadraticCurveTo(cx - hw, t, cx - hw + r, t);
        ctx.fill();
        if (c.g && al > 0.1) {
          ctx.globalAlpha = al * 0.25; ctx.shadowColor = bc; ctx.shadowBlur = 6;
          ctx.fillRect(cx - hw, t, c.bw, c.bH); ctx.shadowBlur = 0;
        }
      });
      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width: 393, height: 2200, zIndex: 0 }}
    />
  );
}

// ── Sub-components ──

function SmartFollowerBadge({ count, accent }: { count: number; accent: string }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-full text-[11px] font-semibold"
      style={{
        background: `linear-gradient(135deg, ${accent}18, ${accent}08)`,
        border: `1px solid ${accent}30`,
        padding: "4px 12px 4px 8px",
        color: accent,
      }}
    >
      <Star size={13} fill={accent} color={accent} />
      {count.toLocaleString()} Smart Followers
    </div>
  );
}

const TIER_ICONS = [TrendingUp, Wallet, BarChart3, Link2, Target];

function EarningTier({
  rank, title, subtitle, value, unit, accent, boost, cardBg,
}: {
  rank: number; title: string; subtitle: string; value: string;
  unit: string; accent: string; boost?: string; cardBg: string;
}) {
  const Icon = TIER_ICONS[rank - 1];
  return (
    <div
      className="flex items-center gap-3.5 p-4 rounded-2xl relative overflow-hidden"
      style={{
        background: rank === 1 ? `linear-gradient(135deg, ${accent}14, ${accent}06)` : cardBg,
        border: rank === 1 ? `1px solid ${accent}35` : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {rank === 1 && (
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />
      )}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: rank <= 2 ? `linear-gradient(135deg, ${accent}25, ${accent}10)` : "rgba(255,255,255,0.04)" }}
      >
        <Icon size={20} color={rank <= 2 ? accent : "rgba(255,255,255,0.4)"} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[9px] font-bold tracking-wider"
            style={{ color: rank <= 2 ? accent : "rgba(255,255,255,0.35)", fontFamily: "var(--font-mono, monospace)" }}>
            #{rank}
          </span>
          <span className="text-[13.5px] font-semibold text-white/90">{title}</span>
        </div>
        <p className="text-[11.5px] text-white/40 leading-tight">{subtitle}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-lg font-bold leading-none"
          style={{ color: accent, fontFamily: "var(--font-mono, monospace)" }}>
          {value}
        </div>
        <p className="text-[10px] text-white/35 mt-0.5 font-medium">{unit}</p>
      </div>
      {boost && (
        <div className="absolute top-2 right-2 text-[8px] font-bold rounded-md px-1.5 py-0.5"
          style={{ background: accent, color: "#0D0D12" }}>
          {boost}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className="flex-1 rounded-[14px] p-3 text-center"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-[22px] font-bold leading-none"
        style={{ color: accent, fontFamily: "var(--font-mono, monospace)" }}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-white/30 mt-1">{sub}</p>}
    </div>
  );
}

// ── Main Screen ──

interface KOLRewardsScreenProps {
  onClose: () => void;
  initialPhase?: Phase;
}

export function KOLRewardsScreen({ onClose, initialPhase = "beta" }: KOLRewardsScreenProps) {
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [trans, setTrans] = useState(false);
  const [apiData, setApiData] = useState<KOLRewardsData>({
    phase: "beta",
    smart_follower_count: 847,
    boost_multiplier: 4.2,
  });

  const p = PHASES[phase];
  const s1 = phase === "season1";

  // TODO: uncomment when API is ready
  // useEffect(() => {
  //   fetch("/api/kol/rewards")
  //     .then((r) => r.json())
  //     .then(setApiData)
  //     .catch(console.error);
  // }, []);

  const switchPhase = useCallback((np: Phase) => {
    if (np === phase) return;
    setTrans(true);
    setTimeout(() => { setPhase(np); setTimeout(() => setTrans(false), 50); }, 250);
  }, [phase]);

  const tiers = [
    { rank: 1, title: "Copy Volume Earned", subtitle: "Points from users copying your trades", value: p.copyShare, unit: `of points · ${p.multiplier} mult`, boost: "HIGHEST" },
    { rank: 2, title: "Your Own Trading", subtitle: "Volume from your own copy/counter trades", value: "70%", unit: `of your points · ${p.multiplier} mult` },
    { rank: 3, title: "PnL & Leaderboard Shares", subtitle: "Share PnL cards or leaderboard results", value: p.socialMultiplier, unit: "boosted by Smart Followers", boost: "SF BOOST" },
    { rank: 4, title: "Link X & Share Signals", subtitle: "Connect your account, post signals", value: p.socialMultiplier, unit: "boosted by Smart Followers", boost: "SF BOOST" },
    { rank: 5, title: "Signal Quality Bonus", subtitle: "Tweets your LLM qualifies as tradeable signal, not noise", value: p.socialMultiplier, unit: "boosted by Smart Followers", boost: "SF BOOST" },
  ];

  const flowSteps = [
    { label: "User copies your signal", Icon: User, desc: "Trades executed on your calls", hl: false },
    { label: "0.1% builder code fee", Icon: Settings, desc: "Collected on every trade", hl: false },
    { label: `You earn ${p.revShare} of fee`, Icon: Diamond, desc: "Paid in USDC/SOL", hl: true },
    { label: `+ ${p.copyShare} of trade points`, Icon: Sparkles, desc: `At ${p.multiplier} multiplier`, hl: true },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: p.bg, transition: "background 0.5s ease" }}>
      <style jsx>{`
        @keyframes rw-fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes rw-pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes rw-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes rw-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .rw-content { animation: rw-fadeIn 0.4s ease both; }
        .rw-phase-trans .rw-content { opacity: 0; transform: translateY(8px); transition: all 0.25s ease; }
      `}</style>

      <div className="max-w-[393px] mx-auto relative overflow-hidden min-h-screen">
        <CandlestickBg phase={phase} />

        <div className="absolute -top-[120px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${p.glowA}, ${p.glowB} 50%, transparent 70%)`, zIndex: 1, transition: "background 0.8s ease" }} />

        {s1 && (
          <div className="absolute top-[30px] left-1/2 -translate-x-1/2 w-[200px] h-[200px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(245,166,35,0.2), transparent 70%)", zIndex: 1, animation: "rw-pulse 3s ease-in-out infinite" }} />
        )}

        <div className={`relative z-[2] px-5 pb-10 ${trans ? "rw-phase-trans" : ""}`}>

          {/* Header */}
          <div className="rw-content pt-5 mb-7">
            <div className="flex justify-end mb-4">
              <button onClick={onClose}
                className="w-8 h-8 rounded-[10px] flex items-center justify-center cursor-pointer transition-all hover:bg-white/10"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <X size={14} className="text-white/50" />
              </button>
            </div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[9px] font-bold tracking-[0.14em] rounded-md px-2 py-0.5"
                style={{ color: p.accent, background: `${p.accent}12`, border: `1px solid ${p.accent}30` }}>
                KOL PROGRAM
              </span>
              <span className="text-[9px] font-bold tracking-[0.14em]"
                style={{ color: s1 ? "#FFD700" : "rgba(255,255,255,0.3)", animation: s1 ? "rw-float 2s ease-in-out infinite" : "none" }}>
                {p.tagline}
              </span>
            </div>
            {s1 && (
              <div className="text-[11px] font-bold tracking-[0.15em] mb-2"
                style={{ background: "linear-gradient(90deg, #FFD700, #F5A623, #FF8C00, #FFD700)", backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "rw-shimmer 3s linear infinite" }}>
                SEASON 1 IS LIVE
              </div>
            )}
            <h1 className="text-[30px] font-extrabold tracking-tight leading-none"
              style={{ color: s1 ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.95)" }}>
              {s1 ? "Your Season 1 Rewards" : "Your Rewards"}
            </h1>
            <p className="text-[13px] text-white/40 mt-1.5 leading-snug">
              {s1 ? "The main event — larger pool, compounding multipliers" : "Earn points and revenue from your trading signals"}
            </p>
          </div>

          {/* Phase Toggle */}
          <div className="flex rounded-[14px] p-[3px] mb-6"
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${s1 ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.06)"}` }}>
            {(Object.entries(PHASES) as [Phase, (typeof PHASES)[Phase]][]).map(([k, v]) => (
              <button key={k} onClick={() => switchPhase(k)}
                className="flex-1 py-2.5 rounded-[11px] border-none cursor-pointer text-[11px] font-bold tracking-wider transition-all duration-300"
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  background: phase === k ? `linear-gradient(135deg, ${v.accent}22, ${v.accent}10)` : "transparent",
                  color: phase === k ? v.accent : "rgba(255,255,255,0.3)",
                  boxShadow: phase === k ? (k === "season1" ? `0 0 24px ${v.accent}20, inset 0 0 12px ${v.accent}08` : `0 0 20px ${v.accent}15`) : "none",
                }}>
                {k === "season1" && phase === k && <Crown size={12} className="inline-block mr-1 align-middle" color="#FFD700" />}
                {v.label}
                <span className="block text-[9px] font-medium opacity-60 mt-0.5">{v.duration}</span>
              </button>
            ))}
          </div>

          <div className="rw-content">

            {/* S1 Banners */}
            {s1 && (
              <>
                <div className="rounded-2xl p-3.5 mb-2.5 flex items-center gap-3"
                  style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.1), rgba(255,140,0,0.05))", border: "1px solid rgba(245,166,35,0.2)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, rgba(255,215,0,0.25), rgba(245,166,35,0.15))", animation: "rw-pulse 2s ease-in-out infinite" }}>
                    <Crown size={20} color="#FFD700" />
                  </div>
                  <div>
                    <p className="text-[12.5px] font-bold text-[#FFD700]">Airdrop Pool: 5x Larger</p>
                    <p className="text-[11px] text-white/40 mt-0.5">40-50% of total supply distributed this season</p>
                  </div>
                </div>
                <div className="rounded-2xl p-3.5 mb-5 flex items-center gap-3"
                  style={{ background: "linear-gradient(135deg, rgba(0,240,255,0.06), rgba(245,166,35,0.04))", border: "1px solid rgba(0,240,255,0.15)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, rgba(0,240,255,0.18), rgba(0,200,212,0.1))" }}>
                    <RefreshCw size={18} color="#00F0FF" />
                  </div>
                  <div>
                    <p className="text-[12.5px] font-bold text-[#00F0FF]">Beta Users Carried Over</p>
                    <p className="text-[11px] text-white/40 mt-0.5 leading-snug">All signed-up users from Beta are automatically enrolled. Points, referrals, and Smart Follower count carry forward.</p>
                  </div>
                </div>
              </>
            )}

            {/* Key Stats */}
            <div className="flex gap-2 mb-6">
              <StatCard label="Rev Share" value={p.revShare} sub="of 0.1% builder fee" accent={p.accent} />
              <StatCard label="Referral" value={p.refCommission} sub="point commission" accent={p.accent} />
              <StatCard label="Airdrop" value={p.airdropPool} sub="of total supply" accent={p.accent} />
            </div>

            {/* Smart Follower Boost */}
            <div className="rounded-2xl p-3.5 mb-6 flex items-center justify-between"
              style={{ background: p.cardBg, border: `1px solid ${p.accent}12` }}>
              <div>
                <p className="text-[11px] font-semibold text-white/50 mb-1">Your Boost Multiplier</p>
                <div className="flex gap-1.5 flex-wrap">
                  <SmartFollowerBadge count={apiData.smart_follower_count} accent={p.accent} />
                  <div className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-lg px-2 py-0.5"
                    style={{ color: p.accent, background: `${p.accent}12`, border: `1px solid ${p.accent}25` }}>
                    <ChevronRight size={10} color={p.accent} />
                    {apiData.boost_multiplier}x BOOST
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-white/25 text-right max-w-[80px] leading-tight">More Smart Followers = Higher Boost</p>
            </div>

            {/* Earning Tiers */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-[16px] font-bold text-white/90">How You Earn</h2>
                <span className="text-[10px] text-white/30 font-medium">Ordered by magnitude</span>
              </div>
              <div className="flex flex-col gap-2">
                {tiers.map((t) => (
                  <EarningTier key={t.rank} {...t} accent={p.accent} cardBg={p.cardBg} />
                ))}
              </div>
            </div>

            {/* Revenue Flow */}
            <div className="rounded-[18px] p-5 mb-6"
              style={{ background: `linear-gradient(135deg, ${p.accent}08, transparent)`, border: `1px solid ${p.accent}18` }}>
              <h3 className="text-[14px] font-bold text-white/80 mb-4">Revenue Flow</h3>
              <div className="flex flex-col">
                {flowSteps.map((step, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-3 py-2.5">
                      <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
                        style={{
                          background: step.hl ? `${p.accent}18` : "rgba(255,255,255,0.04)",
                          border: step.hl ? `1px solid ${p.accent}30` : "1px solid rgba(255,255,255,0.06)",
                        }}>
                        <step.Icon size={15} color={step.hl ? p.accent : "rgba(255,255,255,0.45)"} />
                      </div>
                      <div>
                        <p className="text-[12.5px] font-semibold" style={{ color: step.hl ? p.accent : "rgba(255,255,255,0.75)" }}>{step.label}</p>
                        <p className="text-[10.5px] text-white/30 mt-px">{step.desc}</p>
                      </div>
                    </div>
                    {i < 3 && <div className="w-px h-3 ml-4" style={{ background: `linear-gradient(180deg, ${p.accent}30, transparent)` }} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Referral Power */}
            <div className="rounded-2xl p-4 mb-6"
              style={{ background: p.cardBg, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2.5 mb-3">
                <Flame size={18} color={p.accent} />
                <div>
                  <p className="text-[13px] font-bold text-white/90">Referral Power</p>
                  <p className="text-[11px] text-white/35">Bring high-volume traders, earn more</p>
                </div>
              </div>
              <div className="flex gap-2">
                {[
                  { v: p.refCommission, l: "Point Commission", c: p.accent },
                  { v: p.kolRefBonus, l: "KOL Ref Bonus", c: "#F59E0B" },
                  { v: p.revShare, l: "Fee Revenue", c: "#10B981" },
                ].map((d, i) => (
                  <div key={i} className="flex-1 rounded-xl p-3 text-center"
                    style={{
                      background: i === 0 ? `${d.c}08` : "rgba(255,255,255,0.03)",
                      border: i === 0 ? `1px solid ${d.c}15` : "1px solid rgba(255,255,255,0.06)",
                    }}>
                    <p className="text-xl font-bold" style={{ color: d.c, fontFamily: "var(--font-mono, monospace)" }}>{d.v}</p>
                    <p className="text-[10px] text-white/35 mt-0.5">{d.l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase Context Banner */}
            {!s1 ? (
              <div className="rounded-2xl p-4 text-center"
                style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.06), transparent)", border: "1px solid rgba(168,85,247,0.15)" }}>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/40 mb-1">
                  <Clock size={12} className="text-white/40" /> Beta ends, Season 1 begins
                </div>
                <p className="text-[12px] text-white/55 leading-relaxed">
                  Multipliers drop to 1x · Referrals drop to 30%<br />
                  <span className="text-purple-400 font-semibold">But the airdrop pool grows 5x larger</span>
                </p>
              </div>
            ) : (
              <div className="rounded-2xl p-4 text-center relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.08), rgba(16,185,129,0.04))", border: "1px solid rgba(245,166,35,0.18)" }}>
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: "linear-gradient(90deg, transparent, #FFD700, #F5A623, transparent)", animation: "rw-shimmer 4s linear infinite", backgroundSize: "200% auto" }} />
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/40 mb-1">
                  <Target size={12} className="text-white/40" /> Consistency Bonus Active
                </div>
                <p className="text-[12px] text-white/55 leading-relaxed">
                  Maintain weekly signal quality to earn<br />
                  <span className="font-bold"
                    style={{ background: "linear-gradient(90deg, #FFD700, #F5A623)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    up to 2x compounding multiplier over time
                  </span>
                </p>
              </div>
            )}

            {s1 && (
              <div className="mt-6 h-0.5 rounded-sm"
                style={{ background: "linear-gradient(90deg, transparent, #FFD700, #F5A623, #FF8C00, transparent)", opacity: 0.4, animation: "rw-pulse 2s ease-in-out infinite" }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}