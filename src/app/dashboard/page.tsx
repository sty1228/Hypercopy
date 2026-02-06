"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import profileIcon from "@/assets/icons/profile.png";
import copyCountIcon from "@/assets/icons/copy-count.png";
import copyRankIcon from "@/assets/icons/copy-rank.png";
import { Button } from "@/components/ui/button";
import TimeRangeTab from "./components/TimeRangeTab";
import type { TimeRange } from "./components/balanceChart";
import { balanceHistory } from "@/service";
import { Copy, Users, ArrowUpDown, CheckCircle2, Settings } from "lucide-react";
import UserMenu from "@/components/UserMenu";

export interface BalanceChartData {
  label: string;
  value: number;
}

const Home = () => {
  const router = useRouter();
  const { authenticated, login, logout } = usePrivy();
  const [timeRange, setTimeRange] = useState<TimeRange>("M");
  const [chartData, setChartData] = useState<BalanceChartData[]>([]);
  const [chartAnimated, setChartAnimated] = useState(false);
  const [balance, setBalance] = useState(0);
  const [todayGain, setTodayGain] = useState(0);
  const [activeTab, setActiveTab] = useState<"followed" | "position">("followed");

  const followedTraders = [
    { id: 1, name: "@geddard", avatar: "G", avatarBg: "#22c55e", portfolioPercent: 10.6, profit: 4369.2, ta: 24 },
    { id: 2, name: "@daytrader", avatar: "H", avatarBg: "#a855f7", portfolioPercent: 8.3, profit: 2364.6, ta: 12 },
    { id: 3, name: "@cryptoking", avatar: "C", avatarBg: "#3b82f6", portfolioPercent: 5.2, profit: 1520.8, ta: 8 },
    { id: 4, name: "@whalewatch", avatar: "W", avatarBg: "#f59e0b", portfolioPercent: 3.1, profit: 890.4, ta: 5 },
  ];

  const currentPositions = [
    { id: 1, token: "BTC", pair: "BTC/USDT", iconUrl: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png", size: 0.52, sizeUsd: 24680, pnl: 1234.5, pnlPercent: 5.26, entry: 47500 },
    { id: 2, token: "ETH", pair: "ETH/USDT", iconUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png", size: 8.4, sizeUsd: 15820, pnl: -420.3, pnlPercent: -2.58, entry: 1935 },
    { id: 3, token: "SOL", pair: "SOL/USDT", iconUrl: "https://assets.coingecko.com/coins/images/4128/small/solana.png", size: 125, sizeUsd: 8750, pnl: 562.8, pnlPercent: 6.88, entry: 65.5 },
    { id: 4, token: "HYPE", pair: "HYPE/USDT", iconUrl: "https://assets.coingecko.com/coins/images/40356/standard/hype.png", size: 3200, sizeUsd: 3840, pnl: 192.0, pnlPercent: 5.26, entry: 1.14 },
  ];

  useEffect(() => {
    const duration = 1500, steps = 60, balanceTarget = 16534.22, gainTarget = 2896.1;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - step / steps, 3);
      setBalance(balanceTarget * eased);
      setTodayGain(gainTarget * eased);
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    setTimeout(() => setChartAnimated(true), 300);
    return () => clearInterval(timer);
  }, []);

  const getChartData = async (timeRange: TimeRange = "M") => {
    const data = await balanceHistory(timeRange);
    setChartData(data.map((item) => ({ label: "", value: item.acconutValue, timestamp: item.timestamp })));
    setChartAnimated(false);
    setTimeout(() => setChartAnimated(true), 100);
  };

  useEffect(() => { getChartData(timeRange); }, [timeRange]);

  const getSampledData = () => {
    if (chartData.length <= 14) return chartData;
    const step = Math.ceil(chartData.length / 14);
    return chartData.filter((_, i) => i % step === 0).slice(0, 14);
  };

  const sampledData = getSampledData();

  const getChartYValues = () => {
    if (sampledData.length === 0) return [];
    const values = sampledData.map((d) => d.value);
    const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
    return values.map((v) => 15 + (1 - (v - min) / range) * 50);
  };

  const yValues = getChartYValues();

  const getTimelineLabels = () => {
    switch (timeRange) {
      case "D": return ["12am", "4am", "8am", "12pm", "4pm", "8pm", "12am"];
      case "W": return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      case "M": return ["Day 1", "Day 7", "Day 14", "Day 21", "Day 28"];
      case "YTD": return ["Jan", "Mar", "May", "Jul", "Sep", "Nov"];
      case "ALL": return ["2022", "2023", "2024", "2025"];
      default: return [];
    }
  };

  const timelineLabels = getTimelineLabels();

  const getPointPositions = () => {
    if (yValues.length <= 1) return yValues.map((y) => ({ x: 0, y }));
    return yValues.map((y, i) => ({ x: (i / (yValues.length - 1)) * 100, y }));
  };

  const pointPositions = getPointPositions();

  const getPathD = () => {
    if (pointPositions.length === 0) return "";
    return pointPositions.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  };

  const getAreaD = () => {
    if (pointPositions.length === 0) return "";
    return getPathD() + " L 100 80 L 0 80 Z";
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)" }}>
      <style jsx>{`
        @keyframes drawLine { from { stroke-dashoffset: 1000; } to { stroke-dashoffset: 0; } }
        @keyframes fadeInArea { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dotAppear { from { transform: translate(-50%, -50%) scale(0); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        .chart-line { stroke-dasharray: 1000; stroke-dashoffset: 1000; }
        .chart-line.animated { animation: drawLine 2.5s ease-out forwards; }
        .chart-area { opacity: 0; }
        .chart-area.animated { animation: fadeInArea 0.8s ease-out 0.8s forwards; }
        .chart-dot { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        .chart-dot.animated { animation: dotAppear 0.3s ease-out forwards; }
        .row-animate { animation: slideIn 0.3s ease-out forwards; }
      `}</style>

      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/3 w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/3 -right-20 w-[200px] h-[200px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 60%)", filter: "blur(40px)" }} />
      </div>

      {/* Login Banner */}
      {!authenticated && (
        <div
          className="relative z-10 mx-4 mt-3 mb-1 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-all duration-300 hover:scale-[1.01]"
          style={{
            background: "linear-gradient(135deg, rgba(45,212,191,0.1) 0%, rgba(45,212,191,0.03) 100%)",
            border: "1px solid rgba(45,212,191,0.2)",
          }}
          onClick={() => login()}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(45,212,191,0.15)" }}>
              <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Connect to start trading</p>
              <p className="text-[10px] text-gray-500">Link your wallet to copy top traders</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-teal-400">Connect →</span>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 mt-3 mb-2 flex items-center justify-between px-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:bg-white/10"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          onClick={handleLogout}
        >
          <Image src={profileIcon} alt="profile" width={14} height={14} />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
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

      {/* Main Balance Card */}
      <div className="relative z-10 px-4">
        <div className="rounded-2xl p-5 mb-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(45,212,191,0.01) 100%)", border: "1px solid rgba(45,212,191,0.2)", boxShadow: "0 0 30px rgba(45,212,191,0.1), inset 0 0 40px rgba(45,212,191,0.03)" }}>
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: "radial-gradient(ellipse at top left, rgba(45,212,191,0.15) 0%, transparent 60%)" }} />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-1">
              <div>
                <p className="text-[13px] text-gray-400 mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-white tracking-tight tabular-nums" style={{ textShadow: "0 0 20px rgba(45,212,191,0.3)" }}>
                  ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex gap-1">
                {["D", "W", "M", "YTD", "ALL"].map((t) => (
                  <TimeRangeTab key={t} label={t as TimeRange} isActive={timeRange === t} onClick={() => setTimeRange(t as TimeRange)} />
                ))}
              </div>
            </div>
            <div className="flex justify-between mb-5">
              <span className="text-[10px] text-gray-500">$8,876.32 Available</span>
              <span className="text-[10px] text-teal-400">$7,657.9 Used</span>
            </div>
            <div className="relative h-20 mb-2">
              {pointPositions.length > 0 && (
                <>
                  <svg width="100%" height="100%" viewBox="0 0 100 80" preserveAspectRatio="none" className="absolute inset-0" style={{ overflow: "visible" }}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="40" x2="100" y2="40" stroke="#f43f5e" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="4 3" opacity="0.5" />
                    {pointPositions.length > 1 && (
                      <>
                        <path d={getAreaD()} fill="url(#areaGradient)" className={`chart-area ${chartAnimated ? "animated" : ""}`} />
                        <path d={getPathD()} fill="none" stroke="#2dd4bf" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className={`chart-line ${chartAnimated ? "animated" : ""}`} />
                      </>
                    )}
                  </svg>
                  {pointPositions.map((p, i) => (
                    <div
                      key={i}
                      className={`absolute rounded-full bg-teal-400 chart-dot ${chartAnimated ? "animated" : ""}`}
                      style={{ width: 6, height: 6, left: `${p.x}%`, top: `${(p.y / 80) * 100}%`, boxShadow: "0 0 8px rgba(45,212,191,0.8)", animationDelay: `${0.3 + (i / pointPositions.length) * 1.2}s` }}
                    />
                  ))}
                </>
              )}
            </div>
            <div className="flex justify-between mb-4">
              {timelineLabels.map((label, i) => (
                <span key={i} className="text-[8px] text-gray-500 font-medium" style={{ opacity: chartAnimated ? 1 : 0, transition: `opacity 0.3s ease ${0.5 + i * 0.05}s` }}>{label}</span>
              ))}
            </div>
            <div className="h-px bg-white/10 mb-4 rounded-full" />
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[11px] text-gray-400 mb-1">Today&apos;s Gain/Loss</p>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tabular-nums text-white">${todayGain.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="text-[11px] font-semibold text-teal-400" style={{ textShadow: "0 0 10px rgba(45,212,191,0.5)" }}>+4.12%</span>
                </div>
              </div>
              <Button className="bg-teal-400 hover:bg-teal-300 text-[#0a0f14] text-xs font-bold rounded-xl px-5 py-3 h-auto transition-all cursor-pointer" style={{ boxShadow: "0 0 25px rgba(45,212,191,0.4)" }}>
                Post a Signal
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="relative z-10 flex px-4 mt-4 gap-3">
        <div className="flex flex-1 gap-3">
          {[{ icon: Copy, label: "Copying", value: "243", color: "teal" }, { icon: Users, label: "Copied", value: "367", color: "purple" }].map((stat, i) => (
            <div key={i} className="flex-1 rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex flex-col items-center">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-3 ${stat.color === "teal" ? "bg-teal-400/10" : "bg-purple-400/10"}`}>
                  <stat.icon size={20} className={stat.color === "teal" ? "text-teal-400" : "text-purple-400"} />
                </div>
                <span className="text-[11px] text-gray-400 mb-2">{stat.label}</span>
                <span className="text-base font-bold text-white">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-3">
          {[{ icon: ArrowUpDown, label: "Active Trades", value: "34", color: "orange" }, { icon: CheckCircle2, label: "Trades Ended", value: "376", color: "teal" }].map((stat, i) => (
            <div key={i} className="flex-1 rounded-2xl px-4 py-3 cursor-pointer transition-all duration-300 hover:scale-[1.02] flex items-center justify-between" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${stat.color === "orange" ? "bg-orange-400/10" : "bg-teal-400/10"}`}>
                  <stat.icon size={18} className={stat.color === "orange" ? "text-orange-400" : "text-teal-400"} />
                </div>
                <span className="text-[11px] text-gray-400">{stat.label}</span>
              </div>
              <span className="text-base font-bold text-white">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Followed / Current Position Section */}
      <div className="relative z-10 px-4 mt-4 mb-24">
        <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="relative flex border-b border-white/10">
            <div className="absolute bottom-0 h-0.5 bg-teal-400 transition-all duration-300 ease-out" style={{ width: "50%", left: activeTab === "followed" ? "0%" : "50%", boxShadow: "0 0 10px rgba(45,212,191,0.5)" }} />
            {[{ key: "followed", label: "Followed" }, { key: "position", label: "Positions" }].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as "followed" | "position")} className="flex-1 py-3 text-xs font-semibold transition-all duration-300 cursor-pointer" style={{ color: activeTab === tab.key ? "rgba(45,212,191,1)" : "rgba(255,255,255,0.4)" }}>{tab.label}</button>
            ))}
          </div>
          <div className="relative overflow-hidden">
            <div className="transition-all duration-300 ease-out" style={{ opacity: activeTab === "followed" ? 1 : 0, transform: activeTab === "followed" ? "translateX(0)" : "translateX(-20px)", position: activeTab === "followed" ? "relative" : "absolute", pointerEvents: activeTab === "followed" ? "auto" : "none", width: "100%" }}>
              <div className="grid grid-cols-[1fr_70px_80px_40px_30px] gap-2 px-4 py-3 border-b border-white/10">
                <span className="text-[10px] text-gray-500 uppercase tracking-wide">Trader</span>
                <span className="text-[10px] text-gray-500 text-right uppercase tracking-wide">Gain</span>
                <span className="text-[10px] text-gray-500 text-right uppercase tracking-wide">Profit</span>
                <span className="text-[10px] text-gray-500 text-right uppercase tracking-wide">TA</span>
                <span></span>
              </div>
              <div className="divide-y divide-white/5">
                {followedTraders.map((trader, index) => (
                  <div key={trader.id} className="grid grid-cols-[1fr_70px_80px_40px_30px] gap-2 px-4 py-3 items-center hover:bg-white/5 transition-all duration-200 row-animate" style={{ animationDelay: `${index * 0.05}s` }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: trader.avatarBg }}>{trader.avatar}</div>
                      <span className="text-sm text-gray-300">{trader.name}</span>
                    </div>
                    <span className="text-sm text-teal-400 text-right font-medium">+{trader.portfolioPercent}%</span>
                    <span className="text-sm text-white text-right font-medium">${trader.profit.toLocaleString("en-US", { minimumFractionDigits: 1 })}</span>
                    <span className="text-sm text-gray-400 text-right">{trader.ta}</span>
                    <button className="flex items-center justify-center text-gray-500 hover:text-teal-400 transition-colors cursor-pointer"><Settings size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="transition-all duration-300 ease-out" style={{ opacity: activeTab === "position" ? 1 : 0, transform: activeTab === "position" ? "translateX(0)" : "translateX(20px)", position: activeTab === "position" ? "relative" : "absolute", pointerEvents: activeTab === "position" ? "auto" : "none", width: "100%", top: 0 }}>
              <div className="grid grid-cols-[1fr_80px_90px_70px] gap-2 px-4 py-3 border-b border-white/10">
                <span className="text-[10px] text-gray-500 uppercase tracking-wide">Token</span>
                <span className="text-[10px] text-gray-500 text-right uppercase tracking-wide">Size</span>
                <span className="text-[10px] text-gray-500 text-right uppercase tracking-wide">PnL</span>
                <span className="text-[10px] text-gray-500 text-right uppercase tracking-wide">Entry</span>
              </div>
              <div className="divide-y divide-white/5">
                {currentPositions.map((pos, index) => (
                  <div key={pos.id} className="grid grid-cols-[1fr_80px_90px_70px] gap-2 px-4 py-3 items-center hover:bg-white/5 transition-all duration-200 row-animate" style={{ animationDelay: `${index * 0.05}s` }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                        <img src={pos.iconUrl} alt={pos.token} className="w-8 h-8 object-cover" onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement!.innerHTML = `<span class="text-xs font-bold text-white">${pos.token[0]}</span>`; }} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-white font-medium">{pos.token}</span>
                        <span className="text-[10px] text-gray-500">{pos.pair}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white font-medium">${pos.sizeUsd.toLocaleString()}</div>
                      <div className="text-[10px] text-gray-500">{pos.size} {pos.token}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${pos.pnl >= 0 ? "text-teal-400" : "text-rose-400"}`}>{pos.pnl >= 0 ? "+" : ""}${Math.abs(pos.pnl).toLocaleString()}</div>
                      <div className={`text-[10px] ${pos.pnl >= 0 ? "text-teal-400/70" : "text-rose-400/70"}`}>{pos.pnlPercent >= 0 ? "+" : ""}{pos.pnlPercent}%</div>
                    </div>
                    <span className="text-sm text-gray-400 text-right">${pos.entry.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div onClick={() => router.push("/tradeHistory")} className="mt-3 flex items-center justify-center gap-1.5 py-2.5 cursor-pointer group">
          <span className="text-[11px] text-gray-500 group-hover:text-gray-300 transition-colors">View Trade History</span>
          <svg className="w-3 h-3 text-gray-500 group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Home;