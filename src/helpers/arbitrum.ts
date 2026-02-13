import { ethers } from "ethers";

const _ethers = ethers as any;

// v5: ethers.providers.JsonRpcProvider / v6: ethers.JsonRpcProvider
const JsonRpcProvider = _ethers.providers?.JsonRpcProvider ?? _ethers.JsonRpcProvider;
const ContractClass = _ethers.Contract;
const formatUnitsFunc = _ethers.utils?.formatUnits ?? _ethers.formatUnits;

export const ARBITRUM_HTTP_PROVIDER = new JsonRpcProvider(
  "https://arb1.arbitrum.io/rpc"
);

export const getArbUSDCBalance = async (address: string) => {
  const ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
  ];
  const contract = new ContractClass(
    "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    ABI,
    ARBITRUM_HTTP_PROVIDER
  );
  const balance = await contract.balanceOf(address);
  const readableBalance = formatUnitsFunc(
    balance,
    await contract.decimals()
  );
  console.log("Arb USDC balance: ", readableBalance);
  return readableBalance;
};