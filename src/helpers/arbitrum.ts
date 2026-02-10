import { ethers } from "ethers";

export const ARBITRUM_HTTP_PROVIDER = new ethers.providers.JsonRpcProvider(
  "https://arb1.arbitrum.io/rpc"
);

export const getArbUSDCBalance = async (address: string) => {
  const ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
  ];
  const contract = new ethers.Contract(
    "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    ABI,
    ARBITRUM_HTTP_PROVIDER
  );
  const balance = await contract.balanceOf(address);
  const readableBalance = ethers.utils.formatUnits(
    balance,
    await contract.decimals()
  );
  console.log("Arb USDC balance: ", readableBalance);
  return readableBalance;
};