import { get, post, put, del, patch } from "@/lib/axios";

// ─── Auth ───────────────────────────────────────────────

export const connectWalletApi = async (
  walletAddress: string,
  twitterUsername?: string | null
): Promise<{ access_token: string; user: Record<string, unknown> }> => {
  return await post("/api/auth/connect-wallet", {
    wallet_address: walletAddress,
    twitter_username: twitterUsername || null,
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
  accountValue: number;
  timestamp: number;
}

export const balanceHistory = async (
  timeRange: "D" | "W" | "M" | "YTD" | "ALL"
): Promise<BalanceHistoryResponse[]> => {
  return await get(`/api/portfolio/balance-history?timeRange=${timeRange}`);
};

// ─── ★ P&L History (deposits/withdrawals stripped) ──

export interface PnlHistoryItem {
  timestamp: number;
  pnl: number;
}

export interface PnlHistoryResponse {
  data: PnlHistoryItem[];
  range_pnl: number;
  range_pnl_pct: number;
  total_pnl: number;
}

export const getPnlHistory = async (
  timeRange: "D" | "W" | "M" | "YTD" | "ALL"
): Promise<PnlHistoryResponse> => {
  return await get(`/api/portfolio/pnl-history?timeRange=${timeRange}`);
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

export const withdrawFromWallet = async (
  amount: number,
  chainId: number = 42161
): Promise<{ status: string; message: string }> => {
  return await post("/api/wallet/withdraw", { amount, chain_id: chainId });
};

// ─── Follow / Unfollow ──────────────────────────────────

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

export interface FollowStatus {
  is_following: boolean;
  is_copy_trading: boolean;
}

export const getFollowedTraders = async (window = "30d"): Promise<FollowedTrader[]> => {
  return await get(`/api/follows?window=${window}`);
};

export const followTrader = async (
  traderUsername: string,
  isCopyTrading = false
): Promise<{ id: string; trader_username: string; is_copy_trading: boolean; created_at: string }> => {
  return await post("/api/follow", {
    trader_username: traderUsername,
    is_copy_trading: isCopyTrading,
  });
};

export const unfollowTrader = async (traderUsername: string): Promise<{ message: string }> => {
  return await del(`/api/follow/${traderUsername}`);
};

export const toggleCopyTrading = async (
  traderUsername: string
): Promise<{ is_copy_trading: boolean }> => {
  return await patch(`/api/follow/${traderUsername}/copy-trading`, {});
};

export const checkFollowStatus = async (traderUsername: string): Promise<FollowStatus> => {
  return await get(`/api/follow/check/${traderUsername}`);
};

// ─── Trader Profile ─────────────────────────────────────

export interface RadarData {
  accuracy: number;
  winRate: number;
  riskReward: number;
  consistency: number;
  timing: number;
  transparency: number;
  engagement: number;
  trackRecord: number;
}

export interface BestWorstSignal {
  token: string;
  pnl: number;
  date: string;
}

export interface TraderProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  followers_count: number;
  following_count: number;
  total_signals: number;
  win_rate: number;
  avg_return_pct: number;
  total_profit_usd: number;
  streak: number;
  points: number;
  profit_grade: string | null;
  rank: number | null;
  copiers_count: number;
  signal_to_noise: number;
  radar: RadarData;
  is_followed: boolean;
  is_copy_trading: boolean;
  best_signal: BestWorstSignal | null;
  worst_signal: BestWorstSignal | null;
}

export const getTraderProfile = async (
  handle: string,
  window = "7d"
): Promise<TraderProfile> => {
  return await get(`/api/trader/${handle}/profile?window=${window}`);
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

export const leaderboard = async (window: string = "30d"): Promise<LeaderboardItem[]> => {
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
  // TODO: implement real endpoint when copiers API is built
  return [];
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

export const getDefaultSettings = async (): Promise<DefaultFollowSettings> => {
  return await get("/api/settings/default");
};

export const updateDefaultSettings = async (
  settings: DefaultFollowSettings
): Promise<DefaultFollowSettings> => {
  return await put("/api/settings/default", settings);
};

export const getTraderSettings = async (
  traderUsername: string
): Promise<DefaultFollowSettings> => {
  return await get(`/api/settings/trader/${traderUsername}`);
};

export const updateTraderSettings = async (
  traderUsername: string,
  settings: DefaultFollowSettings
): Promise<DefaultFollowSettings> => {
  return await put(`/api/settings/trader/${traderUsername}`, settings);
};

// ─── Trades History ─────────────────────────────────────

// ─── Trades History ─────────────────────────────────────

export interface TradeHistoryItem {
  id: string;
  ticker: string;
  direction: "long" | "short";
  entry_price: number;
  exit_price: number | null;
  size_usd: number;
  size_qty: number;
  leverage: number;
  pnl_usd: number | null;
  pnl_pct: number | null;
  status: string;
  source: string;
  trader_username: string | null;
  opened_at: string;
  closed_at: string | null;
}

export interface TradesSummary {
  total: number;
  wins: number;
  losses: number;
  win_rate: number;
  total_pnl: number;
  best_trade: number;
  worst_trade: number;
}

export interface TradesPageResponse {
  trades: TradeHistoryItem[];
  summary: TradesSummary;
  total_count: number;
}

export const getTradeHistory = async (
  status: "all" | "open" | "closed" = "all",
  direction: "all" | "long" | "short" = "all",
  limit = 50,
  offset = 0
): Promise<TradesPageResponse> => {
  return await get(
    `/api/trades?status=${status}&direction=${direction}&limit=${limit}&offset=${offset}`
  );
};

// ─── Explore ────────────────────────────────────────────

export interface TokenSentimentItem {
  ticker: string;
  total_signals: number;
  bull_count: number;
  bear_count: number;
  bull_pct: number;
  avg_pnl: number;
  latest_price: number | null;
}

export interface RisingTraderItem {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  profit_grade: string | null;
  win_rate: number;
  avg_return_pct: number;
  total_signals: number;
  streak: number;
  points_change: number;
}

export const getTokenSentiment = async (days = 30): Promise<TokenSentimentItem[]> => {
  return await get(`/api/explore/sentiment?days=${days}`);
};

export const getRisingTraders = async (limit = 6): Promise<RisingTraderItem[]> => {
  return await get(`/api/explore/rising?limit=${limit}`);
};

// ─── KOL Rewards ────────────────────────────────────────

export interface PhaseConfig {
  feeShare: string;
  twapShare: string;
  airdropPool: string;
  copyShare: string;
  multiplierRange: string;
  kolRefBonus: string;
  totalWeeks: number;
}

export interface RewardsData {
  phase: string;
  currentWeek: number;
  totalWeeks: number;
  totalPoints: number;
  currentWeekPoints: number;
  rank: number | null;
  totalFeeShare: number;
  claimableFeeShare: number;
  smartFollowerCount: number;
  boostMultiplier: number;
  xAccountLinked: boolean;
  phaseConfig: PhaseConfig;
}

export interface DistributionBreakdown {
  copyVolumePoints: number;
  ownTradingPoints: number;
  signalQualityBonus: number;
  xAccountBoost: number;
  smartFollowerBoost: number;
  feeShareEarned: number;
}

export interface DistributionItem {
  week: number;
  date: string;
  points: number;
  feeShareUsdc: number;
  status: string;
  breakdown: DistributionBreakdown;
}

export interface DistributionsResponse {
  distributions: DistributionItem[];
}

export interface ShareResponse {
  success: boolean;
  shareId: string;
  message: string;
}

export interface ClaimResponse {
  status: string;
  amount: number;
  message: string;
}

export const getRewards = async (): Promise<RewardsData> => {
  return await get("/api/kol/rewards");
};

export const getDistributions = async (limit = 6): Promise<DistributionsResponse> => {
  return await get(`/api/kol/distributions?limit=${limit}`);
};

export const logShare = async (
  type: "pnl_card" | "leaderboard",
  referenceId?: string
): Promise<ShareResponse> => {
  return await post("/api/kol/share", {
    type,
    targetPlatform: "x",
    referenceId: referenceId || null,
  });
};

export const claimFeeShare = async (amount?: number): Promise<ClaimResponse> => {
  return await post("/api/kol/claim-fee-share", {
    amount: amount || null,
  });
};

// ─── ★ Transaction History ──────────────────────────────

export interface TransactionItem {
  id: string;
  type: "deposit" | "withdraw";
  amount: number;
  status: string;
  target_chain_id: number | null;
  tx_hash: string | null;
  created_at: string;
  completed_at: string | null;
}

export const getTransactions = async (limit = 30): Promise<TransactionItem[]> => {
  return await get(`/api/wallet/transactions?limit=${limit}`);
};