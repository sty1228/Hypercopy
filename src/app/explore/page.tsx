"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import profileIcon from "@/assets/icons/profile.png";
import copyCountIcon from "@/assets/icons/copy-count.png";
import copyRankIcon from "@/assets/icons/copy-rank.png";
import {
  Search, TrendingUp, TrendingDown, Flame, Target, Users,
  Zap, ChevronRight, Loader2, AlertCircle, Trophy, Star,
  Eye, BarChart3, Clock,
} from "lucide-react";
import UserMenu from "@/components/UserMenu";
import {
  leaderboard, getFollowedTraders, getTokenSentiment, getRisingTraders,
  type LeaderboardItem, type FollowedTrader, type TokenSentimentItem, type RisingTraderItem,
} from "@/service";

/* ─────────────── Helpers ─────────────────── */

const avatarColors = ["#3b82f6","#6366f1","#ec4899","#f59e0b","#10b981","#8b5cf6","#f97316","#ef4444"];
const getAvatarColor = (n: string) => {
  let h = 0;
  for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
  return avatarColors[Math.abs(h) % avatarColors.length];
};

const gradeMap: Record<string, { color: string }> = {
  "S+": { color: "#ff6b6b" }, "S": { color: "#ff9f43" }, "S-": { color: "#feca57" },
  "A+": { color: "#2dd4bf" }, "A": { color: "#34d399" }, "A-": { color: "#60a5fa" },
  "B+": { color: "#818cf8" }, "B": { color: "#a78bfa" }, "C": { color: "#94a3b8" },
};
const gradeColor = (g: string | null) => gradeMap[g || ""]?.color || "#94a3b8";

const formatPrice = (p: number | null) => {
  if (!p) return "—";
  if (p >= 1000) return `$${(p / 1000).toFixed(1)}k`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  return `$${p.toFixed(4)}`;
};

const cardBg = "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)";
const cardBorder = "1px solid rgba(255,255,255,0.08)";

/* ─────────────── Small Components ────────── */

