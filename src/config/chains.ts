/**
 * Multi-chain deposit configuration
 * Supports direct USDC transfer (Arbitrum) and Stargate V2 cross-chain bridge (other chains)
 *
 * Pool addresses verified from:
 * https://stargateprotocol.gitbook.io/stargate/v/v2/developers/contract-addresses/mainnet
 */

export interface ChainConfig {
  chainId: number;
  name: string;
  shortName: string;
  rpcUrl: string;
  nativeCurrency: { symbol: string; decimals: number };
  usdc: string;
  usdcDecimals: number;
  stargatePool: string | null; // null = Arbitrum (direct transfer)
  lzEid: number;
  explorerUrl: string;
  color: string;
}

export const ARB_LZ_EID = 30110;

export const CHAINS: Record<string, ChainConfig> = {
  arbitrum: {
    chainId: 42161,
    name: "Arbitrum",
    shortName: "ARB",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    nativeCurrency: { symbol: "ETH", decimals: 18 },
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    usdcDecimals: 6,
    stargatePool: null,
    lzEid: 30110,
    explorerUrl: "https://arbiscan.io",
    color: "#2D9CDB",
  },
  avalanche: {
    chainId: 43114,
    name: "Avalanche",
    shortName: "AVAX",
    rpcUrl: "https://avalanche-c-chain-rpc.publicnode.com",
    nativeCurrency: { symbol: "AVAX", decimals: 18 },
    usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    usdcDecimals: 6,
    stargatePool: "0x5634c4a5FEd09819E3c46D86A965Dd9447d86e47",
    lzEid: 30106,
    explorerUrl: "https://snowtrace.io",
    color: "#E84142",
  },
  base: {
    chainId: 8453,
    name: "Base",
    shortName: "BASE",
    rpcUrl: "https://mainnet.base.org",
    nativeCurrency: { symbol: "ETH", decimals: 18 },
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    usdcDecimals: 6,
    stargatePool: "0x27a16dc786820B16E5c9028b75B99F6f604b5d26",
    lzEid: 30184,
    explorerUrl: "https://basescan.org",
    color: "#0052FF",
  },
  ethereum: {
    chainId: 1,
    name: "Ethereum",
    shortName: "ETH",
    rpcUrl: "https://eth.llamarpc.com",
    nativeCurrency: { symbol: "ETH", decimals: 18 },
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    usdcDecimals: 6,
    stargatePool: "0xc026395860Db2d07ee33e05fE50ed7bD583189C7",
    lzEid: 30101,
    explorerUrl: "https://etherscan.io",
    color: "#627EEA",
  },
  mantle: {
    chainId: 5000,
    name: "Mantle",
    shortName: "MNT",
    rpcUrl: "https://rpc.mantle.xyz",
    nativeCurrency: { symbol: "MNT", decimals: 18 },
    usdc: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9",
    usdcDecimals: 6,
    stargatePool: "0xAc290Ad4e0c891FDc295ca4F0a6214cf6dC6acDC",
    lzEid: 30181,
    explorerUrl: "https://mantlescan.xyz",
    color: "#000000",
  },
  optimism: {
    chainId: 10,
    name: "Optimism",
    shortName: "OP",
    rpcUrl: "https://mainnet.optimism.io",
    nativeCurrency: { symbol: "ETH", decimals: 18 },
    usdc: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    usdcDecimals: 6,
    stargatePool: "0xcE8CcA271Ebc0533920C83d39F417ED6A0abB7D0",
    lzEid: 30111,
    explorerUrl: "https://optimistic.etherscan.io",
    color: "#FF0420",
  },
  polygon: {
    chainId: 137,
    name: "Polygon",
    shortName: "POL",
    rpcUrl: "https://polygon-bor-rpc.publicnode.com",
    nativeCurrency: { symbol: "POL", decimals: 18 },
    usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    usdcDecimals: 6,
    stargatePool: "0x9Aa02D4Fae7F58b8E8f34c66E756cC734DAc7fe4",
    lzEid: 30109,
    explorerUrl: "https://polygonscan.com",
    color: "#8247E5",
  },
  scroll: {
    chainId: 534352,
    name: "Scroll",
    shortName: "SCR",
    rpcUrl: "https://rpc.scroll.io",
    nativeCurrency: { symbol: "ETH", decimals: 18 },
    usdc: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4",
    usdcDecimals: 6,
    stargatePool: "0x3Fc69CC4A842838bCDC9499178740226062b14E4",
    lzEid: 30214,
    explorerUrl: "https://scrollscan.com",
    color: "#FFEEDA",
  },
};

// Alphabetically sorted, Arbitrum first (recommended)
export const CHAIN_LIST: ChainConfig[] = [
  CHAINS.arbitrum,
  ...[
    CHAINS.avalanche,
    CHAINS.base,
    CHAINS.ethereum,
    CHAINS.mantle,
    CHAINS.optimism,
    CHAINS.polygon,
    CHAINS.scroll,
  ].sort((a, b) => a.name.localeCompare(b.name)),
];

// ── USDC ABI (minimal) ──

export const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

export const USDC_DECIMALS = 6;

// ── Stargate V2 Pool ABI (quoteSend + sendToken) ──

export const STARGATE_POOL_ABI = [
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