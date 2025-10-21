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
  const handleClick = (item: LeaderboardItem) => {
    onClick(item);
  };

  return (
    <div>
      {dataList.map((item: LeaderboardItem) => {
        return (
          <KolItem
            key={item.x_handle}
            data={item}
            onClick={() => {
              handleClick(item);
            }}
          />
        );
      })}
    </div>
  );
}
