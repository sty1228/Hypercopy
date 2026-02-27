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
  agentWallet: null as any,
  tradingEnabled: false as boolean,
  placeOrderAssets: {} as {
    [key: string]: number;
  },
  enableTrading: () => Promise.resolve(),
  // Builder fee is now auto-approved by backend on first deposit.
  // Kept in context for backward compat — always true, approveBuilderFee is a no-op.
  approveBuilderFee: () => Promise.resolve(),
  builderFeeApproved: true as boolean,
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
  const [hyperLiquidTransport, setHyperLiquidTransport] =
    useState<hl.HttpTransport | null>(null);
  const [infoClient, setInfoClient] = useState<hl.InfoClient | null>(null);
  const [exchClient, setExchClient] = useState<hl.ExchangeClient | null>(null);
  const [mainExchClient, setMainExchClient] =
    useState<hl.ExchangeClient | null>(null);
  const [agentWallet, setAgentWallet] = useState<any>(null);
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

  // Builder fee is auto-approved by backend on every deposit.
  // Always true — no user action needed.
  const builderFeeApproved = true;

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
    const signer = ethereumProvider.getSigner();
    if (!signer) {
      console.error("Failed to get signer");
      return;
    }
    initInfoAndMainExchClient(signer);
    initAgentWallet();
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

  const initAgentWallet = async () => {
    const agentWalletPrivateKey = localStorage.getItem("agentWalletPrivateKey");
    if (agentWalletPrivateKey) {
      setAgentWallet(new (ethers as any).Wallet(agentWalletPrivateKey));
      return;
    }
    const createAgentWallet = (ethers as any).Wallet.createRandom();
    localStorage.setItem("agentWalletPrivateKey", createAgentWallet.privateKey);
    setAgentWallet(createAgentWallet);
  };

  const initInfoAndMainExchClient = async (signer: any) => {
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
  };

  const initExchClient = async () => {
    if (!agentWallet || !hyperLiquidTransport) {
      console.error("Ethereum provider not found");
      return;
    }
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

  // No-op — builder fee is handled by backend automatically
  const approveBuilderFee = useCallback(async () => {}, []);

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