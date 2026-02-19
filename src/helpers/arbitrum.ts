import { ethers } from "ethers";

const _ethers = ethers as any;

const JsonRpcProvider =
  _ethers.providers?.JsonRpcProvider ?? _ethers.JsonRpcProvider;
const ContractClass = _ethers.Contract;
const formatUnitsFunc = _ethers.utils?.formatUnits ?? _ethers.formatUnits;
const parseUnitsFunc = _ethers.utils?.parseUnits ?? _ethers.parseUnits;

// --- Constants ---
const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"; // Native USDC on Arbitrum
const BRIDGE_ADDRESS = "0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7"; // Hyperliquid Bridge2
const USDC_DECIMALS = 6;
const MIN_DEPOSIT_USDC = 5; // Minimum deposit is 5 USDC — below this, funds are lost forever!

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

// --- Provider ---
export const ARBITRUM_HTTP_PROVIDER = new JsonRpcProvider(
  "https://arb1.arbitrum.io/rpc"
);

// --- Read: USDC Balance ---
export const getArbUSDCBalance = async (address: string) => {
  const contract = new ContractClass(
    USDC_ADDRESS,
    ERC20_ABI,
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
 * Per Hyperliquid docs: simply transfer USDC to the bridge address.
 * MINIMUM 5 USDC — amounts below this are lost forever!
 *
 * @param signer - ethers Signer connected to Arbitrum (from wallet provider)
 * @param amount - human-readable USDC amount, e.g. "10"
 */
export const depositToHyperliquid = async (
  signer: any,
  amount: string,
) => {
  const amountNum = parseFloat(amount);
  if (amountNum < MIN_DEPOSIT_USDC) {
    throw new Error(`Minimum deposit is ${MIN_DEPOSIT_USDC} USDC. Amounts below this are lost forever.`);
  }

  const rawAmount = parseUnitsFunc(amount, USDC_DECIMALS);
  const usdcContract = new ContractClass(USDC_ADDRESS, ERC20_ABI, signer);

  // Simply transfer USDC to the bridge address
  console.log(`Transferring ${amount} USDC to Hyperliquid bridge...`);
  const tx = await usdcContract.transfer(BRIDGE_ADDRESS, rawAmount);
  const receipt = await tx.wait();
  console.log("Deposit confirmed:", tx.hash);

  return { hash: tx.hash, blockNumber: receipt.blockNumber };
};