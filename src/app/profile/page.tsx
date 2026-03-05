"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Target, Users, Award, BarChart3, Share2,
  ArrowUpRight, ArrowDownRight, Flame, Trophy, AlertCircle,
  CheckCircle, Search, Lock, TrendingUp, TrendingDown, Clock,
  Zap, Eye, ChevronRight, Loader2, ExternalLink, ShieldCheck,
  UserPlus, UserCheck, Copy, RefreshCw,
} from "lucide-react";
import FollowingSheet from "./components/followingSheet";
import TradersCopyingSheet from "./components/tradersCopyingSheet";
import type { FollowingUser } from "./components/followingItem";
import type { CopyingTrader } from "./components/traderCopyingItem";
import ShareSheet from "./components/shareSheet";
import {
  getTraderProfile, followTrader, unfollowTrader, toggleCopyTrading, toggleCounterTrading,
  userSignals, updateDefaultSettings,
  type TraderProfile, type RadarData, type UserSignalItem, type DefaultFollowSettings,
} from "@/service";
import { useRewards } from "@/providers/RewardsContext";
import TopBar from "@/components/TopBar";

/* ─── First-time trade localStorage helpers ─── */

const LS_HAS_TRADED = "hc_has_traded_before";
function hasEverTraded(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(LS_HAS_TRADED) === "1";
}
function markHasTraded(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_HAS_TRADED, "1");
}

/* ─────────────── Scroll Animation Hook ──────────── */

