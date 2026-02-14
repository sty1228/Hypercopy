"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
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
      <div
        className="absolute top-full right-0 mt-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap text-[10px] font-medium pointer-events-none transition-all duration-200 z-50"
        style={{
          background: "rgba(15,20,25,0.95)",
          border: "1px solid rgba(45,212,191,0.3)",
          color: "rgba(255,255,255,0.9)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0)" : "translateY(-4px)",
        }}
      >
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

const getGrade = (score: number) => {
  if (score >= 95) return { grade: "S+", color: "#ff6b6b", glow: "rgba(255,107,107,0.5)" };
  if (score >= 90) return { grade: "S", color: "#ff9f43", glow: "rgba(255,159,67,0.5)" };
  if (score >= 85) return { grade: "S-", color: "#feca57", glow: "rgba(254,202,87,0.5)" };
  if (score >= 80) return { grade: "A+", color: "#2dd4bf", glow: "rgba(45,212,191,0.5)" };
  if (score >= 75) return { grade: "A", color: "#34d399", glow: "rgba(52,211,153,0.5)" };
  if (score >= 70) return { grade: "A-", color: "#60a5fa", glow: "rgba(96,165,250,0.5)" };
  if (score >= 65) return { grade: "B+", color: "#818cf8", glow: "rgba(129,140,248,0.5)" };
  if (score >= 60) return { grade: "B", color: "#a78bfa", glow: "rgba(167,139,250,0.5)" };
  return { grade: "C", color: "#94a3b8", glow: "rgba(148,163,184,0.3)" };
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
  const pts = dims.map((d, i) => pt(data[d.key], i));
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

/* ─────────────── Performance Chart ──────────────── */

const PerformanceChart = ({ data }: { data: { label: string; value: number }[] }) => {
  const [ani, setAni] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const mx = Math.max(...data.map((d) => Math.abs(d.value)));
  useEffect(() => { const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setAni(true); o.disconnect(); } }, { threshold: 0.3 }); if (ref.current) o.observe(ref.current); return () => o.disconnect(); }, []);
  return (
    <div ref={ref} className="relative" style={{ height: 56 }}>
      <div className="absolute left-0 right-0" style={{ top: 22, height: 1, background: "rgba(255,255,255,0.08)" }} />
      <div className="flex items-center gap-1 h-full">
        {data.map((item, i) => { const pct = (Math.abs(item.value) / mx) * 50; const pos = item.value >= 0; return (
          <div key={i} className="flex-1 flex flex-col items-center" style={{ height: 56 }}>
            <div className="relative flex-1 w-full" style={{ height: 44 }}>
              <div className={`absolute left-0.5 right-0.5 ${pos ? "rounded-t" : "rounded-b"}`} style={{ height: ani ? `${pct}%` : "0%", transition: `height 0.6s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.08}s`, ...(pos ? { bottom: "50%", background: "linear-gradient(180deg, rgba(45,212,191,0.9), rgba(45,212,191,0.4))", boxShadow: ani ? "0 -2px 10px rgba(45,212,191,0.4)" : "none" } : { top: "50%", background: "linear-gradient(0deg, rgba(244,63,94,0.9), rgba(244,63,94,0.4))", boxShadow: ani ? "0 2px 10px rgba(244,63,94,0.4)" : "none" }) }} />
            </div>
            <span className="text-[7px] text-gray-500 mt-0.5">{item.label}</span>
          </div>
        ); })}
      </div>
    </div>
  );
};

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

/* ─────────────── PnL Teaser (Locked) ────────────── */

