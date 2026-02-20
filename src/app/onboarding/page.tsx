"use client";

import Image from "next/image";
import HyperBuybackProgramIcon from "@/assets/icons/HYPE-buyback-program.png";
import { Button } from "@/components/ui/button";
import logoIcon from "@/assets/icons/logo.png";
import colors from "@/const/colors";
import { usePrivy } from "@privy-io/react-auth";
import { FullScreenLoader } from "@/components/ui/fullscreen-loader";
import { HyperLiquidContext } from "@/providers/hyperliquid";
import { useContext, useEffect, useMemo, useState, Suspense } from "react";
import { toast } from "sonner";
import onBoardBg from "@/assets/icons/onboard-bg.png";
import { useRouter, useSearchParams } from "next/navigation";

/* ── floating particles ── */
const Particles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
    {Array.from({ length: 25 }).map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full"
        style={{
          width: `${Math.random() * 3 + 1}px`,
          height: `${Math.random() * 3 + 1}px`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          background: i % 3 === 0
            ? "rgba(80,210,193,0.6)"
            : i % 3 === 1
            ? "rgba(240,234,45,0.35)"
            : "rgba(255,255,255,0.2)",
          animation: `floatParticle ${6 + Math.random() * 12}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 6}s`,
        }}
      />
    ))}
  </div>
);

/* ── rising lines (like data streams) ── */
const DataStreams = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="absolute"
        style={{
          width: "1px",
          height: "60px",
          left: `${15 + i * 15}%`,
          bottom: "-60px",
          background: `linear-gradient(to top, transparent, ${i % 2 === 0 ? "rgba(80,210,193,0.3)" : "rgba(240,234,45,0.2)"}, transparent)`,
          animation: `riseStream ${4 + Math.random() * 3}s linear infinite`,
          animationDelay: `${Math.random() * 4}s`,
        }}
      />
    ))}
  </div>
);

/* ── info tooltip for each step ── */
const StepInfo = ({ step }: { step: string }) => {
  const [open, setOpen] = useState(false);

  const info: Record<string, { title: string; desc: string }> = {
    enableTrading: {
      title: "Enable Trading",
      desc: "This creates a local agent wallet that can sign trades on your behalf — so you don't have to approve every single order. Your funds can ONLY be withdrawn to your own wallet. This is a standard Hyperliquid security feature.",
    },
    builderFee: {
      title: "Approve Builder Fee",
      desc: `HyperCopy charges a small fee (max ${process.env.NEXT_PUBLIC_HL_DEFAULT_BUILDER_BPS || 10} bps) per trade to sustain the platform. This is a one-time approval — you can revoke it anytime on Hyperliquid. No funds are deducted now.`,
    },
  };

  const item = info[step];
  if (!item) return null;

  return (
    <span className="relative inline-block ml-1 align-middle">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="inline-flex items-center justify-center w-[16px] h-[16px] rounded-full text-[10px] font-medium transition-all duration-200"
        style={{
          background: open ? "rgba(80,210,193,0.3)" : "rgba(80,210,193,0.12)",
          color: "rgba(80,210,193,0.9)",
          border: "1px solid rgba(80,210,193,0.25)",
        }}
      >
        i
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-[260px] p-3 rounded-xl z-50"
            style={{
              background: "rgba(10,20,24,0.97)",
              border: "1px solid rgba(80,210,193,0.2)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(80,210,193,0.08)",
              backdropFilter: "blur(20px)",
            }}
          >
            <p className="text-[12px] font-semibold mb-1" style={{ color: "rgba(80,210,193,1)" }}>
              {item.title}
            </p>
            <p className="text-[11px] leading-[1.5]" style={{ color: "rgba(255,255,255,0.7)" }}>
              {item.desc}
            </p>
            <div
              className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
              style={{
                background: "rgba(10,20,24,0.97)",
                borderRight: "1px solid rgba(80,210,193,0.2)",
                borderBottom: "1px solid rgba(80,210,193,0.2)",
              }}
            />
          </div>
        </>
      )}
    </span>
  );
};

