"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X as XIcon,
  Search,
  UserPlus,
  Sliders,
  Sparkles,
  CheckSquare,
  Square,
} from "lucide-react";

const STORAGE_KEY = "hc_onboarding_tutorial_seen";
const SESSION_KEY = "hc_onboarding_tutorial_session_skipped";

const STEPS: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; accent: string }[] = [
  {
    icon: Search,
    title: "Find or search for X.com KOLs on our app",
    accent: "#2dd4bf",
  },
  {
    icon: UserPlus,
    title: "Follow and manually copy their trades — or auto-copy / auto-fade them",
    accent: "#34d399",
  },
  {
    icon: Sliders,
    title: "Select position sizing and exit strategies",
    accent: "#60a5fa",
  },
  {
    icon: Sparkles,
    title: "Enjoy automatically generated profits",
    accent: "#fbbf24",
  },
];

export default function OnboardingTutorialPopup({ onClose }: { onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    if (typeof window !== "undefined") {
      if (dontShowAgain) {
        try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
      } else {
        try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
      }
    }
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const content = (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 9998,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.28s ease",
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-[92%] max-w-[420px] mx-4 rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #111820 0%, #0d1117 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
          transition: "transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.28s ease",
          opacity: visible ? 1 : 0,
        }}
      >
        {/* accent bar */}
        <div
          style={{
            height: 3,
            background: "linear-gradient(90deg, transparent, #2dd4bf, transparent)",
            opacity: 0.7,
          }}
        />

        {/* ambient glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: -60,
            left: "50%",
            transform: "translateX(-50%)",
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(45,212,191,0.18), transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "rgba(255,255,255,0.06)" }}
          aria-label="Close"
        >
          <XIcon size={14} className="text-gray-400" />
        </button>

        <div className="relative px-5 pt-6 pb-5">
          {/* header */}
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-teal-400" />
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              How Hypercopy works
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mb-4 tracking-tight">
            Get started in 4 steps
          </h2>

          {/* steps */}
          <div className="space-y-2 mb-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl px-3 py-3"
                  style={{
                    background: `linear-gradient(135deg, ${step.accent}0d 0%, rgba(255,255,255,0.025) 100%)`,
                    border: `1px solid ${step.accent}22`,
                  }}
                >
                  <div
                    className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-[11px]"
                    style={{
                      background: `${step.accent}1f`,
                      color: step.accent,
                      border: `1px solid ${step.accent}40`,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon size={11} className="text-gray-400" />
                      <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>
                        Step {i + 1}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-white leading-snug">
                      {step.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* don't-show-again */}
          <button
            onClick={() => setDontShowAgain((v) => !v)}
            className="flex items-center gap-2 mb-4 px-1 py-1 cursor-pointer transition-colors"
            type="button"
          >
            {dontShowAgain ? (
              <CheckSquare size={14} className="text-teal-400" />
            ) : (
              <Square size={14} className="text-gray-500" />
            )}
            <span
              className="text-[11px]"
              style={{ color: dontShowAgain ? "#2dd4bf" : "rgba(255,255,255,0.5)" }}
            >
              Don&apos;t show again
            </span>
          </button>

          {/* primary action */}
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-xl text-[13px] font-bold transition-all"
            style={{
              background: "linear-gradient(135deg, #2dd4bf, #14b8a6)",
              color: "#000",
              boxShadow: "0 4px 24px rgba(45,212,191,0.25)",
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(content, document.body);
}

export function shouldShowOnboardingTutorial(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(STORAGE_KEY) === "1") return false;
    if (sessionStorage.getItem(SESSION_KEY) === "1") return false;
  } catch {
    return false;
  }
  return true;
}
