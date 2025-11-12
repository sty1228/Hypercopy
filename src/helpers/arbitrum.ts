import { throttle, throttleAsync } from "@/lib/utils";
import { ethers } from "ethers";

const getArbUSDCBalance = async (address: string) => {
  console.log(">>> getArbUSDCBalance: ", address);
  const ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
  ];
  const contract = new ethers.Contract(
    "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    ABI,
    new ethers.JsonRpcProvider("https://arb1.arbitrum.io/rpc")
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

const getArbUSDCBalanceThrottled = throttleAsync(getArbUSDCBalance, 500);

export { getArbUSDCBalance, getArbUSDCBalanceThrottled };
