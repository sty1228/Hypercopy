"use client";

import { LeaderboardItem } from "@/service";
import KolItem from "./kolItem";

export default function KolList({
  dataList,
  onClick,
}: {
  dataList: LeaderboardItem[];
  onClick: (item: LeaderboardItem) => void;
}) {
  return (
    <div className="space-y-2">
      {dataList.map((item: LeaderboardItem, index: number) => (
        <KolItem
          key={item.x_handle}
          data={item}
          index={index}
          onClick={() => onClick(item)}
        />
      ))}
    </div>
  );
}