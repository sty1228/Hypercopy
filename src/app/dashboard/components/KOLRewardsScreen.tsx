// ================================================================
// FILE: dashboard/components/KOLRewardsScreen.tsx
// ================================================================

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X, TrendingUp, Wallet, BarChart3, Link2, Target,
  User, Settings, Diamond, Sparkles, Crown, RefreshCw,
  Flame, Clock, Star, Zap, ArrowRight,
} from "lucide-react";

const PHASES = {
  beta: {
    label: "BETA PHASE", duration: "3 Months", multiplier: "2-5x",
    refCommission: "75%", revShare: "50%", socialMultiplier: "3x",
    copyShare: "30%", airdropPool: "8-10%", kolRefBonus: "5x",
    accent: "#00F0FF", accentAlt: "#00C4D4", accent2: "#a78bfa",
    glowA: "rgba(0,240,255,0.12)", glowB: "rgba(0,180,220,0.04)",
    greenCandle: "#00E5A0", redCandle: "#00899A", wickColor: "rgba(0,240,255,0.35)",
    bg: "#08080D",
    cardBg: "rgba(0,240,255,0.03)", tagline: "EARLY ACCESS",
  },
  season1: {
    label: "SEASON 1", duration: "8 Months", multiplier: "1x → 2x",
    refCommission: "30%", revShare: "25%", socialMultiplier: "1x",
    copyShare: "30%", airdropPool: "40-50%", kolRefBonus: "3x",
    accent: "#F5A623", accentAlt: "#E8913A", accent2: "#a78bfa",
    glowA: "rgba(245,166,35,0.14)", glowB: "rgba(200,120,20,0.06)",
    greenCandle: "#22C55E", redCandle: "#EF4444", wickColor: "rgba(255,255,255,0.25)",
    bg: "#0A0908",
    cardBg: "rgba(245,166,35,0.03)", tagline: "THE MAIN EVENT",
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
    const W = 393, H = 1800;
    cv.width = W * 2; cv.height = H * 2;
    ctx.scale(2, 2);

    const s = st.current;
    s.candles = Array.from({ length: 28 }, () => {
      const bH = Math.random() * 18 + 6, wT = Math.random() * 12 + 3, wB = Math.random() * 8 + 2;
      return {
        x: Math.random() * W, y: Math.random() * H,
        bw: Math.random() * 4 + 2.5, bH, wT, wB, tH: wT + bH + wB,
        g: Math.random() > 0.4, op: Math.random() * 0.3 + 0.06,
        vy: -Math.random() * 0.25 - 0.08, vx: (Math.random() - 0.5) * 0.12,
        dr: Math.random() * Math.PI * 2, ds: Math.random() * 0.008 + 0.003,
        da: Math.random() * 0.4 + 0.1,
        pp: Math.random() * Math.PI * 2, ps: Math.random() * 0.015 + 0.008,
      };
    });
    s.orbs = Array.from({ length: 4 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 100 + 50,
      vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12,
      op: Math.random() * 0.06 + 0.02, ph: Math.random() * Math.PI * 2,
    }));
    s.particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.4 + 0.3, op: Math.random() * 0.4 + 0.05,
      vy: -Math.random() * 0.35 - 0.05, vx: (Math.random() - 0.5) * 0.2,
      pp: Math.random() * Math.PI * 2, ps: Math.random() * 0.02 + 0.005,
    }));

    function draw() {
      const p = PHASES[s.phase as Phase];
      ctx.clearRect(0, 0, W, H);

      s.orbs.forEach((o: any) => {
        o.x += o.vx; o.y += o.vy; o.ph += 0.004;
        if (o.x < -120) o.x = W + 120; if (o.x > W + 120) o.x = -120;
        if (o.y < -120) o.y = H + 120; if (o.y > H + 120) o.y = -120;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, p.accent + "18"); g.addColorStop(0.5, p.accent + "08"); g.addColorStop(1, "transparent");
        ctx.globalAlpha = Math.max(0, o.op + Math.sin(o.ph) * 0.02);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
      });

      s.candles.forEach((c: any) => {
        c.dr += c.ds; c.pp += c.ps;
        c.x += c.vx + Math.sin(c.dr) * c.da; c.y += c.vy;
        if (c.y < -c.tH - 20) { c.y = H + 20; c.x = Math.random() * W; c.g = Math.random() > 0.4; }
        if (c.x < -20) c.x = W + 20; if (c.x > W + 20) c.x = -20;
        const al = c.op * (1 + Math.sin(c.pp) * 0.15);
        const bc = c.g ? p.greenCandle : p.redCandle;
        const t = c.y, b = c.y + c.bH, cx = c.x, hw = c.bw / 2;
        ctx.globalAlpha = al * 0.6; ctx.strokeStyle = p.wickColor; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(cx, t - c.wT); ctx.lineTo(cx, t); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, b); ctx.lineTo(cx, b + c.wB); ctx.stroke();
        ctx.globalAlpha = al; ctx.fillStyle = bc;
        const r = Math.min(1.5, hw * 0.3);
        ctx.beginPath();
        ctx.moveTo(cx - hw + r, t); ctx.lineTo(cx + hw - r, t);
        ctx.quadraticCurveTo(cx + hw, t, cx + hw, t + r);
        ctx.lineTo(cx + hw, b - r);
        ctx.quadraticCurveTo(cx + hw, b, cx + hw - r, b);
        ctx.lineTo(cx - hw + r, b);
        ctx.quadraticCurveTo(cx - hw, b, cx - hw, b - r);
        ctx.lineTo(cx - hw, t + r);
        ctx.quadraticCurveTo(cx - hw, t, cx - hw + r, t);
        ctx.fill();
        if (c.g && al > 0.12) {
          ctx.globalAlpha = al * 0.3; ctx.shadowColor = bc; ctx.shadowBlur = 8;
          ctx.fillRect(cx - hw, t, c.bw, c.bH); ctx.shadowBlur = 0;
        }
      });

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

  return (
    <canvas ref={ref} style={{
      position: "absolute", top: 0, left: 0,
      width: "100%", height: 1800,
      pointerEvents: "none", zIndex: 0,
    }} />
  );
}

