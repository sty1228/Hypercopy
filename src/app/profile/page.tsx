"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import profileIcon from "@/assets/icons/profile.png";
import copyCountIcon from "@/assets/icons/copy-count.png";
import copyRankIcon from "@/assets/icons/copy-rank.png";
import {
  Target, Users, Award, BarChart3, Share2,
  ArrowUpRight, ArrowDownRight, Flame, Trophy, AlertCircle,
  CheckCircle, Search, Lock, TrendingUp, TrendingDown, Clock,
  Zap, Eye, ChevronRight, Loader2, ExternalLink, ShieldCheck,
  UserPlus, UserCheck, Copy,
} from "lucide-react";
import FollowingSheet from "./components/followingSheet";
import TradersCopyingSheet from "./components/tradersCopyingSheet";
import type { FollowingUser } from "./components/followingItem";
import type { CopyingTrader } from "./components/traderCopyingItem";
import UserMenu from "@/components/UserMenu";
import ShareSheet from "./components/shareSheet";
import {
  getTraderProfile, followTrader, unfollowTrader, toggleCopyTrading,
  userSignals,
  type TraderProfile, type RadarData, type UserSignalItem,
} from "@/service";

/* ─────────────── Scroll Animation Hook ──────────── */

function useScrollReveal<T extends HTMLElement>(opts?: { threshold?: number; delay?: number; once?: boolean }) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); if (opts?.once !== false) obs.disconnect(); } else if (opts?.once === false) setVisible(false); },
      { threshold: opts?.threshold ?? 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

const ScrollReveal = ({ children, className = "", style, delay = 0, direction = "up", distance = 28, duration = 0.6 }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
  delay?: number; direction?: "up" | "down" | "left" | "right" | "scale"; distance?: number; duration?: number;
}) => {
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });
  const tx = direction === "left" ? `-${distance}px` : direction === "right" ? `${distance}px` : "0";
  const ty = direction === "up" ? `${distance}px` : direction === "down" ? `-${distance}px` : "0";
  const sc = direction === "scale" ? 0.92 : 1;
  return (
    <div ref={ref} className={className} style={{
      ...style,
      opacity: visible ? 1 : 0,
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
      <div key={i} className="absolute rounded-full" style={{ width: `${Math.random() * 3 + 1}px`, height: `${Math.random() * 3 + 1}px`, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, background: i % 3 === 0 ? "rgba(45,212,191,0.5)" : i % 3 === 1 ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.2)", animation: `particleFloat ${5 + Math.random() * 10}s ease-in-out infinite`, animationDelay: `${Math.random() * 5}s` }} />
    ))}
  </div>
);

const DataStreams = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="absolute" style={{ width: "1px", height: "40px", left: `${20 + i * 20}%`, bottom: "-40px", background: `linear-gradient(to top, transparent, rgba(45,212,191,${0.15 + i * 0.05}), transparent)`, animation: `streamRise ${4 + Math.random() * 3}s linear infinite`, animationDelay: `${Math.random() * 4}s` }} />
    ))}
  </div>
);

