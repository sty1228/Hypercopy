"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Loader2, RefreshCw, Activity, X as XIcon,
  TrendingUp, TrendingDown, Network as NetworkIcon, Wifi, WifiOff,
} from "lucide-react";
import {
  getNetworkGraph,
  getNetworkTraderDetail,
  getProfileData,
  type NetworkEdge,
  type NetworkTraderDetailResponse,
  type ProfileDataResponse,
} from "@/service";
import { useNetworkStream, type StreamEvent } from "@/hooks/useNetworkStream";

// ─── canvas geometry ──────────────────────────────────

const W = 360;
const H = 480;
const CX = W / 2;
const CY = H / 2;
const RADIUS = 145;
const KOL_DOT = 22;
const ME_DOT = 28;
const PULSE_DURATION = 1200;
const MAX_KOLS = 12;

const COPY_COLOR = "#2dd4bf";
const COUNTER_COLOR = "#f43f5e";

interface Pulse {
  id: number;
  x0: number; y0: number;
  x1: number; y1: number;
  color: string;
  startedAt: number;
}

interface PositionedEdge extends NetworkEdge {
  angle: number;
  x: number;
  y: number;
}

function fmtUsd(n: number): string {
  const v = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (v >= 1000) return `${sign}$${(v / 1000).toFixed(1)}k`;
  if (v >= 1) return `${sign}$${v.toFixed(0)}`;
  return `${sign}$${v.toFixed(2)}`;
}

function fmtPct01(p: number): string {
  const v = p > 1 ? p : p * 100;
  return `${v.toFixed(0)}%`;
}

// ─── component ────────────────────────────────────────

