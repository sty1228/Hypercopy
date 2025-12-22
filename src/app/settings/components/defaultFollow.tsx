"use client";

import Image from "next/image";
import Divider from "@/components/divider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import infoIcon from "@/assets/icons/info.png";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderStyleEnum } from "../page";
import { HyperLiquidContext } from "@/providers/hyperliquid";
import { useContext, useEffect, useState } from "react";
import { useCurrentWallet } from "@/hooks/usePrivyData";
import { getPerpsBalance } from "@/helpers/hyperliquid";
import BottomButtons from "./bottomButtons";
import { toast } from "sonner";
import {
  getDefaultFollowSettings as fetchDefaultFollowSettings,
  LeverageType,
  TradeSizeType,
  updateDefaultFollowSettings,
} from "@/service";

const DOLLAR_OR_PERCENTAGE_STYLE = {
  default: {
    borderWidth: "1px",
    borderColor: "rgba(80, 210, 193, 1)",
    color: "rgba(128, 236, 184, 1)",
  },
  active: {
    backgroundColor: "rgba(80, 210, 193, 1)",
    color: "rgba(15, 26, 31, 1)",
  },
};

const LEVERAGE_TYPE_STYLE = {
  default: {
    color: "rgba(255, 255, 255, 0.4)",
    borderColor: "rgba(27, 36, 41, 1)",
    backgroundColor: "rgba(13, 23, 28, 1)",
  },
  active: {
    color: "rgba(80, 210, 193, 1)",
    borderColor: "rgba(80, 210, 193, 1)",
    backgroundColor: "rgba(13, 23, 28, 1)",
  },
};

interface IDefaultFollowSettings {
  perpsBalance: number;
  tradeSize: number;
  tradeSizeType: TradeSizeType;
  leverage: number;
  leverageType: LeverageType;
  cutLoss: number;
  cutLossType: TradeSizeType;
  takeProfit: number;
  takeProfitType: TradeSizeType;
  orderStyle: OrderStyleEnum;
}

const DEFAULT_FOLLOW_SETTINGS = {
  perpsBalance: 0,
  tradeSize: 100,
  tradeSizeType: "USD" as TradeSizeType,
  leverage: 5,
  leverageType: "cross" as LeverageType,
  cutLoss: 10,
  cutLossType: "USD" as TradeSizeType,
  takeProfit: 10,
  takeProfitType: "USD" as TradeSizeType,
  orderStyle: "0" as OrderStyleEnum,
};

const getInitialDefaultFollowSettings = () => {
  return DEFAULT_FOLLOW_SETTINGS;
};

const changedRowBorderColor = "rgba(234, 102, 99, 1)";