const IconWithTooltip = ({ tooltip, children }: { tooltip: string; children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(timer);
  }, [show]);
  return (
    <div className="relative" onClick={() => setShow((p) => !p)}>
      {children}
      <div className="absolute top-full right-0 mt-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap text-[10px] font-medium pointer-events-none transition-all duration-200 z-50"
        style={{ background: "rgba(15,20,25,0.95)", border: "1px solid rgba(45,212,191,0.3)", color: "rgba(255,255,255,0.9)", boxShadow: "0 4px 12px rgba(0,0,0,0.4)", opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(-4px)" }}>
        {tooltip}
      </div>
    </div>
  );
};

const AnimatedNumber = ({ value, prefix = "", suffix = "", decimals = 0, duration = 1200 }: { value: number; prefix?: string; suffix?: string; decimals?: number; duration?: number }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const steps = 40; let step = 0;
        const t = setInterval(() => { step++; setDisplay(value * (1 - Math.pow(1 - step / steps, 3))); if (step >= steps) clearInterval(t); }, duration / steps);
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

const cardStyle = { background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)", border: "1px solid rgba(255,255,255,0.08)" };

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

  useEffect(() => { const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setAnimated(true); o.disconnect(); } }, { threshold: 0.3 }); if (ref.current) o.observe(ref.current); return () => o.disconnect(); }, []);
  useEffect(() => { if (!animated) return; const d = 1200, n = 50; let i = 0; const t = setInterval(() => { i++; const p = 1 - Math.pow(1 - i / n, 3); setCur(zeroPts.map((z, j) => ({ x: z.x + (pts[j].x - z.x) * p, y: z.y + (pts[j].y - z.y) * p }))); if (i >= n) clearInterval(t); }, d / n); return () => clearInterval(t); }, [animated]);

  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: animated ? 1 : 0, transition: "opacity 0.8s ease 0.3s" }}>
        <div style={{ width: size * 0.7, height: size * 0.7, borderRadius: "50%", background: "conic-gradient(from 0deg, rgba(45,212,191,0.12), transparent, rgba(45,212,191,0.08), transparent, rgba(45,212,191,0.12))", animation: animated ? "radarOrbitGlow 6s linear infinite" : "none", filter: "blur(15px)" }} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 1, 2].map((i) => (<div key={i} className="absolute rounded-full" style={{ width: size * 0.5, height: size * 0.5, border: "1px solid rgba(45,212,191,0.15)", opacity: animated ? 1 : 0, animation: animated ? `radarPulseRing 3s ease-out ${i}s infinite` : "none" }} />))}
      </div>
      <svg ref={ref} width={size} height={size} className="mx-auto relative z-10" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="rgba(45,212,191,0.45)" /><stop offset="100%" stopColor="rgba(45,212,191,0.08)" /></linearGradient>
          <filter id="radarGlow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(45,212,191,0.15)" /><stop offset="100%" stopColor="transparent" /></radialGradient>
        </defs>
        <circle cx={cx} cy={cx} r={r * 0.3} fill="url(#centerGlow)" style={{ opacity: animated ? 1 : 0, transition: "opacity 1s ease 0.5s" }} />
        {[...Array(lvl)].map((_, li) => { const lr = r * ((li + 1) / lvl); const p = dims.map((_, i) => { const a = s * i - Math.PI / 2; return `${cx + lr * Math.cos(a)},${cx + lr * Math.sin(a)}`; }).join(" "); return <polygon key={li} points={p} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" style={{ opacity: animated ? 1 : 0, transition: `opacity 0.4s ease ${0.1 + li * 0.08}s` }} />; })}
        {dims.map((_, i) => { const a = s * i - Math.PI / 2; return <line key={i} x1={cx} y1={cx} x2={cx + r * Math.cos(a)} y2={cx + r * Math.sin(a)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" style={{ opacity: animated ? 1 : 0, transition: `opacity 0.3s ease ${i * 0.05}s` }} />; })}
        <path d={pathD(cur)} fill="url(#rg)" stroke="rgba(45,212,191,0.9)" strokeWidth="1.5" filter="url(#radarGlow)" style={{ opacity: animated ? 1 : 0, transition: "opacity 0.4s ease 0.2s" }} />
        <path d={pathD(cur)} fill="none" stroke="rgba(45,212,191,0.2)" strokeWidth="6" style={{ opacity: animated ? 1 : 0, transition: "opacity 0.6s ease 0.4s", filter: "blur(4px)" }} />
        {cur.map((p, i) => (<g key={i}><circle cx={p.x} cy={p.y} r="6" fill="rgba(45,212,191,0.15)" style={{ opacity: animated ? 1 : 0, transition: `opacity 0.4s ease ${0.6 + i * 0.08}s`, animation: animated ? `radarDotPulse 2s ease-in-out ${i * 0.25}s infinite` : "none" }} /><circle cx={p.x} cy={p.y} r="3" fill="#2dd4bf" style={{ opacity: animated ? 1 : 0, transition: `opacity 0.3s ease ${0.6 + i * 0.08}s`, filter: "drop-shadow(0 0 6px rgba(45,212,191,0.9))" }} /></g>))}
        {dims.map((d, i) => { const a = s * i - Math.PI / 2, lr = r + 22, x = cx + lr * Math.cos(a), y = cx + lr * Math.sin(a); let anc: "start" | "middle" | "end" = "middle"; if (Math.cos(a) > 0.3) anc = "start"; else if (Math.cos(a) < -0.3) anc = "end"; return <text key={i} x={x} y={y} textAnchor={anc} dominantBaseline="middle" fontSize="7.5" fill="rgba(255,255,255,0.45)" style={{ opacity: animated ? 1 : 0, transition: `opacity 0.4s ease ${0.3 + i * 0.06}s` }}>{d.label}</text>; })}
        {animated && pts.map((p, i) => { const a = s * i - Math.PI / 2, o = 13; return <text key={`v${i}`} x={p.x + o * Math.cos(a)} y={p.y + o * Math.sin(a)} textAnchor="middle" dominantBaseline="middle" fontSize="6.5" fill="rgba(45,212,191,0.7)" fontWeight="bold" style={{ opacity: animated ? 1 : 0, transition: `opacity 0.4s ease ${1 + i * 0.08}s` }}>{data[dims[i].key]}</text>; })}
      </svg>
    </div>
  );
};

/* ─────────────── Empty State Component ──────────── */

const EmptyState = ({ icon: Icon, title, description }: { icon: typeof Zap; title: string; description: string }) => (
  <div className="rounded-xl p-8 flex flex-col items-center text-center" style={cardStyle}>
    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <Icon size={20} className="text-gray-500" />
    </div>
    <p className="text-[12px] font-semibold text-white mb-1">{title}</p>
    <p className="text-[10px] text-gray-500 max-w-[220px]">{description}</p>
  </div>
);

/* ─────────────── Connect X Modal ────────────────── */

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

/* ─────────────── Locked Tab Content ─────────────── */

const LockedTabContent = ({ title, description, onConnect }: { title: string; description: string; onConnect: () => void }) => (
  <div className="rounded-xl overflow-hidden relative" style={cardStyle}>
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center" style={{ background: "radial-gradient(ellipse at center, rgba(45,212,191,0.03) 0%, transparent 70%)" }}>
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(45,212,191,0.04)", border: "1.5px solid rgba(45,212,191,0.12)" }}><Lock size={22} className="text-teal-400" style={{ opacity: 0.5 }} /></div>
        <div className="absolute rounded-full pointer-events-none" style={{ inset: -6, border: "1px solid rgba(45,212,191,0.06)", borderRadius: "50%" }} />
        {[0, 1].map((i) => (<div key={i} className="absolute rounded-full pointer-events-none" style={{ inset: -4, border: "1px solid rgba(45,212,191,0.1)", borderRadius: "50%", animation: `radarPulseRing 3s ease-out ${i * 1.5}s infinite` }} />))}
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

/* ─────────────── Privacy Settings Sheet ─────────── */

const PrivacySheet = ({ isOpen, onClose, settings, onToggle }: {
  isOpen: boolean; onClose: () => void;
  settings: { hideCopyTrades: boolean; hidePositions: boolean; hidePnl: boolean };
  onToggle: (key: "hideCopyTrades" | "hidePositions" | "hidePnl") => void;
}) => {
  const [sheetVisible, setSheetVisible] = useState(false);
  useEffect(() => { if (isOpen) { requestAnimationFrame(() => setSheetVisible(true)); } else { setSheetVisible(false); } }, [isOpen]);
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
          <div><h2 className="text-base font-bold text-white">Privacy Settings</h2><span className="text-[11px] text-gray-500">Control what others can see</span></div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-white/10" style={{ background: "rgba(255,255,255,0.05)" }}><Lock size={14} className="text-gray-400" /></button>
        </div>
        <div className="px-4 pb-6 space-y-2">
          {items.map((item) => { const on = settings[item.key]; return (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: on ? "rgba(244,63,94,0.1)" : "rgba(45,212,191,0.1)" }}><item.icon size={14} className={on ? "text-rose-400" : "text-teal-400"} /></div>
                <div><p className="text-[12px] font-semibold text-white">{item.label}</p><p className="text-[9px] text-gray-500 max-w-[200px]">{item.desc}</p></div>
              </div>
              <button onClick={() => onToggle(item.key)} className="shrink-0 cursor-pointer transition-all duration-300 rounded-full" style={{ width: 40, height: 22, background: on ? "rgba(45,212,191,0.8)" : "rgba(255,255,255,0.1)", border: `1px solid ${on ? "rgba(45,212,191,0.5)" : "rgba(255,255,255,0.1)"}`, position: "relative" }}>
                <div className="absolute top-0.5 rounded-full transition-all duration-300" style={{ width: 18, height: 18, left: on ? 19 : 1, background: on ? "#fff" : "rgba(255,255,255,0.4)", boxShadow: on ? "0 0 8px rgba(45,212,191,0.5)" : "none" }} />
              </button>
            </div>
          ); })}
        </div>
      </div>
    </>
  );
};

/* ─────────────── Tab Definitions ─────────────────── */

const TAB_DEFS = [
  { key: "overview", label: "Analysis", locked: false },
  { key: "signals", label: "Signals", locked: true },
  { key: "positions", label: "Positions", locked: true },
] as const;

/* ─────────────── Loading Skeleton ────────────────── */

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

/* ─────────────── Error State ────────────────────── */

const ProfileError = ({ message, onBack }: { message: string; onBack: () => void }) => (
  <div className="min-h-screen text-white relative flex items-center justify-center" style={{ background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)" }}>
    <div className="flex flex-col items-center gap-3 px-6 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(244,63,94,0.08)", border: "1.5px solid rgba(244,63,94,0.15)" }}>
        <AlertCircle size={24} className="text-rose-400" />
      </div>
      <h2 className="text-sm font-bold text-white">{message}</h2>
      <button onClick={onBack} className="px-5 py-2 rounded-xl text-[11px] font-semibold cursor-pointer transition-all active:scale-95" style={{ background: "rgba(45,212,191,0.12)", color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.2)" }}>
        Back to Leaderboard
      </button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════
   Main Page — Suspense wrapper for useSearchParams
   ═══════════════════════════════════════════════════ */

export default function KOLProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <KOLProfileContent />
    </Suspense>
  );
}

/* ═══════════════════════════════════════════════════
   Inner Content — ALL data from API, ZERO mock data
   ═══════════════════════════════════════════════════ */

function KOLProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const handle = searchParams.get("handle")?.replace(/^@/, "") ?? "";

  /* ── API data state ── */
  const [trader, setTrader] = useState<TraderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── Signals data ── */
  const [signals, setSignals] = useState<UserSignalItem[]>([]);
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [signalFilter, setSignalFilter] = useState<"all" | "wins" | "losses">("all");
  const [pnlRange, setPnlRange] = useState<"1W" | "1M" | "3M" | "ALL">("ALL");

  /* ── UI state ── */
  const [activeTab, setActiveTab] = useState("overview");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);
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

  /* ── Fetch trader profile ── */
  useEffect(() => {
    if (!handle) { setError("No trader handle provided"); setLoading(false); return; }
    let cancelled = false;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTraderProfile(handle);
        if (cancelled) return;
        setTrader(data);
        setIsFollowing(data.is_followed);
        setIsCopying(data.is_copy_trading);
      } catch (err: any) {
        if (cancelled) return;
        const status = err?.response?.status;
        if (status === 404) setError("Trader not found");
        else setError("Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProfile();
    return () => { cancelled = true; };
  }, [handle]);

  /* ── Fetch signals when X connected ── */
  useEffect(() => {
    if (!handle || !isXConnected) return;
    let cancelled = false;
    const fetchSignals = async () => {
      setSignalsLoading(true);
      try {
        const res = await userSignals(handle);
        if (!cancelled) setSignals(res.signals);
      } catch (err) {
        console.error("Failed to fetch signals:", err);
      } finally {
        if (!cancelled) setSignalsLoading(false);
      }
    };
    fetchSignals();
    return () => { cancelled = true; };
  }, [handle, isXConnected]);

  /* ── Follow / Unfollow ── */
  const handleFollow = useCallback(async () => {
    if (followLoading || !trader) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowTrader(trader.username);
        setIsFollowing(false);
      } else {
        await followTrader(trader.username);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error("Follow toggle failed:", err);
    } finally {
      setFollowLoading(false);
    }
  }, [isFollowing, followLoading, trader]);

  /* ── Copy Trading toggle ── */
  const handleCopyToggle = useCallback(async () => {
    if (copyLoading || !trader) return;
    setCopyLoading(true);
    try {
      if (isCopying) {
        await unfollowTrader(trader.username);
        setIsCopying(false);
        setIsFollowing(false);
      } else {
        await followTrader(trader.username, true);
        setIsCopying(true);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error("Copy toggle failed:", err);
    } finally {
      setCopyLoading(false);
    }
  }, [isCopying, copyLoading, trader]);

  /* ── Connect X (still mock — no real X OAuth yet) ── */
  const handleConnectX = () => {
    setShowConnectModal(true);
    setConnectStage("connecting");
    setTimeout(() => setConnectStage("success"), 1800);
  };
  const handleConnectDone = () => { setIsXConnected(true); setShowConnectModal(false); };

  /* ── Loading / Error states ── */
  if (loading) return <ProfileSkeleton />;
  if (error || !trader) return <ProfileError message={error || "Trader not found"} onBack={() => router.push("/copyTrading")} />;

  /* ── Derived data from API response ── */
  const radarData = trader.radar;
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

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)" }}>
      <style jsx global>{`
        @keyframes particleFloat { 0%,100%{transform:translateY(0) translateX(0);opacity:.15} 25%{transform:translateY(-25px) translateX(8px);opacity:.7} 50%{transform:translateY(-10px) translateX(-8px);opacity:.3} 75%{transform:translateY(-35px) translateX(4px);opacity:.55} }
        @keyframes streamRise { 0%{transform:translateY(0);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translateY(-110vh);opacity:0} }
        @keyframes radarOrbitGlow { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes radarPulseRing { 0%{transform:scale(.6);opacity:.6} 100%{transform:scale(1.8);opacity:0} }
        @keyframes radarDotPulse { 0%,100%{r:6;opacity:.15} 50%{r:10;opacity:.3} }
        @keyframes profileFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes gradeRingSpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes gradeRingPulse { 0%,100%{opacity:.5;filter:blur(1px)} 50%{opacity:1;filter:blur(2px)} }
        @keyframes gradeBounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes shimmerSlide { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes cardGlowPulse { 0%,100%{box-shadow:0 0 15px rgba(45,212,191,.05),inset 0 0 30px rgba(45,212,191,.02)} 50%{box-shadow:0 0 30px rgba(45,212,191,.15),inset 0 0 40px rgba(45,212,191,.05)} }
        @keyframes avatarPulse { 0%,100%{box-shadow:0 0 15px rgba(59,130,246,.3)} 50%{box-shadow:0 0 25px rgba(59,130,246,.5),0 0 45px rgba(59,130,246,.2)} }
        @keyframes statCardHover { 0%,100%{border-color:rgba(255,255,255,.08)} 50%{border-color:rgba(45,212,191,.2)} }
        @keyframes progressFill { from{width:0%} }
        @keyframes lockPulse { 0%,100%{opacity:.5} 50%{opacity:.8} }
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes unlockReveal { from{opacity:0;transform:translateY(12px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes copyShimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
      `}</style>

      <Particles />
      <DataStreams />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/4 w-[350px] h-[350px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/4 -right-20 w-[250px] h-[250px] rounded-full" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 60%)", filter: "blur(50px)" }} />
      </div>

      {/* ── Header ── */}
      <ScrollReveal delay={0} direction="down" distance={16} duration={0.5}>
        <div className="relative z-10 mt-3 mb-2 flex items-center justify-between px-4">
          <div onClick={() => router.back()} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:bg-white/10" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Image src={profileIcon} alt="back" width={14} height={14} />
          </div>
          <div className="flex items-center gap-2">
            {isXConnected && (
              <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg" style={{ background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)" }}>
                <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" className="text-teal-400"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                <CheckCircle size={9} className="text-teal-400" />
              </div>
            )}
            <IconWithTooltip tooltip="Total Signals">
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all hover:scale-105" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Image src={copyCountIcon} alt="signals" width={13} height={13} />
                <span className="text-[11px] font-semibold text-teal-400">{trader.total_signals}</span>
              </div>
            </IconWithTooltip>
            {rank > 0 && (
              <IconWithTooltip tooltip="Rank">
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.15), rgba(45,212,191,0.08))", border: "1px solid rgba(45,212,191,0.25)", boxShadow: "0 0 15px rgba(45,212,191,0.2)" }}>
                  <Image src={copyRankIcon} alt="rank" width={13} height={13} />
                  <span className="text-[11px] font-semibold text-teal-400">#{rank}</span>
                </div>
              </IconWithTooltip>
            )}
            <UserMenu />
          </div>
        </div>
      </ScrollReveal>

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
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"><div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent, rgba(45,212,191,0.06), transparent)", animation: "shimmerSlide 5s ease-in-out infinite" }} /></div>
            <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l rounded-tl-sm pointer-events-none z-20" style={{ borderColor: "rgba(45,212,191,0.3)" }} />
            <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r rounded-tr-sm pointer-events-none z-20" style={{ borderColor: "rgba(45,212,191,0.3)" }} />
            <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b border-l rounded-bl-sm pointer-events-none z-20" style={{ borderColor: "rgba(45,212,191,0.3)" }} />
            <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r rounded-br-sm pointer-events-none z-20" style={{ borderColor: "rgba(45,212,191,0.3)" }} />
            <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: "radial-gradient(ellipse at top left, rgba(45,212,191,0.15), transparent 60%)" }} />

            <div className="relative z-10">
              {/* Avatar + Name + Grade */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold transition-transform duration-300 hover:scale-110" style={{ backgroundColor: avatarBg, animation: "avatarPulse 3s ease-in-out infinite" }}>{avatarLetter}</div>
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

              {/* Followers / Following */}
              <div className="flex items-center gap-3 mb-2.5">
                <span className="text-[10px]"><span className="text-white font-bold">{trader.following_count}</span><span className="text-gray-500 font-medium"> Following</span></span>
                <span className="text-[10px]"><span className="text-white font-bold">{trader.followers_count}</span><span className="text-gray-500 font-medium"> Followers</span></span>
                <span className="text-[10px]"><span className="text-white font-bold">{trader.total_signals}</span><span className="text-gray-500 font-medium"> Signals</span></span>
              </div>

              {/* Bio */}
              {trader.bio && <p className="text-[11px] text-gray-400 leading-relaxed mb-3">{trader.bio}</p>}

              {/* Quick stats pills */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.12)" }}>
                  <Target size={9} className="text-teal-400" />
                  <span className="text-[9px] text-teal-400 font-semibold">{(trader.win_rate * 100).toFixed(0)}% WR</span>
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

              {/* Copy Trade CTA */}
              <button
                onClick={handleCopyToggle}
                disabled={copyLoading}
                onPointerDown={() => setCopyPressed(true)}
                onPointerUp={() => setCopyPressed(false)}
                onPointerLeave={() => setCopyPressed(false)}
                className="w-full py-2.5 rounded-xl text-[12px] font-bold transition-all duration-300 cursor-pointer relative overflow-hidden"
                style={isCopying
                  ? { background: "rgba(251,146,60,0.12)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.25)", transform: copyPressed ? "scale(0.98)" : "scale(1)" }
                  : { background: "linear-gradient(135deg, #2dd4bf, #14b8a6)", color: "#0a0f14", boxShadow: "0 4px 20px rgba(45,212,191,0.35), inset 0 1px 0 rgba(255,255,255,0.2)", transform: copyPressed ? "scale(0.98)" : "scale(1)", opacity: copyLoading ? 0.7 : 1 }
                }
              >
                {!isCopying && <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)", backgroundSize: "200% 100%", animation: "copyShimmer 3s ease-in-out infinite" }} />}
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  {copyLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : isCopying ? <><CheckCircle size={13} /><span>Copying</span></> : <><Copy size={13} /><span>Copy Trade</span></>}
                </span>
              </button>

              {/* Secondary Buttons */}
              <div className="grid grid-cols-2 mt-1.5 gap-1.5">
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  onPointerDown={() => setFollowPressed(true)}
                  onPointerUp={() => setFollowPressed(false)}
                  onPointerLeave={() => setFollowPressed(false)}
                  className="py-2 rounded-xl text-[10px] font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
                  style={isFollowing
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
            <div className="absolute top-0.5 bottom-0.5 rounded-md transition-all duration-300" style={{ width: `calc(${100 / TAB_DEFS.length}% - 2px)`, left: activeTab === "overview" ? "2px" : activeTab === "signals" ? `calc(${100 / TAB_DEFS.length}%)` : `calc(${200 / TAB_DEFS.length}%)`, background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.3)" }} />
            {TAB_DEFS.map((tab) => { const showLock = tab.locked && !isXConnected; return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all duration-300 relative z-10 cursor-pointer flex items-center justify-center gap-1" style={{ color: activeTab === tab.key ? "rgba(45,212,191,1)" : "rgba(255,255,255,0.4)" }}>
                {showLock && <Lock size={9} style={{ opacity: activeTab === tab.key ? 0.9 : 0.4, animation: "lockPulse 2s ease-in-out infinite" }} />}
                {tab.label}
              </button>
            ); })}
          </div>
        </div>
      </ScrollReveal>

      {/* ── Content ── */}
      <div className="relative z-10 px-4 pb-24">

        {/* ════════ OVERVIEW TAB ════════ */}
        {activeTab === "overview" && (
          <div className="space-y-1.5">
            {/* Radar */}
            <ScrollReveal direction="scale" delay={0}>
              <div className="rounded-xl p-2 relative overflow-hidden" style={cardStyle}>
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(45,212,191,0.04) 0%, transparent 70%)" }} />
                <div className="flex items-center justify-between mb-0 relative z-10"><span className="text-[10px] font-semibold text-white">Performance Radar</span></div>
                <RadarChart data={radarData as unknown as Record<string, number>} size={190} />
              </div>
            </ScrollReveal>

            {/* Stats Grid */}
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
                      <div className="flex items-center gap-1 mb-0.5 relative z-10"><div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${item.ib}`}><Icon size={9} className={item.ic} /></div><span className="text-[8px] text-gray-500">{item.label}</span></div>
                      <p className={`text-[12px] font-bold leading-tight relative z-10 ${item.color}`}><AnimatedNumber value={item.val} prefix={item.pre} suffix={item.suf} decimals={item.val % 1 !== 0 ? 1 : 0} /></p>
                      {item.sub && <p className="text-[7px] text-gray-500 relative z-10">{item.sub}</p>}
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>

            {/* Signal vs Noise + Copiers + Points */}
            <ScrollReveal direction="up" delay={0}>
              <div className="rounded-xl p-2.5 relative overflow-hidden" style={cardStyle}>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-[8px] text-gray-400 shrink-0">Signal vs Noise</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${signalPct}%`, background: "linear-gradient(90deg, rgba(45,212,191,1), rgba(45,212,191,0.7))", boxShadow: "0 0 10px rgba(45,212,191,0.5)", animation: "progressFill 1.5s ease 1s both" }} /></div>
                  <span className="text-[8px] text-teal-400 font-semibold shrink-0"><AnimatedNumber value={signalPct} suffix="%" /></span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center bg-blue-400/10"><Users size={11} className="text-blue-400" /></div>
                    <div><p className="text-[12px] font-bold text-white">{trader.copiers_count}</p><p className="text-[7px] text-gray-500">Copiers</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center bg-yellow-400/10"><Award size={11} className="text-yellow-400" /></div>
                    <div><p className="text-[12px] font-bold text-white">{trader.points}</p><p className="text-[7px] text-gray-500">Points</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center bg-teal-400/10"><Zap size={11} className="text-teal-400" /></div>
                    <div><p className="text-[12px] font-bold text-white">{trader.total_signals}</p><p className="text-[7px] text-gray-500">Signals</p></div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        )}

        {/* ════════ SIGNALS TAB ════════ */}
        {activeTab === "signals" && (
          isXConnected ? (
            signalsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="text-teal-400" style={{ animation: "spin 1s linear infinite" }} />
              </div>
            ) : signals.length === 0 ? (
              <EmptyState icon={Zap} title="No Signal Data Yet" description="This trader hasn't posted any signals yet." />
            ) : (() => {
              const wins = signals.filter(s => s.change_since_tweet > 0);
              const losses = signals.filter(s => s.change_since_tweet < 0);
              const filtered = signalFilter === "wins" ? wins : signalFilter === "losses" ? losses : signals;

              const totalAvgPnl = signals.reduce((a, s) => a + s.change_since_tweet, 0) / signals.length;
              const winRate = (wins.length / signals.length) * 100;

              /* PnL curve: sort oldest-first, accumulate */
              const parseAge = (str: string) => {
                const m = str.match(/(\d+)(m|h|d)/);
                if (!m) return 0;
                const n = parseInt(m[1]);
                return m[2] === "d" ? n * 1440 : m[2] === "h" ? n * 60 : n;
              };
              const sorted = [...signals].sort((a, b) => parseAge(b.updateTime) - parseAge(a.updateTime));
              let cum = 0;
              const pnlData = sorted.map((s, i) => {
                cum += s.change_since_tweet;
                return { idx: i, cumPnl: parseFloat(cum.toFixed(2)), ticker: s.ticker };
              });

              const rangeLimit = pnlRange === "1W" ? 7 : pnlRange === "1M" ? 30 : pnlRange === "3M" ? 90 : 9999;
              const pnlFiltered = pnlRange === "ALL" ? pnlData : pnlData.slice(-rangeLimit);
              const totalCumPnl = pnlData.length > 0 ? pnlData[pnlData.length - 1].cumPnl : 0;

              return (
                <div className="space-y-1.5" style={{ animation: "unlockReveal 0.5s ease both" }}>
                  {/* PnL Curve */}
                  <ScrollReveal direction="scale" delay={0}>
                    <div className="rounded-xl p-3 relative overflow-hidden" style={cardStyle}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-[10px] text-gray-400 font-medium">PnL Curve</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <TrendingUp size={14} className={totalCumPnl >= 0 ? "text-teal-400" : "text-rose-400"} />
                            <span className="text-[16px] font-bold" style={{ color: totalCumPnl >= 0 ? "#2dd4bf" : "#f43f5e" }}>
                              {totalCumPnl >= 0 ? "+" : ""}{totalCumPnl.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          {(["1W", "1M", "3M", "ALL"] as const).map(r => (
                            <button key={r} onClick={() => setPnlRange(r)}
                              className="px-2 py-1 rounded-md text-[9px] font-semibold transition-all cursor-pointer"
                              style={pnlRange === r
                                ? { background: "rgba(45,212,191,0.2)", color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.3)" }
                                : { color: "rgba(255,255,255,0.4)" }
                              }>{r}</button>
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
                            <Tooltip
                              contentStyle={{ background: "rgba(15,20,25,0.95)", border: "1px solid rgba(45,212,191,0.2)", borderRadius: 8, fontSize: 10 }}
                              labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                              formatter={((v: number | undefined) => [`${(v ?? 0) >= 0 ? "+" : ""}${(v ?? 0).toFixed(2)}%`, "Cumulative"]) as any}
                              labelFormatter={(i) => pnlFiltered[i as number]?.ticker || ""}
                            />
                            <Area type="monotone" dataKey="cumPnl" stroke={totalCumPnl >= 0 ? "#2dd4bf" : "#f43f5e"} strokeWidth={1.5} fill="url(#pnlGrad)" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Stats Row */}
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

                  {/* Filter Tabs */}
                  <ScrollReveal direction="up" delay={0.08}>
                    <div className="flex p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      {([
                        { key: "all" as const, label: `All (${signals.length})` },
                        { key: "wins" as const, label: `Wins (${wins.length})` },
                        { key: "losses" as const, label: `Losses (${losses.length})` },
                      ]).map(f => (
                        <button key={f.key} onClick={() => setSignalFilter(f.key)}
                          className="flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all cursor-pointer"
                          style={signalFilter === f.key
                            ? { background: "rgba(45,212,191,0.15)", color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.3)" }
                            : { color: "rgba(255,255,255,0.4)" }
                          }>{f.label}</button>
                      ))}
                    </div>
                  </ScrollReveal>

                  {/* Signal Cards */}
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
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ background: `${dirColor}20`, color: dirColor, border: `1px solid ${dirColor}30` }}>
                                  {dirLabel}
                                </span>
                                <div className="flex items-center gap-0.5 text-gray-500">
                                  <Clock size={8} />
                                  <span className="text-[9px]">{sig.updateTime}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {isWin ? <ArrowUpRight size={12} style={{ color: pnlColor }} /> : <ArrowDownRight size={12} style={{ color: pnlColor }} />}
                                <span className="text-[13px] font-bold" style={{ color: pnlColor }}>
                                  {sig.change_since_tweet >= 0 ? "+" : ""}{sig.change_since_tweet.toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                {sig.entry_price > 0 && (
                                  <div className="flex items-center gap-3 mb-1.5">
                                    <div>
                                      <span className="text-[8px] text-gray-500 block">Entry</span>
                                      <span className="text-[11px] font-semibold text-white">${sig.entry_price.toLocaleString()}</span>
                                    </div>
                                  </div>
                                )}
                                {sig.content && (
                                  <p className="text-[9px] text-gray-400 leading-relaxed line-clamp-2">{sig.content}</p>
                                )}
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
          ) : (
            <LockedTabContent title="Unlock Signals" description="See real-time trading signals, calls, and market insights from this trader." onConnect={handleConnectX} />
          )
        )}

        {/* ════════ POSITIONS TAB ════════ */}
        {activeTab === "positions" && (
          isXConnected
            ? <EmptyState icon={Eye} title="No Position Data Yet" description="Copied positions will appear here once the positions API is connected." />
            : <LockedTabContent title="Unlock Copied Positions" description="See positions opened by copiers based on this KOL's signals." onConnect={handleConnectX} />
        )}
      </div>

      {/* ── Modals ── */}
      <ConnectXModal isOpen={showConnectModal} stage={connectStage} onClose={handleConnectDone} />
      <PrivacySheet isOpen={showPrivacySheet} onClose={() => setShowPrivacySheet(false)} settings={privacySettings} onToggle={(k) => setPrivacySettings((p) => ({ ...p, [k]: !p[k] }))} />
      <ShareSheet isOpen={showShareSheet} onClose={() => setShowShareSheet(false)} traderData={{ name: displayName, handle: `@${trader.username}`, avatar: avatarLetter, avatarBg, rank, grade: kolGrade.grade, gradeColor: kolGrade.color, gradeGlow: kolGrade.glow, tags: [], radar: radarData as unknown as Record<string, number>, cumulative, streak: trader.streak, signalPct, bestTrade: bestSignal ?? { token: "—", pnl: 0, date: "—" }, tradersCopying: trader.copiers_count }} />
    </div>
  );
}