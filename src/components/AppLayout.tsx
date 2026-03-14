"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import Navbar from "@/components/navbar";
import { HyperLiquidContext } from "@/providers/hyperliquid";
import { useContext, useEffect, useRef, useCallback } from "react";
import { useCurrentWallet } from "@/hooks/usePrivyData";
import { usePathname } from "next/navigation";
import {
  getToken,
  setToken,
  removeToken,
  isTokenExpired,
  setRefreshHandler,
  emitTokenRefreshed,
} from "@/lib/token";
import { connectWalletApi } from "@/service";

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

  // ── Core refresh logic ─────────────────────────────────

  const doRefresh = useCallback(async (): Promise<string | null> => {
    // Resolve wallet address: external → embedded → any linked wallet
    const walletAddress =
      currentWallet?.address ??
      user?.wallet?.address ??
      (user?.linkedAccounts?.find(
        (a: any) => a.type === "wallet"
      ) as any)?.address;

    if (!walletAddress) {
      console.warn("[auth] No wallet address available for refresh");
      return null;
    }

    const twitterUsername = (user?.twitter as any)?.username ?? null;

    try {
      const { access_token } = await connectWalletApi(
        walletAddress,
        twitterUsername
      );
      setToken(access_token);
      failCount.current = 0;
      console.info("[auth] Token refreshed ✓");
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

  // ── Register refresh handler for axios interceptor ─────

  useEffect(() => {
    if (!ready || !authenticated) return;
    setRefreshHandler(doRefresh);
    return () => setRefreshHandler(async () => null);
  }, [ready, authenticated, doRefresh]);

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
    </>
  );
}