// ── Sub-components ──

function SFBadge({ count, accent }: { count: number; accent: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      background: `linear-gradient(135deg, ${accent}18, ${accent}08)`,
      border: `1px solid ${accent}30`, borderRadius: 20,
      padding: "3px 10px 3px 7px", fontSize: 10, fontWeight: 600, color: accent,
    }}>
      <Star size={10} fill={accent} color={accent} />
      {count.toLocaleString()} Smart Followers
    </div>
  );
}

function BoostBar({ value, accent }: { value: number; accent: string }) {
  const pct = Math.min((value / 10) * 100, 100);
  return (
    <div style={{ marginTop: 10, width: "100%" }}>
      <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,0.04)", overflow: "hidden", position: "relative" }}>
        <div style={{
          height: "100%", borderRadius: 3, width: `${pct}%`,
          background: `linear-gradient(90deg, ${accent}50, ${accent})`,
          transition: "width 1s ease-out", position: "relative",
        }}>
          <div style={{
            position: "absolute", right: -1, top: "50%", transform: "translateY(-50%)",
            width: 5, height: 5, borderRadius: "50%",
            background: accent, boxShadow: `0 0 8px ${accent}90, 0 0 16px ${accent}40`,
          }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)" }}>1x</span>
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)" }}>10x</span>
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
    <div className="rw-tier rw-scanline" style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 14px", borderRadius: 14, position: "relative", overflow: "hidden",
      background: isTop ? `linear-gradient(135deg, ${accent}12, ${accent2}06)` : cardBg,
      border: isTop ? `1px solid ${accent}30` : "1px solid rgba(255,255,255,0.05)",
      animationDelay: `${idx * 70}ms`,
      transition: "transform 0.2s ease, box-shadow 0.3s ease",
    }}>
      {isTop && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${accent}90, transparent)`,
        }} />
      )}
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: rank <= 2 ? `linear-gradient(135deg, ${accent}22, ${accent}0c)` : "rgba(255,255,255,0.035)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: rank === 1 ? `0 0 12px ${accent}15` : "none",
      }}>
        <Ic size={15} color={rank <= 2 ? accent : "rgba(255,255,255,0.28)"} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 1 }}>
          <span style={{
            fontSize: 8, fontWeight: 700, letterSpacing: "0.1em",
            color: rank <= 2 ? accent : "rgba(255,255,255,0.3)",
            fontFamily: "monospace",
          }}>#{rank}</span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.88)" }}>{title}</span>
        </div>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.3, margin: 0 }}>{subtitle}</p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{
          fontSize: 15, fontWeight: 700, color: accent,
          fontFamily: "monospace", lineHeight: 1,
          textShadow: rank === 1 ? `0 0 10px ${accent}50` : "none",
        }}>{value}</div>
        <p style={{ fontSize: 8.5, color: "rgba(255,255,255,0.3)", marginTop: 2, margin: "2px 0 0" }}>{unit}</p>
      </div>
      {boost && (
        <div style={{
          position: "absolute", top: 6, right: 6,
          fontSize: 7, fontWeight: 700, color: "#0D0D12",
          background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
          borderRadius: 5, padding: "2px 5px",
          boxShadow: `0 0 8px ${accent}40`,
        }}>{boost}</div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className="rw-stat" style={{
      flex: 1, background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12,
      padding: "12px 10px", textAlign: "center",
      transition: "transform 0.2s ease, box-shadow 0.3s ease",
    }}>
      <p style={{
        fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.3)",
        letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 5px",
      }}>{label}</p>
      <p style={{
        fontSize: 18, fontWeight: 700, color: accent,
        fontFamily: "monospace", lineHeight: 1, margin: 0,
        textShadow: `0 0 12px ${accent}30`,
      }}>{value}</p>
      {sub && <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", margin: "3px 0 0" }}>{sub}</p>}
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
    setTimeout(() => { setPhase(np); setTimeout(() => setTrans(false), 50); }, 250);
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
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      overflowY: "auto", overscrollBehavior: "contain",
      WebkitOverflowScrolling: "touch",
      background: p.bg,
      transition: "background 0.5s ease, opacity 0.4s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1)",
      opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(8px)",
      display: "flex", justifyContent: "center",
    }}>
      <style>{`
        @keyframes rw-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes rw-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.9; } }
        @keyframes rw-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes rw-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes rw-glow { 0%,100% { opacity: 0.15; } 50% { opacity: 0.6; } }
        @keyframes rw-scan { 0% { left: -30%; } 100% { left: 130%; } }
        @keyframes rw-breathe { 0%,100% { box-shadow: 0 0 0px transparent; } 50% { box-shadow: 0 0 20px var(--glow-color, rgba(0,240,255,0.08)); } }
        @keyframes rw-border-glow { 0%,100% { border-color: rgba(255,255,255,0.05); } 50% { border-color: var(--glow-color, rgba(0,240,255,0.15)); } }
        @keyframes rw-number-pop { 0% { transform: scale(0.8); opacity: 0; } 60% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
        .rw-s { animation: rw-up 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .d1{animation-delay:.06s} .d2{animation-delay:.12s} .d3{animation-delay:.18s}
        .d4{animation-delay:.24s} .d5{animation-delay:.30s} .d6{animation-delay:.36s} .d7{animation-delay:.42s}
        .rw-t .rw-s { opacity:0!important; transform:translateY(8px)!important; transition:all .25s ease; animation:none; }
        .rw-tier { animation: rw-up 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .rw-scanline { position: relative; overflow: hidden; }
        .rw-scanline::after {
          content: ''; position: absolute; top: 0; width: 30%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
          animation: rw-scan 4s ease-in-out infinite;
          pointer-events: none;
        }
        .rw-stat { animation: rw-breathe 4s ease-in-out infinite; }
        .rw-stat:nth-child(2) { animation-delay: 1.3s; }
        .rw-stat:nth-child(3) { animation-delay: 2.6s; }
      `}</style>

      <div style={{
        position: "relative", width: "100%", maxWidth: 393,
        minHeight: "100vh", paddingBottom: 1,
      }}>
        <AnimatedBg phase={phase} />

        {/* top glow */}
        <div style={{
          position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)",
          width: 500, height: 500, borderRadius: "50%", pointerEvents: "none", zIndex: 1,
          background: `radial-gradient(circle, ${p.glowA}, ${p.glowB} 50%, transparent 70%)`,
          transition: "background 0.8s ease",
        }} />

        {/* season1 crown glow */}
        {s1 && (
          <div style={{
            position: "absolute", top: 30, left: "50%", transform: "translateX(-50%)",
            width: 200, height: 200, borderRadius: "50%", pointerEvents: "none", zIndex: 1,
            background: "radial-gradient(circle, rgba(245,166,35,0.2), transparent 70%)",
            animation: "rw-pulse 3s ease-in-out infinite",
          }} />
        )}

        {/* side accents */}
        <div style={{ position: "absolute", top: 0, left: 0, width: 1, height: "100%", pointerEvents: "none", zIndex: 3 }}>
          <div style={{ width: "100%", height: "33%", marginTop: 80, background: `linear-gradient(180deg, ${p.accent}18, transparent)` }} />
        </div>
        <div style={{ position: "absolute", top: 0, right: 0, width: 1, height: "100%", pointerEvents: "none", zIndex: 3 }}>
          <div style={{ width: "100%", height: "25%", marginTop: 120, background: `linear-gradient(180deg, ${p.accent}12, transparent)` }} />
        </div>

        {/* top accent line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, pointerEvents: "none", zIndex: 3 }}>
          <div style={{
            height: "100%", width: "50%", margin: "0 auto",
            background: `linear-gradient(90deg, transparent, ${p.accent}60, transparent)`,
            animation: "rw-glow 3s ease-in-out infinite",
          }} />
        </div>

        <div className={trans ? "rw-t" : ""} style={{ position: "relative", zIndex: 2, padding: "0 16px 40px" }}>

          {/* ── Header ── */}
          <div className="rw-s" style={{ paddingTop: 48, marginBottom: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", color: p.accent,
                  background: `${p.accent}12`, border: `1px solid ${p.accent}28`,
                  borderRadius: 5, padding: "2.5px 7px",
                }}>KOL PROGRAM</span>
                <span style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: "0.12em",
                  color: s1 ? "#FFD700" : "rgba(255,255,255,0.25)",
                  animation: s1 ? "rw-float 2s ease-in-out infinite" : "none",
                }}>{p.tagline}</span>
              </div>
              <button onClick={onClose} style={{
                width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                transition: "background 0.2s ease",
              }}>
                <X size={11} color="rgba(255,255,255,0.35)" />
              </button>
            </div>

            {s1 && (
              <div style={{
                fontSize: 9.5, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 6,
                background: "linear-gradient(90deg, #FFD700, #F5A623, #FF8C00, #FFD700)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                animation: "rw-shimmer 3s linear infinite",
              }}>SEASON 1 IS LIVE</div>
            )}

            <h1 style={{
              fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1,
              margin: 0, color: "rgba(255,255,255,0.93)",
            }}>
              {s1 ? "Your Season 1 Rewards" : "Your Rewards"}
            </h1>
            <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", margin: "4px 0 0", lineHeight: 1.4 }}>
              {s1 ? "The main event — larger pool, compounding multipliers" : "Earn points and revenue from your trading signals"}
            </p>
          </div>

          {/* ── Toggle ── */}
          <div className="rw-s d1" style={{
            display: "flex", borderRadius: 12, padding: 2.5, marginBottom: 20,
            background: "rgba(255,255,255,0.035)",
            border: `1px solid ${s1 ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.05)"}`,
            backdropFilter: "blur(12px)",
          }}>
            {(Object.entries(PHASES) as [Phase, (typeof PHASES)[Phase]][]).map(([k, v]) => (
              <button key={k} onClick={() => sw(k)} style={{
                flex: 1, padding: "8px 0", borderRadius: 10, border: "none", cursor: "pointer",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                transition: "all 0.3s ease", fontFamily: "monospace",
                background: phase === k
                  ? `linear-gradient(135deg, ${v.accent}1a, ${v.accent}0c)`
                  : "transparent",
                color: phase === k ? v.accent : "rgba(255,255,255,0.25)",
                boxShadow: phase === k
                  ? `0 0 20px ${v.accent}18, inset 0 0 10px ${v.accent}08`
                  : "none",
              }}>
                {k === "season1" && phase === k && "👑 "}
                {v.label}
                <span style={{ display: "block", fontSize: 8, fontWeight: 500, opacity: 0.5, marginTop: 2 }}>{v.duration}</span>
              </button>
            ))}
          </div>

          {/* ── S1 Banners ── */}
          {s1 && <>
            <div className="rw-s d1 rw-scanline" style={{
              background: "linear-gradient(135deg, rgba(245,166,35,0.08), rgba(255,140,0,0.04))",
              border: "1px solid rgba(245,166,35,0.18)", borderRadius: 14,
              padding: "12px 14px", marginBottom: 8,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: "linear-gradient(135deg, rgba(255,215,0,0.22), rgba(245,166,35,0.12))",
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: "rw-pulse 2s ease-in-out infinite",
                boxShadow: "0 0 12px rgba(255,215,0,0.15)",
              }}>
                <Crown size={15} color="#FFD700" />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#FFD700", margin: 0 }}>Airdrop Pool: 5x Larger</p>
                <p style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>40-50% of total supply distributed this season</p>
              </div>
            </div>
            <div className="rw-s d2 rw-scanline" style={{
              background: "linear-gradient(135deg, rgba(0,240,255,0.05), rgba(245,166,35,0.03))",
              border: "1px solid rgba(0,240,255,0.12)", borderRadius: 14,
              padding: "12px 14px", marginBottom: 18,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: "linear-gradient(135deg, rgba(0,240,255,0.15), rgba(0,200,212,0.08))",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <RefreshCw size={14} color="#00F0FF" />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#00F0FF", margin: 0 }}>Beta Users Carried Over</p>
                <p style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", margin: "2px 0 0", lineHeight: 1.4 }}>Points, referrals, and Smart Follower count carry forward.</p>
              </div>
            </div>
          </>}

          {/* ── Stats ── */}
          <div className="rw-s d2" style={{ display: "flex", gap: 7, marginBottom: 20, ["--glow-color" as any]: `${p.accent}12` }}>
            <Stat label="Rev Share" value={p.revShare} sub="of 0.1% fee" accent={p.accent} />
            <Stat label="Referral" value={p.refCommission} sub="point commission" accent={p.accent} />
            <Stat label="Airdrop" value={p.airdropPool} sub="of total supply" accent={p.accent} />
          </div>

          {/* ── Boost ── */}
          <div className="rw-s d3 rw-scanline" style={{
            background: p.cardBg, border: `1px solid ${p.accent}10`, borderRadius: 14,
            padding: "12px 14px", marginBottom: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.45)", margin: "0 0 5px" }}>Your Boost Multiplier</p>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                  <SFBadge count={sfCount} accent={p.accent} />
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 3,
                    fontSize: 9, fontWeight: 700, color: p.accent,
                    background: `${p.accent}10`, border: `1px solid ${p.accent}22`,
                    borderRadius: 7, padding: "2.5px 7px",
                    boxShadow: `0 0 8px ${p.accent}15`,
                  }}>
                    <Zap size={9} color={p.accent} />
                    {boostMult}x BOOST
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", textAlign: "right", maxWidth: 70, lineHeight: 1.3, margin: 0 }}>
                More Smart Followers = Higher Boost
              </p>
            </div>
            <BoostBar value={boostMult} accent={p.accent} />
          </div>

          {/* ── divider ── */}
          <div style={{
            height: 1, margin: "0 20px 20px",
            background: `linear-gradient(90deg, transparent, ${p.accent}18, transparent)`,
          }} />

          {/* ── Tiers ── */}
          <div className="rw-s d4" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: "rgba(255,255,255,0.85)" }}>How You Earn</h2>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontWeight: 500 }}>Ordered by magnitude</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {tiers.map((t, i) => (
                <Tier key={t.rank} {...t} accent={p.accent} accent2={p.accent2} cardBg={p.cardBg} idx={i} />
              ))}
            </div>
          </div>

          {/* ── Revenue Flow ── */}
          <div className="rw-s d5" style={{
            background: `linear-gradient(135deg, ${p.accent}06, ${p.accent2}03)`,
            border: `1px solid ${p.accent}14`, borderRadius: 16,
            padding: "16px 14px", marginBottom: 20, position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: `linear-gradient(90deg, transparent, ${p.accent}50, transparent)`,
              animation: "rw-glow 4s ease-in-out infinite",
            }} />
            <h3 style={{ fontSize: 12, fontWeight: 700, margin: "0 0 12px", color: "rgba(255,255,255,0.75)" }}>Revenue Flow</h3>
            {flow.map((s, i) => (
              <div key={i}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: s.hl ? `${p.accent}14` : "rgba(255,255,255,0.03)",
                    border: s.hl ? `1px solid ${p.accent}28` : "1px solid rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: s.hl ? `0 0 10px ${p.accent}10` : "none",
                  }}>
                    <s.Icon size={12} color={s.hl ? p.accent : "rgba(255,255,255,0.3)"} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: 11, fontWeight: 600, margin: 0,
                      color: s.hl ? p.accent : "rgba(255,255,255,0.65)",
                    }}>{s.label}</p>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", margin: "1px 0 0" }}>{s.desc}</p>
                  </div>
                  {s.hl && <ArrowRight size={10} color="rgba(255,255,255,0.12)" />}
                </div>
                {i < 3 && (
                  <div style={{
                    width: 1, height: 10, marginLeft: 14,
                    background: `linear-gradient(180deg, ${p.accent}25, transparent)`,
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* ── Referral ── */}
          <div className="rw-s d6" style={{
            background: p.cardBg, border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 14, padding: "14px 14px", marginBottom: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Flame size={14} color={p.accent} />
              <div>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: 0 }}>Referral Power</p>
                <p style={{ fontSize: 9.5, color: "rgba(255,255,255,0.3)", margin: 0 }}>Bring high-volume traders, earn more</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { v: p.refCommission, l: "Point Commission", c: p.accent },
                { v: p.kolRefBonus, l: "KOL Ref Bonus", c: "#F59E0B" },
                { v: p.revShare, l: "Fee Revenue", c: "#10B981" },
              ].map((d, i) => (
                <div key={i} className="rw-scanline" style={{
                  flex: 1, borderRadius: 10, padding: "10px 8px", textAlign: "center",
                  background: i === 0 ? `${d.c}08` : "rgba(255,255,255,0.025)",
                  border: i === 0 ? `1px solid ${d.c}14` : "1px solid rgba(255,255,255,0.05)",
                }}>
                  <p style={{
                    fontSize: 16, fontWeight: 700, color: d.c,
                    fontFamily: "monospace", margin: 0,
                    textShadow: `0 0 10px ${d.c}30`,
                  }}>{d.v}</p>
                  <p style={{ fontSize: 8.5, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>{d.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Phase Banner ── */}
          <div className="rw-s d7">
            {!s1 ? (
              <div style={{
                background: "linear-gradient(135deg, rgba(168,85,247,0.05), transparent)",
                border: "1px solid rgba(168,85,247,0.12)", borderRadius: 14,
                padding: 14, textAlign: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 3 }}>
                  <Clock size={10} color="rgba(255,255,255,0.35)" />
                  <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)" }}>Beta ends, Season 1 begins</span>
                </div>
                <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, margin: 0 }}>
                  Multipliers drop to 1x · Referrals drop to 30%<br />
                  <span style={{ color: "#A855F7", fontWeight: 600 }}>But the airdrop pool grows 5x larger</span>
                </p>
              </div>
            ) : (
              <div style={{
                background: "linear-gradient(135deg, rgba(245,166,35,0.06), rgba(16,185,129,0.03))",
                border: "1px solid rgba(245,166,35,0.15)", borderRadius: 14,
                padding: 14, textAlign: "center", position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 1,
                  background: "linear-gradient(90deg, transparent, #FFD700, #F5A623, transparent)",
                  backgroundSize: "200% auto", animation: "rw-shimmer 4s linear infinite",
                }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 3 }}>
                  <Target size={10} color="rgba(255,255,255,0.35)" />
                  <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)" }}>Consistency Bonus Active</span>
                </div>
                <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, margin: 0 }}>
                  Maintain weekly signal quality to earn<br />
                  <span style={{
                    fontWeight: 700,
                    background: "linear-gradient(90deg, #FFD700, #F5A623)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>up to 2x compounding multiplier over time</span>
                </p>
              </div>
            )}
          </div>

          {/* bottom glow */}
          {s1 && (
            <div style={{
              marginTop: 20, height: 2, borderRadius: 1,
              background: "linear-gradient(90deg, transparent, #FFD700, #F5A623, #FF8C00, transparent)",
              opacity: 0.4, animation: "rw-pulse 2s ease-in-out infinite",
            }} />
          )}

          <div style={{
            marginTop: s1 ? 12 : 28, height: 1,
            marginLeft: 36, marginRight: 36,
            background: `linear-gradient(90deg, transparent, ${p.accent}22, transparent)`,
            animation: "rw-pulse 3s ease-in-out infinite",
          }} />
        </div>
      </div>
    </div>
  );
}