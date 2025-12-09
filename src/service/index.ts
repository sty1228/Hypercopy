import { get } from "@/lib/axios";

export interface LeaderboardItem {
  bull_or_bear: string;
  copy_button: boolean;
  counter_button: boolean;
  direction: string;
  how_long_ago: string;
  results_pct: number;
  signal_to_noise: number;
  ticker: string;
  total_tweets: number;
  tweet_performance: number;
  win_rate: number;
  x_handle: string;
  avatarColor?: string;
  [key: string]: unknown;
}

export const leaderboard = async () => {
  return await get("/api/leaderboard");
};

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

export interface BalanceHistoryResponse {
  acconutValue: number;
  timestamp: number;
}

export const balanceHistory = async (
  timeRange: "D" | "W" | "M" | "YTD" | "ALL"
): Promise<BalanceHistoryResponse[]> => {
  return await get(
    "https://mock.apidog.com/m1/1147892-1140449-default/api/balanceHistory?apidogToken=PbNG_tQ6mXqOpxO8CvYsp"
  );
};
