"use client";

import { useState } from "react";
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

/* ── Radar Chart ─────────────────────────────────── */
const RadarChart = ({ data, size = 190 }: { data: Record<string, number>; size?: number }) => {
  const center = size / 2;
  const radius = size * 0.32;
  const levels = 5;
  const dims = [
    { key: "accuracy", label: "Accuracy" },
    { key: "winRate", label: "Win Rate" },
    { key: "riskReward", label: "R/R Ratio" },
    { key: "consistency", label: "Consist." },
    { key: "timing", label: "Timing" },
    { key: "transparency", label: "Transp." },
    { key: "engagement", label: "Engage." },
    { key: "trackRecord", label: "Track Rec." },
  ];
  const step = (2 * Math.PI) / dims.length;
  const pt = (v: number, i: number) => {
    const a = step * i - Math.PI / 2;
    const r = (v / 100) * radius;
    return { x: center + r * Math.cos(a), y: center + r * Math.sin(a) };
  };
  const pts = dims.map((d, i) => pt(data[d.key], i));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg width={size} height={size} className="mx-auto" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(45,212,191,0.4)" />
          <stop offset="100%" stopColor="rgba(45,212,191,0.1)" />
        </linearGradient>
      </defs>
      {[...Array(levels)].map((_, li) => {
        const lr = radius * ((li + 1) / levels);
        const points = dims
          .map((_, i) => {
            const a = step * i - Math.PI / 2;
            return `${center + lr * Math.cos(a)},${center + lr * Math.sin(a)}`;
          })
          .join(" ");
        return <polygon key={li} points={points} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
      })}
      {dims.map((_, i) => {
        const a = step * i - Math.PI / 2;
        return (
          <line key={i} x1={center} y1={center} x2={center + radius * Math.cos(a)} y2={center + radius * Math.sin(a)} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        );
      })}
      <path d={pathD} fill="url(#rg)" stroke="rgba(45,212,191,0.8)" strokeWidth="2" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#2dd4bf" style={{ filter: "drop-shadow(0 0 4px rgba(45,212,191,0.6))" }} />
      ))}
      {dims.map((d, i) => {
        const a = step * i - Math.PI / 2;
        const lr = radius + 28;
        const x = center + lr * Math.cos(a);
        const y = center + lr * Math.sin(a);
        let anchor: "start" | "middle" | "end" = "middle";
        if (Math.cos(a) > 0.3) anchor = "start";
        else if (Math.cos(a) < -0.3) anchor = "end";
        return (
          <text key={i} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize="8.5" fill="rgba(255,255,255,0.5)">
            {d.label}
          </text>
        );
      })}
    </svg>
  );
};

