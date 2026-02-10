"use client";

import { useContext, useEffect, useState, useRef, useCallback } from "react";
import { Wallet, TrendingUp, Shield, Zap, Bell, AlertCircle, Loader2, Info } from "lucide-react";
import { HyperLiquidContext } from "@/providers/hyperliquid";
import { useCurrentWallet } from "@/hooks/usePrivyData";
import { getPerpsBalance } from "@/helpers/hyperliquid";
import { toast } from "sonner";
import {
  getDefaultFollowSettings as fetchDefaultFollowSettings,
  LeverageType,
  TradeSizeType,
  updateDefaultFollowSettings,
} from "@/service";
import { OrderStyleEnum } from "../types";
import BottomButtons from "./bottomButtons";

export interface IDefaultFollowSettings {
  perpsBalance: number;
  availableBalance: number;
  usedBalance: number;
  tradeSize: number;
  tradeSizeType: TradeSizeType;
  leverage: number;
  leverageType: LeverageType;
  cutLoss: number;
  cutLossType: TradeSizeType;
  takeProfit: number;
  takeProfitType: TradeSizeType;
  orderStyle: OrderStyleEnum;
  maxPositions: number;
  notifications: boolean;
}

const DEFAULT_FOLLOW_SETTINGS: IDefaultFollowSettings = {
  perpsBalance: 0,
  availableBalance: 0,
  usedBalance: 0,
  tradeSize: 100,
  tradeSizeType: "USD" as TradeSizeType,
  leverage: 5,
  leverageType: "cross" as LeverageType,
  cutLoss: 10,
  cutLossType: "USD" as TradeSizeType,
  takeProfit: 10,
  takeProfitType: "USD" as TradeSizeType,
  orderStyle: OrderStyleEnum.market,
  maxPositions: 10,
  notifications: true,
};

const LEVERAGE_TOOLTIP =
  "The higher the leverage, the less margin you use per trade, but with higher liquidation risk. E.g. $500 position with 10x leverage = $50 margin per trade.";

// ─── Tooltip ───
function Tooltip({
  children,
  text,
  wide = false,
}: {
  children: React.ReactNode;
  text: string;
  wide?: boolean;
}) {
  const [show, setShow] = useState(false);
  const popupClass = wide
    ? "absolute bottom-full mb-2 px-3 py-2 rounded-lg text-[10px] leading-relaxed text-white z-50 pointer-events-none w-56 whitespace-normal left-0"
    : "absolute bottom-full mb-2 px-3 py-2 rounded-lg text-[10px] leading-relaxed text-white z-50 pointer-events-none whitespace-nowrap left-1/2 -translate-x-1/2";
  const arrowClass = wide
    ? "absolute top-full w-0 h-0 left-4"
    : "absolute top-full w-0 h-0 left-1/2 -translate-x-1/2";

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => setShow((p) => !p)}
    >
      {children}
      {show && (
        <div
          className={popupClass}
          style={{
            background: "rgba(20,25,30,0.98)",
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
          }}
        >
          {text}
          <div
            className={arrowClass}
            style={{
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop: "4px solid rgba(20,25,30,0.98)",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Leverage Slider ───
function LeverageSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const min = 1, max = 20;
  const pct = ((value - min) / (max - min)) * 100;

  const calcValue = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return value;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(ratio * (max - min) + min);
    },
    [value]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onChange(calcValue(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 0) return;
    onChange(calcValue(e.clientX));
  };

  const thumbColor = value >= 15 ? "rgba(239,68,68,1)" : value >= 10 ? "rgba(251,146,60,1)" : "rgba(45,212,191,1)";
  const trackColor = value >= 15 ? "rgba(239,68,68,0.6)" : value >= 10 ? "rgba(251,146,60,0.6)" : "rgba(45,212,191,0.6)";

  return (
    <div className="w-full">
      <div ref={trackRef} className="relative h-8 flex items-center cursor-pointer"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}>
        <div className="absolute left-0 right-0 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="absolute left-0 h-1.5 rounded-full transition-colors" style={{ width: `${pct}%`, background: trackColor }} />
        <div className="absolute w-5 h-5 rounded-full border-2 border-white transition-colors"
          style={{ left: `calc(${pct}% - 10px)`, background: thumbColor, boxShadow: `0 0 10px ${thumbColor}` }} />
      </div>
      <div className="flex justify-between mt-0.5 px-0.5">
        {[1, 5, 10, 15, 20].map((v) => (
          <button key={v} onClick={() => onChange(v)}
            className="text-[10px] transition-all cursor-pointer"
            style={{ color: v === value ? "rgba(45,212,191,1)" : "rgba(255,255,255,0.3)" }}>
            {v}x
          </button>
        ))}
      </div>
    </div>
  );
}

// Toggle Component
const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className="w-10 h-5 rounded-full transition-all duration-300 relative active:scale-95 cursor-pointer"
    style={{ background: enabled ? "rgba(45,212,191,1)" : "rgba(255,255,255,0.1)" }}
  >
    <div
      className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-300"
      style={{ left: enabled ? "20px" : "2px" }}
    />
  </button>
);

