"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import Navbar from "@/components/navbar";
import { HyperLiquidContext } from "@/providers/hyperliquid";
import { useContext } from "react";
import { useCurrentWallet } from "@/hooks/usePrivyData";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { authenticated, ready } = usePrivy();
  const { ready: walletsReady } = useWallets();
  const { tradingEnabled, builderFeeApproved } = useContext(HyperLiquidContext);
  const currentWallet = useCurrentWallet();
  const pathname = usePathname();
  const isOnboardingPage = pathname === "/onboarding";

  // NOTE: Removed the 10s auto-logout for users without wallet address.
  // Twitter login users get an embedded wallet from Privy automatically
  // (createOnLogin: "users-without-wallets"), so they will always have
  // a wallet — but it may take a moment to initialize. The old timeout
  // was too aggressive and would kick out Twitter-login users.

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