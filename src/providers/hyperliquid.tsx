"use client";

import { createContext, useCallback, useEffect, useState } from "react";
import * as hl from "@nktkas/hyperliquid";
import { useCurrentWallet, useEthereumProvider } from "@/hooks/usePrivyData";
import { ethers } from "ethers";
import { BigNumber } from "bignumber.js";
import { toast } from "sonner";

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
  approveBuilderFee: () => Promise.resolve(),
  builderFeeApproved: false as boolean,
  assetsInfoMap: {} as {
    [key: string]: {
      szDecimals: number;
      name: string;
      maxLeverage: number;
      marginTableId: number;
    };
  },
});

const HyperLiquidProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    console.log("process.env", process.env);
    console.log(
      "NEXT_PUBLIC_HL_BUILDER_ADDRESS",
      process.env.NEXT_PUBLIC_HL_BUILDER_ADDRESS
    );
    console.log(
      "NEXT_PUBLIC_HL_DEFAULT_BUILDER_BPS",
      process.env.NEXT_PUBLIC_HL_DEFAULT_BUILDER_BPS
    );
    console.log(
      "NEXT_PUBLIC_HL_DEFAULT_LEVERAGE",
      process.env.NEXT_PUBLIC_HL_DEFAULT_LEVERAGE
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
  const [assetsInfoMap, setAssetsInfoMap] = useState<{
    [key: string]: {
      szDecimals: number;
      name: string;
      maxLeverage: number;
      marginTableId: number;
      onlyIsolated?: true | undefined;
      isDelisted?: true | undefined;
    };
  }>({});
  const [builderFeeApproved, setBuilderFeeApproved] = useState<boolean>(false);
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
    checkBuilderFeeApproved();
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

  const initAgentWallet = async () => {
    const agentWalletPrivateKey = localStorage.getItem("agentWalletPrivateKey");
    // 如果已经有保存，就根据已经保存的创建
    if (agentWalletPrivateKey) {
      setAgentWallet(new ethers.Wallet(agentWalletPrivateKey));
      return;
    }
    // 如果之前没有创建过，就随机生成一个
    const createAgentWallet = ethers.Wallet.createRandom();
    localStorage.setItem("agentWalletPrivateKey", createAgentWallet.privateKey);
    setAgentWallet(createAgentWallet);
  };

  const initInfoAndMainExchClient = async (signer: ethers.Signer) => {
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
  };

  const initExchClient = async () => {
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

  const checkBuilderFeeApproved = async () => {
    if (!infoClient || !currentWallet) {
      return;
    }
    const builderFee = await infoClient
      .maxBuilderFee({
        builder: process.env.NEXT_PUBLIC_HL_BUILDER_ADDRESS!,
        user: currentWallet.address!,
      })
      .catch(() => 0);
    console.log("builderFee", builderFee);
    // ⚠️ maximum fee approved in tenths of a basis point i.e. 1 means 0.001%
    setBuilderFeeApproved(
      new BigNumber(builderFee)
        .dividedBy(10)
        .isEqualTo(
          new BigNumber(process.env.NEXT_PUBLIC_HL_DEFAULT_BUILDER_BPS!)
        )
    );
  };

  const approveBuilderFee = async () => {
    if (!mainExchClient) {
      return;
    }
    const maxFeeRate = process.env.NEXT_PUBLIC_HL_DEFAULT_BUILDER_BPS!;
    const builderAddress = process.env.NEXT_PUBLIC_HL_BUILDER_ADDRESS;
    if (!maxFeeRate || !builderAddress) {
      toast.error("Builder fee config is not set");
      return;
    }
    await mainExchClient
      .approveBuilderFee({
        maxFeeRate: `${new BigNumber(maxFeeRate).dividedBy(100).toString()}%`,
        builder: builderAddress!,
      })
      .then(() => {
        setBuilderFeeApproved(true);
      })
      .catch((e) => {
        console.log("failed to approve builder fee", e);
        setBuilderFeeApproved(false);
      });
  };

  const loadMarketAssetData = async () => {
    if (!infoClient) {
      return;
    }
    const result = await infoClient.meta().catch(() => null);
    if (!result) {
      return;
    }
    const assetMap: typeof placeOrderAssets = {};
    const tempAssetsInfoMap: typeof assetsInfoMap = {};
    result.universe.forEach((asset, index) => {
      assetMap[asset.name] = index;
      tempAssetsInfoMap[asset.name] = asset;
    });
    setPlaceOrderAssets(assetMap);
    setAssetsInfoMap(tempAssetsInfoMap);
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
        approveBuilderFee,
        placeOrderAssets,
        builderFeeApproved,
        assetsInfoMap,
      }}
    >
      {children}
    </HyperLiquidContext.Provider>
  );
};

export { HyperLiquidContext, HyperLiquidProvider };
