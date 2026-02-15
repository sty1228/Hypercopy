import { ethers } from "ethers";

const _ethers = ethers as any;

// v5: ethers.providers.JsonRpcProvider / v6: ethers.JsonRpcProvider
const JsonRpcProvider =
  _ethers.providers?.JsonRpcProvider ?? _ethers.JsonRpcProvider;
const ContractClass = _ethers.Contract;
const formatUnitsFunc = _ethers.utils?.formatUnits ?? _ethers.formatUnits;
const parseUnitsFunc = _ethers.utils?.parseUnits ?? _ethers.parseUnits;

// --- Constants ---
const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"; // Native USDC on Arbitrum
const BRIDGE_ADDRESS = "0x2Df1c51E09aECF9cacB7bc98cb1742757f163df7"; // Hyperliquid Bridge
const USDC_DECIMALS = 6;

const USDC_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

const BRIDGE_ABI = [
  "function sendUsd(address destination, uint64 amount) external",
];

// --- Provider ---
export const ARBITRUM_HTTP_PROVIDER = new JsonRpcProvider(
  "https://arb1.arbitrum.io/rpc"
);

// --- Read: USDC Balance ---
export const getArbUSDCBalance = async (address: string) => {
  const contract = new ContractClass(
    USDC_ADDRESS,
    USDC_ABI,
    ARBITRUM_HTTP_PROVIDER
  );
  const balance = await contract.balanceOf(address);
  const readableBalance = formatUnitsFunc(balance, USDC_DECIMALS);
  console.log("Arb USDC balance: ", readableBalance);
  return readableBalance;
};

// --- Write: Deposit USDC to Hyperliquid via Bridge ---
/**
 * Deposit USDC from Arbitrum into Hyperliquid L1.
 *
 * @param signer    - ethers Signer connected to Arbitrum (from wallet provider)
 * @param amount    - human-readable USDC amount, e.g. "43"
 * @param destination - L1 destination address (defaults to signer address)
 */
export const depositToHyperliquid = async (
  signer: any,
  amount: string,
  destination?: string
) => {
  const signerAddress = await signer.getAddress();
  const dest = destination ?? signerAddress;

  const rawAmount = parseUnitsFunc(amount, USDC_DECIMALS);

  const usdcContract = new ContractClass(USDC_ADDRESS, USDC_ABI, signer);
  const bridgeContract = new ContractClass(BRIDGE_ADDRESS, BRIDGE_ABI, signer);

  // Step 1: Check allowance & approve if needed
  const currentAllowance = await usdcContract.allowance(
    signerAddress,
    BRIDGE_ADDRESS
  );

  if (currentAllowance.lt ? currentAllowance.lt(rawAmount) : currentAllowance < rawAmount) {
    console.log(`Approving ${amount} USDC for bridge...`);
    const approveTx = await usdcContract.approve(BRIDGE_ADDRESS, rawAmount);
    await approveTx.wait();
    console.log("Approve confirmed:", approveTx.hash);
  } else {
    console.log("Sufficient allowance, skipping approve.");
  }

  // Step 2: Call sendUsd on the bridge contract
  console.log(`Depositing ${amount} USDC to Hyperliquid for ${dest}...`);
  const depositTx = await bridgeContract.sendUsd(dest, rawAmount);
  const receipt = await depositTx.wait();
  console.log("Deposit confirmed:", depositTx.hash);

  return { hash: depositTx.hash, blockNumber: receipt.blockNumber };
};