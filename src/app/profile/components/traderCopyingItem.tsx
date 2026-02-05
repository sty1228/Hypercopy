"use client";
import React from "react";
import { TrendingUp, TrendingDown, Copy } from "lucide-react";

export interface CopyingTrader {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  avatarBg: string;
  pnl: number;
  copiedSince: string;
  tradesFollowed: number;
  winRate: number;
}

interface TraderCopyingItemProps {
  trader: CopyingTrader;
}

export default function TraderCopyingItem({ trader }: TraderCopyingItemProps) {
  const isPositive = trader.pnl >= 0;

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-white/5 transition-all">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ backgroundColor: trader.avatarBg }}
        >
          {trader.avatar}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-white truncate">{trader.name}</span>
            <Copy size={10} className="text-teal-400 shrink-0" />
          </div>
          <span className="text-[11px] text-gray-500 block truncate">{trader.handle}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] text-gray-500">
              Since <span className="text-gray-400">{trader.copiedSince}</span>
            </span>
            <span className="text-[9px] text-gray-600">·</span>
            <span className="text-[9px] text-gray-500">
              <span className="text-gray-400">{trader.tradesFollowed}</span> trades
            </span>
          </div>
        </div>
      </div>

      {/* PnL & WinRate */}
      <div className="flex flex-col items-end shrink-0">
        <div className="flex items-center gap-1">
          {isPositive ? (
            <TrendingUp size={12} className="text-teal-400" />
          ) : (
            <TrendingDown size={12} className="text-rose-400" />
          )}
          <span
            className="text-sm font-bold"
            style={{ color: isPositive ? "rgba(45,212,191,1)" : "rgba(244,63,94,1)" }}
          >
            {isPositive ? "+" : ""}
            {trader.pnl}%
          </span>
        </div>
        {/* Win Rate bar */}
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${trader.winRate}%`,
                background:
                  trader.winRate >= 60
                    ? "linear-gradient(90deg, rgba(45,212,191,1), rgba(45,212,191,0.7))"
                    : trader.winRate >= 40
                    ? "linear-gradient(90deg, rgba(251,191,36,1), rgba(251,191,36,0.7))"
                    : "linear-gradient(90deg, rgba(244,63,94,1), rgba(244,63,94,0.7))",
              }}
            />
          </div>
          <span className="text-[9px] text-gray-500">{trader.winRate}%</span>
        </div>
      </div>
    </div>
  );
}