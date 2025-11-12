"use client";

import Image from "next/image";
import HyperBuybackProgramIcon from "@/assets/icons/HYPE-buyback-program.png";
import { Button } from "@/components/ui/button";
import logoIcon from "@/assets/icons/logo.png";
import colors from "@/const/colors";
import { usePrivy } from "@privy-io/react-auth";
import { FullScreenLoader } from "@/components/ui/fullscreen-loader";
import { HyperLiquidContext } from "@/providers/hyperliquid";
import { useContext, useEffect, useState } from "react";
import { useCurrentWallet } from "@/hooks/usePrivyData";
import { getPerpsBalance } from "@/helpers/hyperliquid";
import { getArbUSDCBalance } from "@/helpers/arbitrum";

const Onboarding = () => {
  const { ready, login, authenticated } = usePrivy();
  const { enableTrading, tradingEnabled, infoClient } =
    useContext(HyperLiquidContext);
  const currentWallet = useCurrentWallet();
  const [perpsBalance, setPerpsBalance] = useState<number>(0);
  const [arbUSDCBalance, setArbUSDCBalance] = useState<number>(0);
  const [requestLock, setRequestLock] = useState<boolean>(false);

  useEffect(() => {
    if (!currentWallet || !infoClient || requestLock) {
      return;
    }
    setRequestLock(true);
    Promise.all([
      getPerpsBalance({
        exchClient: infoClient!,
        walletAddress: currentWallet.address!,
      }),
      getArbUSDCBalance(currentWallet.address!),
    ])
      .then(([perpsBalance, arbUSDCBalance]) => {
        setPerpsBalance(Number(perpsBalance?.marginSummary?.accountValue || 0));
        setArbUSDCBalance(Number(arbUSDCBalance));
      })
      .finally(() => {
        setRequestLock(false);
      });
  }, [currentWallet, infoClient]);

  const handleClickContinue = () => {
    if (!authenticated) {
      login();
      return;
    }
    if (perpsBalance <= 0) {
      if (arbUSDCBalance >= 0.1) {
        console.log("deposit");
      } else {
        alert("NOT ENOUGH ARBITRUM USDC");
      }
      return;
    }
    if (!tradingEnabled) {
      enableTrading();
    }
  };

  if (!ready) {
    return <FullScreenLoader />;
  }
  return (
    <div className="flex flex-col pb-5">
      <p className="mt-9" style={{ paddingLeft: "48px" }}>
        <Image src={logoIcon} alt="logo" width={100} height={100} />
      </p>
      <div
        style={{
          marginTop: "218px",
          paddingLeft: "48px",
          paddingRight: "48px",
        }}
      >
        <p className="font-light text-[26px]">Welcome</p>
        <p className="mt-1 font-light">
          HyperCopy provide Trading system designed for executing Automated
          Trading Strategies on Hyperliquid Order Books assisted by A.I
        </p>

        <p
          className="mt-6 font-bold"
          style={{
            fontFamily: "var(--font-orbitron)",
            color: "rgba(80, 210, 193, 1)",
            letterSpacing: "2px",
          }}
        >
          Auto-Trade
        </p>
        <p className="font-light">Your favorite KOL’s based on their Tweets.</p>

        <p
          className="mt-6 font-bold"
          style={{
            fontFamily: "var(--font-orbitron)",
            color: "rgba(80, 210, 193, 1)",
            letterSpacing: "2px",
          }}
        >
          Connect
        </p>
        <p className="font-light">
          Your X and See Favorite KOL’s Tweet Performances.
        </p>

        <p
          className="mt-6 font-bold"
          style={{
            fontFamily: "var(--font-orbitron)",
            color: "rgba(80, 210, 193, 1)",
            letterSpacing: "2px",
          }}
        >
          Customized
        </p>
        <p className="font-light">
          Trading strategies using X.com KOL’s and their signals.
        </p>
      </div>
      <Image
        src={HyperBuybackProgramIcon}
        alt="logo"
        className="mt-[40px] w-full"
      />
      <p
        className="mt-5 font-light text-xs w-[300px] mx-auto text-center"
        style={{
          color: "rgba(255, 255, 255, 0.7)",
        }}
      >
        By tap on the FINISH button you’re agree to our Terms and Agreement.
      </p>
      <div className="relative mx-[48px] mt-6">
        <div
          className="absolute inset-0 rounded-[38px]"
          style={{
            background:
              "radial-gradient(65.81% 100% at 77.48% 100%, #F0EA2D 0%, #50D2C1 100%)",
            padding: "1.5px",
            borderRadius: "38px",
          }}
        >
          <div
            className="w-full h-full rounded-[38px]"
            style={{ backgroundColor: colors.primary }}
          />
        </div>
        <Button
          className="h-[72px] w-full relative bg-transparent hover:bg-transparent font-semibold text-base"
          style={{
            background: "transparent",
            color: "rgba(80, 210, 193, 1)",
          }}
          onClick={handleClickContinue}
        >
          {!authenticated
            ? "CONTINUE"
            : perpsBalance <= 0
            ? arbUSDCBalance <= 0.1
              ? "NOT ENOUGH ARBITRUM USDC"
              : "DEPOSIT"
            : tradingEnabled
            ? "START"
            : "ENABLE TRADING"}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
