"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { FullScreenLoader } from "@/components/ui/fullscreen-loader";
import * as hl from "@nktkas/hyperliquid";
import { ethers } from "ethers";
import { BigNumber } from "bignumber.js";
import { toast } from "sonner";

export default function Home() {
  const { ready, authenticated, logout, login, user, linkEmail } = usePrivy();
  const { wallets: walletsEvm } = useWallets();
  const [ethereumProvider, setEthereumProvider] =
    useState<ethers.providers.Web3Provider | null>(null);

  const [hyperLiquidTransport, setHyperLiquidTransport] =
    useState<hl.HttpTransport | null>(null);
  const [infoClient, setInfoClient] = useState<hl.InfoClient | null>(null);
  const [exchClient, setExchClient] = useState<hl.ExchangeClient | null>(null);
  const [mainExchClient, setMainExchClient] =
    useState<hl.ExchangeClient | null>(null);
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
  const [agentWallet, setAgentWallet] = useState<ethers.Wallet | null>(null);
  const [tradingEnabled, setTradingEnabled] = useState<boolean>(false);

  const [placeOrderAsset, setPlaceOrderAsset] = useState<{
    [key: string]: number;
  }>({});
  const [orderParams, setOrderParams] = useState<{
    side: "long" | "short";
    price: number;
    size: number;
    coin: number;
    leverage: number;
  }>({
    side: "long",
    price: 10000,
    size: 0.001,
    coin: 0,
    leverage: 10,
  });
  const [openOrders, setOpenOrders] = useState<hl.OpenOrdersResponse>([]);

  const currentWallet = useMemo(() => {
    if (!authenticated) return null;
    return walletsEvm?.length ? walletsEvm[0] : null;
  }, [authenticated, walletsEvm]);

  useEffect(() => {
    if (!currentWallet) {
      return;
    }
    console.log("currentWallet", currentWallet?.address);
    setHyperLiquidTransport(new hl.HttpTransport());
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      setEthereumProvider(provider);
    }
  }, [currentWallet]);

  useEffect(
    () => {
      if (!ethereumProvider || !hyperLiquidTransport) {
        return;
      }
      const signer = ethereumProvider.getSigner();
      console.log("signer", signer);
      if (!signer) {
        console.error("Failed to get signer");
        return;
      }
      initInfoAndMainExchClient(signer);
      initAgentWallet();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ethereumProvider, hyperLiquidTransport]
  );

  useEffect(
    () => {
      if (!(infoClient && currentWallet && agentWallet)) {
        return;
      }
      loadMarketAssetData();
      batchUpdateAccountInfo(currentWallet.address);
      getOpenOrders();
      infoClient
        .extraAgents({
          user: currentWallet!.address,
        })
        .then((res) => {
          for (const agent of res) {
            if (
              agentWallet.address.toUpperCase() === agent.address.toUpperCase()
            ) {
              setTradingEnabled(true);
              break;
            }
          }
        })
        .catch();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentWallet, infoClient, agentWallet]
  );

  useEffect(
    () => {
      if (!agentWallet) {
        return;
      }
      initExchClient();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agentWallet]
  );

  const loadMarketAssetData = async () => {
    console.log("loadMarketAssetData");
    if (!infoClient) {
      return;
    }
    const result = await infoClient.meta().catch(() => null);
    if (!result) {
      return;
    }
    const assetMap: typeof placeOrderAsset = {};
    result.universe.forEach((asset, index) => {
      assetMap[asset.name] = index;
    });
    setPlaceOrderAsset(assetMap);
    console.log("loadMarketAssetData done");
  };

  const initInfoAndMainExchClient = async (signer: ethers.Signer) => {
    console.log("initInfoAndMainExchClient");
    if (!(ethereumProvider && hyperLiquidTransport)) {
      console.error("Ethereum provider not found");
      return;
    }
    const infoClient = new hl.InfoClient({
      transport: hyperLiquidTransport,
    });
    setInfoClient(infoClient);
    const mainExchClient = new hl.ExchangeClient({
      wallet: signer as any,
      transport: hyperLiquidTransport,
    });
    setMainExchClient(mainExchClient);
    console.log("initInfoAndMainExchClient done");
  };

  const initAgentWallet = async () => {
    console.log("initAgentWallet");
    const agentWalletPrivateKey = localStorage.getItem("agentWalletPrivateKey");
    if (agentWalletPrivateKey) {
      setAgentWallet(new ethers.Wallet(agentWalletPrivateKey));
      console.log("initAgentWallet done");
      return;
    }
    const createAgentWallet = ethers.Wallet.createRandom();
    localStorage.setItem("agentWalletPrivateKey", createAgentWallet.privateKey);
    setAgentWallet(createAgentWallet);
    console.log("initAgentWallet done");
  };

  const initExchClient = async () => {
    console.log("initExchClient");
    if (!agentWallet || !hyperLiquidTransport) {
      console.error("Ethereum provider not found");
      return;
    }
    const exchClient = new hl.ExchangeClient({
      wallet: agentWallet,
      transport: hyperLiquidTransport,
    });
    setExchClient(exchClient);
    console.log("initExchClient done");
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
    if (!mainExchClient) {
      return;
    }
    await mainExchClient.approveBuilderFee({
      maxFeeRate: "0.01%",
      builder: currentWallet!.address,
    });
  };

  const enableTrading = async () => {
    if (!mainExchClient || !infoClient) {
      return;
    }
    await mainExchClient
      .approveAgent({
        agentAddress: agentWallet!.address,
        agentName: "agentWallet",
      })
      .then(() => {
        setTradingEnabled(true);
      })
      .catch((e) => {
        console.log("failed to approve agent", e);
        setTradingEnabled(false);
      });
  };

  const placeOrder = async () => {
    if (!exchClient) {
      return;
    }
    console.log(orderParams);
    const result = await exchClient
      .order({
        orders: [
          {
            a: orderParams.coin,
            b: orderParams.side === "long",
            p: orderParams.price,
            s: orderParams.size,
            r: false,
            t: {
              limit: {
                tif: "Gtc",
              },
            },
          },
        ],
        grouping: "na",
      })
      .catch((e) => {
        console.log(e);
        return null;
      });
    if (!result) {
      return;
    }
    console.log(result);
    getOpenOrders();
    toast.success("Order placed successfully");
  };

  const getOpenOrders = async () => {
    if (!infoClient) {
      return;
    }
    const result = await infoClient
      .openOrders({
        user: currentWallet!.address,
      })
      .catch(() => {
        console.error("Failed to get open orders");
        return [];
      });
    console.log(result);
    setOpenOrders(result);
  };

  const cancelOrder = async (orderInfo: hl.OpenOrdersResponse[number]) => {
    if (!exchClient) {
      return;
    }
    console.log(orderInfo);
    await exchClient
      .cancel({
        cancels: [{ a: placeOrderAsset[orderInfo.coin], o: orderInfo.oid }],
      })
      .then(() => {
        getOpenOrders();
        toast.success("Order cancelled successfully");
      })
      .catch((e) => {
        console.log(e);
        toast.error("Failed to cancel order");
      });
  };

  if (!ready) {
    return <FullScreenLoader />;
  }

  return (
    <div className="font-sans items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-4 sm:pt-20">
      {authenticated ? (
        <div className="w-full flex flex-col items-center justify-center">
          <p>Connected to {currentWallet?.address}</p>
          <p className="mt-4">
            {agentWallet?.address && (
              <span>Agent wallet init as {agentWallet.address}</span>
            )}
          </p>
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
              <span>Linked to {user?.email.address}</span>
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
          <div className="mt-4">
            {exchClient ? (
              <>
                <p className="text-center">Hyperliquid Connected</p>
                <p className="text-center">Perps balance:</p>
                <p className="text-center">{accountBalance.perps.USDC} USDC</p>
                <p className="text-center mt-1">Spot balance:</p>
                <p className="text-center">
                  {Object.keys(accountBalance.spot || {})
                    .map((key) => `${key}: ${accountBalance.spot![key]}`)
                    .join(", ")}
                </p>
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
                {agentWallet && tradingEnabled ? (
                  <>
                    {accountBalance.perps.USDC > 10 ? (
                      <div className="mt-8">
                        <p>Order params: &nbsp;</p>
                        <p className="mt-2">
                          <select
                            className="bg-red-500"
                            name="side"
                            id="side"
                            value={orderParams.side}
                            onChange={(e) => {
                              setOrderParams((prev) => {
                                return {
                                  ...prev,
                                  side: e.target.value as "long" | "short",
                                };
                              });
                            }}
                          >
                            <option value="long">long</option>
                            <option value="short">short</option>
                          </select>
                          &nbsp;&nbsp;&nbsp;&nbsp;
                          <input
                            type="number"
                            name="size"
                            id="size"
                            className="w-18 bg-red-500 text-center"
                            value={orderParams.size}
                            onChange={(e) => {
                              setOrderParams((prev) => {
                                return {
                                  ...prev,
                                  size: Number(e.target.value),
                                };
                              });
                            }}
                          />
                          &nbsp;&nbsp;
                          <select
                            className="bg-red-500"
                            name="coin"
                            id="coin"
                            value={orderParams.coin}
                            onChange={(e) => {
                              setOrderParams((prev) => {
                                return {
                                  ...prev,
                                  coin: Number(e.target.value),
                                };
                              });
                            }}
                          >
                            {Object.keys(placeOrderAsset)
                              .slice(0, 5)
                              .map((key) => (
                                <option value={placeOrderAsset[key]} key={key}>
                                  {key}
                                </option>
                              ))}
                          </select>
                          &nbsp;&nbsp;at&nbsp;&nbsp;
                          <input
                            type="number"
                            name="price"
                            id="price"
                            className="w-18 bg-red-500 text-center"
                            value={orderParams.price}
                            onChange={(e) => {
                              setOrderParams((prev) => {
                                return {
                                  ...prev,
                                  price: Number(e.target.value),
                                };
                              });
                            }}
                          />
                          &nbsp;&nbsp;with&nbsp;&nbsp;
                          <select
                            className="bg-red-500"
                            name="leverage"
                            id="leverage"
                            value={orderParams.leverage}
                            onChange={(e) => {
                              setOrderParams((prev) => {
                                return {
                                  ...prev,
                                  leverage: Number(e.target.value),
                                };
                              });
                            }}
                          >
                            <option value="1">1x</option>
                            <option value="2">2x</option>
                            <option value="5">5x</option>
                            <option value="10">10x</option>
                            <option value="20">20x</option>
                          </select>
                          &nbsp;&nbsp;&nbsp;&nbsp;leverage
                        </p>
                        <p className="mt-4 flex justify-center">
                          <button
                            className="button w-auto rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
                            onClick={() => {
                              placeOrder();
                            }}
                          >
                            placeOrder
                          </button>
                        </p>
                      </div>
                    ) : (
                      <p className="text-center mt-8">
                        Perps balance is less than 10 USDC
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-8 flex justify-center">
                    <button
                      className="button w-auto rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
                      onClick={() => {
                        enableTrading();
                      }}
                    >
                      enable trading
                    </button>
                  </p>
                )}
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
          </div>
          <div className="mt-8 w-auto">
            <p>Open orders:</p>
            <div>
              <table>
                <thead>
                  <tr>
                    <th className="p-2 text-center">Time</th>
                    <th className="p-2 text-center">Coin</th>
                    <th className="p-2 text-center">Side</th>
                    <th className="p-2 text-center">Size</th>
                    <th className="p-2 text-center">Original Size</th>
                    <th className="p-2 text-center">Order Value</th>
                    <th className="p-2 text-center">Limit Price</th>
                    <th className="p-2 text-center">ID</th>
                    <th className="p-2 text-center"> </th>
                  </tr>
                </thead>
                <tbody>
                  {openOrders.map((order) => (
                    <tr key={order.oid}>
                      <td className="p-2 text-center">
                        {new Date(order.timestamp).toLocaleString()}
                      </td>
                      <td className="p-2 text-center">{order.coin}</td>
                      <td className="p-2 text-center">
                        {order.side === "A" ? "short" : "long"}
                      </td>
                      <td className="p-2 text-center">{order.sz}</td>
                      <td className="p-2 text-center">{order.origSz}</td>
                      <td className="p-2 text-center">
                        {new BigNumber(order.sz)
                          .multipliedBy(order.limitPx)
                          .decimalPlaces(4, BigNumber.ROUND_DOWN)
                          .toString()}
                      </td>
                      <td className="p-2 text-center">{order.limitPx}</td>
                      <td className="p-2 text-center">{order.oid}</td>
                      <td className="p-2 text-center">
                        <button
                          className="text-green-700 hover:text-green-800 cursor-pointer"
                          onClick={() => {
                            cancelOrder(order);
                          }}
                        >
                          cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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