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
