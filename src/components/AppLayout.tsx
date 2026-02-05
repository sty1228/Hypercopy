"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import Navbar from "@/components/navbar";
import { HyperLiquidContext } from "@/providers/hyperliquid";
import { useContext, useEffect, useRef } from "react";
import Onboarding from "@/app/onboarding/page";
import { useCurrentWallet } from "@/hooks/usePrivyData";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { authenticated, logout, ready } = usePrivy();
  const { ready: walletsReady } = useWallets();
  const { tradingEnabled, builderFeeApproved } = useContext(HyperLiquidContext);
  const currentWallet = useCurrentWallet();
  const pathname = usePathname();
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isOnboardingPage = pathname === "/onboarding";

  useEffect(() => {
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }

    if (ready && walletsReady && authenticated && !currentWallet?.address) {
      logoutTimeoutRef.current = setTimeout(() => {
        if (authenticated && !currentWallet?.address) {
          logout();
        }
      }, 10_000);
    }

    return () => {
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
      }
    };
  }, [authenticated, currentWallet, ready, walletsReady, logout]);

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