const IconTooltip = ({ tooltip, children }: { tooltip: string; children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  useEffect(() => { if (show) { const t = setTimeout(() => setShow(false), 2000); return () => clearTimeout(t); } }, [show]);
  return (
    <div className="relative" onClick={() => setShow(p => !p)}>
      {children}
      <div className="absolute top-full right-0 mt-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap text-[10px] font-medium pointer-events-none transition-all duration-200 z-50"
        style={{ background: "rgba(15,20,25,0.95)", border: "1px solid rgba(45,212,191,0.3)", color: "rgba(255,255,255,0.9)", boxShadow: "0 4px 12px rgba(0,0,0,0.4)", opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(-4px)" }}>
        {tooltip}
      </div>
    </div>
  );
};

const AvatarEl = ({ name, url, sz = 36 }: { name: string; url?: string | null; sz?: number }) => {
  if (url) return <img src={url} alt={name} style={{ width: sz, height: sz, borderRadius: sz * 0.25, objectFit: "cover" }} />;
  return (
    <div style={{ width: sz, height: sz, borderRadius: sz * 0.25, background: getAvatarColor(name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz * 0.38, fontWeight: 700 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

const GradeBadge = ({ grade }: { grade: string | null }) => {
  const c = gradeColor(grade);
  return grade ? (
    <span className="text-[8px] font-bold leading-none" style={{ padding: "2px 4px", borderRadius: 4, background: `${c}20`, color: c, border: `1px solid ${c}40` }}>{grade}</span>
  ) : null;
};

const SectionHeader = ({ icon, title, action, onAction }: { icon: React.ReactNode; title: string; action?: string; onAction?: () => void }) => (
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-[13px] font-bold text-white">{title}</span>
    </div>
    {action && <span onClick={onAction} className="text-[10px] text-teal-400 font-medium cursor-pointer flex items-center gap-0.5">{action} <ChevronRight size={10} /></span>}
  </div>
);

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center pt-20 gap-3">
    <Loader2 size={24} className="text-teal-400 animate-spin" />
    <span className="text-[11px] text-gray-500">Loading…</span>
  </div>
);

/* ═══════════════════════════════════════════════
   EXPLORE PAGE
   ═══════════════════════════════════════════════ */

export default function ExplorePage() {
  const router = useRouter();

  /* ── State ── */
  const [tab, setTab] = useState<"discover" | "mytraders">("discover");
  const [searchText, setSearchText] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [subTab, setSubTab] = useState<"copying" | "following">("copying");

  /* ── Data ── */
  const [sentiment, setSentiment] = useState<TokenSentimentItem[]>([]);
  const [sentimentLoading, setSentimentLoading] = useState(true);
  const [topTraders, setTopTraders] = useState<LeaderboardItem[]>([]);
  const [topLoading, setTopLoading] = useState(true);
  const [rising, setRising] = useState<RisingTraderItem[]>([]);
  const [risingLoading, setRisingLoading] = useState(true);
  const [follows, setFollows] = useState<FollowedTrader[]>([]);
  const [followsLoading, setFollowsLoading] = useState(false);

  /* ── Fetch all data on mount ── */
  useEffect(() => {
    // Token sentiment
    setSentimentLoading(true);
    getTokenSentiment(30)
      .then(d => setSentiment(d))
      .catch(() => setSentiment([]))
      .finally(() => setSentimentLoading(false));

    // Top traders from leaderboard
    setTopLoading(true);
    leaderboard("30d")
      .then((d: LeaderboardItem[]) => {
        const list = d.map((item, i) => ({ ...item, rank: i + 1 }));
        setTopTraders(list);
      })
      .catch(() => setTopTraders([]))
      .finally(() => setTopLoading(false));

    // Rising
    setRisingLoading(true);
    getRisingTraders(6)
      .then(d => setRising(d))
      .catch(() => setRising([]))
      .finally(() => setRisingLoading(false));
  }, []);

  /* ── Fetch follows when switching to My Traders ── */
  useEffect(() => {
    if (tab !== "mytraders") return;
    setFollowsLoading(true);
    getFollowedTraders("30d")
      .then(d => setFollows(d))
      .catch(() => setFollows([]))
      .finally(() => setFollowsLoading(false));
  }, [tab]);

  /* ── Navigate to trader profile ── */
  const goTrader = useCallback((handle: string) => {
    router.push(`/profile?handle=${handle}`);
  }, [router]);

  /* ── Search submit ── */
  const handleSearch = () => {
    if (searchText.trim()) {
      router.push(`/copyTrading?search=${encodeURIComponent(searchText.trim())}`);
    }
  };

  /* ── Filtered follows ── */
  const copying = follows.filter(f => f.is_copy_trading);
  const following = follows.filter(f => !f.is_copy_trading);

  /* ── Style categories ── */
  const categories = [
    { emoji: "🎯", label: "High WR", desc: ">75% accuracy", color: "#2dd4bf" },
    { emoji: "💎", label: "Holders", desc: "Long-term", color: "#6366f1" },
    { emoji: "⚡", label: "Scalpers", desc: "Quick trades", color: "#f59e0b" },
    { emoji: "🐋", label: "Whales", desc: "Big positions", color: "#ec4899" },
    { emoji: "🔮", label: "Macro", desc: "Big picture", color: "#8b5cf6" },
    { emoji: "🆕", label: "New", desc: "< 30 days", color: "#34d399" },
  ];

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)" }}>
      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmerSlide { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .fade-in { animation: fadeInUp 0.4s ease both; }
        .fade-in-1 { animation-delay: 0.05s; }
        .fade-in-2 { animation-delay: 0.1s; }
        .fade-in-3 { animation-delay: 0.15s; }
        .fade-in-4 { animation-delay: 0.2s; }
      `}</style>

      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/3 w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/3 -right-20 w-[200px] h-[200px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 60%)", filter: "blur(40px)" }} />
      </div>

      {/* ── Header ── */}
      <div className="relative z-10 mt-3 mb-2 flex items-center justify-between px-4">
        <h1 className="text-lg font-extrabold text-white">Explore</h1>
        <div className="flex items-center gap-2">
          <IconTooltip tooltip="Active Trades">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all hover:bg-white/10" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Image src={copyCountIcon} alt="trades" width={13} height={13} />
              <span className="text-[11px] font-semibold text-teal-400">0</span>
            </div>
          </IconTooltip>
          <UserMenu />
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative z-10 px-4 mb-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300"
          style={{ background: searchFocused ? "rgba(45,212,191,0.06)" : "rgba(255,255,255,0.04)", border: searchFocused ? "1px solid rgba(45,212,191,0.25)" : "1px solid rgba(255,255,255,0.08)" }}>
          <Search size={14} className="text-gray-500 shrink-0" />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search traders, tokens…"
            className="bg-transparent text-[11px] text-white placeholder-gray-500 outline-none w-full"
          />
          {searchText && <span onClick={() => setSearchText("")} className="text-[11px] cursor-pointer text-gray-500">✕</span>}
        </div>
      </div>

      {/* ── Main Tabs ── */}
      <div className="relative z-10 px-4 mb-3">
        <div className="flex p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {([
            { key: "discover" as const, label: "🔥 Discover" },
            { key: "mytraders" as const, label: `👥 My Traders` },
          ]).map(t => (
            <div key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-2 rounded-md text-center text-[11px] font-semibold cursor-pointer transition-all duration-200"
              style={{
                background: tab === t.key ? "rgba(45,212,191,0.15)" : "transparent",
                color: tab === t.key ? "#2dd4bf" : "rgba(255,255,255,0.4)",
                border: tab === t.key ? "1px solid rgba(45,212,191,0.3)" : "1px solid transparent",
              }}>
              {t.label}
              {t.key === "mytraders" && follows.length > 0 && (
                <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(45,212,191,0.2)", color: "#2dd4bf" }}>{follows.length}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ DISCOVER TAB ══════════ */}
      {tab === "discover" && (
        <div className="relative z-10 pb-24">

          {/* ── Token Sentiment ── */}
          <div className="px-4 mb-4 fade-in fade-in-1">
            <SectionHeader
              icon={<BarChart3 size={14} className="text-teal-400" />}
              title="Token Sentiment"
              action="By KOL signals"
            />
            {sentimentLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 size={18} className="text-teal-400 animate-spin" /></div>
            ) : sentiment.length === 0 ? (
              <div className="rounded-xl p-6 text-center" style={{ background: cardBg, border: cardBorder }}>
                <p className="text-[11px] text-gray-500">No signal data available yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {sentiment.slice(0, 8).map((tk, i) => (
                  <div key={tk.ticker} className="rounded-xl p-2.5 relative overflow-hidden" style={{ background: cardBg, border: cardBorder, animationDelay: `${i * 0.03}s` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-extrabold text-white">{tk.ticker}</span>
                      <span className="text-[9px] text-gray-500">{formatPrice(tk.latest_price)}</span>
                    </div>
                    {/* Sentiment bar */}
                    <div className="flex h-1 rounded-full overflow-hidden mb-1">
                      <div style={{ width: `${tk.bull_pct}%`, background: "#2dd4bf", borderRadius: "2px 0 0 2px" }} />
                      <div style={{ width: `${100 - tk.bull_pct}%`, background: "#f43f5e", borderRadius: "0 2px 2px 0" }} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[8px] text-teal-400 font-medium">🐂 {tk.bull_pct.toFixed(0)}%</span>
                      <span className="text-[8px] text-rose-400 font-medium">{(100 - tk.bull_pct).toFixed(0)}% 🐻</span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 pt-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <span className="text-[8px] text-gray-500">{tk.total_signals} signals</span>
                      <span className="text-[8px] font-semibold" style={{ color: tk.avg_pnl >= 0 ? "#2dd4bf" : "#f43f5e" }}>
                        {tk.avg_pnl >= 0 ? "+" : ""}{tk.avg_pnl}% avg
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Top Traders ── */}
          <div className="px-4 mb-4 fade-in fade-in-2">
            <SectionHeader
              icon={<Trophy size={14} className="text-yellow-400" />}
              title="Top Traders"
              action="Leaderboard"
              onAction={() => router.push("/copyTrading")}
            />
            {topLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 size={18} className="text-teal-400 animate-spin" /></div>
            ) : topTraders.length === 0 ? (
              <div className="rounded-xl p-6 text-center" style={{ background: cardBg, border: cardBorder }}>
                <p className="text-[11px] text-gray-500">No traders found</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {topTraders.slice(0, 5).map((t, i) => {
                  const wr = t.win_rate > 1 ? t.win_rate : t.win_rate * 100;
                  return (
                    <div key={t.x_handle} onClick={() => goTrader(t.x_handle)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                      style={{
                        background: i === 0 ? "linear-gradient(135deg, rgba(45,212,191,0.08), rgba(45,212,191,0.02))" : cardBg,
                        border: i === 0 ? "1px solid rgba(45,212,191,0.15)" : cardBorder,
                        position: "relative", overflow: "hidden",
                      }}>
                      {i === 0 && <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, rgba(45,212,191,0.04), transparent)", animation: "shimmerSlide 5s ease-in-out infinite" }} />}
                      <span className="text-[11px] font-bold w-4 text-center shrink-0" style={{ color: i < 3 ? "#2dd4bf" : "rgba(255,255,255,0.25)" }}>#{i + 1}</span>
                      <AvatarEl name={t.x_handle} url={t.avatar_url} sz={36} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-bold text-white truncate">{t.display_name || t.x_handle}</span>
                          <GradeBadge grade={t.profit_grade} />
                          {i === 0 && <span className="text-[7px] px-1 py-0.5 rounded font-bold" style={{ background: "rgba(251,146,60,0.12)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.25)" }}>HOT</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[8px] text-gray-500">🎯 {wr.toFixed(0)}%</span>
                          <span className="text-[8px] text-gray-500">📊 {t.total_signals || t.total_tweets} signals</span>
                          {(t.copiers ?? 0) > 0 && <span className="text-[8px] text-gray-500">👥 {t.copiers}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[13px] font-extrabold" style={{ color: (t.avg_return ?? t.results_pct ?? 0) >= 0 ? "#2dd4bf" : "#f43f5e" }}>
                          {(t.avg_return ?? t.results_pct ?? 0) >= 0 ? "+" : ""}{(t.avg_return ?? t.results_pct ?? 0).toFixed(1)}%
                        </div>
                        <div className="text-[8px] text-gray-500">avg return</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Rising This Week ── */}
          <div className="px-4 mb-4 fade-in fade-in-3">
            <SectionHeader icon={<TrendingUp size={14} className="text-green-400" />} title="Rising This Week" />
            {risingLoading ? (
              <div className="flex items-center justify-center py-6"><Loader2 size={18} className="text-teal-400 animate-spin" /></div>
            ) : rising.length === 0 ? (
              <div className="rounded-xl p-6 text-center" style={{ background: cardBg, border: cardBorder }}>
                <p className="text-[11px] text-gray-500">Not enough data yet</p>
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {rising.map((t, i) => {
                  const wr = t.win_rate > 1 ? t.win_rate : t.win_rate * 100;
                  return (
                    <div key={t.username} onClick={() => goTrader(t.username)}
                      className="shrink-0 rounded-xl p-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative"
                      style={{ width: 150, background: cardBg, border: cardBorder }}>
                      {t.points_change > 0 && (
                        <div className="absolute top-2 right-2 text-[8px] font-bold text-green-400">
                          ↑{t.points_change.toFixed(1)}%
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <AvatarEl name={t.username} url={t.avatar_url} sz={32} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold truncate">{t.display_name || t.username}</span>
                          </div>
                          <GradeBadge grade={t.profit_grade} />
                        </div>
                      </div>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[15px] font-extrabold text-teal-400">+{t.avg_return_pct.toFixed(1)}%</span>
                        <span className="text-[8px] text-gray-500">{wr.toFixed(0)}% WR</span>
                      </div>
                      {/* Mini chart placeholder */}
                      <div className="h-4 rounded overflow-hidden" style={{ background: "rgba(45,212,191,0.04)" }}>
                        <svg width="100%" height="16" viewBox="0 0 140 16" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id={`rg${i}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d={`M0,${14-i*2} C35,${12-i*3} 55,${8-i} 85,${10-i*2} S125,${4+i} 140,${2+i*2}`} fill="none" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.5" />
                          <path d={`M0,${14-i*2} C35,${12-i*3} 55,${8-i} 85,${10-i*2} S125,${4+i} 140,${2+i*2} V16 H0 Z`} fill={`url(#rg${i})`} />
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Browse by Style ── */}
          <div className="px-4 mb-4 fade-in fade-in-4">
            <SectionHeader icon={<Star size={14} className="text-purple-400" />} title="Browse by Style" />
            <div className="grid grid-cols-3 gap-1.5">
              {categories.map((c, i) => (
                <div key={i} onClick={() => router.push("/copyTrading")}
                  className="rounded-xl p-3 text-center cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                  style={{ background: `linear-gradient(135deg, ${c.color}08, ${c.color}02)`, border: `1px solid ${c.color}15` }}>
                  <div className="text-lg mb-0.5">{c.emoji}</div>
                  <div className="text-[10px] font-bold text-white">{c.label}</div>
                  <div className="text-[8px] text-gray-500 mt-0.5">{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MY TRADERS TAB ══════════ */}
      {tab === "mytraders" && (
        <div className="relative z-10 px-4 pb-24">

          {/* Sub tabs */}
          <div className="flex gap-2 mb-3">
            {([
              { key: "copying" as const, label: "📋 Copying", count: copying.length },
              { key: "following" as const, label: "👥 Following", count: following.length },
            ]).map(st => (
              <div key={st.key} onClick={() => setSubTab(st.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200"
                style={{
                  background: subTab === st.key ? "rgba(45,212,191,0.12)" : "rgba(255,255,255,0.03)",
                  border: subTab === st.key ? "1px solid rgba(45,212,191,0.25)" : "1px solid rgba(255,255,255,0.06)",
                }}>
                <span className="text-[11px] font-semibold" style={{ color: subTab === st.key ? "#2dd4bf" : "rgba(255,255,255,0.4)" }}>{st.label}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                  style={{ background: subTab === st.key ? "rgba(45,212,191,0.2)" : "rgba(255,255,255,0.06)", color: subTab === st.key ? "#2dd4bf" : "rgba(255,255,255,0.35)" }}>
                  {st.count}
                </span>
              </div>
            ))}
          </div>

          {/* List */}
          {followsLoading ? (
            <LoadingState />
          ) : (() => {
            const list = subTab === "copying" ? copying : following;
            if (list.length === 0) {
              return (
                <div className="rounded-xl p-8 text-center" style={{ background: cardBg, border: cardBorder }}>
                  <div className="text-2xl mb-2">{subTab === "copying" ? "📋" : "👥"}</div>
                  <p className="text-[12px] font-semibold text-white mb-1">
                    {subTab === "copying" ? "No copy trades yet" : "Not following anyone yet"}
                  </p>
                  <p className="text-[10px] text-gray-500">Discover traders in the Explore tab</p>
                </div>
              );
            }
            return (
              <div className="flex flex-col gap-1.5">
                {list.map((f, i) => {
                  const wr = f.win_rate > 1 ? f.win_rate : f.win_rate * 100;
                  return (
                    <div key={f.id} onClick={() => goTrader(f.trader_username)}
                      className="flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                      style={{
                        background: f.is_copy_trading ? "linear-gradient(135deg, rgba(45,212,191,0.06), rgba(45,212,191,0.02))" : cardBg,
                        border: f.is_copy_trading ? "1px solid rgba(45,212,191,0.12)" : cardBorder,
                      }}>
                      <AvatarEl name={f.trader_username} url={f.avatar_url} sz={40} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[12px] font-bold text-white truncate">{f.display_name || f.trader_username}</span>
                          <GradeBadge grade={f.profit_grade} />
                          {f.is_copy_trading && (
                            <span className="text-[7px] px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(45,212,191,0.12)", color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.2)" }}>COPYING</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-gray-500">🎯 {wr.toFixed(0)}% WR</span>
                          <span className="text-[9px] text-gray-500">📊 {f.total_signals} signals</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[14px] font-extrabold" style={{ color: f.avg_return_pct >= 0 ? "#2dd4bf" : "#f43f5e" }}>
                          {f.avg_return_pct >= 0 ? "+" : ""}{f.avg_return_pct.toFixed(1)}%
                        </div>
                        <div className="text-[8px] text-gray-500">avg return</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* CTA */}
          <div onClick={() => setTab("discover")} className="mt-3 p-4 rounded-xl text-center cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
            style={{ border: "1px dashed rgba(45,212,191,0.2)" }}>
            <div className="text-[11px] text-teal-400 font-semibold">🔍 Discover More Traders</div>
            <div className="text-[9px] text-gray-500 mt-1">Browse trending KOLs and top performers</div>
          </div>
        </div>
      )}
    </div>
  );
}