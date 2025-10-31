"use client";

import { usePrivy } from "@privy-io/react-auth";
import Navbar from "@/components/navbar";
import { HyperLiquidContext } from "@/providers/hyperliquid";
import { useContext } from "react";
import Onboarding from "@/app/onboarding/page";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { authenticated } = usePrivy();
  const { tradingEnabled } = useContext(HyperLiquidContext);

  return tradingEnabled && authenticated ? (
    <>
      <main className="flex-1 w-full" style={{ paddingBottom: "62px" }}>
        {children}
      </main>
      <Navbar />
    </>
  ) : (
    <Onboarding />
  );
}