const PnLTeaser = ({ onConnect }: { onConnect: () => void }) => {
  const pts = [12, 28, 18, 45, 38, 62, 55, 78, 72, 95, 88, 110, 105, 118, 112, 130, 125, 142];
  const w = 340, h = 50, py = 4, mx = Math.max(...pts), mn = Math.min(...pts);
  const mp = pts.map((v, i) => ({ x: (i / (pts.length - 1)) * w, y: py + (1 - (v - mn) / (mx - mn)) * (h - py * 2) }));
  const line = mp.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${mp[mp.length - 1].x},${h} L${mp[0].x},${h} Z`;
  return (
    <div className="relative rounded-2xl overflow-hidden" style={cardStyle}>
      <div className="px-3 pt-2.5 pb-2" style={{ filter: "blur(6px)", opacity: 0.35, pointerEvents: "none" }}>
        <div className="flex items-center justify-between mb-1.5"><span className="text-[10px] font-semibold text-white">PnL Curve</span><span className="text-[10px] text-teal-400 font-bold">+342.8%</span></div>
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}><defs><linearGradient id="pnlTG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(45,212,191,0.3)" /><stop offset="100%" stopColor="rgba(45,212,191,0)" /></linearGradient></defs><path d={area} fill="url(#pnlTG)" /><path d={line} fill="none" stroke="rgba(45,212,191,0.9)" strokeWidth="2" strokeLinecap="round" /></svg>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5" style={{ background: "rgba(10,15,20,0.5)" }}>
        <button onClick={onConnect} className="flex items-center gap-2 px-5 py-2 rounded-xl text-[11px] font-bold cursor-pointer transition-all duration-300 active:scale-95 relative overflow-hidden" style={{ background: "rgba(45,212,191,1)", color: "#0a0f14", boxShadow: "0 4px 24px rgba(45,212,191,0.35)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", animation: "shimmerSlide 2.5s ease-in-out infinite" }} />
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" className="relative z-10"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
          <span className="relative z-10">Connect to Unlock PnL</span>
        </button>
        <span className="text-[9px] text-gray-500">Verify your X account to view performance</span>
      </div>
    </div>
  );
};

/* ─────────────── Full PnL Chart (Unlocked) ──────── */

const PnLChart = () => {
  const [period, setPeriod] = useState<"1W" | "1M" | "3M" | "ALL">("ALL");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const allData = [
    { pnl: 0, date: "Dec 10" }, { pnl: 12, date: "Dec 13" }, { pnl: 8, date: "Dec 16" }, { pnl: 28, date: "Dec 19" },
    { pnl: 18, date: "Dec 22" }, { pnl: 45, date: "Dec 25" }, { pnl: 38, date: "Dec 28" }, { pnl: 62, date: "Dec 31" },
    { pnl: 55, date: "Jan 3" }, { pnl: 78, date: "Jan 6" }, { pnl: 72, date: "Jan 9" }, { pnl: 95, date: "Jan 12" },
    { pnl: 88, date: "Jan 15" }, { pnl: 110, date: "Jan 18" }, { pnl: 105, date: "Jan 21" }, { pnl: 135, date: "Jan 24" },
    { pnl: 125, date: "Jan 27" }, { pnl: 158, date: "Jan 30" }, { pnl: 148, date: "Feb 1" }, { pnl: 185, date: "Feb 3" },
    { pnl: 170, date: "Feb 4" }, { pnl: 210, date: "Feb 5" }, { pnl: 198, date: "Feb 5" }, { pnl: 240, date: "Feb 6" },
    { pnl: 225, date: "Feb 6" }, { pnl: 268, date: "Feb 7" }, { pnl: 255, date: "Feb 7" }, { pnl: 295, date: "Feb 8" },
    { pnl: 280, date: "Feb 8" }, { pnl: 320, date: "Feb 9" }, { pnl: 310, date: "Feb 9" }, { pnl: 342.8, date: "Feb 10" },
  ];
  const sl = { "1W": 8, "1M": 16, "3M": 24, ALL: allData.length };
  const data = allData.slice(0, sl[period]);
  const pts = data.map((d) => d.pnl);
  const w = 340, h = 80, py = 8, mx = Math.max(...pts), mn = Math.min(...pts);
  const mp = pts.map((v, i) => ({ x: (i / (pts.length - 1)) * w, y: py + (1 - (v - mn) / (mx - mn || 1)) * (h - py * 2) }));

  const smoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return "";
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) / 6, cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6, cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  const splitIdx = hoverIdx !== null ? hoverIdx : mp.length - 1;
  const solidPts = mp.slice(0, splitIdx + 1);
  const fadedPts = mp.slice(splitIdx);
  const solidLine = smoothPath(solidPts);
  const fadedLine = smoothPath(fadedPts);
  const solidArea = solidPts.length > 1 ? `${solidLine} L${solidPts[solidPts.length - 1].x},${h} L${solidPts[0].x},${h} Z` : "";
  const fadedArea = fadedPts.length > 1 ? `${fadedLine} L${fadedPts[fadedPts.length - 1].x},${h} L${fadedPts[0].x},${h} Z` : "";

  const getIdxFromX = (clientX: number) => {
    if (!chartRef.current) return null;
    const rect = chartRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(pts.length - 1, Math.round(x * (pts.length - 1))));
  };

  const handleMove = (e: React.PointerEvent) => setHoverIdx(getIdxFromX(e.clientX));
  const handleLeave = () => setHoverIdx(null);

  const hoverPt = hoverIdx !== null ? mp[hoverIdx] : null;
  const hoverData = hoverIdx !== null ? data[hoverIdx] : null;
  const displayPnl = hoverData ? hoverData.pnl : pts[pts.length - 1];
  const displayDate = hoverData ? hoverData.date : data[data.length - 1].date;

  return (
    <div className="rounded-2xl p-3 relative overflow-hidden" style={cardStyle}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at top, rgba(255,255,255,0.02) 0%, transparent 70%)" }} />
      <div className="flex items-center justify-between mb-2 relative z-10">
        <div>
          <span className="text-[10px] font-semibold text-white">PnL Curve</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <TrendingUp size={10} className="text-teal-400" />
            <span className="text-[14px] font-bold text-teal-400">+{displayPnl.toFixed(1)}%</span>
            {hoverData && <span className="text-[9px] text-gray-500 ml-0.5">{displayDate}</span>}
          </div>
        </div>
        <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          {(["1W", "1M", "3M", "ALL"] as const).map((p) => (
            <button key={p} onClick={() => { setPeriod(p); setHoverIdx(null); }} className="px-2 py-1 text-[9px] font-medium transition-all cursor-pointer" style={{ background: period === p ? "rgba(45,212,191,0.15)" : "rgba(255,255,255,0.03)", color: period === p ? "rgba(45,212,191,1)" : "rgba(255,255,255,0.4)" }}>{p}</button>
          ))}
        </div>
      </div>
      <div ref={chartRef} className="relative z-10 select-none" style={{ touchAction: "none" }}
        onPointerMove={handleMove} onPointerLeave={handleLeave}
      >
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
          <defs>
            <linearGradient id="pnlSolidFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(255,255,255,0.07)" /><stop offset="100%" stopColor="rgba(255,255,255,0)" /></linearGradient>
            <linearGradient id="pnlFadedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(255,255,255,0.02)" /><stop offset="100%" stopColor="rgba(255,255,255,0)" /></linearGradient>
          </defs>
          {fadedArea && <path d={fadedArea} fill="url(#pnlFadedFill)" />}
          {fadedLine && <path d={fadedLine} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="4 3" />}
          {solidArea && <path d={solidArea} fill="url(#pnlSolidFill)" />}
          {solidLine && <path d={solidLine} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />}
          {hoverPt && hoverIdx !== null && (
            <g>
              <line x1={hoverPt.x} y1={0} x2={hoverPt.x} y2={h} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              <circle cx={hoverPt.x} cy={hoverPt.y} r="5" fill="rgba(255,255,255,0.06)" />
              <circle cx={hoverPt.x} cy={hoverPt.y} r="2.5" fill="rgba(255,255,255,0.8)" style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.4))" }} />
              <g transform={`translate(${Math.min(Math.max(hoverPt.x, 32), w - 32)}, ${Math.max(hoverPt.y - 20, 8)})`}>
                <rect x={-28} y={-10} width={56} height={20} rx={5} fill="rgba(12,18,25,0.92)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                <text x={0} y={-1} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.45)" fontWeight="500">{data[hoverIdx].date}</text>
                <text x={0} y={8} textAnchor="middle" fontSize="7.5" fill="#2dd4bf" fontWeight="700">{data[hoverIdx].pnl >= 0 ? "+" : ""}{data[hoverIdx].pnl.toFixed(1)}%</text>
              </g>
            </g>
          )}
          {hoverIdx === null && (
            <circle cx={mp[mp.length - 1].x} cy={mp[mp.length - 1].y} r="2.5" fill="rgba(255,255,255,0.8)" style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.4))" }} />
          )}
        </svg>
      </div>
      <div className="flex items-center justify-between mt-1 relative z-10">
        <span className="text-[8px] text-gray-500">{data[0].date}</span>
        <span className="text-[8px] text-gray-500">{data[Math.floor(data.length / 2)]?.date}</span>
        <span className="text-[8px] text-gray-500">{data[data.length - 1].date}</span>
      </div>
    </div>
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

/* ─────────────── Signals Content (Unlocked) ─────── */

const SignalsContent = () => {
  const [filter, setFilter] = useState<"all" | "win" | "loss">("all");
  const signals = [
    { id: 1, token: "BTC", type: "long" as const, entry: "$67,500", result: "win" as const, pnl: 12.5, time: "2h ago", tp: "$72,000", sl: "$65,000", confidence: 92 },
    { id: 2, token: "ETH", type: "short" as const, entry: "$2,450", result: "win" as const, pnl: 8.2, time: "5h ago", tp: "$2,250", sl: "$2,550", confidence: 85 },
    { id: 3, token: "SOL", type: "long" as const, entry: "$98", result: "loss" as const, pnl: -4.5, time: "1d ago", tp: "$115", sl: "$94", confidence: 72 },
    { id: 4, token: "HYPE", type: "long" as const, entry: "$1.12", result: "win" as const, pnl: 45.2, time: "2d ago", tp: "$1.80", sl: "$0.95", confidence: 88 },
    { id: 5, token: "DOGE", type: "long" as const, entry: "$0.165", result: "win" as const, pnl: 18.7, time: "3d ago", tp: "$0.20", sl: "$0.15", confidence: 78 },
    { id: 6, token: "ARB", type: "short" as const, entry: "$1.42", result: "loss" as const, pnl: -6.8, time: "4d ago", tp: "$1.20", sl: "$1.55", confidence: 65 },
    { id: 7, token: "WIF", type: "long" as const, entry: "$2.85", result: "win" as const, pnl: 32.1, time: "5d ago", tp: "$3.80", sl: "$2.50", confidence: 90 },
  ];
  const filtered = filter === "all" ? signals : signals.filter((s) => s.result === filter);
  const wins = signals.filter((s) => s.result === "win").length;
  const total = signals.length;

  return (
    <div className="space-y-1.5" style={{ animation: "profileFadeIn 0.4s ease both" }}>
      <div className="flex gap-1.5">
        {[
          { icon: Zap, bg: "bg-teal-400/10", ic: "text-teal-400", label: "Total Signals", val: `${total}`, vc: "text-white" },
          { icon: Target, bg: "bg-teal-400/10", ic: "text-teal-400", label: "Win Rate", val: `${((wins / total) * 100).toFixed(0)}%`, vc: "text-teal-400" },
          { icon: TrendingUp, bg: "bg-teal-400/10", ic: "text-teal-400", label: "Avg PnL", val: `+${(signals.reduce((a, s) => a + s.pnl, 0) / total).toFixed(1)}%`, vc: "text-teal-400" },
        ].map((s, i) => (
          <div key={i} className="flex-1 rounded-xl p-2.5" style={cardStyle}>
            <div className="flex items-center gap-1.5 mb-1"><div className={`w-5 h-5 rounded-md flex items-center justify-center ${s.bg}`}><s.icon size={10} className={s.ic} /></div><span className="text-[8px] text-gray-500">{s.label}</span></div>
            <p className={`text-[14px] font-bold ${s.vc}`}>{s.val}</p>
          </div>
        ))}
      </div>
      <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        {(["all", "win", "loss"] as const).map((f) => (<button key={f} onClick={() => setFilter(f)} className="flex-1 py-1.5 text-[10px] font-medium transition-all cursor-pointer capitalize" style={{ background: filter === f ? "rgba(45,212,191,0.15)" : "rgba(255,255,255,0.03)", color: filter === f ? "rgba(45,212,191,1)" : "rgba(255,255,255,0.4)" }}>{f === "all" ? `All (${total})` : f === "win" ? `Wins (${wins})` : `Losses (${total - wins})`}</button>))}
      </div>
      {filtered.map((sig, idx) => { const w = sig.result === "win"; return (
        <ScrollReveal key={sig.id} delay={idx * 0.05} direction="left" distance={20}>
          <div className="rounded-xl p-3 relative overflow-hidden" style={cardStyle}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${w ? "rgba(45,212,191,0.04)" : "rgba(244,63,94,0.04)"} 0%, transparent 70%)` }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-white">${sig.token}</span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: sig.type === "long" ? "rgba(45,212,191,0.12)" : "rgba(244,63,94,0.12)", color: sig.type === "long" ? "#2dd4bf" : "#f43f5e" }}>{sig.type.toUpperCase()}</span>
                  <span className="text-[9px] text-gray-500 flex items-center gap-0.5"><Clock size={8} />{sig.time}</span>
                </div>
                <div className="flex items-center gap-1">
                  {w ? <ArrowUpRight size={12} className="text-teal-400" /> : <ArrowDownRight size={12} className="text-rose-400" />}
                  <span className="text-[12px] font-bold" style={{ color: w ? "#2dd4bf" : "#f43f5e" }}>{w ? "+" : ""}{sig.pnl}%</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div><span className="text-[8px] text-gray-500 block">Entry</span><span className="text-[10px] text-white font-medium">{sig.entry}</span></div>
                <div><span className="text-[8px] text-gray-500 block">TP</span><span className="text-[10px] text-teal-400 font-medium">{sig.tp}</span></div>
                <div><span className="text-[8px] text-gray-500 block">SL</span><span className="text-[10px] text-rose-400 font-medium">{sig.sl}</span></div>
                <div className="ml-auto text-right">
                  <span className="text-[8px] text-gray-500 block">Confidence</span>
                  <div className="flex items-center gap-1">
                    <div className="w-10 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${sig.confidence}%`, background: sig.confidence >= 80 ? "linear-gradient(90deg,#2dd4bf,#2dd4bf99)" : sig.confidence >= 60 ? "linear-gradient(90deg,#fbbf24,#fbbf2499)" : "linear-gradient(90deg,#f43f5e,#f43f5e99)" }} /></div>
                    <span className="text-[9px] font-semibold" style={{ color: sig.confidence >= 80 ? "#2dd4bf" : sig.confidence >= 60 ? "#fbbf24" : "#f43f5e" }}>{sig.confidence}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      ); })}
    </div>
  );
};

