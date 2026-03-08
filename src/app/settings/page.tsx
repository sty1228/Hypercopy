"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Tab from "./components/tab";
import DefaultFollow from "./components/defaultFollow";
import SpecificTraders from "./components/specificTraders";
import { TabEnum } from "./types";
import TopBar from "@/components/TopBar";

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

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/3 w-[300px] h-[300px] rounded-full animate-float animate-pulse-glow"
          style={{ background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/3 -right-20 w-[200px] h-[200px] rounded-full animate-float-slow animate-pulse-glow"
          style={{ background: "radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 60%)", filter: "blur(40px)", animationDelay: "2s" }} />
      </div>

      <TopBar />

      <div className="relative z-10 px-3 mb-3">
        <Tab activeTab={activeTab} handleSwitchTab={handleSwitchTab} />
      </div>

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