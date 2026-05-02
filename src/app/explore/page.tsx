"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search, TrendingUp, TrendingDown, Flame, Target, Users,
  Zap, ChevronRight, Loader2, Trophy, X,
  BarChart3, Diamond, Anchor, Compass,
  Crosshair, Activity, ArrowUpRight, Sparkles, Copy,
  UserPlus, Grid3X3, RefreshCw, Clock,
  Heart, MessageCircle, Repeat2,
} from "lucide-react";
import TopBar from "@/components/TopBar";
import {
  leaderboard, getFollowedTraders, getTokenSentiment, getRisingTraders,
  searchTraders, getTradersByStyle, getTokenDetail, getDashboardSummary,
  type LeaderboardItem, type FollowedTrader, type TokenSentimentItem,
  type RisingTraderItem, type SearchTraderItem, type StyleTraderItem,
  type TokenDetailResponse,
} from "@/service";
import { useLiveMids } from "@/hooks/useLiveMids";

/* ─────────────── helpers ─────────────────── */

const AVATAR_COLORS = ["#3b82f6","#6366f1","#ec4899","#f59e0b","#10b981","#8b5cf6","#f97316","#ef4444"];
const getAvatarColor = (n: string) => {
  let h = 0;
  for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const GRADE_MAP: Record<string, string> = {
  "S+": "#ff6b6b", S: "#ff9f43", "S-": "#feca57",
  "A+": "#2dd4bf", A: "#34d399", "A-": "#60a5fa",
  "B+": "#818cf8", B: "#a78bfa", C: "#94a3b8",
};
const gradeColor = (g: string | null) => GRADE_MAP[g || ""] || "#94a3b8";

const fmtPrice = (p: number | null) => {
  if (!p) return "—";
  if (p >= 1_000_000) return `$${(p / 1_000_000).toFixed(2)}M`;
  if (p >= 1000) return `$${(p / 1000).toFixed(1)}k`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  if (p >= 0.01) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(6)}`;
};

const fmtWr = (v: number) => (v > 1 ? v : v * 100).toFixed(0);

const fmtNum = (n: number | null | undefined) => {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};

const timeAgo = (iso: string) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return `${Math.floor(d / 30)}mo`;
};

const CB = "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)";
const CBR = "1px solid rgba(255,255,255,0.08)";

const STYLES = [
  { key: "high_wr", icon: <Crosshair size={16} className="text-teal-400" />, label: "High WR", desc: ">75% accuracy", color: "#2dd4bf" },
  { key: "holders", icon: <Diamond size={16} className="text-indigo-400" />, label: "Holders", desc: "Long-term", color: "#6366f1" },
  { key: "scalpers", icon: <Zap size={16} className="text-amber-400" />, label: "Scalpers", desc: "Quick trades", color: "#f59e0b" },
  { key: "whales", icon: <Anchor size={16} className="text-pink-400" />, label: "Whales", desc: "Big positions", color: "#ec4899" },
  { key: "macro", icon: <Compass size={16} className="text-purple-400" />, label: "Macro", desc: "Big picture", color: "#8b5cf6" },
  { key: "new", icon: <Sparkles size={16} className="text-emerald-400" />, label: "New", desc: "< 30 days", color: "#34d399" },
] as const;

/* ─────────────── micro components ────────── */

const AvatarEl = ({ name, url, sz = 36 }: { name: string; url?: string | null; sz?: number }) => {
  const [err, setErr] = useState(false);
  if (url && !err)
    return (
      <img
        src={url}
        alt={name}
        onError={() => setErr(true)}
        style={{ width: sz, height: sz, borderRadius: sz * 0.25, objectFit: "cover", flexShrink: 0 }}
      />
    );
  return (
    <div
      style={{
        width: sz, height: sz, borderRadius: sz * 0.25, flexShrink: 0,
        background: getAvatarColor(name),
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: sz * 0.38, fontWeight: 700, color: "#fff",
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

const GradeBadge = ({ grade }: { grade: string | null }) => {
  if (!grade) return null;
  const c = gradeColor(grade);
  return (
    <span
      className="text-[8px] font-bold leading-none"
      style={{ padding: "2px 4px", borderRadius: 4, background: `${c}20`, color: c, border: `1px solid ${c}40` }}
    >
      {grade}
    </span>
  );
};

const Hdr = ({ icon, title, action, onAction }: { icon: React.ReactNode; title: string; action?: string; onAction?: () => void }) => (
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-[13px] font-bold text-white">{title}</span>
    </div>
    {action && (
      <span onClick={onAction} className="text-[10px] text-teal-400 font-medium cursor-pointer flex items-center gap-0.5">
        {action}
        <ChevronRight size={10} />
      </span>
    )}
  </div>
);

const Stat = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <span className="flex items-center gap-1 text-[8px] text-gray-500">{icon}{text}</span>
);

const Spin = () => (
  <div className="flex items-center justify-center py-8">
    <Loader2 size={18} className="text-teal-400 animate-spin" />
  </div>
);

const Empty = ({ text }: { text: string }) => (
  <div className="rounded-xl p-6 text-center" style={{ background: CB, border: CBR }}>
    <p className="text-[11px] text-gray-500">{text}</p>
  </div>
);

/* ─────────────── bottom sheet wrapper ───── */

function BottomSheet({ onClose, title, subtitle, headerIcon, children }: {
  onClose: () => void; title: string; subtitle?: string;
  headerIcon?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      {/* backdrop tap */}
      <div className="absolute inset-0" onClick={onClose} />
      {/* sheet */}
      <div
        className="relative w-full max-w-[430px] flex flex-col rounded-t-2xl overflow-hidden animate-slide-up"
        style={{ background: "#0d1117", borderTop: "1px solid rgba(255,255,255,0.1)", maxHeight: "88vh" }}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-8 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>
        {/* header */}
        <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 min-w-0">
            {headerIcon}
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-white truncate">{title}</div>
              {subtitle && <div className="text-[10px] text-gray-500">{subtitle}</div>}
            </div>
          </div>
          <div
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer shrink-0"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <X size={14} className="text-gray-400" />
          </div>
        </div>
        {/* content */}
        <div className="flex-1 overflow-y-auto pb-20">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────── token detail sheet ─────── */

function TokenSheet({ ticker, onClose, goTrader }: { ticker: string; onClose: () => void; goTrader: (h: string) => void }) {
  const [data, setData] = useState<TokenDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sigTab, setSigTab] = useState<"all" | "bullish" | "bearish">("all");
  const { getMid } = useLiveMids();
  // Sheet is keyed to a single ticker; one liveMid covers every signal row.
  const liveMid = getMid(ticker);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    getTokenDetail(ticker, 30)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [ticker]);
  useEffect(() => { load(); }, [load]);

  const filteredSigs = useMemo(() => {
    if (!data) return [];
    if (sigTab === "all") return data.recent_signals;
    return data.recent_signals.filter(s => s.sentiment === sigTab);
  }, [data, sigTab]);

  return (
    <BottomSheet
      onClose={onClose}
      title={ticker}
      subtitle={data ? `${data.total_signals} signals · ${fmtPrice(data.latest_price)}` : "Loading…"}
      headerIcon={
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(45,212,191,0.1)" }}>
          <BarChart3 size={18} className="text-teal-400" />
        </div>
      }
    >
      {loading ? (
        <Spin />
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-[11px] text-gray-500 mb-2">Failed to load</p>
          <button onClick={load} className="text-[11px] text-teal-400 font-semibold flex items-center gap-1 mx-auto">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      ) : data ? (
        <div className="px-4 pt-3 space-y-4">
          {/* sentiment breakdown */}
          <div className="rounded-xl p-3" style={{ background: CB, border: CBR }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-semibold text-gray-400">Sentiment Breakdown</span>
              <span className="text-[10px] text-gray-500">{data.total_signals} signals</span>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden mb-2">
              <div style={{ width: `${data.bull_pct}%`, background: "#2dd4bf" }} className="rounded-l-full" />
              <div style={{ width: `${100 - data.bull_pct}%`, background: "#f43f5e" }} className="rounded-r-full" />
            </div>
            <div className="flex justify-between">
              <div className="flex items-center gap-1">
                <TrendingUp size={10} className="text-teal-400" />
                <span className="text-[11px] font-bold text-teal-400">{data.bull_pct.toFixed(0)}% Bullish</span>
                <span className="text-[9px] text-gray-500">({data.bull_count})</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-gray-500">({data.bear_count})</span>
                <span className="text-[11px] font-bold text-rose-400">{(100 - data.bull_pct).toFixed(0)}% Bearish</span>
                <TrendingDown size={10} className="text-rose-400" />
              </div>
            </div>
            <div className="mt-2 pt-2 flex justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <span className="text-[10px] text-gray-500">Avg P&L</span>
              <span className="text-[11px] font-bold" style={{ color: data.avg_pnl >= 0 ? "#2dd4bf" : "#f43f5e" }}>
                {data.avg_pnl >= 0 ? "+" : ""}{data.avg_pnl.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* top traders */}
          {data.top_traders.length > 0 && (
            <div>
              <Hdr icon={<Trophy size={13} className="text-yellow-400" />} title={`Top ${ticker} Traders`} />
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {data.top_traders.map(t => (
                  <div
                    key={t.username}
                    onClick={() => { onClose(); goTrader(t.username); }}
                    className="shrink-0 rounded-xl p-2.5 cursor-pointer transition-all active:scale-[0.97]"
                    style={{ width: 140, background: CB, border: CBR }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <AvatarEl name={t.username} url={t.avatar_url} sz={28} />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-white block truncate">{t.display_name || t.username}</span>
                        <GradeBadge grade={t.profit_grade} />
                      </div>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[13px] font-extrabold" style={{ color: t.avg_pnl >= 0 ? "#2dd4bf" : "#f43f5e" }}>
                        {t.avg_pnl >= 0 ? "+" : ""}{t.avg_pnl.toFixed(1)}%
                      </span>
                      <span className="text-[8px] text-gray-500">{t.signal_count} sig</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Stat icon={<Target size={7} />} text={`${fmtWr(t.win_rate)}% WR`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* recent signals */}
          <div>
            <Hdr icon={<Activity size={13} className="text-teal-400" />} title="Recent Signals" />
            <div className="flex gap-1.5 mb-2">
              {(["all", "bullish", "bearish"] as const).map(k => (
                <div
                  key={k}
                  onClick={() => setSigTab(k)}
                  className="px-2.5 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-all"
                  style={{
                    background: sigTab === k
                      ? k === "bearish" ? "rgba(244,63,94,0.12)" : "rgba(45,212,191,0.12)"
                      : "rgba(255,255,255,0.03)",
                    color: sigTab === k
                      ? k === "bearish" ? "#f43f5e" : "#2dd4bf"
                      : "rgba(255,255,255,0.35)",
                    border: sigTab === k
                      ? `1px solid ${k === "bearish" ? "rgba(244,63,94,0.25)" : "rgba(45,212,191,0.25)"}`
                      : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {k === "all" ? "All" : k === "bullish" ? "🟢 Bull" : "🔴 Bear"}
                </div>
              ))}
            </div>

            {filteredSigs.length === 0 ? (
              <Empty text="No signals found" />
            ) : (
              <div className="flex flex-col gap-2">
                {filteredSigs.map(sig => {
                  const isBull = sig.sentiment === "bullish";
                  const hasPeak = sig.max_gain_pct != null && sig.max_gain_pct > 0.1;
                  return (
                    <div
                      key={sig.signal_id}
                      onClick={() => { onClose(); goTrader(sig.trader_username); }}
                      className="rounded-xl p-3 cursor-pointer transition-all active:scale-[0.98]"
                      style={{ background: CB, border: CBR }}
                    >
                      {/* header row: avatar + name + direction + pct + time */}
                      <div className="flex items-center gap-2 mb-2">
                        <AvatarEl name={sig.trader_username} url={sig.trader_avatar_url} sz={28} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-white truncate">
                              {sig.trader_display_name || sig.trader_username}
                            </span>
                            <span
                              className="text-[8px] px-1.5 py-0.5 rounded font-bold shrink-0"
                              style={{
                                background: isBull ? "rgba(45,212,191,0.1)" : "rgba(244,63,94,0.1)",
                                color: isBull ? "#2dd4bf" : "#f43f5e",
                                border: `1px solid ${isBull ? "rgba(45,212,191,0.2)" : "rgba(244,63,94,0.2)"}`,
                              }}
                            >
                              {sig.direction.toUpperCase()}
                            </span>
                            {hasPeak && (
                              <span
                                className="flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded font-bold shrink-0"
                                style={{
                                  background: "linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(245,158,11,0.1) 100%)",
                                  border: "1px solid rgba(251,191,36,0.35)",
                                  color: "#fbbf24",
                                }}
                                title={sig.max_gain_at ? `Peaked ${timeAgo(sig.max_gain_at)} after tweet` : ""}
                              >
                                <TrendingUp size={7} /> PEAK +{sig.max_gain_pct!.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {(() => {
                            const isShort = !(sig.direction === "long" || sig.direction === "bullish");
                            const livePct = (liveMid != null && sig.entry_price != null && sig.entry_price > 0)
                              ? ((liveMid - sig.entry_price) / sig.entry_price) * 100 * (isShort ? -1 : 1)
                              : null;
                            const displayPct = livePct ?? sig.pct_change;
                            if (displayPct == null) return null;
                            return (
                              <div className="flex items-center gap-1 justify-end">
                                {liveMid != null && (
                                  <span
                                    className="w-1.5 h-1.5 rounded-full bg-teal-400"
                                    style={{ animation: "exLivePulse 1.6s ease-in-out infinite", boxShadow: "0 0 4px rgba(45,212,191,0.7)" }}
                                    title="Live price"
                                  />
                                )}
                                <div
                                  className="text-[12px] font-extrabold"
                                  style={{ color: displayPct >= 0 ? "#2dd4bf" : "#f43f5e" }}
                                >
                                  {displayPct >= 0 ? "+" : ""}{displayPct.toFixed(1)}%
                                </div>
                              </div>
                            );
                          })()}
                          <div className="flex items-center gap-0.5 text-[8px] text-gray-500 justify-end">
                            <Clock size={7} />
                            {timeAgo(sig.created_at)}
                          </div>
                        </div>
                      </div>

                      {/* tweet text — full display */}
                      {sig.tweet_text && (
                        <p className="text-[11px] text-gray-300 leading-[1.5] mb-2 whitespace-pre-wrap break-words">
                          {sig.tweet_text}
                        </p>
                      )}

                      {/* tweet image */}
                      {sig.tweet_image_url && (
                        <div className="mb-2 rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                          <img
                            src={sig.tweet_image_url}
                            alt=""
                            className="w-full max-h-[200px] object-cover"
                            loading="lazy"
                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        </div>
                      )}

                      {/* price row + engagement */}
                      <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <div className="flex gap-3">
                          {sig.entry_price != null && (
                            <span className="text-[9px] text-gray-500">
                              Entry: <span className="text-white font-semibold">{fmtPrice(sig.entry_price)}</span>
                            </span>
                          )}
                          {(liveMid ?? sig.current_price) != null && (
                            <span className="text-[9px] text-gray-500">
                              Now: <span className="text-white font-semibold">{fmtPrice((liveMid ?? sig.current_price) as number)}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {(sig.likes != null && sig.likes > 0) && (
                            <span className="flex items-center gap-0.5 text-[8px] text-gray-500">
                              <Heart size={8} />{fmtNum(sig.likes)}
                            </span>
                          )}
                          {(sig.retweets != null && sig.retweets > 0) && (
                            <span className="flex items-center gap-0.5 text-[8px] text-gray-500">
                              <Repeat2 size={8} />{fmtNum(sig.retweets)}
                            </span>
                          )}
                          {(sig.replies != null && sig.replies > 0) && (
                            <span className="flex items-center gap-0.5 text-[8px] text-gray-500">
                              <MessageCircle size={8} />{fmtNum(sig.replies)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </BottomSheet>
  );
}

/* ─────────────── style sheet ────────────── */

function StyleSheet({ style, onClose, goTrader }: {
  style: (typeof STYLES)[number]; onClose: () => void; goTrader: (h: string) => void;
}) {
  const [data, setData] = useState<StyleTraderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    getTradersByStyle(style.key, 20)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [style.key]);
  useEffect(() => { load(); }, [load]);

  return (
    <BottomSheet
      onClose={onClose}
      title={style.label}
      subtitle={style.desc}
      headerIcon={
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${style.color}15` }}>
          {style.icon}
        </div>
      }
    >
      <div className="p-3">
        {loading ? (
          <Spin />
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-[11px] text-gray-500 mb-2">Failed to load</p>
            <button onClick={load} className="text-[11px] text-teal-400 font-semibold flex items-center gap-1 mx-auto">
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        ) : data.length === 0 ? (
          <Empty text={`No ${style.label.toLowerCase()} traders found yet`} />
        ) : (
          <div className="flex flex-col gap-1.5">
            {data.map((t, i) => (
              <div
                key={t.username}
                onClick={() => { onClose(); goTrader(t.username); }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98]"
                style={{ background: CB, border: CBR }}
              >
                <span className="text-[10px] font-bold w-4 text-center shrink-0" style={{ color: i < 3 ? style.color : "rgba(255,255,255,0.2)" }}>
                  #{i + 1}
                </span>
                <AvatarEl name={t.username} url={t.avatar_url} sz={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold text-white truncate">{t.display_name || t.username}</span>
                    <GradeBadge grade={t.profit_grade} />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Stat icon={<Target size={7} />} text={`${fmtWr(t.win_rate)}%`} />
                    <Stat icon={<BarChart3 size={7} />} text={`${t.total_signals} sig`} />
                    {t.copiers_count > 0 && <Stat icon={<Users size={7} />} text={`${t.copiers_count}`} />}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-extrabold" style={{ color: t.avg_return_pct >= 0 ? "#2dd4bf" : "#f43f5e" }}>
                    {t.avg_return_pct >= 0 ? "+" : ""}{t.avg_return_pct.toFixed(1)}%
                  </div>
                  <div className="text-[8px] text-gray-500">avg return</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

/* ═══════════════════════════════════════════════
   EXPLORE PAGE
   ═══════════════════════════════════════════════ */

export default function ExplorePage() {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState<"discover" | "mytraders">("discover");
  const [subTab, setSubTab] = useState<"copying" | "following">("copying");

  const [searchText, setSearchText] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchTraderItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const showDropdown = searchFocused && searchText.trim().length > 0;

  const [sentiment, setSentiment] = useState<TokenSentimentItem[]>([]);
  const [sentimentLoading, setSentimentLoading] = useState(true);
  const [topTraders, setTopTraders] = useState<LeaderboardItem[]>([]);
  const [topLoading, setTopLoading] = useState(true);
  const [rising, setRising] = useState<RisingTraderItem[]>([]);
  const [risingLoading, setRisingLoading] = useState(true);
  const [follows, setFollows] = useState<FollowedTrader[]>([]);
  const [followsLoading, setFollowsLoading] = useState(false);

  const [activeStyle, setActiveStyle] = useState<(typeof STYLES)[number] | null>(null);
  const [activeTicker, setActiveTicker] = useState<string | null>(null);

  /* ── data fetch ── */

  const fetchDiscover = useCallback(() => {
    setSentimentLoading(true);
    getTokenSentiment(30).then(setSentiment).catch(() => setSentiment([])).finally(() => setSentimentLoading(false));
    setTopLoading(true);
    leaderboard("30d").then(d => setTopTraders(d.map((it, i) => ({ ...it, rank: i + 1 })))).catch(() => setTopTraders([])).finally(() => setTopLoading(false));
    setRisingLoading(true);
    getRisingTraders(6).then(setRising).catch(() => setRising([])).finally(() => setRisingLoading(false));
  }, []);
  useEffect(() => { fetchDiscover(); }, [fetchDiscover]);

  useEffect(() => {
    if (tab !== "mytraders") return;
    setFollowsLoading(true);
    getFollowedTraders("30d").then(setFollows).catch(() => setFollows([])).finally(() => setFollowsLoading(false));
  }, [tab]);

  /* search debounce */
  useEffect(() => {
    const q = searchText.trim();
    if (!q) { setSearchResults([]); return; }
    setSearchLoading(true);
    const t = setTimeout(() => {
      searchTraders(q, 8).then(setSearchResults).catch(() => setSearchResults([])).finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [searchText]);

  /* close search on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const goTrader = useCallback((h: string) => { setSearchFocused(false); router.push(`/profile?handle=${h}`); }, [router]);
  const goLeaderboard = useCallback(() => router.push("/copyTrading"), [router]);

  const copying = useMemo(() => follows.filter(f => f.is_copy_trading), [follows]);
  const following = useMemo(() => follows.filter(f => !f.is_copy_trading), [follows]);

  /* ═══════════ RENDER ═══════════ */

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)" }}>
      <style jsx global>{`
        @keyframes float{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(10px,-15px) scale(1.05)}}
        @keyframes float-slow{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-8px,10px) scale(1.03)}}
        @keyframes pulse-glow{0%,100%{opacity:.6}50%{opacity:1}}
        @keyframes exLivePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.25)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmerSlide{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}
        @keyframes slide-up{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
        .fade-in{animation:fadeInUp .4s ease both}
        .fade-in-1{animation-delay:.05s}.fade-in-2{animation-delay:.1s}.fade-in-3{animation-delay:.15s}.fade-in-4{animation-delay:.2s}
        .animate-float{animation:float 8s ease-in-out infinite}
        .animate-float-slow{animation:float-slow 10s ease-in-out infinite}
        .animate-pulse-glow{animation:pulse-glow 4s ease-in-out infinite}
        .animate-slide-up{animation:slide-up .3s ease-out}
      `}</style>

      {/* ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 left-1/3 w-[300px] h-[300px] rounded-full animate-float animate-pulse-glow"
          style={{ background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)", filter: "blur(60px)" }}
        />
        <div
          className="absolute bottom-1/3 -right-20 w-[200px] h-[200px] rounded-full animate-float-slow animate-pulse-glow"
          style={{ background: "radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 60%)", filter: "blur(40px)", animationDelay: "2s" }}
        />
      </div>

      <TopBar />

        {/* search */}
        <div className="relative z-20 px-3 mb-2" ref={searchRef}>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300"
            style={{
              background: searchFocused ? "rgba(45,212,191,0.06)" : "rgba(255,255,255,0.04)",
              border: searchFocused ? "1px solid rgba(45,212,191,0.25)" : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Search size={14} className="text-gray-500 shrink-0" />
            <input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={e => {
                if (e.key === "Enter" && searchText.trim()) {
                  setSearchFocused(false);
                  router.push(`/copyTrading?search=${encodeURIComponent(searchText.trim())}`);
                }
              }}
              placeholder="Search traders, tokens…"
              className="bg-transparent text-[12px] text-white placeholder-gray-500 outline-none w-full"
            />
            {searchText && (
              <span onClick={() => { setSearchText(""); setSearchResults([]); }} className="text-[11px] cursor-pointer text-gray-500">
                ✕
              </span>
            )}
          </div>

          {/* search dropdown */}
          {showDropdown && (
            <div
              className="absolute left-3 right-3 top-full mt-1 rounded-xl overflow-hidden shadow-2xl z-50"
              style={{ background: "#111820", border: "1px solid rgba(45,212,191,0.15)", maxHeight: 320, overflowY: "auto" }}
            >
              {searchLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={14} className="text-teal-400 animate-spin" />
                  <span className="text-[10px] text-gray-500 ml-2">Searching…</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-4 text-center text-[10px] text-gray-500">No traders found for &quot;{searchText}&quot;</div>
              ) : (
                searchResults.map(t => (
                  <div
                    key={t.username}
                    onClick={() => goTrader(t.username)}
                    className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors active:bg-white/5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <AvatarEl name={t.username} url={t.avatar_url} sz={30} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-white truncate">{t.display_name || t.username}</span>
                        <GradeBadge grade={t.profit_grade} />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Stat icon={<Target size={7} />} text={`${fmtWr(t.win_rate)}% WR`} />
                        <Stat icon={<BarChart3 size={7} />} text={`${t.total_signals} sig`} />
                      </div>
                    </div>
                    <span className="text-[11px] font-bold" style={{ color: t.avg_return_pct >= 0 ? "#2dd4bf" : "#f43f5e" }}>
                      {t.avg_return_pct >= 0 ? "+" : ""}{t.avg_return_pct.toFixed(1)}%
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* tabs */}
        <div className="relative z-10 px-3 mb-3">
          <div className="flex p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {([
              { key: "discover" as const, label: "Discover", icon: <Flame size={13} /> },
              { key: "mytraders" as const, label: "My Traders", icon: <Users size={13} /> },
            ]).map(t => (
              <div
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex-1 py-2 rounded-md text-center text-[11px] font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5"
                style={{
                  background: tab === t.key ? "rgba(45,212,191,0.15)" : "transparent",
                  color: tab === t.key ? "#2dd4bf" : "rgba(255,255,255,0.4)",
                  border: tab === t.key ? "1px solid rgba(45,212,191,0.3)" : "1px solid transparent",
                }}
              >
                {t.icon}{t.label}
                {t.key === "mytraders" && follows.length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(45,212,191,0.2)", color: "#2dd4bf" }}>
                    {follows.length}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ══════════ DISCOVER ══════════ */}
        {tab === "discover" && (
          <div className="relative z-10 pb-24">
            {/* token sentiment */}
            <div className="px-3 mb-4 fade-in fade-in-1">
              <Hdr icon={<BarChart3 size={14} className="text-teal-400" />} title="Token Sentiment" />
              {sentimentLoading ? (
                <Spin />
              ) : sentiment.length === 0 ? (
                <Empty text="No signal data available yet" />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {sentiment.slice(0, 8).map(tk => (
                    <div
                      key={tk.ticker}
                      onClick={() => setActiveTicker(tk.ticker)}
                      className="rounded-xl p-2.5 relative overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.98]"
                      style={{ background: CB, border: CBR }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[13px] font-extrabold text-white">{tk.ticker}</span>
                        <span className="text-[9px] text-gray-500">{fmtPrice(tk.latest_price)}</span>
                      </div>
                      <div className="flex h-1 rounded-full overflow-hidden mb-1">
                        <div style={{ width: `${tk.bull_pct}%`, background: "#2dd4bf", borderRadius: "2px 0 0 2px" }} />
                        <div style={{ width: `${100 - tk.bull_pct}%`, background: "#f43f5e", borderRadius: "0 2px 2px 0" }} />
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-0.5 text-[8px] text-teal-400 font-medium">
                          <TrendingUp size={8} /> {tk.bull_pct.toFixed(0)}%
                        </span>
                        <span className="flex items-center gap-0.5 text-[8px] text-rose-400 font-medium">
                          {(100 - tk.bull_pct).toFixed(0)}% <TrendingDown size={8} />
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5 pt-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <Stat icon={<Activity size={7} />} text={`${tk.total_signals} signals`} />
                        <span className="text-[8px] font-semibold" style={{ color: tk.avg_pnl >= 0 ? "#2dd4bf" : "#f43f5e" }}>
                          {tk.avg_pnl >= 0 ? "+" : ""}{tk.avg_pnl.toFixed(1)}% avg
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* top traders */}
            <div className="px-3 mb-4 fade-in fade-in-2">
              <Hdr icon={<Trophy size={14} className="text-yellow-400" />} title="Top Traders" action="Leaderboard" onAction={goLeaderboard} />
              {topLoading ? (
                <Spin />
              ) : topTraders.length === 0 ? (
                <Empty text="No traders found" />
              ) : (
                <div className="flex flex-col gap-1.5">
                  {topTraders.slice(0, 5).map((t, i) => (
                    <div
                      key={t.x_handle}
                      onClick={() => goTrader(t.x_handle)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.99] relative overflow-hidden"
                      style={{
                        background: i === 0 ? "linear-gradient(135deg, rgba(45,212,191,0.08), rgba(45,212,191,0.02))" : CB,
                        border: i === 0 ? "1px solid rgba(45,212,191,0.15)" : CBR,
                      }}
                    >
                      {i === 0 && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{ background: "linear-gradient(90deg, transparent, rgba(45,212,191,0.04), transparent)", animation: "shimmerSlide 5s ease-in-out infinite" }}
                        />
                      )}
                      <span className="text-[11px] font-bold w-4 text-center shrink-0" style={{ color: i < 3 ? "#2dd4bf" : "rgba(255,255,255,0.25)" }}>
                        #{i + 1}
                      </span>
                      <AvatarEl name={t.x_handle} url={t.avatar_url} sz={36} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-bold text-white truncate">{t.display_name || t.x_handle}</span>
                          <GradeBadge grade={t.profit_grade} />
                          {i === 0 && (
                            <span
                              className="flex items-center gap-0.5 text-[7px] px-1 py-0.5 rounded font-bold shrink-0"
                              style={{ background: "rgba(251,146,60,0.12)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.25)" }}
                            >
                              <Flame size={7} /> HOT
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Stat icon={<Target size={7} />} text={`${fmtWr(t.win_rate)}%`} />
                          <Stat icon={<BarChart3 size={7} />} text={`${t.total_signals || t.total_tweets} sig`} />
                          {(t.copiers ?? 0) > 0 && <Stat icon={<Users size={7} />} text={`${t.copiers}`} />}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[13px] font-extrabold" style={{ color: (t.avg_return ?? t.results_pct ?? 0) >= 0 ? "#2dd4bf" : "#f43f5e" }}>
                          {(t.avg_return ?? t.results_pct ?? 0) >= 0 ? "+" : ""}{(t.avg_return ?? t.results_pct ?? 0).toFixed(1)}%
                        </div>
                        <div className="text-[8px] text-gray-500">avg return</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* rising */}
            <div className="px-3 mb-4 fade-in fade-in-3">
              <Hdr icon={<ArrowUpRight size={14} className="text-green-400" />} title="Rising This Week" />
              {risingLoading ? (
                <Spin />
              ) : rising.length === 0 ? (
                <Empty text="Not enough data yet" />
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {rising.map((t, i) => (
                    <div
                      key={t.username}
                      onClick={() => goTrader(t.username)}
                      className="shrink-0 rounded-xl p-3 cursor-pointer transition-all duration-200 active:scale-[0.98]"
                      style={{ width: 150, background: CB, border: CBR }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <AvatarEl name={t.username} url={t.avatar_url} sz={32} />
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-bold truncate block">{t.display_name || t.username}</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <GradeBadge grade={t.profit_grade} />
                            {t.points_change > 0 && (
                              <span className="flex items-center gap-0.5 text-[7px] font-bold text-green-400">
                                <ArrowUpRight size={7} />+{t.points_change.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[15px] font-extrabold text-teal-400">+{t.avg_return_pct.toFixed(1)}%</span>
                        <span className="text-[8px] text-gray-500">{fmtWr(t.win_rate)}% WR</span>
                      </div>
                      <div className="h-4 rounded overflow-hidden" style={{ background: "rgba(45,212,191,0.04)" }}>
                        <svg width="100%" height="16" viewBox="0 0 140 16" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id={`rg${i}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d={`M0,${14 - i * 2} C35,${12 - i * 3} 55,${8 - i} 85,${10 - i * 2} S125,${4 + i} 140,${2 + i * 2}`} fill="none" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.5" />
                          <path d={`M0,${14 - i * 2} C35,${12 - i * 3} 55,${8 - i} 85,${10 - i * 2} S125,${4 + i} 140,${2 + i * 2} V16 H0 Z`} fill={`url(#rg${i})`} />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* browse by style */}
            <div className="px-3 mb-4 fade-in fade-in-4">
              <Hdr icon={<Grid3X3 size={14} className="text-purple-400" />} title="Browse by Style" />
              <div className="grid grid-cols-3 gap-1.5">
                {STYLES.map(c => (
                  <div
                    key={c.key}
                    onClick={() => setActiveStyle(c)}
                    className="rounded-xl p-3 text-center cursor-pointer transition-all duration-200 active:scale-[0.97] flex flex-col items-center gap-1"
                    style={{ background: `linear-gradient(135deg, ${c.color}08, ${c.color}02)`, border: `1px solid ${c.color}15` }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${c.color}12` }}>
                      {c.icon}
                    </div>
                    <div className="text-[10px] font-bold text-white">{c.label}</div>
                    <div className="text-[8px] text-gray-500">{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════ MY TRADERS ══════════ */}
        {tab === "mytraders" && (
          <div className="relative z-10 px-3 pb-24">
            {/* sub tabs */}
            <div className="flex gap-2 mb-3">
              {([
                { key: "copying" as const, label: "Copying", icon: <Copy size={12} />, count: copying.length },
                { key: "following" as const, label: "Following", icon: <UserPlus size={12} />, count: following.length },
              ]).map(st => (
                <div
                  key={st.key}
                  onClick={() => setSubTab(st.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200"
                  style={{
                    background: subTab === st.key ? "rgba(45,212,191,0.12)" : "rgba(255,255,255,0.03)",
                    border: subTab === st.key ? "1px solid rgba(45,212,191,0.25)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span style={{ color: subTab === st.key ? "#2dd4bf" : "rgba(255,255,255,0.35)" }}>{st.icon}</span>
                  <span className="text-[11px] font-semibold" style={{ color: subTab === st.key ? "#2dd4bf" : "rgba(255,255,255,0.4)" }}>
                    {st.label}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                    style={{
                      background: subTab === st.key ? "rgba(45,212,191,0.2)" : "rgba(255,255,255,0.06)",
                      color: subTab === st.key ? "#2dd4bf" : "rgba(255,255,255,0.35)",
                    }}
                  >
                    {st.count}
                  </span>
                </div>
              ))}
            </div>

            {followsLoading ? (
              <div className="flex flex-col items-center justify-center pt-20 gap-3">
                <Loader2 size={24} className="text-teal-400 animate-spin" />
                <span className="text-[11px] text-gray-500">Loading…</span>
              </div>
            ) : (() => {
              const list = subTab === "copying" ? copying : following;
              if (list.length === 0)
                return (
                  <div className="rounded-xl p-8 flex flex-col items-center text-center" style={{ background: CB, border: CBR }}>
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {subTab === "copying" ? <Copy size={20} className="text-gray-500" /> : <UserPlus size={20} className="text-gray-500" />}
                    </div>
                    <p className="text-[12px] font-semibold text-white mb-1">
                      {subTab === "copying" ? "No copy trades yet" : "Not following anyone yet"}
                    </p>
                    <p className="text-[10px] text-gray-500">Discover traders in the Explore tab</p>
                  </div>
                );
              return (
                <div className="flex flex-col gap-1.5">
                  {list.map(f => (
                    <div
                      key={f.id}
                      onClick={() => goTrader(f.trader_username)}
                      className="flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.99]"
                      style={{
                        background: f.is_copy_trading ? "linear-gradient(135deg, rgba(45,212,191,0.06), rgba(45,212,191,0.02))" : CB,
                        border: f.is_copy_trading ? "1px solid rgba(45,212,191,0.12)" : CBR,
                      }}
                    >
                      <AvatarEl name={f.trader_username} url={f.avatar_url} sz={40} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[12px] font-bold text-white truncate">{f.display_name || f.trader_username}</span>
                          <GradeBadge grade={f.profit_grade} />
                          {f.is_copy_trading && (
                            <span
                              className="flex items-center gap-0.5 text-[7px] px-1.5 py-0.5 rounded font-bold"
                              style={{ background: "rgba(45,212,191,0.12)", color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.2)" }}
                            >
                              <Copy size={7} /> COPYING
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Stat icon={<Target size={7} />} text={`${fmtWr(f.win_rate)}% WR`} />
                          <Stat icon={<BarChart3 size={7} />} text={`${f.total_signals} signals`} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[14px] font-extrabold" style={{ color: f.avg_return_pct >= 0 ? "#2dd4bf" : "#f43f5e" }}>
                          {f.avg_return_pct >= 0 ? "+" : ""}{f.avg_return_pct.toFixed(1)}%
                        </div>
                        <div className="text-[8px] text-gray-500">avg return</div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* discover CTA */}
            <div
              onClick={() => setTab("discover")}
              className="mt-3 p-4 rounded-xl text-center cursor-pointer transition-all duration-200 active:scale-[0.98] flex flex-col items-center gap-1"
              style={{ border: "1px dashed rgba(45,212,191,0.2)" }}
            >
              <Search size={14} className="text-teal-400" />
              <div className="text-[11px] text-teal-400 font-semibold">Discover More Traders</div>
              <div className="text-[9px] text-gray-500">Browse trending KOLs and top performers</div>
            </div>
          </div>
        )}
      {/* ── overlays ── */}
      {activeStyle && <StyleSheet style={activeStyle} onClose={() => setActiveStyle(null)} goTrader={goTrader} />}
      {activeTicker && <TokenSheet ticker={activeTicker} onClose={() => setActiveTicker(null)} goTrader={goTrader} />}
    </div>
  );
}