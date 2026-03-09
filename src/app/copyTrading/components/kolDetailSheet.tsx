"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import {
  LeaderboardItem,
  UserSignalResponse,
  UserSignalItem,
  userSignals,
  followTrader,
  checkFollowStatus,
  toggleCopyTrading,
  toggleCounterTrading,
  updateDefaultSettings,
  getDefaultSettings,
  DefaultFollowSettings,
  getWalletBalance,
  placeSignalTrade,
} from "@/service";
import BigNumber from "bignumber.js";
import SignalItem from "./signalItem";
import SignalDetailSheet, { SignalDetailData } from "./signalDetailSheet";
import { useRewards } from "@/providers/RewardsContext";
import { toast } from "sonner";

const LS_HAS_COPIED = "hc_has_copied_before";

function markHasCopied(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_HAS_COPIED, "1");
}

// ═══════════════════════════════════════════════════════════════
//  QUICK SETTINGS SHEET
// ═══════════════════════════════════════════════════════════════

function QuickSettingsSheet({
  traderName,
  action,
  onConfirm,
  onClose,
}: {
  traderName: string;
  action: "copy" | "counter";
  onConfirm: (cfg: any) => Promise<void>;
  onClose: () => void;
}) {
  const [sizeVal, setSizeVal] = useState(10);
  const [sizeType, setSizeType] = useState<"USD" | "PCT">("PCT");
  const [leverage, setLeverage] = useState(8);
  const [tpVal, setTpVal] = useState(15);
  const [tpType, setTpType] = useState<"USD" | "PCT">("PCT");
  const [slVal, setSlVal] = useState(35);
  const [slType, setSlType] = useState<"USD" | "PCT">("PCT");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  // ★ Pre-load saved global settings
  useEffect(() => {
    getDefaultSettings()
      .then(s => {
        if (s.tradeSize)     setSizeVal(s.tradeSize);
        if (s.tradeSizeType) setSizeType(s.tradeSizeType);
        if (s.leverage)      setLeverage(s.leverage);
        if (s.tp?.value)     setTpVal(s.tp.value);
        if (s.tp?.type)      setTpType(s.tp.type);
        if (s.sl?.value)     setSlVal(s.sl.value);
        if (s.sl?.type)      setSlType(s.sl.type);
      })
      .catch(() => {});
  }, []);

  const handleClose = () => { setVisible(false); setTimeout(onClose, 300); };
  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm({ sizeVal, sizeType, leverage, tpVal, tpType, slVal, slType });
    } finally {
      setLoading(false);
    }
  };

  const TypeToggle = ({
    val, onChange, accent = "rgba(45,212,191,1)",
  }: { val: string; onChange: (v: "USD" | "PCT") => void; accent?: string }) => (
    <div className="flex gap-1">
      {(["$", "%"] as const).map(t => {
        const mapped = t === "$" ? "USD" : "PCT";
        const active = val === mapped;
        return (
          <button
            key={t}
            onClick={() => onChange(mapped)}
            className="w-8 h-8 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: active ? `${accent}18` : "rgba(255,255,255,0.04)",
              color: active ? accent : "rgba(255,255,255,0.25)",
              border: active ? `1px solid ${accent}35` : "1px solid transparent",
            }}
          >
            {t}
          </button>
        );
      })}
    </div>
  );

  const isCopy = action === "copy";
  const accentColor = isCopy ? "rgba(45,212,191,1)" : "rgba(244,63,94,1)";

  const content = (
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: 9998 }}>
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />
      <div
        className="relative w-full transition-transform duration-300 ease-out"
        style={{
          maxWidth: 393,
          background: "linear-gradient(180deg, #111820 0%, #0d1117 100%)",
          borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "none",
          maxHeight: "90vh",
          overflowY: "auto",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
        }}
      >
        <div className="p-5 pb-8">
          <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "rgba(255,255,255,0.12)" }} />

          {/* Header card */}
          <div
            className="rounded-2xl p-4 mb-5 relative overflow-hidden"
            style={{
              background: isCopy
                ? "linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(45,212,191,0.02) 100%)"
                : "linear-gradient(135deg, rgba(244,63,94,0.06) 0%, rgba(244,63,94,0.02) 100%)",
              border: isCopy ? "1px solid rgba(45,212,191,0.12)" : "1px solid rgba(244,63,94,0.12)",
            }}
          >
            <div
              className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${accentColor}10, transparent 70%)`, filter: "blur(20px)" }}
            />
            <div className="relative">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
                  style={{
                    background: isCopy
                      ? "linear-gradient(135deg, #06b6d4, #2dd4bf)"
                      : "linear-gradient(135deg, #f43f5e, #fb7185)",
                    color: "#fff",
                  }}
                >
                  {traderName[0]?.toUpperCase()}
                </div>
                <h3 className="text-white text-sm font-bold m-0 leading-tight">
                  {isCopy ? "Copy" : "Counter"} @{traderName}
                </h3>
              </div>
              <p className="text-xs leading-relaxed m-0" style={{ color: "rgba(255,255,255,0.4)" }}>
                When this trader makes a call, we&apos;ll automatically{" "}
                {isCopy ? "mirror" : "take the opposite of"} their trade for you.
              </p>
            </div>
          </div>

          {/* Trade Settings */}
          <div className="mb-1.5">
            <div className="flex items-center gap-2 mb-3 pl-0.5">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>
                Trade Settings
              </span>
            </div>
            <div
              className="flex items-center justify-between px-4 py-3.5 rounded-xl mb-2"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Trade Size</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={sizeVal}
                  onChange={e => setSizeVal(Number(e.target.value) || 0)}
                  className="w-16 text-right bg-transparent border-none outline-none text-base font-bold"
                  style={{ color: accentColor }}
                />
                <TypeToggle val={sizeType} onChange={setSizeType} accent={accentColor} />
              </div>
            </div>
            <div
              className="px-4 py-3.5 rounded-xl mb-5"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Leverage</span>
                <span className="text-base font-bold" style={{ color: accentColor }}>{leverage}x</span>
              </div>
              <input
                type="range" min={1} max={20} value={leverage}
                onChange={e => setLeverage(Number(e.target.value))}
                className="w-full"
                style={{ accentColor }}
              />
              <div className="flex justify-between mt-1 text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                <span>1x</span><span>5x</span><span>10x</span><span>15x</span><span>20x</span>
              </div>
            </div>

            {/* Risk Management */}
            <div className="flex items-center gap-2 mb-3 pl-0.5">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>
                Risk Management
              </span>
            </div>
            <div
              className="flex items-center justify-between px-4 py-3.5 rounded-xl mb-2"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Stop Loss</span>
              <div className="flex items-center gap-2">
                <input
                  type="number" value={slVal}
                  onChange={e => setSlVal(Number(e.target.value) || 0)}
                  className="w-16 text-right bg-transparent border-none outline-none text-base font-bold"
                  style={{ color: "#fb7185" }}
                />
                <TypeToggle val={slType} onChange={setSlType} accent="#fb7185" />
              </div>
            </div>
            <div
              className="flex items-center justify-between px-4 py-3.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Take Profit</span>
              <div className="flex items-center gap-2">
                <input
                  type="number" value={tpVal}
                  onChange={e => setTpVal(Number(e.target.value) || 0)}
                  className="w-16 text-right bg-transparent border-none outline-none text-base font-bold"
                  style={{ color: "#34d399" }}
                />
                <TypeToggle val={tpType} onChange={setTpType} accent="#34d399" />
              </div>
            </div>
          </div>

          {/* Summary pill */}
          <div
            className="flex items-center justify-center gap-1.5 py-2.5 mt-4 mb-4 rounded-full text-[11px]"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)" }}
          >
            <span>{sizeType === "PCT" ? `${sizeVal}%` : `$${sizeVal}`} per trade</span>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
            <span>{leverage}x</span>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
            <span>SL {slType === "PCT" ? `${slVal}%` : `$${slVal}`}</span>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
            <span>TP {tpType === "PCT" ? `${tpVal}%` : `$${tpVal}`}</span>
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full py-4 rounded-2xl text-sm font-bold transition-all duration-300"
            style={{
              background: loading ? "rgba(255,255,255,0.05)"
                : isCopy ? "linear-gradient(135deg, #2dd4bf, #14b8a6)"
                : "linear-gradient(135deg, #f43f5e, #e11d48)",
              color: loading ? "rgba(255,255,255,0.3)" : isCopy ? "#000" : "#fff",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : `0 0 30px ${accentColor}25`,
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Setting up...
              </span>
            ) : `Start ${isCopy ? "Copying" : "Countering"} @${traderName}`}
          </button>
          <p
            className="text-center text-[10px] mt-3 mb-0"
            style={{ color: "rgba(255,255,255,0.18)", lineHeight: 1.5 }}
          >
            You can adjust these anytime in Settings · Only risk what you can afford
          </p>
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(content, document.body);
}


// ═══════════════════════════════════════════════════════════════
//  SUCCESS SHEET
// ═══════════════════════════════════════════════════════════════

function ConfettiCanvas({ accent }: { accent: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const W = 393, H = 520;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    const colors = [accent, "#fbbf24", "#a78bfa", "#fb7185", "#38bdf8", "#34d399", "#f472b6"];
    interface P { x: number; y: number; vx: number; vy: number; w: number; h: number; rot: number; vr: number; color: string; opacity: number; gravity: number }
    const particles: P[] = [];
    for (let i = 0; i < 90; i++) {
      particles.push({
        x: W / 2 + (Math.random() - 0.5) * 40, y: H * 0.22,
        vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 16 - 5,
        w: Math.random() * 5 + 2, h: Math.random() * 10 + 5,
        rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 1, gravity: 0.22 + Math.random() * 0.12,
      });
    }
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of particles) {
        if (p.opacity <= 0) continue;
        alive = true;
        p.x += p.vx; p.vy += p.gravity; p.y += p.vy; p.vx *= 0.99; p.rot += p.vr;
        if (p.y > H * 0.85) p.opacity -= 0.025;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.opacity); ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [accent]);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }} />;
}

function SuccessSheet({
  traderName, action, onViewRewards, onDone,
}: { traderName: string; action: "copy" | "counter"; onViewRewards: () => void; onDone: () => void }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const isCopy = action === "copy";
  const accent = isCopy ? "#2dd4bf" : "#fb7185";

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t1 = setTimeout(() => setStep(1), 350);
    const t2 = setTimeout(() => setStep(2), 600);
    const t3 = setTimeout(() => setStep(3), 850);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleDone    = () => { setVisible(false); setTimeout(onDone, 300); };
  const handleRewards = () => { setVisible(false); setTimeout(onViewRewards, 300); };

  const content = (
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: 9999 }}>
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", opacity: visible ? 1 : 0 }}
      />
      <div
        className="relative w-full transition-transform duration-300 ease-out"
        style={{
          maxWidth: 393, background: "#0d1117",
          borderRadius: "20px 20px 0 0",
          border: "1px solid rgba(255,255,255,0.06)", borderBottom: "none",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.6)", overflow: "hidden",
        }}
      >
        <div style={{ height: 3, borderRadius: "20px 20px 0 0", background: isCopy ? "linear-gradient(90deg, transparent, #2dd4bf, transparent)" : "linear-gradient(90deg, transparent, #f43f5e, transparent)", opacity: 0.6 }} />
        <ConfettiCanvas accent={accent} />
        <div className="absolute pointer-events-none" style={{ top: -40, left: "50%", transform: "translateX(-50%)", width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle, ${accent}10, transparent 70%)`, filter: "blur(40px)" }} />
        <div className="relative text-center px-6 pt-6 pb-8">
          <div className="mx-auto mb-5 relative" style={{ width: 72, height: 72 }}>
            <div className="absolute inset-0 rounded-full" style={{ border: `1.5px solid ${accent}`, opacity: step >= 1 ? 0 : 0.3, transform: step >= 1 ? "scale(2)" : "scale(1)", transition: "all 0.8s ease-out" }} />
            <div className="absolute inset-0 rounded-full flex items-center justify-center" style={{ background: `${accent}0a`, border: `1px solid ${accent}25`, transform: step >= 1 ? "scale(1)" : "scale(0.6)", opacity: step >= 1 ? 1 : 0, transition: "all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? "scale(1)" : "scale(0.4)", transition: "all 0.35s ease-out 0.15s" }}>
                <path d="M20 6L9 17l-5-5" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div style={{ opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? "translateY(0)" : "translateY(8px)", transition: "all 0.4s ease-out 0.1s" }}>
            <p className="m-0 mb-1" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
              You&apos;re now {isCopy ? "copying" : "countering"}
            </p>
            <h3 className="m-0 mb-3" style={{ fontSize: 22, fontWeight: 800, color: accent, letterSpacing: "-0.02em" }}>
              @{traderName}
            </h3>
            <p className="m-0 mb-6 leading-relaxed" style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
              Trades execute automatically when they make a call.
            </p>
          </div>
          <div className="rounded-xl p-4 mb-6 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? "translateY(0)" : "translateY(12px)", transition: "all 0.45s ease-out" }}>
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${accent}10, transparent 70%)`, filter: "blur(10px)" }} />
            <div className="relative">
              <div className="flex items-baseline justify-center gap-2 mb-1">
                <span style={{ fontSize: 28, fontWeight: 800, color: accent, letterSpacing: "-0.02em" }}>+50</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>points earned</span>
              </div>
              <p className="m-0" style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Earn on every trade · Top performers share platform fees</p>
            </div>
          </div>
          <div style={{ opacity: step >= 3 ? 1 : 0, transform: step >= 3 ? "translateY(0)" : "translateY(8px)", transition: "all 0.4s ease-out" }}>
            <button onClick={handleRewards} className="w-full py-3.5 rounded-xl text-[13px] font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: isCopy ? "linear-gradient(135deg, #2dd4bf, #14b8a6)" : "linear-gradient(135deg, #f43f5e, #e11d48)", color: isCopy ? "#000" : "#fff", border: "none", boxShadow: `0 4px 24px ${accent}30`, letterSpacing: "0.01em" }}>
              View Rewards Program
            </button>
            <button onClick={handleDone} className="w-full mt-2 py-2.5 text-[11px] transition-all" style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.2)" }}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  if (typeof window === "undefined") return null;
  return createPortal(content, document.body);
}


// ═══════════════════════════════════════════════════════════════
//  MAIN: KolDetailSheet
// ═══════════════════════════════════════════════════════════════

export default function KolDetailSheet({
  data,
  isOpen,
  handleClose,
}: {
  data: LeaderboardItem;
  isOpen: boolean;
  handleClose: () => void;
}) {
  const [userSignalsData, setUserSignalsData] = useState<UserSignalResponse | null>(null);
  const [currentClickItemId, setCurrentClickItemId] = useState<number | null>(null);
  const [showSettings, setShowSettings]   = useState(false);
  const [showSuccess, setShowSuccess]     = useState(false);
  const [copyAction, setCopyAction]       = useState<"copy" | "counter">("copy");
  const [followMode, setFollowMode]       = useState<"copy" | "counter" | null>(null);
  const [toggling, setToggling]           = useState(false);
  const [imgError, setImgError]           = useState(false);

  const [detailSignal, setDetailSignal]   = useState<SignalDetailData | null>(null);
  const [detailOpen, setDetailOpen]       = useState(false);
  const [tradingSignal, setTradingSignal] = useState(false);

  const { authenticated, login }            = usePrivy();
  const { triggerFirstCopyTrade, viewRewardsFromPrompt } = useRewards();
  const router = useRouter();

  const isFollowed = followMode !== null;

  useEffect(() => {
    if (isOpen) {
      setImgError(false);
      fetchUserSignals();
      checkIfFollowed();
    } else {
      const t = setTimeout(() => {
        setUserSignalsData(null);
        setCurrentClickItemId(null);
        setDetailOpen(false);
        setDetailSignal(null);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const fetchUserSignals = async () => {
    try {
      const response = await userSignals(data.x_handle);
      setUserSignalsData(response);
    } catch (e) {
      console.error("Failed to fetch signals:", e);
    }
  };

  const checkIfFollowed = async () => {
    try {
      const status = await checkFollowStatus(data.x_handle);
      if (status?.is_copy_trading) {
        setFollowMode("copy");
      } else if (status?.is_counter_trading) {
        setFollowMode("counter");
      } else {
        setFollowMode(null);
      }
    } catch {
      setFollowMode(null);
    }
  };

  const handleCopyAction = async (action: "copy" | "counter") => {
    if (!authenticated) { login(); return; }

    if (followMode === action) {
      setToggling(true);
      try {
        if (action === "copy") {
          await toggleCopyTrading(data.x_handle);
        } else {
          await toggleCounterTrading(data.x_handle);
        }
        setFollowMode(null);
      } catch (e) {
        console.error("Failed to stop trading:", e);
        toast.error("Failed to stop. Please try again.");
      } finally {
        setToggling(false);
      }
      return;
    }

    try {
      const bal = await getWalletBalance();
      if (bal.hl_equity < 5) {
        toast.error(`Balance too low ($${bal.hl_equity.toFixed(2)}). Please deposit first.`);
        router.push("/dashboard?deposit=1");
        return;
      }
    } catch {
      toast.error("Please deposit funds before starting copy trading.");
      router.push("/dashboard?deposit=1");
      return;
    }

    setCopyAction(action);
    setShowSettings(true);
  };

  const handleSettingsConfirm = async (cfg: any) => {
    try {
      const payload: DefaultFollowSettings = {
        tradeSizeType: cfg.sizeType,
        tradeSize: cfg.sizeVal,
        leverage: cfg.leverage,
        leverageType: "cross",
        tp: { type: cfg.tpType, value: cfg.tpVal },
        sl: { type: cfg.slType, value: cfg.slVal },
        orderType: "market",
      };
      await updateDefaultSettings(payload);

      const isCopy    = copyAction === "copy";
      const isCounter = copyAction === "counter";
      await followTrader(data.x_handle, isCopy, isCounter);

      markHasCopied();
      setShowSettings(false);
      setFollowMode(copyAction);
      setTimeout(() => { setShowSuccess(true); triggerFirstCopyTrade(); }, 200);
    } catch (e: any) {
      console.error("Copy setup failed:", e);
      toast.error(e?.message || "Failed to start copy trading. Please try again.");
    }
  };

  const handleSignalTrade = async (signal: SignalDetailData, side: "copy" | "counter") => {
    if (!signal.signal_id) return;
    setTradingSignal(true);
    try {
      const result = await placeSignalTrade(signal.signal_id as number, side);
      toast.success(
        `${result.direction === "long" ? "↑ Long" : "↓ Short"} ${result.ticker} placed · $${result.size_usd.toFixed(0)} @ $${result.entry_price.toFixed(2)}`
      );
      setDetailOpen(false);
    } catch (err: any) {
      const detail: string = err?.response?.data?.detail || err?.message || "";
      if (detail === "insufficient_balance") {
        toast.error("Insufficient balance. Please deposit funds.");
        router.push("/dashboard?deposit=1");
      } else {
        toast.error(detail || "Failed to place order");
      }
    } finally {
      setTradingSignal(false);
    }
  };

  const handleViewRewards = () => {
    setShowSuccess(false);
    viewRewardsFromPrompt();
    router.push("/dashboard");
  };

  const profit      = data?.results_pct || 0;
  const isPositive  = profit >= 0;
  const displayName = data?.display_name || data?.x_handle || "";
  const showAvatar  = !!data?.avatar_url && !imgError;

  if (!data) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 z-40 transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className={`absolute inset-0 z-50 transition-transform duration-500 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)" }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 left-1/3 w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)", filter: "blur(60px)" }} />
          <div className="absolute bottom-1/3 -right-20 w-[200px] h-[200px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 60%)", filter: "blur(40px)" }} />
        </div>

        <div className="relative z-10 h-full overflow-y-auto">

          {/* Header */}
          <div className="mt-4 mb-3 flex items-center justify-between px-4">
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:bg-white/10"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-base font-semibold text-white">{displayName}</span>
            <div className="w-10" />
          </div>

          {/* Profile Card */}
          <div className="px-4">
            <div
              className="rounded-2xl p-4 mb-4 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(45,212,191,0.01) 100%)",
                border: "1px solid rgba(45,212,191,0.2)",
                boxShadow: "0 0 30px rgba(45,212,191,0.1), inset 0 0 40px rgba(45,212,191,0.03)",
              }}
            >
              <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: "radial-gradient(ellipse at top left, rgba(45,212,191,0.15) 0%, transparent 60%)" }} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {showAvatar ? (
                      <img
                        src={data.avatar_url!}
                        alt={displayName}
                        className="w-14 h-14 rounded-2xl object-cover shrink-0"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl text-white shrink-0"
                        style={{ background: data.avatarColor || "linear-gradient(135deg, #06b6d4, #3b82f6)" }}
                      >
                        {displayName[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div>
                      <div className="text-white font-semibold">{displayName}</div>
                      <div className="text-gray-500 text-xs">@{data.x_handle}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-lg font-bold ${isPositive ? "text-teal-400" : "text-rose-400"}`}
                      style={{ textShadow: isPositive ? "0 0 10px rgba(45,212,191,0.3)" : "0 0 10px rgba(251,113,133,0.3)" }}
                    >
                      {isPositive ? "+" : ""}{new BigNumber(profit).decimalPlaces(2).toNumber()}%
                    </div>
                    <div className="text-[9px] text-gray-600 uppercase tracking-wide mt-0.5">SPOT PNL</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: "Result", val: `${isPositive ? "+" : ""}${new BigNumber(profit).decimalPlaces(2).toNumber()}%`, color: isPositive ? "text-teal-400" : "text-rose-400" },
                    { label: "Streak", val: String(data.streak || 0), color: "text-white" },
                    { label: "Grade",  val: data.profit_grade || "-", gold: true },
                  ].map(item => (
                    <div key={item.label} className="text-center py-3 rounded-xl" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div
                        className={`text-sm font-bold ${item.gold ? "" : item.color}`}
                        style={item.gold ? { background: "linear-gradient(135deg, #ffd700 0%, #ffec8b 25%, #ffd700 50%, #daa520 75%, #ffd700 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } : {}}
                      >
                        {item.val}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>

                {/* ★ FIX: "Copy All" → "Copy Future Trades", "Counter All" → "Counter Future Trades" */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleCopyAction("counter")}
                    disabled={toggling}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: followMode === "counter" ? "rgba(244,63,94,0.25)" : "rgba(244,63,94,0.12)",
                      border: "1px solid rgba(244,63,94,0.25)",
                      opacity: toggling ? 0.5 : 1,
                    }}
                  >
                    <span className="text-rose-400">
                      {toggling && followMode === "counter" ? "Stopping…" : followMode === "counter" ? "Countering ✓" : "Counter Future Trades"}
                    </span>
                  </button>
                  <button
                    onClick={() => handleCopyAction("copy")}
                    disabled={toggling}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: followMode === "copy" ? "rgba(45,212,191,0.25)" : "rgba(45,212,191,0.12)",
                      border: "1px solid rgba(45,212,191,0.25)",
                      opacity: toggling ? 0.5 : 1,
                    }}
                  >
                    <span className="text-teal-400">
                      {toggling && followMode === "copy" ? "Stopping…" : followMode === "copy" ? "Copying ✓" : "Copy Future Trades"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Signals Header */}
          <div className="px-4 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M12 20v-8" />
              <circle cx="12" cy="9" r="3" fill="currentColor" stroke="none" />
              <path d="M8.5 8.5a5 5 0 0 1 7 0" />
              <path d="M6 6a8 8 0 0 1 12 0" />
              <path d="M3.5 3.5a11 11 0 0 1 17 0" />
            </svg>
            <span className="text-white text-sm font-semibold">Signals</span>
            <span className="text-gray-500 text-xs">({userSignalsData?.tweetsCount || 0})</span>
          </div>

          {/* Signals List */}
          <div className="px-4 space-y-4 pb-24">
            {userSignalsData?.signals.map((signal, index) => (
              <SignalItem
                key={signal.signal_id}
                data={signal}
                index={index}
                currentClickItemId={currentClickItemId}
                onClick={() => setCurrentClickItemId(
                  currentClickItemId === signal.signal_id ? null : signal.signal_id
                )}
                onDetail={(sig: UserSignalItem) => {
                  setDetailSignal({
                    ticker:          sig.ticker,
                    direction:       sig.bull_or_bear,
                    pct_change:      sig.change_since_tweet,
                    tweet_text:      sig.content,
                    tweet_image_url: sig.tweet_image_url ?? null,
                    likes:           sig.likesCount,
                    retweets:        sig.retweetsCount,
                    replies:         sig.commentsCount,
                    timestamp:       sig.updateTime,
                    entry_price:     sig.entry_price > 0 ? sig.entry_price : null,
                    signal_id:       sig.signal_id,
                  });
                  setDetailOpen(true);
                }}
              />
            ))}
          </div>
        </div>

        {showSettings && (
          <QuickSettingsSheet
            traderName={data.x_handle}
            action={copyAction}
            onConfirm={handleSettingsConfirm}
            onClose={() => setShowSettings(false)}
          />
        )}

        {showSuccess && (
          <SuccessSheet
            traderName={data.x_handle}
            action={copyAction}
            onViewRewards={handleViewRewards}
            onDone={() => setShowSuccess(false)}
          />
        )}

        <SignalDetailSheet
          signal={detailSignal}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          onTrade={handleSignalTrade}
          trading={tradingSignal}
        />
      </div>
    </>
  );
}