/* ─────────────── Copied Positions (Unlocked) ────── */

const CopiedPositionsContent = () => {
  const positions = [
    { id: 1, signal: "BTC LONG", token: "BTC", signalDate: "Feb 8", copiers: 142, entry: "$67,500", current: "$71,450", avgCopierPnl: 5.86, totalVolume: "$1.2M", status: "active" as const, tp: "$72,000", sl: "$65,000" },
    { id: 2, signal: "ETH SHORT", token: "ETH", signalDate: "Feb 7", copiers: 98, entry: "$2,450", current: "$2,310", avgCopierPnl: 5.71, totalVolume: "$620K", status: "active" as const, tp: "$2,250", sl: "$2,550" },
    { id: 3, signal: "SOL LONG", token: "SOL", signalDate: "Feb 5", copiers: 67, entry: "$98", current: "$94.50", avgCopierPnl: -3.57, totalVolume: "$280K", status: "active" as const, tp: "$115", sl: "$94" },
    { id: 4, signal: "HYPE LONG", token: "HYPE", signalDate: "Feb 3", copiers: 215, entry: "$1.12", current: "$1.63", avgCopierPnl: 45.5, totalVolume: "$890K", status: "closed" as const, tp: "$1.80", sl: "$0.95" },
    { id: 5, signal: "DOGE LONG", token: "DOGE", signalDate: "Feb 1", copiers: 183, entry: "$0.165", current: "$0.196", avgCopierPnl: 18.8, totalVolume: "$410K", status: "closed" as const, tp: "$0.20", sl: "$0.15" },
  ];
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all");
  const filtered = statusFilter === "all" ? positions : positions.filter((p) => p.status === statusFilter);
  const totalCopiers = positions.reduce((a, p) => a + p.copiers, 0);
  const avgPnl = positions.reduce((a, p) => a + p.avgCopierPnl, 0) / positions.length;
  const activeCount = positions.filter((p) => p.status === "active").length;

  return (
    <div className="space-y-1.5" style={{ animation: "profileFadeIn 0.4s ease both" }}>
      <div className="flex gap-1.5">
        {[
          { icon: Users, bg: "bg-blue-400/10", ic: "text-blue-400", label: "Total Copiers", val: totalCopiers.toLocaleString(), vc: "text-white" },
          { icon: TrendingUp, bg: "bg-teal-400/10", ic: "text-teal-400", label: "Avg Copier PnL", val: `${avgPnl >= 0 ? "+" : ""}${avgPnl.toFixed(1)}%`, vc: avgPnl >= 0 ? "text-teal-400" : "text-rose-400" },
          { icon: Zap, bg: "bg-purple-400/10", ic: "text-purple-400", label: "Active Now", val: `${activeCount}`, vc: "text-white" },
        ].map((s, i) => (
          <div key={i} className="flex-1 rounded-xl p-2.5" style={cardStyle}>
            <div className="flex items-center gap-1.5 mb-1"><div className={`w-5 h-5 rounded-md flex items-center justify-center ${s.bg}`}><s.icon size={10} className={s.ic} /></div><span className="text-[8px] text-gray-500">{s.label}</span></div>
            <p className={`text-[14px] font-bold ${s.vc}`}>{s.val}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg px-3 py-2 flex items-start gap-2" style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.1)" }}>
        <ShieldCheck size={12} className="text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-[9px] text-gray-400 leading-relaxed">These are positions opened by copiers on HyperCopy based on this KOL's signals. Aggregate data only — individual copier data is private.</p>
      </div>
      <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        {(["all", "active", "closed"] as const).map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)} className="flex-1 py-1.5 text-[10px] font-medium transition-all cursor-pointer capitalize" style={{ background: statusFilter === f ? "rgba(45,212,191,0.15)" : "rgba(255,255,255,0.03)", color: statusFilter === f ? "rgba(45,212,191,1)" : "rgba(255,255,255,0.4)" }}>
            {f === "all" ? `All (${positions.length})` : f === "active" ? `Active (${activeCount})` : `Closed (${positions.length - activeCount})`}
          </button>
        ))}
      </div>
      {filtered.map((pos, idx) => {
        const profit = pos.avgCopierPnl >= 0;
        const isActive = pos.status === "active";
        return (
          <ScrollReveal key={pos.id} delay={idx * 0.05} direction="left" distance={20}>
            <div className="rounded-xl p-3 relative overflow-hidden" style={cardStyle}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${profit ? "rgba(45,212,191,0.04)" : "rgba(244,63,94,0.04)"} 0%, transparent 70%)` }} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-white">${pos.token}</span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: pos.signal.includes("LONG") ? "rgba(45,212,191,0.12)" : "rgba(244,63,94,0.12)", color: pos.signal.includes("LONG") ? "#2dd4bf" : "#f43f5e" }}>{pos.signal.split(" ")[1]}</span>
                    <span className="text-[9px] text-gray-500">{pos.signalDate}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ background: isActive ? "rgba(45,212,191,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${isActive ? "rgba(45,212,191,0.15)" : "rgba(255,255,255,0.06)"}` }}>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-teal-400" style={{ animation: "lockPulse 1.5s ease-in-out infinite" }} />}
                    <span className="text-[9px] font-medium" style={{ color: isActive ? "#2dd4bf" : "rgba(255,255,255,0.4)" }}>{isActive ? "Live" : "Closed"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div><span className="text-[8px] text-gray-500 block">Entry</span><span className="text-[10px] text-white font-medium">{pos.entry}</span></div>
                  <div className="flex items-center text-gray-500"><ChevronRight size={10} /></div>
                  <div><span className="text-[8px] text-gray-500 block">{isActive ? "Current" : "Exit"}</span><span className="text-[10px] text-white font-medium">{pos.current}</span></div>
                  <div><span className="text-[8px] text-gray-500 block">Volume</span><span className="text-[10px] text-white font-medium">{pos.totalVolume}</span></div>
                </div>
                <div className="flex items-center justify-between rounded-lg px-2.5 py-1.5" style={{ background: profit ? "rgba(45,212,191,0.06)" : "rgba(244,63,94,0.06)", border: `1px solid ${profit ? "rgba(45,212,191,0.12)" : "rgba(244,63,94,0.12)"}` }}>
                  <div className="flex items-center gap-1.5">
                    <Users size={10} className="text-gray-400" />
                    <span className="text-[9px] text-gray-400"><span className="text-white font-semibold">{pos.copiers}</span> copiers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-500">Avg PnL</span>
                    <span className="text-[11px] font-bold" style={{ color: profit ? "#2dd4bf" : "#f43f5e" }}>{profit ? "+" : ""}{pos.avgCopierPnl.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        );
      })}
    </div>
  );
};

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
    { key: "hideCopyTrades", icon: Users, label: "Copy Trades", desc: "Hide which traders you're copying from your public profile" },
    { key: "hidePositions", icon: Eye, label: "Copied Positions", desc: "Hide the positions opened by your copiers from public view" },
    { key: "hidePnl", icon: TrendingUp, label: "PnL Data", desc: "Hide your PnL curve and performance data" },
  ];
  return (
    <>
      <div className="fixed inset-0 z-40 backdrop-blur-sm transition-opacity duration-300" style={{ background: "rgba(0,0,0,0.6)", opacity: sheetVisible ? 1 : 0 }} onClick={onClose} />
      <div className="fixed left-0 right-0 z-50 max-w-md mx-auto rounded-t-3xl overflow-hidden transition-transform duration-500" style={{ bottom: 48, background: "linear-gradient(180deg, #111820 0%, #0a0f14 100%)", border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none", transform: sheetVisible ? "translateY(0)" : "translateY(100%)", transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
        <div className="flex items-center justify-between px-4 py-3" style={{ opacity: sheetVisible ? 1 : 0, transform: sheetVisible ? "translateY(0)" : "translateY(12px)", transition: "opacity 0.4s ease 0.15s, transform 0.4s ease 0.15s" }}>
          <div><h2 className="text-base font-bold text-white">Privacy Settings</h2><span className="text-[11px] text-gray-500">Control what others can see</span></div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-white/10" style={{ background: "rgba(255,255,255,0.05)" }}><Lock size={14} className="text-gray-400" /></button>
        </div>
        <div className="px-4 pb-6 space-y-2">
          {items.map((item, idx) => { const on = settings[item.key]; return (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", opacity: sheetVisible ? 1 : 0, transform: sheetVisible ? "translateY(0)" : "translateY(20px)", transition: `opacity 0.45s cubic-bezier(0.16,1,0.3,1) ${0.2 + idx * 0.08}s, transform 0.45s cubic-bezier(0.16,1,0.3,1) ${0.2 + idx * 0.08}s` }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: on ? "rgba(244,63,94,0.1)" : "rgba(45,212,191,0.1)" }}><item.icon size={14} className={on ? "text-rose-400" : "text-teal-400"} /></div>
                <div><p className="text-[12px] font-semibold text-white">{item.label}</p><p className="text-[9px] text-gray-500 max-w-[200px]">{item.desc}</p></div>
              </div>
              <button onClick={() => onToggle(item.key)} className="shrink-0 cursor-pointer transition-all duration-300 rounded-full" style={{ width: 40, height: 22, background: on ? "rgba(45,212,191,0.8)" : "rgba(255,255,255,0.1)", border: `1px solid ${on ? "rgba(45,212,191,0.5)" : "rgba(255,255,255,0.1)"}`, position: "relative" }}>
                <div className="absolute top-0.5 rounded-full transition-all duration-300" style={{ width: 18, height: 18, left: on ? 19 : 1, background: on ? "#fff" : "rgba(255,255,255,0.4)", boxShadow: on ? "0 0 8px rgba(45,212,191,0.5)" : "none" }} />
              </button>
            </div>
          ); })}
          <div className="rounded-xl p-3 mt-2" style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.1)", opacity: sheetVisible ? 1 : 0, transform: sheetVisible ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.4s ease 0.48s, transform 0.4s ease 0.48s" }}>
            <div className="flex items-start gap-2"><AlertCircle size={12} className="text-yellow-400 shrink-0 mt-0.5" /><p className="text-[9px] text-gray-400 leading-relaxed">Private data is only visible to you. Other traders and copiers won't be able to see hidden information on your profile.</p></div>
          </div>
        </div>
      </div>
    </>
  );
};

