import {
  useSendTransaction,
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
  {
    name: "batchedDepositWithPermit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "deposits",
        type: "tuple[]",
        components: [
          { name: "user", type: "address" },
          { name: "usd", type: "uint64" },
          { name: "deadline", type: "uint256" },
          { name: "signature", type: "bytes" },
        ],
      },
    ],
    outputs: [],
  },
];

// deposit arbitrum usdc: sign permit + call bridge
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
        const depositAmountInUnits = ((ethers as any).utils)
          .parseUnits(depositAmount.toString(), usdcDecimals)
          .toString();

        // Check USDC balance
        const balance = await usdcContract.balanceOf(currentWallet.address);
        if (balance.lt((ethers as any).BigNumber.from(depositAmountInUnits))) {
          toast.error("Insufficient USDC balance");
          return null;
        }

        const nonceRaw = await usdcContract.nonces(currentWallet.address);
        const nonce = nonceRaw.toString();
        const deadline = String(Math.floor(Date.now() / 1000) + 300);

        console.log("depositAmountInUnits", depositAmountInUnits);
        console.log("nonce", nonce);
        console.log("deadline", deadline);

        // ── Step 1: Sign USDC EIP-2612 Permit via raw eth_signTypedData_v4 ──
        const domain = {
          name: isMainnet ? "USD Coin" : "USDC2",
          version: isMainnet ? "2" : "1",
          chainId: targetChainId,
          verifyingContract: usdcAddress,
        };

        const permitMessage = {
          owner: currentWallet.address,
          spender: bridgeAddress,
          value: depositAmountInUnits,
          nonce,
          deadline,
        };

        // Build the full EIP-712 typed data with EIP712Domain included
        const typedData = JSON.stringify({
          types: {
            EIP712Domain: [
              { name: "name", type: "string" },
              { name: "version", type: "string" },
              { name: "chainId", type: "uint256" },
              { name: "verifyingContract", type: "address" },
            ],
            Permit: [
              { name: "owner", type: "address" },
              { name: "spender", type: "address" },
              { name: "value", type: "uint256" },
              { name: "nonce", type: "uint256" },
              { name: "deadline", type: "uint256" },
            ],
          },
          primaryType: "Permit",
          domain,
          message: permitMessage,
        });

        console.log("Signing permit via eth_signTypedData_v4...", permitMessage);

        // Make sure we're on the right chain before signing
        const chainId = await ethereumProvider
          .getNetwork()
          .then((res: any) => res.chainId);
        if (Number(chainId) !== targetChainId) {
          await ethereumProvider
            .send("wallet_switchEthereumChain", [
              { chainId: isMainnet ? "0xa4b1" : "0x66eee" },
            ])
            .catch((e: any) => {
              console.log(e);
              throw e;
            });
        }

        // Use raw RPC call instead of Privy's signTypedData wrapper
        let signature: string;
        try {
          signature = await ethereumProvider.send("eth_signTypedData_v4", [
            currentWallet.address,
            typedData,
          ]);
        } catch (e: any) {
          console.log("Permit sign error:", e);
          toast.error("Permit signature failed");
          return null;
        }

        console.log("Permit signed:", signature);

        // ── Step 2: Call batchedDepositWithPermit on bridge contract ──
        const bridgeInterface = new ((ethers as any).utils).Interface(BRIDGE_ABI);
        const calldata = bridgeInterface.encodeFunctionData(
          "batchedDepositWithPermit",
          [
            [
              {
                user: currentWallet.address,
                usd: depositAmountInUnits,
                deadline,
                signature,
              },
            ],
          ]
        );

        console.log("Bridge calldata length:", calldata.length);
        console.log("Bridge calldata:", calldata);
        if (calldata.length < 200) {
          console.error("Calldata too short — ABI encoding likely failed");
          toast.error("Encoding error, please try again");
          return null;
        }

        const tx = await sendTransaction(
          {
            from: currentWallet.address,
            to: bridgeAddress,
            data: calldata,
            chainId: targetChainId,
          },
          { address: currentWallet.address }
        );
        console.log("Deposit tx:", tx);
        return tx;
      } catch (error) {
        console.error("Failed to deposit:", error);
        toast.error("Deposit failed");
        return null;
      }
    },
    [sendTransaction, currentWallet, ethereumProvider]
  );
};