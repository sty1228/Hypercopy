"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import axiosInstance from "@/lib/axios";
import { applyReferralCode } from "@/service";

interface PublicSlots {
  total_slots: number;
  slots_used: number;
  free_tier_total: number;
  free_tier_full: boolean;
  inviter_username: string | null;
  inviter_display_name: string | null;
  inviter_avatar_url: string | null;
  code_valid: boolean;
}

const avatarColors = ["#e74c3c","#8e44ad","#2980b9","#27ae60","#f39c12","#1abc9c"];
const getColor = (s: string) =>
  avatarColors[s.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length];

function JoinPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, authenticated, ready } = usePrivy();
  const ref = searchParams.get("ref") || "";

  const [slots, setSlots] = useState<PublicSlots | null>(null);
  const [barPct, setBarPct] = useState(0);
  const [loginLoading, setLoginLoading] = useState(false);
  const [applyDone, setApplyDone] = useState(false);
  const [applyError, setApplyError] = useState("");
  const hasApplied = useRef(false);

  // Fetch public slot info + validate code
  useEffect(() => {
    const url = ref
      ? `/referral/public-slots?code=${encodeURIComponent(ref)}`
      : "/referral/public-slots";
    axiosInstance.get<PublicSlots>(url)
      .then(r => {
        setSlots(r.data);
        setTimeout(() => setBarPct(Math.min(100, (r.data.slots_used / r.data.total_slots) * 100)), 400);
      })
      .catch(() => {});
  }, [ref]);

  // After login: auto-apply referral code if present
  useEffect(() => {
    if (!authenticated || !ready || !ref || hasApplied.current) return;
    hasApplied.current = true;
    applyReferralCode(ref)
      .then(() => { setApplyDone(true); setTimeout(() => router.push("/dashboard"), 1800); })
      .catch(err => {
        const msg = err?.response?.data?.detail || "";
        // Already applied or own code → still redirect
        if (msg.includes("already") || msg.includes("own")) {
          router.push("/dashboard");
        } else {
          setApplyError(msg || "Failed to apply code");
          setTimeout(() => router.push("/dashboard"), 2500);
        }
      });
  }, [authenticated, ready, ref]);

  // If already logged in and no ref code, just go to dashboard
  useEffect(() => {
    if (ready && authenticated && !ref) router.push("/dashboard");
  }, [ready, authenticated, ref]);

  const handleLogin = () => {
    setLoginLoading(true);
    login();
  };

  const slotsLeft = slots ? slots.total_slots - slots.slots_used : null;
  const inviter = slots?.inviter_username;
  const codeValid = slots?.code_valid ?? (ref.length > 0);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg,#0a0e14 0%,#060910 100%)",
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px 48px",
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
        .join-btn { cursor:pointer; transition:all 0.18s; }
        .join-btn:active { transform:scale(0.97); }
        .join-btn:hover { opacity:0.92; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 420, animation: "fadeUp 0.5s ease" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)", borderRadius: 12, padding: "6px 14px" }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#2dd4bf,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>H</div>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#2dd4bf" }}>HyperCopy</span>
          </div>
        </div>

        {/* Inviter card */}
        {ref && (
          <div style={{ marginBottom: 16, background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.15)", borderRadius: 18, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, animation: "fadeUp 0.5s 0.1s both" }}>
            {inviter ? (
              <>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${getColor(inviter)},${getColor(inviter + "x")})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                  {inviter[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>You were invited by</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#2dd4bf" }}>@{inviter}</div>
                </div>
                <div style={{ marginLeft: "auto", background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.2)", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: "#2dd4bf", flexShrink: 0 }}>
                  +15% PTS
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                {codeValid ? `Referral code: ${ref}` : "Invalid referral code"}
              </div>
            )}
          </div>
        )}

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 24, animation: "fadeUp 0.5s 0.15s both" }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.2, margin: "0 0 10px" }}>
            Copy Trade the Best<br />
            <span style={{ background: "linear-gradient(90deg,#2dd4bf,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Crypto KOLs</span>
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: 0 }}>
            Auto-copy signals from top traders on HyperLiquid L1. No experience needed.
          </p>
        </div>

        {/* Benefits */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14, animation: "fadeUp 0.5s 0.2s both" }}>
          <div style={{ background: "rgba(45,212,191,0.07)", border: "1px solid rgba(45,212,191,0.14)", borderRadius: 14, padding: "14px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#2dd4bf" }}>+15%</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>Points Boost</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 1 }}>permanent</div>
          </div>
          <div style={{ background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.18)", borderRadius: 14, padding: "14px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#a855f7" }}>10</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>Free Copy Trades</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 1 }}>no platform fees</div>
          </div>
        </div>

        {/* Slot progress */}
        {slots && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px", marginBottom: 14, animation: "fadeUp 0.5s 0.25s both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Reduced Fee Slots</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>
                  First {slots.total_slots.toLocaleString()} users get locked-in low fees forever
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b" }}>
                  {slotsLeft !== null ? slotsLeft.toLocaleString() : "—"}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>slots left</div>
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 99, height: 7, overflow: "hidden", marginBottom: 6 }}>
              <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#2dd4bf,#f59e0b)", width: `${barPct}%`, transition: "width 1.2s cubic-bezier(0.25,0.46,0.45,0.94)", boxShadow: "0 0 10px rgba(245,158,11,0.4)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{slots.slots_used} / {slots.total_slots} claimed</span>
              <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700 }}>🔥 {Math.round(barPct)}% full</span>
            </div>
            <div style={{ marginTop: 10, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.14)", borderRadius: 10, padding: "7px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#22c55e" }}>✦ First 100 Users — Free Forever</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 6, padding: "2px 7px" }}>
                {slots.free_tier_full ? "FULL" : "OPEN"}
              </span>
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ animation: "fadeUp 0.5s 0.3s both" }}>
          {applyDone ? (
            <div style={{ textAlign: "center", padding: "18px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 16 }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>🎉</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#22c55e" }}>Referral code applied!</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Redirecting to dashboard...</div>
            </div>
          ) : applyError ? (
            <div style={{ textAlign: "center", padding: "14px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: "#f87171" }}>{applyError}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Redirecting to dashboard...</div>
            </div>
          ) : authenticated ? (
            <div style={{ textAlign: "center", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(45,212,191,0.3)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Applying referral code...</span>
            </div>
          ) : (
            <>
              <button
                className="join-btn"
                onClick={handleLogin}
                disabled={loginLoading}
                style={{
                  width: "100%",
                  padding: "15px",
                  borderRadius: 14,
                  background: "linear-gradient(135deg,rgba(45,212,191,0.25),rgba(45,212,191,0.15))",
                  border: "1px solid rgba(45,212,191,0.35)",
                  color: "#2dd4bf",
                  fontSize: 15,
                  fontWeight: 800,
                  opacity: loginLoading ? 0.7 : 1,
                }}
              >
                {loginLoading ? "Opening..." : ref ? "Claim Your Bonus & Sign Up" : "Get Started →"}
              </button>
              <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 10 }}>
                Connect with wallet, X account, email, or passkey
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 28, fontSize: 11, color: "rgba(255,255,255,0.15)" }}>
          hypercopy.io · Built on HyperLiquid L1
        </div>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0a0e14", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid rgba(45,212,191,0.3)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <JoinPageInner />
    </Suspense>
  );
}