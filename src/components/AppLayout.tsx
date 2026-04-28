"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import Navbar from "@/components/navbar";
import WelcomeBackPopup from "@/components/WelcomeBackPopup";
import { HyperLiquidContext } from "@/providers/hyperliquid";
import { useContext, useEffect, useRef, useCallback, useState } from "react";
import { useCurrentWallet } from "@/hooks/usePrivyData";
import { usePathname } from "next/navigation";
import {
  getToken,
  setToken,
  removeToken,
  isTokenExpired,
  setRefreshHandler,
  setStoredWalletAddress,
  emitTokenRefreshed,
} from "@/lib/token";
import { connectWalletApi, getWelcomeBack, type WelcomeBackSummary } from "@/service";

// How often to proactively check token freshness (ms)
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { authenticated, ready, user, logout: privyLogout } = usePrivy();
  const { ready: walletsReady } = useWallets();
  const { tradingEnabled, builderFeeApproved } = useContext(HyperLiquidContext);
  const currentWallet = useCurrentWallet();
  const pathname = usePathname();
  const isOnboardingPage = pathname === "/onboarding";

  // Track consecutive failures to avoid infinite retry loops
  const failCount = useRef(0);
  const MAX_FAILURES = 3;

  // Welcome-back popup state
  const [welcomeBack, setWelcomeBack] = useState<WelcomeBackSummary | null>(null);
  const welcomeBackCalledRef = useRef(false);

  // ── Core refresh logic ─────────────────────────────────

  const doRefresh = useCallback(async (): Promise<string | null> => {
    // Resolve wallet address: external → embedded → any linked wallet
    const walletAddress =
      currentWallet?.address ??
      user?.wallet?.address ??
      (user?.linkedAccounts?.find(
        (a: any) => a.type === "wallet"
      ) as any)?.address;

    // Privy not ready yet — return null and let token.ts fall back to
    // the raw-fetch path using the wallet address stored in localStorage
    // from the last successful connect. Don't log a warning; this is a
    // routine cold-load case, not an error.
    if (!walletAddress) {
      return null;
    }

    const twitterUsername = (user?.twitter as any)?.username ?? null;

    try {
      const { access_token } = await connectWalletApi(
        walletAddress,
        twitterUsername
      );
      setToken(access_token);
      setStoredWalletAddress(walletAddress);
      failCount.current = 0;
      return access_token;
    } catch (err) {
      failCount.current += 1;
      console.warn(
        `[auth] Refresh failed (${failCount.current}/${MAX_FAILURES}):`,
        err
      );

      // After MAX_FAILURES consecutive failures, give up and clean up
      if (failCount.current >= MAX_FAILURES) {
        console.error("[auth] Max refresh failures reached — clearing token");
        removeToken();
        // Don't call privyLogout here — let user stay on public pages
      }
      return null;
    }
  }, [currentWallet?.address, user]);

  // ── Register refresh handler immediately on mount ──────
  // Don't gate on ready/authenticated — that creates a cold-load race
  // where 401s fire before Privy finishes restoring its session, leaving
  // refreshTokenSilently with no handler. doRefresh internally handles
  // the not-ready case by returning null, after which token.ts falls
  // back to a raw-fetch using the stored wallet address.
  // No cleanup that swaps the handler to a no-op — that just creates a
  // brief window where 401s fail.

  useEffect(() => {
    setRefreshHandler(doRefresh);
  }, [doRefresh]);

  // ── Proactive refresh: on mount + periodic interval ────

  useEffect(() => {
    if (!ready || !authenticated) return;

    // Check immediately on mount / when deps change
    const checkAndRefresh = async () => {
      const token = getToken();
      if (isTokenExpired(token)) {
        const newToken = await doRefresh();
        // If proactive refresh succeeded, notify listeners (e.g. dashboard)
        if (newToken) {
          emitTokenRefreshed();
        }
      }
    };

    checkAndRefresh();

    // Re-check every REFRESH_INTERVAL_MS
    const timer = setInterval(checkAndRefresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [ready, authenticated, currentWallet?.address, doRefresh]);

  // ── Refresh when app regains focus (tab switch / phone unlock) ──

  useEffect(() => {
    if (!ready || !authenticated) return;

    const onFocus = async () => {
      const token = getToken();
      if (isTokenExpired(token)) {
        const newToken = await doRefresh();
        if (newToken) {
          emitTokenRefreshed();
        }
      }
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [ready, authenticated, doRefresh]);

  // ── Welcome-back popup: call once per session after auth ──
  // Backend POST /api/portfolio/welcome-back returns { summary: null }
  // unless the user has been away ≥24h; calling it updates last_seen_at,
  // so subsequent calls within 24h are naturally idempotent. Session
  // ref + sessionStorage flag prevent double-calls if AppLayout remounts.

  useEffect(() => {
    if (!ready || !authenticated) return;
    if (welcomeBackCalledRef.current) return;
    if (typeof window !== "undefined" && sessionStorage.getItem("hc_welcome_back_done") === "1") {
      welcomeBackCalledRef.current = true;
      return;
    }
    if (isOnboardingPage) return;

    welcomeBackCalledRef.current = true;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("hc_welcome_back_done", "1");
    }

    const t = setTimeout(() => {
      getWelcomeBack()
        .then((res) => {
          if (res?.summary) setWelcomeBack(res.summary);
        })
        .catch(() => {});
    }, 600);

    return () => clearTimeout(t);
  }, [ready, authenticated, isOnboardingPage]);

  // ── Render ─────────────────────────────────────────────

  return (
    <>
      <main
        className="flex-1 w-full"
        style={{ paddingBottom: isOnboardingPage ? "0" : "80px" }}
      >
        {children}
      </main>
      {!isOnboardingPage && <Navbar />}
      {welcomeBack && (
        <WelcomeBackPopup
          summary={welcomeBack}
          onClose={() => setWelcomeBack(null)}
        />
      )}
    </>
  );
}