"use client";

import Image from "next/image";
import logoIcon from "@/assets/icons/logo.png";
import { Button } from "@/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import { FullScreenLoader } from "@/components/ui/fullscreen-loader";
import { useEffect, useMemo, useRef, useState, useCallback, Suspense } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { createOrGetWallet, getWalletBalance } from "@/service";
import DepositSheet from "@/app/dashboard/components/DepositSheet";

/* ─────────────────────────────────────────────
   Canvas: network animation (YOU node + beams)
───────────────────────────────────────────── */
const NetworkCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;

    const CW = 220, CH = 280;
    cv.width = CW; cv.height = CH;
    const cx = CW * 0.58, cy = CH * 0.42;
    const G1 = "#6359FF", G2 = "#1D9E75";

    const N = 14;
    let nodes: any[] = [], edges: [number, number][] = [];
    let beams: any[] = [], ripples: any[] = [];
    let lastFire = 0, coreRot = 0, coreHit = 0, corePulse = 0;
    let rafId: number;

    function scatter() {
      nodes = [];
      const minD = 20, minC = 18, margin = 8;
      for (let i = 0; i < N; i++) {
        let x = 0, y = 0, tries = 0;
        do {
          const a = Math.random() * Math.PI * 2;
          const r = minC + Math.pow(Math.random(), 0.5) * (88 - minC);
          x = cx + Math.cos(a) * r; y = cy + Math.sin(a) * r; tries++;
        } while (tries < 80 && (
          nodes.some((n: any) => Math.hypot(n.ax - x, n.ay - y) < minD) ||
          x < margin || x > CW - margin || y < margin || y > CH - margin
        ));
        nodes.push({ ax: x, ay: y, x, y, dA: Math.random() * Math.PI * 2, dSpd: 0.0004 + Math.random() * 0.0005, dAmp: 4 + Math.random() * 6, dPh: Math.random() * Math.PI * 2, nr: 4.5 + Math.random() * 2.5, flash: 0, ph: Math.random() * Math.PI * 2 });
      }
      buildEdges();
    }

    function buildEdges() {
      edges = [];
      const seen = new Set<string>();
      nodes.forEach((_: any, i: number) => {
        const deg = 2 + Math.floor(Math.random() * 2); let att = 0, conn = 0;
        while (conn < deg && att < 30) {
          att++; const j = Math.floor(Math.random() * N); if (j === i) continue;
          const k = i < j ? `${i}-${j}` : `${j}-${i}`; if (seen.has(k)) continue;
          seen.add(k); edges.push([i, j]); conn++;
        }
        if (Math.random() < 0.4) edges.push([i, -1]);
      });
    }

    function tryFire(ts: number) {
      if (ts - lastFire < 1200 + Math.random() * 900) return; lastFire = ts;
      const busy = new Set(beams.map((b: any) => b.ni));
      const pool = nodes.map((_: any, i: number) => i).filter((i: number) => !busy.has(i));
      if (!pool.length) return;
      const ni = pool[Math.floor(Math.random() * pool.length)];
      beams.push({ ni, t: 0, done: false, ox: (Math.random() - 0.5) * 36, oy: (Math.random() - 0.5) * 36 });
    }

    function bez(t: number, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) {
      const m = 1 - t; return { x: m*m*x0 + 2*m*t*x1 + t*t*x2, y: m*m*y0 + 2*m*t*y1 + t*t*y2 };
    }

    function addRipple() {
      ripples.push({ r: 4, a: 0.6, spd: 2.4 }); ripples.push({ r: 10, a: 0.3, spd: 3.6 });
    }

    function drawYou() {
      corePulse += 0.04; coreHit = Math.max(0, coreHit - 0.045);
      const ps = 1 + Math.sin(corePulse) * 0.07 + coreHit * 0.2; const S = 8 * ps;
      const mg = ctx.createRadialGradient(cx, cy, S * 0.3, cx, cy, S * 5);
      mg.addColorStop(0, `rgba(99,89,255,${0.22 + coreHit * 0.15})`);
      mg.addColorStop(0.5, `rgba(29,158,117,${0.08 + coreHit * 0.04})`);
      mg.addColorStop(1, "rgba(99,89,255,0)");
      ctx.beginPath(); ctx.arc(cx, cy, S * 5, 0, Math.PI * 2); ctx.fillStyle = mg; ctx.fill();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(coreRot);
      const so = S + 5; ctx.strokeStyle = `rgba(99,89,255,${0.28 + coreHit * 0.32})`; ctx.lineWidth = 0.5; ctx.setLineDash([2, 3]); ctx.strokeRect(-so, -so, so * 2, so * 2); ctx.setLineDash([]);
      ctx.rotate(-coreRot * 1.7);
      const so2 = S + 10; ctx.strokeStyle = `rgba(29,158,117,${0.15 + coreHit * 0.18})`; ctx.lineWidth = 0.4; ctx.setLineDash([1, 5]); ctx.strokeRect(-so2, -so2, so2 * 2, so2 * 2); ctx.setLineDash([]);
      ctx.rotate(coreRot * 0.8);
      const sb = S + 15, bl = 3; ctx.strokeStyle = `rgba(99,89,255,${0.45 + coreHit * 0.3})`; ctx.lineWidth = 0.8;
      [[[-sb, -sb + bl], [-sb, -sb], [-sb + bl, -sb]], [[sb - bl, -sb], [sb, -sb], [sb, -sb + bl]], [[sb, sb - bl], [sb, sb], [sb - bl, sb]], [[-sb + bl, sb], [-sb, sb], [-sb, sb - bl]]].forEach(pts => { ctx.beginPath(); pts.forEach(([px, py], idx) => idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)); ctx.stroke(); });
      ctx.restore();
      const cg = ctx.createLinearGradient(cx - S, cy - S, cx + S, cy + S);
      cg.addColorStop(0, "rgba(10,8,30,0.97)"); cg.addColorStop(1, "rgba(5,8,16,0.97)");
      ctx.fillStyle = cg; ctx.fillRect(cx - S, cy - S, S * 2, S * 2);
      ctx.strokeStyle = `rgba(99,89,255,${0.65 + coreHit * 0.3})`; ctx.lineWidth = 0.8 + coreHit * 0.5; ctx.strokeRect(cx - S, cy - S, S * 2, S * 2);
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "400 4.5px monospace";
      ctx.shadowColor = G1; ctx.shadowBlur = 3 + coreHit * 4; ctx.fillStyle = `rgba(168,159,255,${0.9 + coreHit * 0.1})`; ctx.fillText("YOU", cx, cy); ctx.shadowBlur = 0;
      coreRot += 0.005;
    }

    function drawWeb() {
      edges.forEach(([i, j]) => {
        const a = nodes[i]; const bx = j === -1 ? cx : nodes[j].x; const by = j === -1 ? cy : nodes[j].y;
        const dist = Math.hypot(a.x - bx, a.y - by); const al = Math.max(0, (1 - dist / 110) * 0.18 + 0.02);
        const gr = ctx.createLinearGradient(a.x, a.y, bx, by);
        if (j === -1) { gr.addColorStop(0, `rgba(99,89,255,${al * 1.4})`); gr.addColorStop(1, "rgba(99,89,255,0)"); }
        else { gr.addColorStop(0, `rgba(29,158,117,${al})`); gr.addColorStop(0.5, `rgba(29,158,117,${al * 0.3})`); gr.addColorStop(1, `rgba(99,89,255,${al})`); }
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(bx, by); ctx.strokeStyle = gr; ctx.lineWidth = 0.4; ctx.stroke();
      });
    }

    function drawNodes() {
      nodes.forEach((nd: any) => {
        nd.ph += 0.018; nd.dPh += nd.dSpd * 16;
        nd.x = nd.ax + Math.cos(nd.dA + nd.dPh) * nd.dAmp;
        nd.y = nd.ay + Math.sin(nd.dA * 1.3 + nd.dPh) * nd.dAmp * 0.7;
        const ps = 1 + Math.sin(nd.ph) * 0.04; const r = nd.nr * ps; const { x, y } = nd;
        if (nd.flash > 0) {
          const fg = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
          fg.addColorStop(0, `rgba(99,89,255,${0.35 * nd.flash})`); fg.addColorStop(1, "rgba(99,89,255,0)");
          ctx.beginPath(); ctx.arc(x, y, r * 4, 0, Math.PI * 2); ctx.fillStyle = fg; ctx.fill(); nd.flash = Math.max(0, nd.flash - 0.07);
        }
        const gg = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 2);
        gg.addColorStop(0, "rgba(99,89,255,0.12)"); gg.addColorStop(1, "rgba(99,89,255,0)");
        ctx.beginPath(); ctx.arc(x, y, r * 2, 0, Math.PI * 2); ctx.fillStyle = gg; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = "rgba(236,233,255,0.85)"; ctx.fill();
        ctx.strokeStyle = nd.flash > 0.2 ? G1 : "rgba(99,89,255,0.5)"; ctx.lineWidth = 0.6; ctx.stroke();
      });
    }

    function drawBeams() {
      beams = beams.filter((b: any) => !b.done);
      beams.forEach((b: any) => {
        b.t = Math.min(1, b.t + 0.036);
        const nd = nodes[b.ni]; const sx = nd.x, sy = nd.y;
        const cpx = sx * 0.4 + cx * 0.6 + b.ox, cpy = sy * 0.4 + cy * 0.6 + b.oy;
        const tip = bez(b.t, sx, sy, cpx, cpy, cx, cy);
        const tailT = Math.max(0, b.t - 0.3); const tail = bez(tailT, sx, sy, cpx, cpy, cx, cy);
        const STEPS = 22;
        ctx.beginPath(); let first = true;
        for (let k = 0; k <= STEPS; k++) { const st = tailT + (b.t - tailT) * (k / STEPS); const p = bez(st, sx, sy, cpx, cpy, cx, cy); first ? (ctx.moveTo(p.x, p.y), first = false) : ctx.lineTo(p.x, p.y); }
        const lg = ctx.createLinearGradient(tail.x, tail.y, tip.x, tip.y);
        lg.addColorStop(0, "rgba(99,89,255,0)"); lg.addColorStop(0.5, "rgba(99,89,255,0.45)"); lg.addColorStop(1, G1);
        ctx.strokeStyle = lg; ctx.lineWidth = 1.2; ctx.lineCap = "round"; ctx.shadowColor = G1; ctx.shadowBlur = 5; ctx.stroke(); ctx.shadowBlur = 0;
        const tg = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 5);
        tg.addColorStop(0, "#fff"); tg.addColorStop(0.4, G1); tg.addColorStop(1, "rgba(99,89,255,0)");
        ctx.beginPath(); ctx.arc(tip.x, tip.y, 5, 0, Math.PI * 2); ctx.fillStyle = tg; ctx.fill();
        if (b.t >= 1) { coreHit = 1; nd.flash = 1; addRipple(); b.done = true; }
      });
    }

    function drawRipples() {
      ripples = ripples.filter((r: any) => r.a > 0.01);
      ripples.forEach((r: any) => { ctx.strokeStyle = `rgba(99,89,255,${r.a})`; ctx.lineWidth = 0.6; ctx.strokeRect(cx - r.r, cy - r.r, r.r * 2, r.r * 2); r.r += r.spd; r.a *= 0.90; });
    }

    function drawVignette() {
      const gl = ctx.createLinearGradient(0, 0, CW * 0.35, 0);
      gl.addColorStop(0, "rgba(5,8,16,1)"); gl.addColorStop(1, "rgba(5,8,16,0)");
      ctx.fillStyle = gl; ctx.fillRect(0, 0, CW * 0.35, CH);
      const gb = ctx.createLinearGradient(0, CH * 0.72, 0, CH);
      gb.addColorStop(0, "rgba(5,8,16,0)"); gb.addColorStop(1, "rgba(5,8,16,1)");
      ctx.fillStyle = gb; ctx.fillRect(0, CH * 0.72, CW, CH * 0.28);
      const gt = ctx.createLinearGradient(0, 0, 0, CH * 0.08);
      gt.addColorStop(0, "rgba(5,8,16,1)"); gt.addColorStop(1, "rgba(5,8,16,0)");
      ctx.fillStyle = gt; ctx.fillRect(0, 0, CW, CH * 0.08);
      const gr2 = ctx.createLinearGradient(CW * 0.75, 0, CW, 0);
      gr2.addColorStop(0, "rgba(5,8,16,0)"); gr2.addColorStop(1, "rgba(5,8,16,1)");
      ctx.fillStyle = gr2; ctx.fillRect(CW * 0.75, 0, CW * 0.25, CH);
    }

    scatter();
    function loop(ts: number) {
      rafId = requestAnimationFrame(loop);
      ctx.clearRect(0, 0, CW, CH); ctx.fillStyle = "rgba(5,8,16,0.55)"; ctx.fillRect(0, 0, CW, CH);
      drawWeb(); drawNodes(); drawRipples(); drawBeams(); drawYou(); drawVignette(); tryFire(ts);
    }
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", top: -10, right: -20, width: 220, height: 280, pointerEvents: "none", zIndex: 1, opacity: 0.8 }}
    />
  );
};

