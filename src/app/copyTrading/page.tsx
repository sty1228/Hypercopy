"use client";

import { useEffect, useState, useCallback } from "react";
import { leaderboard, LeaderboardItem } from "@/service";
import Search from "./components/search";
import KolList from "./components/kolList";
import KolDetailSheet from "./components/kolDetailSheet";
import { randomColor } from "./components/kolItem";
import TopBar from "@/components/TopBar";

const FILTER_MAP: Record<string, { sortBy: string; registeredOnly: boolean }> = {
  earners:  { sortBy: "total_profit_usd",  registeredOnly: false },
  copied:   { sortBy: "copiers_count",     registeredOnly: false },
  trending: { sortBy: "trending_score",    registeredOnly: false },
  verified: { sortBy: "total_profit_usd",  registeredOnly: true  },
};

const SECTION_TITLES: Record<string, string> = {
  earners:  "Top Earners",
  copied:   "Most Copied",
  trending: "Trending",
  verified: "Verified Traders",
};

const EMPTY_MESSAGES: Record<string, string> = {
  earners:  "No trader data available for this time window.",
  copied:   "No copied traders yet. Be the first to copy!",
  trending: "No trending traders found for this time window.",
  verified: "No verified traders found. Register to get verified!",
};

export default function CopyTrading() {
  const [isOpen, setIsOpen] = useState(false);
  const [listSearchValue, setListSearchValue] = useState("");
  const [leaderboardList, setLeaderboardList] = useState<LeaderboardItem[]>([]);
  const [rawLeaderboardList, setRawLeaderboardList] = useState<LeaderboardItem[]>([]);
  const [clickItemData, setClickItemData] = useState<LeaderboardItem | null>(null);
  const [activeFilter, setActiveFilter] = useState("earners");
  const [timeFilter, setTimeFilter] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async (window: string, filter: string) => {
    setLoading(true);
    setError(null);
    const { sortBy, registeredOnly } = FILTER_MAP[filter] || FILTER_MAP.earners;
    try {
      const response = await leaderboard(window, sortBy, registeredOnly);
      if (response && response.length > 0) {
        const list = response.map((item: LeaderboardItem, index: number) => ({
          ...item,
          avatarColor: randomColor(),
          rank: index + 1,
        }));
        setRawLeaderboardList(list);
        setLeaderboardList(list);
      } else {
        setRawLeaderboardList([]);
        setLeaderboardList([]);
        setError(EMPTY_MESSAGES[filter] || EMPTY_MESSAGES.earners);
      }
    } catch (e) {
      console.error("Leaderboard API error:", e);
      setRawLeaderboardList([]);
      setLeaderboardList([]);
      setError("Failed to load leaderboard. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(timeFilter, activeFilter);
  }, [timeFilter, activeFilter, fetchLeaderboard]);

  const handleListSearch = () => {
    if (listSearchValue) {
      const q = listSearchValue.toLowerCase();
      const filtered = rawLeaderboardList.filter(
        (item) =>
          item.x_handle.toLowerCase().includes(q) ||
          (item.display_name && item.display_name.toLowerCase().includes(q))
      );
      setLeaderboardList(filtered);
    } else {
      setLeaderboardList(rawLeaderboardList);
    }
  };

  const handleClickKOLItem = (item: LeaderboardItem) => {
    setClickItemData(item);
    setIsOpen(true);
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
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/3 w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/3 -right-20 w-[200px] h-[200px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 60%)", filter: "blur(40px)" }} />
      </div>

      <TopBar activeTrades={4} rank={64} />

      <div className="relative z-10 px-3 pt-1 pb-2">
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
      <div className="relative z-10 px-3 mb-2">
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
      <div className="relative z-10 px-3 mb-1.5 flex items-center justify-between">
        <span className="text-white text-xs font-semibold">
          {SECTION_TITLES[activeFilter] || "Top Traders"}
        </span>
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

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-3 pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center pt-20 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(45,212,191,0.3)", borderTopColor: "transparent" }} />
            <span className="text-xs text-gray-500">Loading traders...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center pt-20 gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <span className="text-xs text-gray-400 text-center max-w-[250px]">{error}</span>
            <button onClick={() => fetchLeaderboard(timeFilter, activeFilter)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-teal-400 transition-all hover:bg-teal-400/10"
              style={{ border: "1px solid rgba(45,212,191,0.3)" }}>
              Try Again
            </button>
          </div>
        ) : (
          <KolList onClick={handleClickKOLItem} dataList={leaderboardList} />
        )}
      </div>

      <KolDetailSheet data={clickItemData!} isOpen={isOpen} handleClose={() => setIsOpen(false)} />

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGold { 0%, 100% { box-shadow: 0 0 12px rgba(255,215,0,0.5); } 50% { box-shadow: 0 0 20px rgba(255,215,0,0.8), 0 0 30px rgba(255,215,0,0.4); } }
        @keyframes pulseSilver { 0%, 100% { box-shadow: 0 0 10px rgba(192,192,192,0.4); } 50% { box-shadow: 0 0 18px rgba(192,192,192,0.7); } }
        @keyframes pulseBronze { 0%, 100% { box-shadow: 0 0 10px rgba(205,127,50,0.4); } 50% { box-shadow: 0 0 18px rgba(205,127,50,0.7); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}