"use client";

import colors from "@/const/colors";
import { TabEnum } from "../page";

const activeTabStyle = {
  background: "rgba(80, 210, 193, 1)",
  color: colors.primary,
  borderRadius: "16px",
  fontWeight: "500",
};

export default function Tab({
  handleSwitchTab,
  activeTab,
}: {
  handleSwitchTab: (tab: TabEnum) => void;
  activeTab: TabEnum;
}) {
  const handleClickTab = (tab: TabEnum) => {
    handleSwitchTab(tab);
  };

  return (
    <div
      className="flex border rounded-[16px] h-[52px] overflow-hidden items-center"
      style={{
        borderColor: "rgba(80, 210, 193, 1)",
      }}
    >
      <span
        className="flex-1 flex h-[52px] justify-center items-center font-light text-base"
        style={
          activeTab === TabEnum.follow
            ? activeTabStyle
            : { color: "rgba(255, 255, 255, 0.4)" }
        }
        onClick={() => handleClickTab(TabEnum.follow)}
      >
        Default Follow
      </span>
      <span
        className="flex-1 flex h-[52px] justify-center items-center font-light text-base"
        style={
          activeTab === TabEnum.trader
            ? activeTabStyle
            : { color: "rgba(255, 255, 255, 0.4)" }
        }
        onClick={() => handleClickTab(TabEnum.trader)}
      >
        Specific Traders
      </span>
    </div>
  );
}
