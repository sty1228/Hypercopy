"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import profileIcon from "@/assets/icons/profile.png";
import copyCountIcon from "@/assets/icons/copy-count.png";
import copyRankIcon from "@/assets/icons/copy-rank.png";
import {
  Target, Users, Award, BarChart3, Share2,
  ArrowUpRight, ArrowDownRight, Flame, Trophy, AlertCircle,
  CheckCircle, Search,
} from "lucide-react";
import FollowingSheet from "./components/followingSheet";
import TradersCopyingSheet from "./components/tradersCopyingSheet";
import type { FollowingUser } from "./components/followingItem";
import type { CopyingTrader } from "./components/traderCopyingItem";
import UserMenu from "@/components/UserMenu";

/* ── Floating Particles ──────────────────────────── */
const Particles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
    {Array.from({ length: 20 }).map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full"
        style={{
          width: `${Math.random() * 3 + 1}px`,
          height: `${Math.random() * 3 + 1}px`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          background: i % 3 === 0 ? "rgba(45,212,191,0.5)" : i % 3 === 1 ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.2)",
          animation: `particleFloat ${5 + Math.random() * 10}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 5}s`,
        }}
      />
    ))}
  </div>
);

/* ── Data Streams ────────────────────────────────── */
const DataStreams = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="absolute"
        style={{
          width: "1px",
          height: "40px",
          left: `${20 + i * 20}%`,
          bottom: "-40px",
          background: `linear-gradient(to top, transparent, rgba(45,212,191,${0.15 + i * 0.05}), transparent)`,
          animation: `streamRise ${4 + Math.random() * 3}s linear infinite`,
          animationDelay: `${Math.random() * 4}s`,
        }}
      />
    ))}
  </div>
);

/* ── Animated Counter ────────────────────────────── */
const AnimatedNumber = ({ value, prefix = "", suffix = "", decimals = 0, duration = 1200 }: { value: number; prefix?: string; suffix?: string; decimals?: number; duration?: number }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const steps = 40;
        let step = 0;
        const timer = setInterval(() => {
          step++;
          setDisplay(value * (1 - Math.pow(1 - step / steps, 3)));
          if (step >= steps) clearInterval(timer);
        }, duration / steps);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);
  return <span ref={ref}>{prefix}{display.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{suffix}</span>;
};

