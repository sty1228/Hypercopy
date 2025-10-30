"use client";

import { useState } from "react";
import Tab from "./components/tab";
import DefaultFollow from "./components/defaultFollow";
import SpecificTraders from "./components/specificTraders";
import { randomColor } from "../copyTrading/components/kolItem";

export enum TabEnum {
  "follow",
  "trader",
}

export enum OrderStyleEnum {
  market = "0",
  limit = "1",
}

const mockSearchResult = [
  {
    id: "JohnDoe",
    name: "John Doe",
    color: randomColor(),
  },
  {
    id: "JaneDoe",
    name: "Jane Doe",
    color: randomColor(),
  },
  {
    id: "JimBeam",
    name: "Jim Beam",
    color: randomColor(),
  },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState(TabEnum.follow);
  const [specificTradersSearchResult, setSpecificTradersSearchResult] =
    useState<
      {
        id: string;
        name: string;
        color: string;
      }[]
    >([]);

  const handleSwitchTab = (tab: TabEnum) => {
    console.log(tab);
    setActiveTab(tab);
  };

  const handleSpecificTradersSearch = (value: string) => {
    console.log(value);
    setSpecificTradersSearchResult(value ? mockSearchResult : []);
  };

  return (
    <div className="pt-8 pb-4">
      <div className="px-5">
        <Tab activeTab={activeTab} handleSwitchTab={handleSwitchTab} />
      </div>
      {activeTab === TabEnum.follow && (
        <div className="mt-8 px-5">
          <DefaultFollow />
        </div>
      )}
      {activeTab === TabEnum.trader && (
        <SpecificTraders
          searchResult={specificTradersSearchResult}
          handleSearch={handleSpecificTradersSearch}
        />
      )}
    </div>
  );
}
