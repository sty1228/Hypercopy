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

// --- Bridge constants ---
const BRIDGE_MAINNET = "0x2Df1c51E09aECF9cacB7bc98cb1742757f163df7";
const BRIDGE_TESTNET = "0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89";

const BRIDGE_ABI = [
  "function sendUsd(address destination, uint64 amount) external",
];

// deposit arbitrum usdc via bridge's sendUsd (approve + sendUsd)
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
      const bridgeAddress = isMainnet ? BRIDGE_MAINNET : BRIDGE_TESTNET;
      const targetChainId = isMainnet ? 42161 : 421614;

      try {
        await currentWallet.switchChain(targetChainId).catch((e) => {
          console.log(e);
          throw e;
        });

        const usdcContract = new (ethers as any).Contract(
          usdcAddress,
          USDC_ARB_ABI,
          ARBITRUM_HTTP_PROVIDER
        );
        const usdcDecimals = await usdcContract.decimals();

        const depositAmountInUnits = (ethers as any).utils
          .parseUnits(depositAmount.toString(), usdcDecimals)
          .toString();
        console.log("depositAmountInUnits", depositAmountInUnits);

        // --- Step 1: Approve bridge to spend USDC (if needed) ---
        const currentAllowance = await usdcContract.allowance(
          currentWallet.address,
          bridgeAddress
        );
        console.log("currentAllowance", currentAllowance.toString());

        if (currentAllowance.lt(depositAmountInUnits)) {
          const usdcInterface = new (ethers as any).utils.Interface(USDC_ARB_ABI);
          const approveCalldata = usdcInterface.encodeFunctionData("approve", [
            bridgeAddress,
            depositAmountInUnits,
          ]);
          console.log("approveCalldata", approveCalldata);

          const approveTx = await sendTransaction(
            {
              from: currentWallet.address,
              to: usdcAddress,
              data: approveCalldata,
              chainId: targetChainId,
            },
            { address: currentWallet.address }
          );
          console.log("approve tx", approveTx);
        } else {
          console.log("Sufficient allowance, skipping approve");
        }

        // --- Step 2: Call sendUsd on the bridge contract ---
        const bridgeInterface = new (ethers as any).utils.Interface(BRIDGE_ABI);
        const sendUsdCalldata = bridgeInterface.encodeFunctionData("sendUsd", [
          currentWallet.address, // destination on Hyperliquid L1
          depositAmountInUnits,
        ]);
        console.log("sendUsdCalldata", sendUsdCalldata);

        const tx = await sendTransaction(
          {
            from: currentWallet.address,
            to: bridgeAddress,        // <-- call bridge, NOT usdc
            data: sendUsdCalldata,
            chainId: targetChainId,
          },
          { address: currentWallet.address }
        );
        console.log("deposit tx", tx);
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

// deposit arbitrum usdc with permit (unchanged)
export const useArbitrumUSDCDepositWithPermit = () => {
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
        const usdcAddress = isMainnet
          ? USDC_ARB_MAINNET_ADDRESS
          : USDC_ARB_TESTNET_ADDRESS;

        const usdcContract = new (ethers as any).Contract(
          usdcAddress,
          USDC_ARB_ABI,
          ARBITRUM_HTTP_PROVIDER
        );
        console.log("usdcContract", usdcContract);

        const nonce = await usdcContract.nonces(currentWallet.address);
        const usdcDecimals = await usdcContract.decimals();
        console.log("usdcDecimals", usdcDecimals);
        console.log(
          ((ethers as any).utils).parseUnits(depositAmount.toString(), usdcDecimals).toString()
        );

        const payload = {
          owner: currentWallet.address,
          spender: isMainnet
            ? "0x2df1c51e09aecf9cacb7bc98cb1742757f163df7"
            : "0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89",
          value: ((ethers as any).utils)
            .parseUnits(depositAmount.toString(), usdcDecimals)
            .toString(),
          nonce: nonce.toString(),
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
        const chainId = await ethereumProvider
          .getNetwork()
          .then((res: any) => res.chainId);
        console.log("chainId", chainId);
        if (Number(chainId) !== 42161) {
          await ethereumProvider
            .send("wallet_switchEthereumChain", [{ chainId: "0xa4b1" }])
            .catch((e: any) => {
              console.log(e);
              throw e;
            });
        }

        const data = await signTypedData(dataToSign, {
          address: currentWallet.address,
        }).catch((e: any) => {
          console.log(e);
          return null;
        });

        if (!data) {
          toast.error("Sign typed data failed");
          return null;
        }

        const signature = ((ethers as any).utils).splitSignature(data.signature);

        console.log("Permit signature:", {
          r: signature.r,
          s: signature.s,
          v: signature.v,
        });

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