/* ── Radar Chart ─────────────────────────────────── */
const RadarChart = ({ data, size = 160 }: { data: Record<string, number>; size?: number }) => {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<SVGSVGElement>(null);
  const center = size / 2, radius = size * 0.32, levels = 5;
  const dims = [
    { key: "accuracy", label: "Accuracy" }, { key: "winRate", label: "Win Rate" },
    { key: "riskReward", label: "R/R Ratio" }, { key: "consistency", label: "Consist." },
    { key: "timing", label: "Timing" }, { key: "transparency", label: "Transp." },
    { key: "engagement", label: "Engage." }, { key: "trackRecord", label: "Track Rec." },
  ];
  const step = (2 * Math.PI) / dims.length;
  const pt = (v: number, i: number) => {
    const a = step * i - Math.PI / 2, r = (v / 100) * radius;
    return { x: center + r * Math.cos(a), y: center + r * Math.sin(a) };
  };
  const zeroPts = dims.map((_, i) => {
    const a = step * i - Math.PI / 2;
    return { x: center + 2 * Math.cos(a), y: center + 2 * Math.sin(a) };
  });
  const pts = dims.map((d, i) => pt(data[d.key], i));
  const makePathD = (points: { x: number; y: number }[]) => points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  const [currentPts, setCurrentPts] = useState(zeroPts);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setAnimated(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!animated) return;
    const duration = 1200, steps = 50;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const t = 1 - Math.pow(1 - step / steps, 3);
      setCurrentPts(zeroPts.map((zp, i) => ({
        x: zp.x + (pts[i].x - zp.x) * t,
        y: zp.y + (pts[i].y - zp.y) * t,
      })));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [animated]);

  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: animated ? 1 : 0, transition: "opacity 0.8s ease 0.3s" }}>
        <div style={{ width: size * 0.7, height: size * 0.7, borderRadius: "50%", background: "conic-gradient(from 0deg, rgba(45,212,191,0.12), transparent, rgba(45,212,191,0.08), transparent, rgba(45,212,191,0.12))", animation: animated ? "radarOrbitGlow 6s linear infinite" : "none", filter: "blur(15px)" }} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 1, 2].map((i) => (
          <div key={i} className="absolute rounded-full" style={{ width: size * 0.5, height: size * 0.5, border: "1px solid rgba(45,212,191,0.15)", opacity: animated ? 1 : 0, animation: animated ? `radarPulseRing 3s ease-out ${i * 1}s infinite` : "none" }} />
        ))}
      </div>
      <svg ref={ref} width={size} height={size} className="mx-auto relative z-10" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(45,212,191,0.45)" />
            <stop offset="100%" stopColor="rgba(45,212,191,0.08)" />
          </linearGradient>
          <filter id="radarGlow">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(45,212,191,0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle cx={center} cy={center} r={radius * 0.3} fill="url(#centerGlow)" style={{ opacity: animated ? 1 : 0, transition: "opacity 1s ease 0.5s" }} />
        {[...Array(levels)].map((_, li) => {
          const lr = radius * ((li + 1) / levels);
          const points = dims.map((_, i) => { const a = step * i - Math.PI / 2; return `${center + lr * Math.cos(a)},${center + lr * Math.sin(a)}`; }).join(" ");
          return <polygon key={li} points={points} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" style={{ opacity: animated ? 1 : 0, transition: `opacity 0.4s ease ${0.1 + li * 0.08}s` }} />;
        })}
        {dims.map((_, i) => { const a = step * i - Math.PI / 2; return <line key={i} x1={center} y1={center} x2={center + radius * Math.cos(a)} y2={center + radius * Math.sin(a)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" style={{ opacity: animated ? 1 : 0, transition: `opacity 0.3s ease ${i * 0.05}s` }} />; })}
        <path d={makePathD(currentPts)} fill="url(#rg)" stroke="rgba(45,212,191,0.9)" strokeWidth="1.5" filter="url(#radarGlow)" style={{ opacity: animated ? 1 : 0, transition: "opacity 0.4s ease 0.2s" }} />
        <path d={makePathD(currentPts)} fill="none" stroke="rgba(45,212,191,0.2)" strokeWidth="6" style={{ opacity: animated ? 1 : 0, transition: "opacity 0.6s ease 0.4s", filter: "blur(4px)" }} />
        {currentPts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="6" fill="rgba(45,212,191,0.15)" style={{ opacity: animated ? 1 : 0, transition: `opacity 0.4s ease ${0.6 + i * 0.08}s`, animation: animated ? `radarDotPulse 2s ease-in-out ${i * 0.25}s infinite` : "none" }} />
            <circle cx={p.x} cy={p.y} r="3" fill="#2dd4bf" style={{ opacity: animated ? 1 : 0, transition: `opacity 0.3s ease ${0.6 + i * 0.08}s`, filter: "drop-shadow(0 0 6px rgba(45,212,191,0.9))" }} />
          </g>
        ))}
        {dims.map((d, i) => {
          const a = step * i - Math.PI / 2, lr = radius + 22, x = center + lr * Math.cos(a), y = center + lr * Math.sin(a);
          let anchor: "start" | "middle" | "end" = "middle";
          if (Math.cos(a) > 0.3) anchor = "start"; else if (Math.cos(a) < -0.3) anchor = "end";
          return <text key={i} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize="7.5" fill="rgba(255,255,255,0.45)" style={{ opacity: animated ? 1 : 0, transition: `opacity 0.4s ease ${0.3 + i * 0.06}s` }}>{d.label}</text>;
        })}
        {animated && pts.map((p, i) => {
          const a = step * i - Math.PI / 2, offset = 13;
          const lx = p.x + offset * Math.cos(a), ly = p.y + offset * Math.sin(a);
          return <text key={`v${i}`} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="6.5" fill="rgba(45,212,191,0.7)" fontWeight="bold" style={{ opacity: animated ? 1 : 0, transition: `opacity 0.4s ease ${1 + i * 0.08}s` }}>{data[dims[i].key]}</text>;
        })}
      </svg>
    </div>
  );
};

/* ── Performance Chart ───────────────────────────── */
const PerformanceChart = ({ data }: { data: { label: string; value: number }[] }) => {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const max = Math.max(...data.map((d) => Math.abs(d.value)));
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setAnimated(true); obs.disconnect(); } }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="relative" style={{ height: 56 }}>
      <div className="absolute left-0 right-0" style={{ top: 22, height: 1, background: "rgba(255,255,255,0.08)" }} />
      <div className="flex items-center gap-1 h-full">
        {data.map((item, i) => {
          const pct = (Math.abs(item.value) / max) * 50;
          const isPos = item.value >= 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center" style={{ height: 56 }}>
              <div className="relative flex-1 w-full" style={{ height: 44 }}>
                <div className={`absolute left-0.5 right-0.5 ${isPos ? "rounded-t" : "rounded-b"}`} style={{
                  height: animated ? `${pct}%` : "0%",
                  transition: `height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.08}s`,
                  ...(isPos
                    ? { bottom: "50%", background: "linear-gradient(180deg, rgba(45,212,191,0.9) 0%, rgba(45,212,191,0.4) 100%)", boxShadow: animated ? "0 -2px 10px rgba(45,212,191,0.4)" : "none" }
                    : { top: "50%", background: "linear-gradient(0deg, rgba(244,63,94,0.9) 0%, rgba(244,63,94,0.4) 100%)", boxShadow: animated ? "0 2px 10px rgba(244,63,94,0.4)" : "none" }),
                }} />
              </div>
              <span className="text-[7px] text-gray-500 mt-0.5">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Grade helper ────────────────────────────────── */
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

/* ── Mock Data ───────────────────────────────────── */
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

/* ── Page ─────────────────────────────────────────── */
export default function KOLProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [showFollowingSheet, setShowFollowingSheet] = useState(false);
  const [showCopyingSheet, setShowCopyingSheet] = useState(false);
  const [followingList, setFollowingList] = useState(followingUsers);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const kolData = {
    name: "Ana Bailey", handle: "@KaylaHermiston", avatar: "A", avatarBg: "#3b82f6", rank: 64, score: 87,
    bio: "Full-time crypto trader. Sharing high-conviction calls only. NFA.",
    following: 84, followers: 11,
    followedBy: [{ name: "Andrew Walter", avatar: "A", bg: "#6366f1" }, { name: "Mike Chen", avatar: "M", bg: "#f59e0b" }],
    traderTags: [
      { emoji: "🔮", label: "Alpha Hunter" },
      { emoji: "🌍", label: "Macro Aware" },
      { emoji: "⚡", label: "Momentum Rider" },
    ],
  };
  const radarData = { accuracy: 82, winRate: 75, riskReward: 88, consistency: 70, timing: 85, transparency: 90, engagement: 65, trackRecord: 78 };
  const stats = { bestTrade: { token: "HYPE", pnl: 156.2, date: "Jan 12" }, worstTrade: { token: "SOL", pnl: -23.5, date: "Jan 8" }, streak: { current: 7 }, cumulative: 342.8, signalVsNoise: { signals: 156, noise: 42 }, tradersCopying: 367, pointsCollected: 12450 };
  const performanceData = [{ label: "W1", value: 12 }, { label: "W2", value: -5 }, { label: "W3", value: 28 }, { label: "W4", value: 15 }, { label: "W5", value: -8 }, { label: "W6", value: 32 }, { label: "W7", value: 22 }, { label: "W8", value: 18 }];
  const signalHistory = [
    { id: 1, token: "BTC", type: "long", price: "$67,500", result: "win", pnl: "+12.5%", time: "2d ago", tp: "$72,000", sl: "$65,000" },
    { id: 2, token: "ETH", type: "short", price: "$2,450", result: "win", pnl: "+8.2%", time: "3d ago", tp: "$2,250", sl: "$2,550" },
    { id: 3, token: "SOL", type: "long", price: "$98", result: "loss", pnl: "-4.5%", time: "5d ago", tp: "$115", sl: "$94" },
    { id: 4, token: "HYPE", type: "long", price: "$1.12", result: "win", pnl: "+45.2%", time: "1w ago", tp: "$1.80", sl: "$0.95" },
  ];

  const handleToggleFollowing = (id: string) => { setFollowingList((prev) => prev.map((u) => (u.id === id ? { ...u, isFollowing: !u.isFollowing } : u))); };
  const kolGrade = getGrade(kolData.score);
  const snr = stats.signalVsNoise;
  const signalPct = Math.round((snr.signals / (snr.signals + snr.noise)) * 100);

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)" }}>
      <style jsx global>{`
        @keyframes particleFloat {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.15; }
          25% { transform: translateY(-25px) translateX(8px); opacity: 0.7; }
          50% { transform: translateY(-10px) translateX(-8px); opacity: 0.3; }
          75% { transform: translateY(-35px) translateX(4px); opacity: 0.55; }
        }
        @keyframes streamRise {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-110vh); opacity: 0; }
        }
        @keyframes radarOrbitGlow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes radarPulseRing { 0% { transform: scale(0.6); opacity: 0.6; } 100% { transform: scale(1.8); opacity: 0; } }
        @keyframes radarDotPulse { 0%, 100% { r: 6; opacity: 0.15; } 50% { r: 10; opacity: 0.3; } }
        @keyframes profileSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes profileFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes profileScaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        @keyframes gradeRingSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes gradeRingPulse { 0%, 100% { opacity: 0.5; filter: blur(1px); } 50% { opacity: 1; filter: blur(2px); } }
        @keyframes gradeBounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes tagFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        @keyframes tagGlow { 0%, 100% { border-color: rgba(255,255,255,0.1); } 50% { border-color: rgba(45,212,191,0.3); } }
        @keyframes shimmerSlide { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        @keyframes cardGlowPulse {
          0%, 100% { box-shadow: 0 0 15px rgba(45,212,191,0.05), inset 0 0 30px rgba(45,212,191,0.02); }
          50% { box-shadow: 0 0 30px rgba(45,212,191,0.15), inset 0 0 40px rgba(45,212,191,0.05); }
        }
        @keyframes signalSlideIn { from { opacity: 0; transform: translateX(-15px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes avatarPulse {
          0%, 100% { box-shadow: 0 0 15px rgba(59,130,246,0.3); }
          50% { box-shadow: 0 0 25px rgba(59,130,246,0.5), 0 0 45px rgba(59,130,246,0.2); }
        }
        @keyframes statCardHover { 0%, 100% { border-color: rgba(255,255,255,0.08); } 50% { border-color: rgba(45,212,191,0.2); } }
        @keyframes progressFill { from { width: 0%; } }
      `}</style>

      <Particles />
      <DataStreams />

      {/* Ambient glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/4 w-[350px] h-[350px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/4 -right-20 w-[250px] h-[250px] rounded-full" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 60%)", filter: "blur(50px)" }} />
        <div className="absolute top-1/2 left-[-10%] w-[200px] h-[200px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.04) 0%, transparent 60%)", filter: "blur(40px)" }} />
      </div>

      {/* Header */}
      <div className="relative z-10 mt-3 mb-2 flex items-center justify-between px-4" style={{ animation: mounted ? "profileFadeIn 0.4s ease both" : "none" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:bg-white/10" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Image src={profileIcon} alt="profile" width={14} height={14} />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all hover:scale-105" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} onClick={() => setShowCopyingSheet(true)}>
            <Image src={copyCountIcon} alt="copy-count" width={13} height={13} />
            <span className="text-[11px] font-semibold text-teal-400">4</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.15) 0%, rgba(45,212,191,0.08) 100%)", border: "1px solid rgba(45,212,191,0.25)", boxShadow: "0 0 15px rgba(45,212,191,0.2)" }}>
            <Image src={copyRankIcon} alt="copy-rank" width={13} height={13} />
            <span className="text-[11px] font-semibold text-teal-400">#64</span>
          </div>
          <UserMenu />
        </div>
      </div>

      {/* Search */}
      <div className="relative z-10 px-4 mb-2.5" style={{ animation: mounted ? "profileFadeIn 0.5s ease 0.1s both" : "none" }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Search size={14} className="text-gray-500 shrink-0" />
          <input type="text" placeholder="Search trader..." className="bg-transparent text-[11px] text-white placeholder-gray-500 outline-none w-full" />
        </div>
      </div>

      {/* ── Profile Card ──────────────────────────── */}
      <div className="relative z-10 px-4 pt-1 pb-2" style={{ animation: mounted ? "profileSlideUp 0.6s ease 0.15s both" : "none" }}>
        <div className="rounded-2xl p-3 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.08) 0%, rgba(45,212,191,0.02) 100%)", border: "1px solid rgba(45,212,191,0.2)", animation: "cardGlowPulse 4s ease-in-out infinite" }}>
          {/* Shimmer sweep */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(45,212,191,0.06) 50%, transparent 100%)", animation: "shimmerSlide 5s ease-in-out infinite" }} />
          </div>
          {/* Corner accents */}
          <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l rounded-tl-sm pointer-events-none z-20" style={{ borderColor: "rgba(45,212,191,0.3)" }} />
          <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r rounded-tr-sm pointer-events-none z-20" style={{ borderColor: "rgba(45,212,191,0.3)" }} />
          <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b border-l rounded-bl-sm pointer-events-none z-20" style={{ borderColor: "rgba(45,212,191,0.3)" }} />
          <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r rounded-br-sm pointer-events-none z-20" style={{ borderColor: "rgba(45,212,191,0.3)" }} />
          {/* Top glow */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: "radial-gradient(ellipse at top left, rgba(45,212,191,0.15) 0%, transparent 60%)" }} />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold transition-transform duration-300 hover:scale-110" style={{ backgroundColor: kolData.avatarBg, animation: "avatarPulse 3s ease-in-out infinite" }}>
                  {kolData.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-sm font-bold text-white">{kolData.name}</h1>
                    <div className="px-1 py-px rounded text-[9px] font-bold" style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#000" }}>#{kolData.rank}</div>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor" className="text-gray-400"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    <span className="text-[10px] text-teal-400">{kolData.handle}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] cursor-pointer hover:underline" onClick={() => setShowFollowingSheet(true)}><span className="text-teal-400 font-semibold">{kolData.following}</span><span className="text-gray-500"> Following</span></span>
                    <span className="text-[9px]"><span className="text-teal-400 font-semibold">{kolData.followers}</span><span className="text-gray-500"> Followers</span></span>
                  </div>
                </div>
              </div>

              {/* Animated Grade Badge */}
              <div className="flex flex-col items-center">
                <div className="relative" style={{ width: 42, height: 42 }}>
                  <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(from 0deg, ${kolGrade.color}, ${kolGrade.color}22, ${kolGrade.color}, ${kolGrade.color}22, ${kolGrade.color})`, animation: "gradeRingSpin 8s linear infinite, gradeRingPulse 3s ease-in-out infinite" }} />
                  <div className="absolute rounded-full flex items-center justify-center" style={{ inset: 2, background: "linear-gradient(145deg, #141c24 0%, #0a0f14 100%)" }}>
                    <span className="text-base font-black tracking-tight" style={{ color: kolGrade.color, textShadow: `0 0 12px ${kolGrade.glow}, 0 0 24px ${kolGrade.glow}`, animation: "gradeBounce 3s ease-in-out infinite" }}>{kolGrade.grade}</span>
                  </div>
                </div>
                <span className="text-[7px] text-gray-500 mt-0.5 tracking-widest">GRADE</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mb-2" style={{ animation: mounted ? "profileFadeIn 0.5s ease 0.4s both" : "none" }}>
              <div className="flex -space-x-1.5">
                {kolData.followedBy.map((u, i) => (<div key={i} className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold border border-[#0a0f14]" style={{ backgroundColor: u.bg }}>{u.avatar}</div>))}
              </div>
              <span className="text-[9px] text-gray-400">Followed by <span className="text-white">{kolData.followedBy[0].name}</span> and <span className="text-teal-400">{kolData.followedBy.length - 1} others</span></span>
            </div>

            {/* Animated Tags */}
            <div className="flex flex-wrap gap-1 mb-2">
              {kolData.traderTags.map((tag, i) => (
                <div key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-md cursor-pointer transition-all hover:scale-105" style={{ background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.15)", animation: `tagFloat ${3 + i * 0.7}s ease-in-out infinite, tagGlow ${4 + i}s ease-in-out infinite`, animationDelay: `${i * 0.4}s` }}>
                  <span className="text-xs">{tag.emoji}</span>
                  <span className="text-[9px] font-medium text-teal-400/80">{tag.label}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-gray-400 mb-2.5">{kolData.bio}</p>

            <div className="flex gap-1.5">
              <button onClick={() => setIsFollowing(!isFollowing)} className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-300 cursor-pointer active:scale-95" style={isFollowing ? { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" } : { background: "rgba(45,212,191,0.15)", color: "rgba(45,212,191,1)", border: "1px solid rgba(45,212,191,0.3)" }}>
                {isFollowing ? "Following" : "Follow"}
              </button>
              <button onClick={() => setIsCopying(!isCopying)} className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-300 cursor-pointer active:scale-95 relative overflow-hidden" style={isCopying ? { background: "rgba(251,146,60,0.2)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.3)" } : { background: "rgba(45,212,191,1)", color: "#0a0f14", boxShadow: "0 0 20px rgba(45,212,191,0.4)" }}>
                {!isCopying && <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", animation: "shimmerSlide 2.5s ease-in-out infinite" }} />}
                <span className="relative z-10">{isCopying ? "Copying" : "Copy Trade"}</span>
              </button>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 active:scale-90 cursor-pointer" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Share2 size={13} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────── */}
      <div className="relative z-10 px-4 mb-2" style={{ animation: mounted ? "profileSlideUp 0.5s ease 0.3s both" : "none" }}>
        <div className="flex p-0.5 rounded-lg relative" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="absolute top-0.5 bottom-0.5 rounded-md transition-all duration-300" style={{ width: "calc(50% - 2px)", left: activeTab === "overview" ? "2px" : "calc(50%)", background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.3)" }} />
          {[{ key: "overview", label: "Analysis" }, { key: "signals", label: "Signals" }].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all duration-300 relative z-10 cursor-pointer" style={{ color: activeTab === tab.key ? "rgba(45,212,191,1)" : "rgba(255,255,255,0.4)" }}>{tab.label}</button>
          ))}
        </div>
      </div>

      {/* ── Content ───────────────────────────────── */}
      <div className="relative z-10 px-4 pb-24">
        {activeTab === "overview" && (
          <div className="space-y-1.5">
            {/* Radar */}
            <div className="rounded-xl p-2 relative overflow-hidden" style={{ ...cardStyle, animation: "profileScaleIn 0.5s ease 0.35s both" }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(45,212,191,0.04) 0%, transparent 70%)" }} />
              <div className="flex items-center justify-between mb-0 relative z-10">
                <span className="text-[10px] font-semibold text-white">Performance Radar</span>
                <span className="text-[8px] text-gray-500">8 dimensions</span>
              </div>
              <RadarChart data={radarData} size={160} />
            </div>

            {/* Weekly Returns */}
            <div className="rounded-xl p-2.5 relative overflow-hidden" style={{ ...cardStyle, animation: "profileScaleIn 0.5s ease 0.45s both" }}>
              <div className="flex items-center justify-between mb-1.5 relative z-10">
                <span className="text-[10px] font-semibold text-white">Weekly Returns</span>
                <span className="text-[10px] text-teal-400 font-semibold"><AnimatedNumber value={stats.cumulative} prefix="+" suffix="%" decimals={1} /></span>
              </div>
              <PerformanceChart data={performanceData} />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { icon: Trophy, ic: "text-teal-400", ib: "bg-teal-400/10", label: "Best Signal", val: stats.bestTrade.pnl, pre: "+", suf: "%", color: "text-teal-400", sub: `${stats.bestTrade.token} · ${stats.bestTrade.date}` },
                { icon: AlertCircle, ic: "text-rose-400", ib: "bg-rose-400/10", label: "Worst Signal", val: Math.abs(stats.worstTrade.pnl), pre: "-", suf: "%", color: "text-rose-400", sub: `${stats.worstTrade.token} · ${stats.worstTrade.date}` },
                { icon: Flame, ic: "text-orange-400", ib: "bg-orange-400/10", label: "Current Streak", val: stats.streak.current, pre: "", suf: " wins 🔥", color: "text-white", sub: "" },
                { icon: BarChart3, ic: "text-purple-400", ib: "bg-purple-400/10", label: "% Cumulative", val: stats.cumulative, pre: "+", suf: "%", color: "text-white", sub: "All time" },
              ].map((item, i) => (
                <div key={i} className="rounded-xl px-2 py-1.5 relative overflow-hidden transition-all duration-300 hover:scale-[1.03]" style={{ ...cardStyle, animation: `profileScaleIn 0.4s ease ${0.55 + i * 0.08}s both, statCardHover ${3 + i}s ease-in-out infinite` }}>
                  <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${item.ic.includes("teal") ? "rgba(45,212,191,0.06)" : item.ic.includes("rose") ? "rgba(244,63,94,0.06)" : item.ic.includes("orange") ? "rgba(251,146,60,0.06)" : "rgba(139,92,246,0.06)"} 0%, transparent 70%)` }} />
                  <div className="flex items-center gap-1 mb-0.5 relative z-10">
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${item.ib}`}><item.icon size={9} className={item.ic} /></div>
                    <span className="text-[8px] text-gray-500">{item.label}</span>
                  </div>
                  <p className={`text-[12px] font-bold leading-tight relative z-10 ${item.color}`}><AnimatedNumber value={item.val} prefix={item.pre} suffix={item.suf} decimals={item.val % 1 !== 0 ? 1 : 0} /></p>
                  {item.sub && <p className="text-[7px] text-gray-500 relative z-10">{item.sub}</p>}
                </div>
              ))}
            </div>

            {/* Signal vs Noise + Stats */}
            <div className="rounded-xl p-2.5 relative overflow-hidden" style={{ ...cardStyle, animation: "profileSlideUp 0.5s ease 0.75s both" }}>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-[8px] text-gray-400 shrink-0">Signal vs Noise</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${signalPct}%`, background: "linear-gradient(90deg, rgba(45,212,191,1) 0%, rgba(45,212,191,0.7) 100%)", boxShadow: "0 0 10px rgba(45,212,191,0.5)", animation: "progressFill 1.5s ease 1s both" }} />
                </div>
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
          </div>
        )}

        {activeTab === "signals" && (
          <div className="rounded-xl overflow-hidden" style={cardStyle}>
            <div className="px-3 py-2.5 border-b border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white">Signal History</span>
                <span className="text-[9px] text-gray-500"><span className="text-teal-400">{signalHistory.filter((s) => s.result === "win").length}W</span>{" / "}<span className="text-rose-400">{signalHistory.filter((s) => s.result === "loss").length}L</span></span>
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {signalHistory.map((signal, idx) => (
                <div key={signal.id} className="px-3 py-2.5 hover:bg-white/5 transition-all relative overflow-hidden" style={{ animation: `signalSlideIn 0.4s ease ${idx * 0.12}s both` }}>
                  {signal.result === "win" && <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: "linear-gradient(180deg, rgba(45,212,191,0.6), rgba(45,212,191,0.1))" }} />}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center ${signal.type === "long" ? "bg-teal-400/10" : "bg-rose-400/10"}`}>
                        {signal.type === "long" ? <ArrowUpRight size={13} className="text-teal-400" /> : <ArrowDownRight size={13} className="text-rose-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-[12px] font-semibold text-white">{signal.token}</span>
                          <span className={`text-[9px] px-1 py-px rounded capitalize ${signal.type === "long" ? "bg-teal-400/10 text-teal-400" : "bg-rose-400/10 text-rose-400"}`}>{signal.type}</span>
                        </div>
                        <span className="text-[9px] text-gray-500">Entry: {signal.price}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-[12px] font-bold ${signal.result === "win" ? "text-teal-400" : "text-rose-400"}`}>{signal.pnl}</p>
                      <span className="text-[9px] text-gray-500">{signal.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-9">
                    <div className="flex items-center gap-1"><Target size={9} className="text-green-400" /><span className="text-[9px] text-gray-400">TP: {signal.tp}</span></div>
                    <div className="flex items-center gap-1"><AlertCircle size={9} className="text-rose-400" /><span className="text-[9px] text-gray-400">SL: {signal.sl}</span></div>
                    {signal.result === "win" && <CheckCircle size={10} className="text-teal-400 ml-auto" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <FollowingSheet isOpen={showFollowingSheet} onClose={() => setShowFollowingSheet(false)} title="Following" count={kolData.following} users={followingList} onToggleFollow={handleToggleFollowing} />
      <TradersCopyingSheet isOpen={showCopyingSheet} onClose={() => setShowCopyingSheet(false)} traders={copyingTraders} totalPnl={29.7} />
    </div>
  );
}