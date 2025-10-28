import * as hl from "@nktkas/hyperliquid";

// order placing, send with agent wallet, use exchClient
const placeOrder = async ({
  exchClient,
  orderParams,
}: {
  exchClient: hl.ExchangeClient;
  orderParams: {
    side: "long" | "short";
    price: number;
    size: number;
    coin: number;
    leverage: number;
  };
}) => {
  if (!exchClient) {
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
    })
    .catch((e) => {
      console.log(e);
      alert(`placeOrder failed: ${JSON.stringify(e)}`);
      return null;
    });
  if (!result) {
    return null;
  }
  console.log(result);
  alert("Order placed successfully");
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

export { placeOrder, getPerpsBalance };