// Type Button Component
const TypeButton = ({
  active,
  onClick,
  children,
  color = "teal",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: "teal" | "orange";
}) => {
  const colors = {
    teal: { activeBg: "rgba(45,212,191,1)", activeText: "#0a0f14", border: "rgba(45,212,191,0.4)", text: "rgba(45,212,191,0.8)" },
    orange: { activeBg: "rgba(251,146,60,0.15)", activeText: "rgba(251,146,60,1)", border: "rgba(251,146,60,0.3)", text: "rgba(251,146,60,0.6)" },
  };
  const c = colors[color];
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-lg font-medium text-xs transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
      style={
        active
          ? { backgroundColor: c.activeBg, color: c.activeText, border: color === "orange" ? "1px solid rgba(251,146,60,0.4)" : "none" }
          : { border: `1px solid ${c.border}`, color: c.text, background: "transparent" }
      }
    >
      {children}
    </button>
  );
};

// Section Card Component
const SectionCard = ({
  icon: Icon,
  title,
  children,
  color = "teal",
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  color?: "teal" | "orange" | "purple";
}) => (
  <div
    className="rounded-xl p-3 mb-3"
    style={{
      background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(45,212,191,0.01) 100%)",
      border: "1px solid rgba(255,255,255,0.08)",
    }}
  >
    <div className="flex items-center gap-2 mb-3">
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center"
        style={{
          background:
            color === "teal"
              ? "rgba(45,212,191,0.15)"
              : color === "orange"
              ? "rgba(251,146,60,0.15)"
              : "rgba(168,85,247,0.15)",
        }}
      >
        <Icon
          size={12}
          className={color === "teal" ? "text-teal-400" : color === "orange" ? "text-orange-400" : "text-purple-400"}
        />
      </div>
      <span className="text-xs font-semibold text-white">{title}</span>
    </div>
    {children}
  </div>
);

// Input Row Component
const InputRow = ({
  label,
  value,
  onChange,
  suffix,
  typeValue,
  onTypeChange,
  showTypeButtons = true,
  color = "teal",
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
  suffix?: string;
  typeValue?: string;
  onTypeChange?: (value: TradeSizeType) => void;
  showTypeButtons?: boolean;
  color?: "teal" | "orange";
}) => (
  <div
    className="rounded-lg h-10 flex items-center px-3 gap-2 mb-1.5 last:mb-0"
    style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}
  >
    <span className="text-xs text-gray-500 flex-shrink-0 w-20">{label}</span>
    <input
      type="text"
      value={suffix ? `${value}${suffix}` : value}
      onChange={(e) => onChange(e.target.value.replace(suffix || "", ""))}
      className="flex-1 bg-transparent text-right text-white text-sm font-medium outline-none"
    />
    {showTypeButtons && typeValue && onTypeChange && (
      <div className="flex gap-1 ml-2">
        <TypeButton active={typeValue === "USD"} onClick={() => onTypeChange("USD")} color={color}>
          $
        </TypeButton>
        <TypeButton active={typeValue === "PCT"} onClick={() => onTypeChange("PCT")} color={color}>
          %
        </TypeButton>
      </div>
    )}
  </div>
);