export default function NetworkPage() {
  const router = useRouter();
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [streamLive, setStreamLive] = useState(false);
  const streamRecvAtRef = useRef<number>(0);

  const [pulses, setPulses] = useState<Pulse[]>([]);
  const pulseIdRef = useRef(1);
  const [now, setNow] = useState(() => Date.now());

  const [profile, setProfile] = useState<ProfileDataResponse | null>(null);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getNetworkGraph();
      setEdges(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);

  useEffect(() => {
    getProfileData().then(setProfile).catch(() => {});
  }, []);

  // positioned edges (top N by exposure, then by open count)
  const positioned: PositionedEdge[] = useMemo(() => {
    const sorted = [...edges].sort(
      (a, b) =>
        b.total_exposure_usd - a.total_exposure_usd ||
        b.open_count - a.open_count,
    );
    const top = sorted.slice(0, MAX_KOLS);
    const n = top.length;
    return top.map((e, i) => {
      const angle = (-Math.PI / 2) + (2 * Math.PI * i) / Math.max(n, 1);
      return {
        ...e,
        angle,
        x: CX + RADIUS * Math.cos(angle),
        y: CY + RADIUS * Math.sin(angle),
      };
    });
  }, [edges]);

  const positionByKey = useMemo(() => {
    const m = new Map<string, PositionedEdge>();
    for (const e of positioned) {
      // key is trader_username + source so copy/counter to same KOL get distinct entries
      m.set(`${e.trader_username}:${e.source}`, e);
    }
    return m;
  }, [positioned]);

  // ─── SSE: drive pulses + refresh graph (debounced) ──

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onStreamEvent = useCallback((evt: StreamEvent) => {
    streamRecvAtRef.current = Date.now();
    setStreamLive(true);

    if (evt.trader_username) {
      const key = `${evt.trader_username}:${evt.source}`;
      const target = positionByKey.get(key);
      if (target) {
        setPulses((prev) => [
          ...prev,
          {
            id: pulseIdRef.current++,
            x0: target.x,
            y0: target.y,
            x1: CX,
            y1: CY,
            color: evt.source === "counter" ? COUNTER_COLOR : COPY_COLOR,
            startedAt: Date.now(),
          },
        ]);
      }
    } else if (evt.source === "manual") {
      // manual trades have no KOL — pulse self-node from a small offset
      setPulses((prev) => [
        ...prev,
        {
          id: pulseIdRef.current++,
          x0: CX,
          y0: CY - 50,
          x1: CX,
          y1: CY,
          color: "#a855f7",
          startedAt: Date.now(),
        },
      ]);
    }

    // debounce graph refresh
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => { fetchGraph(); }, 800);
  }, [positionByKey, fetchGraph]);

  useNetworkStream(onStreamEvent, true);

  // mark stream as stale if no message in 90s (we still get :ping comments,
  // but EventSource doesn't expose them, so this is a heuristic that flips
  // from green to gray after long silence)
  useEffect(() => {
    const iv = setInterval(() => {
      if (streamRecvAtRef.current && Date.now() - streamRecvAtRef.current > 90_000) {
        setStreamLive(false);
      }
    }, 10_000);
    return () => clearInterval(iv);
  }, []);

  // pulse animation loop
  useEffect(() => {
    if (pulses.length === 0) return;
    let raf = 0;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      // prune finished pulses
      setPulses((prev) => prev.filter((p) => t - p.startedAt < PULSE_DURATION + 200));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pulses.length]);

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
      <div className="relative z-10 mt-4 mb-2 flex items-center justify-between px-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:bg-white/10"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <ChevronLeft size={18} className="text-gray-400" />
        </button>
        <div className="flex items-center gap-2">
          <NetworkIcon size={16} className="text-teal-400" />
          <span className="text-base font-semibold text-white">My Network</span>
        </div>
        <button
          onClick={fetchGraph}
          className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:bg-white/10"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <RefreshCw size={14} className="text-gray-400" />
        </button>
      </div>

      {/* Status strip */}
      <div className="relative z-10 px-4 mb-2">
        <div
          className="flex items-center justify-between px-3 py-1.5 rounded-lg"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-1.5">
            {streamLive ? (
              <>
                <Wifi size={11} className="text-teal-400" />
                <span className="text-[10px] text-teal-400">Live</span>
              </>
            ) : (
              <>
                <WifiOff size={11} className="text-gray-500" />
                <span className="text-[10px] text-gray-500">Connecting…</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 rounded-full" style={{ background: COPY_COLOR }} />
              Copy
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 rounded-full" style={{ background: COUNTER_COLOR }} />
              Counter
            </span>
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="relative z-10 px-4 mb-3">
        {loading ? (
          <div
            className="rounded-2xl flex items-center justify-center"
            style={{ height: H, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Loader2 size={22} className="text-teal-400 animate-spin" />
          </div>
        ) : error ? (
          <div
            className="rounded-2xl flex flex-col items-center justify-center gap-2"
            style={{ height: H, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-[12px] text-gray-500">Failed to load network</p>
            <button onClick={fetchGraph} className="text-[11px] text-teal-400 font-semibold">Retry</button>
          </div>
        ) : positioned.length === 0 ? (
          <div
            className="rounded-2xl flex flex-col items-center justify-center text-center gap-2 px-6"
            style={{ height: H, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <NetworkIcon size={28} className="text-gray-600" />
            <p className="text-[13px] text-white font-semibold">Your network is empty</p>
            <p className="text-[11px] text-gray-500">
              Follow some traders from Copy or Explore to start your network.
            </p>
            <button
              onClick={() => router.push("/copyTrading")}
              className="mt-1 px-4 py-1.5 rounded-lg text-[11px] font-bold"
              style={{ background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.3)", color: "#2dd4bf" }}
            >
              Find Traders
            </button>
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden relative"
            style={{
              background: "linear-gradient(180deg, rgba(45,212,191,0.04) 0%, rgba(0,0,0,0.2) 100%)",
              border: "1px solid rgba(45,212,191,0.1)",
            }}
          >
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block" }}>
              {/* faint ring */}
              <circle
                cx={CX}
                cy={CY}
                r={RADIUS}
                fill="none"
                stroke="rgba(255,255,255,0.04)"
                strokeDasharray="2 4"
              />

              {/* edges */}
              {positioned.map((e) => {
                const color = e.source === "counter" ? COUNTER_COLOR : COPY_COLOR;
                const mx = (e.x + CX) / 2;
                const my = (e.y + CY) / 2;
                return (
                  <g key={`edge-${e.trader_username}-${e.source}`}>
                    <line
                      x1={CX} y1={CY} x2={e.x} y2={e.y}
                      stroke={color}
                      strokeOpacity={0.5}
                      strokeWidth={1.5}
                      strokeDasharray={e.copy_mode === "next" ? "5 4" : undefined}
                    />
                    {/* exposure label parallel to edge midpoint */}
                    {e.total_exposure_usd > 0 && (
                      <g transform={`translate(${mx} ${my})`}>
                        <rect
                          x={-22} y={-9}
                          width={44} height={18}
                          rx={9}
                          fill="#0d1117"
                          stroke={color}
                          strokeOpacity={0.5}
                          strokeWidth={1}
                        />
                        <text
                          x={0} y={4}
                          textAnchor="middle"
                          fontSize={10}
                          fontWeight={700}
                          fill={color}
                        >
                          {fmtUsd(e.total_exposure_usd)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* pulses */}
              {pulses.map((p) => {
                const t = Math.min(1, (now - p.startedAt) / PULSE_DURATION);
                const x = p.x0 + (p.x1 - p.x0) * t;
                const y = p.y0 + (p.y1 - p.y0) * t;
                const opacity = 1 - t * 0.4;
                return (
                  <g key={p.id} pointerEvents="none">
                    <circle cx={x} cy={y} r={10} fill={p.color} opacity={opacity * 0.18} />
                    <circle cx={x} cy={y} r={5} fill={p.color} opacity={opacity} />
                  </g>
                );
              })}

              {/* KOL nodes */}
              {positioned.map((e) => {
                const color = e.source === "counter" ? COUNTER_COLOR : COPY_COLOR;
                // open-count bars
                const bars = Math.min(e.open_count, 6);
                return (
                  <g
                    key={`node-${e.trader_username}-${e.source}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelected(e.trader_username)}
                  >
                    {/* halo when open positions exist */}
                    {e.open_count > 0 && (
                      <circle cx={e.x} cy={e.y} r={KOL_DOT + 6} fill={color} opacity={0.15}>
                        <animate
                          attributeName="r"
                          values={`${KOL_DOT + 4};${KOL_DOT + 10};${KOL_DOT + 4}`}
                          dur="2.4s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.05;0.18;0.05"
                          dur="2.4s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                    <circle
                      cx={e.x}
                      cy={e.y}
                      r={KOL_DOT}
                      fill="#0d1117"
                      stroke={color}
                      strokeWidth={2}
                    />
                    {e.avatar_url ? (
                      <>
                        <defs>
                          <clipPath id={`clip-${e.trader_username}-${e.source}`}>
                            <circle cx={e.x} cy={e.y} r={KOL_DOT - 2} />
                          </clipPath>
                        </defs>
                        <image
                          href={e.avatar_url}
                          x={e.x - (KOL_DOT - 2)}
                          y={e.y - (KOL_DOT - 2)}
                          width={(KOL_DOT - 2) * 2}
                          height={(KOL_DOT - 2) * 2}
                          clipPath={`url(#clip-${e.trader_username}-${e.source})`}
                          preserveAspectRatio="xMidYMid slice"
                        />
                      </>
                    ) : (
                      <text
                        x={e.x}
                        y={e.y + 4}
                        textAnchor="middle"
                        fontSize={12}
                        fontWeight={800}
                        fill={color}
                      >
                        {e.trader_username[0]?.toUpperCase()}
                      </text>
                    )}
                    {/* open-position bars */}
                    {bars > 0 && (() => {
                      const bx = e.x + (Math.cos(e.angle) >= 0 ? KOL_DOT + 4 : -KOL_DOT - 4 - bars * 4);
                      const by = e.y + KOL_DOT + 2;
                      return (
                        <g>
                          {Array.from({ length: bars }).map((_, i) => (
                            <rect
                              key={i}
                              x={bx + i * 4}
                              y={by - (i + 2) * 2}
                              width={3}
                              height={(i + 2) * 2}
                              fill={color}
                              opacity={0.85}
                              rx={0.5}
                            />
                          ))}
                          {e.open_count > bars && (
                            <text
                              x={bx + bars * 4 + 2}
                              y={by}
                              fontSize={8}
                              fontWeight={700}
                              fill={color}
                            >
                              +{e.open_count - bars}
                            </text>
                          )}
                        </g>
                      );
                    })()}
                    {/* username label */}
                    <text
                      x={e.x}
                      y={e.y + KOL_DOT + 14}
                      textAnchor="middle"
                      fontSize={9.5}
                      fontWeight={700}
                      fill="rgba(255,255,255,0.7)"
                    >
                      @{e.trader_username.length > 12 ? e.trader_username.slice(0, 11) + "…" : e.trader_username}
                    </text>
                    {/* copy_mode badge */}
                    {e.copy_mode === "next" && (
                      <g transform={`translate(${e.x} ${e.y - KOL_DOT - 4})`}>
                        <rect x={-15} y={-7} width={30} height={12} rx={6} fill={color} opacity={0.18} />
                        <text x={0} y={2} textAnchor="middle" fontSize={7} fontWeight={800} fill={color}>NEXT</text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* user (me) node — center */}
              <g>
                <circle cx={CX} cy={CY} r={ME_DOT + 6} fill="#2dd4bf" opacity={0.12}>
                  <animate
                    attributeName="r"
                    values={`${ME_DOT + 4};${ME_DOT + 10};${ME_DOT + 4}`}
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx={CX} cy={CY} r={ME_DOT} fill="#0d1117" stroke="#2dd4bf" strokeWidth={2} />
                <text
                  x={CX}
                  y={CY + 4}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={800}
                  fill="#2dd4bf"
                >
                  {profile?.name
                    ? profile.name.length > 4
                      ? profile.name.slice(0, 3).toUpperCase()
                      : profile.name.toUpperCase()
                    : "ME"}
                </text>
                <text
                  x={CX}
                  y={CY + ME_DOT + 14}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={700}
                  fill="rgba(255,255,255,0.85)"
                >
                  {profile?.twitterId ? `@${profile.twitterId}` : "You"}
                </text>
                {profile && (
                  <text
                    x={CX}
                    y={CY + ME_DOT + 26}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight={600}
                    fill="rgba(45,212,191,0.7)"
                  >
                    ${profile.accountValue.toFixed(0)}
                  </text>
                )}
              </g>
            </svg>
          </div>
        )}
      </div>

      {/* List below the graph */}
      {!loading && !error && positioned.length > 0 && (
        <div className="relative z-10 px-4 pb-24">
          <div className="text-[11px] text-gray-500 mb-2 uppercase tracking-wider">
            All Connections ({edges.length})
          </div>
          <div className="space-y-1.5">
            {edges.map((e) => {
              const color = e.source === "counter" ? COUNTER_COLOR : COPY_COLOR;
              return (
                <div
                  key={`${e.trader_username}-${e.source}`}
                  onClick={() => setSelected(e.trader_username)}
                  className="rounded-xl p-2.5 flex items-center gap-2.5 cursor-pointer transition-all active:scale-[0.99]"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: `1px solid ${color}1f`,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm overflow-hidden"
                    style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}
                  >
                    {e.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={e.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(ev) => { (ev.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      e.trader_username[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[12px] font-bold text-white truncate">
                        {e.display_name || e.trader_username}
                      </span>
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase"
                        style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}
                      >
                        {e.source}
                      </span>
                      {e.copy_mode === "next" && (
                        <span
                          className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                          style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}
                        >
                          NEXT 1
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {e.open_count} open · {e.trade_count} total · {fmtPct01(e.win_rate)} WR
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[12px] font-extrabold" style={{ color }}>
                      {fmtUsd(e.total_exposure_usd)}
                    </div>
                    <div
                      className={`text-[10px] font-semibold ${e.pnl_usd >= 0 ? "text-teal-400/80" : "text-rose-400/80"}`}
                    >
                      {e.pnl_usd >= 0 ? "+" : ""}{fmtUsd(e.pnl_usd)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selected && (
        <TraderDetailSheet
          trader={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ─── detail sheet ─────────────────────────────────────

function TraderDetailSheet({ trader, onClose }: { trader: string; onClose: () => void }) {
  const [data, setData] = useState<NetworkTraderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    getNetworkTraderDetail(trader)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [trader]);

  useEffect(() => { load(); }, [load]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative w-full max-w-[600px] flex flex-col rounded-t-2xl overflow-hidden animate-slide-up"
        style={{ background: "#0d1117", borderTop: "1px solid rgba(255,255,255,0.1)", maxHeight: "85vh" }}
      >
        <style jsx>{`
          @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
          .animate-slide-up { animation: slide-up .3s ease-out; }
        `}</style>

        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm overflow-hidden"
              style={{ background: "rgba(45,212,191,0.12)", color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.3)" }}
            >
              {data?.aggregates[0]?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.aggregates[0].avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                trader[0]?.toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">@{trader}</div>
              {data?.aggregates[0]?.display_name && (
                <div className="text-[10px] text-gray-500 truncate">{data.aggregates[0].display_name}</div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <XIcon size={14} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={18} className="text-teal-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-[12px] text-gray-500 mb-2">Failed to load</p>
              <button onClick={load} className="text-[11px] text-teal-400 font-semibold">Retry</button>
            </div>
          ) : data ? (
            <>
              {/* aggregate cards (one per source) */}
              {data.aggregates.map((a) => {
                const color = a.source === "counter" ? COUNTER_COLOR : COPY_COLOR;
                return (
                  <div
                    key={a.source}
                    className="rounded-xl p-3"
                    style={{ background: `${color}0a`, border: `1px solid ${color}25` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase"
                        style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}
                      >
                        {a.source} {a.copy_mode === "next" ? "· next 1" : ""}
                      </span>
                      <span className="text-[11px] font-extrabold" style={{ color }}>
                        {fmtUsd(a.total_exposure_usd)} exposure
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <Stat label="Trades" value={String(a.trade_count)} />
                      <Stat label="Open" value={String(a.open_count)} />
                      <Stat
                        label="W / L"
                        value={`${a.win_count} / ${a.loss_count}`}
                      />
                      <Stat
                        label="Win Rate"
                        value={fmtPct01(a.win_rate)}
                        valueColor="#2dd4bf"
                      />
                    </div>
                    <div className="mt-2 pt-2 flex justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <span className="text-[10px] text-gray-500">Realized PnL</span>
                      <span
                        className={`text-[11px] font-bold ${a.pnl_usd >= 0 ? "text-teal-400" : "text-rose-400"}`}
                      >
                        {a.pnl_usd >= 0 ? "+" : ""}{fmtUsd(a.pnl_usd)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* open trades */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Activity size={12} className="text-teal-400" />
                  <span className="text-[11px] font-bold text-white">Open Positions</span>
                  <span className="text-[10px] text-gray-500">({data.open_trades.length})</span>
                </div>
                {data.open_trades.length === 0 ? (
                  <div
                    className="rounded-xl py-6 text-center"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <p className="text-[11px] text-gray-500">No open trades from this trader yet</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {data.open_trades.map((t) => {
                      const isWin = t.current_pnl_usd >= 0;
                      return (
                        <div
                          key={t.id}
                          className="rounded-lg p-2.5 flex items-center justify-between"
                          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-md flex items-center justify-center ${t.direction === "long" ? "bg-teal-400/10" : "bg-rose-400/10"}`}
                            >
                              {t.direction === "long"
                                ? <TrendingUp size={12} className="text-teal-400" />
                                : <TrendingDown size={12} className="text-rose-400" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[12px] font-bold text-white">{t.ticker}</span>
                                <span
                                  className={`text-[8px] px-1 py-0.5 rounded capitalize ${t.direction === "long" ? "bg-teal-400/10 text-teal-400" : "bg-rose-400/10 text-rose-400"}`}
                                >
                                  {t.direction}
                                </span>
                              </div>
                              <div className="text-[9px] text-gray-500">
                                ${t.size_usd.toFixed(2)} · {t.leverage}× · entry ${t.entry_price.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-[12px] font-bold ${isWin ? "text-teal-400" : "text-rose-400"}`}>
                              {isWin ? "+" : ""}{fmtUsd(t.current_pnl_usd)}
                            </div>
                            <div className={`text-[9px] ${isWin ? "text-teal-400/70" : "text-rose-400/70"}`}>
                              {t.current_pnl_pct >= 0 ? "+" : ""}{t.current_pnl_pct.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div>
      <div className="text-[8px] text-gray-500 uppercase tracking-wider">{label}</div>
      <div className="text-[12px] font-extrabold" style={{ color: valueColor || "#fff" }}>{value}</div>
    </div>
  );
}
