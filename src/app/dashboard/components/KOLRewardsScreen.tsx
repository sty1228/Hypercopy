// ================================================================
// FILE: dashboard/components/KOLRewardsScreen.tsx
// ================================================================
// CHANGED: All mock data replaced with real API calls
//   - getRewards() → points, rank, fee share, smart followers, boost, phase config
//   - getDistributions() → weekly distribution history + breakdowns
//   - claimFeeShare() → Claim button
//   - logShare() → Share PnL / Leaderboard buttons
//   - Loading skeleton while fetching
//   - Error-safe: falls back to zeros on API failure
// ================================================================

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X, TrendingUp, Wallet, Target, Link2, Star, Zap, ChevronDown,
  BarChart3, Trophy, Check, Clock, ArrowRightLeft, Coins, Crown,
  RefreshCw, Flame, Users, Shield, ExternalLink, CircleDollarSign,
  Loader2,
} from "lucide-react";
import {
  getRewards, getDistributions, claimFeeShare, logShare,
  type RewardsData, type DistributionItem,
} from "@/service";

/* ── Phase Config (visual only — real numbers come from API) ── */

const PHASES = {
  beta: {
    label: "BETA", duration: "3 Mo",
    accent: "#00F0FF", accentRgb: "0,240,255",
    greenCandle: "#00E5A0", redCandle: "#00899A", wickColor: "#00F0FF",
    bg: "#0B0B10", cardBg: "rgba(0,240,255,0.025)",
  },
  season1: {
    label: "S1", duration: "8 Mo",
    accent: "#F5A623", accentRgb: "245,166,35",
    greenCandle: "#22C55E", redCandle: "#EF4444", wickColor: "rgba(255,255,255,0.2)",
    bg: "#0C0A08", cardBg: "rgba(245,166,35,0.025)",
  },
} as const;

type Phase = keyof typeof PHASES;
type Tab = "earn" | "multiply" | "distributions";

/* ── Candlestick Background ── */

function CandlestickBg({ phase }: { phase: Phase }) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const cRef = useRef<any[]>([]);
  const oRef = useRef<any[]>([]);
  const aRef = useRef(0);
  const pRef = useRef(phase);

  useEffect(() => { pRef.current = phase; }, [phase]);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const W = 393, H = 2600;
    cv.width = W * 2; cv.height = H * 2;
    ctx.scale(2, 2);
    cRef.current = [];
    oRef.current = [];
    for (let i = 0; i < 22; i++) {
      const bH = Math.random() * 16 + 5;
      cRef.current.push({
        x: Math.random() * W, y: Math.random() * H,
        bW: Math.random() * 3.5 + 2, bH,
        wT: Math.random() * 10 + 3, wB: Math.random() * 7 + 2,
        g: Math.random() > 0.4, o: Math.random() * 0.2 + 0.04,
        vy: -Math.random() * 0.18 - 0.05, vx: (Math.random() - 0.5) * 0.1,
        d: Math.random() * 6.28, ds: Math.random() * 0.006 + 0.002,
        da: Math.random() * 0.3 + 0.08,
        pp: Math.random() * 6.28, ps: Math.random() * 0.012 + 0.005,
      });
    }
    for (let i = 0; i < 3; i++) {
      oRef.current.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 80 + 40,
        vx: (Math.random() - 0.5) * 0.08, vy: (Math.random() - 0.5) * 0.08,
        o: Math.random() * 0.035 + 0.01, p: Math.random() * 6.28,
      });
    }
    function draw() {
      const ph = PHASES[pRef.current];
      ctx.clearRect(0, 0, W, H);
      oRef.current.forEach((ob) => {
        ob.x += ob.vx; ob.y += ob.vy; ob.p += 0.003;
        if (ob.x < -100) ob.x = W + 100; if (ob.x > W + 100) ob.x = -100;
        if (ob.y < -100) ob.y = H + 100; if (ob.y > H + 100) ob.y = -100;
        const g = ctx.createRadialGradient(ob.x, ob.y, 0, ob.x, ob.y, ob.r);
        g.addColorStop(0, ph.accent + "10"); g.addColorStop(1, "transparent");
        ctx.globalAlpha = Math.max(0, ob.o + Math.sin(ob.p) * 0.01);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ob.x, ob.y, ob.r, 0, 6.28); ctx.fill();
      });
      cRef.current.forEach((c) => {
        c.d += c.ds; c.pp += c.ps;
        c.x += c.vx + Math.sin(c.d) * c.da; c.y += c.vy;
        if (c.y < -40) { c.y = H + 20; c.x = Math.random() * W; c.g = Math.random() > 0.4; }
        if (c.x < -20) c.x = W + 20; if (c.x > W + 20) c.x = -20;
        const a = c.o * (1 + Math.sin(c.pp) * 0.12);
        const cl = c.g ? ph.greenCandle : ph.redCandle;
        ctx.globalAlpha = a * 0.5; ctx.strokeStyle = ph.wickColor; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(c.x, c.y - c.wT); ctx.lineTo(c.x, c.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(c.x, c.y + c.bH); ctx.lineTo(c.x, c.y + c.bH + c.wB); ctx.stroke();
        ctx.globalAlpha = a; ctx.fillStyle = cl;
        const hw = c.bW / 2;
        ctx.beginPath(); ctx.roundRect(c.x - hw, c.y, c.bW, c.bH, 1); ctx.fill();
        if (c.g && a > 0.1) {
          ctx.globalAlpha = a * 0.2; ctx.shadowColor = cl; ctx.shadowBlur = 6;
          ctx.fillRect(c.x - hw, c.y, c.bW, c.bH); ctx.shadowBlur = 0;
        }
      });
      ctx.globalAlpha = 1;
      aRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(aRef.current);
  }, []);

  return (
    <canvas ref={cvRef} style={{
      position: "absolute", top: 0, left: 0, width: 393, height: 2600,
      pointerEvents: "none", zIndex: 0,
    }} />
  );
}

