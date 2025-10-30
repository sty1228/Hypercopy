"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { useMemo } from "react";

const useCurrentWallet = () => {
  const { authenticated } = usePrivy();
  const { wallets: walletsEvm } = useWallets();

  const currentWallet = useMemo(() => {
    if (!authenticated) return null;
    return walletsEvm?.length ? walletsEvm[0] : null;
  }, [authenticated, walletsEvm]);

  return currentWallet;
};

const useEthereumProvider = () => {
  const currentWallet = useCurrentWallet();

  const ethereumProvider = useMemo(() => {
    if (!currentWallet) {
      return null;
    }
    return new ethers.BrowserProvider(window.ethereum);
  }, [currentWallet]);

  return ethereumProvider;
};

export { useCurrentWallet, useEthereumProvider };
