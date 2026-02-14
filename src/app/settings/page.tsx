"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import profileIcon from "@/assets/icons/profile.png";
import copyCountIcon from "@/assets/icons/copy-count.png";
import copyRankIcon from "@/assets/icons/copy-rank.png";
import Tab from "./components/tab";
import DefaultFollow from "./components/defaultFollow";
import SpecificTraders from "./components/specificTraders";
import { TabEnum } from "./types";
import UserMenu from "@/components/UserMenu";

const IconWithTooltip = ({ tooltip, children }: { tooltip: string; children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(timer);
  }, [show]);
  return (
    <div className="relative" onClick={() => setShow((p) => !p)}>
      {children}
      <div
        className="absolute top-full right-0 mt-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap text-[10px] font-medium pointer-events-none transition-all duration-200 z-50"
        style={{
          background: "rgba(15,20,25,0.95)",
          border: "1px solid rgba(45,212,191,0.3)",
          color: "rgba(255,255,255,0.9)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0)" : "translateY(-4px)",
        }}
      >
        {tooltip}
      </div>
    </div>
  );
};

function SettingsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(TabEnum.follow);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "trader") setActiveTab(TabEnum.trader);
  }, [searchParams]);

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

      {/* Ambient glow */}
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
      <div className="relative z-10 mt-2 mb-1.5 flex items-center justify-between px-3">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-all hover:bg-white/10"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Image src={profileIcon} alt="profile" width={12} height={12} />
        </div>
        <div className="flex items-center gap-1.5">
          <IconWithTooltip tooltip="Active Trades">
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-all hover:bg-white/10"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Image src={copyCountIcon} alt="active-trades" width={11} height={11} />
              <span className="text-[10px] font-semibold text-teal-400">4</span>
            </div>
          </IconWithTooltip>
          <IconWithTooltip tooltip="Your Rank">
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-all hover:bg-white/10"
              style={{
                background: "linear-gradient(135deg, rgba(45,212,191,0.15) 0%, rgba(45,212,191,0.08) 100%)",
                border: "1px solid rgba(45,212,191,0.25)",
                boxShadow: "0 0 15px rgba(45,212,191,0.2)",
              }}
            >
              <Image src={copyRankIcon} alt="your-rank" width={11} height={11} />
              <span className="text-[10px] font-semibold text-teal-400">#64</span>
            </div>
          </IconWithTooltip>
          <UserMenu />
        </div>
      </div>

      {/* Tab */}
      <div className="relative z-10 px-3 mb-3">
        <Tab activeTab={activeTab} handleSwitchTab={handleSwitchTab} />
      </div>

      {/* Content */}
      {activeTab === TabEnum.follow && (
        <div key="follow" className="relative z-10 px-3 pb-6 animate-fade-in-up">
          <DefaultFollow />
        </div>
      )}
      {activeTab === TabEnum.trader && (
        <div key="trader" className="relative z-10 px-3 pb-6 animate-fade-in-up">
          <SpecificTraders />
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}