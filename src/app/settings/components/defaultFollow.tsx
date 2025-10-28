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

type TradeSizeType = "$" | "%";
type LeverageType = "cross" | "isolated";

const DEFAULT_FOLLOW_SETTINGS = {
  perpsBalance: 0,
  tradeSize: 100,
  tradeSizeType: "$" as TradeSizeType,
  leverage: 5,
  leverageType: "cross" as LeverageType,
  cutLoss: 10,
  cutLossType: "%" as TradeSizeType,
  takeProfit: 10,
  takeProfitType: "%" as TradeSizeType,
  orderStyle: "0" as OrderStyleEnum,
};

const getInitialDefaultFollowSettings = () => {
  return DEFAULT_FOLLOW_SETTINGS;
};

export default function DefaultFollow() {
  const { infoClient } = useContext(HyperLiquidContext);
  const currentWallet = useCurrentWallet();
  const [defaultFollowSettings, setDefaultFollowSettings] = useState<{
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
  }>(getInitialDefaultFollowSettings());

  useEffect(() => {
    if (!infoClient || !currentWallet) {
      return;
    }
    getPerpsBalance({
      exchClient: infoClient,
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
  }, [infoClient, currentWallet]);

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
            borderColor: "rgba(27, 36, 41, 1)",
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
                if (isNaN(Number(e.target.value))) {
                  return;
                }
                setDefaultFollowSettings((prev) => ({
                  ...prev,
                  tradeSize: Number(e.target.value),
                }));
              }}
            />
          </div>
          <Button
            className="w-[34px] h-[34px] rounded-lg font-medium text-sm"
            style={
              defaultFollowSettings.tradeSizeType === "$"
                ? DOLLAR_OR_PERCENTAGE_STYLE.active
                : DOLLAR_OR_PERCENTAGE_STYLE.default
            }
            onClick={() => {
              setDefaultFollowSettings((prev) => ({
                ...prev,
                tradeSizeType: "$",
              }));
            }}
          >
            $
          </Button>
          <Button
            className="w-[34px] h-[34px] rounded-lg font-medium text-sm ml-1"
            style={
              defaultFollowSettings.tradeSizeType === "%"
                ? DOLLAR_OR_PERCENTAGE_STYLE.active
                : DOLLAR_OR_PERCENTAGE_STYLE.default
            }
            onClick={() => {
              setDefaultFollowSettings((prev) => ({
                ...prev,
                tradeSizeType: "%",
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
            borderColor: "rgba(27, 36, 41, 1)",
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
              setDefaultFollowSettings((prev) => ({
                ...prev,
                leverage: Number(e.target.value.replace("x", "")),
              }));
            }}
          />
        </div>
        {/* leverage type */}
        <div className="mt-2 flex h-[52px] leading-[52px] pl-4">
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
            }}
          >
            Isolated
          </Button>
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
            borderColor: "rgba(27, 36, 41, 1)",
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
                if (isNaN(Number(e.target.value))) {
                  return;
                }
                setDefaultFollowSettings((prev) => ({
                  ...prev,
                  cutLoss: Number(e.target.value),
                }));
              }}
            />
          </div>
          <Button
            className="w-[34px] h-[34px] rounded-lg font-medium text-sm"
            style={
              defaultFollowSettings.cutLossType === "$"
                ? DOLLAR_OR_PERCENTAGE_STYLE.active
                : DOLLAR_OR_PERCENTAGE_STYLE.default
            }
            onClick={() => {
              setDefaultFollowSettings((prev) => ({
                ...prev,
                cutLossType: "$",
              }));
            }}
          >
            $
          </Button>
          <Button
            className="w-[34px] h-[34px] rounded-lg font-medium text-sm ml-1"
            style={
              defaultFollowSettings.cutLossType === "%"
                ? DOLLAR_OR_PERCENTAGE_STYLE.active
                : DOLLAR_OR_PERCENTAGE_STYLE.default
            }
            onClick={() => {
              setDefaultFollowSettings((prev) => ({
                ...prev,
                cutLossType: "%",
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
            borderColor: "rgba(27, 36, 41, 1)",
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
                if (isNaN(Number(e.target.value))) {
                  return;
                }
                setDefaultFollowSettings((prev) => ({
                  ...prev,
                  takeProfit: Number(e.target.value),
                }));
              }}
            />
          </div>
          <Button
            className="w-[34px] h-[34px] rounded-lg font-medium text-sm"
            style={
              defaultFollowSettings.takeProfitType === "$"
                ? DOLLAR_OR_PERCENTAGE_STYLE.active
                : DOLLAR_OR_PERCENTAGE_STYLE.default
            }
            onClick={() => {
              setDefaultFollowSettings((prev) => ({
                ...prev,
                takeProfitType: "$",
              }));
            }}
          >
            $
          </Button>
          <Button
            className="w-[34px] h-[34px] rounded-lg font-medium text-sm ml-1"
            style={
              defaultFollowSettings.takeProfitType === "%"
                ? DOLLAR_OR_PERCENTAGE_STYLE.active
                : DOLLAR_OR_PERCENTAGE_STYLE.default
            }
            onClick={() => {
              setDefaultFollowSettings((prev) => ({
                ...prev,
                takeProfitType: "%",
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
            borderColor: "rgba(27, 36, 41, 1)",
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
          onCancel={() => {
            console.log("cancel");
          }}
          onSave={() => {
            console.log("save");
            alert(`save config: ${JSON.stringify(defaultFollowSettings)}`);
          }}
          onReset={() => {
            setDefaultFollowSettings(getInitialDefaultFollowSettings());
          }}
        />
      </div>
    </div>
  );
}