export default function DefaultFollow() {
  const { infoClient } = useContext(HyperLiquidContext);
  const currentWallet = useCurrentWallet();
  const [cachedSettings, setCachedSettings] = useState<IDefaultFollowSettings | null>(null);
  const [settings, setSettings] = useState<IDefaultFollowSettings>(DEFAULT_FOLLOW_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  const updateSetting = <K extends keyof IDefaultFollowSettings>(key: K, value: IDefaultFollowSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await fetchDefaultFollowSettings();
      const transformed: IDefaultFollowSettings = {
        ...DEFAULT_FOLLOW_SETTINGS,
        tradeSize: data.tradeSize,
        tradeSizeType: data.tradeSizeType,
        leverage: data.leverage,
        leverageType: data.leverageType,
        cutLoss: data.sl.value,
        cutLossType: data.sl.type,
        takeProfit: data.tp.value,
        takeProfitType: data.tp.type,
        orderStyle: data.orderType === "market" ? OrderStyleEnum.market : OrderStyleEnum.limit,
      };
      setCachedSettings(transformed);
      setSettings(transformed);
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    getPerpsBalance({
      exchClient: infoClient!,
      walletAddress: currentWallet?.address ?? "",
    }).then((res) => {
      if (!res) return;
      const total = Number(res.marginSummary.accountValue);
      const available = Number(res.withdrawable || 0);
      setSettings((prev) => ({
        ...prev,
        perpsBalance: total,
        availableBalance: available,
        usedBalance: total - available,
      }));
    });
  }, []);

  const handleSave = async () => {
    try {
      await updateDefaultFollowSettings({
        address: currentWallet?.address ?? "",
        tradeSizeType: settings.tradeSizeType,
        tradeSize: settings.tradeSize,
        leverage: settings.leverage,
        leverageType: settings.leverageType,
        sl: { type: settings.cutLossType, value: settings.cutLoss },
        tp: { type: settings.takeProfitType, value: settings.takeProfit },
        orderType: settings.orderStyle === OrderStyleEnum.market ? "market" : "limit",
      });
      setCachedSettings(settings);
      setHasChanges(false);
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const handleCancel = () => {
    if (cachedSettings) {
      setSettings(cachedSettings);
      setHasChanges(false);
      toast.success("Changes reverted");
    }
  };

  const handleReset = async () => {
    setSettings(DEFAULT_FOLLOW_SETTINGS);
    setHasChanges(true);
    toast.success("Settings reset to default");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-teal-400" size={32} />
      </div>
    );
  }

  return (
    <div>
      {/* Unsaved Changes Banner */}
      {hasChanges && (
        <div
          className="rounded-lg px-3 py-2 flex items-center gap-2 mb-3"
          style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.2)" }}
        >
          <AlertCircle size={12} className="text-orange-400" />
          <span className="text-xs text-orange-300">You have unsaved changes</span>
        </div>
      )}

      {/* Balance Card */}
      <div
        className="rounded-xl px-4 py-3 mb-3 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, rgba(45,212,191,0.08) 0%, rgba(45,212,191,0.02) 100%)",
          border: "1px solid rgba(45,212,191,0.2)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(45,212,191,0.15)" }}
          >
            <Wallet size={14} className="text-teal-400" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400">Current Balance</p>
            <p className="text-base font-bold text-white">
              ${settings.perpsBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-[10px] text-gray-500">Available</p>
            <p className="text-sm font-medium text-gray-300">
              ${settings.availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500">Used</p>
            <p className="text-sm font-medium text-teal-400">
              ${settings.usedBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Position Size Section */}
      <SectionCard icon={TrendingUp} title="Position Size" color="teal">
        <InputRow
          label="Trade Size"
          value={settings.tradeSize}
          onChange={(v) => updateSetting("tradeSize", Number(v) || 0)}
          typeValue={settings.tradeSizeType}
          onTypeChange={(v) => updateSetting("tradeSizeType", v)}
        />

        {/* Leverage — slider + cross/isolated */}
        <div className="mt-2">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs text-gray-500">Leverage</span>
            <Tooltip text={LEVERAGE_TOOLTIP} wide>
              <Info size={14} className="text-gray-500 cursor-help" />
            </Tooltip>
            <span className="text-xs font-semibold ml-auto" style={{ color: "rgba(45,212,191,1)" }}>
              {settings.leverage}x
            </span>
          </div>
          <LeverageSlider
            value={settings.leverage}
            onChange={(v) => updateSetting("leverage", v)}
          />
          {settings.leverage >= 10 && (
            <div
              className="flex items-center gap-2 p-2 rounded-lg mt-1 mb-1"
              style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.2)" }}
            >
              <AlertCircle size={12} className="text-orange-400 flex-shrink-0" />
              <span className="text-[10px] text-orange-300">High leverage increases liquidation risk</span>
            </div>
          )}
          <div className="flex items-center justify-end gap-1 mt-1">
            {(["cross", "isolated"] as LeverageType[]).map((type) => (
              <button
                key={type}
                onClick={() => updateSetting("leverageType", type)}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 capitalize hover:scale-105 active:scale-95 cursor-pointer"
                style={
                  settings.leverageType === type
                    ? { background: "rgba(45,212,191,0.15)", color: "rgba(45,212,191,1)", border: "1px solid rgba(45,212,191,0.4)" }
                    : { background: "transparent", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }
                }
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Risk Controls Section */}
      <SectionCard icon={Shield} title="Risk Controls" color="orange">
        <InputRow
          label="Stop Loss"
          value={settings.cutLoss}
          onChange={(v) => updateSetting("cutLoss", Number(v) || 0)}
          typeValue={settings.cutLossType}
          onTypeChange={(v) => updateSetting("cutLossType", v)}
          color="orange"
        />
        <InputRow
          label="Take Profit"
          value={settings.takeProfit}
          onChange={(v) => updateSetting("takeProfit", Number(v) || 0)}
          typeValue={settings.takeProfitType}
          onTypeChange={(v) => updateSetting("takeProfitType", v)}
          color="orange"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">Max Positions</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateSetting("maxPositions", Math.max(1, settings.maxPositions - 1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 text-sm transition-all duration-200 hover:bg-white/10 active:scale-95 cursor-pointer"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              -
            </button>
            <span className="text-sm font-medium text-white w-6 text-center">{settings.maxPositions}</span>
            <button
              onClick={() => updateSetting("maxPositions", settings.maxPositions + 1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 text-sm transition-all duration-200 hover:bg-white/10 active:scale-95 cursor-pointer"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              +
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Execution Section */}
      <SectionCard icon={Zap} title="Execution" color="purple">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Order Type</span>
          <div className="flex gap-1">
            {[
              { value: OrderStyleEnum.market, label: "market" },
              { value: OrderStyleEnum.limit, label: "limit" },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => updateSetting("orderStyle", type.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 capitalize hover:scale-105 active:scale-95 cursor-pointer"
                style={
                  settings.orderStyle === type.value
                    ? { background: "rgba(168,85,247,0.15)", color: "rgba(168,85,247,1)", border: "1px solid rgba(168,85,247,0.4)" }
                    : { background: "transparent", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }
                }
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <Bell size={12} className="text-gray-500" />
            <span className="text-xs text-gray-400">Notifications</span>
          </div>
          <Toggle enabled={settings.notifications} onToggle={() => updateSetting("notifications", !settings.notifications)} />
        </div>
      </SectionCard>

      {/* Summary */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            {settings.tradeSizeType === "USD" ? `$${settings.tradeSize}` : `${settings.tradeSize}%`} per trade · {settings.leverage}x {settings.leverageType}
            {!summaryExpanded && (
              <button
                onClick={() => setSummaryExpanded(true)}
                className="ml-1 hover:opacity-80 transition-opacity cursor-pointer"
                style={{ color: "rgba(45,212,191,0.5)" }}
              >
                ...more
              </button>
            )}
          </p>
          {summaryExpanded && (
            <button
              onClick={() => setSummaryExpanded(false)}
              className="text-xs hover:opacity-80 transition-opacity cursor-pointer"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              close
            </button>
          )}
        </div>

        {/* Expanded view */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            summaryExpanded ? "max-h-[500px] opacity-100 mt-3 pt-3" : "max-h-0 opacity-0"
          }`}
          style={summaryExpanded ? { borderTop: "1px solid rgba(255,255,255,0.06)" } : {}}
        >
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Trade Size</span>
              <span className="text-gray-300">
                {settings.tradeSizeType === "USD" ? `$${settings.tradeSize}` : `${settings.tradeSize}%`} of your balance per copied trade
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Leverage</span>
              <span className="text-gray-300">
                {settings.leverage}x {settings.leverageType} — position size multiplied by {settings.leverage}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Stop Loss</span>
              <span style={{ color: "rgba(251,146,60,0.8)" }}>
                Auto-closes if loss reaches {settings.cutLossType === "USD" ? `$${settings.cutLoss}` : `${settings.cutLoss}%`}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Take Profit</span>
              <span style={{ color: "rgba(74,222,128,0.8)" }}>
                Auto-closes if profit reaches {settings.takeProfitType === "USD" ? `$${settings.takeProfit}` : `${settings.takeProfit}%`}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Order Type</span>
              <span className="text-gray-300">
                {settings.orderStyle === OrderStyleEnum.market ? "Market — executes immediately" : "Limit — executes at specified price"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Max Positions</span>
              <span className="text-gray-300">Up to {settings.maxPositions} trades open at once</span>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <BottomButtons onCancel={handleCancel} onSave={handleSave} onReset={handleReset} hasChanges={hasChanges} />
    </div>
  );
}