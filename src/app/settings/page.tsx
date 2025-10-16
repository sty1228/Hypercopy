"use client";

import { useState } from "react";
import Tab from "./components/tab";
import DefaultFollow from "./components/defaultFollow";
import SpecificTraders from "./components/specificTraders";
import BottomButtons from "./components/bottomButtons";

export enum TabEnum {
  "follow",
  "trader",
}

export enum OrderStyleEnum {
  market = "0",
  limit = "1",
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState(TabEnum.follow);

  const handleSwitchTab = (tab: TabEnum) => {
    console.log(tab);
    setActiveTab(tab);
  };

  return (
    <div className="pt-8 pb-4 px-5">
      <Tab activeTab={activeTab} handleSwitchTab={handleSwitchTab} />
      {activeTab === TabEnum.follow && <DefaultFollow />}
      {activeTab === TabEnum.trader && <SpecificTraders />}
      <BottomButtons />
    </div>
  );
}