function useScrollReveal<T extends HTMLElement>(opts?: { threshold?: number; once?: boolean }) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { setVisible(true); if (opts?.once !== false) obs.disconnect(); }
        else if (opts?.once === false) setVisible(false);
      },
      { threshold: opts?.threshold ?? 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

const ScrollReveal = ({
  children, className = "", style, delay = 0,
  direction = "up", distance = 28, duration = 0.6,
}: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
  delay?: number; direction?: "up" | "down" | "left" | "right" | "scale";
  distance?: number; duration?: number;
}) => {
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });
  const tx = direction === "left" ? `-${distance}px` : direction === "right" ? `${distance}px` : "0";
  const ty = direction === "up" ? `${distance}px` : direction === "down" ? `-${distance}px` : "0";
  const sc = direction === "scale" ? 0.92 : 1;
  return (
    <div ref={ref} className={className} style={{
      ...style, opacity: visible ? 1 : 0,
      transform: visible ? "translate3d(0,0,0) scale(1)" : `translate3d(${tx},${ty},0) scale(${sc})`,
      transition: `opacity ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      willChange: "opacity, transform",
    }}>{children}</div>
  );
};

/* ─────────────── Shared Helpers ─────────────────── */

const Particles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
    {Array.from({ length: 20 }).map((_, i) => (
      <div key={i} className="absolute rounded-full" style={{
        width: `${Math.random() * 3 + 1}px`, height: `${Math.random() * 3 + 1}px`,
        left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
        background: i % 3 === 0 ? "rgba(45,212,191,0.5)" : i % 3 === 1 ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.2)",
        animation: `particleFloat ${5 + Math.random() * 10}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 5}s`,
      }} />
    ))}
  </div>
);

const DataStreams = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="absolute" style={{
        width: "1px", height: "40px", left: `${20 + i * 20}%`, bottom: "-40px",
        background: `linear-gradient(to top, transparent, rgba(45,212,191,${0.15 + i * 0.05}), transparent)`,
        animation: `streamRise ${4 + Math.random() * 3}s linear infinite`,
        animationDelay: `${Math.random() * 4}s`,
      }} />
    ))}
  </div>
);

const AnimatedNumber = ({
  value, prefix = "", suffix = "", decimals = 0, duration = 1200,
}: { value: number; prefix?: string; suffix?: string; decimals?: number; duration?: number }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const steps = 40; let step = 0;
        const t = setInterval(() => {
          step++;
          setDisplay(value * (1 - Math.pow(1 - step / steps, 3)));
          if (step >= steps) clearInterval(t);
        }, duration / steps);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value, duration]);
  return <span ref={ref}>{prefix}{display.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{suffix}</span>;
};

const getGradeFromString = (grade: string | null, radarFallbackScore?: number) => {
  const map: Record<string, { grade: string; color: string; glow: string }> = {
    "S+": { grade: "S+", color: "#ff6b6b", glow: "rgba(255,107,107,0.5)" },
    "S":  { grade: "S",  color: "#ff9f43", glow: "rgba(255,159,67,0.5)" },
    "S-": { grade: "S-", color: "#feca57", glow: "rgba(254,202,87,0.5)" },
    "A+": { grade: "A+", color: "#2dd4bf", glow: "rgba(45,212,191,0.5)" },
    "A":  { grade: "A",  color: "#34d399", glow: "rgba(52,211,153,0.5)" },
    "A-": { grade: "A-", color: "#60a5fa", glow: "rgba(96,165,250,0.5)" },
    "B+": { grade: "B+", color: "#818cf8", glow: "rgba(129,140,248,0.5)" },
    "B":  { grade: "B",  color: "#a78bfa", glow: "rgba(167,139,250,0.5)" },
    "C":  { grade: "C",  color: "#94a3b8", glow: "rgba(148,163,184,0.3)" },
  };
  if (grade && map[grade]) return map[grade];
  if (radarFallbackScore !== undefined) {
    if (radarFallbackScore >= 95) return map["S+"];
    if (radarFallbackScore >= 90) return map["S"];
    if (radarFallbackScore >= 85) return map["S-"];
    if (radarFallbackScore >= 80) return map["A+"];
    if (radarFallbackScore >= 75) return map["A"];
    if (radarFallbackScore >= 70) return map["A-"];
    if (radarFallbackScore >= 65) return map["B+"];
    if (radarFallbackScore >= 60) return map["B"];
  }
  return map["C"];
};

const getAvatarColor = (name: string) => {
  const colors = ["#3b82f6", "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6", "#f97316", "#ef4444"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
};

const cardStyle = {
  background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
};

/* ─────────────── Radar Chart ────────────────────── */

const RadarChart = ({ data, size = 160 }: { data: Record<string, number>; size?: number }) => {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<SVGSVGElement>(null);
  const cx = size / 2, r = size * 0.32, lvl = 5;
  const dims = [
    { key: "accuracy", label: "Accuracy" }, { key: "winRate", label: "Win Rate" },
    { key: "riskReward", label: "R/R Ratio" }, { key: "consistency", label: "Consist." },
    { key: "timing", label: "Timing" }, { key: "transparency", label: "Transp." },
    { key: "engagement", label: "Engage." }, { key: "trackRecord", label: "Track Rec." },
  ];
  const s = (2 * Math.PI) / dims.length;
  const pt = (v: number, i: number) => { const a = s * i - Math.PI / 2; return { x: cx + (v / 100) * r * Math.cos(a), y: cx + (v / 100) * r * Math.sin(a) }; };
  const zeroPts = dims.map((_, i) => { const a = s * i - Math.PI / 2; return { x: cx + 2 * Math.cos(a), y: cx + 2 * Math.sin(a) }; });
  const pts = dims.map((d, i) => pt(data[d.key] ?? 0, i));
  const pathD = (p: { x: number; y: number }[]) => p.map((v, i) => `${i === 0 ? "M" : "L"} ${v.x} ${v.y}`).join(" ") + " Z";
  const [cur, setCur] = useState(zeroPts);

  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setAnimated(true); o.disconnect(); } }, { threshold: 0.3 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  useEffect(() => {
    if (!animated) return;
    const d = 1200, n = 50; let i = 0;
    const t = setInterval(() => {
      i++;
      const p = 1 - Math.pow(1 - i / n, 3);
      setCur(zeroPts.map((z, j) => ({ x: z.x + (pts[j].x - z.x) * p, y: z.y + (pts[j].y - z.y) * p })));
      if (i >= n) clearInterval(t);
    }, d / n);
    return () => clearInterval(t);
  }, [animated]);

  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: animated ? 1 : 0, transition: "opacity 0.8s ease 0.3s" }}>
        <div style={{ width: size * 0.7, height: size * 0.7, borderRadius: "50%", background: "conic-gradient(from 0deg, rgba(45,212,191,0.12), transparent, rgba(45,212,191,0.08), transparent, rgba(45,212,191,0.12))", animation: animated ? "radarOrbitGlow 6s linear infinite" : "none", filter: "blur(15px)" }} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 1, 2].map(i => <div key={i} className="absolute rounded-full" style={{ width: size * 0.5, height: size * 0.5, border: "1px solid rgba(45,212,191,0.15)", opacity: animated ? 1 : 0, animation: animated ? `radarPulseRing 3s ease-out ${i}s infinite` : "none" }} />)}
      </div>
      <svg ref={ref} width={size} height={size} className="mx-auto relative z-10" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(45,212,191,0.45)" />
            <stop offset="100%" stopColor="rgba(45,212,191,0.08)" />
          </linearGradient>
          <filter id="radarGlow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(45,212,191,0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cx} r={r * 0.3} fill="url(#centerGlow)" style={{ opacity: animated ? 1 : 0, transition: "opacity 1s ease 0.5s" }} />
        {[...Array(lvl)].map((_, li) => {
          const lr = r * ((li + 1) / lvl);
          const p = dims.map((_, i) => { const a = s * i - Math.PI / 2; return `${cx + lr * Math.cos(a)},${cx + lr * Math.sin(a)}`; }).join(" ");
          return <polygon key={li} points={p} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" style={{ opacity: animated ? 1 : 0, transition: `opacity 0.4s ease ${0.1 + li * 0.08}s` }} />;
        })}
        {dims.map((_, i) => { const a = s * i - Math.PI / 2; return <line key={i} x1={cx} y1={cx} x2={cx + r * Math.cos(a)} y2={cx + r * Math.sin(a)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" style={{ opacity: animated ? 1 : 0, transition: `opacity 0.3s ease ${i * 0.05}s` }} />; })}
        <path d={pathD(cur)} fill="url(#rg)" stroke="rgba(45,212,191,0.9)" strokeWidth="1.5" filter="url(#radarGlow)" style={{ opacity: animated ? 1 : 0, transition: "opacity 0.4s ease 0.2s" }} />
        <path d={pathD(cur)} fill="none" stroke="rgba(45,212,191,0.2)" strokeWidth="6" style={{ opacity: animated ? 1 : 0, transition: "opacity 0.6s ease 0.4s", filter: "blur(4px)" }} />
        {cur.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="6" fill="rgba(45,212,191,0.15)" style={{ opacity: animated ? 1 : 0, transition: `opacity 0.4s ease ${0.6 + i * 0.08}s`, animation: animated ? `radarDotPulse 2s ease-in-out ${i * 0.25}s infinite` : "none" }} />
            <circle cx={p.x} cy={p.y} r="3" fill="#2dd4bf" style={{ opacity: animated ? 1 : 0, transition: `opacity 0.3s ease ${0.6 + i * 0.08}s`, filter: "drop-shadow(0 0 6px rgba(45,212,191,0.9))" }} />
          </g>
        ))}
        {dims.map((d, i) => {
          const a = s * i - Math.PI / 2, lr = r + 22, x = cx + lr * Math.cos(a), y = cx + lr * Math.sin(a);
          let anc: "start" | "middle" | "end" = "middle";
          if (Math.cos(a) > 0.3) anc = "start"; else if (Math.cos(a) < -0.3) anc = "end";
          return <text key={i} x={x} y={y} textAnchor={anc} dominantBaseline="middle" fontSize="7.5" fill="rgba(255,255,255,0.45)" style={{ opacity: animated ? 1 : 0, transition: `opacity 0.4s ease ${0.3 + i * 0.06}s` }}>{d.label}</text>;
        })}
        {animated && pts.map((p, i) => {
          const a = s * i - Math.PI / 2, o = 13;
          return <text key={`v${i}`} x={p.x + o * Math.cos(a)} y={p.y + o * Math.sin(a)} textAnchor="middle" dominantBaseline="middle" fontSize="6.5" fill="rgba(45,212,191,0.7)" fontWeight="bold" style={{ opacity: animated ? 1 : 0, transition: `opacity 0.4s ease ${1 + i * 0.08}s` }}>{data[dims[i].key]}</text>;
        })}
      </svg>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, description }: { icon: typeof Zap; title: string; description: string }) => (
  <div className="rounded-xl p-8 flex flex-col items-center text-center" style={cardStyle}>
    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <Icon size={20} className="text-gray-500" />
    </div>
    <p className="text-[12px] font-semibold text-white mb-1">{title}</p>
    <p className="text-[10px] text-gray-500 max-w-[220px]">{description}</p>
  </div>
);

const ConnectXModal = ({ isOpen, stage, onClose }: { isOpen: boolean; stage: "connecting" | "success"; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md" onClick={stage === "success" ? onClose : undefined} />
      <div className="fixed inset-0 z-[61] flex items-center justify-center px-8">
        <div className="w-full max-w-xs rounded-2xl p-6 text-center relative overflow-hidden" style={{ background: "linear-gradient(180deg, #141c26 0%, #0a0f14 100%)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(45,212,191,0.06) 0%, transparent 70%)" }} />
          <div className="relative z-10">
            {stage === "connecting" ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "rgba(45,212,191,0.08)", border: "1.5px solid rgba(45,212,191,0.2)" }}>
                  <Loader2 size={28} className="text-teal-400" style={{ animation: "spin 1s linear infinite" }} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Connecting to X</h3>
                <p className="text-[11px] text-gray-400">Verifying your account…</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "rgba(45,212,191,0.15)", border: "1.5px solid rgba(45,212,191,0.3)", animation: "gradeBounce 0.6s ease" }}>
                  <CheckCircle size={28} className="text-teal-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Connected!</h3>
                <p className="text-[11px] text-gray-400 mb-4">PnL, Signals & Copied Positions are now unlocked.</p>
                <button onClick={onClose} className="px-6 py-2 rounded-xl text-[11px] font-bold cursor-pointer transition-all active:scale-95" style={{ background: "rgba(45,212,191,1)", color: "#0a0f14" }}>Continue</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const LockedTabContent = ({ title, description, onConnect }: { title: string; description: string; onConnect: () => void }) => (
  <div className="rounded-xl overflow-hidden relative" style={cardStyle}>
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center" style={{ background: "radial-gradient(ellipse at center, rgba(45,212,191,0.03) 0%, transparent 70%)" }}>
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(45,212,191,0.04)", border: "1.5px solid rgba(45,212,191,0.12)" }}>
          <Lock size={22} className="text-teal-400" style={{ opacity: 0.5 }} />
        </div>
        {[0, 1].map(i => <div key={i} className="absolute rounded-full pointer-events-none" style={{ inset: -4, border: "1px solid rgba(45,212,191,0.1)", borderRadius: "50%", animation: `radarPulseRing 3s ease-out ${i * 1.5}s infinite` }} />)}
      </div>
      <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
      <p className="text-[11px] text-gray-400 leading-relaxed mb-5 max-w-[240px]">{description}</p>
      <button onClick={onConnect} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all duration-300 active:scale-95 relative overflow-hidden" style={{ background: "rgba(45,212,191,1)", color: "#0a0f14", boxShadow: "0 4px 24px rgba(45,212,191,0.35)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", animation: "shimmerSlide 2.5s ease-in-out infinite" }} />
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" className="relative z-10"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
        <span className="relative z-10">Connect X to Unlock</span>
      </button>
      <span className="text-[9px] text-gray-500 mt-2.5">Verify your identity in seconds</span>
    </div>
  </div>
);

const PrivacySheet = ({ isOpen, onClose, settings, onToggle }: {
  isOpen: boolean; onClose: () => void;
  settings: { hideCopyTrades: boolean; hidePositions: boolean; hidePnl: boolean };
  onToggle: (key: "hideCopyTrades" | "hidePositions" | "hidePnl") => void;
}) => {
  const [sheetVisible, setSheetVisible] = useState(false);
  useEffect(() => { if (isOpen) requestAnimationFrame(() => setSheetVisible(true)); else setSheetVisible(false); }, [isOpen]);
  if (!isOpen) return null;
  const items: { key: "hideCopyTrades" | "hidePositions" | "hidePnl"; icon: typeof Eye; label: string; desc: string }[] = [
    { key: "hideCopyTrades", icon: Users, label: "Copy Trades", desc: "Hide which traders you're copying" },
    { key: "hidePositions", icon: Eye, label: "Copied Positions", desc: "Hide positions opened by copiers" },
    { key: "hidePnl", icon: TrendingUp, label: "PnL Data", desc: "Hide your PnL curve and performance" },
  ];
  return (
    <>
      <div className="fixed inset-0 z-40 backdrop-blur-sm transition-opacity duration-300" style={{ background: "rgba(0,0,0,0.6)", opacity: sheetVisible ? 1 : 0 }} onClick={onClose} />
      <div className="fixed left-0 right-0 z-50 max-w-md mx-auto rounded-t-3xl overflow-hidden transition-transform duration-500" style={{ bottom: 48, background: "linear-gradient(180deg, #111820 0%, #0a0f14 100%)", border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none", transform: sheetVisible ? "translateY(0)" : "translateY(100%)", transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h2 className="text-base font-bold text-white">Privacy Settings</h2>
            <span className="text-[11px] text-gray-500">Control what others can see</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "rgba(255,255,255,0.05)" }}><Lock size={14} className="text-gray-400" /></button>
        </div>
        <div className="px-4 pb-6 space-y-2">
          {items.map(item => {
            const on = settings[item.key];
            return (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: on ? "rgba(244,63,94,0.1)" : "rgba(45,212,191,0.1)" }}>
                    <item.icon size={14} className={on ? "text-rose-400" : "text-teal-400"} />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-white">{item.label}</p>
                    <p className="text-[9px] text-gray-500 max-w-[200px]">{item.desc}</p>
                  </div>
                </div>
                <button onClick={() => onToggle(item.key)} className="shrink-0 cursor-pointer transition-all duration-300 rounded-full" style={{ width: 40, height: 22, background: on ? "rgba(45,212,191,0.8)" : "rgba(255,255,255,0.1)", border: `1px solid ${on ? "rgba(45,212,191,0.5)" : "rgba(255,255,255,0.1)"}`, position: "relative" }}>
                  <div className="absolute top-0.5 rounded-full transition-all duration-300" style={{ width: 18, height: 18, left: on ? 19 : 1, background: on ? "#fff" : "rgba(255,255,255,0.4)", boxShadow: on ? "0 0 8px rgba(45,212,191,0.5)" : "none" }} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

const TAB_DEFS = [
  { key: "overview", label: "Analysis", locked: false },
  { key: "signals", label: "Signals", locked: true },
  { key: "positions", label: "Positions", locked: true },
] as const;

const ProfileSkeleton = () => (
  <div className="min-h-screen text-white relative" style={{ background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)" }}>
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={28} className="text-teal-400" style={{ animation: "spin 1s linear infinite" }} />
        <span className="text-[11px] text-gray-500">Loading trader profile…</span>
      </div>
    </div>
  </div>
);

const ProfileError = ({ message, onBack }: { message: string; onBack: () => void }) => (
  <div className="min-h-screen text-white relative flex items-center justify-center" style={{ background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)" }}>
    <div className="flex flex-col items-center gap-3 px-6 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(244,63,94,0.08)", border: "1.5px solid rgba(244,63,94,0.15)" }}>
        <AlertCircle size={24} className="text-rose-400" />
      </div>
      <h2 className="text-sm font-bold text-white">{message}</h2>
      <button onClick={onBack} className="px-5 py-2 rounded-xl text-[11px] font-semibold cursor-pointer transition-all active:scale-95" style={{ background: "rgba(45,212,191,0.12)", color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.2)" }}>Back to Leaderboard</button>
    </div>
  </div>
);

/* ─────────────── Trade Settings Sheet (Copy & Counter) ─── */

type TradeMode = "copy" | "counter";

function ProfileTradeSettingsSheet({
  traderName, mode, onConfirm, onClose,
}: {
  traderName: string;
  mode: TradeMode;
  onConfirm: (cfg: any) => void;
  onClose: () => void;
}) {
  const [sizeVal, setSizeVal] = useState(50);
  const [sizeType, setSizeType] = useState<"USD" | "PCT">("USD"); // default $
  const [leverage, setLeverage] = useState(8);
  const [tpVal, setTpVal] = useState(15);
  const [tpType, setTpType] = useState<"USD" | "PCT">("USD");   // default $
  const [slVal, setSlVal] = useState(35);
  const [slType, setSlType] = useState<"USD" | "PCT">("USD");   // default $
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  // Accent color: teal for copy, rose for counter
  const ac = mode === "counter" ? "#f43f5e" : "#2dd4bf";
  const acRgba = mode === "counter" ? "rgba(244,63,94,1)" : "rgba(45,212,191,1)";
  const acShadow = mode === "counter" ? "rgba(244,63,94,0.3)" : "rgba(45,212,191,0.3)";
  const acBg = mode === "counter" ? "rgba(244,63,94,0.08)" : "rgba(45,212,191,0.08)";
  const title = mode === "counter" ? `Counter @${traderName}` : `Copy @${traderName}`;
  const subtitle = mode === "counter"
    ? "We'll open the opposite direction of their trades automatically."
    : "We'll auto-mirror their trades for you. Defaults apply to all future copies.";

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  const handleClose = () => { setVisible(false); setTimeout(onClose, 300); };
  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm({ sizeVal, sizeType, leverage, tpVal, tpType, slVal, slType });
    setLoading(false);
  };

  const TypeToggle = ({ val, onChange, color = ac }: { val: string; onChange: (v: "USD" | "PCT") => void; color?: string }) => (
    <div className="flex" style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 2 }}>
      {(["$", "%"] as const).map(t => {
        const m = t === "$" ? "USD" : "PCT";
        const on = val === m;
        return (
          <button key={t} onClick={() => onChange(m)} className="text-[11px] font-semibold transition-all" style={{ width: 28, height: 26, borderRadius: 6, background: on ? `${color}20` : "transparent", color: on ? color : "rgba(255,255,255,0.2)", border: "none" }}>{t}</button>
        );
      })}
    </div>
  );

  const el = (
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: 9998 }}>
      <div className="absolute inset-0 transition-opacity duration-300" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", opacity: visible ? 1 : 0 }} onClick={handleClose} />
      <div className="relative w-full transition-transform duration-300 ease-out" style={{ maxWidth: 393, background: "#0d1117", borderRadius: "20px 20px 0 0", border: "1px solid rgba(255,255,255,0.06)", borderBottom: "none", maxHeight: "90vh", overflowY: "auto", transform: visible ? "translateY(0)" : "translateY(100%)", boxShadow: "0 -10px 40px rgba(0,0,0,0.6)" }}>
        <div style={{ height: 3, borderRadius: "20px 20px 0 0", background: `linear-gradient(90deg, transparent, ${ac}, transparent)`, opacity: 0.5 }} />
        <div className="px-5 pt-4 pb-7">
          <div className="w-9 h-[3px] rounded-full mx-auto mb-5" style={{ background: "rgba(255,255,255,0.1)" }} />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest mb-1" style={{ color: ac, opacity: 0.7 }}>
                {mode === "counter" ? "Reverse position setup" : "First time setup"}
              </p>
              <h3 className="text-white text-[17px] font-bold leading-tight">
                {mode === "counter" ? "Counter " : "Copy "}
                <span style={{ color: ac }}>@{traderName}</span>
              </h3>
            </div>
            <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </div>

          <p className="text-[11px] leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>{subtitle}</p>

          {/* Mode badge */}
          {mode === "counter" && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)" }}>
              <RefreshCw size={11} className="text-rose-400" />
              <p className="text-[10px] text-rose-400">Their LONG → your SHORT &nbsp;·&nbsp; Their SHORT → your LONG</p>
            </div>
          )}

          {/* Settings rows */}
          <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            {/* Size */}
            <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>Size</span>
              <div className="flex items-center gap-2.5">
                <input type="number" value={sizeVal} onChange={e => setSizeVal(Number(e.target.value) || 0)} className="w-16 text-right bg-transparent border-none outline-none text-[15px] font-bold" style={{ color: "rgba(255,255,255,0.9)" }} />
                <TypeToggle val={sizeType} onChange={setSizeType} color={ac} />
              </div>
            </div>

            {/* Leverage */}
            <div className="px-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>Leverage</span>
                <span className="text-[15px] font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{leverage}x</span>
              </div>
              <input type="range" min={1} max={20} value={leverage} onChange={e => setLeverage(Number(e.target.value))} className="w-full" style={{ accentColor: ac }} />
              <div className="flex justify-between mt-0.5" style={{ fontSize: 9, color: "rgba(255,255,255,0.15)" }}>
                <span>1x</span><span>5x</span><span>10x</span><span>15x</span><span>20x</span>
              </div>
            </div>

            {/* Stop Loss */}
            <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>Stop Loss</span>
              <div className="flex items-center gap-2.5">
                <input type="number" value={slVal} onChange={e => setSlVal(Number(e.target.value) || 0)} className="w-16 text-right bg-transparent border-none outline-none text-[15px] font-bold" style={{ color: "#fb7185" }} />
                <TypeToggle val={slType} onChange={setSlType} color="#fb7185" />
              </div>
            </div>

            {/* Take Profit */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>Take Profit</span>
              <div className="flex items-center gap-2.5">
                <input type="number" value={tpVal} onChange={e => setTpVal(Number(e.target.value) || 0)} className="w-16 text-right bg-transparent border-none outline-none text-[15px] font-bold" style={{ color: "#34d399" }} />
                <TypeToggle val={tpType} onChange={setTpType} color="#34d399" />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="text-center text-[11px] mb-5" style={{ color: "rgba(255,255,255,0.2)" }}>
            {sizeType === "PCT" ? `${sizeVal}%` : `$${sizeVal}`} per trade · {leverage}x leverage · SL {slType === "PCT" ? `${slVal}%` : `$${slVal}`} · TP {tpType === "PCT" ? `${tpVal}%` : `$${tpVal}`}
          </div>

          {/* CTA */}
          <button onClick={handleConfirm} disabled={loading} className="w-full py-3.5 rounded-xl text-[13px] font-bold transition-all duration-300" style={{ background: loading ? "rgba(255,255,255,0.05)" : `linear-gradient(135deg, ${ac}, ${mode === "counter" ? "#be123c" : "#14b8a6"})`, color: loading ? "rgba(255,255,255,0.3)" : "#000", border: "none", cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : `0 4px 20px ${acShadow}` }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                Setting up…
              </span>
            ) : mode === "counter" ? "Start Countering" : "Start Copying"}
          </button>

          {/* Future scripts message */}
          <div className="mt-4 px-3 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-start gap-2">
              <Zap size={11} className="shrink-0 mt-0.5" style={{ color: ac }} />
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", lineHeight: 1.5 }}>
                We&apos;re building Exit Strategy scripts you can attach to your positions to optimize for max profits — <span style={{ color: ac, opacity: 0.7 }}>coming soon</span>.
              </p>
            </div>
          </div>

          <p className="text-center mt-3" style={{ fontSize: 9, color: "rgba(255,255,255,0.15)" }}>
            Editable anytime in Settings · Past performance ≠ future results
          </p>
        </div>
      </div>
    </div>
  );
  if (typeof window === "undefined") return null;
  return createPortal(el, document.body);
}

/* ─────────────── Confetti + Success Sheet ─────────────── */

function ProfileConfetti({ accent }: { accent: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1, W = 393, H = 520;
    c.width = W * dpr; c.height = H * dpr; ctx.scale(dpr, dpr);
    const cols = [accent, "#fbbf24", "#a78bfa", "#fb7185", "#38bdf8", "#34d399", "#f472b6"];
    interface P { x: number; y: number; vx: number; vy: number; w: number; h: number; rot: number; vr: number; color: string; opacity: number; gravity: number }
    const ps: P[] = [];
    for (let i = 0; i < 90; i++) ps.push({ x: W / 2 + (Math.random() - 0.5) * 40, y: H * 0.22, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 16 - 5, w: Math.random() * 5 + 2, h: Math.random() * 10 + 5, rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.3, color: cols[Math.floor(Math.random() * cols.length)], opacity: 1, gravity: 0.22 + Math.random() * 0.12 });
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H); let alive = false;
      for (const p of ps) {
        if (p.opacity <= 0) continue; alive = true;
        p.x += p.vx; p.vy += p.gravity; p.y += p.vy; p.vx *= 0.99; p.rot += p.vr;
        if (p.y > H * 0.85) p.opacity -= 0.025;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.opacity); ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [accent]);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }} />;
}

function ProfileTradeSuccessSheet({
  traderName, mode, onViewRewards, onDone,
}: {
  traderName: string;
  mode: TradeMode;
  onViewRewards: () => void;
  onDone: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const accent = mode === "counter" ? "#f43f5e" : "#2dd4bf";

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t1 = setTimeout(() => setStep(1), 350);
    const t2 = setTimeout(() => setStep(2), 600);
    const t3 = setTimeout(() => setStep(3), 850);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleDone = () => { setVisible(false); setTimeout(onDone, 300); };
  const handleRewards = () => { setVisible(false); setTimeout(onViewRewards, 300); };

  const el = (
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: 9999 }}>
      <div className="absolute inset-0 transition-opacity duration-300" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", opacity: visible ? 1 : 0 }} />
      <div className="relative w-full transition-transform duration-300 ease-out" style={{ maxWidth: 393, background: "#0d1117", borderRadius: "20px 20px 0 0", border: "1px solid rgba(255,255,255,0.06)", borderBottom: "none", transform: visible ? "translateY(0)" : "translateY(100%)", boxShadow: "0 -10px 40px rgba(0,0,0,0.6)", overflow: "hidden" }}>
        <div style={{ height: 3, borderRadius: "20px 20px 0 0", background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: 0.6 }} />
        <ProfileConfetti accent={accent} />
        <div className="absolute pointer-events-none" style={{ top: -40, left: "50%", transform: "translateX(-50%)", width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle, ${accent}10, transparent 70%)`, filter: "blur(40px)" }} />
        <div className="relative text-center px-6 pt-6 pb-8">
          <div className="mx-auto mb-5 relative" style={{ width: 72, height: 72 }}>
            <div className="absolute inset-0 rounded-full" style={{ border: `1.5px solid ${accent}`, opacity: step >= 1 ? 0 : 0.3, transform: step >= 1 ? "scale(2)" : "scale(1)", transition: "all 0.8s ease-out" }} />
            <div className="absolute inset-0 rounded-full flex items-center justify-center" style={{ background: `${accent}0a`, border: `1px solid ${accent}25`, transform: step >= 1 ? "scale(1)" : "scale(0.6)", opacity: step >= 1 ? 1 : 0, transition: "all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
              {mode === "counter"
                ? <RefreshCw size={28} style={{ color: accent, opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? "scale(1)" : "scale(0.4)", transition: "all 0.35s ease-out 0.15s" }} />
                : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? "scale(1)" : "scale(0.4)", transition: "all 0.35s ease-out 0.15s" }}><path d="M20 6L9 17l-5-5" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              }
            </div>
          </div>
          <div style={{ opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? "translateY(0)" : "translateY(8px)", transition: "all 0.4s ease-out 0.1s" }}>
            <p className="m-0 mb-1" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
              {mode === "counter" ? "You're now countering" : "You're now copying"}
            </p>
            <h3 className="m-0 mb-3" style={{ fontSize: 22, fontWeight: 800, color: accent, letterSpacing: "-0.02em" }}>@{traderName}</h3>
            <p className="m-0 mb-6 leading-relaxed" style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
              {mode === "counter"
                ? "Reverse trades execute automatically when they make a call."
                : "Trades execute automatically when they make a call."}
            </p>
          </div>
          <div className="rounded-xl p-4 mb-6 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? "translateY(0)" : "translateY(12px)", transition: "all 0.45s ease-out" }}>
            <div className="flex items-baseline justify-center gap-2 mb-1">
              <span style={{ fontSize: 28, fontWeight: 800, color: accent, letterSpacing: "-0.02em" }}>+50</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>points earned</span>
            </div>
            <p className="m-0" style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Earn on every trade · Top performers share platform fees</p>
          </div>
          <div style={{ opacity: step >= 3 ? 1 : 0, transform: step >= 3 ? "translateY(0)" : "translateY(8px)", transition: "all 0.4s ease-out" }}>
            <button onClick={handleRewards} className="w-full py-3.5 rounded-xl text-[13px] font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${accent}, ${mode === "counter" ? "#be123c" : "#14b8a6"})`, color: "#000", border: "none", boxShadow: `0 4px 24px ${accent}30` }}>View Rewards Program</button>
            <button onClick={handleDone} className="w-full mt-2 py-2.5 text-[11px] transition-all" style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.2)" }}>Done</button>
          </div>
        </div>
      </div>
    </div>
  );
  if (typeof window === "undefined") return null;
  return createPortal(el, document.body);
}

