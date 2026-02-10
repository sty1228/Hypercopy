"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import profileIcon from "@/assets/icons/profile.png";
import copyCountIcon from "@/assets/icons/copy-count.png";
import copyRankIcon from "@/assets/icons/copy-rank.png";
import { leaderboard, LeaderboardItem } from "@/service";
import Search from "./components/search";
import KolList from "./components/kolList";
import KolDetailSheet from "./components/kolDetailSheet";
import { randomColor } from "./components/kolItem";
import UserMenu from "@/components/UserMenu";

const MOCK_LEADERBOARD: LeaderboardItem[] = [
  { x_handle: "CryptoKing", address: "0x1a2b...3c4d", pnl: 284320, roi: 142.6, copiers: 1243, win_rate: 78.5, total_trades: 892, avg_trade_size: 12500, best_trade: 45200, worst_trade: -8900, active_since: "2023-01", bio: "Full-time crypto trader. 5+ years experience.", avatarColor: "", rank: 1 },
  { x_handle: "WhaleHunter", address: "0x5e6f...7g8h", pnl: 196540, roi: 98.3, copiers: 876, win_rate: 72.1, total_trades: 1245, avg_trade_size: 8700, best_trade: 32100, worst_trade: -12400, active_since: "2022-06", bio: "Specializing in whale movement analysis.", avatarColor: "", rank: 2 },
  { x_handle: "DeFiMaster", address: "0x9i0j...1k2l", pnl: 157890, roi: 88.7, copiers: 654, win_rate: 69.8, total_trades: 567, avg_trade_size: 15200, best_trade: 28700, worst_trade: -6300, active_since: "2023-04", bio: "DeFi yield strategist & perps trader.", avatarColor: "", rank: 3 },
  { x_handle: "AlphaSeeker", address: "0x3m4n...5o6p", pnl: 134670, roi: 76.2, copiers: 532, win_rate: 74.3, total_trades: 423, avg_trade_size: 9800, best_trade: 21500, worst_trade: -7800, active_since: "2023-07", bio: "Finding alpha before the crowd.", avatarColor: "", rank: 4 },
  { x_handle: "TrendRider", address: "0x7q8r...9s0t", pnl: 112340, roi: 67.4, copiers: 421, win_rate: 71.2, total_trades: 678, avg_trade_size: 7300, best_trade: 19800, worst_trade: -5600, active_since: "2022-11", bio: "Riding trends, cutting losses fast.", avatarColor: "", rank: 5 },
  { x_handle: "ScalpKing", address: "0x1u2v...3w4x", pnl: 98760, roi: 58.9, copiers: 389, win_rate: 82.1, total_trades: 2134, avg_trade_size: 3200, best_trade: 8900, worst_trade: -2100, active_since: "2023-02", bio: "High-frequency scalper. Consistency is key.", avatarColor: "", rank: 6 },
  { x_handle: "MacroTrader", address: "0x5y6z...7a8b", pnl: 87430, roi: 52.1, copiers: 312, win_rate: 65.7, total_trades: 234, avg_trade_size: 22000, best_trade: 38500, worst_trade: -15200, active_since: "2022-09", bio: "Macro-driven positions. Patient capital.", avatarColor: "", rank: 7 },
  { x_handle: "MomentumPro", address: "0x9c0d...1e2f", pnl: 76890, roi: 45.8, copiers: 278, win_rate: 68.4, total_trades: 512, avg_trade_size: 6100, best_trade: 15300, worst_trade: -4700, active_since: "2023-05", bio: "Momentum + volume = profit.", avatarColor: "", rank: 8 },
  { x_handle: "SwingMaster", address: "0x3g4h...5i6j", pnl: 65420, roi: 41.3, copiers: 234, win_rate: 66.9, total_trades: 345, avg_trade_size: 8400, best_trade: 12800, worst_trade: -6100, active_since: "2023-08", bio: "Swing trading with strict risk management.", avatarColor: "", rank: 9 },
  { x_handle: "OnChainGuru", address: "0x7k8l...9m0n", pnl: 54310, roi: 36.7, copiers: 198, win_rate: 63.5, total_trades: 289, avg_trade_size: 5600, best_trade: 11200, worst_trade: -3800, active_since: "2023-10", bio: "On-chain data driven trading.", avatarColor: "", rank: 10 },
  { x_handle: "PerpsWizard", address: "0x1o2p...3q4r", pnl: 48760, roi: 32.4, copiers: 167, win_rate: 70.2, total_trades: 456, avg_trade_size: 4200, best_trade: 9800, worst_trade: -3200, active_since: "2024-01", bio: "Perpetual futures specialist.", avatarColor: "", rank: 11 },
  { x_handle: "RiskManager", address: "0x5s6t...7u8v", pnl: 41230, roi: 28.9, copiers: 145, win_rate: 75.8, total_trades: 198, avg_trade_size: 11000, best_trade: 18700, worst_trade: -4500, active_since: "2023-03", bio: "Risk-adjusted returns above all.", avatarColor: "", rank: 12 },
] as any[];