/* ─────────────────────────
   Terms of Service Sheet
───────────────────────── */
const TermsSheet = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[480px] max-h-[80vh] rounded-t-[20px] flex flex-col"
        style={{ background: "linear-gradient(180deg,#0d0b24 0%,#050810 100%)", border: "1px solid rgba(99,89,255,0.18)", borderBottom: "none" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(236,233,255,0.15)" }} />
        </div>
        <div className="px-6 pb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold" style={{ fontFamily: "'Space Mono',monospace", color: "#A89FFF", letterSpacing: "1px" }}>
            TERMS OF SERVICE
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(99,89,255,0.1)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(236,233,255,0.5)" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 pb-8 overflow-y-auto" style={{ color: "rgba(236,233,255,0.65)", fontSize: "13px", lineHeight: "1.7" }}>
          <p style={{ color: "rgba(236,233,255,0.3)", fontSize: "11px", marginBottom: "16px" }}>Last updated: February 28, 2026</p>
          <p style={{ marginBottom: "12px" }}>By using HyperCopy (&quot;the Platform&quot;), you acknowledge and agree to the following terms.</p>
          {[
            ["1. Custodial Wallet Arrangement", "HyperCopy generates a dedicated trading wallet on your behalf. Private keys are encrypted and stored by the Platform. You acknowledge this custodial model carries inherent risk including potential loss of funds due to security breaches, technical failures, or operational errors."],
            ["2. Trading Risks", "Copy trading involves automatically replicating trades from KOL social media signals. You accept that: (a) past performance doesn't guarantee future results; (b) you may lose some or all deposited funds; (c) leveraged perpetual futures amplifies gains and losses; (d) AI signal detection may be inaccurate or delayed."],
            ["3. Fees", "HyperCopy charges a builder fee of 0.1% (10 basis points) per trade. Deposits and zero-fee withdrawals incur no additional charge, though cross-chain bridging may involve minimal network fees (~0.06%)."],
            ["4. Not Investment Advice", "Nothing on the Platform constitutes financial, investment, legal, or tax advice. All trading decisions are made at your own risk. Consult qualified professionals before making financial decisions."],
            ["5. Eligibility", "You represent that you are at least 18 years old and that use of cryptocurrency trading platforms is not prohibited in your jurisdiction."],
            ["6. Service Availability", "HyperCopy is provided \"as is\" and \"as available\". We do not guarantee uninterrupted operation and are not liable for losses from service interruptions."],
            ["7. Limitation of Liability", "To the maximum extent permitted by law, HyperCopy and its operators are not liable for direct, indirect, incidental, consequential, or punitive damages from your use of the Platform."],
            ["8. Changes to Terms", "HyperCopy reserves the right to modify these terms at any time. Continued use constitutes acceptance of the revised terms."],
          ].map(([title, body]) => (
            <div key={title} style={{ marginBottom: "16px" }}>
              <p style={{ color: "#A89FFF", fontWeight: 600, fontSize: "12px", marginBottom: "4px", fontFamily: "'Space Mono',monospace" }}>{title}</p>
              <p>{body}</p>
            </div>
          ))}
          <p style={{ color: "rgba(236,233,255,0.3)", fontSize: "11px", marginTop: "12px" }}>Questions? support@hypercopy.io</p>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────
   Main onboarding
───────────────────── */
const OnboardingContent = () => {
  const { ready, login, authenticated } = usePrivy();
  const router = useRouter();
  const from = useSearchParams().get("from") as string | null;

  const [walletReady, setWalletReady] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [hasBalance, setHasBalance] = useState(false);

  useEffect(() => { if (authenticated && from && from !== "orderPlace") router.push(from); }, [from, authenticated, router]);

  useEffect(() => {
    if (!authenticated) { setWalletReady(false); return; }
    createOrGetWallet().then(() => setWalletReady(true)).catch(() => setWalletReady(true));
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated || !walletReady) return;
    getWalletBalance().then(b => { if (b.hl_equity > 0 || b.arb_usdc > 0) setHasBalance(true); }).catch(() => {});
  }, [authenticated, walletReady]);

  useEffect(() => {
    if (authenticated && walletReady && hasBalance) {
      toast.success("Welcome back! Redirecting...");
      const t = setTimeout(() => router.push("/dashboard"), 1000);
      return () => clearTimeout(t);
    }
  }, [authenticated, walletReady, hasBalance, router]);

  const currentStep = useMemo(() => (!authenticated || !walletReady ? 0 : 1), [authenticated, walletReady]);

  const buttonLabel = useMemo(() => {
    if (!authenticated) return "GET STARTED →";
    if (!walletReady) return "SETTING UP...";
    return "DEPOSIT & START TRADING →";
  }, [authenticated, walletReady]);

  const handleClickContinue = () => {
    if (!authenticated) { login(); return; }
    if (walletReady) setShowDeposit(true);
  };

  const handleDepositSuccess = useCallback(() => {
    toast.success("Deposit started! Redirecting to dashboard...");
    setTimeout(() => router.push("/dashboard"), 1500);
  }, [router]);

  if (!ready) return <FullScreenLoader />;

  return (
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", background: "#050810", color: "#ECE9FF", minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      {/* Google fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');`}</style>

      {/* Noise overlay */}
      <div style={{ position: "fixed", inset: 0, opacity: 0.35, pointerEvents: "none", zIndex: 100, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")` }} />

      {/* Aurora */}
      <div style={{ position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)", width: 520, height: 520, background: "radial-gradient(ellipse 60% 40% at 40% 50%,rgba(99,89,255,0.18) 0%,transparent 60%),radial-gradient(ellipse 50% 35% at 65% 45%,rgba(29,158,117,0.14) 0%,transparent 60%),radial-gradient(ellipse 40% 30% at 50% 70%,rgba(217,70,239,0.08) 0%,transparent 60%)", pointerEvents: "none", animation: "drift 8s ease-in-out infinite alternate" }} />

      <style>{`
        @keyframes drift { from{transform:translateX(-50%) scale(1);} to{transform:translateX(-50%) scale(1.08) translateY(10px);} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.4;transform:scale(0.65);} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px);} to{opacity:1;transform:translateY(0);} }
        @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
        @keyframes shimmer { 0%{transform:translateX(-100%);} 100%{transform:translateX(200%);} }
        @keyframes gradPulse { 0%,100%{box-shadow:0 8px 24px rgba(99,89,255,0.3);} 50%{box-shadow:0 12px 36px rgba(99,89,255,0.55);} }
      `}</style>

      {/* Nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0", position: "relative", zIndex: 3 }}>
        <Image src={logoIcon} alt="logo" width={80} height={80} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Space Mono',monospace", fontSize: 10, color: "#1D9E75", letterSpacing: "0.5px" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#1D9E75", boxShadow: "0 0 8px #1D9E75", animation: "pulse 1.8s ease-in-out infinite" }} />
          LIVE ON HL L1
        </div>
      </div>

      {/* Hero (with canvas) */}
      <div style={{ padding: "36px 24px 0", position: "relative", zIndex: 3, minHeight: 280 }}>
        <NetworkCanvas />

        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(99,89,255,0.12)", border: "1px solid rgba(99,89,255,0.3)", borderRadius: 20, padding: "5px 12px", fontFamily: "'Space Mono',monospace", fontSize: 9, color: "#A89FFF", letterSpacing: "0.5px", marginBottom: 18, animation: "fadeIn 0.7s ease-out both", whiteSpace: "nowrap" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#6359FF", boxShadow: "0 0 6px #6359FF" }} />
          400+ KOLs · Real-time signals
        </div>

        <h1 style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.08, letterSpacing: "-1.2px", marginBottom: 14, maxWidth: 230, animation: "slideUp 0.7s ease-out 0.1s both" }}>
          Copy the best<br />crypto minds.<br />
          <span style={{ background: "linear-gradient(135deg,#6359FF 0%,#1D9E75 60%,#D946EF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Automatically.</span>
        </h1>

        <p style={{ fontSize: 13, fontWeight: 400, color: "rgba(236,233,255,0.5)", lineHeight: 1.65, marginBottom: 32, maxWidth: 260, animation: "slideUp 0.7s ease-out 0.2s both" }}>
          HyperCopy monitors crypto Twitter,{" "}
          <strong style={{ color: "rgba(236,233,255,0.8)", fontWeight: 500 }}>scores every KOL&apos;s accuracy</strong>,
          and fires your trades on HyperLiquid the moment they call it.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 0", margin: "0 24px 36px", animation: "fadeIn 0.8s ease-out 0.3s both" }}>
        {[
          { v: "400+", l: "KOLs", c: "#A89FFF" },
          { v: "$0", l: "Withdraw fee", c: "#1D9E75" },
          { v: "8", l: "Chains", c: "#ECE9FF" },
          { v: "15s", l: "To order", c: "#1D9E75" },
        ].map((s, i, arr) => (
          <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 18, fontWeight: 700, letterSpacing: "-0.8px", color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 9, color: "rgba(236,233,255,0.35)", marginTop: 4, letterSpacing: "0.5px", textTransform: "uppercase" }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{ padding: "0 24px", marginBottom: 32, animation: "slideUp 0.7s ease-out 0.35s both" }}>
        {[
          { icon: "🟢", title: "Auto-Trade", color: "#1D9E75", border: "rgba(29,158,117,0.28)", bg: "rgba(29,158,117,0.08)", desc: "Mirror top KOL positions automatically as they call it on Twitter." },
          { icon: "🔗", title: "Connect X", color: "#6359FF", border: "rgba(99,89,255,0.28)", bg: "rgba(99,89,255,0.08)", desc: "Link your account and see favourite KOL tweet performance in real time." },
          { icon: "⚙️", title: "Customized", color: "#D946EF", border: "rgba(217,70,239,0.28)", bg: "rgba(217,70,239,0.08)", desc: "Set per-KOL leverage, TP/SL, and counter-trade mode on your terms." },
        ].map(f => (
          <div key={f.title} style={{ display: "flex", alignItems: "flex-start", gap: 14, background: f.bg, border: `1px solid ${f.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>{f.icon}</span>
            <div>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, fontWeight: 700, color: f.color, letterSpacing: "1px", marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: "rgba(236,233,255,0.5)", lineHeight: 1.55 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Step progress */}
      {authenticated && (
        <div style={{ padding: "0 24px", marginBottom: 20, animation: "fadeIn 0.5s ease-out both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
            {["Connect", "Deposit"].map((label, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, fontFamily: "'Space Mono',monospace", transition: "all 0.4s",
                    background: i < currentStep ? "#6359FF" : i === currentStep ? "rgba(99,89,255,0.15)" : "rgba(255,255,255,0.05)",
                    color: i < currentStep ? "#fff" : i === currentStep ? "#A89FFF" : "rgba(236,233,255,0.25)",
                    border: i === currentStep ? "1.5px solid rgba(99,89,255,0.5)" : "1.5px solid transparent",
                    boxShadow: i === currentStep ? "0 0 12px rgba(99,89,255,0.35)" : "none",
                  }}>
                    {i < currentStep ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize: 9, marginTop: 4, fontFamily: "'Space Mono',monospace", color: i <= currentStep ? "#A89FFF" : "rgba(236,233,255,0.25)", letterSpacing: "0.5px" }}>{label}</span>
                </div>
                {i < 1 && <div style={{ width: 32, height: 1, background: i < currentStep ? "rgba(99,89,255,0.5)" : "rgba(255,255,255,0.08)", marginBottom: 16 }} />}
              </div>
            ))}
          </div>
          {walletReady && (
            <p style={{ fontSize: 12, textAlign: "center", color: "rgba(236,233,255,0.4)", lineHeight: 1.55 }}>
              Deposit USDC from any of 8 chains to start copy trading — Arbitrum, Base, Ethereum and more.
            </p>
          )}
        </div>
      )}

      {/* Terms notice */}
      <p style={{ fontSize: 11, textAlign: "center", color: "rgba(236,233,255,0.35)", padding: "0 48px", marginBottom: 16, animation: "fadeIn 1s ease-out 0.8s both" }}>
        By continuing you agree to our{" "}
        <span onClick={() => setShowTerms(true)} style={{ color: "#A89FFF", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}>Terms of Service</span>.
      </p>

      {/* Primary CTA */}
      <div style={{ padding: "0 24px", marginBottom: 12, animation: "slideUp 0.7s ease-out 0.9s both" }}>
        <button
          disabled={authenticated && !walletReady}
          onClick={handleClickContinue}
          style={{
            width: "100%", height: 62, borderRadius: 16, border: "none", cursor: authenticated && !walletReady ? "not-allowed" : "pointer",
            background: "linear-gradient(135deg,#6359FF,#4F47CC)", color: "#fff",
            fontFamily: "'Space Mono',monospace", fontSize: 13, fontWeight: 700, letterSpacing: "1.5px",
            boxShadow: "0 8px 24px rgba(99,89,255,0.35)", transition: "transform 0.15s,box-shadow 0.15s",
            animation: "gradPulse 3s ease-in-out infinite", position: "relative", overflow: "hidden",
            opacity: authenticated && !walletReady ? 0.6 : 1,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 14px 32px rgba(99,89,255,0.5)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(99,89,255,0.35)"; }}
        >
          {/* shimmer */}
          <span style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)", animation: "shimmer 2.5s ease-in-out infinite", pointerEvents: "none" }} />
          {buttonLabel}
        </button>
      </div>

      {/* Secondary: skip */}
      <div style={{ padding: "0 24px", marginBottom: 48, animation: "fadeIn 1s ease-out 1s both" }}>
        <button
          onClick={() => authenticated ? router.push("/dashboard") : router.push("/copyTrading")}
          style={{
            width: "100%", height: 52, borderRadius: 14, cursor: "pointer",
            background: "transparent", color: "rgba(236,233,255,0.45)",
            fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: "1.5px",
            border: "1px solid rgba(255,255,255,0.1)", transition: "border-color 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(99,89,255,0.4)"; (e.currentTarget as HTMLButtonElement).style.color = "#A89FFF"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(236,233,255,0.45)"; }}
        >
          {authenticated ? "SKIP — GO TO DASHBOARD →" : "EXPLORE TOP TRADERS →"}
        </button>
      </div>

      {/* Deposit Sheet */}
      <DepositSheet isOpen={showDeposit} onClose={() => setShowDeposit(false)} onSuccess={handleDepositSuccess} />

      {/* Terms Sheet */}
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