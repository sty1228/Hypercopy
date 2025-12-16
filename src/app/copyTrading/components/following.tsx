"use client";

import { useCurrentWallet } from "@/hooks/usePrivyData";
import { ellipsisAddress } from "@/lib/string";
import { usePrivy } from "@privy-io/react-auth";
import { useMemo } from "react";

export default function Following() {
  const currentWallet = useCurrentWallet();
  const { user } = usePrivy();

  const displayUserName = useMemo(() => {
    return (
      user?.twitter?.name || user?.email?.address || currentWallet?.address
    );
  }, [user, currentWallet]);

  return (
    <div className="flex justify-between items-center h-[40px]">
      <span className="font-semibold text-3xl">Following</span>

      {currentWallet && (
        <div className="flex items-center">
          <div
            className="h-[40px] flex items-center justify-center px-2 rounded-[20px] font-medium text-sm"
            style={{
              background: "linear-gradient(to bottom right, blue, pink)",
              minWidth: "120px",
            }}
          >
            <span>{ellipsisAddress(displayUserName, 6, 6)}</span>
            {/* <div
            className="display-inlineblock flex items-center justify-center"
            style={{
              backgroundColor: "#E669CB",
              width: "28px",
              height: "28px",
              borderRadius: "14px",
            }}
          >
            Y
          </div>
          <span className="ml-1 font-medium text-sm">@textUser</span>
          <Image
            src={closeIcon}
            alt="close"
            className="ml-2"
            width={24}
            height={24}
          /> */}
          </div>
          {/* {!tradingEnabled && (
            <Button
              className="text-xs text-white w-[50px] ml-2"
              style={{
                backgroundColor: "rgba(80, 210, 193, 1)",
              }}
              onClick={handleEnableTrading}
            >
              Enable
            </Button>
          )} */}
        </div>
      )}
    </div>
  );
}
