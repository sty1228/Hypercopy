"use client";

import { useEffect, useState } from "react";
import { leaderboard, LeaderboardItem } from "@/service";
import Header from "./components/header";
import Following from "./components/following";
import Search from "./components/search";
import KolList from "./components/kolList";
import KolDetailSheet from "./components/kolDetailSheet";
import { randomColor } from "./components/kolItem";

export default function CopyTrading() {
  const [isOpen, setIsOpen] = useState(false);
  const [listSearchValue, setListSearchValue] = useState("");
  const [leaderboardList, setLeaderboardList] = useState<LeaderboardItem[]>([]);
  const [rawLeaderboardList, setRawLeaderboardList] = useState<
    LeaderboardItem[]
  >([]);
  const [clickItemData, setClickItemData] = useState<LeaderboardItem | null>(
    null
  );

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const response = (await leaderboard()) as LeaderboardItem[];
    console.log(response);
    const rawListWithAvatarColor = response.map((item: LeaderboardItem) => ({
      ...item,
      avatarColor: randomColor(),
    }));
    setRawLeaderboardList(rawListWithAvatarColor);
    setLeaderboardList(rawListWithAvatarColor);
  };

  const handleListSearch = () => {
    if (listSearchValue) {
      const filteredList = rawLeaderboardList.filter((item) => {
        return item.x_handle
          .toLowerCase()
          .includes(listSearchValue.toLowerCase());
      });
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

  return (
    <div className="px-5 flex flex-col">
      <Header />
      <Following />
      <Search
        onChange={(e) => setListSearchValue(e.target.value)}
        onEnterClick={handleListSearch}
        onSearchIconClick={handleListSearch}
      />
      <KolList onClick={handleClickKOLItem} dataList={leaderboardList} />
      <KolDetailSheet
        data={clickItemData!}
        isOpen={isOpen}
        handleClose={handleKOLDetailSheetClose}
      />
    </div>
  );
}
