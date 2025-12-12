"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import Navbar from "@/components/navbar";
import { HyperLiquidContext } from "@/providers/hyperliquid";
import { useContext, useEffect, useRef } from "react";
import Onboarding from "@/app/onboarding/page";
import { useCurrentWallet } from "@/hooks/usePrivyData";
import { usePathname } from "next/navigation";
import Script from "next/script";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { authenticated, logout, ready } = usePrivy();
  const { ready: walletsReady } = useWallets();
  const { tradingEnabled, builderFeeApproved } = useContext(HyperLiquidContext);
  const currentWallet = useCurrentWallet();
  const pathname = usePathname();
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isOnboardingPage = pathname === "/onboarding";

  useEffect(() => {
    // 清除之前的定时器
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }

    // 只有在 Privy 和钱包都准备好之后才检查
    // 给 embedded wallet 创建一些时间（最多等待 5 秒）
    if (ready && walletsReady && authenticated && !currentWallet?.address) {
      logoutTimeoutRef.current = setTimeout(() => {
        // 5 秒后如果还是没有钱包地址，才执行 logout
        // 这通常发生在用户直接在钱包中断开连接的情况
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
      <Script
        src="https://unpkg.com/vconsole@latest/dist/vconsole.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          // @ts-expect-error - VConsole is loaded dynamically
          if (typeof window !== "undefined" && window.VConsole) {
            // @ts-expect-error - VConsole is loaded dynamically
            new window.VConsole();
            console.log("VConsole init");
          }
        }}
      />
      <main
        className="flex-1 w-full"
        style={{ paddingBottom: isOnboardingPage ? "0" : "62px" }}
      >
        {children}
      </main>
      {!isOnboardingPage && <Navbar />}
    </>
  );

  return tradingEnabled && authenticated && builderFeeApproved ? (
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
