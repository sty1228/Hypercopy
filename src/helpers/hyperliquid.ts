import * as hl from "@nktkas/hyperliquid";
import { toast } from "sonner";

// order placing, send with agent wallet, use exchClient
const placeOrder = async ({
  exchClient,
  orderParams,
}: {
  exchClient: hl.ExchangeClient;
  orderParams: {
    side: "long" | "short";
    price: number | string;
    size: number | string;
    coin: number;
    leverage: number;
  };
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
  const result = await exchClient
    .order({
      orders: [
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
      ],
      grouping: "na",
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
