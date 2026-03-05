"use client";

import { useState } from "react";
import {
  TrendingUp, TrendingDown, Target, ShieldAlert, UserPlus, UserMinus,
  MessageSquare, AlertTriangle, Wallet, Gift, Check, Trash2, BellOff,
} from "lucide-react";
import TopBar from "@/components/TopBar";

type NotificationType = "all" | "trades" | "social" | "system";

interface Notification {
  id: string;
  type: "trade_open" | "trade_close" | "stop_loss" | "take_profit" | "signal" | "follower_new" | "follower_lost" | "low_balance" | "margin_warning" | "referral";
  title: string;
  description: string;
  time: string;
  read: boolean;
  data?: {
    token?: string;
    amount?: number;
    pnl?: number;
    pnlPercent?: number;
    trader?: string;
    avatarBg?: string;
  };
}

const mockNotifications: Notification[] = [
  { id: "1", type: "trade_open", title: "Trade Opened", description: "Copied @geddard's BTC long position", time: "2 min ago", read: false, data: { token: "BTC", amount: 1250, trader: "geddard", avatarBg: "#22c55e" } },
  { id: "2", type: "take_profit", title: "Take Profit Hit", description: "ETH position closed at target", time: "15 min ago", read: false, data: { token: "ETH", pnl: 342.5, pnlPercent: 8.2 } },
  { id: "3", type: "signal", title: "New Signal", description: "@cryptoking posted a new trading signal", time: "32 min ago", read: false, data: { trader: "cryptoking", avatarBg: "#3b82f6" } },
  { id: "4", type: "follower_new", title: "New Follower", description: "@whale_hunter started copying your trades", time: "1 hour ago", read: true, data: { trader: "whale_hunter", avatarBg: "#f59e0b" } },
  { id: "5", type: "stop_loss", title: "Stop Loss Triggered", description: "SOL position closed to limit losses", time: "2 hours ago", read: true, data: { token: "SOL", pnl: -125.8, pnlPercent: -4.5 } },
  { id: "6", type: "trade_close", title: "Trade Closed", description: "Copied @daytrader's HYPE close", time: "3 hours ago", read: true, data: { token: "HYPE", pnl: 89.2, pnlPercent: 3.2, trader: "daytrader", avatarBg: "#a855f7" } },
  { id: "7", type: "referral", title: "Referral Bonus", description: "Your friend @newuser joined via your link", time: "5 hours ago", read: true, data: { amount: 25, trader: "newuser", avatarBg: "#ec4899" } },
  { id: "8", type: "low_balance", title: "Low Balance Warning", description: "Your available balance is below $100", time: "1 day ago", read: true, data: { amount: 87.5 } },
];

const getNotificationIcon = (type: Notification["type"]) => {
  const iconMap = {
    trade_open: { icon: TrendingUp, color: "text-teal-400", bg: "rgba(45,212,191,0.15)" },
    trade_close: { icon: TrendingDown, color: "text-gray-400", bg: "rgba(255,255,255,0.1)" },
    stop_loss: { icon: ShieldAlert, color: "text-rose-400", bg: "rgba(244,63,94,0.15)" },
    take_profit: { icon: Target, color: "text-green-400", bg: "rgba(34,197,94,0.15)" },
    signal: { icon: MessageSquare, color: "text-blue-400", bg: "rgba(59,130,246,0.15)" },
    follower_new: { icon: UserPlus, color: "text-purple-400", bg: "rgba(168,85,247,0.15)" },
    follower_lost: { icon: UserMinus, color: "text-orange-400", bg: "rgba(251,146,60,0.15)" },
    low_balance: { icon: Wallet, color: "text-yellow-400", bg: "rgba(250,204,21,0.15)" },
    margin_warning: { icon: AlertTriangle, color: "text-red-400", bg: "rgba(239,68,68,0.15)" },
    referral: { icon: Gift, color: "text-pink-400", bg: "rgba(236,72,153,0.15)" },
  };
  return iconMap[type];
};

const getNotificationCategory = (type: Notification["type"]): NotificationType => {
  if (["trade_open", "trade_close", "stop_loss", "take_profit"].includes(type)) return "trades";
  if (["signal", "follower_new", "follower_lost"].includes(type)) return "social";
  if (["low_balance", "margin_warning"].includes(type)) return "system";
  return "all";
};