/* ═══════════════════════════════════════════════════════ */

export default function KOLProfilePage() {
  return <Suspense fallback={<ProfileSkeleton />}><KOLProfileContent /></Suspense>;
}

function KOLProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const handle = searchParams.get("handle")?.replace(/^@/, "") ?? "";

  // ── Data state ──────────────────────────────────────
  const [trader, setTrader] = useState<TraderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signals, setSignals] = useState<UserSignalItem[]>([]);
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [signalFilter, setSignalFilter] = useState<"all" | "wins" | "losses">("all");
  const [pnlRange, setPnlRange] = useState<"1W" | "1M" | "3M" | "ALL">("ALL");
  const [activeTab, setActiveTab] = useState("overview");

  // ── Follow / trade state ─────────────────────────────
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isCounterTrading, setIsCounterTrading] = useState(false); // ★ NEW
  const [followLoading, setFollowLoading] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);

  // ── UI state ─────────────────────────────────────────
  const [showFollowingSheet, setShowFollowingSheet] = useState(false);
  const [showCopyingSheet, setShowCopyingSheet] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [isXConnected, setIsXConnected] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectStage, setConnectStage] = useState<"connecting" | "success">("connecting");
  const [showPrivacySheet, setShowPrivacySheet] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({ hideCopyTrades: false, hidePositions: false, hidePnl: false });
  const [followPressed, setFollowPressed] = useState(false);
  const [copyPressed, setCopyPressed] = useState(false);
  const [counterPressed, setCounterPressed] = useState(false); // ★ NEW
  const [showTradeSettings, setShowTradeSettings] = useState(false);
  const [showTradeSuccess, setShowTradeSuccess] = useState(false);
  const [tradeMode, setTradeMode] = useState<TradeMode>("copy"); // ★ NEW

  const { triggerFirstCopyTrade, viewRewardsFromPrompt } = useRewards();

  // ── Load profile ─────────────────────────────────────
  useEffect(() => {
    if (!handle) { router.replace("/copyTrading"); return; }
    let cancelled = false;
    const fetchProfile = async () => {
      try {
        setLoading(true); setError(null);
        const data = await getTraderProfile(handle);
        if (cancelled) return;
        setTrader(data);
        setIsFollowing(data.is_followed);
        setIsCopying(data.is_copy_trading);
        setIsCounterTrading((data as any).is_counter_trading ?? false); // ★ NEW
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.response?.status === 404 ? "Trader not found" : "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProfile();
    return () => { cancelled = true; };
  }, [handle]);

  useEffect(() => {
    if (!handle || !isXConnected) return;
    let cancelled = false;
    const fetchSignals = async () => {
      setSignalsLoading(true);
      try { const res = await userSignals(handle); if (!cancelled) setSignals(res.signals); }
      catch (err) { console.error("Failed to fetch signals:", err); }
      finally { if (!cancelled) setSignalsLoading(false); }
    };
    fetchSignals();
    return () => { cancelled = true; };
  }, [handle, isXConnected]);

  // ── Follow handler ───────────────────────────────────
  const handleFollow = useCallback(async () => {
    if (followLoading || !trader) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowTrader(trader.username);
        setIsFollowing(false);
        setIsCopying(false);
        setIsCounterTrading(false);
      } else {
        try { await followTrader(trader.username); } catch (err: any) {
          if (err?.response?.status === 400) { setIsFollowing(true); return; }
          throw err;
        }
        setIsFollowing(true);
      }
    } catch (err: any) {
      if (err?.response?.status === 404) setIsFollowing(false);
      else console.error("Follow toggle failed:", err);
    } finally { setFollowLoading(false); }
  }, [isFollowing, followLoading, trader]);

  // ── Copy trade handler ───────────────────────────────
  const handleCopyToggle = useCallback(async () => {
    if (copyLoading || !trader) return;
    if (isCopying) {
      setCopyLoading(true);
      try {
        await toggleCopyTrading(trader.username);
        setIsCopying(false);
      } catch (err: any) {
        if (err?.response?.status === 404) { setIsCopying(false); setIsFollowing(false); }
        else console.error("Copy toggle off failed:", err);
      } finally { setCopyLoading(false); }
      return;
    }
    if (!hasEverTraded()) {
      setTradeMode("copy");
      setShowTradeSettings(true);
      return;
    }
    setCopyLoading(true);
    try {
      await followTrader(trader.username, true, false);
      setIsCopying(true);
      setIsFollowing(true);
      setIsCounterTrading(false); // mutual exclusivity
    } catch (err: any) {
      if (err?.response?.status === 400) {
        try { await toggleCopyTrading(trader.username); } catch { }
        setIsCopying(true); setIsFollowing(true); setIsCounterTrading(false);
      } else { console.error("Copy trade failed:", err); }
    } finally { setCopyLoading(false); }
  }, [isCopying, copyLoading, trader]);

  // ── Counter trade handler ★ NEW ──────────────────────
  const handleCounterToggle = useCallback(async () => {
    if (copyLoading || !trader) return;
    if (isCounterTrading) {
      setCopyLoading(true);
      try {
        await toggleCounterTrading(trader.username);
        setIsCounterTrading(false);
      } catch (err: any) {
        if (err?.response?.status === 404) { setIsCounterTrading(false); setIsFollowing(false); }
        else console.error("Counter toggle off failed:", err);
      } finally { setCopyLoading(false); }
      return;
    }
    if (!hasEverTraded()) {
      setTradeMode("counter");
      setShowTradeSettings(true);
      return;
    }
    setCopyLoading(true);
    try {
      await followTrader(trader.username, false, true);
      setIsCounterTrading(true);
      setIsFollowing(true);
      setIsCopying(false); // mutual exclusivity
    } catch (err: any) {
      if (err?.response?.status === 400) {
        try { await toggleCounterTrading(trader.username); } catch { }
        setIsCounterTrading(true); setIsFollowing(true); setIsCopying(false);
      } else { console.error("Counter trade failed:", err); }
    } finally { setCopyLoading(false); }
  }, [isCounterTrading, isCopying, copyLoading, trader]);

  // ── Settings confirm handler ─────────────────────────
  const handleTradeSettingsConfirm = async (cfg: any) => {
    if (!trader) return;
    try {
      const payload: DefaultFollowSettings = {
        tradeSizeType: cfg.sizeType,
        tradeSize: cfg.sizeVal,
        leverage: cfg.leverage,
        leverageType: "cross",
        tp: { type: cfg.tpType, value: cfg.tpVal },
        sl: { type: cfg.slType, value: cfg.slVal },
        orderType: "market",
      };
      await updateDefaultSettings(payload);

      if (tradeMode === "copy") {
        await followTrader(trader.username, true, false);
        markHasTraded();
        setShowTradeSettings(false);
        setIsCopying(true);
        setIsFollowing(true);
        setIsCounterTrading(false);
      } else {
        await followTrader(trader.username, false, true);
        markHasTraded();
        setShowTradeSettings(false);
        setIsCounterTrading(true);
        setIsFollowing(true);
        setIsCopying(false);
      }
      setTimeout(() => { setShowTradeSuccess(true); triggerFirstCopyTrade(); }, 200);
    } catch (e: any) {
      console.error("Trade setup failed:", e);
      alert(e?.message || "Failed to start trading.");
    }
  };

  const handleConnectX = () => {
    setShowConnectModal(true); setConnectStage("connecting");
    setTimeout(() => setConnectStage("success"), 1800);
  };
  const handleConnectDone = () => { setIsXConnected(true); setShowConnectModal(false); };

  if (loading) return <ProfileSkeleton />;
  if (error || !trader) return <ProfileError message={error || "Trader not found"} onBack={() => router.push("/copyTrading")} />;

  const radarData = trader.radar ?? { accuracy: 0, winRate: 0, riskReward: 0, consistency: 0, timing: 0, transparency: 0, engagement: 0, trackRecord: 0 };
  const radarAvg = Object.values(radarData).reduce((a, b) => a + b, 0) / 8;
  const kolGrade = getGradeFromString(trader.profit_grade, radarAvg);
  const displayName = trader.display_name || trader.username;
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const avatarBg = getAvatarColor(trader.username);
  const rank = trader.rank ?? 0;
  const signalPct = Math.round((trader.signal_to_noise ?? 0.5) * 100);
  const cumulative = trader.avg_return_pct ?? 0;
  const bestSignal = trader.best_signal;
  const worstSignal = trader.worst_signal;

  // Derived button states
  const canCopy = !isCounterTrading;
  const canCounter = !isCopying;

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)" }}>
      <style jsx global>{`
        @keyframes particleFloat{0%,100%{transform:translateY(0) translateX(0);opacity:.15}25%{transform:translateY(-25px) translateX(8px);opacity:.7}50%{transform:translateY(-10px) translateX(-8px);opacity:.3}75%{transform:translateY(-35px) translateX(4px);opacity:.55}}
        @keyframes streamRise{0%{transform:translateY(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-110vh);opacity:0}}
        @keyframes radarOrbitGlow{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        @keyframes radarPulseRing{0%{transform:scale(.6);opacity:.6}100%{transform:scale(1.8);opacity:0}}
        @keyframes radarDotPulse{0%,100%{r:6;opacity:.15}50%{r:10;opacity:.3}}
        @keyframes gradeRingSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        @keyframes gradeRingPulse{0%,100%{opacity:.5;filter:blur(1px)}50%{opacity:1;filter:blur(2px)}}
        @keyframes gradeBounce{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
        @keyframes shimmerSlide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
        @keyframes cardGlowPulse{0%,100%{box-shadow:0 0 15px rgba(45,212,191,.05),inset 0 0 30px rgba(45,212,191,.02)}50%{box-shadow:0 0 30px rgba(45,212,191,.15),inset 0 0 40px rgba(45,212,191,.05)}}
        @keyframes avatarPulse{0%,100%{box-shadow:0 0 15px rgba(59,130,246,.3)}50%{box-shadow:0 0 25px rgba(59,130,246,.5),0 0 45px rgba(59,130,246,.2)}}
        @keyframes statCardHover{0%,100%{border-color:rgba(255,255,255,.08)}50%{border-color:rgba(45,212,191,.2)}}
        @keyframes progressFill{from{width:0%}}
        @keyframes lockPulse{0%,100%{opacity:.5}50%{opacity:.8}}
        @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        @keyframes unlockReveal{from{opacity:0;transform:translateY(12px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes copyShimmer{0%{background-position:200% center}100%{background-position:-200% center}}
      `}</style>

      <Particles />
      <DataStreams />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/4 w-[350px] h-[350px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/4 -right-20 w-[250px] h-[250px] rounded-full" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 60%)", filter: "blur(50px)" }} />
      </div>

      {/* ── TopBar ── */}
      <TopBar
        activeTrades={trader.total_signals}
        rank={rank > 0 ? rank : null}
        extraRight={
          isXConnected ? (
            <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg" style={{ background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)" }}>
              <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" className="text-teal-400"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              <CheckCircle size={9} className="text-teal-400" />
            </div>
          ) : undefined
        }
      />

      {/* ── Search ── */}
      <ScrollReveal delay={0.05} direction="up" distance={14} duration={0.45}>
        <div className="relative z-10 px-4 mb-2.5">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Search size={14} className="text-gray-500 shrink-0" />
            <input type="text" placeholder="Search trader..." className="bg-transparent text-[11px] text-white placeholder-gray-500 outline-none w-full" />
          </div>
        </div>
      </ScrollReveal>

      {/* ── Profile Card ── */}
      <ScrollReveal delay={0.1} direction="up" distance={28} duration={0.6}>
        <div className="relative z-10 px-4 pt-1 pb-2">
          <div className="rounded-2xl p-3 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.08), rgba(45,212,191,0.02))", border: "1px solid rgba(45,212,191,0.2)", animation: "cardGlowPulse 4s ease-in-out infinite" }}>
            {/* Corner accents */}
            {[["top-1.5 left-1.5 border-t border-l rounded-tl-sm", "tl"], ["top-1.5 right-1.5 border-t border-r rounded-tr-sm", "tr"], ["bottom-1.5 left-1.5 border-b border-l rounded-bl-sm", "bl"], ["bottom-1.5 right-1.5 border-b border-r rounded-br-sm", "br"]].map(([cls]) => (
              <div key={cls} className={`absolute w-3 h-3 pointer-events-none z-20 ${cls}`} style={{ borderColor: "rgba(45,212,191,0.3)" }} />
            ))}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent, rgba(45,212,191,0.06), transparent)", animation: "shimmerSlide 5s ease-in-out infinite" }} />
            </div>
            <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: "radial-gradient(ellipse at top left, rgba(45,212,191,0.15), transparent 60%)" }} />

            <div className="relative z-10">
              {/* Avatar + Name + Grade */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {trader.avatar_url
                    ? <img src={trader.avatar_url} alt={displayName} className="w-12 h-12 rounded-xl object-cover" style={{ animation: "avatarPulse 3s ease-in-out infinite" }} />
                    : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold" style={{ backgroundColor: avatarBg, animation: "avatarPulse 3s ease-in-out infinite" }}>{avatarLetter}</div>
                  }
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h1 className="text-[15px] font-bold text-white tracking-tight">{displayName}</h1>
                      {rank > 0 && <div className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ background: "rgba(45,212,191,0.1)", color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.25)" }}>#{rank}</div>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor" className="text-gray-500"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                      <span className="text-[10px] text-teal-400 font-medium">@{trader.username}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="relative" style={{ width: 42, height: 42 }}>
                    <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(from 0deg, ${kolGrade.color}, ${kolGrade.color}22, ${kolGrade.color}, ${kolGrade.color}22, ${kolGrade.color})`, animation: "gradeRingSpin 8s linear infinite, gradeRingPulse 3s ease-in-out infinite" }} />
                    <div className="absolute rounded-full flex items-center justify-center" style={{ inset: 2, background: "linear-gradient(145deg, #141c24, #0a0f14)" }}>
                      <span className="text-base font-black tracking-tight" style={{ color: kolGrade.color, textShadow: `0 0 12px ${kolGrade.glow}, 0 0 24px ${kolGrade.glow}`, animation: "gradeBounce 3s ease-in-out infinite" }}>{kolGrade.grade}</span>
                    </div>
                  </div>
                  <span className="text-[7px] text-gray-500 mt-0.5 tracking-widest">GRADE</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 mb-2.5">
                <span className="text-[10px]"><span className="text-white font-bold">{trader.following_count}</span><span className="text-gray-500 font-medium"> Following</span></span>
                <span className="text-[10px]"><span className="text-white font-bold">{trader.followers_count}</span><span className="text-gray-500 font-medium"> Followers</span></span>
                <span className="text-[10px]"><span className="text-white font-bold">{trader.total_signals}</span><span className="text-gray-500 font-medium"> Signals</span></span>
              </div>

              {trader.bio && <p className="text-[11px] text-gray-400 leading-relaxed mb-3">{trader.bio}</p>}

              {/* Tags */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.12)" }}>
                  <Target size={9} className="text-teal-400" />
                  <span className="text-[9px] text-teal-400 font-semibold">{(trader.win_rate > 1 ? trader.win_rate : trader.win_rate * 100).toFixed(0)}% WR</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: cumulative >= 0 ? "rgba(45,212,191,0.06)" : "rgba(244,63,94,0.06)", border: `1px solid ${cumulative >= 0 ? "rgba(45,212,191,0.12)" : "rgba(244,63,94,0.12)"}` }}>
                  {cumulative >= 0 ? <TrendingUp size={9} className="text-teal-400" /> : <TrendingDown size={9} className="text-rose-400" />}
                  <span className="text-[9px] font-semibold" style={{ color: cumulative >= 0 ? "#2dd4bf" : "#f43f5e" }}>{cumulative >= 0 ? "+" : ""}{cumulative.toFixed(2)}% Avg</span>
                </div>
                {trader.streak > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.12)" }}>
                    <Flame size={9} className="text-orange-400" />
                    <span className="text-[9px] text-orange-400 font-semibold">{trader.streak} streak</span>
                  </div>
                )}
              </div>

              {/* ★ NEW: Copy + Counter Trade buttons (side by side) */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                {/* Copy Trade */}
                <button
                  onClick={handleCopyToggle}
                  disabled={copyLoading || !canCopy}
                  onPointerDown={() => setCopyPressed(true)}
                  onPointerUp={() => setCopyPressed(false)}
                  onPointerLeave={() => setCopyPressed(false)}
                  className="py-2.5 rounded-xl text-[12px] font-bold transition-all duration-300 cursor-pointer relative overflow-hidden"
                  style={
                    isCopying
                      ? { background: "rgba(45,212,191,0.15)", color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.25)", transform: copyPressed ? "scale(0.97)" : "scale(1)" }
                      : !canCopy
                        ? { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.06)", cursor: "not-allowed" }
                        : { background: "linear-gradient(135deg, #2dd4bf, #14b8a6)", color: "#0a0f14", boxShadow: "0 4px 20px rgba(45,212,191,0.35), inset 0 1px 0 rgba(255,255,255,0.2)", transform: copyPressed ? "scale(0.97)" : "scale(1)", opacity: copyLoading ? 0.7 : 1 }
                  }
                >
                  {!isCopying && canCopy && (
                    <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)", backgroundSize: "200% 100%", animation: "copyShimmer 3s ease-in-out infinite" }} />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    {copyLoading && isCopying === false && isCounterTrading === false
                      ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                      : isCopying
                        ? <><CheckCircle size={12} /><span>Copying ✓</span></>
                        : <><Copy size={12} /><span>Copy Trade</span></>
                    }
                  </span>
                </button>

                {/* Counter Trade ★ NEW */}
                <button
                  onClick={handleCounterToggle}
                  disabled={copyLoading || !canCounter}
                  onPointerDown={() => setCounterPressed(true)}
                  onPointerUp={() => setCounterPressed(false)}
                  onPointerLeave={() => setCounterPressed(false)}
                  className="py-2.5 rounded-xl text-[12px] font-bold transition-all duration-300 cursor-pointer relative overflow-hidden"
                  style={
                    isCounterTrading
                      ? { background: "rgba(244,63,94,0.15)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.25)", transform: counterPressed ? "scale(0.97)" : "scale(1)" }
                      : !canCounter
                        ? { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.06)", cursor: "not-allowed" }
                        : { background: "rgba(244,63,94,0.08)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.2)", transform: counterPressed ? "scale(0.97)" : "scale(1)", opacity: copyLoading ? 0.7 : 1 }
                  }
                >
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    {copyLoading && isCounterTrading === false && isCopying === false
                      ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                      : isCounterTrading
                        ? <><CheckCircle size={12} /><span>Countering ✓</span></>
                        : <><RefreshCw size={12} /><span>Counter Trade</span></>
                    }
                  </span>
                </button>
              </div>

              {/* Follow + Share */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  onPointerDown={() => setFollowPressed(true)}
                  onPointerUp={() => setFollowPressed(false)}
                  onPointerLeave={() => setFollowPressed(false)}
                  className="py-2 rounded-xl text-[10px] font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
                  style={
                    isFollowing
                      ? { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)", transform: followPressed ? "scale(0.95)" : "scale(1)" }
                      : { background: "rgba(45,212,191,0.06)", color: "rgba(45,212,191,0.85)", border: "1px solid rgba(45,212,191,0.15)", transform: followPressed ? "scale(0.95)" : "scale(1)", opacity: followLoading ? 0.7 : 1 }
                  }
                >
                  {followLoading ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : isFollowing ? <UserCheck size={11} /> : <UserPlus size={11} />}
                  <span>{isFollowing ? "Following" : "Follow"}</span>
                </button>
                <button
                  onClick={() => setShowShareSheet(true)}
                  className="py-2 rounded-xl text-[10px] font-medium cursor-pointer transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5"
                  style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <Share2 size={11} /><span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ── Tabs ── */}
      <ScrollReveal delay={0} direction="up" distance={18} duration={0.45}>
        <div className="relative z-10 px-4 mb-2">
          <div className="flex p-0.5 rounded-lg relative" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="absolute top-0.5 bottom-0.5 rounded-md transition-all duration-300" style={{
              width: `calc(${100 / TAB_DEFS.length}% - 2px)`,
              left: activeTab === "overview" ? "2px" : activeTab === "signals" ? `calc(${100 / TAB_DEFS.length}%)` : `calc(${200 / TAB_DEFS.length}%)`,
              background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.3)",
            }} />
            {TAB_DEFS.map(tab => {
              const showLock = tab.locked && !isXConnected;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all duration-300 relative z-10 cursor-pointer flex items-center justify-center gap-1" style={{ color: activeTab === tab.key ? "rgba(45,212,191,1)" : "rgba(255,255,255,0.4)" }}>
                  {showLock && <Lock size={9} style={{ opacity: activeTab === tab.key ? 0.9 : 0.4, animation: "lockPulse 2s ease-in-out infinite" }} />}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </ScrollReveal>

      {/* ── Tab Content ── */}
      <div className="relative z-10 px-4 pb-24">
        {activeTab === "overview" && (
          <div className="space-y-1.5">
            <ScrollReveal direction="scale" delay={0}>
              <div className="rounded-xl p-2 relative overflow-hidden" style={cardStyle}>
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(45,212,191,0.04) 0%, transparent 70%)" }} />
                <div className="flex items-center justify-between mb-0 relative z-10">
                  <span className="text-[10px] font-semibold text-white">Performance Radar</span>
                </div>
                <RadarChart data={radarData as unknown as Record<string, number>} size={190} />
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                bestSignal ? { icon: Trophy, ic: "text-teal-400", ib: "bg-teal-400/10", label: "Best Signal", val: Math.abs(bestSignal.pnl), pre: bestSignal.pnl >= 0 ? "+" : "-", suf: "%", color: "text-teal-400", sub: `${bestSignal.token} · ${bestSignal.date}` } : null,
                worstSignal ? { icon: AlertCircle, ic: "text-rose-400", ib: "bg-rose-400/10", label: "Worst Signal", val: Math.abs(worstSignal.pnl), pre: worstSignal.pnl >= 0 ? "+" : "-", suf: "%", color: "text-rose-400", sub: `${worstSignal.token} · ${worstSignal.date}` } : null,
                { icon: Flame, ic: "text-orange-400", ib: "bg-orange-400/10", label: "Win Streak", val: trader.streak, pre: "", suf: trader.streak === 1 ? " win" : " wins", color: "text-white", sub: "" },
                { icon: BarChart3, ic: "text-purple-400", ib: "bg-purple-400/10", label: "Avg Return", val: Math.abs(cumulative), pre: cumulative >= 0 ? "+" : "-", suf: "%", color: "text-white", sub: `${trader.total_signals} signals` },
              ].filter((item): item is NonNullable<typeof item> => item !== null).map((item, i) => {
                const Icon = item.icon;
                return (
                  <ScrollReveal key={i} delay={i * 0.06} direction={i % 2 === 0 ? "left" : "right"} distance={18}>
                    <div className="rounded-xl px-2 py-1.5 relative overflow-hidden transition-all duration-300 hover:scale-[1.03]" style={{ ...cardStyle, animation: `statCardHover ${3 + i}s ease-in-out infinite` }}>
                      <div className="flex items-center gap-1 mb-0.5 relative z-10">
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${item.ib}`}><Icon size={9} className={item.ic} /></div>
                        <span className="text-[8px] text-gray-500">{item.label}</span>
                      </div>
                      <p className={`text-[12px] font-bold leading-tight relative z-10 ${item.color}`}><AnimatedNumber value={item.val} prefix={item.pre} suffix={item.suf} decimals={item.val % 1 !== 0 ? 1 : 0} /></p>
                      {item.sub && <p className="text-[7px] text-gray-500 relative z-10">{item.sub}</p>}
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>

            <ScrollReveal direction="up" delay={0}>
              <div className="rounded-xl p-2.5 relative overflow-hidden" style={cardStyle}>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-[8px] text-gray-400 shrink-0">Signal vs Noise</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${signalPct}%`, background: "linear-gradient(90deg, rgba(45,212,191,1), rgba(45,212,191,0.7))", boxShadow: "0 0 10px rgba(45,212,191,0.5)", animation: "progressFill 1.5s ease 1s both" }} />
                  </div>
                  <span className="text-[8px] text-teal-400 font-semibold shrink-0"><AnimatedNumber value={signalPct} suffix="%" /></span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Users, ic: "text-blue-400", ib: "bg-blue-400/10", val: trader.copiers_count, label: "Copiers" },
                    { icon: Award, ic: "text-yellow-400", ib: "bg-yellow-400/10", val: trader.points, label: "Points" },
                    { icon: Zap, ic: "text-teal-400", ib: "bg-teal-400/10", val: trader.total_signals, label: "Signals" },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${s.ib}`}><s.icon size={11} className={s.ic} /></div>
                      <div>
                        <p className="text-[12px] font-bold text-white">{s.val}</p>
                        <p className="text-[7px] text-gray-500">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        )}

        {activeTab === "signals" && (
          isXConnected ? (
            signalsLoading
              ? <div className="flex items-center justify-center py-16"><Loader2 size={24} className="text-teal-400" style={{ animation: "spin 1s linear infinite" }} /></div>
              : signals.length === 0
                ? <EmptyState icon={Zap} title="No Signal Data Yet" description="This trader hasn't posted any signals yet." />
                : (() => {
                  const wins = signals.filter(s => s.change_since_tweet > 0);
                  const losses = signals.filter(s => s.change_since_tweet < 0);
                  const filtered = signalFilter === "wins" ? wins : signalFilter === "losses" ? losses : signals;
                  const totalAvgPnl = signals.reduce((a, s) => a + s.change_since_tweet, 0) / signals.length;
                  const winRate = (wins.length / signals.length) * 100;
                  const parseAge = (str: string) => { const m = str.match(/(\d+)(m|h|d)/); if (!m) return 0; const n = parseInt(m[1]); return m[2] === "d" ? n * 1440 : m[2] === "h" ? n * 60 : n; };
                  const sorted = [...signals].sort((a, b) => parseAge(b.updateTime) - parseAge(a.updateTime));
                  let cum = 0;
                  const pnlData = sorted.map((s, i) => { cum += s.change_since_tweet; return { idx: i, cumPnl: parseFloat(cum.toFixed(2)), ticker: s.ticker }; });
                  const rangeLimit = pnlRange === "1W" ? 7 : pnlRange === "1M" ? 30 : pnlRange === "3M" ? 90 : 9999;
                  const pnlFiltered = pnlRange === "ALL" ? pnlData : pnlData.slice(-rangeLimit);
                  const totalCumPnl = pnlData.length > 0 ? pnlData[pnlData.length - 1].cumPnl : 0;
                  return (
                    <div className="space-y-1.5" style={{ animation: "unlockReveal 0.5s ease both" }}>
                      <ScrollReveal direction="scale" delay={0}>
                        <div className="rounded-xl p-3 relative overflow-hidden" style={cardStyle}>
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <span className="text-[10px] text-gray-400 font-medium">PnL Curve</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <TrendingUp size={14} className={totalCumPnl >= 0 ? "text-teal-400" : "text-rose-400"} />
                                <span className="text-[16px] font-bold" style={{ color: totalCumPnl >= 0 ? "#2dd4bf" : "#f43f5e" }}>{totalCumPnl >= 0 ? "+" : ""}{totalCumPnl.toFixed(1)}%</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                              {(["1W", "1M", "3M", "ALL"] as const).map(r => (
                                <button key={r} onClick={() => setPnlRange(r)} className="px-2 py-1 rounded-md text-[9px] font-semibold transition-all cursor-pointer" style={pnlRange === r ? { background: "rgba(45,212,191,0.2)", color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.3)" } : { color: "rgba(255,255,255,0.4)" }}>{r}</button>
                              ))}
                            </div>
                          </div>
                          <div style={{ height: 140 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={pnlFiltered} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={totalCumPnl >= 0 ? "#2dd4bf" : "#f43f5e"} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={totalCumPnl >= 0 ? "#2dd4bf" : "#f43f5e"} stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="idx" hide />
                                <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                                <Tooltip contentStyle={{ background: "rgba(15,20,25,0.95)", border: "1px solid rgba(45,212,191,0.2)", borderRadius: 8, fontSize: 10 }} labelStyle={{ color: "rgba(255,255,255,0.5)" }} formatter={((v: number | undefined) => [`${(v ?? 0) >= 0 ? "+" : ""}${(v ?? 0).toFixed(2)}%`, "Cumulative"]) as any} labelFormatter={(i) => pnlFiltered[i as number]?.ticker || ""} />
                                <Area type="monotone" dataKey="cumPnl" stroke={totalCumPnl >= 0 ? "#2dd4bf" : "#f43f5e"} strokeWidth={1.5} fill="url(#pnlGrad)" dot={false} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </ScrollReveal>

                      <ScrollReveal direction="up" delay={0.05}>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { icon: Zap, ic: "text-teal-400", bg: "bg-teal-400/10", label: "Total Signals", value: String(signals.length) },
                            { icon: Target, ic: "text-teal-400", bg: "bg-teal-400/10", label: "Win Rate", value: `${winRate.toFixed(0)}%` },
                            { icon: TrendingUp, ic: totalAvgPnl >= 0 ? "text-teal-400" : "text-rose-400", bg: totalAvgPnl >= 0 ? "bg-teal-400/10" : "bg-rose-400/10", label: "Avg PnL", value: `${totalAvgPnl >= 0 ? "+" : ""}${totalAvgPnl.toFixed(1)}%` },
                          ].map((s, i) => {
                            const SIcon = s.icon;
                            return (
                              <div key={i} className="rounded-xl p-2.5 relative overflow-hidden" style={cardStyle}>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${s.bg}`}><SIcon size={10} className={s.ic} /></div>
                                  <span className="text-[8px] text-gray-500">{s.label}</span>
                                </div>
                                <p className="text-[14px] font-bold text-white">{s.value}</p>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollReveal>

                      <ScrollReveal direction="up" delay={0.08}>
                        <div className="flex p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          {[{ key: "all" as const, label: `All (${signals.length})` }, { key: "wins" as const, label: `Wins (${wins.length})` }, { key: "losses" as const, label: `Losses (${losses.length})` }].map(f => (
                            <button key={f.key} onClick={() => setSignalFilter(f.key)} className="flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all cursor-pointer" style={signalFilter === f.key ? { background: "rgba(45,212,191,0.15)", color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.3)" } : { color: "rgba(255,255,255,0.4)" }}>{f.label}</button>
                          ))}
                        </div>
                      </ScrollReveal>

                      <div className="space-y-1.5">
                        {filtered.map((sig, i) => {
                          const isWin = sig.change_since_tweet > 0;
                          const pnlColor = isWin ? "#2dd4bf" : sig.change_since_tweet < 0 ? "#f43f5e" : "rgba(255,255,255,0.5)";
                          const dirColor = sig.bull_or_bear === "bullish" ? "#2dd4bf" : "#f43f5e";
                          const dirLabel = sig.bull_or_bear === "bullish" ? "LONG" : "SHORT";
                          return (
                            <ScrollReveal key={sig.signal_id} delay={Math.min(i * 0.03, 0.3)} direction="up" distance={14}>
                              <div className="rounded-xl p-3 relative overflow-hidden transition-all duration-300" style={cardStyle}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[14px] font-bold text-white">${sig.ticker}</span>
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ background: `${dirColor}20`, color: dirColor, border: `1px solid ${dirColor}30` }}>{dirLabel}</span>
                                    <div className="flex items-center gap-0.5 text-gray-500"><Clock size={8} /><span className="text-[9px]">{sig.updateTime}</span></div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {isWin ? <ArrowUpRight size={12} style={{ color: pnlColor }} /> : <ArrowDownRight size={12} style={{ color: pnlColor }} />}
                                    <span className="text-[13px] font-bold" style={{ color: pnlColor }}>{sig.change_since_tweet >= 0 ? "+" : ""}{sig.change_since_tweet.toFixed(1)}%</span>
                                  </div>
                                </div>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    {sig.entry_price > 0 && (
                                      <div className="flex items-center gap-3 mb-1.5">
                                        <div><span className="text-[8px] text-gray-500 block">Entry</span><span className="text-[11px] font-semibold text-white">${sig.entry_price.toLocaleString()}</span></div>
                                      </div>
                                    )}
                                    {sig.content && <p className="text-[9px] text-gray-400 leading-relaxed line-clamp-2">{sig.content}</p>}
                                  </div>
                                </div>
                                {(sig.likesCount > 0 || sig.retweetsCount > 0 || sig.commentsCount > 0) && (
                                  <div className="flex items-center gap-3 mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                                    {sig.likesCount > 0 && <span className="text-[8px] text-gray-500">❤️ {sig.likesCount.toLocaleString()}</span>}
                                    {sig.retweetsCount > 0 && <span className="text-[8px] text-gray-500">🔁 {sig.retweetsCount.toLocaleString()}</span>}
                                    {sig.commentsCount > 0 && <span className="text-[8px] text-gray-500">💬 {sig.commentsCount.toLocaleString()}</span>}
                                  </div>
                                )}
                              </div>
                            </ScrollReveal>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
          ) : <LockedTabContent title="Unlock Signals" description="See real-time trading signals, calls, and market insights from this trader." onConnect={handleConnectX} />
        )}

        {activeTab === "positions" && (
          isXConnected
            ? <EmptyState icon={Eye} title="No Position Data Yet" description="Copied positions will appear here once the positions API is connected." />
            : <LockedTabContent title="Unlock Copied Positions" description="See positions opened by copiers based on this KOL's signals." onConnect={handleConnectX} />
        )}
      </div>

      {/* ── Modals & Sheets ── */}
      <ConnectXModal isOpen={showConnectModal} stage={connectStage} onClose={handleConnectDone} />
      <PrivacySheet isOpen={showPrivacySheet} onClose={() => setShowPrivacySheet(false)} settings={privacySettings} onToggle={k => setPrivacySettings(p => ({ ...p, [k]: !p[k] }))} />
      <ShareSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        traderData={{
          name: displayName, handle: `@${trader.username}`, avatar: avatarLetter, avatarBg,
          rank, grade: kolGrade.grade, gradeColor: kolGrade.color, gradeGlow: kolGrade.glow,
          tags: [], radar: radarData as unknown as Record<string, number>,
          cumulative, streak: trader.streak, signalPct,
          bestTrade: bestSignal ?? { token: "—", pnl: 0, date: "—" },
          tradersCopying: trader.copiers_count,
        }}
      />
      {showTradeSettings && trader && (
        <ProfileTradeSettingsSheet
          traderName={trader.username}
          mode={tradeMode}
          onConfirm={handleTradeSettingsConfirm}
          onClose={() => setShowTradeSettings(false)}
        />
      )}
      {showTradeSuccess && trader && (
        <ProfileTradeSuccessSheet
          traderName={trader.username}
          mode={tradeMode}
          onViewRewards={() => { setShowTradeSuccess(false); viewRewardsFromPrompt(); router.push("/dashboard"); }}
          onDone={() => setShowTradeSuccess(false)}
        />
      )}
    </div>
  );
}