/**
 * Multi-chain deposit configuration
 * Supports direct USDC transfer (Arbitrum) and Stargate V2 cross-chain bridge (other chains)
 *
 * ⚠️  VERIFY Stargate V2 pool addresses before going to production:
 *     https://stargateprotocol.gitbook.io/stargate/v/v2/developers/contract-addresses/mainnet
 */

// ── Chain definitions ──

export interface ChainConfig {
  chainId: number;
  name: string;
  shortName: string;
  icon: string; // emoji fallback, replace with SVG if desired
  rpcUrl: string;
  nativeCurrency: { symbol: string; decimals: number };
  usdc: string; // USDC contract address
  stargatePool: string | null; // null = Arbitrum (direct transfer, no bridge needed)
  lzEid: number; // LayerZero V2 endpoint ID
  explorerUrl: string;
  color: string; // brand color for UI
}

// LayerZero V2 Endpoint ID for Arbitrum (destination chain)
export const ARB_LZ_EID = 30110;

export const CHAINS: Record<string, ChainConfig> = {
  arbitrum: {
    chainId: 42161,
    name: "Arbitrum",
    shortName: "ARB",
    icon: "🔵",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    nativeCurrency: { symbol: "ETH", decimals: 18 },
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    stargatePool: null, // Direct transfer — no Stargate needed
    lzEid: 30110,
    explorerUrl: "https://arbiscan.io",
    color: "#2D9CDB",
  },
  ethereum: {
    chainId: 1,
    name: "Ethereum",
    shortName: "ETH",
    icon: "🔷",
    rpcUrl: "https://eth.llamarpc.com",
    nativeCurrency: { symbol: "ETH", decimals: 18 },
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    stargatePool: "0xc026395860Db2d07ee33e05fE50ed7bD583189C7",
    lzEid: 30101,
    explorerUrl: "https://etherscan.io",
    color: "#627EEA",
  },
  base: {
    chainId: 8453,
    name: "Base",
    shortName: "BASE",
    icon: "🔵",
    rpcUrl: "https://mainnet.base.org",
    nativeCurrency: { symbol: "ETH", decimals: 18 },
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    stargatePool: "0x27a16dc786820B16E5c9028b75B99F6f604b5d26",
    lzEid: 30184,
    explorerUrl: "https://basescan.org",
    color: "#0052FF",
  },
  optimism: {
    chainId: 10,
    name: "Optimism",
    shortName: "OP",
    icon: "🔴",
    rpcUrl: "https://mainnet.optimism.io",
    nativeCurrency: { symbol: "ETH", decimals: 18 },
    usdc: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    stargatePool: "0xcE8CcA271Ebc0533920C83d39F417ED6A0abB7D0",
    lzEid: 30111,
    explorerUrl: "https://optimistic.etherscan.io",
    color: "#FF0420",
  },
  polygon: {
    chainId: 137,
    name: "Polygon",
    shortName: "POL",
    icon: "🟣",
    rpcUrl: "https://polygon-rpc.com",
    nativeCurrency: { symbol: "POL", decimals: 18 },
    usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    stargatePool: "0x9Aa02D4Fae7F58b8E8f34c66E756cC734DAc7fe4",
    lzEid: 30109,
    explorerUrl: "https://polygonscan.com",
    color: "#8247E5",
  },
};

// Ordered list for the chain selector UI
export const CHAIN_LIST = [
  CHAINS.arbitrum,
  CHAINS.ethereum,
  CHAINS.base,
  CHAINS.optimism,
  CHAINS.polygon,
];

// ── USDC ABI (minimal — only what we need) ──

export const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

export const USDC_DECIMALS = 6;

// ── Stargate V2 Pool ABI (minimal — quoteSend + sendToken) ──

export const STARGATE_POOL_ABI = [
  // quoteSend: estimate cross-chain fee
  {
    inputs: [
      {
        components: [
          { name: "dstEid", type: "uint32" },
          { name: "to", type: "bytes32" },
          { name: "amountLD", type: "uint256" },
          { name: "minAmountLD", type: "uint256" },
          { name: "extraOptions", type: "bytes" },
          { name: "composeMsg", type: "bytes" },
          { name: "oftCmd", type: "bytes" },
        ],
        name: "_sendParam",
        type: "tuple",
      },
      { name: "_payInLzToken", type: "bool" },
    ],
    name: "quoteSend",
    outputs: [
      {
        components: [
          { name: "nativeFee", type: "uint256" },
          { name: "lzTokenFee", type: "uint256" },
        ],
        name: "msgFee",
        type: "tuple",
      },
      {
        components: [
          { name: "amountSentLD", type: "uint256" },
          { name: "amountReceivedLD", type: "uint256" },
        ],
        name: "oftReceipt",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // sendToken: execute cross-chain transfer
  {
    inputs: [
      {
        components: [
          { name: "dstEid", type: "uint32" },
          { name: "to", type: "bytes32" },
          { name: "amountLD", type: "uint256" },
          { name: "minAmountLD", type: "uint256" },
          { name: "extraOptions", type: "bytes" },
          { name: "composeMsg", type: "bytes" },
          { name: "oftCmd", type: "bytes" },
        ],
        name: "_sendParam",
        type: "tuple",
      },
      {
        components: [
          { name: "nativeFee", type: "uint256" },
          { name: "lzTokenFee", type: "uint256" },
        ],
        name: "_fee",
        type: "tuple",
      },
      { name: "_refundAddress", type: "address" },
    ],
    name: "sendToken",
    outputs: [
      {
        components: [
          { name: "guid", type: "bytes32" },
          { name: "nonce", type: "uint64" },
          {
            components: [
              { name: "nativeFee", type: "uint256" },
              { name: "lzTokenFee", type: "uint256" },
            ],
            name: "fee",
            type: "tuple",
          },
        ],
        name: "msgReceipt",
        type: "tuple",
      },
      {
        components: [
          { name: "amountSentLD", type: "uint256" },
          { name: "amountReceivedLD", type: "uint256" },
        ],
        name: "oftReceipt",
        type: "tuple",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
];