/* ─────────────── Mock Data ──────────────────────── */

const followingUsers: FollowingUser[] = [
  { id: "1", name: "Crypto Whale", handle: "@cryptowhale", avatar: "C", avatarBg: "#6366f1", score: 92, isFollowing: true, tags: ["🐋 Whale", "💎 Holder"] },
  { id: "2", name: "DeFi Degen", handle: "@defidegen", avatar: "D", avatarBg: "#f59e0b", score: 78, isFollowing: true, tags: ["🦍 Ape"] },
  { id: "3", name: "Alpha Hunter", handle: "@alphahunter", avatar: "A", avatarBg: "#ec4899", score: 85, isFollowing: true, tags: ["🎯 Sniper"] },
  { id: "4", name: "Moon Boy", handle: "@moonboy", avatar: "M", avatarBg: "#10b981", score: 65, isFollowing: false, tags: ["🚀 Moon"] },
  { id: "5", name: "Sats Stacker", handle: "@satsstacker", avatar: "S", avatarBg: "#f97316", score: 88, isFollowing: true },
];
const copyingTraders: CopyingTrader[] = [
  { id: "1", name: "Jake Miller", handle: "@jakemiller", avatar: "J", avatarBg: "#3b82f6", pnl: 42.5, copiedSince: "Dec 2024", tradesFollowed: 28, winRate: 72 },
  { id: "2", name: "Sarah Kim", handle: "@sarahkim", avatar: "S", avatarBg: "#ec4899", pnl: 31.2, copiedSince: "Jan 2025", tradesFollowed: 15, winRate: 68 },
  { id: "3", name: "Tom Zhang", handle: "@tomzhang", avatar: "T", avatarBg: "#8b5cf6", pnl: -8.3, copiedSince: "Nov 2024", tradesFollowed: 45, winRate: 52 },
  { id: "4", name: "Lisa Wang", handle: "@lisawang", avatar: "L", avatarBg: "#f59e0b", pnl: 67.8, copiedSince: "Oct 2024", tradesFollowed: 62, winRate: 78 },
  { id: "5", name: "Ryan Park", handle: "@ryanpark", avatar: "R", avatarBg: "#10b981", pnl: 15.4, copiedSince: "Jan 2025", tradesFollowed: 10, winRate: 60 },
];

