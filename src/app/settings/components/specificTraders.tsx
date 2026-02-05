"use client";

import { useState, useContext, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  AlertTriangle,
  Bell,
  Loader2,
} from "lucide-react";
import { HyperLiquidContext } from "@/providers/hyperliquid";
import { useCurrentWallet } from "@/hooks/usePrivyData";
import { toast } from "sonner";
import { TradeSizeType } from "@/service";

interface TraderSettings {
  tradeSize: number;
  tradeSizeType: TradeSizeType;
  leverage: number;
  leverageType: "cross" | "isolated";
  cutLoss: number;
  cutLossType: TradeSizeType;
  takeProfit: number;
  takeProfitType: TradeSizeType;
  notifications: boolean;
}

interface Trader {
  id: number;
  name: string;
  handle: string;
  color: string;
  winRate: number;
  pnl: number;
  useCustom: boolean;
  settings: TraderSettings;
}

// Toggle Component
const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onToggle();
    }}
    className="w-11 h-6 rounded-full transition-all relative"
    style={{
      background: enabled ? "rgba(45,212,191,1)" : "rgba(255,255,255,0.1)",
    }}
  >
    <div
      className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
      style={{ left: enabled ? "22px" : "2px" }}
    />
  </button>
);

const MOCK_TRADERS: Trader[] = [
  {
    id: 1,
    name: "Damian Terry",
    handle: "@damian",
    color: "#3b82f6",
    winRate: 68,
    pnl: 12450,
    useCustom: false,
    settings: {
      tradeSize: 500,
      tradeSizeType: "USD",
      leverage: 5,
      leverageType: "isolated",
      cutLoss: 100,
      cutLossType: "USD",
      takeProfit: 150,
      takeProfitType: "USD",
      notifications: true,
    },
  },
  {
    id: 2,
    name: "Gerry Gedard",
    handle: "@gedderd",
    color: "#22c55e",
    winRate: 72,
    pnl: 28300,
    useCustom: true,
    settings: {
      tradeSize: 500,
      tradeSizeType: "USD",
      leverage: 3,
      leverageType: "cross",
      cutLoss: 80,
      cutLossType: "USD",
      takeProfit: 200,
      takeProfitType: "USD",
      notifications: true,
    },
  },
  {
    id: 3,
    name: "Harry Freman",
    handle: "@daytrader",
    color: "#a855f7",
    winRate: 55,
    pnl: 4200,
    useCustom: false,
    settings: {
      tradeSize: 300,
      tradeSizeType: "USD",
      leverage: 5,
      leverageType: "isolated",
      cutLoss: 50,
      cutLossType: "USD",
      takeProfit: 100,
      takeProfitType: "USD",
      notifications: true,
    },
  },
  {
    id: 4,
    name: "Maria Feticia",
    handle: "@mariaeficia88",
    color: "#06b6d4",
    winRate: 81,
    pnl: 45600,
    useCustom: true,
    settings: {
      tradeSize: 300,
      tradeSizeType: "USD",
      leverage: 10,
      leverageType: "isolated",
      cutLoss: 60,
      cutLossType: "USD",
      takeProfit: 120,
      takeProfitType: "USD",
      notifications: false,
    },
  },
  {
    id: 5,
    name: "Emerson Curtis",
    handle: "@emercurt",
    color: "#22c55e",
    winRate: 63,
    pnl: 8900,
    useCustom: false,
    settings: {
      tradeSize: 200,
      tradeSizeType: "USD",
      leverage: 5,
      leverageType: "cross",
      cutLoss: 40,
      cutLossType: "USD",
      takeProfit: 80,
      takeProfitType: "USD",
      notifications: true,
    },
  },
];