/* ── Performance Chart (bidirectional) ───────────── */
const PerformanceChart = ({ data }: { data: { label: string; value: number }[] }) => {
  const max = Math.max(...data.map((d) => Math.abs(d.value)));
  const barH = 48;
  return (
    <div className="relative" style={{ height: barH + 14 }}>
      <div className="absolute left-0 right-0" style={{ top: barH / 2, height: 1, background: "rgba(255,255,255,0.08)" }} />
      <div className="flex items-center gap-1 h-full">
        {data.map((item, i) => {
          const pct = (Math.abs(item.value) / max) * 50;
          const isPos = item.value >= 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center" style={{ height: barH + 14 }}>
              <div className="relative flex-1 w-full" style={{ height: barH }}>
                <div
                  className={`absolute left-0 right-0 ${isPos ? "rounded-t" : "rounded-b"}`}
                  style={{
                    height: `${pct}%`,
                    ...(isPos
                      ? { bottom: "50%", background: "linear-gradient(180deg, rgba(45,212,191,0.9) 0%, rgba(45,212,191,0.4) 100%)" }
                      : { top: "50%", background: "linear-gradient(0deg, rgba(244,63,94,0.9) 0%, rgba(244,63,94,0.4) 100%)" }),
                  }}
                />
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
  if (score >= 95) return { grade: "S+", color: "#ff6b6b", glow: "rgba(255,107,107,0.5)", bg: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)" };
  if (score >= 90) return { grade: "S", color: "#ff9f43", glow: "rgba(255,159,67,0.5)", bg: "linear-gradient(135deg, #ff9f43 0%, #ee5a24 100%)" };
  if (score >= 85) return { grade: "S-", color: "#feca57", glow: "rgba(254,202,87,0.5)", bg: "linear-gradient(135deg, #feca57 0%, #ff9f43 100%)" };
  if (score >= 80) return { grade: "A+", color: "#2dd4bf", glow: "rgba(45,212,191,0.5)", bg: "linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)" };
  if (score >= 75) return { grade: "A", color: "#34d399", glow: "rgba(52,211,153,0.5)", bg: "linear-gradient(135deg, #34d399 0%, #10b981 100%)" };
  if (score >= 70) return { grade: "A-", color: "#60a5fa", glow: "rgba(96,165,250,0.5)", bg: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)" };
  if (score >= 65) return { grade: "B+", color: "#818cf8", glow: "rgba(129,140,248,0.5)", bg: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)" };
  if (score >= 60) return { grade: "B", color: "#a78bfa", glow: "rgba(167,139,250,0.5)", bg: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)" };
  return { grade: "C", color: "#94a3b8", glow: "rgba(148,163,184,0.3)", bg: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)" };
};

/* ── Card style helper ───────────────────────────── */
const cardStyle = {
  background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
};

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

  const kolData = {
    name: "Ana Bailey",
    handle: "@KaylaHermiston",
    avatar: "A",
    avatarBg: "#3b82f6",
    rank: 64,
    score: 87,
    bio: "Full-time crypto trader. Sharing high-conviction calls only. NFA.",
    following: 84,
    followers: 11,
    followedBy: [
      { name: "Andrew Walter", avatar: "A", bg: "#6366f1" },
      { name: "Mike Chen", avatar: "M", bg: "#f59e0b" },
    ],
    traderTags: [
      { emoji: "💎", label: "Diamond Hands", desc: "Never panic sells" },
      { emoji: "🎯", label: "Sniper", desc: "High accuracy, selective trades" },
      { emoji: "🦍", label: "Ape", desc: "Bold entries, FOMO energy" },
    ],
  };

  const radarData = {
    accuracy: 82, winRate: 75, riskReward: 88, consistency: 70,
    timing: 85, transparency: 90, engagement: 65, trackRecord: 78,
  };

  const stats = {
    bestTrade: { token: "HYPE", pnl: 156.2, date: "Jan 12" },
    worstTrade: { token: "SOL", pnl: -23.5, date: "Jan 8" },
    streak: { current: 7 },
    cumulative: 342.8,
    signalVsNoise: { signals: 156, noise: 42 },
    tradersCopying: 367,
    pointsCollected: 12450,
  };

  const performanceData = [
    { label: "W1", value: 12 }, { label: "W2", value: -5 },
    { label: "W3", value: 28 }, { label: "W4", value: 15 },
    { label: "W5", value: -8 }, { label: "W6", value: 32 },
    { label: "W7", value: 22 }, { label: "W8", value: 18 },
  ];

  const signalHistory = [
    { id: 1, token: "BTC", type: "long", price: "$67,500", result: "win", pnl: "+12.5%", time: "2d ago", tp: "$72,000", sl: "$65,000" },
    { id: 2, token: "ETH", type: "short", price: "$2,450", result: "win", pnl: "+8.2%", time: "3d ago", tp: "$2,250", sl: "$2,550" },
    { id: 3, token: "SOL", type: "long", price: "$98", result: "loss", pnl: "-4.5%", time: "5d ago", tp: "$115", sl: "$94" },
    { id: 4, token: "HYPE", type: "long", price: "$1.12", result: "win", pnl: "+45.2%", time: "1w ago", tp: "$1.80", sl: "$0.95" },
  ];

  const handleToggleFollowing = (id: string) => {
    setFollowingList((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isFollowing: !u.isFollowing } : u))
    );
  };

  const kolGrade = getGrade(kolData.score);
  const snr = stats.signalVsNoise;
  const signalPct = Math.round((snr.signals / (snr.signals + snr.noise)) * 100);

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)" }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 left-1/3 w-[300px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)", filter: "blur(60px)" }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 mt-4 mb-3 flex items-center justify-between px-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:bg-white/10"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <Image src={profileIcon} alt="profile" width={16} height={16} />
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={() => setShowCopyingSheet(true)}
          >
            <Image src={copyCountIcon} alt="copy-count" width={16} height={16} />
            <span className="text-[13px] font-semibold text-teal-400">4</span>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{
              background: "linear-gradient(135deg, rgba(45,212,191,0.15) 0%, rgba(45,212,191,0.08) 100%)",
              border: "1px solid rgba(45,212,191,0.25)",
              boxShadow: "0 0 15px rgba(45,212,191,0.2)",
            }}
          >
            <Image src={copyRankIcon} alt="copy-rank" width={16} height={16} />
            <span className="text-[13px] font-semibold text-teal-400">#64</span>
          </div>
          <UserMenu />
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative z-10 px-4 mb-3">
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Search size={15} className="text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Search trader..."
            className="bg-transparent text-xs text-white placeholder-gray-500 outline-none w-full"
          />
        </div>
      </div>

      {/* ── Profile Card ──────────────────────────── */}
      <div className="relative z-10 px-4 pt-4 pb-2">
        <div
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(45,212,191,0.08) 0%, rgba(45,212,191,0.02) 100%)",
            border: "1px solid rgba(45,212,191,0.2)",
          }}
        >
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: "radial-gradient(ellipse at top left, rgba(45,212,191,0.15) 0%, transparent 60%)" }} />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold" style={{ backgroundColor: kolData.avatarBg, boxShadow: "0 0 20px rgba(59,130,246,0.3)" }}>
                  {kolData.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold text-white">{kolData.name}</h1>
                    <div className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#000" }}>
                      #{kolData.rank}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" className="text-gray-400">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span className="text-[11px] text-teal-400">{kolData.handle}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] cursor-pointer hover:underline" onClick={() => setShowFollowingSheet(true)}>
                      <span className="text-teal-400 font-semibold">{kolData.following}</span>
                      <span className="text-gray-500"> Following</span>
                    </span>
                    <span className="text-[10px]">
                      <span className="text-teal-400 font-semibold">{kolData.followers}</span>
                      <span className="text-gray-500"> Followers</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Grade Badge */}
              <div className="flex flex-col items-center">
                <div className="relative" style={{ width: 52, height: 52 }}>
                  <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(from 0deg, ${kolGrade.color}, ${kolGrade.color}33, ${kolGrade.color}, ${kolGrade.color}33, ${kolGrade.color})`, filter: `blur(1px)`, opacity: 0.7 }} />
                  <div className="absolute rounded-full flex items-center justify-center" style={{ inset: 2, background: "linear-gradient(145deg, #141c24 0%, #0a0f14 100%)" }}>
                    <span className="text-xl font-black tracking-tight" style={{ color: kolGrade.color, textShadow: `0 0 12px ${kolGrade.glow}` }}>{kolGrade.grade}</span>
                  </div>
                </div>
                <span className="text-[8px] text-gray-500 mt-1 tracking-widest">GRADE</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex -space-x-2">
                {kolData.followedBy.map((u, i) => (
                  <div key={i} className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border-2 border-[#0a0f14]" style={{ backgroundColor: u.bg }}>{u.avatar}</div>
                ))}
              </div>
              <span className="text-[10px] text-gray-400">
                Followed by <span className="text-white">{kolData.followedBy[0].name}</span> and{" "}
                <span className="text-teal-400">{kolData.followedBy.length - 1} others</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {kolData.traderTags.map((tag, i) => (
                <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer transition-all hover:scale-105" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} title={tag.desc}>
                  <span className="text-sm">{tag.emoji}</span>
                  <span className="text-[10px] font-medium text-gray-300">{tag.label}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 mb-3">{kolData.bio}</p>

            <div className="flex gap-2">
              <button onClick={() => setIsFollowing(!isFollowing)} className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer" style={isFollowing ? { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" } : { background: "rgba(45,212,191,0.15)", color: "rgba(45,212,191,1)", border: "1px solid rgba(45,212,191,0.3)" }}>
                {isFollowing ? "Following" : "Follow"}
              </button>
              <button onClick={() => setIsCopying(!isCopying)} className="flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer" style={isCopying ? { background: "rgba(251,146,60,0.2)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.3)" } : { background: "rgba(45,212,191,1)", color: "#0a0f14", boxShadow: "0 0 20px rgba(45,212,191,0.4)" }}>
                {isCopying ? "Copying" : "Copy Trade"}
              </button>
              <button className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 cursor-pointer" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Share2 size={16} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────── */}
      <div className="relative z-10 px-4 mb-2">
        <div className="flex p-1 rounded-xl relative" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="absolute top-1 bottom-1 rounded-lg transition-all duration-300" style={{ width: "calc(50% - 4px)", left: activeTab === "overview" ? "4px" : "calc(50%)", background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.3)" }} />
          {[{ key: "overview", label: "Analysis" }, { key: "signals", label: "Signals" }].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-300 relative z-10 cursor-pointer" style={{ color: activeTab === tab.key ? "rgba(45,212,191,1)" : "rgba(255,255,255,0.4)" }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ───────────────────────────────── */}
      <div className="relative z-10 px-4 pb-24">
        {activeTab === "overview" && (
          <div className="space-y-2">
            <div className="rounded-xl p-2" style={cardStyle}>
              <div className="flex items-center justify-between mb-0">
                <span className="text-[11px] font-semibold text-white">Performance Radar</span>
                <span className="text-[9px] text-gray-500">8 dimensions</span>
              </div>
              <RadarChart data={radarData} size={170} />
            </div>

            <div className="rounded-xl p-3" style={cardStyle}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-white">Weekly Returns</span>
                <span className="text-[11px] text-teal-400 font-semibold">+{stats.cumulative}%</span>
              </div>
              <PerformanceChart data={performanceData} />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="rounded-xl px-2.5 py-1.5" style={cardStyle}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-4 h-4 rounded flex items-center justify-center bg-teal-400/10"><Trophy size={10} className="text-teal-400" /></div>
                  <span className="text-[9px] text-gray-500">Best Signal</span>
                </div>
                <p className="text-[13px] font-bold text-teal-400 leading-tight">+{stats.bestTrade.pnl}%</p>
                <p className="text-[8px] text-gray-500">{stats.bestTrade.token} · {stats.bestTrade.date}</p>
              </div>
              <div className="rounded-xl px-2.5 py-1.5" style={cardStyle}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-4 h-4 rounded flex items-center justify-center bg-rose-400/10"><AlertCircle size={10} className="text-rose-400" /></div>
                  <span className="text-[9px] text-gray-500">Worst Signal</span>
                </div>
                <p className="text-[13px] font-bold text-rose-400 leading-tight">{stats.worstTrade.pnl}%</p>
                <p className="text-[8px] text-gray-500">{stats.worstTrade.token} · {stats.worstTrade.date}</p>
              </div>
              <div className="rounded-xl px-2.5 py-1.5" style={cardStyle}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-4 h-4 rounded flex items-center justify-center bg-orange-400/10"><Flame size={10} className="text-orange-400" /></div>
                  <span className="text-[9px] text-gray-500">Current Streak</span>
                </div>
                <p className="text-[13px] font-bold text-white leading-tight">{stats.streak.current} wins 🔥</p>
              </div>
              <div className="rounded-xl px-2.5 py-1.5" style={cardStyle}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-4 h-4 rounded flex items-center justify-center bg-purple-400/10"><BarChart3 size={10} className="text-purple-400" /></div>
                  <span className="text-[9px] text-gray-500">% Cumulative</span>
                </div>
                <p className="text-[13px] font-bold text-white leading-tight">+{stats.cumulative}%</p>
                <p className="text-[8px] text-gray-500">All time</p>
              </div>
            </div>

            <div className="rounded-xl p-3" style={cardStyle}>
              <div className="flex items-center gap-3 mb-2.5">
                <span className="text-[9px] text-gray-400 shrink-0">Signal vs Noise</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${signalPct}%`, background: "linear-gradient(90deg, rgba(45,212,191,1) 0%, rgba(45,212,191,0.7) 100%)" }} />
                </div>
                <span className="text-[9px] text-teal-400 font-semibold shrink-0">{signalPct}%</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowCopyingSheet(true)}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-400/10"><Users size={13} className="text-blue-400" /></div>
                  <div>
                    <p className="text-[13px] font-bold text-white">{stats.tradersCopying}</p>
                    <p className="text-[8px] text-gray-500">Traders Copying</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-yellow-400/10"><Award size={13} className="text-yellow-400" /></div>
                  <div>
                    <p className="text-[13px] font-bold text-white">{stats.pointsCollected.toLocaleString()}</p>
                    <p className="text-[8px] text-gray-500">Points Collected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "signals" && (
          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Signal History</span>
                <span className="text-[10px] text-gray-500">
                  <span className="text-teal-400">{signalHistory.filter((s) => s.result === "win").length}W</span>{" / "}
                  <span className="text-rose-400">{signalHistory.filter((s) => s.result === "loss").length}L</span>
                </span>
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {signalHistory.map((signal) => (
                <div key={signal.id} className="px-4 py-3 hover:bg-white/5 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${signal.type === "long" ? "bg-teal-400/10" : "bg-rose-400/10"}`}>
                        {signal.type === "long" ? <ArrowUpRight size={14} className="text-teal-400" /> : <ArrowDownRight size={14} className="text-rose-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-white">{signal.token}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${signal.type === "long" ? "bg-teal-400/10 text-teal-400" : "bg-rose-400/10 text-rose-400"}`}>{signal.type}</span>
                        </div>
                        <span className="text-[10px] text-gray-500">Entry: {signal.price}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${signal.result === "win" ? "text-teal-400" : "text-rose-400"}`}>{signal.pnl}</p>
                      <span className="text-[10px] text-gray-500">{signal.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-10">
                    <div className="flex items-center gap-1">
                      <Target size={10} className="text-green-400" />
                      <span className="text-[10px] text-gray-400">TP: {signal.tp}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle size={10} className="text-rose-400" />
                      <span className="text-[10px] text-gray-400">SL: {signal.sl}</span>
                    </div>
                    {signal.result === "win" && <CheckCircle size={12} className="text-teal-400 ml-auto" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Sheets ─────────────────────────── */}
      <FollowingSheet
        isOpen={showFollowingSheet}
        onClose={() => setShowFollowingSheet(false)}
        title="Following"
        count={kolData.following}
        users={followingList}
        onToggleFollow={handleToggleFollowing}
      />

      <TradersCopyingSheet
        isOpen={showCopyingSheet}
        onClose={() => setShowCopyingSheet(false)}
        traders={copyingTraders}
        totalPnl={29.7}
      />
    </div>
  );
}