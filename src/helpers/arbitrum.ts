import { ethers } from "ethers";

export const ARBITRUM_HTTP_PROVIDER = new ethers.JsonRpcProvider(
  "https://arb1.arbitrum.io/rpc"
);

export const getArbUSDCBalance = async (address: string) => {
  console.log(">>> getArbUSDCBalance: ", address);
  const ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
  ];
  const contract = new ethers.Contract(
    "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    ABI,
    ARBITRUM_HTTP_PROVIDER
  );
  console.log("address", address);
  const balance = await contract.balanceOf(address);
  const readableBalance = ethers.formatUnits(
    balance,
    await contract.decimals()
  );
  console.log("Arb USDC balance: ", readableBalance);
  return readableBalance;
};