export default function CopyTrading() {
  const [isOpen, setIsOpen] = useState(false);
  const [listSearchValue, setListSearchValue] = useState("");
  const [leaderboardList, setLeaderboardList] = useState<LeaderboardItem[]>([]);
  const [rawLeaderboardList, setRawLeaderboardList] = useState<LeaderboardItem[]>([]);
  const [clickItemData, setClickItemData] = useState<LeaderboardItem | null>(null);
  const [activeFilter, setActiveFilter] = useState("earners");
  const [timeFilter, setTimeFilter] = useState("24h");

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = (await leaderboard()) as LeaderboardItem[];
      if (response && response.length > 0) {
        const rawListWithAvatarColor = response.map((item: LeaderboardItem, index: number) => ({
          ...item,
          avatarColor: randomColor(),
          rank: index + 1,
        }));
        setRawLeaderboardList(rawListWithAvatarColor);
        setLeaderboardList(rawListWithAvatarColor);
        return;
      }
    } catch (e) {
      console.log("Leaderboard API unavailable, using mock data");
    }
    // Fallback to mock data
    const mockWithColors = MOCK_LEADERBOARD.map((item, index) => ({
      ...item,
      avatarColor: randomColor(),
      rank: index + 1,
    }));
    setRawLeaderboardList(mockWithColors as LeaderboardItem[]);
    setLeaderboardList(mockWithColors as LeaderboardItem[]);
  };

  const handleListSearch = () => {
    if (listSearchValue) {
      const filteredList = rawLeaderboardList.filter((item) =>
        item.x_handle.toLowerCase().includes(listSearchValue.toLowerCase())
      );
      setLeaderboardList(filteredList);
    } else {
      setLeaderboardList(rawLeaderboardList);
    }
  };

  const handleClickKOLItem = (item: LeaderboardItem) => {
    setClickItemData(item);
    setIsOpen(true);
  };

  const handleKOLDetailSheetClose = () => {
    setIsOpen(false);
  };

  const filters = [
    { key: "earners", label: "Top Earners", icon: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    )},
    { key: "copied", label: "Most Copied", icon: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )},
    { key: "trending", label: "Trending", icon: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    )},
    { key: "verified", label: "Verified", icon: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M9 12l2 2 4-4" />
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    )},
  ];

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)" }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/3 w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/3 -right-20 w-[200px] h-[200px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 60%)", filter: "blur(40px)" }} />
      </div>

      {/* Header */}
      <div className="relative z-10 mt-3 mb-2 flex items-center justify-between px-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:bg-white/10" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Image src={profileIcon} alt="profile" width={14} height={14} />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Image src={copyCountIcon} alt="copy-count" width={13} height={13} />
            <span className="text-[11px] font-semibold text-teal-400">4</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.15) 0%, rgba(45,212,191,0.08) 100%)", border: "1px solid rgba(45,212,191,0.25)", boxShadow: "0 0 15px rgba(45,212,191,0.2)" }}>
            <Image src={copyRankIcon} alt="copy-rank" width={13} height={13} />
            <span className="text-[11px] font-semibold text-teal-400">#64</span>
          </div>
          <UserMenu />
        </div>
      </div>

      {/* Page Title */}
      <div className="relative z-10 px-4 pt-1 pb-2">
        <h1 className="text-base font-bold text-white">Leaderboard</h1>
      </div>

      <div className="relative z-10">
        <Search
          onChange={(e) => setListSearchValue(e.target.value)}
          onEnterClick={handleListSearch}
          onSearchIconClick={handleListSearch}
        />
      </div>

      {/* Filter Tags */}
      <div className="relative z-10 px-4 mb-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all duration-300 flex items-center gap-1 ${activeFilter === filter.key ? "text-white" : "text-gray-400"}`}
              style={{
                background: activeFilter === filter.key ? "linear-gradient(135deg, rgba(45,212,191,0.25) 0%, rgba(45,212,191,0.15) 100%)" : "rgba(255,255,255,0.03)",
                border: activeFilter === filter.key ? "1px solid rgba(45,212,191,0.4)" : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span className={activeFilter === filter.key ? "text-teal-400" : "text-gray-500"}>{filter.icon}</span>
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section Header */}
      <div className="relative z-10 px-4 mb-1.5 flex items-center justify-between">
        <span className="text-white text-xs font-semibold">Top Traders</span>
        <div className="flex gap-0.5">
          {["24h", "7d", "30d"].map((t) => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all duration-300 ${timeFilter === t ? "text-white bg-white/10" : "text-gray-500"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* KOL List */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-20">
        <KolList onClick={handleClickKOLItem} dataList={leaderboardList} />
      </div>

      <KolDetailSheet
        data={clickItemData!}
        isOpen={isOpen}
        handleClose={handleKOLDetailSheetClose}
      />

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGold {
          0%, 100% { box-shadow: 0 0 12px rgba(255,215,0,0.5); }
          50% { box-shadow: 0 0 20px rgba(255,215,0,0.8), 0 0 30px rgba(255,215,0,0.4); }
        }
        @keyframes pulseSilver {
          0%, 100% { box-shadow: 0 0 10px rgba(192,192,192,0.4); }
          50% { box-shadow: 0 0 18px rgba(192,192,192,0.7); }
        }
        @keyframes pulseBronze {
          0%, 100% { box-shadow: 0 0 10px rgba(205,127,50,0.4); }
          50% { box-shadow: 0 0 18px rgba(205,127,50,0.7); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}