const OnboardingContent = () => {
  const { ready, login, authenticated } = usePrivy();
  const router = useRouter();
  const {
    enableTrading,
    tradingEnabled,
    builderFeeApproved,
    approveBuilderFee,
  } = useContext(HyperLiquidContext);

  const from = useSearchParams().get("from") as "orderPlace" | string;

  useEffect(() => {
    if (authenticated && from && from !== "orderPlace") {
      router.push(from);
    }
  }, [from, authenticated, router]);

  /* ── auto-redirect when all steps done ── */
  useEffect(() => {
    if (authenticated && tradingEnabled && builderFeeApproved) {
      const target = from === "orderPlace" || !from ? "/dashboard" : from;
      toast.success("All set! Redirecting...");
      const t = setTimeout(() => router.push(target), 1200);
      return () => clearTimeout(t);
    }
  }, [authenticated, tradingEnabled, builderFeeApproved, from, router]);

  /* ── step progress ── */
  const currentStep = useMemo(() => {
    if (!authenticated) return 0;
    if (!tradingEnabled) return 1;
    if (!builderFeeApproved) return 2;
    return 3;
  }, [authenticated, tradingEnabled, builderFeeApproved]);

  /* ── step hint text with tooltip key ── */
  const stepHint = useMemo(() => {
    if (!authenticated) return null;
    if (!tradingEnabled) return { text: "Authorize a local agent wallet so trades execute without signing each one.", key: "enableTrading" };
    if (!builderFeeApproved) return { text: "One-time approval for a small per-trade fee. No funds deducted now.", key: "builderFee" };
    return null;
  }, [authenticated, tradingEnabled, builderFeeApproved]);

  const buttonText = useMemo(() => {
    if (!authenticated) return "GET STARTED";
    if (!tradingEnabled) return "ENABLE TRADING";
    if (!builderFeeApproved) return "APPROVE BUILDER FEE";
    return "GO TO DASHBOARD";
  }, [authenticated, tradingEnabled, builderFeeApproved]);

  const handleClickContinue = async () => {
    if (!authenticated) { login(); return; }
    if (!tradingEnabled) { await enableTrading(); return; }
    if (!builderFeeApproved) { await approveBuilderFee(); return; }
    router.push("/dashboard");
  };

  if (!ready) return <FullScreenLoader />;

  return (
    <div
      className="relative flex flex-col pb-5 min-h-screen overflow-hidden"
      style={{
        backgroundImage: `url(${onBoardBg.src})`,
        backgroundSize: "100%",
        backgroundRepeat: "no-repeat",
        backgroundPositionX: "center",
      }}
    >
      {/* ── keyframes ── */}
      <style jsx global>{`
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.15; }
          25% { transform: translateY(-30px) translateX(10px); opacity: 0.7; }
          50% { transform: translateY(-12px) translateX(-10px); opacity: 0.35; }
          75% { transform: translateY(-40px) translateX(5px); opacity: 0.55; }
        }
        @keyframes riseStream {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-110vh); opacity: 0; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes gradientBorder {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(80,210,193,0.08), 0 0 30px rgba(80,210,193,0.04); }
          50% { box-shadow: 0 0 25px rgba(80,210,193,0.2), 0 0 60px rgba(80,210,193,0.08); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes glowPulse {
          0%, 100% { text-shadow: 0 0 6px rgba(80,210,193,0.25); }
          50% { text-shadow: 0 0 18px rgba(80,210,193,0.55), 0 0 35px rgba(80,210,193,0.15); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.93); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes scanLine {
          0% { top: -8%; }
          100% { top: 108%; }
        }
        @keyframes borderGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes hypeFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes lineExpand {
          from { width: 0; opacity: 0; }
          to { width: 60px; opacity: 1; }
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.8); opacity: 1; }
        }
      `}</style>

      <Particles />
      <DataStreams />

      {/* ── ambient glow ── */}
      <div
        className="absolute top-[5%] left-[-20%] w-[60%] h-[35%] rounded-full pointer-events-none z-[1]"
        style={{
          background: "radial-gradient(circle, rgba(80,210,193,0.06) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />
      <div
        className="absolute bottom-[10%] right-[-15%] w-[50%] h-[30%] rounded-full pointer-events-none z-[1]"
        style={{
          background: "radial-gradient(circle, rgba(240,234,45,0.04) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* ── logo ── */}
      <p
        className="mt-9 relative z-10"
        style={{
          paddingLeft: "48px",
          animation: "slideUp 0.7s ease-out both",
        }}
      >
        <Image src={logoIcon} alt="logo" width={100} height={100} />
      </p>

      {/* ── welcome + features ── */}
      <div
        className="mt-4 relative z-10"
        style={{ paddingLeft: "48px", paddingRight: "48px" }}
      >
        {/* Welcome heading */}
        <div style={{ animation: "slideUp 0.7s ease-out 0.1s both" }}>
          <p
            className="font-light text-[26px]"
            style={{
              background: "linear-gradient(135deg, #ffffff 30%, rgba(80,210,193,0.9))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Welcome
          </p>
          <p className="mt-1 font-light" style={{ color: "rgba(255,255,255,0.8)", animation: "fadeIn 1s ease-out 0.3s both" }}>
            HyperCopy provide Trading system designed for executing Automated
            Trading Strategies on Hyperliquid Order Books assisted by A.I
          </p>
        </div>

        {/* ── decorative line ── */}
        <div className="mt-6 mb-2 flex items-center gap-2" style={{ animation: "fadeIn 0.8s ease-out 0.35s both" }}>
          <div
            className="h-[1px] rounded-full"
            style={{
              background: "linear-gradient(90deg, rgba(80,210,193,0.5), transparent)",
              animation: "lineExpand 1s ease-out 0.5s both",
            }}
          />
          <div
            className="w-[5px] h-[5px] rounded-full flex-shrink-0"
            style={{
              background: "rgba(80,210,193,0.7)",
              animation: "dotPulse 2s ease-in-out infinite",
            }}
          />
        </div>

        {/* ── Auto-Trade ── */}
        <div
          className="relative pl-4"
          style={{
            animation: "slideUp 0.7s ease-out 0.3s both",
            borderLeft: "2px solid rgba(80,210,193,0.15)",
          }}
        >
          <div
            className="absolute left-[-5px] top-[4px] w-[8px] h-[8px] rounded-full"
            style={{
              background: "rgba(80,210,193,0.8)",
              boxShadow: "0 0 10px rgba(80,210,193,0.5)",
              animation: "dotPulse 3s ease-in-out infinite",
            }}
          />
          <p
            className="font-bold"
            style={{
              fontFamily: "var(--font-orbitron)",
              color: "rgba(80, 210, 193, 1)",
              letterSpacing: "2px",
              animation: "glowPulse 3s ease-in-out infinite",
            }}
          >
            Auto-Trade
          </p>
          <p className="font-light" style={{ color: "rgba(255,255,255,0.75)" }}>
            Your favorite KOL&apos;s based on their Tweets.
          </p>
        </div>

        {/* ── Connect ── */}
        <div
          className="relative pl-4 mt-5"
          style={{
            animation: "slideUp 0.7s ease-out 0.45s both",
            borderLeft: "2px solid rgba(80,210,193,0.15)",
          }}
        >
          <div
            className="absolute left-[-5px] top-[4px] w-[8px] h-[8px] rounded-full"
            style={{
              background: "rgba(80,210,193,0.8)",
              boxShadow: "0 0 10px rgba(80,210,193,0.5)",
              animation: "dotPulse 3s ease-in-out 0.5s infinite",
            }}
          />
          <p
            className="font-bold"
            style={{
              fontFamily: "var(--font-orbitron)",
              color: "rgba(80, 210, 193, 1)",
              letterSpacing: "2px",
              animation: "glowPulse 3s ease-in-out 1s infinite",
            }}
          >
            Connect
          </p>
          <p className="font-light" style={{ color: "rgba(255,255,255,0.75)" }}>
            Your X and See Favorite KOL&apos;s Tweet Performances.
          </p>
        </div>

        {/* ── Customized ── */}
        <div
          className="relative pl-4 mt-5"
          style={{
            animation: "slideUp 0.7s ease-out 0.6s both",
            borderLeft: "2px solid rgba(80,210,193,0.15)",
          }}
        >
          <div
            className="absolute left-[-5px] top-[4px] w-[8px] h-[8px] rounded-full"
            style={{
              background: "rgba(80,210,193,0.8)",
              boxShadow: "0 0 10px rgba(80,210,193,0.5)",
              animation: "dotPulse 3s ease-in-out 1s infinite",
            }}
          />
          <p
            className="font-bold"
            style={{
              fontFamily: "var(--font-orbitron)",
              color: "rgba(80, 210, 193, 1)",
              letterSpacing: "2px",
              animation: "glowPulse 3s ease-in-out 2s infinite",
            }}
          >
            Customized
          </p>
          <p className="font-light" style={{ color: "rgba(255,255,255,0.75)" }}>
            Trading strategies using X.com KOL&apos;s and their signals.
          </p>
        </div>
      </div>

      {/* ── HYPE buyback image with effects ── */}
      <div
        className="relative z-10 mt-[40px]"
        style={{ animation: "scaleIn 0.9s ease-out 0.75s both" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 60% 50%, rgba(80,210,193,0.1) 0%, transparent 60%)",
            filter: "blur(30px)",
            animation: "borderGlow 4s ease-in-out infinite",
          }}
        />
        <div style={{ animation: "hypeFloat 5s ease-in-out infinite" }}>
          <Image src={HyperBuybackProgramIcon} alt="logo" className="w-full relative z-10" />
        </div>
        <div
          className="absolute left-0 right-0 h-[2px] pointer-events-none z-20"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(80,210,193,0.4) 30%, rgba(80,210,193,0.6) 50%, rgba(80,210,193,0.4) 70%, transparent 100%)",
            animation: "scanLine 4s linear infinite",
            filter: "blur(1px)",
            boxShadow: "0 0 15px rgba(80,210,193,0.3), 0 0 30px rgba(80,210,193,0.15)",
          }}
        />
        <div className="absolute top-2 left-4 w-[20px] h-[20px] border-t-[1.5px] border-l-[1.5px] pointer-events-none z-20 rounded-tl-sm"
          style={{ borderColor: "rgba(80,210,193,0.4)", animation: "borderGlow 3s ease-in-out infinite" }} />
        <div className="absolute top-2 right-4 w-[20px] h-[20px] border-t-[1.5px] border-r-[1.5px] pointer-events-none z-20 rounded-tr-sm"
          style={{ borderColor: "rgba(80,210,193,0.4)", animation: "borderGlow 3s ease-in-out 0.5s infinite" }} />
        <div className="absolute bottom-2 left-4 w-[20px] h-[20px] border-b-[1.5px] border-l-[1.5px] pointer-events-none z-20 rounded-bl-sm"
          style={{ borderColor: "rgba(80,210,193,0.4)", animation: "borderGlow 3s ease-in-out 1s infinite" }} />
        <div className="absolute bottom-2 right-4 w-[20px] h-[20px] border-b-[1.5px] border-r-[1.5px] pointer-events-none z-20 rounded-br-sm"
          style={{ borderColor: "rgba(80,210,193,0.4)", animation: "borderGlow 3s ease-in-out 1.5s infinite" }} />
      </div>

      {/* ── step progress indicator ── */}
      {authenticated && currentStep < 3 && (
        <div
          className="mx-[48px] mt-6 relative z-10"
          style={{ animation: "fadeIn 0.5s ease-out both" }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            {["Connect", "Trading", "Builder Fee"].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500"
                    style={{
                      background: i < currentStep
                        ? "rgba(80,210,193,0.9)"
                        : i === currentStep
                        ? "rgba(80,210,193,0.2)"
                        : "rgba(255,255,255,0.05)",
                      color: i < currentStep
                        ? "#0a0f14"
                        : i === currentStep
                        ? "rgba(80,210,193,1)"
                        : "rgba(255,255,255,0.3)",
                      border: i === currentStep
                        ? "1.5px solid rgba(80,210,193,0.5)"
                        : "1.5px solid transparent",
                      boxShadow: i === currentStep
                        ? "0 0 12px rgba(80,210,193,0.3)"
                        : "none",
                    }}
                  >
                    {i < currentStep ? "✓" : i + 1}
                  </div>
                  <span
                    className="text-[9px] mt-1 whitespace-nowrap"
                    style={{
                      color: i <= currentStep
                        ? "rgba(80,210,193,0.8)"
                        : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {label}
                  </span>
                </div>
                {i < 2 && (
                  <div
                    className="w-8 h-[1px] mb-4"
                    style={{
                      background: i < currentStep
                        ? "rgba(80,210,193,0.5)"
                        : "rgba(255,255,255,0.1)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── step hint ── */}
      {stepHint && (
        <div
          className="mx-[48px] mt-2 relative z-10"
          style={{ animation: "fadeIn 0.5s ease-out both" }}
        >
          <p className="text-[12px] text-center leading-[1.5]" style={{ color: "rgba(255,255,255,0.55)" }}>
            {stepHint.text}
            <StepInfo step={stepHint.key} />
          </p>
        </div>
      )}

      {/* ── terms ── */}
      <p
        className="mt-5 font-light text-xs w-[300px] mx-auto text-center relative z-10"
        style={{
          color: "rgba(255, 255, 255, 0.7)",
          animation: "fadeIn 1s ease-out 0.9s both",
        }}
      >
        By tap on the FINISH button you&apos;re agree to our Terms and Agreement.
      </p>

      {/* ── CTA button ── */}
      <div
        className="relative mx-[48px] mt-6 group cursor-pointer z-10"
        style={{ animation: "slideUp 0.8s ease-out 1s both" }}
      >
        <div
          className="absolute inset-0 rounded-[38px]"
          style={{
            background: "linear-gradient(135deg, #50D2C1, #F0EA2D, #50D2C1, #F0EA2D)",
            backgroundSize: "300% 300%",
            animation: "gradientBorder 4s ease infinite",
            padding: "1.5px",
            borderRadius: "38px",
          }}
        >
          <div
            className="w-full h-full rounded-[38px] transition-all duration-300 group-hover:bg-[rgba(80,210,193,1)] group-active:bg-[rgba(80,210,193,1)]"
            style={{ backgroundColor: colors.primary }}
          />
        </div>
        <div className="absolute inset-0 rounded-[38px] overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(80,210,193,0.12), transparent)",
              animation: "shimmer 2s ease-in-out infinite",
            }}
          />
        </div>
        <div
          className="absolute inset-0 rounded-[38px] opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-200 pointer-events-none"
          style={{ backdropFilter: "blur(30px)" }}
        />
        <Button
          className="h-[72px] rounded-[38px] w-full relative font-semibold text-base transition-all duration-300 text-[rgba(80,210,193,1)] group-hover:text-[rgba(15,26,31,1)] group-active:text-[rgba(15,26,31,1)] group-hover:scale-[1.02] group-active:scale-[0.98]"
          style={{
            background: "transparent",
            backdropFilter: "blur(0px)",
            animation: "pulseGlow 3s ease-in-out infinite",
            fontFamily: "var(--font-orbitron)",
            letterSpacing: "2px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(80, 210, 193, 1)";
            e.currentTarget.style.backdropFilter = "blur(30px)";
            e.currentTarget.style.color = "rgba(15, 26, 31, 1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.backdropFilter = "blur(0px)";
            e.currentTarget.style.color = "rgba(80, 210, 193, 1)";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.background = "rgba(80, 210, 193, 1)";
            e.currentTarget.style.backdropFilter = "blur(30px)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.backdropFilter = "blur(0px)";
            e.currentTarget.style.color = "rgba(80, 210, 193, 1)";
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.backdropFilter = "blur(0px)";
            e.currentTarget.style.color = "rgba(80, 210, 193, 1)";
          }}
          onClick={handleClickContinue}
        >
          {buttonText}
        </Button>
      </div>

      {/* ── explore top traders button ── */}
      <div
        className="relative mx-[48px] mt-3 z-10 cursor-pointer group"
        style={{ animation: "fadeIn 1s ease-out 1.1s both" }}
        onClick={() => router.push("/copyTrading")}
      >
        <div
          className="absolute inset-0 rounded-[28px]"
          style={{
            background: "linear-gradient(135deg, rgba(80,210,193,0.6), rgba(240,234,45,0.4), rgba(80,210,193,0.6))",
            backgroundSize: "200% 200%",
            animation: "gradientBorder 4s ease infinite",
            padding: "1px",
            borderRadius: "28px",
          }}
        >
          <div
            className="w-full h-full rounded-[28px]"
            style={{ backgroundColor: "rgba(10, 20, 24, 0.95)" }}
          />
        </div>
        <div
          className="h-[52px] rounded-[28px] flex items-center justify-center gap-2 transition-all duration-300 relative"
          style={{ background: "transparent" }}
        >
          <span
            className="text-[11px] tracking-[2px] uppercase transition-colors duration-300 group-hover:text-[rgba(80,210,193,1)]"
            style={{
              color: "rgba(80,210,193,0.7)",
              fontFamily: "var(--font-orbitron)",
              textShadow: "0 0 8px rgba(80,210,193,0.2)",
            }}
          >
            Explore top traders
          </span>
          <svg
            className="w-3.5 h-3.5 transition-all duration-300 group-hover:translate-x-1"
            style={{ color: "rgba(80,210,193,0.5)" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

const Onboarding = () => (
  <Suspense fallback={<FullScreenLoader />}>
    <OnboardingContent />
  </Suspense>
);

export default Onboarding;