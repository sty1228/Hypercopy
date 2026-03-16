"use client";

import { useEffect, useState, useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import TimeRangeTab from "./components/TimeRangeTab";
import BalanceChart from "./components/balanceChart";
import type { TimeRange } from "./components/balanceChart";
import {
  connectWalletApi,
  getDashboardSummary,
  getOpenPositions,
  getProfileData,
  getPnlHistory,
  getFollowedTraders,
  getWalletBalance,
  getTraderPnl,
  getDefaultSettings,
  closePosition as closePositionApi,
  type DashboardSummary,
  type PositionItem,
  type ProfileDataResponse,
  type FollowedTrader,
  type WalletBalance,
  type PnlHistoryResponse,
  type TraderPnlItem,
  type DefaultFollowSettings,
} from "@/service";
import { HyperLiquidContext } from "@/providers/hyperliquid";
import BuilderApprovalBanner from "./components/BuilderApprovalBanner";
import { Copy, Users, ArrowUpDown, CheckCircle2, Settings, Download, Upload, RefreshCw, TrendingUp, Eye, EyeOff, Clock } from "lucide-react";
import PositionDetail, { PositionDetailData, positionExtendedData } from "./components/PositionDetail";
import CopyingSheet from "./components/CopyingSheet";
import ActiveTradesSheet from "./components/ActiveTradesSheet";
import DepositSheet from "./components/DepositSheet";
import WithdrawSheet from "./components/WithdrawSheet";
import TransactionHistorySheet from "./components/TransactionHistorySheet";
import { KOLRewardsScreen } from "./components/KOLRewardsScreen";
import { useRewards } from "@/providers/RewardsContext";
import RewardsBanner from "@/components/RewardsBanner";
import { getToken, setToken, removeToken, onTokenRefreshed } from "@/lib/token";
import TopBar from "@/components/TopBar";

export interface BalanceChartData { label: string; value: number; }

const formatLabel = (ts: number, tr: TimeRange): string => {
  const d = new Date(ts > 1e12 ? ts : ts * 1000);
  switch (tr) {
    case "D": return d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
    case "W": return d.toLocaleDateString("en-US", { weekday: "short" });
    case "M": return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    case "ALL": return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    default: return "";
  }
};

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TIME_RANGE_LABELS: Record<string, string> = { D: "past day", W: "past week", M: "past month", ALL: "all-time" };
const AVATAR_COLORS = ["#2dd4bf", "#a78bfa", "#f97316", "#3b82f6", "#ec4899", "#eab308"];

const FALLBACK_COLORS: Record<string, string> = {
  BTC: "#f7931a", ETH: "#627eea", SOL: "#9945ff", HYPE: "#00d4aa",
  DOGE: "#c3a634", AVAX: "#e84142", MATIC: "#8247e5", ARB: "#28a0f0",
};
const getFallbackColor = (ticker: string) => FALLBACK_COLORS[ticker] || "#2dd4bf";

const Home = () => {
  const router = useRouter();
  const { authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets?.[0];
  const { builderFeeApproved } = useContext(HyperLiquidContext);
  const { showRewards, closeRewards, viewRewardsFromPrompt } = useRewards();

  const [authReady, setAuthReady] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [profile, setProfile] = useState<ProfileDataResponse | null>(null);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [followedTraders, setFollowedTraders] = useState<FollowedTrader[]>([]);
  const [traderPnlMap, setTraderPnlMap] = useState<Record<string, TraderPnlItem>>({});
  const [defaultSettings, setDefaultSettings] = useState<DefaultFollowSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [builderDismissed, setBuilderDismissed] = useState(false);

  const [walletBal, setWalletBal] = useState<WalletBalance | null>(null);
  const [balRefreshing, setBalRefreshing] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);

  const [timeRange, setTimeRange] = useState<TimeRange>("M");
  const [pnlChartData, setPnlChartData] = useState<BalanceChartData[]>([]);
  const [rangePnl, setRangePnl] = useState(0);
  const [rangePnlPct, setRangePnlPct] = useState(0);
  const [totalPnl, setTotalPnl] = useState(0);

  const [activeTab, setActiveTab] = useState<"followed" | "position">("followed");
  const [selectedPos, setSelectedPos] = useState<PositionDetailData | null>(null);
  const [showCopying, setShowCopying] = useState(false);
  const [showCopiers, setShowCopiers] = useState(false);
  const [showActiveTrades, setShowActiveTrades] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const totalBalance = walletBal ? walletBal.hl_equity + walletBal.arb_usdc : 0;
  const availableToTrade = walletBal?.hl_withdrawable ?? 0;
  const pendingBalance = walletBal?.arb_usdc ?? 0;
  const openCount = summary?.open_positions ?? 0;
  const totalTrades = summary?.total_trades ?? 0;
  const copyingCount = followedTraders.filter(t => t.is_copy_trading || t.is_counter_trading).length;
  const copiersCount = profile?.followerCount ?? 0;

  const copyTraders = useMemo(() => followedTraders.filter(t => t.is_copy_trading && !t.is_counter_trading), [followedTraders]);
  const counterTraders = useMemo(() => followedTraders.filter(t => t.is_counter_trading), [followedTraders]);
  const watchTraders = useMemo(() => followedTraders.filter(t => !t.is_copy_trading && !t.is_counter_trading), [followedTraders]);

  useEffect(() => {
    if (!authenticated) {
      removeToken(); setAuthReady(false); setSummary(null); setProfile(null);
      setPositions([]); setFollowedTraders([]); setTraderPnlMap({}); setDefaultSettings(null);
      setWalletBal(null); setPnlChartData([]); setRangePnl(0); setRangePnlPct(0); setTotalPnl(0);
      return;
    }
    if (!wallet?.address) return;
    const existing = getToken();
    if (existing) { setAuthReady(true); return; }
    const twitterUsername = (user?.twitter as any)?.username || null;
    connectWalletApi(wallet.address, twitterUsername)
      .then((res) => { setToken(res.access_token); setAuthReady(true); })
      .catch((err) => console.error("Auth sync failed:", err));
  }, [authenticated, wallet?.address, user]);

  const refreshWalletBalance = useCallback(async () => {
    if (!authReady) return;
    setBalRefreshing(true);
    try { setWalletBal(await getWalletBalance()); } catch (e) { console.error("Wallet balance fetch failed:", e); } finally { setBalRefreshing(false); }
  }, [authReady]);

  useEffect(() => {
    if (!authReady) return;
    refreshWalletBalance();
    const iv = setInterval(refreshWalletBalance, 10_000);
    return () => clearInterval(iv);
  }, [authReady, refreshWalletBalance]);

  const fetchDashboard = useCallback(async () => {
    if (!authReady) return;
    setLoading(true);
    try {
      const [s, p, prof, fol, pnlList, defs] = await Promise.allSettled([
        getDashboardSummary(), getOpenPositions(), getProfileData(),
        getFollowedTraders(), getTraderPnl(), getDefaultSettings(),
      ]);
      if (s.status === "fulfilled") setSummary(s.value);
      if (p.status === "fulfilled") setPositions(p.value);
      if (prof.status === "fulfilled") setProfile(prof.value);
      if (fol.status === "fulfilled") setFollowedTraders(fol.value);
      if (pnlList.status === "fulfilled") {
        const map: Record<string, TraderPnlItem> = {};
        for (const item of pnlList.value) map[item.trader_username] = item;
        setTraderPnlMap(map);
      }
      if (defs.status === "fulfilled") setDefaultSettings(defs.value);
    } catch (err) { console.error("Dashboard fetch failed:", err); } finally { setLoading(false); }
  }, [authReady]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const fetchPnlChart = useCallback(async (tr: TimeRange = "M") => {
    if (!authReady) { setPnlChartData([]); setRangePnl(0); setRangePnlPct(0); setTotalPnl(0); return; }
    try {
      const res: PnlHistoryResponse = await getPnlHistory(tr as "D" | "W" | "M" | "YTD" | "ALL");
      setPnlChartData(res.data.map((item) => ({ label: formatLabel(item.timestamp, tr), value: item.pnl })));
      setRangePnl(res.range_pnl); setRangePnlPct(res.range_pnl_pct); setTotalPnl(res.total_pnl);
    } catch { setPnlChartData([]); setRangePnl(0); setRangePnlPct(0); setTotalPnl(0); }
  }, [authReady]);

  useEffect(() => { fetchPnlChart(timeRange); }, [timeRange, fetchPnlChart]);

  // ★ FIX: Listen for token-refreshed event and re-fetch all data
  // This handles the case where initial API calls 401'd but token was
  // subsequently refreshed by AppLayout or axios interceptor.
  useEffect(() => {
    if (!authenticated) return;

    const handleRefreshed = () => {
      console.info("[dashboard] Token refreshed — re-fetching all data");
      // Mark authReady in case initial auth flow hadn't completed
      setAuthReady(true);
    };

    const unsub = onTokenRefreshed(handleRefreshed);
    return unsub;
  }, [authenticated]);

  // When authReady flips to true (including from token-refreshed event),
  // fetchDashboard + fetchPnlChart + refreshWalletBalance all auto-fire
  // because they depend on authReady via their useEffect hooks.

  const handleSheetClose = useCallback((setter: (v: boolean) => void) => {
    setter(false); refreshWalletBalance(); fetchDashboard(); fetchPnlChart(timeRange);
  }, [refreshWalletBalance, fetchDashboard, fetchPnlChart, timeRange]);

  const handleDepositSuccess = useCallback(() => {
    refreshWalletBalance();
    const fast = setInterval(refreshWalletBalance, 5_000);
    setTimeout(() => clearInterval(fast), 60_000);
    fetchDashboard(); fetchPnlChart(timeRange);
  }, [refreshWalletBalance, fetchDashboard, fetchPnlChart, timeRange]);

  const handleWithdrawSuccess = useCallback(() => {
    refreshWalletBalance(); fetchPnlChart(timeRange); setTimeout(fetchDashboard, 60_000);
  }, [refreshWalletBalance, fetchPnlChart, timeRange, fetchDashboard]);

  const handleClosePosition = useCallback(async (tradeId: string) => {
    await closePositionApi(tradeId);
    await Promise.allSettled([
      refreshWalletBalance(),
      fetchDashboard(),
      fetchPnlChart(timeRange),
    ]);
    setSelectedPos(null);
  }, [refreshWalletBalance, fetchDashboard, fetchPnlChart, timeRange]);

  const currentPositions = positions.map((p, idx) => ({
    id: idx + 1,
    tradeId: p.id,
    token: p.ticker,
    pair: `${p.ticker}/USDT`,
    iconUrl: `https://assets.coingecko.com/coins/images/1/small/${p.ticker.toLowerCase()}.png`,
    size: p.size_qty,
    sizeUsd: p.size_usd,
    pnl: p.pnl_usd ?? 0,
    pnlPercent: p.pnl_pct ?? 0,
    entry: p.entry_price,
  }));

  const handleLogout = async () => { removeToken(); await logout(); router.push("/"); };

  const handleSelectPosition = (pos: (typeof currentPositions)[0]) => {
    const ext = positionExtendedData[pos.token];
    setSelectedPos({
      ...pos,
      color: ext?.color ?? getFallbackColor(pos.token),
      currentPrice: ext?.currentPrice ?? pos.entry * (1 + (pos.pnlPercent / 100)),
      txs: ext?.txs ?? [],
    });
  };

  const pnlPositive = rangePnl >= 0;

  const fmtSetting = (val: number | undefined, type: string | undefined, fallback: string) => {
    if (val == null || val === 0) return fallback;
    return type === "PCT" ? `${val}%` : `$${val}`;
  };

  const TraderRow = ({ trader, index, mode }: { trader: FollowedTrader; index: number; mode: "copy" | "counter" | "watch" }) => {
    const bg = AVATAR_COLORS[index % AVATAR_COLORS.length];
    const initial = (trader.display_name || trader.trader_username)?.[0]?.toUpperCase() || "?";
    const pnlData = traderPnlMap[trader.trader_username];
    const userPnlUsd = pnlData?.pnl_usd ?? 0;
    const userPnlPct = pnlData?.pnl_pct ?? 0;
    const sizeDisplay = fmtSetting(defaultSettings?.tradeSize, defaultSettings?.tradeSizeType, "—");
    const levDisplay = defaultSettings?.leverage ? `${defaultSettings.leverage}x` : "—";
    const tpDisplay = defaultSettings?.tp ? fmtSetting(defaultSettings.tp.value, defaultSettings.tp.type, "—") : "—";
    const slDisplay = defaultSettings?.sl ? fmtSetting(defaultSettings.sl.value, defaultSettings.sl.type, "—") : "—";
    const modeColor = mode === "counter" ? "#f59e0b" : mode === "copy" ? "#2dd4bf" : "rgba(255,255,255,0.25)";
    const modeBg = mode === "counter" ? "rgba(245,158,11,0.08)" : mode === "copy" ? "rgba(45,212,191,0.06)" : "rgba(255,255,255,0.03)";
    const modeLabel = mode === "counter" ? "COUNTER" : mode === "copy" ? "COPY" : "WATCH";

    return (
      <div className="px-3 py-2.5 transition-all duration-200 row-animate cursor-pointer active:bg-white/10 hover:bg-white/[0.03]"
        style={{ animationDelay: `${index * 0.04}s` }}
        onClick={() => router.push(`/profile?handle=${trader.trader_username}`)}>
        <div className="flex items-center gap-2 mb-1.5">
          {trader.avatar_url ? (
            <img src={trader.avatar_url} className="w-7 h-7 rounded-full object-cover shrink-0" alt="" />
          ) : (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: bg }}>{initial}</div>
          )}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-200 font-medium truncate">@{trader.trader_username}</span>
              {trader.profit_grade && <span className="text-[8px] font-semibold px-1 py-[1px] rounded" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)" }}>{trader.profit_grade}</span>}
            </div>
          </div>
          {mode !== "watch" && (
            <div className="flex items-center gap-1 px-1.5 py-[3px] rounded shrink-0" style={{ background: modeBg, border: `1px solid ${modeColor}25` }}>
              {mode === "counter" ? <RefreshCw size={8} style={{ color: modeColor }} /> : <Copy size={8} style={{ color: modeColor }} />}
              <span className="text-[7px] font-bold tracking-wider" style={{ color: modeColor }}>{modeLabel}</span>
            </div>
          )}
          <div className="flex flex-col items-end shrink-0 ml-1">
            <span className={`text-[11px] font-bold tabular-nums ${userPnlUsd >= 0 ? "text-teal-400" : "text-rose-400"}`}>
              {userPnlUsd >= 0 ? "+" : "-"}${Math.abs(userPnlUsd).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
            <span className={`text-[9px] tabular-nums ${userPnlPct >= 0 ? "text-teal-400/70" : "text-rose-400/70"}`}>
              {userPnlPct >= 0 ? "+" : ""}{userPnlPct.toFixed(1)}%
            </span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); router.push(`/settings?tab=trader&handle=${trader.trader_username}`); }}
            className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-teal-400 hover:bg-white/10 rounded-md transition-all cursor-pointer shrink-0">
            <Settings size={11} />
          </button>
        </div>
        {mode !== "watch" && (
          <div className="flex items-center gap-1.5 ml-9 flex-wrap">
            <div className="flex items-center gap-[3px] px-1.5 py-[2px] rounded" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-[7px] text-gray-500">Size</span><span className="text-[8px] font-semibold text-gray-300">{sizeDisplay}</span>
            </div>
            <div className="flex items-center gap-[3px] px-1.5 py-[2px] rounded" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-[7px] text-gray-500">Lev</span><span className="text-[8px] font-semibold text-gray-300">{levDisplay}</span>
            </div>
            <div className="flex items-center gap-[3px] px-1.5 py-[2px] rounded" style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)" }}>
              <span className="text-[7px] text-emerald-500/70">TP</span><span className="text-[8px] font-semibold text-emerald-400">{tpDisplay}</span>
            </div>
            <div className="flex items-center gap-[3px] px-1.5 py-[2px] rounded" style={{ background: "rgba(244,63,94,0.04)", border: "1px solid rgba(244,63,94,0.1)" }}>
              <span className="text-[7px] text-rose-500/70">SL</span><span className="text-[8px] font-semibold text-rose-400">{slDisplay}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const SectionHeader = ({ label, count, color, icon: Icon }: { label: string; count: number; color: string; icon: typeof Copy }) => (
    <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: `${color}06`, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: `${color}15` }}><Icon size={9} style={{ color }} /></div>
      <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color, opacity: 0.85 }}>{label}</span>
      <span className="text-[9px] font-medium" style={{ color: "rgba(255,255,255,0.2)" }}>{count}</span>
    </div>
  );

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)" }}>
      <style jsx>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes rewardsFadeIn { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .row-animate { animation: slideIn 0.3s ease-out forwards; }
      `}</style>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/3 w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/3 -right-20 w-[200px] h-[200px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 60%)", filter: "blur(40px)" }} />
      </div>

      {!authenticated && (
        <div className="relative z-10 mx-3 mt-2 mb-1 rounded-lg px-3 py-2 flex items-center justify-between cursor-pointer transition-all duration-300 hover:scale-[1.01]"
          style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.1) 0%, rgba(45,212,191,0.03) 100%)", border: "1px solid rgba(45,212,191,0.2)" }}
          onClick={() => login()}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(45,212,191,0.15)" }}>
              <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div><p className="text-[10px] font-semibold text-white">Connect to start trading</p><p className="text-[9px] text-gray-500">Link your wallet to copy top traders</p></div>
          </div>
          <span className="text-[10px] font-semibold text-teal-400">Connect →</span>
        </div>
      )}

      {authenticated && !builderFeeApproved && !builderDismissed && (
        <BuilderApprovalBanner onApproved={() => setBuilderDismissed(true)} onDismiss={() => setBuilderDismissed(true)} />
      )}

      <RewardsBanner />
      <TopBar activeTrades={openCount} onCoinClick={() => viewRewardsFromPrompt()} onActiveTradesClick={() => setShowActiveTrades(true)} />

      {/* PORTFOLIO CARD */}
      <div className="relative z-10 px-3">
        <div className="rounded-xl overflow-hidden mb-3" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.05) 0%, rgba(45,212,191,0.01) 100%)", border: "1px solid rgba(45,212,191,0.15)", boxShadow: "0 0 30px rgba(45,212,191,0.08)" }}>
          <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: "radial-gradient(ellipse at top left, rgba(45,212,191,0.12) 0%, transparent 60%)" }} />
          <div className="relative z-10 p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Portfolio</p>
                <button onClick={() => setHideBalance(!hideBalance)} className="text-gray-600 hover:text-gray-400 transition-colors">{hideBalance ? <EyeOff size={12} /> : <Eye size={12} />}</button>
              </div>
              <button onClick={refreshWalletBalance} disabled={balRefreshing} className="text-gray-600 hover:text-teal-400 transition-colors disabled:opacity-50"><RefreshCw size={12} className={balRefreshing ? "animate-spin" : ""} /></button>
            </div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-3xl font-bold text-white tracking-tight tabular-nums" style={{ textShadow: "0 0 20px rgba(45,212,191,0.2)" }}>
                  {authenticated ? (hideBalance ? "••••••" : `$${fmt(totalBalance)}`) : "—"}
                </p>
                {authenticated && pnlChartData.length > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[12px] font-bold tabular-nums ${pnlPositive ? "text-teal-400" : "text-rose-400"}`}>{rangePnl >= 0 ? "+" : "-"}${fmt(Math.abs(rangePnl))}</span>
                    <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${pnlPositive ? "text-teal-400 bg-teal-400/10" : "text-rose-400 bg-rose-400/10"}`}>{rangePnlPct >= 0 ? "+" : ""}{rangePnlPct.toFixed(2)}%</span>
                    <span className="text-[9px] text-gray-600">{TIME_RANGE_LABELS[timeRange] || ""}</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 mb-0.5">Available to trade</p>
                <p className="text-lg font-bold text-white tabular-nums">{authenticated ? (hideBalance ? "••••" : `$${fmt(availableToTrade)}`) : "—"}</p>
                {pendingBalance > 0.01 && <p className="text-[9px] text-yellow-400/70 mt-0.5">+${fmt(pendingBalance)} bridging</p>}
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <Button onClick={() => authenticated ? setShowDeposit(true) : login()}
                className="flex-1 bg-teal-400 hover:bg-teal-300 text-[#0a0f14] text-[12px] font-bold rounded-xl py-3 h-auto transition-all cursor-pointer gap-1.5"
                style={{ boxShadow: "0 0 20px rgba(45,212,191,0.3)" }}><Download size={14} /> {authenticated ? "Deposit" : "Connect"}</Button>
              {authenticated && (
                <Button onClick={() => setShowWithdraw(true)} className="flex-1 bg-transparent hover:bg-white/5 text-gray-300 text-[12px] font-bold rounded-xl py-3 h-auto transition-all cursor-pointer gap-1.5" style={{ border: "1px solid rgba(255,255,255,0.12)" }}><Upload size={14} /> Withdraw</Button>
              )}
              {authenticated && (
                <button onClick={() => setShowHistory(true)} className="w-[46px] shrink-0 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 cursor-pointer" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }}><Clock size={16} className="text-gray-400" /></button>
              )}
            </div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5"><TrendingUp size={12} className="text-teal-400" /><span className="text-[11px] text-gray-400 font-medium">Profit/Loss</span></div>
              <div className="flex gap-0.5">
                {(["D", "W", "M", "ALL"] as TimeRange[]).map((t) => (
                  <TimeRangeTab key={t} label={t === "D" ? "1D" : t === "W" ? "1W" : t === "M" ? "1M" : "ALL"} isActive={timeRange === t} onClick={() => setTimeRange(t)} />
                ))}
              </div>
            </div>
            {authenticated && pnlChartData.length > 0 && (
              <div className="mb-2">
                <p className={`text-2xl font-bold tabular-nums ${pnlPositive ? "text-teal-400" : "text-rose-400"}`}>{hideBalance ? "••••••" : `${rangePnl >= 0 ? "+" : "-"}$${fmt(Math.abs(rangePnl))}`}</p>
                <p className="text-[10px] text-gray-500 capitalize">{TIME_RANGE_LABELS[timeRange] || ""}</p>
              </div>
            )}
            <div className="relative h-28 mb-1"><BalanceChart timeRange={timeRange} chartData={pnlChartData} mode="pnl" /></div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="relative z-10 flex px-3 mt-2.5 gap-2">
        <div className="flex flex-1 gap-2">
          {[
            { icon: Copy, label: "Copying", value: String(copyingCount), color: "teal", action: () => setShowCopying(true) },
            { icon: Users, label: "Copiers", value: String(copiersCount), color: "purple", action: () => setShowCopiers(true) },
          ].map((stat, i) => (
            <div key={i} onClick={() => stat.action()} className="flex-1 rounded-xl p-3 cursor-pointer transition-all duration-300 hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 ${stat.color === "teal" ? "bg-teal-400/10" : "bg-purple-400/10"}`}><stat.icon size={16} className={stat.color === "teal" ? "text-teal-400" : "text-purple-400"} /></div>
                <span className="text-[9px] text-gray-400 mb-1">{stat.label}</span>
                <span className="text-sm font-bold text-white">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div onClick={() => setShowActiveTrades(true)} className="flex-1 rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-300 hover:scale-[1.02] flex items-center justify-between" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full flex items-center justify-center bg-orange-400/10"><ArrowUpDown size={14} className="text-orange-400" /></div><span className="text-[9px] text-gray-400">Active Trades</span></div>
            <span className="text-sm font-bold text-white">{openCount}</span>
          </div>
          <div onClick={() => router.push("/tradeHistory")} className="flex-1 rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-300 hover:scale-[1.02] flex items-center justify-between" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full flex items-center justify-center bg-teal-400/10"><CheckCircle2 size={14} className="text-teal-400" /></div><span className="text-[9px] text-gray-400">Trades Ended</span></div>
            <span className="text-sm font-bold text-white">{Math.max(0, totalTrades - openCount)}</span>
          </div>
        </div>
      </div>

      {/* Followed / Positions tabs */}
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
                <div>
                  {copyTraders.length > 0 && (<><SectionHeader label="Copying" count={copyTraders.length} color="#2dd4bf" icon={Copy} /><div className="divide-y divide-white/5">{copyTraders.map((t, i) => <TraderRow key={t.id} trader={t} index={i} mode="copy" />)}</div></>)}
                  {counterTraders.length > 0 && (<><SectionHeader label="Countering" count={counterTraders.length} color="#f59e0b" icon={RefreshCw} /><div className="divide-y divide-white/5">{counterTraders.map((t, i) => <TraderRow key={t.id} trader={t} index={i} mode="counter" />)}</div></>)}
                  {watchTraders.length > 0 && (<><SectionHeader label="Watching" count={watchTraders.length} color="rgba(255,255,255,0.35)" icon={Eye} /><div className="divide-y divide-white/5">{watchTraders.map((t, i) => <TraderRow key={t.id} trader={t} index={i} mode="watch" />)}</div></>)}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4">
                  <Copy size={24} className="text-gray-600 mb-2" />
                  <p className="text-[11px] text-gray-500 text-center">{authenticated ? "You're not following any traders yet" : "Connect wallet to see followed traders"}</p>
                  {authenticated && <button onClick={() => router.push("/copyTrading")} className="mt-3 text-[10px] font-semibold text-teal-400 px-4 py-1.5 rounded-lg cursor-pointer" style={{ background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)" }}>Browse Traders</button>}
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
                          <div className="flex flex-col"><span className="text-[10px] text-white font-medium">{pos.token}</span><span className="text-[8px] text-gray-500">{pos.pair}</span></div>
                        </div>
                        <div className="text-right"><div className="text-[10px] text-white font-medium">${pos.sizeUsd.toLocaleString()}</div><div className="text-[8px] text-gray-500">{pos.size} {pos.token}</div></div>
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
                  <p className="text-[11px] text-gray-500 text-center">{authenticated ? "No open positions" : "Connect wallet to see positions"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlays */}
      {showRewards && <div className="fixed inset-0 z-[100]" style={{ animation: "rewardsFadeIn 0.35s ease-out both" }}><KOLRewardsScreen onClose={closeRewards} /></div>}
      {showCopying && <CopyingSheet mode="copying" onClose={() => setShowCopying(false)} userBalance={walletBal?.hl_equity ?? 0} onDepositClick={() => setShowDeposit(true)} />}
      {showCopiers && <CopyingSheet mode="copiers" onClose={() => setShowCopiers(false)} userBalance={walletBal?.hl_equity ?? 0} onDepositClick={() => setShowDeposit(true)} />}

      {showActiveTrades && (
        <ActiveTradesSheet
          positions={positions}
          onClose={() => setShowActiveTrades(false)}
          onPositionClosed={() => { refreshWalletBalance(); fetchDashboard(); fetchPnlChart(timeRange); }}
          onSelectPosition={(pos: PositionItem) => {
            const ext = positionExtendedData[pos.ticker];
            setSelectedPos({
              id: Number(pos.id) || 0,
              tradeId: pos.id,
              token: pos.ticker,
              pair: `${pos.ticker}/USDT`,
              iconUrl: "",
              size: pos.size_qty,
              sizeUsd: pos.size_usd,
              pnl: pos.pnl_usd ?? 0,
              pnlPercent: pos.pnl_pct ?? 0,
              entry: pos.entry_price,
              color: ext?.color ?? getFallbackColor(pos.ticker),
              currentPrice: ext?.currentPrice ?? pos.entry_price * (1 + ((pos.pnl_pct ?? 0) / 100)),
              txs: ext?.txs ?? [],
            });
          }}
        />
      )}

      {selectedPos && (
        <PositionDetail
          pos={selectedPos}
          onClose={() => setSelectedPos(null)}
          onClosePosition={handleClosePosition}
        />
      )}

      <DepositSheet isOpen={showDeposit} onClose={() => handleSheetClose(setShowDeposit)} onSuccess={handleDepositSuccess} />
      <WithdrawSheet isOpen={showWithdraw} onClose={() => { setShowWithdraw(false); refreshWalletBalance(); fetchPnlChart(timeRange); setTimeout(fetchDashboard, 60_000); }} availableBalance={availableToTrade} onSuccess={handleWithdrawSuccess} />
      <TransactionHistorySheet isOpen={showHistory} onClose={() => setShowHistory(false)} />
    </div>
  );
};

export default Home;