export default function SpecificTraders() {
  const [traders, setTraders] = useState<Trader[]>(MOCK_TRADERS);
  const [expandedTrader, setExpandedTrader] = useState<number | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const updateTraderSetting = <K extends keyof TraderSettings>(
    traderId: number,
    key: K,
    value: TraderSettings[K]
  ) => {
    setTraders((prev) =>
      prev.map((t) => (t.id === traderId ? { ...t, settings: { ...t.settings, [key]: value } } : t))
    );
    setHasChanges(true);
  };

  const toggleTraderCustom = (traderId: number) => {
    setTraders((prev) => prev.map((t) => (t.id === traderId ? { ...t, useCustom: !t.useCustom } : t)));
    setHasChanges(true);
  };

  const unfollowTrader = (traderId: number) => {
    setTraders((prev) => prev.filter((t) => t.id !== traderId));
    setExpandedTrader(null);
    setHasChanges(true);
  };

  const handleSave = () => {
    // TODO: API call to save trader settings
    setHasChanges(false);
    toast.success("Settings saved successfully");
  };

  return (
    <div>
      {/* Search */}
      <div
        className="rounded-2xl h-12 flex items-center px-4 gap-3 mb-4"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <Search size={16} className="text-gray-500" />
        <input
          type="text"
          placeholder="Search traders to follow..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-500"
        />
      </div>

      {/* Followed Traders List */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-3">Followed Traders ({traders.length})</p>
        <div className="space-y-2">
          {traders.map((trader) => (
            <div key={trader.id}>
              {/* Trader Row */}
              <div
                className="rounded-2xl p-3 cursor-pointer transition-all"
                style={{
                  background:
                    expandedTrader === trader.id
                      ? "linear-gradient(135deg, rgba(45,212,191,0.08) 0%, rgba(45,212,191,0.02) 100%)"
                      : "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)",
                  border:
                    expandedTrader === trader.id
                      ? "1px solid rgba(45,212,191,0.3)"
                      : "1px solid rgba(255,255,255,0.08)",
                }}
                onClick={() => setExpandedTrader(expandedTrader === trader.id ? null : trader.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: trader.color }}
                    >
                      {trader.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{trader.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{trader.handle}</span>
                        <span className="text-xs text-teal-400">{trader.winRate}% win</span>
                        <span className="text-xs text-green-400">+${(trader.pnl / 1000).toFixed(1)}k</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {trader.useCustom && trader.settings.leverage >= 10 && (
                      <AlertTriangle size={14} className="text-orange-400" />
                    )}
                    <span
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{
                        background: trader.useCustom ? "rgba(45,212,191,0.15)" : "rgba(255,255,255,0.05)",
                        color: trader.useCustom ? "rgba(45,212,191,1)" : "rgba(255,255,255,0.5)",
                      }}
                    >
                      {trader.useCustom ? `$${trader.settings.tradeSize}` : "Default"}
                    </span>
                    {expandedTrader === trader.id ? (
                      <ChevronUp size={16} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Settings */}
              {expandedTrader === trader.id && (
                <div
                  className="mt-1 rounded-2xl p-4"
                  style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  {/* Toggle Custom Settings */}
                  <div
                    className="flex items-center justify-between mb-4 pb-3"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div>
                      <p className="text-sm text-white">Custom Settings</p>
                      <p className="text-xs text-gray-500">Override default follow settings</p>
                    </div>
                    <Toggle enabled={trader.useCustom} onToggle={() => toggleTraderCustom(trader.id)} />
                  </div>

                  {trader.useCustom ? (
                    <div className="space-y-3">
                      {/* High Leverage Warning */}
                      {trader.settings.leverage >= 10 && (
                        <div
                          className="flex items-center gap-2 p-2 rounded-lg mb-2"
                          style={{
                            background: "rgba(251,146,60,0.1)",
                            border: "1px solid rgba(251,146,60,0.2)",
                          }}
                        >
                          <AlertTriangle size={14} className="text-orange-400 flex-shrink-0" />
                          <span className="text-xs text-orange-300">High leverage increases liquidation risk</span>
                        </div>
                      )}

                      {/* Trade Size */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Trade Size</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={trader.settings.tradeSize}
                            onChange={(e) =>
                              updateTraderSetting(trader.id, "tradeSize", Number(e.target.value) || 0)
                            }
                            className="w-16 bg-transparent text-right text-sm text-white outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex gap-1">
                            {(["USD", "PCT"] as TradeSizeType[]).map((type) => (
                              <button
                                key={type}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTraderSetting(trader.id, "tradeSizeType", type);
                                }}
                                className="w-7 h-7 rounded text-xs font-medium transition-all"
                                style={
                                  trader.settings.tradeSizeType === type
                                    ? { backgroundColor: "rgba(45,212,191,1)", color: "#0a0f14" }
                                    : {
                                        border: "1px solid rgba(45,212,191,0.4)",
                                        color: "rgba(45,212,191,0.8)",
                                      }
                                }
                              >
                                {type === "USD" ? "$" : "%"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Leverage */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Leverage</span>
                        <div className="flex items-center gap-2">
                          {[3, 5, 10, 20].map((v) => (
                            <button
                              key={v}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateTraderSetting(trader.id, "leverage", v);
                              }}
                              className="px-2 py-1 rounded text-xs font-medium transition-all"
                              style={
                                trader.settings.leverage === v
                                  ? {
                                      background: "rgba(45,212,191,0.2)",
                                      color: "rgba(45,212,191,1)",
                                      border: "1px solid rgba(45,212,191,0.5)",
                                    }
                                  : {
                                      background: "rgba(255,255,255,0.05)",
                                      color: "rgba(255,255,255,0.5)",
                                      border: "1px solid transparent",
                                    }
                              }
                            >
                              {v}x
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Stop Loss */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Stop Loss</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={trader.settings.cutLoss}
                            onChange={(e) =>
                              updateTraderSetting(trader.id, "cutLoss", Number(e.target.value) || 0)
                            }
                            className="w-16 bg-transparent text-right text-sm text-orange-400 outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex gap-1">
                            {(["USD", "PCT"] as TradeSizeType[]).map((type) => (
                              <button
                                key={type}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTraderSetting(trader.id, "cutLossType", type);
                                }}
                                className="w-7 h-7 rounded text-xs font-medium transition-all"
                                style={
                                  trader.settings.cutLossType === type
                                    ? { backgroundColor: "rgba(45,212,191,1)", color: "#0a0f14" }
                                    : {
                                        border: "1px solid rgba(45,212,191,0.4)",
                                        color: "rgba(45,212,191,0.8)",
                                      }
                                }
                              >
                                {type === "USD" ? "$" : "%"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Take Profit */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Take Profit</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={trader.settings.takeProfit}
                            onChange={(e) =>
                              updateTraderSetting(trader.id, "takeProfit", Number(e.target.value) || 0)
                            }
                            className="w-16 bg-transparent text-right text-sm text-green-400 outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex gap-1">
                            {(["USD", "PCT"] as TradeSizeType[]).map((type) => (
                              <button
                                key={type}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTraderSetting(trader.id, "takeProfitType", type);
                                }}
                                className="w-7 h-7 rounded text-xs font-medium transition-all"
                                style={
                                  trader.settings.takeProfitType === type
                                    ? { backgroundColor: "rgba(45,212,191,1)", color: "#0a0f14" }
                                    : {
                                        border: "1px solid rgba(45,212,191,0.4)",
                                        color: "rgba(45,212,191,0.8)",
                                      }
                                }
                              >
                                {type === "USD" ? "$" : "%"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Notifications */}
                      <div
                        className="flex items-center justify-between pt-3 mt-1"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        <div className="flex items-center gap-2">
                          <Bell size={14} className="text-gray-500" />
                          <span className="text-xs text-gray-500">Notifications</span>
                        </div>
                        <Toggle
                          enabled={trader.settings.notifications}
                          onToggle={() =>
                            updateTraderSetting(trader.id, "notifications", !trader.settings.notifications)
                          }
                        />
                      </div>

                      {/* Unfollow */}
                      <div className="pt-3 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            unfollowTrader(trader.id);
                          }}
                          className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X size={14} />
                          <span>Unfollow {trader.name.split(" ")[0]}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                        <Check size={14} className="text-teal-400" />
                        <span>Using default follow settings</span>
                      </div>
                      {/* Unfollow */}
                      <div className="pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            unfollowTrader(trader.id);
                          }}
                          className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X size={14} />
                          <span>Unfollow {trader.name.split(" ")[0]}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="space-y-3 mt-6">
        <button
          className="w-full h-14 rounded-2xl font-semibold text-sm transition-all"
          style={{
            background: hasChanges ? "rgba(45,212,191,1)" : "rgba(45,212,191,0.5)",
            color: "#0a0f14",
            boxShadow: hasChanges ? "0 0 25px rgba(45,212,191,0.4)" : "none",
          }}
          onClick={handleSave}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}