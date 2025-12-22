"use client";

import { useState, useContext, useEffect } from "react";
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
import Search from "@/app/copyTrading/components/search";
import Avatar from "@/app/copyTrading/components/avatar";
import { HyperLiquidContext } from "@/providers/hyperliquid";
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

interface ISpecificTradersSettings {
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

const DEFAULT_SPECIFIC_TRADERS_SETTINGS = {
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

const getInitialSpecificTradersSettings = () => {
  return DEFAULT_SPECIFIC_TRADERS_SETTINGS;
};

const changedRowBorderColor = "rgba(234, 102, 99, 1)";

export default function SpecificTraders({
  searchResult,
  handleSearch,
}: {
  searchResult: {
    id: string;
    name: string;
    color: string;
  }[];
  handleSearch: (value: string) => void;
}) {
  const { infoClient } = useContext(HyperLiquidContext);
  const currentWallet = useCurrentWallet();
  const [searchValue, setSearchValue] = useState("");
  const [cachedSpecificTradersSettings, setCachedSpecificTradersSettings] =
    useState<ISpecificTradersSettings | null>(null);
  const [specificTradersSettings, setSpecificTradersSettings] =
    useState<ISpecificTradersSettings>(getInitialSpecificTradersSettings());

  const [rowChange, setRowChange] = useState({
    tradeSize: false,
    tradeSizeType: false,
    leverage: false,
    leverageType: false,
    cutLoss: false,
    takeProfit: false,
    orderStyle: false,
  });

  const loadSpecificTradersSettings = async () => {
    const data = await fetchDefaultFollowSettings();
    console.log(data);

    // 将 API 返回的数据映射到组件 state 结构
    const transformedData = {
      ...getInitialSpecificTradersSettings(),
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
    console.log("transformedData", transformedData);
    setCachedSpecificTradersSettings(transformedData);
    setSpecificTradersSettings(transformedData);
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
    console.log(">>> call specific traders page data");
    loadSpecificTradersSettings();
    getPerpsBalance({
      exchClient: infoClient!,
      walletAddress: currentWallet?.address ?? "",
    }).then((res) => {
      if (!res) {
        return;
      }
      console.log("res", res);
      setSpecificTradersSettings((prev) => ({
        ...prev,
        perpsBalance: Number(res.marginSummary.accountValue),
      }));
    });
  }, []);

  const handleSave = async (newSettings: ISpecificTradersSettings) => {
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
    setCachedSpecificTradersSettings(newSettings);
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

  return (
    <div className="mt-8">
      <div>
        <div>
          <Search
            placeholder="Search..."
            className="border-1 mb-2"
            style={{
              borderColor: "rgba(27, 36, 41, 1)",
            }}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearchIconClick={() => {
              handleSearch(searchValue);
            }}
            onEnterClick={() => {
              handleSearch(searchValue);
            }}
          />
        </div>
        {searchResult.length > 0 && (
          <div>
            {searchResult.map((item) => (
              <div key={item.id} className="h-[42px] flex items-center px-5">
                <Avatar
                  name={item.name[0].toUpperCase()}
                  backgroundColor={item.color}
                  size={22}
                />
                <p className="flex flex-1 items-center">
                  <span className="ml-2 font-medium text-sm">{item.name}</span>
                  <span
                    className="ml-2 text-xs font-normal"
                    style={{ color: "rgba(165, 176, 176, 1)" }}
                  >
                    @{item.id}
                  </span>
                </p>
                <Button
                  className="w-[28px] h-[22px] p-0 rounded-lg font-medium text-xs border-1"
                  style={{
                    color: "rgba(80, 210, 193, 1)",
                    borderColor: "rgba(80, 210, 193, 1)",
                  }}
                >
                  TP
                </Button>
                <Button
                  className="ml-1 w-[28px] h-[22px] p-0 rounded-lg font-medium text-xs border-1"
                  style={{
                    color: "rgba(80, 210, 193, 1)",
                    borderColor: "rgba(80, 210, 193, 1)",
                  }}
                >
                  SL
                </Button>
                <Button
                  className="ml-1 h-[22px] px-1 rounded-lg font-medium text-xs border-1"
                  style={{
                    color: "rgba(80, 210, 193, 1)",
                    borderColor: "rgba(80, 210, 193, 1)",
                  }}
                >
                  $500
                </Button>
              </div>
            ))}
          </div>
        )}
        <div
          className="w-full h-4"
          style={{
            boxShadow: "0px 1px 0px 0px rgba(27, 36, 41, 1)",
            background:
              "linear-gradient(180deg, rgba(15, 26, 31, 0) 0%, rgba(11, 20, 23, 1) 100%)",
          }}
        />
      </div>

      <div>
        <p className="flex justify-between items-center mt-2">
          <span className="font-semibold text-xl">Filter Types</span>
          <span className="text-sm" style={{ color: "rgba(80, 210, 193, 1)" }}>
            Balance: ${specificTradersSettings?.perpsBalance || "-"}
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
                value={specificTradersSettings?.tradeSize || ""}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (isNaN(value)) {
                    return;
                  }
                  setSpecificTradersSettings((prev) => ({
                    ...prev,
                    tradeSize: value,
                  }));
                  setRowChange((prev) => ({
                    ...prev,
                    tradeSize:
                      value !== Number(cachedSpecificTradersSettings?.tradeSize) ||
                      specificTradersSettings.tradeSizeType !==
                        cachedSpecificTradersSettings?.tradeSizeType,
                  }));
                }}
              />
            </div>
            <Button
              className="w-[34px] h-[34px] rounded-lg font-medium text-sm"
              style={
                specificTradersSettings.tradeSizeType === "USD"
                  ? DOLLAR_OR_PERCENTAGE_STYLE.active
                  : DOLLAR_OR_PERCENTAGE_STYLE.default
              }
              onClick={() => {
                setSpecificTradersSettings((prev) => ({
                  ...prev,
                  tradeSizeType: "USD",
                }));
                setRowChange((prev) => ({
                  ...prev,
                  tradeSize:
                    cachedSpecificTradersSettings?.tradeSizeType !== "USD" ||
                    Number(specificTradersSettings.tradeSize) !==
                      Number(cachedSpecificTradersSettings?.tradeSize),
                }));
              }}
            >
              $
            </Button>
            <Button
              className="w-[34px] h-[34px] rounded-lg font-medium text-sm ml-1"
              style={
                specificTradersSettings.tradeSizeType === "PCT"
                  ? DOLLAR_OR_PERCENTAGE_STYLE.active
                  : DOLLAR_OR_PERCENTAGE_STYLE.default
              }
              onClick={() => {
                setSpecificTradersSettings((prev) => ({
                  ...prev,
                  tradeSizeType: "PCT",
                }));
                setRowChange((prev) => ({
                  ...prev,
                  tradeSize:
                    cachedSpecificTradersSettings?.tradeSizeType !== "PCT" ||
                    Number(specificTradersSettings.tradeSize) !==
                      Number(cachedSpecificTradersSettings?.tradeSize),
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
                specificTradersSettings?.leverage
                  ? `${specificTradersSettings.leverage}x`
                  : ""
              }
              onChange={(e) => {
                const value = Number(e.target.value.replace("x", ""));
                setSpecificTradersSettings((prev) => ({
                  ...prev,
                  leverage: value,
                }));
                setRowChange((prev) => ({
                  ...prev,
                  leverage:
                    value !== Number(cachedSpecificTradersSettings?.leverage),
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
                  specificTradersSettings.leverageType === "cross"
                    ? LEVERAGE_TYPE_STYLE.active
                    : LEVERAGE_TYPE_STYLE.default
                }
                onClick={() => {
                  setSpecificTradersSettings((prev) => ({
                    ...prev,
                    leverageType: "cross",
                  }));
                  setRowChange((prev) => ({
                    ...prev,
                    leverageType:
                      cachedSpecificTradersSettings?.leverageType !== "cross",
                  }));
                }}
              >
                Cross
              </Button>

              <Button
                className="w-[87px] h-[52px] leading-[52px] rounded-[16px] px-6 border-1 ml-2 font-normal text-base"
                style={
                  specificTradersSettings.leverageType === "isolated"
                    ? LEVERAGE_TYPE_STYLE.active
                    : LEVERAGE_TYPE_STYLE.default
                }
                onClick={() => {
                  setSpecificTradersSettings((prev) => ({
                    ...prev,
                    leverageType: "isolated",
                  }));
                  setRowChange((prev) => ({
                    ...prev,
                    leverageType:
                      cachedSpecificTradersSettings?.leverageType !== "isolated",
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
                value={specificTradersSettings?.cutLoss || ""}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (isNaN(value)) {
                    return;
                  }
                  setSpecificTradersSettings((prev) => ({
                    ...prev,
                    cutLoss: value,
                  }));
                  setRowChange((prev) => ({
                    ...prev,
                    cutLoss:
                      value !== Number(cachedSpecificTradersSettings?.cutLoss) ||
                      specificTradersSettings.cutLossType !==
                        cachedSpecificTradersSettings?.cutLossType,
                  }));
                }}
              />
            </div>
            <Button
              className="w-[34px] h-[34px] rounded-lg font-medium text-sm"
              style={
                specificTradersSettings.cutLossType === "USD"
                  ? DOLLAR_OR_PERCENTAGE_STYLE.active
                  : DOLLAR_OR_PERCENTAGE_STYLE.default
              }
              onClick={() => {
                setSpecificTradersSettings((prev) => ({
                  ...prev,
                  cutLossType: "USD",
                }));
                setRowChange((prev) => ({
                  ...prev,
                  cutLoss:
                    cachedSpecificTradersSettings?.cutLossType !== "USD" ||
                    Number(specificTradersSettings.cutLoss) !==
                      Number(cachedSpecificTradersSettings?.cutLoss),
                }));
              }}
            >
              $
            </Button>
            <Button
              className="w-[34px] h-[34px] rounded-lg font-medium text-sm ml-1"
              style={
                specificTradersSettings.cutLossType === "PCT"
                  ? DOLLAR_OR_PERCENTAGE_STYLE.active
                  : DOLLAR_OR_PERCENTAGE_STYLE.default
              }
              onClick={() => {
                setSpecificTradersSettings((prev) => ({
                  ...prev,
                  cutLossType: "PCT",
                }));
                setRowChange((prev) => ({
                  ...prev,
                  cutLoss:
                    cachedSpecificTradersSettings?.cutLossType !== "PCT" ||
                    Number(specificTradersSettings.cutLoss) !==
                      Number(cachedSpecificTradersSettings?.cutLoss),
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
                value={specificTradersSettings?.takeProfit || ""}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (isNaN(value)) {
                    return;
                  }
                  setSpecificTradersSettings((prev) => ({
                    ...prev,
                    takeProfit: value,
                  }));
                  setRowChange((prev) => ({
                    ...prev,
                    takeProfit:
                      value !== Number(cachedSpecificTradersSettings?.takeProfit) ||
                      specificTradersSettings.takeProfitType !==
                        cachedSpecificTradersSettings?.takeProfitType,
                  }));
                }}
              />
            </div>
            <Button
              className="w-[34px] h-[34px] rounded-lg font-medium text-sm"
              style={
                specificTradersSettings.takeProfitType === "USD"
                  ? DOLLAR_OR_PERCENTAGE_STYLE.active
                  : DOLLAR_OR_PERCENTAGE_STYLE.default
              }
              onClick={() => {
                setSpecificTradersSettings((prev) => ({
                  ...prev,
                  takeProfitType: "USD",
                }));
                setRowChange((prev) => ({
                  ...prev,
                  takeProfit:
                    cachedSpecificTradersSettings?.takeProfitType !== "USD" ||
                    Number(specificTradersSettings.takeProfit) !==
                      Number(cachedSpecificTradersSettings?.takeProfit),
                }));
              }}
            >
              $
            </Button>
            <Button
              className="w-[34px] h-[34px] rounded-lg font-medium text-sm ml-1"
              style={
                specificTradersSettings.takeProfitType === "PCT"
                  ? DOLLAR_OR_PERCENTAGE_STYLE.active
                  : DOLLAR_OR_PERCENTAGE_STYLE.default
              }
              onClick={() => {
                setSpecificTradersSettings((prev) => ({
                  ...prev,
                  takeProfitType: "PCT",
                }));
                setRowChange((prev) => ({
                  ...prev,
                  takeProfit:
                    cachedSpecificTradersSettings?.takeProfitType !== "PCT" ||
                    Number(specificTradersSettings.takeProfit) !==
                      Number(cachedSpecificTradersSettings?.takeProfit),
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
                value={specificTradersSettings.orderStyle}
                onValueChange={(value) => {
                  setSpecificTradersSettings((prev) => ({
                    ...prev,
                    orderStyle: value as OrderStyleEnum,
                  }));
                  setRowChange((prev) => ({
                    ...prev,
                    orderStyle: value !== cachedSpecificTradersSettings?.orderStyle,
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
      </div>
      <div className="mt-5">
        <BottomButtons
          onCancel={async () => {
            console.log("cancel");
            const newSettings = cachedSpecificTradersSettings!;
            setSpecificTradersSettings(newSettings);
            setRowChange({
              tradeSize: false,
              tradeSizeType: false,
              leverage: false,
              leverageType: false,
              cutLoss: false,
              takeProfit: false,
              orderStyle: false,
            });
            await handleSave(newSettings);
            toast.success("Settings reverted successfully");
          }}
          onSave={async () => {
            await handleSave(specificTradersSettings);
            toast.success("Settings saved successfully");
          }}
          onReset={async () => {
            console.log("reset");
            const newSettings = getInitialSpecificTradersSettings();
            setSpecificTradersSettings(newSettings);
            setRowChange({
              tradeSize: false,
              tradeSizeType: false,
              leverage: false,
              leverageType: false,
              cutLoss: false,
              takeProfit: false,
              orderStyle: false,
            });
            await handleSave(newSettings);
            toast.success("Settings reset successfully");
          }}
        />
      </div>
    </div>
  );
}