export default function DefaultFollow() {
  const { infoClient } = useContext(HyperLiquidContext);
  const currentWallet = useCurrentWallet();
  const [cachedDefaultFollowSettings, setCachedDefaultFollowSettings] =
    useState<IDefaultFollowSettings | null>(null);
  const [defaultFollowSettings, setDefaultFollowSettings] =
    useState<IDefaultFollowSettings>(getInitialDefaultFollowSettings());

  const [rowChange, setRowChange] = useState({
    tradeSize: false,
    tradeSizeType: false,
    leverage: false,
    leverageType: false,
    cutLoss: false,
    takeProfit: false,
    orderStyle: false,
  });

  const loadDefaultFollowSettings = async () => {
    const data = await fetchDefaultFollowSettings();
    console.log(data);

    // 将 API 返回的数据映射到组件 state 结构
    const transformedData = {
      ...defaultFollowSettings,
      tradeSize: data.tradeSize,
      tradeSizeType: data.tradeSizeType,
      leverage: data.leverage,
      leverageType: data.leverageType,
      cutLoss: data.sl.value,
      cutLossType: data.sl.type,
      takeProfit: data.tp.value,
      takeProfitType: data.tp.type,
      orderStyle:
        data.orderType === "market"
          ? OrderStyleEnum.market
          : OrderStyleEnum.limit,
    };
    setCachedDefaultFollowSettings(transformedData);
    setDefaultFollowSettings(transformedData);
    setRowChange({
      tradeSize: false,
      tradeSizeType: false,
      leverage: false,
      leverageType: false,
      cutLoss: false,
      takeProfit: false,
      orderStyle: false,
    });
  };

  useEffect(() => {
    console.log(">>> call page data");
    loadDefaultFollowSettings();
    getPerpsBalance({
      exchClient: infoClient!,
      walletAddress: currentWallet?.address ?? "",
    }).then((res) => {
      if (!res) {
        return;
      }
      console.log("res", res);
      setDefaultFollowSettings((prev) => ({
        ...prev,
        perpsBalance: Number(res.marginSummary.accountValue),
      }));
    });
  }, []);

  const handleSave = async (newSettings: IDefaultFollowSettings) => {
    console.log("newSettings", newSettings);
    await updateDefaultFollowSettings({
      address: currentWallet?.address ?? "",
      tradeSizeType: newSettings.tradeSizeType,
      tradeSize: newSettings.tradeSize,
      leverage: newSettings.leverage,
      leverageType: newSettings.leverageType,
      sl: {
        type: newSettings.cutLossType,
        value: newSettings.cutLoss,
      },
      tp: {
        type: newSettings.takeProfitType,
        value: newSettings.takeProfit,
      },
      orderType:
        newSettings.orderStyle === OrderStyleEnum.market ? "market" : "limit",
    }).catch(() => {
      toast.error("Failed to save settings");
      throw new Error("Failed to save settings");
    });
    setCachedDefaultFollowSettings(newSettings);
  };

  return (
    <div>
      <p className="flex justify-between items-center">
        <span className="font-semibold text-xl">Filter Types</span>
        <span className="text-sm" style={{ color: "rgba(80, 210, 193, 1)" }}>
          Balance: ${defaultFollowSettings?.perpsBalance || "-"}
        </span>
      </p>
      <p className="mt-5 mb-2">
        <Divider />
      </p>
      {/* Risk management */}
      <div>
        <p className="font-semibold text-base">Risk management</p>
        <div
          className="mt-2 rounded-[16px] w-full h-[52px] flex items-center pr-2"
          style={{
            backgroundColor: "rgba(13, 23, 28, 1)",
            borderWidth: "1px",
            borderColor: rowChange.tradeSize
              ? changedRowBorderColor
              : "rgba(27, 36, 41, 1)",
          }}
        >
          <div className="relative flex items-center w-full mr-4">
            <Label
              htmlFor="tradeSize"
              className="absolute left-4 text-sm text-muted-foreground pointer-events-none font-normal text-base"
            >
              Trade Sizing
            </Label>
            <Input
              id="tradeSize"
              name="tradeSize"
              className="h-[34px] pl-[100px] text-right border-none font-normal text-base"
              placeholder=""
              value={defaultFollowSettings?.tradeSize || ""}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (isNaN(value)) {
                  return;
                }
                setDefaultFollowSettings((prev) => ({
                  ...prev,
                  tradeSize: value,
                }));
                setRowChange((prev) => ({
                  ...prev,
                  tradeSize:
                    value !== Number(cachedDefaultFollowSettings?.tradeSize) ||
                    defaultFollowSettings.tradeSizeType !==
                      cachedDefaultFollowSettings?.tradeSizeType,
                }));
              }}
            />
          </div>
          <Button
            className="w-[34px] h-[34px] rounded-lg font-medium text-sm"
            style={
              defaultFollowSettings.tradeSizeType === "USD"
                ? DOLLAR_OR_PERCENTAGE_STYLE.active
                : DOLLAR_OR_PERCENTAGE_STYLE.default
            }
            onClick={() => {
              setDefaultFollowSettings((prev) => ({
                ...prev,
                tradeSizeType: "USD",
              }));
              setRowChange((prev) => ({
                ...prev,
                tradeSize:
                  cachedDefaultFollowSettings?.tradeSizeType !== "USD" ||
                  Number(defaultFollowSettings.tradeSize) !==
                    Number(cachedDefaultFollowSettings?.tradeSize),
              }));
            }}
          >
            $
          </Button>
          <Button
            className="w-[34px] h-[34px] rounded-lg font-medium text-sm ml-1"
            style={
              defaultFollowSettings.tradeSizeType === "PCT"
                ? DOLLAR_OR_PERCENTAGE_STYLE.active
                : DOLLAR_OR_PERCENTAGE_STYLE.default
            }
            onClick={() => {
              setDefaultFollowSettings((prev) => ({
                ...prev,
                tradeSizeType: "PCT",
              }));
              setRowChange((prev) => ({
                ...prev,
                tradeSize:
                  cachedDefaultFollowSettings?.tradeSizeType !== "PCT" ||
                  Number(defaultFollowSettings.tradeSize) !==
                    Number(cachedDefaultFollowSettings?.tradeSize),
              }));
            }}
          >
            %
          </Button>
        </div>
        {/* leverage */}
        <div
          className="mt-2 rounded-[16px] w-full h-[52px] flex items-center relative"
          style={{
            backgroundColor: "rgba(13, 23, 28, 1)",
            borderWidth: "1px",
            borderColor: rowChange.leverage
              ? changedRowBorderColor
              : "rgba(27, 36, 41, 1)",
          }}
        >
          <Label
            htmlFor="leverage"
            className="absolute left-4 text-sm text-muted-foreground pointer-events-none font-normal text-base"
          >
            Leverage
          </Label>
          <Input
            id="leverage"
            name="leverage"
            className="h-full pl-[100px] text-right border-none font-normal text-base"
            placeholder=""
            value={
              defaultFollowSettings?.leverage
                ? `${defaultFollowSettings.leverage}x`
                : ""
            }
            onChange={(e) => {
              const value = Number(e.target.value.replace("x", ""));
              setDefaultFollowSettings((prev) => ({
                ...prev,
                leverage: value,
              }));
              setRowChange((prev) => ({
                ...prev,
                leverage:
                  value !== Number(cachedDefaultFollowSettings?.leverage),
              }));
            }}
          />
        </div>
        {/* leverage type */}
        <div
          className="mt-2 rounded-[16px]"
          style={{
            borderWidth: "1px",
            borderColor: rowChange.leverageType
              ? changedRowBorderColor
              : "transparent",
            padding: rowChange.leverageType ? "4px" : "0",
          }}
        >
          <div className="flex h-[52px] leading-[52px] pl-4 rounded-[16px]">
            <span
              className="flex-1 leading-[52px] font-normal text-base"
              style={{ color: "rgba(148, 158, 156, 1)" }}
            >
              Leverage Type
            </span>
            <Button
              className="w-[87px] h-[52px] leading-[52px] rounded-[16px] px-6 border-1 font-normal text-base"
              style={
                defaultFollowSettings.leverageType === "cross"
                  ? LEVERAGE_TYPE_STYLE.active
                  : LEVERAGE_TYPE_STYLE.default
              }
              onClick={() => {
                setDefaultFollowSettings((prev) => ({
                  ...prev,
                  leverageType: "cross",
                }));
                setRowChange((prev) => ({
                  ...prev,
                  leverageType:
                    cachedDefaultFollowSettings?.leverageType !== "cross",
                }));
              }}
            >
              Cross
            </Button>

            <Button
              className="w-[87px] h-[52px] leading-[52px] rounded-[16px] px-6 border-1 ml-2 font-normal text-base"
              style={
                defaultFollowSettings.leverageType === "isolated"
                  ? LEVERAGE_TYPE_STYLE.active
                  : LEVERAGE_TYPE_STYLE.default
              }
              onClick={() => {
                setDefaultFollowSettings((prev) => ({
                  ...prev,
                  leverageType: "isolated",
                }));
                setRowChange((prev) => ({
                  ...prev,
                  leverageType:
                    cachedDefaultFollowSettings?.leverageType !== "isolated",
                }));
              }}
            >
              Isolated
            </Button>
          </div>
        </div>
      </div>
      {/* Automatically Close Trades */}
      <div className="mt-5">
        <p className="flex items-center">
          <span className="font-semibold text-base">
            Automatically Close Trades
          </span>
          <Image
            src={infoIcon}
            alt="info"
            width={16}
            height={16}
            className="ml-2"
          />
        </p>
        <div
          className="mt-2 rounded-[16px] w-full h-[52px] flex items-center pr-2"
          style={{
            backgroundColor: "rgba(13, 23, 28, 1)",
            borderWidth: "1px",
            borderColor: rowChange.cutLoss
              ? changedRowBorderColor
              : "rgba(27, 36, 41, 1)",
          }}
        >
          <div className="relative flex items-center w-full mr-4">
            <Label
              htmlFor="cutLoss"
              className="absolute left-4 text-sm text-muted-foreground pointer-events-none font-normal text-base"
            >
              Cut Loss
            </Label>
            <Input
              id="cutLoss"
              name="cutLoss"
              className="h-[34px] pl-[100px] text-right border-none font-normal text-base"
              placeholder=""
              value={defaultFollowSettings?.cutLoss || ""}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (isNaN(value)) {
                  return;
                }
                setDefaultFollowSettings((prev) => ({
                  ...prev,
                  cutLoss: value,
                }));
                setRowChange((prev) => ({
                  ...prev,
                  cutLoss:
                    value !== Number(cachedDefaultFollowSettings?.cutLoss) ||
                    defaultFollowSettings.cutLossType !==
                      cachedDefaultFollowSettings?.cutLossType,
                }));
              }}
            />
          </div>
          <Button
            className="w-[34px] h-[34px] rounded-lg font-medium text-sm"
            style={
              defaultFollowSettings.cutLossType === "USD"
                ? DOLLAR_OR_PERCENTAGE_STYLE.active
                : DOLLAR_OR_PERCENTAGE_STYLE.default
            }
            onClick={() => {
              setDefaultFollowSettings((prev) => ({
                ...prev,
                cutLossType: "USD",
              }));
              setRowChange((prev) => ({
                ...prev,
                cutLoss:
                  cachedDefaultFollowSettings?.cutLossType !== "USD" ||
                  Number(defaultFollowSettings.cutLoss) !==
                    Number(cachedDefaultFollowSettings?.cutLoss),
              }));
            }}
          >
            $
          </Button>
          <Button
            className="w-[34px] h-[34px] rounded-lg font-medium text-sm ml-1"
            style={
              defaultFollowSettings.cutLossType === "PCT"
                ? DOLLAR_OR_PERCENTAGE_STYLE.active
                : DOLLAR_OR_PERCENTAGE_STYLE.default
            }
            onClick={() => {
              setDefaultFollowSettings((prev) => ({
                ...prev,
                cutLossType: "PCT",
              }));
              setRowChange((prev) => ({
                ...prev,
                cutLoss:
                  cachedDefaultFollowSettings?.cutLossType !== "PCT" ||
                  Number(defaultFollowSettings.cutLoss) !==
                    Number(cachedDefaultFollowSettings?.cutLoss),
              }));
            }}
          >
            %
          </Button>
        </div>
        <div
          className="mt-2 rounded-[16px] w-full h-[52px] flex items-center pr-2"
          style={{
            backgroundColor: "rgba(13, 23, 28, 1)",
            borderWidth: "1px",
            borderColor: rowChange.takeProfit
              ? changedRowBorderColor
              : "rgba(27, 36, 41, 1)",
          }}
        >
          <div className="relative flex items-center w-full mr-4">
            <Label
              htmlFor="takeProfit"
              className="absolute left-4 text-sm text-muted-foreground pointer-events-none font-normal text-base"
            >
              Take Profit
            </Label>
            <Input
              id="takeProfit"
              name="takeProfit"
              className="h-[34px] pl-[100px] text-right border-none font-normal text-base"
              placeholder=""
              value={defaultFollowSettings?.takeProfit || ""}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (isNaN(value)) {
                  return;
                }
                setDefaultFollowSettings((prev) => ({
                  ...prev,
                  takeProfit: value,
                }));
                setRowChange((prev) => ({
                  ...prev,
                  takeProfit:
                    value !== Number(cachedDefaultFollowSettings?.takeProfit) ||
                    defaultFollowSettings.takeProfitType !==
                      cachedDefaultFollowSettings?.takeProfitType,
                }));
              }}
            />
          </div>
          <Button
            className="w-[34px] h-[34px] rounded-lg font-medium text-sm"
            style={
              defaultFollowSettings.takeProfitType === "USD"
                ? DOLLAR_OR_PERCENTAGE_STYLE.active
                : DOLLAR_OR_PERCENTAGE_STYLE.default
            }
            onClick={() => {
              setDefaultFollowSettings((prev) => ({
                ...prev,
                takeProfitType: "USD",
              }));
              setRowChange((prev) => ({
                ...prev,
                takeProfit:
                  cachedDefaultFollowSettings?.takeProfitType !== "USD" ||
                  Number(defaultFollowSettings.takeProfit) !==
                    Number(cachedDefaultFollowSettings?.takeProfit),
              }));
            }}
          >
            $
          </Button>
          <Button
            className="w-[34px] h-[34px] rounded-lg font-medium text-sm ml-1"
            style={
              defaultFollowSettings.takeProfitType === "PCT"
                ? DOLLAR_OR_PERCENTAGE_STYLE.active
                : DOLLAR_OR_PERCENTAGE_STYLE.default
            }
            onClick={() => {
              setDefaultFollowSettings((prev) => ({
                ...prev,
                takeProfitType: "PCT",
              }));
              setRowChange((prev) => ({
                ...prev,
                takeProfit:
                  cachedDefaultFollowSettings?.takeProfitType !== "PCT" ||
                  Number(defaultFollowSettings.takeProfit) !==
                    Number(cachedDefaultFollowSettings?.takeProfit),
              }));
            }}
          >
            %
          </Button>
        </div>
      </div>
      {/* Execution */}
      <div className="mt-5">
        <p className="font-semibold text-base">Execution</p>
        <div
          className="mt-2 rounded-[16px] w-full h-[52px] flex items-center"
          style={{
            backgroundColor: "rgba(13, 23, 28, 1)",
            borderWidth: "1px",
            borderColor: rowChange.orderStyle
              ? changedRowBorderColor
              : "rgba(27, 36, 41, 1)",
          }}
        >
          <div className="relative flex items-center w-full">
            <Label
              htmlFor="orderStyle"
              className="absolute left-4 text-sm text-muted-foreground pointer-events-none font-normal text-base"
            >
              Order Style
            </Label>
            <Select
              value={defaultFollowSettings.orderStyle}
              onValueChange={(value) => {
                setDefaultFollowSettings((prev) => ({
                  ...prev,
                  orderStyle: value as OrderStyleEnum,
                }));
                setRowChange((prev) => ({
                  ...prev,
                  orderStyle: value !== cachedDefaultFollowSettings?.orderStyle,
                }));
              }}
            >
              <SelectTrigger className="w-full border-none font-normal text-base pl-[100px] pr-0 justify-end pr-2">
                <SelectValue placeholder="" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={OrderStyleEnum.market}>
                    Market Order
                  </SelectItem>
                  <SelectItem value={OrderStyleEnum.limit}>
                    Limit Order
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {/* Summary */}
      <div
        className="mt-5 rounded-[16px] w-full p-4"
        style={{
          backgroundColor: "rgba(13, 23, 28, 1)",
          borderWidth: "1px",
          borderColor: "rgba(27, 36, 41, 1)",
        }}
      >
        <p
          className="font-normal text-base"
          style={{ color: "rgba(148, 158, 156, 1)" }}
        >
          Summary
        </p>
        <p className="font-normal text-xs mt-2">
          You will be taking $500 market order positions on 5x leverage,
          isolated to each position on your $5000
        </p>
        <p
          className="font-medium text-xs"
          style={{ color: "rgba(80, 210, 193, 1)" }}
        >
          read more...
        </p>
      </div>
      <div className="mt-5">
        <BottomButtons
          onCancel={async () => {
            console.log("cancel");
            const newSettings = cachedDefaultFollowSettings!;
            setDefaultFollowSettings(newSettings);
            await handleSave(newSettings);
            toast.success("Settings reverted successfully");
          }}
          onSave={async () => {
            await handleSave(defaultFollowSettings);
            toast.success("Settings saved successfully");
          }}
          onReset={async () => {
            console.log("reset");
            const newSettings = getInitialDefaultFollowSettings();
            setDefaultFollowSettings(newSettings);
            await handleSave(newSettings);
            toast.success("Settings reset successfully");
          }}
        />
      </div>
    </div>
  );
}