export default function NotificationPage() {
  const [activeFilter, setActiveFilter] = useState<NotificationType>("all");
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const filters: { key: NotificationType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "trades", label: "Trades" },
    { key: "social", label: "Social" },
    { key: "system", label: "System" },
  ];

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "all") return true;
    return getNotificationCategory(n.type) === activeFilter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0a0f14 0%, #080d10 100%)" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/3 w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)", filter: "blur(60px)" }} />
      </div>

      <TopBar activeTrades={4} rank={64} />

      {/* Title & Actions */}
      <div className="relative z-10 px-3 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white">Alerts</h1>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: "rgba(45,212,191,0.2)", color: "rgba(45,212,191,1)" }}>
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-[9px] text-gray-400 hover:text-teal-400 transition-colors cursor-pointer flex items-center gap-1">
              <Check size={10} /> Mark all read
            </button>
          )}
        </div>

        <div className="flex p-0.5 rounded-lg mb-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {filters.map((filter) => (
            <button key={filter.key} onClick={() => setActiveFilter(filter.key)}
              className="flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all duration-300 cursor-pointer"
              style={{
                background: activeFilter === filter.key ? "rgba(45,212,191,0.15)" : "transparent",
                color: activeFilter === filter.key ? "rgba(45,212,191,1)" : "rgba(255,255,255,0.4)",
              }}>
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="relative z-10 px-3 pb-24">
        {filteredNotifications.length === 0 ? (
          <div className="rounded-xl p-6 flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(255,255,255,0.05)" }}>
              <BellOff size={22} className="text-gray-500" />
            </div>
            <p className="text-gray-400 text-[11px] mb-0.5">No notifications</p>
            <p className="text-gray-600 text-[9px]">You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredNotifications.map((notification) => {
              const iconConfig = getNotificationIcon(notification.type);
              const IconComponent = iconConfig.icon;
              return (
                <div key={notification.id}
                  className="rounded-lg p-2.5 transition-all duration-200 hover:bg-white/5 group cursor-pointer"
                  style={{
                    background: notification.read
                      ? "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)"
                      : "linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(45,212,191,0.02) 100%)",
                    border: notification.read ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(45,212,191,0.15)",
                  }}
                  onClick={() => markAsRead(notification.id)}>
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: iconConfig.bg }}>
                      <IconComponent size={14} className={iconConfig.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-semibold ${notification.read ? "text-gray-300" : "text-white"}`}>{notification.title}</span>
                          {!notification.read && <div className="w-1.5 h-1.5 rounded-full bg-teal-400" style={{ boxShadow: "0 0 6px rgba(45,212,191,0.6)" }} />}
                        </div>
                        <span className="text-[8px] text-gray-500">{notification.time}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mb-1.5">{notification.description}</p>
                      {notification.data && (
                        <div className="flex items-center gap-1.5">
                          {notification.data.token && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-medium" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                              {notification.data.token}
                            </span>
                          )}
                          {notification.data.pnl !== undefined && (
                            <span className={`text-[10px] font-semibold ${notification.data.pnl >= 0 ? "text-teal-400" : "text-rose-400"}`}>
                              {notification.data.pnl >= 0 ? "+" : ""}${Math.abs(notification.data.pnl).toFixed(1)}
                              {notification.data.pnlPercent !== undefined && (
                                <span className="opacity-70 ml-1">({notification.data.pnlPercent >= 0 ? "+" : ""}{notification.data.pnlPercent}%)</span>
                              )}
                            </span>
                          )}
                          {notification.data.amount !== undefined && notification.type === "trade_open" && (
                            <span className="text-[10px] text-gray-400">${notification.data.amount.toLocaleString()}</span>
                          )}
                          {notification.data.amount !== undefined && notification.type === "referral" && (
                            <span className="text-[10px] text-pink-400">+${notification.data.amount} bonus</span>
                          )}
                        </div>
                      )}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-white/10 cursor-pointer">
                      <Trash2 size={12} className="text-gray-500 hover:text-rose-400 transition-colors" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}