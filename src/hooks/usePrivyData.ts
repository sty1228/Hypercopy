"use client";

import { usePrivy, useSignTypedData, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { useCallback, useMemo } from "react";

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

// 修正：这应该是一个 hook，返回一个回调函数
const useDepositWithPermit = () => {
  // 在顶层调用所有 hooks
  const { signTypedData } = useSignTypedData();
  const currentWallet = useCurrentWallet();
  const ethereumProvider = useEthereumProvider();

  // 返回一个 useCallback 包裹的函数
  const depositWithPermit = useCallback(
    async ({ depositAmount }: { depositAmount: number | string }) => {
      if (!currentWallet || !ethereumProvider) {
        alert("Wallet not connected");
        return null;
      }

      const isMainnet = true;

      try {
        // 重要：需要获取 USDC 合约的 permit nonce，不是交易 nonce
        const usdcAddress = isMainnet
          ? "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
          : "0x1baAbB04529D43a73232B713C0FE471f7c7334d5";

        const usdcContract = new ethers.Contract(
          usdcAddress,
          ["function nonces(address owner) view returns (uint256)"],
          ethereumProvider
        );

        // 获取 permit 的 nonce（不是 getTransactionCount）
        const nonce = await usdcContract.nonces(currentWallet.address);

        const payload = {
          owner: currentWallet.address,
          spender: isMainnet
            ? "0x2df1c51e09aecf9cacb7bc98cb1742757f163df7"
            : "0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89",
          value: ethers.parseUnits(depositAmount.toString(), 6).toString(),
          nonce: nonce.toString(), // 转为字符串
          deadline: (Math.floor(Date.now() / 1000) + 300).toString(),
        };

        const domain = {
          name: isMainnet ? "USD Coin" : "USDC2",
          version: isMainnet ? "2" : "1",
          chainId: isMainnet ? 42161 : 421614,
          verifyingContract: usdcAddress,
        };

        const permitTypes = {
          Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
          ],
        };

        const dataToSign = {
          domain,
          types: permitTypes,
          primaryType: "Permit",
          message: payload,
        };

        const data = await signTypedData(dataToSign).catch(() => null);

        if (!data) {
          alert("User rejected the signature request");
          return null;
        }

        const signature = ethers.Signature.from(data.signature);

        console.log("Permit signature:", {
          r: signature.r,
          s: signature.s,
          v: signature.v,
        });

        // 返回完整的 permit 数据
        return {
          owner: payload.owner,
          spender: payload.spender,
          value: payload.value,
          deadline: payload.deadline,
          nonce: payload.nonce,
          r: signature.r,
          s: signature.s,
          v: signature.v,
        };
      } catch (error) {
        console.error("Failed to sign permit:", error);
        alert(`Permit signature failed`);
        return null;
      }
    },
    [signTypedData, currentWallet, ethereumProvider]
  );

  return depositWithPermit;
};

export { useCurrentWallet, useEthereumProvider };
