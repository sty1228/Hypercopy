"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import Navbar from "@/components/navbar";
import { HyperLiquidContext } from "@/providers/hyperliquid";
import { useContext, useEffect, useRef } from "react";
import { useCurrentWallet } from "@/hooks/usePrivyData";
import { usePathname } from "next/navigation";
import { getToken, setToken, removeToken } from "@/lib/token";
import { connectWalletApi } from "@/service";

// ── JWT helpers ──────────────────────────────────────────

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Refresh if less than 10 min remaining (buffer for slow connections)
    return payload.exp * 1000 < Date.now() + 10 * 60 * 1000;
  } catch {
    return true;
  }
}

// ── Component ────────────────────────────────────────────

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { authenticated, ready, user } = usePrivy();
  const { ready: walletsReady } = useWallets();
  const { tradingEnabled, builderFeeApproved } = useContext(HyperLiquidContext);
  const currentWallet = useCurrentWallet();
  const pathname = usePathname();
  const isOnboardingPage = pathname === "/onboarding";

  // Prevent concurrent refresh calls
  const refreshing = useRef(false);

  useEffect(() => {
    if (!ready || !authenticated) return;

    const token = getToken();
    if (!isTokenExpired(token)) return; // still valid, nothing to do

    if (refreshing.current) return;
    refreshing.current = true;

    const silentRefresh = async () => {
      try {
        // Prefer external wallet address; fall back to embedded wallet
        const walletAddress =
          currentWallet?.address ??
          user?.wallet?.address ??
          (user?.linkedAccounts?.find(
            (a: any) => a.type === "wallet"
          ) as any)?.address;

        if (!walletAddress) return; // no wallet yet, Privy still initializing

        // Twitter username if linked
        const twitterUsername =
          (user?.twitter as any)?.username ?? null;

        const { access_token } = await connectWalletApi(
          walletAddress,
          twitterUsername
        );

        setToken(access_token);
        console.info("[auth] Token silently refreshed ✓");
      } catch (err) {
        console.warn("[auth] Silent refresh failed:", err);
        // Don't removeToken here — let the user continue browsing
        // public pages. Only remove if we get a hard 401 on a protected call.
      } finally {
        refreshing.current = false;
      }
    };

    silentRefresh();
  }, [ready, authenticated, currentWallet?.address]);

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