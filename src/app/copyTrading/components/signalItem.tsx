"use client";

import Image from "next/image";
import bullishIcon from "@/assets/icons/bullish.png";
import bearishIcon from "@/assets/icons/bearish.png";
import commentIcon from "@/assets/icons/comment.png";
import retweetIcon from "@/assets/icons/retweet.png";
import likeIcon from "@/assets/icons/like.png";
import { UserSignalItem } from "@/service";
import { numberToPercentageString } from "@/lib/number";
import counterTradeIcon from "@/assets/icons/counter-trade-tip.png";
import copyTradeIcon from "@/assets/icons/copy-trade-tip.png";
import { HyperLiquidContext } from "@/providers/hyperliquid";
import { useContext, useState } from "react";
import BigNumber from "bignumber.js";
import { placeOrder } from "@/helpers/hyperliquid";

const SIDE_MAP: {
  [key: string]: "long" | "short";
} = {
  bullish: "long",
  bearish: "short",
};

export default function SignalItem({
  data,
  onClick,
  currentClickItemId,
}: {
  data: UserSignalItem;
  onClick: (signalId: number) => void;
  currentClickItemId: number | null;
}) {
  const { tradingEnabled, placeOrderAssets, exchClient, infoClient } =
    useContext(HyperLiquidContext);
  const [itemHoverStyle, setItemHoverStyle] = useState({});
  const [counterTradeButtonHoverStyle, setCounterTradeButtonHoverStyle] =
    useState({});
  const [copyTradeButtonHoverStyle, setCopyTradeButtonHoverStyle] = useState(
    {}
  );

  const handleTrade = async (side: "copy" | "counter") => {
    const symbol = data?.ticker.replaceAll("USDT", "");
    const tradeSide =
      SIDE_MAP[
        side === "copy"
          ? data.bull_or_bear
          : data.bull_or_bear === "bearish"
          ? "bullish"
          : "bearish"
      ];
    const realtimeOrderbook = await infoClient!.l2Book({
      coin: symbol,
      // nSigFigs: 2,
    });
    const { levels } = realtimeOrderbook;
    const [bids, asks] = levels || [];
    const orderPrice = tradeSide === "long" ? bids[0].px : asks[0].px;
    console.log("orderPrice", orderPrice);
    const placeOrderAssetId = placeOrderAssets[symbol.toUpperCase()];
    const orderParams = {
      side: tradeSide,
      price: orderPrice,
      size: 0.1,
      coin: placeOrderAssetId,
      leverage: 1,
    };

    const mockPrice =
      tradeSide === "long"
        ? bids[bids.length - 1].px
        : asks[asks.length - 1].px;
    const mockSize = new BigNumber(20)
      .dividedBy(mockPrice)
      .precision(1)
      .toNumber();
    const mockOrderParams = {
      ...orderParams,
      price: mockPrice,
      size: mockSize,
    };
    const res = confirm(
      `Order confirm: ${JSON.stringify(
        orderParams
      )}. \n⚠️ For testing, will place order with mock order params: ${JSON.stringify(
        mockOrderParams
      )}`
    );
    if (!(res && exchClient)) {
      return;
    }
    console.log("orderParams", orderParams);
    console.log("mockOrderParams", mockOrderParams);
    await placeOrder({
      exchClient,
      orderParams: mockOrderParams,
    });
  };

  return (
    <div
      className="rounded-[20px] p-4 mt-2"
      style={{
        background: "linear-gradient(0deg, #26424B, #26424B)",
        ...itemHoverStyle,
      }}
      onClick={() => onClick(data.signal_id)}
      onMouseEnter={() =>
        setItemHoverStyle({
          border: "1px solid rgba(43, 234, 223, 1)",
        })
      }
      onMouseLeave={() =>
        setItemHoverStyle({
          border: "none",
        })
      }
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className="mr-1 text-base font-normal">{data.updateTime}</span>
          {data.bull_or_bear === "bullish" ? (
            <Image src={bullishIcon} alt="bullish" height={16} />
          ) : (
            <Image src={bearishIcon} alt="bearish" height={16} />
          )}
        </div>
        {/* <Image
          src={dotsMoreIcon}
          alt="dots-more"
          className="w-[17px] h-[4px]"
        /> */}
      </div>
      <div className="mt-2">
        <p>{data?.content || ""}</p>
        <span
          className=""
          style={{
            color: "rgba(43, 234, 223, 1)",
          }}
        >
          See More...
        </span>
      </div>
      <div className="mt-6 flex justify-between">
        <div className="flex">
          <div className="flex items-center">
            <Image src={commentIcon} alt="comment" height={16} />
            <span className="ml-1">
              {data?.commentsCount >= 0 ? data.commentsCount : "-"}
            </span>
          </div>
          <div className="flex items-center ml-4">
            <Image src={retweetIcon} alt="retweet" height={16} />
            <span className="ml-1">
              {data?.retweetsCount >= 0 ? data.retweetsCount : "-"}
            </span>
          </div>
          <div className="flex items-center ml-4">
            <Image src={likeIcon} alt="like" height={16} />
            <span className="ml-1">
              {data?.likesCount >= 0 ? data.likesCount : "-"}
            </span>
          </div>
        </div>
        <div className="flex">
          <span
            className="px-1 rounded-[6px] font-medium text-xs"
            style={{
              backgroundColor: "rgba(43, 234, 223, 1)",
              color: "rgba(14, 26, 30, 1)",
              lineHeight: "24px",
            }}
          >
            ${data?.ticker || "-"}
          </span>
          <span
            className="px-1 ml-1 rounded-[6px] font-medium text-xs"
            style={{
              backgroundColor: "rgba(38, 211, 159, 1)",
              color: "rgba(14, 26, 30, 1)",
              lineHeight: "24px",
            }}
          >
            {numberToPercentageString(data?.change_since_tweet || 0)}
          </span>
        </div>
      </div>

      {tradingEnabled && currentClickItemId === data.signal_id && (
        <div
          className="mt-6 pt-2 border-t-[1px] flex items-center"
          style={{
            borderTopColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            className="flex flex-1 items-center justify-center h-[18px] font-normal text-sm h-[36px]"
            onClick={() => handleTrade("copy")}
          >
            <div
              className="flex items-center h-full px-6 rounded-[10px]"
              style={{
                ...counterTradeButtonHoverStyle,
              }}
              onMouseEnter={() =>
                setCounterTradeButtonHoverStyle({
                  color: "rgba(14, 26, 30, 1)",
                  backgroundColor: "rgba(43, 234, 223, 1)",
                })
              }
              onMouseLeave={() => setCounterTradeButtonHoverStyle({})}
            >
              Counter Trade
              <Image
                src={counterTradeIcon}
                alt="counter-trade"
                className="ml-2"
                width={12}
                height={12}
              />
            </div>
          </div>
          <p
            className="h-[18px] w-[1px]"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            }}
          />
          <div
            className="flex flex-1 items-center justify-center h-[18px] font-normal text-sm h-[36px]"
            onClick={() => handleTrade("counter")}
          >
            <div
              className="flex items-center h-full px-6 rounded-[10px]"
              style={{
                ...copyTradeButtonHoverStyle,
              }}
              onMouseEnter={() =>
                setCopyTradeButtonHoverStyle({
                  color: "rgba(14, 26, 30, 1)",
                  backgroundColor: "rgba(43, 234, 223, 1)",
                })
              }
              onMouseLeave={() => setCopyTradeButtonHoverStyle({})}
            >
              Copy Trade
              <Image
                src={copyTradeIcon}
                alt="copy-trade"
                className="ml-2"
                width={12}
                height={12}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
