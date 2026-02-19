"use client";

import { useEffect, useState, useCallback, useContext, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import profileIcon from "@/assets/icons/profile.png";
import copyCountIcon from "@/assets/icons/copy-count.png";
import copyRankIcon from "@/assets/icons/copy-rank.png";
import { Button } from "@/components/ui/button";
import TimeRangeTab from "./components/TimeRangeTab";
import BalanceChart from "./components/balanceChart";
import type { TimeRange } from "./components/balanceChart";
import {
  connectWalletApi,
  getDashboardSummary,
  getOpenPositions,
  getProfileData,
  balanceHistory,
  type DashboardSummary,
  type PositionItem,
  type ProfileDataResponse,
} from "@/service";
import { HyperLiquidContext } from "@/providers/hyperliquid";
import BuilderApprovalBanner from "./components/BuilderApprovalBanner";
import { Copy, Users, ArrowUpDown, CheckCircle2, Settings, Download, Upload, Loader2, Clock, ExternalLink } from "lucide-react";
import UserMenu from "@/components/UserMenu";
import PositionDetail, { PositionDetailData, positionExtendedData } from "./components/PositionDetail";
import CopyingSheet from "./components/CopyingSheet";
import ActiveTradesSheet from "./components/ActiveTradesSheet";
import DepositSheet from "./components/DepositSheet";
import WithdrawSheet from "./components/WithdrawSheet";

export interface BalanceChartData {
  label: string;
  value: number;
}

interface PendingDeposit {
  amount: string;
  txHash: string;
  timestamp: number;
}

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
        style={{ background: "rgba(15,20,25,0.95)", border: "1px solid rgba(45,212,191,0.3)", color: "rgba(255,255,255,0.9)", boxShadow: "0 4px 12px rgba(0,0,0,0.4)", opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(-4px)" }}
      >
        {tooltip}
      </div>
    </div>
  );
};

// Format timestamp label based on time range
const formatLabel = (ts: number, tr: TimeRange): string => {
  const d = new Date(ts > 1e12 ? ts : ts * 1000);
  switch (tr) {
    case "D": return d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
    case "W": return d.toLocaleDateString("en-US", { weekday: "short" });
    case "M": return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    case "Y": return d.toLocaleDateString("en-US", { month: "short" });
    case "ALL": return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    default: return "";
  }
};

const Home = () => {
  const router = useRouter();
  const { authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets?.[0];

  const { builderFeeApproved } = useContext(HyperLiquidContext);

  const [authReady, setAuthReady] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [profile, setProfile] = useState<ProfileDataResponse | null>(null);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [builderDismissed, setBuilderDismissed] = useState(false);

  const [timeRange, setTimeRange] = useState<TimeRange>("M");
  const [chartData, setChartData] = useState<BalanceChartData[]>([]);
  const [balance, setBalance] = useState(0);
  const [todayGain, setTodayGain] = useState(0);
  const [activeTab, setActiveTab] = useState<"followed" | "position">("followed");
  const [selectedPos, setSelectedPos] = useState<PositionDetailData | null>(null);
  const [showCopying, setShowCopying] = useState(false);
  const [showCopiers, setShowCopiers] = useState(false);
  const [showActiveTrades, setShowActiveTrades] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  // ── Pending deposit state ──
  const [pendingDeposit, setPendingDeposit] = useState<PendingDeposit | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // ── 1. Privy → Backend JWT sync ──
  useEffect(() => {
    if (!authenticated) {
      localStorage.removeItem("token");
      setAuthReady(false);
      setSummary(null);
      setProfile(null);
      setPositions([]);
      setBalance(0);
      setTodayGain(0);
      setChartData([]);
      return;
    }
    if (!wallet?.address) return;

    const existing = localStorage.getItem("token");
    if (existing) {
      setAuthReady(true);
      return;
    }

    connectWalletApi(wallet.address)
      .then((res) => {
        localStorage.setItem("token", res.access_token);
        setAuthReady(true);
      })
      .catch((err) => console.error("Auth sync failed:", err));
  }, [authenticated, wallet?.address]);

  // ── 2. Fetch dashboard data ──
  const fetchDashboard = useCallback(async () => {
    if (!authReady) return;
    setLoading(true);
    try {
      const [s, p, prof] = await Promise.allSettled([
        getDashboardSummary(),
        getOpenPositions(),
        getProfileData(),
      ]);
      if (s.status === "fulfilled") {
        setSummary(s.value);
        if (pendingDeposit && s.value.total_balance > (summary?.total_balance ?? 0)) {
          setPendingDeposit(null);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }
      if (p.status === "fulfilled") setPositions(p.value);
      if (prof.status === "fulfilled") setProfile(prof.value);
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [authReady, pendingDeposit, summary?.total_balance]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // ── Clean up polling on unmount ──
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // ── Auto-expire pending deposit after 3 minutes ──
  useEffect(() => {
    if (!pendingDeposit) return;
    const timeout = setTimeout(() => {
      setPendingDeposit(null);
      if (pollRef.current) clearInterval(pollRef.current);
    }, 180000);
    return () => clearTimeout(timeout);
  }, [pendingDeposit]);

  // ── Handle deposit success ──
  const handleDepositSuccess = useCallback((txHash?: string, amount?: string) => {
    setPendingDeposit({
      amount: amount || "0",
      txHash: txHash || "",
      timestamp: Date.now(),
    });

    if (pollRef.current) clearInterval(pollRef.current);
    let count = 0;
    pollRef.current = setInterval(() => {
      fetchDashboard();
      count++;
      if (count >= 12) {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 10000);
  }, [fetchDashboard]);

  // ── 3. Animate balance when summary loads ──
  useEffect(() => {
    if (!summary) { setTodayGain(0); return; }
    const bTarget = summary.total_balance;
    const gTarget = summary.total_pnl;
    if (bTarget === 0 && gTarget === 0) { setBalance(0); setTodayGain(0); return; }
    if (balance > 0) {
      setBalance(bTarget);
      setTodayGain(gTarget);
      return;
    }
    const dur = 1500, steps = 60;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const e = 1 - Math.pow(1 - step / steps, 3);
      setBalance(bTarget * e);
      setTodayGain(gTarget * e);
      if (step >= steps) clearInterval(timer);
    }, dur / steps);
    return () => clearInterval(timer);
  }, [summary]);

  // ── 4. Chart data ──
  const getChartData = async (tr: TimeRange = "M") => {
    if (!authReady) { setChartData([]); return; }
    try {
      const data = await balanceHistory(tr === "Y" ? "YTD" : tr);
      setChartData(data.map((item) => ({
        label: formatLabel(item.timestamp, tr),
        value: item.acconutValue,
      })));
    } catch {
      setChartData([]);
    }
  };

  useEffect(() => { getChartData(timeRange); }, [timeRange, authReady]);

  // ── Derived values ──
  const pnlPct = summary?.total_pnl_pct ?? 0;
  const openCount = summary?.open_positions ?? 0;
  const totalTrades = summary?.total_trades ?? 0;
  const copyingCount = profile?.followingCount ?? 0;

  const currentPositions = positions.map((p, idx) => ({
    id: idx + 1,
    token: p.ticker,
    pair: `${p.ticker}/USDT`,
    iconUrl: `https://assets.coingecko.com/coins/images/1/small/${p.ticker.toLowerCase()}.png`,
    size: p.size_qty,
    sizeUsd: p.size_usd,
    pnl: p.pnl_usd ?? 0,
    pnlPercent: p.pnl_pct ?? 0,
    entry: p.entry_price,
  }));

  const followedTraders: { id: number; name: string; avatar: string; avatarBg: string; portfolioPercent: number; profit: number; ta: number }[] = [];

  const handleLogout = async () => {
    localStorage.removeItem("token");
    await logout();
    router.push("/");
  };

  const handleSelectPosition = (pos: (typeof currentPositions)[0]) => {
    const ext = positionExtendedData[pos.token];
    if (ext) {
      setSelectedPos({ ...pos, color: ext.color, currentPrice: ext.currentPrice, txs: ext.txs });
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)" }}>
      <style jsx>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse-glow { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
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
          className="relative z-10 mx-3 mt-2 mb-1 rounded-lg px-3 py-2 flex items-center justify-between cursor-pointer transition-all duration-300 hover:scale-[1.01]"
          style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.1) 0%, rgba(45,212,191,0.03) 100%)", border: "1px solid rgba(45,212,191,0.2)" }}
          onClick={() => login()}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(45,212,191,0.15)" }}>
              <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-white">Connect to start trading</p>
              <p className="text-[9px] text-gray-500">Link your wallet to copy top traders</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-teal-400">Connect →</span>
        </div>
      )}

      {/* Builder Fee Approval Banner */}
      {authenticated && !builderFeeApproved && !builderDismissed && (
        <BuilderApprovalBanner
          onApproved={() => setBuilderDismissed(true)}
          onDismiss={() => setBuilderDismissed(true)}
        />
      )}

      {/* ── Pending Deposit Banner ── */}
      {pendingDeposit && (
        <div
          className="relative z-10 mx-3 mt-2 mb-1 rounded-lg px-3 py-2.5 flex items-center justify-between"
          style={{
            background: "linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.02) 100%)",
            border: "1px solid rgba(251,191,36,0.2)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(251,191,36,0.15)" }}>
              <Loader2 size={14} className="text-amber-400 animate-spin" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-amber-300">Deposit arriving...</p>
              <p className="text-[9px] text-gray-500">Usually takes 1–2 min to credit</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingDeposit.txHash && (
              <a
                href={`https://arbiscan.io/tx/${pendingDeposit.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] text-amber-400/70 hover:text-amber-400 flex items-center gap-0.5"
              >
                Tx <ExternalLink size={8} />
              </a>
            )}
            <button
              onClick={() => {
                setPendingDeposit(null);
                if (pollRef.current) clearInterval(pollRef.current);
              }}
              className="text-[9px] text-gray-500 hover:text-gray-300 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 mt-2 mb-1.5 flex items-center justify-between px-3">
        <div className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-all hover:bg-white/10" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} onClick={handleLogout}>
          <Image src={profileIcon} alt="profile" width={12} height={12} />
        </div>
        <div className="flex items-center gap-1.5">
          <IconWithTooltip tooltip="Active Trades">
            <div className="flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-all hover:bg-white/10" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Image src={copyCountIcon} alt="active-trades" width={11} height={11} />
              <span className="text-[10px] font-semibold text-teal-400">{openCount}</span>
            </div>
          </IconWithTooltip>
          <UserMenu />
        </div>
      </div>

      {/* Main Balance Card */}
      <div className="relative z-10 px-3">
        <div className="rounded-xl p-4 mb-3 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(45,212,191,0.01) 100%)", border: "1px solid rgba(45,212,191,0.2)", boxShadow: "0 0 30px rgba(45,212,191,0.1), inset 0 0 40px rgba(45,212,191,0.03)" }}>
          <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: "radial-gradient(ellipse at top left, rgba(45,212,191,0.15) 0%, transparent 60%)" }} />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-0.5">
              <div>
                <p className="text-[11px] text-gray-400 mb-0.5">Current Balance</p>
                <p className="text-xl font-bold text-white tracking-tight tabular-nums" style={{ textShadow: "0 0 20px rgba(45,212,191,0.3)" }}>
                  {authenticated
                    ? `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "—"}
                </p>
              </div>
              <div className="flex gap-0.5">
                {(["D", "W", "M", "Y", "ALL"] as TimeRange[]).map((t) => (
                  <TimeRangeTab key={t} label={t} isActive={timeRange === t} onClick={() => setTimeRange(t)} />
                ))}
              </div>
            </div>

            {/* Chart area — using recharts BalanceChart */}
            <div className="relative h-24 mb-1.5 mt-3">
              <BalanceChart timeRange={timeRange} chartData={chartData} />
            </div>

            <div className="h-px bg-white/10 mb-3 rounded-full" />

            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">Total P&L</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tabular-nums text-white">
                    {authenticated
                      ? `${todayGain >= 0 ? "+" : "-"}$${Math.abs(todayGain).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
                  </span>
                  {authenticated && summary && (
                    <span className={`text-[10px] font-semibold ${pnlPct >= 0 ? "text-teal-400" : "text-rose-400"}`} style={{ textShadow: pnlPct >= 0 ? "0 0 10px rgba(45,212,191,0.5)" : "none" }}>
                      {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {authenticated && balance > 0 && (
                  <Button
                    onClick={() => setShowWithdraw(true)}
                    className="bg-transparent hover:bg-white/10 text-purple-400 text-[11px] font-bold rounded-lg px-3 py-2.5 h-auto transition-all cursor-pointer gap-1"
                    style={{ border: "1px solid rgba(168,85,247,0.3)" }}
                  >
                    <Upload size={12} />
                    Withdraw
                  </Button>
                )}
                <Button
                  onClick={() => authenticated ? setShowDeposit(true) : login()}
                  className="bg-teal-400 hover:bg-teal-300 text-[#0a0f14] text-[11px] font-bold rounded-lg px-4 py-2.5 h-auto transition-all cursor-pointer gap-1"
                  style={{ boxShadow: "0 0 25px rgba(45,212,191,0.4)" }}
                >
                  <Download size={12} />
                  {authenticated ? "Deposit" : "Connect"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="relative z-10 flex px-3 mt-2.5 gap-2">
        <div className="flex flex-1 gap-2">
          {[
            { icon: Copy, label: "Copying", value: String(copyingCount), color: "teal", action: () => setShowCopying(true) },
            { icon: Users, label: "Copiers", value: "0", color: "purple", action: () => setShowCopiers(true) },
          ].map((stat, i) => (
            <div key={i} onClick={() => stat.action()} className="flex-1 rounded-xl p-3 cursor-pointer transition-all duration-300 hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 ${stat.color === "teal" ? "bg-teal-400/10" : "bg-purple-400/10"}`}>
                  <stat.icon size={16} className={stat.color === "teal" ? "text-teal-400" : "text-purple-400"} />
                </div>
                <span className="text-[9px] text-gray-400 mb-1">{stat.label}</span>
                <span className="text-sm font-bold text-white">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div onClick={() => setShowActiveTrades(true)} className="flex-1 rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-300 hover:scale-[1.02] flex items-center justify-between" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-orange-400/10"><ArrowUpDown size={14} className="text-orange-400" /></div>
              <span className="text-[9px] text-gray-400">Active Trades</span>
            </div>
            <span className="text-sm font-bold text-white">{openCount}</span>
          </div>
          <div onClick={() => router.push("/tradeHistory")} className="flex-1 rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-300 hover:scale-[1.02] flex items-center justify-between" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-teal-400/10"><CheckCircle2 size={14} className="text-teal-400" /></div>
              <span className="text-[9px] text-gray-400">Trades Ended</span>
            </div>
            <span className="text-sm font-bold text-white">{totalTrades}</span>
          </div>
        </div>
      </div>

      {/* Followed / Current Position Section */}
      <div className="relative z-10 px-3 mt-3 mb-24">
        <div className="rounded-xl overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="relative flex border-b border-white/10">
            <div className="absolute bottom-0 h-0.5 bg-teal-400 transition-all duration-300 ease-out" style={{ width: "50%", left: activeTab === "followed" ? "0%" : "50%", boxShadow: "0 0 10px rgba(45,212,191,0.5)" }} />
            {[{ key: "followed", label: "Followed" }, { key: "position", label: "Positions" }].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as "followed" | "position")} className="flex-1 py-2 text-[10px] font-semibold transition-all duration-300 cursor-pointer" style={{ color: activeTab === tab.key ? "rgba(45,212,191,1)" : "rgba(255,255,255,0.4)" }}>{tab.label}</button>
            ))}
          </div>
          <div className="relative overflow-hidden">
            {/* Followed Tab */}
            <div className="transition-all duration-300 ease-out" style={{ opacity: activeTab === "followed" ? 1 : 0, transform: activeTab === "followed" ? "translateX(0)" : "translateX(-20px)", position: activeTab === "followed" ? "relative" : "absolute", pointerEvents: activeTab === "followed" ? "auto" : "none", width: "100%" }}>
              {followedTraders.length > 0 ? (
                <>
                  <div className="grid grid-cols-[1fr_60px_70px_32px_24px] gap-1.5 px-3 py-2 border-b border-white/10">
                    <span className="text-[8px] text-gray-500 uppercase tracking-wide">Trader</span>
                    <span className="text-[8px] text-gray-500 text-right uppercase tracking-wide">Gain</span>
                    <span className="text-[8px] text-gray-500 text-right uppercase tracking-wide">Profit</span>
                    <span className="text-[8px] text-gray-500 text-right uppercase tracking-wide">TA</span>
                    <span></span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {followedTraders.map((trader, index) => (
                      <div key={trader.id} className="grid grid-cols-[1fr_60px_70px_32px_24px] gap-1.5 px-3 py-2.5 items-center hover:bg-white/5 transition-all duration-200 row-animate cursor-pointer active:bg-white/10" style={{ animationDelay: `${index * 0.05}s` }} onClick={() => router.push(`/profile?handle=${trader.name.replace("@", "")}`)}>
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: trader.avatarBg }}>{trader.avatar}</div>
                          <span className="text-[10px] text-gray-300 hover:text-teal-400 transition-colors">{trader.name}</span>
                        </div>
                        <span className="text-[10px] text-teal-400 text-right font-medium">+{trader.portfolioPercent}%</span>
                        <span className="text-[10px] text-white text-right font-medium">${trader.profit.toLocaleString("en-US", { minimumFractionDigits: 1 })}</span>
                        <span className="text-[10px] text-gray-400 text-right">{trader.ta}</span>
                        <button onClick={(e) => { e.stopPropagation(); router.push("/settings?tab=trader"); }} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-teal-400 hover:bg-white/10 rounded-md transition-all cursor-pointer"><Settings size={11} /></button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4">
                  <Copy size={24} className="text-gray-600 mb-2" />
                  <p className="text-[11px] text-gray-500 text-center">
                    {authenticated ? "You're not following any traders yet" : "Connect wallet to see followed traders"}
                  </p>
                  {authenticated && (
                    <button onClick={() => router.push("/copyTrading")} className="mt-3 text-[10px] font-semibold text-teal-400 px-4 py-1.5 rounded-lg cursor-pointer" style={{ background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)" }}>
                      Browse Traders
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Positions Tab */}
            <div className="transition-all duration-300 ease-out" style={{ opacity: activeTab === "position" ? 1 : 0, transform: activeTab === "position" ? "translateX(0)" : "translateX(20px)", position: activeTab === "position" ? "relative" : "absolute", pointerEvents: activeTab === "position" ? "auto" : "none", width: "100%", top: 0 }}>
              {currentPositions.length > 0 ? (
                <>
                  <div className="grid grid-cols-[1fr_70px_80px_60px_16px] gap-1.5 px-3 py-2 border-b border-white/10">
                    <span className="text-[8px] text-gray-500 uppercase tracking-wide">Token</span>
                    <span className="text-[8px] text-gray-500 text-right uppercase tracking-wide">Size</span>
                    <span className="text-[8px] text-gray-500 text-right uppercase tracking-wide">PnL</span>
                    <span className="text-[8px] text-gray-500 text-right uppercase tracking-wide">Entry</span>
                    <span></span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {currentPositions.map((pos, index) => (
                      <div key={pos.id} onClick={() => handleSelectPosition(pos)} className="grid grid-cols-[1fr_70px_80px_60px_16px] gap-1.5 px-3 py-2.5 items-center hover:bg-white/5 transition-all duration-200 cursor-pointer active:bg-white/10 row-animate" style={{ animationDelay: `${index * 0.05}s` }}>
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                            <img src={pos.iconUrl} alt={pos.token} className="w-5 h-5 object-cover" onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement!.innerHTML = `<span class="text-[9px] font-bold text-white">${pos.token[0]}</span>`; }} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-white font-medium">{pos.token}</span>
                            <span className="text-[8px] text-gray-500">{pos.pair}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-white font-medium">${pos.sizeUsd.toLocaleString()}</div>
                          <div className="text-[8px] text-gray-500">{pos.size} {pos.token}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-[10px] font-medium ${pos.pnl >= 0 ? "text-teal-400" : "text-rose-400"}`}>{pos.pnl >= 0 ? "+" : ""}${Math.abs(pos.pnl).toLocaleString()}</div>
                          <div className={`text-[8px] ${pos.pnl >= 0 ? "text-teal-400/70" : "text-rose-400/70"}`}>{pos.pnlPercent >= 0 ? "+" : ""}{pos.pnlPercent}%</div>
                        </div>
                        <span className="text-[10px] text-gray-400 text-right">${pos.entry.toLocaleString()}</span>
                        <svg className="w-3 h-3 text-gray-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4">
                  <ArrowUpDown size={24} className="text-gray-600 mb-2" />
                  <p className="text-[11px] text-gray-500 text-center">
                    {authenticated ? "No open positions" : "Connect wallet to see positions"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sheets & Modals */}
      {showCopying && <CopyingSheet mode="copying" onClose={() => setShowCopying(false)} />}
      {showCopiers && <CopyingSheet mode="copiers" onClose={() => setShowCopiers(false)} />}
      {showActiveTrades && (
        <ActiveTradesSheet
          positions={currentPositions}
          onClose={() => setShowActiveTrades(false)}
          onSelectPosition={(pos) => handleSelectPosition(pos)}
        />
      )}
      {selectedPos && <PositionDetail pos={selectedPos} onClose={() => setSelectedPos(null)} />}
      <DepositSheet
        isOpen={showDeposit}
        onClose={() => setShowDeposit(false)}
        onSuccess={handleDepositSuccess}
      />
      <WithdrawSheet
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        availableBalance={balance}
        onSuccess={() => fetchDashboard()}
      />
    </div>
  );
};

export default Home;