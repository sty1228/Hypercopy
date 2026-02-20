import { get, post, put } from "@/lib/axios";

// ─── Auth ───────────────────────────────────────────────

export const connectWalletApi = async (
  walletAddress: string
): Promise<{ access_token: string; user: Record<string, unknown> }> => {
  return await post("/api/auth/connect-wallet", {
    wallet_address: walletAddress,
  });
};

export const getSubAccount = async (): Promise<{ sub_account_address: string | null }> => {
  return await get("/api/auth/sub-account");
};

export const saveSubAccount = async (subAccountAddress: string) => {
  return await put("/api/auth/sub-account", { sub_account_address: subAccountAddress });
};

// ─── Dashboard / Portfolio ───────────────────────────────

export interface DashboardSummary {
  total_balance: number;
  total_pnl: number;
  total_pnl_pct: number;
  open_positions: number;
  total_trades: number;
  win_rate: number;
}

export interface PositionItem {
  id: string;
  ticker: string;
  direction: string;
  entry_price: number;
  current_price: number | null;
  size_usd: number;
  size_qty: number;
  leverage: number;
  pnl_usd: number | null;
  pnl_pct: number | null;
  trader_username: string | null;
  opened_at: string;
}

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  return await get("/api/portfolio/summary");
};

export const getOpenPositions = async (): Promise<PositionItem[]> => {
  return await get("/api/portfolio/positions");
};

export interface BalanceHistoryResponse {
  acconutValue: number;
  timestamp: number;
}

export const balanceHistory = async (
  timeRange: "D" | "W" | "M" | "YTD" | "ALL"
): Promise<BalanceHistoryResponse[]> => {
  return await get(`/api/portfolio/balance-history?timeRange=${timeRange}`);
};

// ─── Deposit ────────────────────────────────────────────

export const recordDeposit = async (amount: number, txHash?: string) => {
  return await post("/api/portfolio/record-deposit", {
    amount,
    tx_hash: txHash || null,
  });
};

// ─── Withdraw ───────────────────────────────────────────

export const recordWithdraw = async (amount: number) => {
  return await post("/api/portfolio/record-withdraw", { amount });
};

// ─── Dedicated Wallet ───────────────────────────────────

export interface WalletInfo {
  address: string;
  withdraw_address: string;
}

export interface WalletBalance {
  address: string;
  arb_usdc: number;
  hl_equity: number;
  hl_withdrawable: number;
  hl_positions: number;
}

export const createOrGetWallet = async (): Promise<WalletInfo> => {
  return await post("/api/wallet/create", {});
};

export const getWalletBalance = async (): Promise<WalletBalance> => {
  return await get("/api/wallet/balance");
};

export const getWalletDeposits = async (): Promise<unknown[]> => {
  return await get("/api/wallet/deposits");
};

export const withdrawFromWallet = async (amount: number): Promise<{ status: string; message: string }> => {
  return await post("/api/wallet/withdraw", { amount });
};

// ─── Follow List ────────────────────────────────────────

export interface FollowedTrader {
  id: string;
  trader_username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_copy_trading: boolean;
  created_at: string;
  win_rate: number;
  total_profit_usd: number;
  total_signals: number;
  avg_return_pct: number;
  profit_grade: string | null;
}

export const getFollowedTraders = async (window = "30d"): Promise<FollowedTrader[]> => {
  return await get(`/api/follows?window=${window}`);
};

// ─── Leaderboard ────────────────────────────────────────

export interface LeaderboardItem {
  x_handle: string;
  display_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  bull_or_bear: string;
  win_rate: number;
  total_tweets: number;
  signal_to_noise: number;
  results_pct: number;
  ticker: string;
  direction: string;
  how_long_ago: string;
  tweet_performance: number;
  copy_button: boolean;
  counter_button: boolean;
  profit_grade: string;
  points: number;
  streak: number;
  rank: number;
  avatarColor?: string;
  total_signals?: number;
  avg_return?: number;
  copiers?: number;
}

export const leaderboard = async (window: string = "30d") => {
  return await get(`/api/leaderboard?window=${window}`);
};

// ─── User Signals ───────────────────────────────────────

export interface UserSignalItem {
  x_handle: string;
  profit_grade: number | null;
  signal_id: number;
  entry_price: number;
  win_streak: number;
  progress_bar: number;
  user_week_total_pct: number | null;
  ticker: string;
  bull_or_bear: "bearish" | "bullish";
  emotionType: number;
  updateTime: string;
  content: string;
  commentsCount: number;
  retweetsCount: number;
  likesCount: number;
  change_since_tweet: number;
}

export interface UserSignalResponse {
  id: number;
  name: string;
  tweetsCount: number;
  signals: UserSignalItem[];
}

export const userSignals = async (
  x_handle: string
): Promise<UserSignalResponse> => {
  return await get(`/api/user/${x_handle}/signals`);
};

// ─── Profile ─────────────────────────────────────────────

export interface FollowerItem {
  name: string;
  twitterId: string;
}

export interface ProfileDataResponse {
  name: string;
  twitterId: string;
  followingCount: number;
  followerCount: number;
  accountValue: number;
  followerList: FollowerItem[];
  traderCopyingCount: number;
  signalCount: number;
  noiseCount: number;
  streakCount: number;
  streakCumulativePnLRate: number;
  tradeTicks: number;
  collectedPoints: number;
}

export const getProfileData = async (): Promise<ProfileDataResponse> => {
  return await get("/api/portfolio/profile");
};

// ─── Profile sub-data ───────────────────────────────────

export interface TradersCopyingItem {
  name: string;
  twitterId: string;
  timestamp: number;
  signalCount: number;
  pnlValue: number;
}

export const getProfileTradersCopyingList = async (): Promise<TradersCopyingItem[]> => {
  return await get(
    "https://mock.apidog.com/m1/1147892-1140449-default/api/copyingList?apidogToken=PbNG_tQ6mXqOpxO8CvYsp"
  );
};

// ─── Settings ───────────────────────────────────────────

export type TradeSizeType = "USD" | "PCT";
export type LeverageType = "isolated" | "cross";

export interface TPOrSL {
  type: TradeSizeType;
  value: number;
}

export interface DefaultFollowSettings {
  tradeSizeType: TradeSizeType;
  tradeSize: number;
  leverage: number;
  leverageType: LeverageType;
  tp: TPOrSL;
  sl: TPOrSL;
  orderType: "market" | "limit";
}

export const getDefaultFollowSettings = async (): Promise<DefaultFollowSettings> => {
  return await get(
    "https://mock.apidog.com/m1/1147892-1140449-default/api/defaultFollowSetting?apidogToken=PbNG_tQ6mXqOpxO8CvYsp"
  );
};

export const updateDefaultFollowSettings = async (
  settings: { address: string } & DefaultFollowSettings
) => {
  return await put(
    "https://mock.apidog.com/m1/1147892-1140449-default/api/defaultFollowSetting?apidogToken=PbNG_tQ6mXqOpxO8CvYsp",
    settings
  );
};