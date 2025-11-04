"use client";

import { createContext, useCallback, useEffect, useState } from "react";
import * as hl from "@nktkas/hyperliquid";
import { useCurrentWallet, useEthereumProvider } from "@/hooks/usePrivyData";
import { ethers } from "ethers";

const HyperLiquidContext = createContext({
  hyperLiquidTransport: null as hl.HttpTransport | null,
  infoClient: null as hl.InfoClient | null,
  mainExchClient: null as hl.ExchangeClient | null,
  exchClient: null as hl.ExchangeClient | null,
  agentWallet: null as ethers.BaseWallet | null,
  tradingEnabled: false as boolean,
  placeOrderAssets: {} as {
    [key: string]: number;
  },
  enableTrading: () => Promise.resolve(),
});

const HyperLiquidProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    console.log("NEXT_HL_BUILDER_ADDRESS", process.env.NEXT_HL_BUILDER_ADDRESS);
    console.log(
      "NEXT_HL_DEFAULT_BUILDER_BPS",
      process.env.NEXT_HL_DEFAULT_BUILDER_BPS
    );
    console.log(
      "NEXT_HL_DEFAULT_LEVERAGE",
      process.env.NEXT_HL_DEFAULT_LEVERAGE
    );
  }, []);

  const [hyperLiquidTransport, setHyperLiquidTransport] =
    useState<hl.HttpTransport | null>(null);
  const [infoClient, setInfoClient] = useState<hl.InfoClient | null>(null);
  const [exchClient, setExchClient] = useState<hl.ExchangeClient | null>(null);
  const [mainExchClient, setMainExchClient] =
    useState<hl.ExchangeClient | null>(null);
  const [agentWallet, setAgentWallet] = useState<ethers.BaseWallet | null>(
    null
  );
  const [tradingEnabled, setTradingEnabled] = useState<boolean>(false);
  const [placeOrderAssets, setPlaceOrderAssets] = useState<{
    [key: string]: number;
  }>({});

  const currentWallet = useCurrentWallet();
  const ethereumProvider = useEthereumProvider();

  useEffect(() => {
    if (!currentWallet) {
      return;
    }
    setHyperLiquidTransport(new hl.HttpTransport());
  }, [currentWallet]);

  useEffect(() => {
    if (!hyperLiquidTransport) {
      return;
    }
    const infoClient = new hl.InfoClient({
      transport: hyperLiquidTransport,
    });
    setInfoClient(infoClient);
  }, [hyperLiquidTransport]);

  useEffect(() => {
    if (!ethereumProvider || !hyperLiquidTransport) {
      return;
    }
    // 尝试获取签名者
    ethereumProvider.getSigner().then((res) => {
      console.log("signer", res);
      if (!res) {
        console.error("Failed to get signer");
        return;
      }
      initInfoAndMainExchClient(res);
      initAgentWallet();
    });
  }, [ethereumProvider, hyperLiquidTransport]);

  useEffect(() => {
    if (!(infoClient && currentWallet && agentWallet)) {
      return;
    }
    loadMarketAssetData();
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
            initExchClient();
            break;
          }
        }
      })
      .catch();
  }, [currentWallet, infoClient, agentWallet]);

  useEffect(() => {
    if (!mainExchClient || !tradingEnabled) {
      return;
    }
    approveBuilderFee();
  }, [mainExchClient, tradingEnabled]);

  const initAgentWallet = async () => {
    console.log("initAgentWallet");
    const agentWalletPrivateKey = localStorage.getItem("agentWalletPrivateKey");
    // 如果已经有保存，就根据已经保存的创建
    if (agentWalletPrivateKey) {
      setAgentWallet(new ethers.Wallet(agentWalletPrivateKey));
      console.log("initAgentWallet done");
      return;
    }
    // 如果之前没有创建过，就随机生成一个
    const createAgentWallet = ethers.Wallet.createRandom();
    localStorage.setItem("agentWalletPrivateKey", createAgentWallet.privateKey);
    setAgentWallet(createAgentWallet);
    console.log("initAgentWallet done");
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
      wallet: signer,
      transport: hyperLiquidTransport,
    });
    setMainExchClient(mainExchClient);
    console.log("initInfoAndMainExchClient done");
  };

  const initExchClient = async () => {
    console.log("initExchClient");
    if (!agentWallet || !hyperLiquidTransport) {
      console.error("Ethereum provider not found");
      return;
    }
    // 创建 exchange client
    const exchClient = new hl.ExchangeClient({
      wallet: agentWallet,
      transport: hyperLiquidTransport,
    });
    setExchClient(exchClient);
    console.log("initExchClient done");
  };

  const enableTrading = useCallback(async () => {
    if (!mainExchClient || !infoClient || !agentWallet) {
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
  }, [mainExchClient, infoClient, agentWallet]);

  const approveBuilderFee = async () => {
    if (!mainExchClient) {
      return;
    }
    const maxFeeRate = process.env.NEXT_HL_DEFAULT_BUILDER_BPS!;
    const builderAddress = process.env.NEXT_HL_BUILDER_ADDRESS;
    await mainExchClient.approveBuilderFee({
      maxFeeRate: `${new BigNumber(maxFeeRate).multipliedBy(100).toString()}%`,
      builder: builderAddress!,
    });
  };

  const loadMarketAssetData = async () => {
    console.log("loadMarketAssetData");
    if (!infoClient) {
      return;
    }
    const result = await infoClient.meta().catch(() => null);
    if (!result) {
      return;
    }
    console.log(result);
    const assetMap: typeof placeOrderAssets = {};
    result.universe.forEach((asset, index) => {
      assetMap[asset.name] = index;
    });
    setPlaceOrderAssets(assetMap);
    console.log("loadMarketAssetData done");
  };

  return (
    <HyperLiquidContext.Provider
      value={{
        hyperLiquidTransport,
        infoClient,
        mainExchClient,
        exchClient,
        agentWallet,
        tradingEnabled,
        enableTrading,
        placeOrderAssets,
      }}
    >
      {children}
    </HyperLiquidContext.Provider>
  );
};

export { HyperLiquidContext, HyperLiquidProvider };
