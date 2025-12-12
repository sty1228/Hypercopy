"use client";

import Image from "next/image";
import HyperBuybackProgramIcon from "@/assets/icons/HYPE-buyback-program.png";
import { Button } from "@/components/ui/button";
import logoIcon from "@/assets/icons/logo.png";
import colors from "@/const/colors";
import { usePrivy } from "@privy-io/react-auth";
import { FullScreenLoader } from "@/components/ui/fullscreen-loader";
import { HyperLiquidContext } from "@/providers/hyperliquid";
import { useContext, useEffect, useMemo, useState } from "react";
import { useCurrentWallet } from "@/hooks/usePrivyData";
import { getPerpsBalance } from "@/helpers/hyperliquid";
import { getArbUSDCBalance } from "@/helpers/arbitrum";
import { useArbitrumUSDCDepositWithTransfer } from "@/hooks/hyperliquid";
import { toast } from "sonner";
import onBoardBg from "@/assets/icons/onboard-bg.png";
import { useRouter } from "next/navigation";

const Onboarding = () => {
  const { ready, login, authenticated } = usePrivy();
  const router = useRouter();
  const {
    enableTrading,
    tradingEnabled,
    infoClient,
    builderFeeApproved,
    approveBuilderFee,
    agentWallet,
  } = useContext(HyperLiquidContext);
  const currentWallet = useCurrentWallet();
  const [perpsBalance, setPerpsBalance] = useState<number>(0);
  const [arbUSDCBalance, setArbUSDCBalance] = useState<number>(0);
  const [requestLock, setRequestLock] = useState<boolean>(false);
  const arbitrumUSDCDepositWithTransfer = useArbitrumUSDCDepositWithTransfer();

  const buttonText = useMemo(() => {
    console.log(
      "authenticated",
      authenticated,
      "perpsBalance",
      perpsBalance,
      "arbUSDCBalance",
      arbUSDCBalance,
      "tradingEnabled",
      tradingEnabled,
      "builderFeeApproved",
      builderFeeApproved
    );
    if (!authenticated) {
      return "CONTINUE";
    }
    if (perpsBalance <= 0) {
      return arbUSDCBalance <= 0.1
        ? "NOT ENOUGH ARBITRUM USDC"
        : `DEPOSIT 5 USDC TO START`;
    }
    if (!tradingEnabled) {
      return "ENABLE TRADING";
    }
    if (!builderFeeApproved) {
      return "APPROVE BUILDER FEE";
    }
    return "START";
  }, [
    authenticated,
    perpsBalance,
    arbUSDCBalance,
    tradingEnabled,
    builderFeeApproved,
  ]);

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

  const handleClickContinue = async () => {
    if (!authenticated) {
      login();
      return;
    }
    if (perpsBalance <= 0) {
      if (arbUSDCBalance >= 10) {
        const depositTx = await arbitrumUSDCDepositWithTransfer({
          depositAmount: 5,
        }).catch(() => null);
        console.log("depositTx", depositTx);
        if (!depositTx) {
          return;
        }
        toast.info(
          "Deposit tx has been sent, waiting for blockchain and hyperliquid confirmation...",
          {
            duration: 3_000,
          }
        );
        const timer = setInterval(() => {
          getPerpsBalance({
            exchClient: infoClient!,
            walletAddress: currentWallet!.address,
          }).then((res) => {
            console.log("res", res);
            if (
              res?.marginSummary?.accountValue &&
              Number(res.marginSummary.accountValue) > 0
            ) {
              clearInterval(timer);
              setPerpsBalance(Number(res?.marginSummary?.accountValue || 0));
              toast.success("Deposit confirmed!");
            } else {
              toast.info(
                "Keep checking hyperliquid balance, this may take 1 minute...",
                {
                  duration: 3_000,
                }
              );
            }
          });
        }, 5_000);
      } else {
        toast.error("NOT ENOUGH ARBITRUM USDC");
      }
      return;
    }
    if (!tradingEnabled) {
      enableTrading();
      return;
    }
    if (!builderFeeApproved) {
      approveBuilderFee();
      return;
    }
    router.push("/copyTrading");
  };

  if (!ready) {
    return <FullScreenLoader />;
  }
  return (
    <div
      className="flex flex-col pb-5"
      style={{
        backgroundImage: `url(${onBoardBg.src})`,
        backgroundSize: "100%",
        backgroundRepeat: "no-repeat",
        backgroundPositionX: "center",
      }}
    >
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
      <div className="relative mx-[48px] mt-6 group cursor-pointer transition-all duration-200">
        <div
          className="absolute inset-0 rounded-[38px] transition-all duration-200"
          style={{
            background:
              "radial-gradient(65.81% 100% at 77.48% 100%, #F0EA2D 0%, #50D2C1 100%)",
            padding: "1.5px",
            borderRadius: "38px",
          }}
        >
          <div
            className="w-full h-full rounded-[38px] transition-all duration-200 group-hover:bg-[rgba(80,210,193,1)] group-active:bg-[rgba(80,210,193,1)]"
            style={{
              backgroundColor: colors.primary,
              backdropFilter: "blur(0px)",
            }}
          />
        </div>
        <div
          className="absolute inset-0 rounded-[38px] opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-200 pointer-events-none"
          style={{
            backdropFilter: "blur(30px)",
          }}
        />
        <Button
          className="h-[72px] rounded-[38px] w-full relative font-semibold text-base transition-all duration-200 text-[rgba(80,210,193,1)] group-hover:text-[rgba(15,26,31,1)] group-active:text-[rgba(15,26,31,1)]"
          style={{
            background: "transparent",
            backdropFilter: "blur(0px)",
            transition: "background-color 0.2s, backdrop-filter 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(80, 210, 193, 1)";
            e.currentTarget.style.backdropFilter = "blur(30px)";
            e.currentTarget.style.color = "rgba(15, 26, 31, 1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.backdropFilter = "blur(0px)";
            e.currentTarget.style.color = "rgba(80, 210, 193, 1)";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.background = "rgba(80, 210, 193, 1)";
            e.currentTarget.style.backdropFilter = "blur(30px)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.backdropFilter = "blur(0px)";
            e.currentTarget.style.color = "rgba(80, 210, 193, 1)";
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.backdropFilter = "blur(0px)";
            e.currentTarget.style.color = "rgba(80, 210, 193, 1)";
          }}
          onClick={handleClickContinue}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
