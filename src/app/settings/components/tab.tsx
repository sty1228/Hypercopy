"use client";

import { TabEnum } from "../types";

export default function Tab({
  handleSwitchTab,
  activeTab,
}: {
  handleSwitchTab: (tab: TabEnum) => void;
  activeTab: TabEnum;
}) {
  return (
    <div
      className="rounded-2xl p-1 flex relative"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Sliding background indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-xl transition-all duration-300 ease-out"
        style={{
          width: "calc(50% - 4px)",
          left: activeTab === TabEnum.follow ? "4px" : "calc(50% + 0px)",
          background: "rgba(45,212,191,1)",
          boxShadow: "0 0 20px rgba(45,212,191,0.4)",
        }}
      />

      <button
        className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative z-10 active:scale-95 cursor-pointer"
        style={{
          color: activeTab === TabEnum.follow ? "#0a0f14" : "rgba(255,255,255,0.4)",
        }}
        onClick={() => handleSwitchTab(TabEnum.follow)}
      >
        Default Follow
      </button>
      <button
        className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative z-10 active:scale-95 cursor-pointer"
        style={{
          color: activeTab === TabEnum.trader ? "#0a0f14" : "rgba(255,255,255,0.4)",
        }}
        onClick={() => handleSwitchTab(TabEnum.trader)}
      >
        Specific Traders
      </button>
    </div>
  );
}