/* ── Small Components ── */

const FlowArrow = ({ color }: { color: string }) => (
  <div style={{ display: "flex", justifyContent: "center", padding: "3px 0" }}>
    <ChevronDown size={16} color={color} opacity={0.35} strokeWidth={2} />
  </div>
);

const IconBox = ({ children, accentRgb, active }: { children: React.ReactNode; accentRgb: string; active?: boolean }) => (
  <div style={{
    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
    background: active ? `rgba(${accentRgb},.12)` : "rgba(255,255,255,.03)",
    border: `1px solid ${active ? `rgba(${accentRgb},.2)` : "rgba(255,255,255,.05)"}`,
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    {children}
  </div>
);

const Skeleton = ({ w, h }: { w: number | string; h: number }) => (
  <div style={{
    width: w, height: h, borderRadius: 6,
    background: "rgba(255,255,255,.04)",
    animation: "shimmer 1.5s ease infinite",
  }} />
);

/* ── Main Component ── */

interface Props {
  onClose: () => void;
  initialPhase?: Phase;
}

export function KOLRewardsScreen({ onClose, initialPhase = "beta" }: Props) {
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [tab, setTab] = useState<Tab>("earn");
  const [mounted, setMounted] = useState(false);

  // API data
  const [rewards, setRewards] = useState<RewardsData | null>(null);
  const [distributions, setDistributions] = useState<DistributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const [sharing, setSharing] = useState<string | null>(null);

  const p = PHASES[phase];
  const s1 = phase === "season1";

  // Derived from API (with safe defaults)
  const currentWeek = rewards?.currentWeek ?? 0;
  const totalWeeks = rewards?.totalWeeks ?? 12;
  const totalPoints = rewards?.totalPoints ?? 0;
  const currentWeekPts = rewards?.currentWeekPoints ?? 0;
  const rank = rewards?.rank ?? null;
  const totalFeeShare = rewards?.totalFeeShare ?? 0;
  const claimable = rewards?.claimableFeeShare ?? 0;
  const smartFollowers = rewards?.smartFollowerCount ?? 0;
  const boost = rewards?.boostMultiplier ?? 1;
  const xLinked = rewards?.xAccountLinked ?? false;
  const cfg = rewards?.phaseConfig;
  const feeShare = cfg?.feeShare ?? (s1 ? "30%" : "60%");
  const twapShare = cfg?.twapShare ?? (s1 ? "70%" : "40%");
  const airdropPool = cfg?.airdropPool ?? (s1 ? "40-50%" : "8-10%");
  const copyShare = cfg?.copyShare ?? "30%";
  const multiplierRange = cfg?.multiplierRange ?? (s1 ? "1x → 2x" : "2-5x");
  const kolRefBonus = cfg?.kolRefBonus ?? (s1 ? "3x" : "5x");

  // Fetch data
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    (async () => {
      setLoading(true);
      try {
        const [r, d] = await Promise.allSettled([getRewards(), getDistributions(6)]);
        if (r.status === "fulfilled") setRewards(r.value);
        if (d.status === "fulfilled") setDistributions(d.value.distributions);
      } catch (e) {
        console.error("Rewards fetch failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Claim handler
  const handleClaim = useCallback(async () => {
    if (claiming || claimable <= 0) return;
    setClaiming(true);
    setClaimMsg(null);
    try {
      const res = await claimFeeShare(claimable);
      setClaimMsg(res.message);
      // Optimistic: zero out claimable
      if (res.status === "processing" && rewards) {
        setRewards({
          ...rewards,
          claimableFeeShare: 0,
        });
      }
    } catch (e) {
      setClaimMsg("Claim failed. Please try again.");
    } finally {
      setClaiming(false);
    }
  }, [claiming, claimable, rewards]);

  // Share handler
  const handleShare = useCallback(async (type: "pnl_card" | "leaderboard") => {
    if (sharing) return;
    setSharing(type);
    try {
      await logShare(type);
      const text = type === "pnl_card"
        ? `Check out my copy trading performance on @HyperCopyIO 🔥\n\nAI-powered KOL signal trading on @HyperliquidX\n\nhypercopy.io`
        : `Top KOL traders ranked by AI signal accuracy on @HyperCopyIO 📊\n\nCopy the best traders on @HyperliquidX\n\nhypercopy.io`;
      window.open(
        `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`,
        "_blank",
        "width=550,height=420"
      );
    } catch (e) {
      console.error("Share failed:", e);
    } finally {
      setSharing(null);
    }
  }, [sharing]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "earn", label: "Earn" },
    { id: "multiply", label: "Multiply" },
    { id: "distributions", label: "Distributions" },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      overflowY: "auto", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch",
      background: p.bg, transition: "background .4s ease, opacity .4s ease, transform .4s cubic-bezier(.16,1,.3,1)",
      opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(8px)",
      display: "flex", justifyContent: "center",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
        .fade-in { animation: fadeIn .3s ease both; }
      `}</style>

      <div style={{ position: "relative", width: "100%", maxWidth: 393, minHeight: "100vh" }}>
        <CandlestickBg phase={phase} />

        <div style={{
          position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)",
          width: 420, height: 420, borderRadius: "50%", pointerEvents: "none", zIndex: 1,
          background: `radial-gradient(circle,rgba(${p.accentRgb},.06),transparent 70%)`,
        }} />

        <div style={{ position: "relative", zIndex: 2, padding: "0 16px 32px" }}>

          {/* ── HEADER ── */}
          <div style={{ paddingTop: 52, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: ".12em", color: p.accent,
                  background: `rgba(${p.accentRgb},.08)`, border: `1px solid rgba(${p.accentRgb},.2)`,
                  borderRadius: 5, padding: "2px 7px",
                }}>KOL</span>
                {s1 ? (
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: ".12em",
                    background: "linear-gradient(90deg,#FFD700,#F5A623,#FF8C00,#FFD700)",
                    backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    animation: "shimmer 3s linear infinite",
                  }}>SEASON 1 LIVE</span>
                ) : (
                  <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".08em", color: "rgba(255,255,255,.22)" }}>EARLY ACCESS</span>
                )}
              </div>
              <button onClick={onClose} style={{
                width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}>
                <X size={11} color="rgba(255,255,255,0.35)" />
              </button>
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.015em", margin: 0, color: "rgba(255,255,255,.93)", fontFamily: "'Outfit',sans-serif" }}>Rewards</h1>
          </div>

          {/* ── PHASE SELECTOR ── */}
          <div style={{
            display: "flex", background: "rgba(255,255,255,.03)", borderRadius: 10, padding: 2,
            marginBottom: 12, border: "1px solid rgba(255,255,255,.05)",
          }}>
            {(Object.entries(PHASES) as [Phase, (typeof PHASES)[Phase]][]).map(([key, val]) => {
              const isActive = phase === key;
              const isCurrent = key === "beta";
              const isGrey = key === "season1";
              return (
                <button key={key} onClick={() => setPhase(key)} style={{
                  flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 10, fontWeight: 700, letterSpacing: ".04em", fontFamily: "'DM Mono',monospace",
                  background: isActive ? `rgba(${val.accentRgb},.12)` : "transparent",
                  color: isActive ? val.accent : isGrey ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.25)",
                  transition: "all .2s ease",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}>
                  {isCurrent && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <span style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: isActive ? "#10B981" : "rgba(16,185,129,.4)",
                        animation: "livePulse 1.5s ease-in-out infinite", display: "inline-block",
                      }} />
                      <span style={{ fontSize: 7.5, fontWeight: 700, color: isActive ? "#10B981" : "rgba(16,185,129,.5)", letterSpacing: ".06em" }}>LIVE</span>
                    </span>
                  )}
                  {val.label} · {val.duration}
                  {isGrey && !isActive && <span style={{ fontSize: 7, opacity: .4, marginLeft: 2 }}>SOON</span>}
                </button>
              );
            })}
          </div>

          {/* ── POINTS BALANCE ── */}
          <div className="fade-in" style={{
            background: `linear-gradient(155deg,rgba(${p.accentRgb},.06),rgba(${p.accentRgb},.02),transparent)`,
            border: `1px solid rgba(${p.accentRgb},.12)`, borderRadius: 14,
            padding: "14px 14px 10px", marginBottom: 8, position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,rgba(${p.accentRgb},.35),transparent)` }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,.32)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 4 }}>Total Points</div>
                {loading ? <Skeleton w={120} h={24} /> : (
                  <div style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,.95)", fontFamily: "'DM Mono',monospace", letterSpacing: "-.02em", lineHeight: 1, marginBottom: 3 }}>
                    {totalPoints.toLocaleString()}
                  </div>
                )}
                <div style={{ fontSize: 9.5, color: "rgba(255,255,255,.25)" }}>
                  +{currentWeekPts.toLocaleString()} this week
                </div>
              </div>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "4px 10px", background: `rgba(${p.accentRgb},.06)`,
                border: `1px solid rgba(${p.accentRgb},.14)`, borderRadius: 10,
              }}>
                <Trophy size={14} color={p.accent} strokeWidth={2} style={{ marginBottom: 2 }} />
                {loading ? <Skeleton w={40} h={16} /> : (
                  <div style={{ fontSize: 15, fontWeight: 700, color: p.accent, fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>
                    {rank ? `#${rank}` : "—"}
                  </div>
                )}
                <div style={{ fontSize: 7, fontWeight: 600, color: "rgba(255,255,255,.22)", letterSpacing: ".04em", marginTop: 2 }}>RANK</div>
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,.05)", borderRadius: 3, height: 3, overflow: "hidden", marginTop: 10 }}>
              <div style={{
                width: totalWeeks > 0 ? `${(currentWeek / totalWeeks) * 100}%` : "0%",
                height: "100%", borderRadius: 3,
                background: `linear-gradient(90deg,${p.accent},rgba(${p.accentRgb},.6))`, transition: "width .6s ease",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
              <span style={{ fontSize: 8.5, color: "rgba(255,255,255,.18)" }}>Week {currentWeek} of {totalWeeks}</span>
              <span style={{ fontSize: 8.5, color: "rgba(255,255,255,.18)" }}>Distributes Monday</span>
            </div>
          </div>

          {/* ── FEE SHARE CLAIM ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(16,185,129,.04)", border: "1px solid rgba(16,185,129,.12)",
            borderRadius: 10, padding: "9px 12px", marginBottom: claimMsg ? 4 : 8,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CircleDollarSign size={14} color="#10B981" strokeWidth={2} />
              <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                {loading ? <Skeleton w={80} h={17} /> : (
                  <span style={{ fontSize: 17, fontWeight: 700, color: "#10B981", fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>
                    ${totalFeeShare.toFixed(2)}
                  </span>
                )}
                <span style={{ fontSize: 8, color: "#10B981", opacity: .5, fontFamily: "'DM Mono',monospace" }}>USDC · Arbitrum</span>
              </div>
            </div>
            <button
              onClick={handleClaim}
              disabled={claiming || claimable <= 0}
              style={{
                background: claimable > 0 ? "#10B981" : "rgba(16,185,129,.3)",
                color: "#080D0B", border: "none", borderRadius: 6,
                padding: "5px 10px", fontSize: 9, fontWeight: 700,
                cursor: claimable > 0 ? "pointer" : "default",
                fontFamily: "'DM Sans',sans-serif",
                opacity: claiming ? 0.6 : 1,
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              {claiming && <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />}
              {claiming ? "..." : "Claim"}
            </button>
          </div>
          {claimMsg && (
            <div style={{ fontSize: 8.5, color: "#10B981", padding: "0 12px 8px", opacity: 0.7 }}>{claimMsg}</div>
          )}

          {/* ── SMART FOLLOWER BAR ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: `rgba(${p.accentRgb},.025)`, border: `1px solid rgba(${p.accentRgb},.08)`,
            borderRadius: 10, padding: "8px 12px", marginBottom: 14,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Star size={12} color={p.accent} strokeWidth={2} fill={p.accent} opacity={0.8} />
              {loading ? <Skeleton w={120} h={12} /> : (
                <span style={{ fontSize: 10, fontWeight: 600, color: p.accent }}>
                  {smartFollowers.toLocaleString()} Smart Followers
                </span>
              )}
            </div>
            <div style={{
              fontSize: 9.5, fontWeight: 600, color: p.accent,
              background: `rgba(${p.accentRgb},.08)`, border: `1px solid rgba(${p.accentRgb},.15)`,
              borderRadius: 5, padding: "2px 6px",
            }}>{boost}x</div>
          </div>

          {/* ── TABS ── */}
          <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: "9px 0 8px", border: "none", cursor: "pointer",
                fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", background: "transparent",
                color: tab === t.id ? p.accent : "rgba(255,255,255,.28)",
                borderBottom: tab === t.id ? `2px solid ${p.accent}` : "2px solid transparent",
                transition: "all .2s ease",
              }}>{t.label}</button>
            ))}
          </div>

          {/* ═══════════ TAB: EARN ═══════════ */}
          {tab === "earn" && (
            <div className="fade-in">
              {/* Farm Points */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
                  <Coins size={13} color={p.accent} strokeWidth={2} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.85)", fontFamily: "'Outfit',sans-serif" }}>Farm Points</span>
                </div>

                <div style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                  background: `rgba(${p.accentRgb},.04)`, border: `1px solid rgba(${p.accentRgb},.1)`,
                  borderRadius: 8, marginBottom: 8,
                }}>
                  <Star size={11} color={p.accent} strokeWidth={2} fill={p.accent} />
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,.35)" }}>
                    Your <span style={{ color: p.accent, fontWeight: 600 }}>{smartFollowers.toLocaleString()} Smart Followers</span> apply a <span style={{ color: p.accent, fontWeight: 600 }}>{boost}x</span> boost to all points below
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {[
                    { title: "Copy Volume Earned", sub: "Points when users copy your trades", val: copyShare, unit: `of pts · ${multiplierRange}`, Icon: TrendingUp, hi: true },
                    { title: "Your Own Trading", sub: "Copy or counter with your own capital", val: "70%", unit: `of pts · ${multiplierRange}`, Icon: Wallet, hi: true },
                    { title: "Signal Quality", sub: "Tweets our LLM classifies as tradeable signal vs noise", val: "Bonus", unit: "per signal", Icon: Target, hi: false },
                    { title: "Connected X Account", sub: "Link X for a permanent boost on all earnings", val: "Boost", unit: "on all pts", Icon: Link2, hi: false },
                  ].map((t, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 11, padding: "11px 12px",
                      background: t.hi ? `rgba(${p.accentRgb},.04)` : p.cardBg, borderRadius: 11,
                      border: `1px solid ${t.hi ? `rgba(${p.accentRgb},.12)` : "rgba(255,255,255,.04)"}`,
                    }}>
                      <IconBox accentRgb={p.accentRgb} active={t.hi}>
                        <t.Icon size={15} color={t.hi ? p.accent : "rgba(255,255,255,.35)"} strokeWidth={2} />
                      </IconBox>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,.88)", marginBottom: 1 }}>{t.title}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", lineHeight: 1.3 }}>{t.sub}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: p.accent, fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{t.val}</div>
                        <div style={{ fontSize: 7.5, color: "rgba(255,255,255,.25)", marginTop: 2 }}>{t.unit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Earn Fees (Revenue Flow) */}
              <div style={{
                background: `rgba(${p.accentRgb},.03)`, border: `1px solid rgba(${p.accentRgb},.08)`,
                borderRadius: 14, padding: "16px 14px", marginBottom: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 14 }}>
                  <CircleDollarSign size={13} color={p.accent} strokeWidth={2} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.8)", fontFamily: "'Outfit',sans-serif" }}>Earn Fees</span>
                </div>
                <div style={{
                  background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)",
                  borderRadius: 9, padding: "9px 11px", display: "flex", alignItems: "center", gap: 9,
                }}>
                  <IconBox accentRgb={p.accentRgb}><Users size={13} color="rgba(255,255,255,.5)" strokeWidth={2} /></IconBox>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,.65)" }}>User copies your signal</div>
                    <div style={{ fontSize: 8.5, color: "rgba(255,255,255,.22)" }}>Trade executed on-chain</div>
                  </div>
                </div>
                <FlowArrow color={p.accent} />
                <div style={{
                  background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)",
                  borderRadius: 9, padding: "9px 11px", display: "flex", alignItems: "center", gap: 9,
                }}>
                  <IconBox accentRgb={p.accentRgb}><Shield size={13} color="rgba(255,255,255,.5)" strokeWidth={2} /></IconBox>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,.65)" }}>0.1% builder code fee collected</div>
                    <div style={{ fontSize: 8.5, color: "rgba(255,255,255,.22)" }}>On every trade through platform</div>
                  </div>
                </div>
                <FlowArrow color={p.accent} />
                <div style={{ display: "flex", gap: 6 }}>
                  <div style={{
                    flex: 1, background: `rgba(${p.accentRgb},.06)`, border: `1px solid rgba(${p.accentRgb},.15)`,
                    borderRadius: 9, padding: "10px 9px", textAlign: "center",
                  }}>
                    <Wallet size={14} color={p.accent} strokeWidth={2} style={{ margin: "0 auto 4px" }} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: p.accent, fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{feeShare}</div>
                    <div style={{ fontSize: 8.5, fontWeight: 600, color: p.accent, marginTop: 3, opacity: .7 }}>Fee Share</div>
                    <div style={{ fontSize: 7.5, color: "rgba(255,255,255,.2)", marginTop: 3, lineHeight: 1.3 }}>Paid weekly in USDC on Arbitrum</div>
                  </div>
                  <div style={{
                    flex: 1, background: "rgba(16,185,129,.05)", border: "1px solid rgba(16,185,129,.15)",
                    borderRadius: 9, padding: "10px 9px", textAlign: "center",
                  }}>
                    <ArrowRightLeft size={14} color="#10B981" strokeWidth={2} style={{ margin: "0 auto 4px" }} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#10B981", fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{twapShare}</div>
                    <div style={{ fontSize: 8.5, fontWeight: 600, color: "#10B981", marginTop: 3, opacity: .7 }}>TWAP Buyback</div>
                    <div style={{ fontSize: 7.5, color: "rgba(255,255,255,.2)", marginTop: 3, lineHeight: 1.3 }}>Buys HYPE off open market</div>
                  </div>
                </div>
                <FlowArrow color={p.accent} />
                <div style={{
                  background: `rgba(${p.accentRgb},.06)`, border: `1px solid rgba(${p.accentRgb},.15)`,
                  borderRadius: 9, padding: "9px 11px", display: "flex", alignItems: "center", gap: 9,
                }}>
                  <IconBox accentRgb={p.accentRgb} active><Coins size={13} color={p.accent} strokeWidth={2} /></IconBox>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: p.accent }}>+ {copyShare} of trade points to you</div>
                    <div style={{ fontSize: 8.5, color: "rgba(255,255,255,.22)" }}>At {multiplierRange} multiplier</div>
                  </div>
                </div>
              </div>

              {/* Phase Stats */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
                  <Clock size={13} color="rgba(255,255,255,.5)" strokeWidth={2} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.8)", fontFamily: "'Outfit',sans-serif" }}>Phase Stats</span>
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <div style={{ flex: 1, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.05)", borderRadius: 10, padding: "11px 10px" }}>
                    <div style={{ fontSize: 8.5, fontWeight: 600, color: "rgba(255,255,255,.28)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 4 }}>Fee Share</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: p.accent, fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{feeShare}</div>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,.2)", marginTop: 4, lineHeight: 1.3 }}>of 0.1% fee → paid weekly USDC</div>
                  </div>
                  <div style={{ flex: 1, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.05)", borderRadius: 10, padding: "11px 10px" }}>
                    <div style={{ fontSize: 8.5, fontWeight: 600, color: "rgba(255,255,255,.28)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 4 }}>TWAP Buyback</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#10B981", fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{twapShare}</div>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,.2)", marginTop: 4, lineHeight: 1.3 }}>remaining fee → buys HYPE</div>
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.05)", borderRadius: 10, padding: "11px 10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 8.5, fontWeight: 600, color: "rgba(255,255,255,.28)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 4 }}>Airdrop Pool</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: p.accent, fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{airdropPool}</div>
                    </div>
                    <div style={{ fontSize: 7.5, fontWeight: 700, color: p.accent, background: `rgba(${p.accentRgb},.08)`, borderRadius: 4, padding: "2px 5px" }}>
                      {s1 ? "S1 ONLY" : "BETA ONLY"}
                    </div>
                  </div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,.2)", marginTop: 4, lineHeight: 1.3 }}>
                    {s1
                      ? "Of total supply for S1 participants. Separate from Beta's 8-10%."
                      : "Of total supply for Beta only. Season 1 has its own 40-50% pool."}
                  </div>
                </div>
              </div>

              {/* Referral Fee Share */}
              <div style={{ background: p.cardBg, border: "1px solid rgba(255,255,255,.04)", borderRadius: 12, padding: 13 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <Flame size={14} color={p.accent} strokeWidth={2} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.85)", fontFamily: "'Outfit',sans-serif" }}>Referral Fee Share</div>
                    <div style={{ fontSize: 8.5, color: "rgba(255,255,255,.25)" }}>Earn real $ from referred trader volume</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  {[
                    { val: feeShare, label: "Fee Share", sub: "to referrer", color: p.accent, rgb: p.accentRgb },
                    { val: kolRefBonus, label: "KOL Bonus", sub: "for KOL refs", color: "#F59E0B", rgb: "245,158,11" },
                    { val: twapShare, label: "TWAP", sub: "buys HYPE", color: "#10B981", rgb: "16,185,129" },
                  ].map((c, i) => (
                    <div key={i} style={{
                      flex: 1, background: `rgba(${c.rgb},.05)`, borderRadius: 8,
                      padding: "9px 7px", textAlign: "center", border: `1px solid rgba(${c.rgb},.1)`,
                    }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: c.color, fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{c.val}</div>
                      <div style={{ fontSize: 8, color: "rgba(255,255,255,.28)", marginTop: 3, fontWeight: 600 }}>{c.label}</div>
                      <div style={{ fontSize: 7, color: "rgba(255,255,255,.16)", marginTop: 1 }}>{c.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* S1 banners */}
              {s1 && (
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{
                    background: "linear-gradient(135deg,rgba(245,166,35,.06),rgba(255,140,0,.02))",
                    border: "1px solid rgba(245,166,35,.12)", borderRadius: 10, padding: "10px 12px",
                    display: "flex", alignItems: "center", gap: 9,
                  }}>
                    <Crown size={16} color="#FFD700" strokeWidth={2} />
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#FFD700", fontFamily: "'Outfit',sans-serif" }}>Airdrop Pool 5x Larger</div>
                      <div style={{ fontSize: 8.5, color: "rgba(255,255,255,.28)" }}>40-50% of total supply this season</div>
                    </div>
                  </div>
                  <div style={{
                    background: "linear-gradient(135deg,rgba(0,240,255,.03),rgba(245,166,35,.02))",
                    border: "1px solid rgba(0,240,255,.1)", borderRadius: 10, padding: "10px 12px",
                    display: "flex", alignItems: "center", gap: 9,
                  }}>
                    <RefreshCw size={14} color="#00F0FF" strokeWidth={2} />
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#00F0FF", fontFamily: "'Outfit',sans-serif" }}>Beta Users Carried Over</div>
                      <div style={{ fontSize: 8.5, color: "rgba(255,255,255,.28)", lineHeight: 1.3 }}>Points, referrals, Smart Followers carry forward.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════ TAB: MULTIPLY ═══════════ */}
          {tab === "multiply" && (
            <div className="fade-in">
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                  <Zap size={13} color={p.accent} strokeWidth={2} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.85)", fontFamily: "'Outfit',sans-serif" }}>Your Active Multipliers</span>
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.25)", marginBottom: 10 }}>These boost all point earnings automatically</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <div style={{
                    flex: 1, background: `rgba(${p.accentRgb},.05)`, border: `1px solid rgba(${p.accentRgb},.14)`,
                    borderRadius: 11, padding: "12px 10px", textAlign: "center",
                  }}>
                    <Star size={16} color={p.accent} strokeWidth={2} fill={p.accent} style={{ margin: "0 auto 5px", display: "block", opacity: .8 }} />
                    <div style={{ fontSize: 18, fontWeight: 700, color: p.accent, fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{boost}x</div>
                    <div style={{ fontSize: 8.5, fontWeight: 600, color: p.accent, marginTop: 4, opacity: .65 }}>Smart Followers</div>
                    <div style={{ fontSize: 7.5, color: "rgba(255,255,255,.2)", marginTop: 3, lineHeight: 1.3 }}>
                      {smartFollowers.toLocaleString()} verified from 6K cohort
                    </div>
                  </div>
                  <div style={{
                    flex: 1, background: `rgba(${p.accentRgb},.04)`, border: `1px solid rgba(${p.accentRgb},.12)`,
                    borderRadius: 11, padding: "12px 10px", textAlign: "center",
                  }}>
                    <Zap size={16} color={p.accent} strokeWidth={2} style={{ margin: "0 auto 5px", display: "block" }} />
                    <div style={{ fontSize: 18, fontWeight: 700, color: p.accent, fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{multiplierRange}</div>
                    <div style={{ fontSize: 8.5, fontWeight: 600, color: p.accent, marginTop: 4, opacity: .65 }}>{s1 ? "Consistency" : "Beta"} Mult</div>
                    <div style={{ fontSize: 7.5, color: "rgba(255,255,255,.2)", marginTop: 3, lineHeight: 1.3 }}>{s1 ? "Maintain weekly quality" : "Elevated rate during Beta"}</div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                  <TrendingUp size={13} color="rgba(255,255,255,.5)" strokeWidth={2} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.85)", fontFamily: "'Outfit',sans-serif" }}>Increase Your Multiplier</span>
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.25)", marginBottom: 10 }}>Actions that grow your boost over time</div>

                {/* Share PnL */}
                <div style={{ background: p.cardBg, border: "1px solid rgba(255,255,255,.05)", borderRadius: 11, padding: "11px 12px", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <IconBox accentRgb={p.accentRgb} active><BarChart3 size={14} color={p.accent} strokeWidth={2} /></IconBox>
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(255,255,255,.85)" }}>Share PnL Card to X</div>
                        <div style={{ fontSize: 8.5, color: "rgba(255,255,255,.28)", marginTop: 1 }}>Earns points + grows multiplier</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleShare("pnl_card")}
                      disabled={sharing === "pnl_card"}
                      style={{
                        background: `rgba(${p.accentRgb},.12)`, color: p.accent,
                        border: `1px solid rgba(${p.accentRgb},.25)`, borderRadius: 7,
                        padding: "5px 9px", fontSize: 8.5, fontWeight: 700, cursor: "pointer",
                        fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 3,
                        opacity: sharing === "pnl_card" ? 0.5 : 1,
                      }}
                    >
                      {sharing === "pnl_card" ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : <ExternalLink size={10} color={p.accent} strokeWidth={2.5} />}
                      Share
                    </button>
                  </div>
                </div>

                {/* Share Leaderboard */}
                <div style={{ background: p.cardBg, border: "1px solid rgba(255,255,255,.05)", borderRadius: 11, padding: "11px 12px", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <IconBox accentRgb="245,158,11"><Trophy size={14} color="#F59E0B" strokeWidth={2} /></IconBox>
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(255,255,255,.85)" }}>Share Leaderboard to X</div>
                        <div style={{ fontSize: 8.5, color: "rgba(255,255,255,.28)", marginTop: 1 }}>Your rank or any KOL's result</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleShare("leaderboard")}
                      disabled={sharing === "leaderboard"}
                      style={{
                        background: "rgba(245,158,11,.1)", color: "#F59E0B",
                        border: "1px solid rgba(245,158,11,.22)", borderRadius: 7,
                        padding: "5px 9px", fontSize: 8.5, fontWeight: 700, cursor: "pointer",
                        fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 3,
                        opacity: sharing === "leaderboard" ? 0.5 : 1,
                      }}
                    >
                      {sharing === "leaderboard" ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : <ExternalLink size={10} color="#F59E0B" strokeWidth={2.5} />}
                      Share
                    </button>
                  </div>
                </div>

                {/* Link X */}
                <div style={{ background: p.cardBg, border: "1px solid rgba(255,255,255,.05)", borderRadius: 11, padding: "11px 12px", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <IconBox accentRgb={p.accentRgb}><Link2 size={14} color="rgba(255,255,255,.4)" strokeWidth={2} /></IconBox>
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(255,255,255,.85)" }}>Link X Account</div>
                        <div style={{ fontSize: 8.5, color: "rgba(255,255,255,.28)", marginTop: 1 }}>Permanent boost on all earnings</div>
                      </div>
                    </div>
                    {xLinked ? (
                      <div style={{
                        fontSize: 8, fontWeight: 700, color: "#10B981", background: "rgba(16,185,129,.1)",
                        borderRadius: 5, padding: "3px 7px", display: "flex", alignItems: "center", gap: 3,
                      }}>
                        <Check size={9} color="#10B981" strokeWidth={3} /> LINKED
                      </div>
                    ) : (
                      <button style={{
                        background: `rgba(${p.accentRgb},.12)`, color: p.accent,
                        border: `1px solid rgba(${p.accentRgb},.25)`, borderRadius: 7,
                        padding: "5px 9px", fontSize: 8.5, fontWeight: 700, cursor: "pointer",
                        fontFamily: "'DM Sans',sans-serif",
                      }}>
                        Link
                      </button>
                    )}
                  </div>
                </div>

                {/* Signal Quality */}
                <div style={{ background: p.cardBg, border: "1px solid rgba(255,255,255,.05)", borderRadius: 11, padding: "11px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <IconBox accentRgb={p.accentRgb}><Target size={14} color="rgba(255,255,255,.4)" strokeWidth={2} /></IconBox>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(255,255,255,.85)" }}>Post Quality Signals</div>
                      <div style={{ fontSize: 8.5, color: "rgba(255,255,255,.28)", marginTop: 1, lineHeight: 1.3 }}>Tweets classified as tradeable signal earn bonus pts</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Split */}
              <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)", borderRadius: 10, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
                  <ArrowRightLeft size={12} color="rgba(255,255,255,.4)" strokeWidth={2} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.7)", fontFamily: "'Outfit',sans-serif" }}>Revenue Split</span>
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  <div style={{
                    flex: 1, background: `rgba(${p.accentRgb},.05)`, borderRadius: 8,
                    padding: "8px 7px", border: `1px solid rgba(${p.accentRgb},.08)`, textAlign: "center",
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: p.accent, fontFamily: "'DM Mono',monospace" }}>{feeShare}</div>
                    <div style={{ fontSize: 7.5, color: "rgba(255,255,255,.25)", marginTop: 2 }}>Fee Share → you</div>
                  </div>
                  <div style={{
                    flex: 1, background: "rgba(16,185,129,.04)", borderRadius: 8,
                    padding: "8px 7px", border: "1px solid rgba(16,185,129,.08)", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#10B981", fontFamily: "'DM Mono',monospace" }}>{twapShare}</div>
                    <div style={{ fontSize: 7.5, color: "rgba(255,255,255,.25)", marginTop: 2 }}>TWAP → buys HYPE</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ TAB: DISTRIBUTIONS ═══════════ */}
          {tab === "distributions" && (
            <div className="fade-in">
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.28)", marginBottom: 14 }}>Points and Fee Share distributed every Monday. Fee Share in USDC on Arbitrum.</div>

              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {[1,2,3].map(i => <Skeleton key={i} w="100%" h={52} />)}
                </div>
              ) : distributions.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "32px 16px",
                  background: "rgba(255,255,255,.02)", borderRadius: 10,
                  border: "1px solid rgba(255,255,255,.04)",
                }}>
                  <Clock size={20} color="rgba(255,255,255,.15)" strokeWidth={2} style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", fontWeight: 500 }}>No distributions yet</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,.2)", marginTop: 4 }}>Your first weekly distribution will appear here</div>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                    {distributions.map((d, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 11px",
                        background: i === 0 ? `rgba(${p.accentRgb},.04)` : "rgba(255,255,255,.015)",
                        borderRadius: 10, border: i === 0 ? `1px solid rgba(${p.accentRgb},.14)` : "1px solid rgba(255,255,255,.04)",
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                          background: i === 0 ? `rgba(${p.accentRgb},.08)` : "rgba(255,255,255,.03)",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        }}>
                          <div style={{ fontSize: 7, fontWeight: 700, color: i === 0 ? p.accent : "rgba(255,255,255,.22)", fontFamily: "'DM Mono',monospace" }}>WK</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? p.accent : "rgba(255,255,255,.4)", fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{d.week}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.8)" }}>+{d.points.toLocaleString()} pts</span>
                            {i === 0 && <span style={{ fontSize: 7, fontWeight: 700, color: p.accent, background: `rgba(${p.accentRgb},.12)`, borderRadius: 3, padding: "1px 4px" }}>LATEST</span>}
                          </div>
                          <div style={{ fontSize: 9, color: "rgba(255,255,255,.22)", marginTop: 1.5 }}>{d.date}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981", fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>+${d.feeShareUsdc.toFixed(2)}</div>
                          <div style={{ fontSize: 7.5, color: "#10B981", opacity: .4, marginTop: 1.5, fontFamily: "'DM Mono',monospace" }}>USDC</div>
                        </div>
                        <div style={{
                          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                          background: d.status === "paid" ? "rgba(16,185,129,.08)" : "rgba(255,255,255,.04)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {d.status === "paid" ? (
                            <Check size={9} color="#10B981" strokeWidth={3} />
                          ) : (
                            <Clock size={9} color="rgba(255,255,255,.2)" strokeWidth={2} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div style={{
                    padding: "9px 11px", background: "rgba(16,185,129,.03)", border: "1px solid rgba(16,185,129,.08)",
                    borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14,
                  }}>
                    <span style={{ fontSize: 9.5, color: "rgba(255,255,255,.32)" }}>Total distributed ({distributions.length} wk)</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981", fontFamily: "'DM Mono',monospace" }}>
                      ${distributions.reduce((s, d) => s + d.feeShareUsdc, 0).toFixed(2)} USDC
                    </span>
                  </div>

                  {/* Week Breakdown (latest) */}
                  {distributions[0]?.breakdown && (
                    <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)", borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.75)", marginBottom: 10, fontFamily: "'Outfit',sans-serif" }}>
                        Week {distributions[0].week} Breakdown
                      </div>
                      {[
                        { label: "Copy volume (from followers)", val: `+${distributions[0].breakdown.copyVolumePoints.toLocaleString()} pts`, color: "rgba(255,255,255,.75)" },
                        { label: "Own trading volume", val: `+${distributions[0].breakdown.ownTradingPoints.toLocaleString()} pts`, color: "rgba(255,255,255,.75)" },
                        { label: "Signal quality bonus", val: `+${distributions[0].breakdown.signalQualityBonus.toLocaleString()} pts`, color: "rgba(255,255,255,.75)" },
                        { label: "X account boost", val: `${distributions[0].breakdown.xAccountBoost}x`, color: p.accent },
                        { label: "Smart Follower boost", val: `${distributions[0].breakdown.smartFollowerBoost}x`, color: p.accent },
                        { label: "Fee Share earned", val: `$${distributions[0].breakdown.feeShareEarned.toFixed(2)}`, color: "#10B981" },
                      ].map((r, i) => (
                        <div key={i} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "5px 0", borderBottom: i < 5 ? "1px solid rgba(255,255,255,.03)" : "none",
                        }}>
                          <span style={{ fontSize: 9, color: "rgba(255,255,255,.32)" }}>{r.label}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: r.color, fontFamily: "'DM Mono',monospace" }}>{r.val}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Bottom Phase Hint ── */}
          <div style={{
            marginTop: 18, padding: 10, borderRadius: 9, textAlign: "center",
            background: s1
              ? "linear-gradient(135deg,rgba(245,166,35,.04),rgba(16,185,129,.02))"
              : "linear-gradient(135deg,rgba(100,80,200,.03),transparent)",
            border: `1px solid ${s1 ? "rgba(245,166,35,.1)" : "rgba(100,80,200,.1)"}`,
          }}>
            {!s1 ? (
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)", lineHeight: 1.5 }}>
                When Beta ends → Fee Share 30% · TWAP 70% · <span style={{ color: "#A855F7", fontWeight: 600 }}>Airdrop pool grows 5x</span>
              </div>
            ) : (
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)", lineHeight: 1.5 }}>
                Maintain weekly signal quality → <span style={{ color: "#FFD700", fontWeight: 600 }}>up to 2x compounding multiplier</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}