const TAB_DEFS = [
  { key: "overview", label: "Analysis", locked: false },
  { key: "signals", label: "Signals", locked: true },
  { key: "positions", label: "Positions", locked: true },
] as const;

/* ─────────────── Page ───────────────────────────── */

export default function KOLProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [showFollowingSheet, setShowFollowingSheet] = useState(false);
  const [showCopyingSheet, setShowCopyingSheet] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [followingList, setFollowingList] = useState(followingUsers);
  const [mounted, setMounted] = useState(false);

  const [isXConnected, setIsXConnected] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectStage, setConnectStage] = useState<"connecting" | "success">("connecting");
  const [showPrivacySheet, setShowPrivacySheet] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({ hideCopyTrades: false, hidePositions: false, hidePnl: false });

  /* Button press states */
  const [followPressed, setFollowPressed] = useState(false);
  const [copyPressed, setCopyPressed] = useState(false);

  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  /* Dismiss tooltip on tap outside */
  useEffect(() => {
    if (!activeTooltip) return;
    const dismiss = () => setActiveTooltip(null);
    const timer = setTimeout(() => document.addEventListener("click", dismiss, { once: true }), 10);
    return () => { clearTimeout(timer); document.removeEventListener("click", dismiss); };
  }, [activeTooltip]);

  useEffect(() => { setMounted(true); }, []);

  const handleConnectX = () => {
    setShowConnectModal(true);
    setConnectStage("connecting");
    setTimeout(() => setConnectStage("success"), 1800);
  };
  const handleConnectDone = () => { setIsXConnected(true); setShowConnectModal(false); };

  const kolData = {
    name: "Ana Bailey", handle: "@KaylaHermiston", avatar: "A", avatarBg: "#3b82f6", rank: 64, score: 87,
    bio: "Full-time crypto trader. Sharing high-conviction calls only. NFA.",
    following: 84, followers: 11,
    followedBy: [{ name: "Andrew Walter", avatar: "A", bg: "#6366f1" }, { name: "Mike Chen", avatar: "M", bg: "#f59e0b" }],
    traderTags: [{ emoji: "🔮", label: "Alpha Hunter" }, { emoji: "🌍", label: "Macro Aware" }, { emoji: "⚡", label: "Momentum Rider" }],
  };
  const radarData = { accuracy: 82, winRate: 75, riskReward: 88, consistency: 70, timing: 85, transparency: 90, engagement: 65, trackRecord: 78 };
  const stats = { bestTrade: { token: "HYPE", pnl: 156.2, date: "Jan 12" }, worstTrade: { token: "SOL", pnl: -23.5, date: "Jan 8" }, streak: { current: 7 }, cumulative: 342.8, signalVsNoise: { signals: 156, noise: 42 }, tradersCopying: 367, pointsCollected: 12450 };
  const performanceData = [{ label: "W1", value: 12 }, { label: "W2", value: -5 }, { label: "W3", value: 28 }, { label: "W4", value: 15 }, { label: "W5", value: -8 }, { label: "W6", value: 32 }, { label: "W7", value: 22 }, { label: "W8", value: 18 }];

  const handleToggleFollowing = (id: string) => { setFollowingList((prev) => prev.map((u) => (u.id === id ? { ...u, isFollowing: !u.isFollowing } : u))); };
  const kolGrade = getGrade(kolData.score);
  const snr = stats.signalVsNoise;
  const signalPct = Math.round((snr.signals / (snr.signals + snr.noise)) * 100);

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)" }}>
      <style jsx global>{`
        @keyframes particleFloat { 0%,100%{transform:translateY(0) translateX(0);opacity:.15} 25%{transform:translateY(-25px) translateX(8px);opacity:.7} 50%{transform:translateY(-10px) translateX(-8px);opacity:.3} 75%{transform:translateY(-35px) translateX(4px);opacity:.55} }
        @keyframes streamRise { 0%{transform:translateY(0);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translateY(-110vh);opacity:0} }
        @keyframes radarOrbitGlow { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes radarPulseRing { 0%{transform:scale(.6);opacity:.6} 100%{transform:scale(1.8);opacity:0} }
        @keyframes radarDotPulse { 0%,100%{r:6;opacity:.15} 50%{r:10;opacity:.3} }
        @keyframes profileSlideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes profileFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes profileScaleIn { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
        @keyframes gradeRingSpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes gradeRingPulse { 0%,100%{opacity:.5;filter:blur(1px)} 50%{opacity:1;filter:blur(2px)} }
        @keyframes gradeBounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes tagFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        @keyframes tagGlow { 0%,100%{border-color:rgba(255,255,255,.1)} 50%{border-color:rgba(45,212,191,.3)} }
        @keyframes shimmerSlide { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes cardGlowPulse { 0%,100%{box-shadow:0 0 15px rgba(45,212,191,.05),inset 0 0 30px rgba(45,212,191,.02)} 50%{box-shadow:0 0 30px rgba(45,212,191,.15),inset 0 0 40px rgba(45,212,191,.05)} }
        @keyframes signalSlideIn { from{opacity:0;transform:translateX(-15px)} to{opacity:1;transform:translateX(0)} }
        @keyframes avatarPulse { 0%,100%{box-shadow:0 0 15px rgba(59,130,246,.3)} 50%{box-shadow:0 0 25px rgba(59,130,246,.5),0 0 45px rgba(59,130,246,.2)} }
        @keyframes statCardHover { 0%,100%{border-color:rgba(255,255,255,.08)} 50%{border-color:rgba(45,212,191,.2)} }
        @keyframes progressFill { from{width:0%} }
        @keyframes lockPulse { 0%,100%{opacity:.5} 50%{opacity:.8} }
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes unlockReveal { from{opacity:0;transform:translateY(12px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes btnRipple { 0%{transform:scale(0);opacity:0.5} 100%{transform:scale(4);opacity:0} }
        @keyframes copyShimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes tooltipFadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <Particles />
      <DataStreams />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/4 w-[350px] h-[350px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/4 -right-20 w-[250px] h-[250px] rounded-full" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 60%)", filter: "blur(50px)" }} />
        <div className="absolute top-1/2 left-[-10%] w-[200px] h-[200px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.04) 0%, transparent 60%)", filter: "blur(40px)" }} />
      </div>

      {/* ── Header ── */}
      <ScrollReveal delay={0} direction="down" distance={16} duration={0.5}>
        <div className="relative z-10 mt-3 mb-2 flex items-center justify-between px-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:bg-white/10" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Image src={profileIcon} alt="profile" width={14} height={14} />
          </div>
          <div className="flex items-center gap-2">
            {isXConnected && (
              <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg" style={{ background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)" }}>
                <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" className="text-teal-400"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                <CheckCircle size={9} className="text-teal-400" />
              </div>
            )}

        <IconWithTooltip tooltip="Active Trades">
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all hover:scale-105" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Image src={copyCountIcon} alt="active-trades" width={13} height={13} />
            <span className="text-[11px] font-semibold text-teal-400">4</span>
          </div>
        </IconWithTooltip>
          <IconWithTooltip tooltip="Your Rank">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.15), rgba(45,212,191,0.08))", border: "1px solid rgba(45,212,191,0.25)", boxShadow: "0 0 15px rgba(45,212,191,0.2)" }}>
              <Image src={copyRankIcon} alt="your-rank" width={13} height={13} />
              <span className="text-[11px] font-semibold text-teal-400">#64</span>
            </div>
          </IconWithTooltip>
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
              {/* Row 1: Avatar + Name + Grade */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold transition-transform duration-300 hover:scale-110" style={{ backgroundColor: kolData.avatarBg, animation: "avatarPulse 3s ease-in-out infinite" }}>{kolData.avatar}</div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h1 className="text-[15px] font-bold text-white tracking-tight">{kolData.name}</h1>
                      <div className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ background: "rgba(45,212,191,0.1)", color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.25)" }}>#{kolData.rank}</div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor" className="text-gray-500"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                      <span className="text-[10px] text-teal-400 font-medium">{kolData.handle}</span>
                      {isXConnected && (
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full" style={{ background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.15)" }}>
                          <CheckCircle size={7} className="text-teal-400" />
                          <span className="text-[7px] font-semibold text-teal-400">Linked</span>
                        </div>
                      )}
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

              {/* Row 2: Following / Followers + Followed by */}
              <div className="flex items-center gap-3 mb-2.5">
                <span className="text-[10px] cursor-pointer hover:underline" onClick={() => setShowFollowingSheet(true)}><span className="text-white font-bold">{kolData.following}</span><span className="text-gray-500 font-medium"> Following</span></span>
                <span className="text-[10px]"><span className="text-white font-bold">{kolData.followers}</span><span className="text-gray-500 font-medium"> Followers</span></span>
              </div>

              {/* Followed by */}
              <div className="flex items-center gap-1.5 mb-2.5 px-0.5">
                <div className="flex -space-x-1.5">{kolData.followedBy.map((u, i) => (<div key={i} className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold border border-[#0a0f14]" style={{ backgroundColor: u.bg }}>{u.avatar}</div>))}</div>
                <span className="text-[9px] text-gray-500">Followed by <span className="text-gray-300 font-medium">{kolData.followedBy[0].name}</span> and <span className="text-gray-300 font-medium">{kolData.followedBy.length - 1} other{kolData.followedBy.length - 1 > 1 ? "s" : ""}</span></span>
              </div>

              {/* Trait Badges — aligned with button right edge */}
              <div className="flex items-center gap-1 justify-end mb-1 relative z-20">
                {kolData.traderTags.map((tag, i) => (
                  <div key={i} className="relative">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95"
                      style={{
                        background: activeTooltip === tag.label ? "rgba(45,212,191,0.15)" : "rgba(45,212,191,0.06)",
                        border: `1px solid ${activeTooltip === tag.label ? "rgba(45,212,191,0.35)" : "rgba(45,212,191,0.12)"}`,
                      }}
                      onClick={(e) => { e.stopPropagation(); setActiveTooltip(activeTooltip === tag.label ? null : tag.label); }}
                      onMouseEnter={() => setActiveTooltip(tag.label)}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <span className="text-[11px] leading-none">{tag.emoji}</span>
                    </div>
                    {activeTooltip === tag.label && (
                      <div className="absolute right-0 bottom-full mb-1.5 whitespace-nowrap z-30" style={{ animation: "tooltipFadeIn 0.15s ease both" }}>
                        <div className="px-2.5 py-1.5 rounded-lg text-[9px] font-semibold text-teal-300" style={{ background: "rgba(10,15,20,0.95)", border: "1px solid rgba(45,212,191,0.2)", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
                          {tag.label}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bio */}
              <p className="text-[11px] text-gray-400 leading-relaxed mb-3">{kolData.bio}</p>

              {/* ══════ Row 5: Primary CTA — Full Width ══════ */}
              <button
                onClick={() => setIsCopying(!isCopying)}
                onPointerDown={() => setCopyPressed(true)}
                onPointerUp={() => setCopyPressed(false)}
                onPointerLeave={() => setCopyPressed(false)}
                className="w-full py-2.5 rounded-xl text-[12px] font-bold transition-all duration-300 cursor-pointer relative overflow-hidden"
                style={isCopying
                  ? { background: "rgba(251,146,60,0.12)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.25)", transform: copyPressed ? "scale(0.98)" : "scale(1)" }
                  : { background: "linear-gradient(135deg, #2dd4bf, #14b8a6)", color: "#0a0f14", boxShadow: "0 4px 20px rgba(45,212,191,0.35), inset 0 1px 0 rgba(255,255,255,0.2)", transform: copyPressed ? "scale(0.98)" : "scale(1)" }
                }
              >
                {!isCopying && <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)", backgroundSize: "200% 100%", animation: "copyShimmer 3s ease-in-out infinite" }} />}
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  {isCopying ? <><CheckCircle size={13} /><span>Copying</span></> : <><Copy size={13} /><span>Copy Trade</span></>}
                </span>
              </button>

              {/* ══════ Row 6: Three Equal Secondary Buttons ══════ */}
              <div className="grid mt-1.5" style={{ gridTemplateColumns: isXConnected ? "1fr 1fr 1fr" : "1fr 1fr", gap: "6px" }}>
                <button
                  onClick={() => setIsFollowing(!isFollowing)}
                  onPointerDown={() => setFollowPressed(true)}
                  onPointerUp={() => setFollowPressed(false)}
                  onPointerLeave={() => setFollowPressed(false)}
                  className="py-2 rounded-xl text-[10px] font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
                  style={isFollowing
                    ? { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)", transform: followPressed ? "scale(0.95)" : "scale(1)" }
                    : { background: "rgba(45,212,191,0.06)", color: "rgba(45,212,191,0.85)", border: "1px solid rgba(45,212,191,0.15)", transform: followPressed ? "scale(0.95)" : "scale(1)" }
                  }
                >
                  {isFollowing ? <UserCheck size={11} /> : <UserPlus size={11} />}
                  <span>{isFollowing ? "Following" : "Follow"}</span>
                </button>
                <button
                  onClick={() => setShowShareSheet(true)}
                  className="py-2 rounded-xl text-[10px] font-medium cursor-pointer transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5"
                  style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <Share2 size={11} />
                  <span>Share</span>
                </button>
                {isXConnected && (
                  <button
                    onClick={() => setShowPrivacySheet(true)}
                    className="py-2 rounded-xl text-[10px] font-medium cursor-pointer transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5"
                    style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <ShieldCheck size={11} />
                    <span>Privacy</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ── PnL Section ── */}
      <ScrollReveal delay={0} direction="up" distance={24} duration={0.55}>
        <div className="relative z-10 px-4 mb-2">
          {isXConnected ? <div style={{ animation: "unlockReveal 0.5s ease both" }}><PnLChart /></div> : <PnLTeaser onConnect={handleConnectX} />}
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
        {activeTab === "overview" && (
          <div className="space-y-1.5">
            <ScrollReveal direction="scale" delay={0}>
              <div className="rounded-xl p-2 relative overflow-hidden" style={cardStyle}>
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(45,212,191,0.04) 0%, transparent 70%)" }} />
                <div className="flex items-center justify-between mb-0 relative z-10"><span className="text-[10px] font-semibold text-white">Performance Radar</span></div>
                <RadarChart data={radarData} size={190} />
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0}>
              <div className="rounded-xl p-2.5 relative overflow-hidden" style={cardStyle}>
                <div className="flex items-center justify-between mb-1.5 relative z-10"><span className="text-[10px] font-semibold text-white">Weekly Returns</span><span className="text-[10px] text-teal-400 font-semibold"><AnimatedNumber value={stats.cumulative} prefix="+" suffix="%" decimals={1} /></span></div>
                <PerformanceChart data={performanceData} />
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { icon: Trophy, ic: "text-teal-400", ib: "bg-teal-400/10", label: "Best Signal", val: stats.bestTrade.pnl, pre: "+", suf: "%", color: "text-teal-400", sub: `${stats.bestTrade.token} · ${stats.bestTrade.date}` },
                { icon: AlertCircle, ic: "text-rose-400", ib: "bg-rose-400/10", label: "Worst Signal", val: Math.abs(stats.worstTrade.pnl), pre: "-", suf: "%", color: "text-rose-400", sub: `${stats.worstTrade.token} · ${stats.worstTrade.date}` },
                { icon: Flame, ic: "text-orange-400", ib: "bg-orange-400/10", label: "Current Streak", val: stats.streak.current, pre: "", suf: " wins 🔥", color: "text-white", sub: "" },
                { icon: BarChart3, ic: "text-purple-400", ib: "bg-purple-400/10", label: "% Cumulative", val: stats.cumulative, pre: "+", suf: "%", color: "text-white", sub: "All time" },
              ].map((item, i) => (
                <ScrollReveal key={i} delay={i * 0.06} direction={i % 2 === 0 ? "left" : "right"} distance={18}>
                  <div className="rounded-xl px-2 py-1.5 relative overflow-hidden transition-all duration-300 hover:scale-[1.03]" style={{ ...cardStyle, animation: `statCardHover ${3 + i}s ease-in-out infinite` }}>
                    <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${item.ic.includes("teal") ? "rgba(45,212,191,0.06)" : item.ic.includes("rose") ? "rgba(244,63,94,0.06)" : item.ic.includes("orange") ? "rgba(251,146,60,0.06)" : "rgba(139,92,246,0.06)"} 0%, transparent 70%)` }} />
                    <div className="flex items-center gap-1 mb-0.5 relative z-10"><div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${item.ib}`}><item.icon size={9} className={item.ic} /></div><span className="text-[8px] text-gray-500">{item.label}</span></div>
                    <p className={`text-[12px] font-bold leading-tight relative z-10 ${item.color}`}><AnimatedNumber value={item.val} prefix={item.pre} suffix={item.suf} decimals={item.val % 1 !== 0 ? 1 : 0} /></p>
                    {item.sub && <p className="text-[7px] text-gray-500 relative z-10">{item.sub}</p>}
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal direction="up" delay={0}>
              <div className="rounded-xl p-2.5 relative overflow-hidden" style={cardStyle}>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-[8px] text-gray-400 shrink-0">Signal vs Noise</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${signalPct}%`, background: "linear-gradient(90deg, rgba(45,212,191,1), rgba(45,212,191,0.7))", boxShadow: "0 0 10px rgba(45,212,191,0.5)", animation: "progressFill 1.5s ease 1s both" }} /></div>
                  <span className="text-[8px] text-teal-400 font-semibold shrink-0"><AnimatedNumber value={signalPct} suffix="%" /></span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.03]" onClick={() => setShowCopyingSheet(true)}>
                    <div className="w-6 h-6 rounded-md flex items-center justify-center bg-blue-400/10"><Users size={11} className="text-blue-400" /></div>
                    <div><p className="text-[12px] font-bold text-white"><AnimatedNumber value={stats.tradersCopying} /></p><p className="text-[7px] text-gray-500">Traders Copying</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center bg-yellow-400/10"><Award size={11} className="text-yellow-400" /></div>
                    <div><p className="text-[12px] font-bold text-white"><AnimatedNumber value={stats.pointsCollected} /></p><p className="text-[7px] text-gray-500">Points Collected</p></div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        )}

        {activeTab === "signals" && (
          isXConnected ? <SignalsContent /> : <LockedTabContent title="Unlock Signals" description="See real-time trading signals, calls, and market insights from this trader." onConnect={handleConnectX} />
        )}

        {activeTab === "positions" && (
          isXConnected ? <CopiedPositionsContent /> : <LockedTabContent title="Unlock Copied Positions" description="See positions opened by copiers on HyperCopy based on this KOL's signals — copier count, aggregate PnL, and volume." onConnect={handleConnectX} />
        )}
      </div>

      {/* ── Sheets & Modals ── */}
      <ConnectXModal isOpen={showConnectModal} stage={connectStage} onClose={handleConnectDone} />
      <PrivacySheet isOpen={showPrivacySheet} onClose={() => setShowPrivacySheet(false)} settings={privacySettings} onToggle={(k) => setPrivacySettings((p) => ({ ...p, [k]: !p[k] }))} />
      <FollowingSheet isOpen={showFollowingSheet} onClose={() => setShowFollowingSheet(false)} title="Following" count={kolData.following} users={followingList} onToggleFollow={handleToggleFollowing} />
      <TradersCopyingSheet isOpen={showCopyingSheet} onClose={() => setShowCopyingSheet(false)} traders={copyingTraders} totalPnl={29.7} />
      <ShareSheet isOpen={showShareSheet} onClose={() => setShowShareSheet(false)} traderData={{ name: kolData.name, handle: kolData.handle, avatar: kolData.avatar, avatarBg: kolData.avatarBg, rank: kolData.rank, grade: kolGrade.grade, gradeColor: kolGrade.color, gradeGlow: kolGrade.glow, tags: [{ label: "🔮 Alpha Hunter", color: "#2dd4bf" }, { label: "🌍 Macro Aware", color: "#00b8d4" }, { label: "⚡ Momentum", color: "#ffd700" }], radar: radarData, cumulative: stats.cumulative, streak: stats.streak.current, signalPct, bestTrade: stats.bestTrade, tradersCopying: stats.tradersCopying }} />
    </div>
  );
}