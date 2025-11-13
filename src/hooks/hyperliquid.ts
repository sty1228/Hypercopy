import {
  usePrivy,
  useSendTransaction,
  useSignTransaction,
  useSignTypedData,
} from "@privy-io/react-auth";
import { useCallback } from "react";
import { useCurrentWallet, useEthereumProvider } from "./usePrivyData";
import { ethers } from "ethers";
import { ARBITRUM_HTTP_PROVIDER } from "@/helpers/arbitrum";
import { toast } from "sonner";
import {
  USDC_ARB_ABI,
  USDC_ARB_MAINNET_ADDRESS,
  USDC_ARB_TESTNET_ADDRESS,
} from "@/assets/ABI/USDC_ARB";

// deposit arbitrum usdc by sending token
export const useArbitrumUSDCDepositWithTransfer = () => {
  const { sendTransaction } = useSendTransaction();
  const currentWallet = useCurrentWallet();
  const ethereumProvider = useEthereumProvider();

  return useCallback(
    async ({ depositAmount }: { depositAmount: number | string }) => {
      if (!currentWallet || !ethereumProvider) {
        toast.error("Wallet not connected");
        return null;
      }

      const isMainnet = true;
      const usdcAddress = isMainnet
        ? USDC_ARB_MAINNET_ADDRESS
        : USDC_ARB_TESTNET_ADDRESS;

      try {
        const targetChainId = isMainnet ? 42161 : 421614;
        await currentWallet.switchChain(targetChainId).catch((e) => {
          console.log(e);
          throw e;
        });
        console.log(currentWallet.chainId);

        const usdcContract = new ethers.Contract(
          usdcAddress,
          USDC_ARB_ABI,
          ARBITRUM_HTTP_PROVIDER
        );
        const arbUSDCContractInterface = new ethers.Interface(USDC_ARB_ABI);
        const usdcDecimals = await usdcContract.decimals();

        const depositAmountInUnits = ethers
          .parseUnits(depositAmount.toString(), usdcDecimals)
          .toString();
        console.log("depositAmountInUnits", depositAmountInUnits);
        const transferCalldata = arbUSDCContractInterface.encodeFunctionData(
          "transfer",
          [
            isMainnet
              ? "0x2df1c51e09aecf9cacb7bc98cb1742757f163df7"
              : "0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89",
            depositAmountInUnits,
          ]
        );
        console.log(transferCalldata);
        const tx = await sendTransaction(
          {
            from: currentWallet.address,
            to: usdcAddress,
            data: transferCalldata,
            chainId: isMainnet ? 42161 : 421614,
          },
          {
            address: currentWallet.address,
          }
        );
        console.log("transfer tx", tx);
        return tx;
      } catch (error) {
        console.error("Failed to deposit:", error);
        toast.error(`Deposit failed`);
        return null;
      }
    },
    [sendTransaction, currentWallet, ethereumProvider]
  );
};

// deposit arbitrum usdc with permit
export const useArbitrumUSDCDepositWithPermit = () => {
  // 在顶层调用所有 hooks
  const { signTypedData } = useSignTypedData();
  const { authenticated, user } = usePrivy();
  const currentWallet = useCurrentWallet();
  const ethereumProvider = useEthereumProvider();

  return useCallback(
    async ({ depositAmount }: { depositAmount: number | string }) => {
      if (!currentWallet || !ethereumProvider) {
        toast.error("Wallet not connected");
        return null;
      }

      const isMainnet = true;

      try {
        // 重要：需要获取 USDC 合约的 permit nonce，不是交易 nonce
        const usdcAddress = isMainnet
          ? USDC_ARB_MAINNET_ADDRESS
          : USDC_ARB_TESTNET_ADDRESS;

        const usdcContract = new ethers.Contract(
          usdcAddress,
          USDC_ARB_ABI,
          ARBITRUM_HTTP_PROVIDER
        );
        console.log("usdcContract", usdcContract);

        // 获取 permit 的 nonce（不是 getTransactionCount）
        const nonce = await usdcContract.nonces(currentWallet.address);
        const usdcDecimals = await usdcContract.decimals();
        console.log("usdcDecimals", usdcDecimals);
        console.log(
          ethers.parseUnits(depositAmount.toString(), usdcDecimals).toString()
        );

        const payload = {
          owner: currentWallet.address,
          spender: isMainnet
            ? "0x2df1c51e09aecf9cacb7bc98cb1742757f163df7"
            : "0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89",
          value: ethers
            .parseUnits(depositAmount.toString(), usdcDecimals)
            .toString(),
          nonce: nonce.toString(), // 转为字符串
          deadline: (Math.floor(Date.now() / 1000) + 300).toString(),
        };
        console.log("payload", payload);

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
        console.log("dataToSign", dataToSign);

        console.log(user);
        // 获取当前 chainId，如果不是 1 则切换至 1
        const chainId = await ethereumProvider
          .getNetwork()
          .then((res) => res.chainId);
        console.log("chainId", chainId);
        if (Number(chainId) !== 42161) {
          await ethereumProvider
            .send("wallet_switchEthereumChain", [{ chainId: "0xa4b1" }])
            .catch((e) => {
              console.log(e);
              throw e;
            });
        }

        const data = await signTypedData(dataToSign, {
          address: currentWallet.address,
        }).catch((e) => {
          console.log(e);
          return null;
        });

        if (!data) {
          toast.error("Sign typed data failed");
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
        toast.error(`Permit signature failed`);
        return null;
      }
    },
    [signTypedData, currentWallet, ethereumProvider]
  );
};
