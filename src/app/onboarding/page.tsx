"use client";

import Image from "next/image";
import HyperBuybackProgramIcon from "@/assets/icons/HYPE-buyback-program.png";
import { Button } from "@/components/ui/button";
import logoIcon from "@/assets/icons/logo.png";
import colors from "@/const/colors";
import { usePrivy } from "@privy-io/react-auth";
import { FullScreenLoader } from "@/components/ui/fullscreen-loader";
import { useEffect, useMemo, useState, useCallback, Suspense } from "react";
import { toast } from "sonner";
import onBoardBg from "@/assets/icons/onboard-bg.png";
import { useRouter, useSearchParams } from "next/navigation";
import { createOrGetWallet, getWalletBalance } from "@/service";
import DepositSheet from "@/app/dashboard/components/DepositSheet";

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

/* ── TOS Bottom Sheet ── */
const TermsSheet = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      {/* sheet */}
      <div
        className="relative w-full max-w-[480px] max-h-[80vh] rounded-t-[20px] flex flex-col"
        style={{ background: "linear-gradient(180deg, #131f25 0%, #0a1419 100%)", border: "1px solid rgba(80,210,193,0.15)", borderBottom: "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
        </div>
        {/* header */}
        <div className="px-6 pb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-bold" style={{ color: "rgba(80,210,193,1)", fontFamily: "var(--font-orbitron)", letterSpacing: "1px" }}>
            Terms of Service
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        {/* content */}
        <div className="px-6 pb-8 overflow-y-auto" style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", lineHeight: "1.7" }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginBottom: "16px" }}>
            Last updated: February 28, 2026
          </p>

          <p style={{ marginBottom: "12px" }}>
            By using HyperCopy (&quot;the Platform&quot;), you acknowledge and agree to the following terms. Please read them carefully before depositing funds or enabling copy trading.
          </p>

          <Section title="1. Custodial Wallet Arrangement">
            When you create an account, HyperCopy generates a dedicated trading wallet on your behalf. The private keys for this wallet are encrypted and stored by the Platform. This means HyperCopy has custodial control over your deposited funds. While we implement encryption and security measures to protect your assets, you acknowledge that this custodial model carries inherent risk, including but not limited to potential loss of funds due to security breaches, technical failures, or operational errors.
          </Section>

          <Section title="2. Trading Risks">
            Copy trading involves automatically replicating trades based on signals derived from public social media posts by Key Opinion Leaders (KOLs). You understand and accept that: (a) past performance of any KOL does not guarantee future results; (b) you may lose some or all of your deposited funds; (c) leveraged perpetual futures trading amplifies both gains and losses; (d) signal detection relies on AI analysis of tweets, which may be inaccurate, delayed, or misinterpreted; (e) market conditions, slippage, and execution timing may cause your results to differ significantly from the KOL&apos;s stated positions.
          </Section>

          <Section title="3. Fees">
            HyperCopy charges a builder fee of 0.1% (10 basis points) on each trade executed through the Platform. This fee is automatically deducted at the time of trade execution. Deposits and withdrawals via the Platform&apos;s zero-fee path incur no additional charge, though cross-chain bridging (non-Arbitrum chains) may involve minimal network fees (~0.06%).
          </Section>

          <Section title="4. Not Investment Advice">
            Nothing on the Platform constitutes financial, investment, legal, or tax advice. HyperCopy does not recommend, endorse, or guarantee the accuracy of any KOL&apos;s trading signals. All trading decisions — whether manually initiated or automatically copied — are made at your own risk and discretion. You should consult qualified professionals before making any financial decisions.
          </Section>

          <Section title="5. Eligibility">
            By using the Platform, you represent that you are at least 18 years old and that the use of cryptocurrency trading platforms is not prohibited in your jurisdiction. It is your sole responsibility to ensure compliance with applicable local laws and regulations.
          </Section>

          <Section title="6. Service Availability">
            HyperCopy is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We do not guarantee uninterrupted or error-free operation. The Platform may be temporarily unavailable due to maintenance, upgrades, or circumstances beyond our control. We are not liable for any losses resulting from service interruptions.
          </Section>

          <Section title="7. Limitation of Liability">
            To the maximum extent permitted by law, HyperCopy and its operators shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of the Platform, including but not limited to trading losses, wallet security incidents, or service downtime.
          </Section>

          <Section title="8. Changes to Terms">
            HyperCopy reserves the right to modify these terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised terms. Material changes will be communicated through the Platform interface.
          </Section>

          <p style={{ marginTop: "16px", color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>
            If you have questions about these terms, contact us at support@hypercopy.io.
          </p>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: "16px" }}>
    <p style={{ color: "rgba(80,210,193,0.85)", fontWeight: 600, fontSize: "13px", marginBottom: "4px" }}>{title}</p>
    <p>{children}</p>
  </div>
);

const OnboardingContent = () => {
  const { ready, login, authenticated } = usePrivy();
  const router = useRouter();
  const from = useSearchParams().get("from") as string | null;

  const [walletReady, setWalletReady] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [hasBalance, setHasBalance] = useState(false);

  useEffect(() => {
    if (authenticated && from && from !== "orderPlace") {
      router.push(from);
    }
  }, [from, authenticated, router]);

  // Auto-create dedicated wallet on auth
  useEffect(() => {
    if (!authenticated) { setWalletReady(false); return; }
    createOrGetWallet()
      .then(() => setWalletReady(true))
      .catch((e) => { console.error("Wallet create failed:", e); setWalletReady(true); });
  }, [authenticated]);

  // Check if user already has balance
  useEffect(() => {
    if (!authenticated || !walletReady) return;
    getWalletBalance()
      .then((b) => { if (b.hl_equity > 0 || b.arb_usdc > 0) setHasBalance(true); })
      .catch(() => {});
  }, [authenticated, walletReady]);

  // Auto-redirect if user already has balance
  useEffect(() => {
    if (authenticated && walletReady && hasBalance) {
      toast.success("Welcome back! Redirecting...");
      const t = setTimeout(() => router.push("/dashboard"), 1000);
      return () => clearTimeout(t);
    }
  }, [authenticated, walletReady, hasBalance, router]);

  const currentStep = useMemo(() => {
    if (!authenticated) return 0;
    if (!walletReady) return 0;
    return 1; // ready to deposit
  }, [authenticated, walletReady]);

  const buttonText = useMemo(() => {
    if (!authenticated) return "GET STARTED";
    if (!walletReady) return "SETTING UP...";
    return "DEPOSIT & START TRADING";
  }, [authenticated, walletReady]);

  const handleClickContinue = async () => {
    if (!authenticated) { login(); return; }
    if (walletReady) { setShowDeposit(true); return; }
  };

  const handleDepositSuccess = useCallback(() => {
    toast.success("Deposit started! Redirecting to dashboard...");
    setTimeout(() => router.push("/dashboard"), 1500);
  }, [router]);

  const handleDepositClose = useCallback(() => {
    setShowDeposit(false);
  }, []);

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
      <div className="absolute top-[5%] left-[-20%] w-[60%] h-[35%] rounded-full pointer-events-none z-[1]"
        style={{ background: "radial-gradient(circle, rgba(80,210,193,0.06) 0%, transparent 70%)", filter: "blur(50px)" }} />
      <div className="absolute bottom-[10%] right-[-15%] w-[50%] h-[30%] rounded-full pointer-events-none z-[1]"
        style={{ background: "radial-gradient(circle, rgba(240,234,45,0.04) 0%, transparent 70%)", filter: "blur(50px)" }} />

      {/* ── logo ── */}
      <p className="mt-9 relative z-10" style={{ paddingLeft: "48px", animation: "slideUp 0.7s ease-out both" }}>
        <Image src={logoIcon} alt="logo" width={100} height={100} />
      </p>

      {/* ── welcome + features ── */}
      <div className="mt-4 relative z-10" style={{ paddingLeft: "48px", paddingRight: "48px" }}>
        <div style={{ animation: "slideUp 0.7s ease-out 0.1s both" }}>
          <p className="font-light text-[26px]"
            style={{ background: "linear-gradient(135deg, #ffffff 30%, rgba(80,210,193,0.9))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Welcome
          </p>
          <p className="mt-1 font-light" style={{ color: "rgba(255,255,255,0.8)", animation: "fadeIn 1s ease-out 0.3s both" }}>
            HyperCopy provide Trading system designed for executing Automated
            Trading Strategies on Hyperliquid Order Books assisted by A.I
          </p>
        </div>

        {/* ── decorative line ── */}
        <div className="mt-6 mb-2 flex items-center gap-2" style={{ animation: "fadeIn 0.8s ease-out 0.35s both" }}>
          <div className="h-[1px] rounded-full"
            style={{ background: "linear-gradient(90deg, rgba(80,210,193,0.5), transparent)", animation: "lineExpand 1s ease-out 0.5s both" }} />
          <div className="w-[5px] h-[5px] rounded-full flex-shrink-0"
            style={{ background: "rgba(80,210,193,0.7)", animation: "dotPulse 2s ease-in-out infinite" }} />
        </div>

        {/* ── Auto-Trade ── */}
        <div className="relative pl-4" style={{ animation: "slideUp 0.7s ease-out 0.3s both", borderLeft: "2px solid rgba(80,210,193,0.15)" }}>
          <div className="absolute left-[-5px] top-[4px] w-[8px] h-[8px] rounded-full"
            style={{ background: "rgba(80,210,193,0.8)", boxShadow: "0 0 10px rgba(80,210,193,0.5)", animation: "dotPulse 3s ease-in-out infinite" }} />
          <p className="font-bold" style={{ fontFamily: "var(--font-orbitron)", color: "rgba(80, 210, 193, 1)", letterSpacing: "2px", animation: "glowPulse 3s ease-in-out infinite" }}>
            Auto-Trade
          </p>
          <p className="font-light" style={{ color: "rgba(255,255,255,0.75)" }}>
            Your favorite KOL&apos;s based on their Tweets.
          </p>
        </div>

        {/* ── Connect ── */}
        <div className="relative pl-4 mt-5" style={{ animation: "slideUp 0.7s ease-out 0.45s both", borderLeft: "2px solid rgba(80,210,193,0.15)" }}>
          <div className="absolute left-[-5px] top-[4px] w-[8px] h-[8px] rounded-full"
            style={{ background: "rgba(80,210,193,0.8)", boxShadow: "0 0 10px rgba(80,210,193,0.5)", animation: "dotPulse 3s ease-in-out 0.5s infinite" }} />
          <p className="font-bold" style={{ fontFamily: "var(--font-orbitron)", color: "rgba(80, 210, 193, 1)", letterSpacing: "2px", animation: "glowPulse 3s ease-in-out 1s infinite" }}>
            Connect
          </p>
          <p className="font-light" style={{ color: "rgba(255,255,255,0.75)" }}>
            Your X and See Favorite KOL&apos;s Tweet Performances.
          </p>
        </div>

        {/* ── Customized ── */}
        <div className="relative pl-4 mt-5" style={{ animation: "slideUp 0.7s ease-out 0.6s both", borderLeft: "2px solid rgba(80,210,193,0.15)" }}>
          <div className="absolute left-[-5px] top-[4px] w-[8px] h-[8px] rounded-full"
            style={{ background: "rgba(80,210,193,0.8)", boxShadow: "0 0 10px rgba(80,210,193,0.5)", animation: "dotPulse 3s ease-in-out 1s infinite" }} />
          <p className="font-bold" style={{ fontFamily: "var(--font-orbitron)", color: "rgba(80, 210, 193, 1)", letterSpacing: "2px", animation: "glowPulse 3s ease-in-out 2s infinite" }}>
            Customized
          </p>
          <p className="font-light" style={{ color: "rgba(255,255,255,0.75)" }}>
            Trading strategies using X.com KOL&apos;s and their signals.
          </p>
        </div>
      </div>

      {/* ── HYPE buyback image with effects ── */}
      <div className="relative z-10 mt-[40px]" style={{ animation: "scaleIn 0.9s ease-out 0.75s both" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 60% 50%, rgba(80,210,193,0.1) 0%, transparent 60%)", filter: "blur(30px)", animation: "borderGlow 4s ease-in-out infinite" }} />
        <div style={{ animation: "hypeFloat 5s ease-in-out infinite" }}>
          <Image src={HyperBuybackProgramIcon} alt="logo" className="w-full relative z-10" />
        </div>
        <div className="absolute left-0 right-0 h-[2px] pointer-events-none z-20"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(80,210,193,0.4) 30%, rgba(80,210,193,0.6) 50%, rgba(80,210,193,0.4) 70%, transparent 100%)", animation: "scanLine 4s linear infinite", filter: "blur(1px)", boxShadow: "0 0 15px rgba(80,210,193,0.3), 0 0 30px rgba(80,210,193,0.15)" }} />
        <div className="absolute top-2 left-4 w-[20px] h-[20px] border-t-[1.5px] border-l-[1.5px] pointer-events-none z-20 rounded-tl-sm" style={{ borderColor: "rgba(80,210,193,0.4)", animation: "borderGlow 3s ease-in-out infinite" }} />
        <div className="absolute top-2 right-4 w-[20px] h-[20px] border-t-[1.5px] border-r-[1.5px] pointer-events-none z-20 rounded-tr-sm" style={{ borderColor: "rgba(80,210,193,0.4)", animation: "borderGlow 3s ease-in-out 0.5s infinite" }} />
        <div className="absolute bottom-2 left-4 w-[20px] h-[20px] border-b-[1.5px] border-l-[1.5px] pointer-events-none z-20 rounded-bl-sm" style={{ borderColor: "rgba(80,210,193,0.4)", animation: "borderGlow 3s ease-in-out 1s infinite" }} />
        <div className="absolute bottom-2 right-4 w-[20px] h-[20px] border-b-[1.5px] border-r-[1.5px] pointer-events-none z-20 rounded-br-sm" style={{ borderColor: "rgba(80,210,193,0.4)", animation: "borderGlow 3s ease-in-out 1.5s infinite" }} />
      </div>

      {/* ── step progress indicator ── */}
      {authenticated && (
        <div className="mx-[48px] mt-6 relative z-10" style={{ animation: "fadeIn 0.5s ease-out both" }}>
          <div className="flex items-center justify-center gap-2 mb-3">
            {["Connect", "Deposit"].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500"
                    style={{
                      background: i < currentStep ? "rgba(80,210,193,0.9)" : i === currentStep ? "rgba(80,210,193,0.2)" : "rgba(255,255,255,0.05)",
                      color: i < currentStep ? "#0a0f14" : i === currentStep ? "rgba(80,210,193,1)" : "rgba(255,255,255,0.3)",
                      border: i === currentStep ? "1.5px solid rgba(80,210,193,0.5)" : "1.5px solid transparent",
                      boxShadow: i === currentStep ? "0 0 12px rgba(80,210,193,0.3)" : "none",
                    }}>
                    {i < currentStep ? "✓" : i + 1}
                  </div>
                  <span className="text-[9px] mt-1 whitespace-nowrap"
                    style={{ color: i <= currentStep ? "rgba(80,210,193,0.8)" : "rgba(255,255,255,0.3)" }}>
                    {label}
                  </span>
                </div>
                {i < 1 && (
                  <div className="w-8 h-[1px] mb-4"
                    style={{ background: i < currentStep ? "rgba(80,210,193,0.5)" : "rgba(255,255,255,0.1)" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── step hint ── */}
      {authenticated && walletReady && (
        <div className="mx-[48px] mt-2 relative z-10" style={{ animation: "fadeIn 0.5s ease-out both" }}>
          <p className="text-[12px] text-center leading-[1.5]" style={{ color: "rgba(255,255,255,0.55)" }}>
            Deposit USDC from any chain to start copy trading. Supports 8 chains including Arbitrum, Base, Ethereum, and more.
          </p>
        </div>
      )}

      {/* ── terms ── */}
      <p className="mt-5 font-light text-xs w-[300px] mx-auto text-center relative z-10"
        style={{ color: "rgba(255, 255, 255, 0.7)", animation: "fadeIn 1s ease-out 0.9s both" }}>
        By tapping the button below you agree to our{" "}
        <span
          onClick={() => setShowTerms(true)}
          className="cursor-pointer underline underline-offset-2"
          style={{ color: "rgba(80,210,193,0.9)" }}
        >
          Terms of Service
        </span>
        .
      </p>

      {/* ── CTA button ── */}
      <div className="relative mx-[48px] mt-6 group cursor-pointer z-10" style={{ animation: "slideUp 0.8s ease-out 1s both" }}>
        <div className="absolute inset-0 rounded-[38px]"
          style={{ background: "linear-gradient(135deg, #50D2C1, #F0EA2D, #50D2C1, #F0EA2D)", backgroundSize: "300% 300%", animation: "gradientBorder 4s ease infinite", padding: "1.5px", borderRadius: "38px" }}>
          <div className="w-full h-full rounded-[38px] transition-all duration-300 group-hover:bg-[rgba(80,210,193,1)] group-active:bg-[rgba(80,210,193,1)]"
            style={{ backgroundColor: colors.primary }} />
        </div>
        <div className="absolute inset-0 rounded-[38px] overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: "linear-gradient(90deg, transparent, rgba(80,210,193,0.12), transparent)", animation: "shimmer 2s ease-in-out infinite" }} />
        </div>
        <div className="absolute inset-0 rounded-[38px] opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-200 pointer-events-none"
          style={{ backdropFilter: "blur(30px)" }} />
        <Button
          className="h-[72px] rounded-[38px] w-full relative font-semibold text-base transition-all duration-300 text-[rgba(80,210,193,1)] group-hover:text-[rgba(15,26,31,1)] group-active:text-[rgba(15,26,31,1)] group-hover:scale-[1.02] group-active:scale-[0.98]"
          style={{ background: "transparent", backdropFilter: "blur(0px)", animation: "pulseGlow 3s ease-in-out infinite", fontFamily: "var(--font-orbitron)", letterSpacing: "2px" }}
          disabled={authenticated && !walletReady}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(80, 210, 193, 1)"; e.currentTarget.style.backdropFilter = "blur(30px)"; e.currentTarget.style.color = "rgba(15, 26, 31, 1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.backdropFilter = "blur(0px)"; e.currentTarget.style.color = "rgba(80, 210, 193, 1)"; }}
          onMouseDown={(e) => { e.currentTarget.style.background = "rgba(80, 210, 193, 1)"; e.currentTarget.style.backdropFilter = "blur(30px)"; }}
          onMouseUp={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.backdropFilter = "blur(0px)"; e.currentTarget.style.color = "rgba(80, 210, 193, 1)"; }}
          onTouchEnd={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.backdropFilter = "blur(0px)"; e.currentTarget.style.color = "rgba(80, 210, 193, 1)"; }}
          onClick={handleClickContinue}
        >
          {buttonText}
        </Button>
      </div>

      {/* ── skip / explore button ── */}
      <div className="relative mx-[48px] mt-3 z-10 cursor-pointer group" style={{ animation: "fadeIn 1s ease-out 1.1s both" }}
        onClick={() => authenticated ? router.push("/dashboard") : router.push("/copyTrading")}>
        <div className="absolute inset-0 rounded-[28px]"
          style={{ background: "linear-gradient(135deg, rgba(80,210,193,0.6), rgba(240,234,45,0.4), rgba(80,210,193,0.6))", backgroundSize: "200% 200%", animation: "gradientBorder 4s ease infinite", padding: "1px", borderRadius: "28px" }}>
          <div className="w-full h-full rounded-[28px]" style={{ backgroundColor: "rgba(10, 20, 24, 0.95)" }} />
        </div>
        <div className="h-[52px] rounded-[28px] flex items-center justify-center gap-2 transition-all duration-300 relative" style={{ background: "transparent" }}>
          <span className="text-[11px] tracking-[2px] uppercase transition-colors duration-300 group-hover:text-[rgba(80,210,193,1)]"
            style={{ color: "rgba(80,210,193,0.7)", fontFamily: "var(--font-orbitron)", textShadow: "0 0 8px rgba(80,210,193,0.2)" }}>
            {authenticated ? "Skip — go to dashboard" : "Explore top traders"}
          </span>
          <svg className="w-3.5 h-3.5 transition-all duration-300 group-hover:translate-x-1" style={{ color: "rgba(80,210,193,0.5)" }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* ── DepositSheet overlay ── */}
      <DepositSheet
        isOpen={showDeposit}
        onClose={handleDepositClose}
        onSuccess={handleDepositSuccess}
      />

      {/* ── Terms of Service overlay ── */}
      <TermsSheet isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
};

const Onboarding = () => (
  <Suspense fallback={<FullScreenLoader />}>
    <OnboardingContent />
  </Suspense>
);

export default Onboarding;