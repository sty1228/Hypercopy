"use client";

import Image from "next/image";
import clockIcon from "@/assets/icons/clock.png";
import XIcon from "@/assets/icons/header-right-X.png";
import Avatar from "./avatar";
import { numberToPercentageString } from "@/lib/number";
import { LeaderboardItem } from "@/service";

// 随机生成一个颜色
export const randomColor = () => {
  return `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(
    Math.random() * 256
  )}, ${Math.floor(Math.random() * 256)}, 1)`;
};

// 随机生成一个字母
export const randomLetter = () => {
  return String.fromCharCode(Math.floor(Math.random() * 26) + 65);
};

// 随机生成人名
export const randomName = () => {
  return `${randomLetter()}${randomLetter()}${randomLetter()}`;
};

// 随机生成整数
export const randomNumber = () => {
  return Math.floor(Math.random() * 100);
};

export default function KolItem({
  data,
  onClick,
}: {
  data: LeaderboardItem;
  onClick: () => void;
}) {
  return (
    <div
      className="p-4 mb-3 rounded-[20px]"
      style={{
        background:
          "linear-gradient(0deg, #172A30, #172A30), radial-gradient(35.55% 130.12% at 4.53% 7.41%, rgba(43, 234, 223, 0.5) 0%, rgba(23, 42, 48, 0) 100%)",
      }}
      onClick={onClick}
    >
      {/* account info */}
      <div className="flex justify-between">
        <div className="flex items-center">
          {/* avatar */}
          <Avatar
            name={data.x_handle[0].toUpperCase()}
            backgroundColor={data.avatarColor!}
            size={28}
          />
          {/* user name & publish time */}
          <div className="flex flex-col ml-2">
            <div className="font-medium text-base">{data.x_handle}</div>
            <div className="flex items-center">
              <span
                className="text-xs font-normal"
                style={{ color: "rgba(165, 176, 176, 1)" }}
              >
                @{data.x_handle}
              </span>
              <span>
                <Image
                  src={clockIcon}
                  alt="clock"
                  width={14}
                  height={14}
                  className="ml-2"
                />
              </span>
              <span
                className="font-light text-xs ml-1"
                style={{ color: "rgba(165, 176, 176, 1)" }}
              >
                {data.how_long_ago}
              </span>
            </div>
          </div>
        </div>
        {/* X rank */}
        <div
          className="flex px-3 py-1 rounded-[10px] h-[30px] items-center"
          style={{ backgroundColor: "rgba(77, 112, 123, 1)" }}
        >
          <span
            style={{
              backgroundImage: "linear-gradient(45deg, #FFFFFF, #2BEADF)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }}
          >
            {data.total_tweets}
          </span>
          <span>
            <Image src={XIcon} alt="X" width={20} height={20} />
          </span>
        </div>
      </div>

      {/* account data */}
      <div className="flex justify-between mt-4">
        <div className="flex flex-col">
          <span
            className="text-xs font-normal"
            style={{ color: "rgba(165, 176, 176, 1)" }}
          >
            Grade
          </span>
          <span className="font-medium text-base">{data?.grade || "-"}</span>
        </div>

        <div className="flex flex-col">
          <span
            className="text-xs font-normal"
            style={{ color: "rgba(165, 176, 176, 1)" }}
          >
            Points
          </span>
          <span className="font-medium text-base">{data?.points || "-"}</span>
        </div>

        <div className="flex flex-col">
          <span
            className="text-xs font-normal"
            style={{ color: "rgba(165, 176, 176, 1)" }}
          >
            Result
          </span>
          <span
            className="font-medium text-base"
            style={{
              backgroundImage: "linear-gradient(45deg, #FFFFFF, #26D39F)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }}
          >
            {data?.win_rate ? numberToPercentageString(data?.win_rate) : "-"}
          </span>
        </div>

        <div className="flex flex-col">
          <span
            className="text-xs font-normal"
            style={{ color: "rgba(165, 176, 176, 1)" }}
          >
            Streak
          </span>
          <div>
            <span className="font-medium text-base">{data?.streak || "-"}</span>
            {data?.streak && <span className="ml-1">🔥</span>}
          </div>
        </div>

        <div className="flex flex-col">
          <span
            className="text-xs font-normal"
            style={{ color: "rgba(165, 176, 176, 1)" }}
          >
            Rank
          </span>
          <span className="font-medium text-base">{data?.rank || "-"}</span>
        </div>
      </div>
    </div>
  );
}
