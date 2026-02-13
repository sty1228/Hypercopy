"use client";

import {
  ConnectedWallet,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import { ethers } from "ethers";
import { useEffect, useMemo, useState } from "react";

const useCurrentWallet = () => {
  const { authenticated } = usePrivy();
  const { wallets: walletsEvm } = useWallets();

  const currentWallet = useMemo(() => {
    if (!authenticated) return null;
    return walletsEvm?.length ? walletsEvm[0] : null;
  }, [authenticated, walletsEvm]);

  return currentWallet as ConnectedWallet;
};

const useEthereumProvider = () => {
  const currentWallet = useCurrentWallet();
  const [ethereumProvider, setEthereumProvider] = useState<any>(null);

  useEffect(() => {
    if (!currentWallet) {
      setEthereumProvider(null);
      return;
    }

    if (typeof window !== "undefined" && (window as any).ethereum) {
      setEthereumProvider(
        new (ethers as any).providers.Web3Provider((window as any).ethereum)
      );
      return;
    }

    currentWallet
      .getEthereumProvider()
      .then((provider) => {
        if (!provider) {
          console.error("Failed to get Ethereum provider from wallet");
          return;
        }
        setEthereumProvider(
          new (ethers as any).providers.Web3Provider(provider as any)
        );
      })
      .catch((error: unknown) => {
        console.error("Error getting Ethereum provider:", error);
      });
  }, [currentWallet]);

  return ethereumProvider;
};

export { useCurrentWallet, useEthereumProvider };