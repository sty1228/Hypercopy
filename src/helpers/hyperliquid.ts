import * as hl from "@nktkas/hyperliquid";
import { toast } from "sonner";

export enum OrderGrouping {
  NormalTpsl = "normalTpsl",
  PositionTpsl = "positionTpsl",
}

export interface OrderParams {
  side: "long" | "short";
  price: number | string;
  size: number | string;
  coin: number;
  leverage: number;
  /**
   * Take profit configuration
   * - `price`: Trigger price for take profit
   * - `grouping`: Order grouping strategy
   *   - `"normalTpsl"`: TP/SL order with fixed size that doesn't adjust with position changes
   *   - `"positionTpsl"`: TP/SL order that adjusts proportionally with the position size
   */
  takeProfit?: {
    price: number | string;
    grouping?: OrderGrouping;
  };
  /**
   * Stop loss configuration
   * - `price`: Trigger price for stop loss
   * - `grouping`: Order grouping strategy
   *   - `"normalTpsl"`: TP/SL order with fixed size that doesn't adjust with position changes
   *   - `"positionTpsl"`: TP/SL order that adjusts proportionally with the position size
   */
  stopLoss?: {
    price: number | string;
    grouping?: OrderGrouping;
  };
}

// order placing, send with agent wallet, use exchClient
const placeOrder = async ({
  exchClient,
  orderParams,
}: {
  exchClient: hl.ExchangeClient;
  orderParams: OrderParams;
}) => {
  if (!exchClient) {
    return;
  }
  if (
    !process.env.NEXT_PUBLIC_HL_BUILDER_ADDRESS ||
    !process.env.NEXT_PUBLIC_HL_DEFAULT_BUILDER_BPS
  ) {
    toast.error("Builder fee config is not set");
    return;
  }
  console.log("placeOrder: ", orderParams);

  // 构建订单列表
  const orders: Array<
    | {
        a: number;
        b: boolean;
        p: number | string;
        s: number | string;
        r: boolean;
        t: {
          limit: {
            tif: "Gtc" | "Ioc" | "Alo" | "FrontendMarket" | "LiquidationMarket";
          };
        };
      }
    | {
        a: number;
        b: boolean;
        p: number | string;
        s: number | string;
        r: boolean;
        t: {
          trigger: {
            isMarket: boolean;
            triggerPx: number | string;
            tpsl: "tp" | "sl";
          };
        };
      }
  > = [
    // 主订单（开仓订单）
    {
      a: orderParams.coin,
      b: orderParams.side === "long",
      p: orderParams.price,
      s: orderParams.size,
      r: false,
      t: {
        limit: {
          tif: "Gtc",
        },
      },
    },
  ];

  // 添加止盈订单
  if (orderParams.takeProfit) {
    orders.push({
      a: orderParams.coin,
      // 对于止盈止损单，b 必须为 false
      b: false,
      p: orderParams.takeProfit.price,
      s: orderParams.size, // TP/SL 订单的大小通常与主订单相同
      r: true, // TP/SL 订单通常是 reduce-only
      t: {
        trigger: {
          isMarket: true, // TP/SL 通常使用市价单
          triggerPx: orderParams.takeProfit.price,
          tpsl: "tp",
        },
      },
    });
  }

  // 添加止损订单
  if (orderParams.stopLoss) {
    orders.push({
      a: orderParams.coin,
      // 对于止盈止损单，b 必须为 false
      b: false,
      p: orderParams.stopLoss.price,
      s: orderParams.size, // TP/SL 订单的大小通常与主订单相同
      r: true, // TP/SL 订单通常是 reduce-only
      t: {
        trigger: {
          isMarket: true, // TP/SL 通常使用市价单
          triggerPx: orderParams.stopLoss.price,
          tpsl: "sl",
        },
      },
    });
  }

  // 确定 grouping 策略
  // 如果有 TP/SL 订单，使用第一个 TP/SL 订单的 grouping，否则使用 "na"
  const grouping: OrderGrouping =
    orderParams.takeProfit || orderParams.stopLoss
      ? orderParams.takeProfit?.grouping ||
        orderParams.stopLoss?.grouping ||
        OrderGrouping.NormalTpsl
      : OrderGrouping.NormalTpsl;

  console.log({
    orders,
    grouping,
    builder: {
      b: process.env.NEXT_PUBLIC_HL_BUILDER_ADDRESS!,
      f: process.env.NEXT_PUBLIC_HL_DEFAULT_BUILDER_BPS!,
    },
  });
  const result = await exchClient
    .order({
      orders,
      grouping,
      builder: {
        b: process.env.NEXT_PUBLIC_HL_BUILDER_ADDRESS!,
        f: process.env.NEXT_PUBLIC_HL_DEFAULT_BUILDER_BPS!,
      },
    })
    .catch((e) => {
      console.log(e);
      toast.error(`placeOrder failed: ${JSON.stringify(e)}`);
      return null;
    });
  if (!result) {
    return null;
  }
  console.log(result);
  toast.success("Order placed successfully");
};

const getPerpsBalance = async ({
  exchClient,
  walletAddress,
}: {
  exchClient: hl.InfoClient;
  walletAddress: string;
}) => {
  return exchClient
    .clearinghouseState({
      user: walletAddress,
    })
    .catch(() => null);
};

const getBuilderFee = async ({
  infoClient,
  userAddress,
  builderAddress,
}: {
  infoClient: hl.InfoClient;
  userAddress: string;
  builderAddress: string;
}) => {
  return await infoClient.maxBuilderFee({
    user: userAddress,
    builder: builderAddress,
  });
};

export { placeOrder, getPerpsBalance, getBuilderFee };
