"use client";

import { useState } from "react";
import Image from "next/image";
import profileIcon from "@/assets/icons/profile.png";
import copyCountIcon from "@/assets/icons/copy-count.png";
import copyRankIcon from "@/assets/icons/copy-rank.png";
import Avatar from "../copyTrading/components/avatar";
import { Button } from "@/components/ui/button";
import BalanceChart from "./components/balanceChart";
import TimeRangeTab from "./components/TimeRangeTab";
import copyingIcon from "@/assets/icons/copying.png";
import activeTradesIcon from "@/assets/icons/active-traders.png";
import tradesEndedIcon from "@/assets/icons/traders-ended.png";
import type { TimeRange } from "./components/balanceChart";

const Home = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("M");
  return (
    <div>
      <div className="mt-4 mb-3 flex items-center justify-between px-4">
        <Image src={profileIcon} alt="profile" width={16} height={16} />
        <div className="flex items-center">
          <Image src={copyCountIcon} alt="copy-count" width={16} height={16} />
          <span
            className="ml-1 font-medium"
            style={{
              color: "rgba(80, 210, 193, 1)",
            }}
          >
            4
          </span>

          <Image
            src={copyRankIcon}
            alt="copy-rank"
            width={16}
            height={16}
            className="ml-3"
          />
          <span
            className="ml-1 font-medium"
            style={{
              color: "rgba(80, 210, 193, 1)",
            }}
          >
            #64
          </span>

          <div className="ml-3">
            <Avatar name="J" backgroundColor="#2528CA" size={38} />
          </div>
        </div>
      </div>
      <div className="px-4">
        <div
          className="border rounded-[26px] pb-6"
          style={{
            borderColor: "rgba(80, 210, 193, 1)",
            background:
              "linear-gradient(0deg, #072723, #072723), radial-gradient(66.15% 63.46% at 7.22% 3.61%, rgba(80, 210, 193, 0.7) 0%, rgba(7, 39, 35, 0) 100%)",
          }}
        >
          <div className="flex flex-col pl-4 pr-6">
            <div className="flex justify-between mt-3 items-baseline">
              <span style={{ color: "rgba(165, 176, 176, 1)" }}>
                Current Balance
              </span>
              <div className="flex">
                <TimeRangeTab
                  label="D"
                  isActive={timeRange === "D"}
                  onClick={() => setTimeRange("D")}
                />
                <TimeRangeTab
                  label="W"
                  isActive={timeRange === "W"}
                  onClick={() => setTimeRange("W")}
                  className="ml-1"
                />
                <TimeRangeTab
                  label="M"
                  isActive={timeRange === "M"}
                  onClick={() => setTimeRange("M")}
                  className="ml-1"
                />
                <TimeRangeTab
                  label="YTD"
                  isActive={timeRange === "YTD"}
                  onClick={() => setTimeRange("YTD")}
                  className="ml-1"
                />
                <TimeRangeTab
                  label="ALL"
                  isActive={timeRange === "ALL"}
                  onClick={() => setTimeRange("ALL")}
                  className="ml-1"
                />
              </div>
            </div>
            <p className="text-2xl">$16,534.22</p>
            <div className="flex justify-between mt-1">
              <span
                className="text-xs"
                style={{ color: "rgba(165, 176, 176, 1)" }}
              >
                $8,876.32 Available
              </span>
              <span
                className="text-xs"
                style={{ color: "rgba(80, 210, 193, 1)" }}
              >
                $7.657,9 Used
              </span>
            </div>
          </div>

          <p
            className="mt-8 mx-5 rounded h-[1px]"
            style={{
              backgroundColor: "rgba(31, 56, 64, 1)",
            }}
          />

          <div className="px-5 h-[90px] mt-4">
            <BalanceChart timeRange={timeRange} />
          </div>

          <div className="flex justify-between px-5 mt-13">
            <div className="flex flex-col justify-center">
              <p style={{ color: "rgba(165, 176, 176, 1)" }}>
                Today’s Gain/Loss
              </p>
              <p className="flex items-center">
                <span className="text-sm">$2,896.10</span>
                <span
                  className="text-[10px] ml-1"
                  style={{ color: "rgba(79, 202, 21, 1)" }}
                >
                  +4.12%
                </span>
              </p>
            </div>
            <Button
              className="w-[110px] h-[46px] text-sm font-medium rounded-4"
              style={{
                color: "rgba(13, 23, 28, 1)",
                backgroundColor: "rgba(80, 210, 193, 1)",
              }}
            >
              Post a Signal
            </Button>
          </div>
        </div>
      </div>

      <div className="flex px-5 mt-4">
        <div className="flex flex-1">
          <div
            className="flex-1 rounded-[12px]"
            style={{
              backgroundColor: "rgba(23, 42, 48, 1)",
            }}
          >
            <div className="flex flex-col pt-4 pb-5 w-[52px] mx-auto">
              <Image
                src={copyingIcon}
                alt="copy-count"
                width={16}
                height={16}
              />
              <span
                className="text-sm mt-2"
                style={{ color: "rgba(165, 176, 176, 1)" }}
              >
                Copying
              </span>
              <span className="mt-6">243</span>
            </div>
          </div>

          <div
            className="flex-1 rounded-[12px] ml-3"
            style={{
              backgroundColor: "rgba(23, 42, 48, 1)",
            }}
          >
            <div className="flex flex-col pt-4 pb-5 w-[52px] mx-auto">
              <Image
                src={copyCountIcon}
                alt="copy-count"
                width={16}
                height={16}
              />
              <span
                className="text-sm mt-2"
                style={{ color: "rgba(165, 176, 176, 1)" }}
              >
                Copied
              </span>
              <span className="mt-6">367</span>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col ml-3">
          <div
            className="flex-1 rounded-[12px] flex items-center justify-between px-4"
            style={{
              backgroundColor: "rgba(23, 42, 48, 1)",
            }}
          >
            <div className="flex items-center">
              <Image
                src={activeTradesIcon}
                alt="copy-count"
                width={16}
                height={16}
              />
              <span
                className="text-sm ml-2 w-[45px] break-words"
                style={{ color: "rgba(165, 176, 176, 1)" }}
              >
                Active Trades
              </span>
            </div>
            <span className="">34</span>
          </div>

          <div
            className="flex-1 rounded-[12px] flex items-center justify-between px-4 mt-3"
            style={{
              backgroundColor: "rgba(23, 42, 48, 1)",
            }}
          >
            <div className="flex items-center">
              <Image
                src={tradesEndedIcon}
                alt="copy-count"
                width={16}
                height={16}
              />
              <span
                className="text-sm ml-2 w-[45px] break-words"
                style={{ color: "rgba(165, 176, 176, 1)" }}
              >
                Trades Ended
              </span>
            </div>
            <span className="">376</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
