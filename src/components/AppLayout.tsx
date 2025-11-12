"use client";

import { usePrivy } from "@privy-io/react-auth";
import Navbar from "@/components/navbar";
import { HyperLiquidContext } from "@/providers/hyperliquid";
import { useContext, useEffect } from "react";
import Onboarding from "@/app/onboarding/page";
import { useCurrentWallet } from "@/hooks/usePrivyData";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { authenticated, logout } = usePrivy();
  const { tradingEnabled } = useContext(HyperLiquidContext);
  const currentWallet = useCurrentWallet();

  useEffect(() => {
    // 一个异常 case，直接在钱包中断开连接，此时 authenticated 为 true，但是获取不到当前钱包地址了
    if (authenticated && !currentWallet?.address) {
      logout();
    }
  }, [authenticated, currentWallet]);

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
