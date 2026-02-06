"use client";

import { useState } from "react";
import Image from "next/image";
import profileIcon from "@/assets/icons/profile.png";
import copyCountIcon from "@/assets/icons/copy-count.png";
import copyRankIcon from "@/assets/icons/copy-rank.png";
import Tab from "./components/tab";
import DefaultFollow from "./components/defaultFollow";
import SpecificTraders from "./components/specificTraders";
import { TabEnum } from "./types";
import UserMenu from "@/components/UserMenu";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState(TabEnum.follow);

  const handleSwitchTab = (tab: TabEnum) => {
    setActiveTab(tab);
  };

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)" }}
    >
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(10px, -15px) scale(1.05); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-8px, 10px) scale(1.03); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
      `}</style>

      {/* Ambient glow - with floating animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 left-1/3 w-[300px] h-[300px] rounded-full animate-float animate-pulse-glow"
          style={{
            background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute bottom-1/3 -right-20 w-[200px] h-[200px] rounded-full animate-float-slow animate-pulse-glow"
          style={{
            background: "radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 60%)",
            filter: "blur(40px)",
            animationDelay: "2s",
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 mt-3 mb-2 flex items-center justify-between px-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:bg-white/10"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Image src={profileIcon} alt="profile" width={14} height={14} />
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Image src={copyCountIcon} alt="copy-count" width={13} height={13} />
            <span className="text-[11px] font-semibold text-teal-400">4</span>
          </div>
          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg"
            style={{
              background: "linear-gradient(135deg, rgba(45,212,191,0.15) 0%, rgba(45,212,191,0.08) 100%)",
              border: "1px solid rgba(45,212,191,0.25)",
              boxShadow: "0 0 15px rgba(45,212,191,0.2)",
            }}
          >
            <Image src={copyRankIcon} alt="copy-rank" width={13} height={13} />
            <span className="text-[11px] font-semibold text-teal-400">#64</span>
          </div>
          <UserMenu />
        </div>
      </div>

      {/* Tab */}
      <div className="relative z-10 px-4 mb-4">
        <Tab activeTab={activeTab} handleSwitchTab={handleSwitchTab} />
      </div>

      {/* Content - with fade in animation */}
      {activeTab === TabEnum.follow && (
        <div key="follow" className="relative z-10 px-4 pb-8 animate-fade-in-up">
          <DefaultFollow />
        </div>
      )}
      {activeTab === TabEnum.trader && (
        <div key="trader" className="relative z-10 px-4 pb-8 animate-fade-in-up">
          <SpecificTraders />
        </div>
      )}
    </div>
  );
}