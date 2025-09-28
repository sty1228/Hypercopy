"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { FullScreenLoader } from "@/components/ui/fullscreen-loader";
import * as hl from "@nktkas/hyperliquid";
import { ethers } from "ethers";
import { showErrorToast } from "@/components/ui/custom-toast";

export default function Home() {
  const { ready, authenticated, logout, login, user, linkEmail } = usePrivy();
  const { wallets: walletsEvm } = useWallets();
  const [ethereumProvider, setEthereumProvider] =
    useState<ethers.BrowserProvider | null>(null);
  const [infoClient, setInfoClient] = useState<hl.InfoClient | null>(null);
  const [exchClient, setExchClient] = useState<hl.ExchangeClient | null>(null);
  const [accountBalance, setAccountBalance] = useState<{
    perps: {
      USDC: number;
    };
    spot?: {
      [key: string]: number;
    };
  }>({
    perps: {
      USDC: 0,
    },
    spot: {},
  });

  const currentWallet = useMemo(() => {
    if (!authenticated) return null;
    console.log(user);
    return walletsEvm?.length ? walletsEvm[0] : null;
  }, [authenticated, user, walletsEvm]);

  useEffect(() => {
    if (!currentWallet) {
      return;
    }
    console.log("currentWallet", currentWallet?.address);
    // 先创建 provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    setEthereumProvider(provider);
    // 尝试获取签名者
    provider.getSigner().then((res) => {
      console.log("signer", res);
      if (res) {
        initExchClient(res);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWallet]);

  useEffect(() => {
    if (!(exchClient && infoClient && currentWallet)) {
      return;
    }
    // 获取用户数据
    batchUpdateAccountInfo(currentWallet.address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWallet, exchClient, infoClient]);

  useEffect(() => {
    console.log("accountBalance", accountBalance);
  }, [accountBalance]);

  const initExchClient = async (signer?: ethers.Signer) => {
    if (!ethereumProvider) {
      showErrorToast("Ethereum provider not found");
      return;
    }
    let signerForCreateExchangeClient = signer;
    if (!signerForCreateExchangeClient) {
      // 请求用户授权访问账户
      await window.ethereum.request({ method: "eth_requestAccounts" });
      // 获取签名者（Signer）
      signerForCreateExchangeClient = await ethereumProvider!.getSigner();
    }
    const transport = new hl.HttpTransport();
    // 创建 info client
    const infoClient = new hl.InfoClient({
      transport,
    });
    setInfoClient(infoClient);
    // 创建 exchange client
    const exchClient = new hl.ExchangeClient({
      wallet: signerForCreateExchangeClient,
      transport,
    });
    setExchClient(exchClient);
  };

  const batchUpdateAccountInfo = async (walletAddress: string) => {
    if (!infoClient) {
      return;
    }
    const accountRes = await Promise.all([
      infoClient
        .clearinghouseState({
          user: walletAddress,
        })
        .catch(() => null),
      infoClient
        .spotClearinghouseState({
          user: walletAddress,
        })
        .catch(() => null),
      // infoClient.userFees({
      //   user: walletAddress,
      // }).catch(() => null),
    ]);

    if (accountRes[0]) {
      setAccountBalance((prev) => {
        return {
          ...prev,
          perps: {
            USDC: Number(accountRes[0]!.marginSummary.accountValue),
          },
        };
      });
    }
    if (accountRes[1]) {
      const spotBalance: {
        [key: string]: number;
      } = {};
      accountRes[1].balances.forEach((balance) => {
        spotBalance[balance.coin] = Number(balance.total);
      });
      setAccountBalance((prev) => {
        return {
          ...prev,
          spot: spotBalance,
        };
      });
    }
  };

  const approveBuilderFee = async () => {
    if (!exchClient) {
      return;
    }
    await exchClient.approveBuilderFee({
      maxFeeRate: "0.01%",
      builder: currentWallet!.address,
    });
  };

  if (!ready) {
    return <FullScreenLoader />;
  }

  return (
    <div className="font-sans items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      {authenticated ? (
        <div className="flex flex-col items-center justify-center">
          <p>Connected to {currentWallet?.address}</p>
          <p className="mt-4">
            <button
              className="button rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
              onClick={() => {
                logout();
              }}
            >
              Logout
            </button>
          </p>
          <p className="mt-4">
            {user?.email ? (
              <text>Linked to {user?.email.address}</text>
            ) : (
              <button
                className="button rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
                onClick={() => {
                  linkEmail();
                }}
              >
                Link Email
              </button>
            )}
          </p>
          <p className="mt-4">
            {exchClient ? (
              <>
                <p>Hyperliquid Connected</p>
                {/* balance info */}
                <p>Perps balance:</p>
                <p>{accountBalance.perps.USDC} USDC</p>
                <p className="mt-1">Spot balance:</p>
                <p>
                  {Object.keys(accountBalance.spot || {})
                    .map((key) => `${key}: ${accountBalance.spot![key]}`)
                    .join(", ")}
                </p>
                {/* approve builder codes */}
                <p className="mt-2 flex justify-center">
                  <button
                    className="button w-auto rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
                    onClick={() => {
                      approveBuilderFee();
                    }}
                  >
                    approveBuilderFee
                  </button>
                </p>
              </>
            ) : (
              <button
                className="button w-auto rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
                onClick={() => {
                  initExchClient();
                }}
              >
                Link Hyperliquid
              </button>
            )}
          </p>
          <p></p>
        </div>
      ) : (
        <button
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
          onClick={() => {
            login();
            setTimeout(() => {
              (
                document.querySelector(
                  'input[type="email"]'
                ) as HTMLInputElement
              )?.focus();
            }, 150);
          }}
        >
          Start now
        </button>
      )}
    </div>
  );
}
