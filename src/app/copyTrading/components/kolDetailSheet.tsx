"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import Avatar from "./avatar";
import { randomColor, randomLetter, randomName, randomNumber } from "./kolItem";
import { XIcon } from "lucide-react";
import wifiIcon from "@/assets/icons/wifi.png";
import Image from "next/image";
import SignalItem from "./signalItem";
import { LeaderboardItem, UserSignalResponse, userSignals } from "@/service";

export default function KolDetailSheet({
  data,
  isOpen,
  handleClose,
}: {
  data: LeaderboardItem;
  isOpen: boolean;
  handleClose: () => void;
}) {
  const [userSignalsData, setUserSignalsData] =
    useState<UserSignalResponse | null>(null);
  const [currentClickItemId, setCurrentClickItemId] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (isOpen) {
      fetchUserSignals();
    } else {
      setTimeout(() => {
        setUserSignalsData(null);
      }, 300);
    }
  }, [isOpen]);

  const fetchUserSignals = async () => {
    const response = await userSignals(data.x_handle);
    setUserSignalsData(response);
  };

  return (
    data && (
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent
          side="bottom"
          className="rounded-t-[20px] px-5 py-8 gap-0 overflow-y-auto"
          style={{
            borderTop: "none",
            background: "linear-gradient(0deg, #172A30, #0E1A1E)",
            height: "92%",
          }}
          showCloseButton={false}
        >
          <SheetHeader className="px-0 py-0">
            <SheetTitle className="text-[22px] font-semibold text-white flex items-center justify-between">
              <span>Signals</span>
              <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
                <span className="animate-pulse">
                  <XIcon className="size-4" />
                </span>
                <span className="sr-only">Close</span>
              </SheetPrimitive.Close>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-5 flex items-center justify-between">
            <div className="flex">
              <Avatar
                name={data.x_handle[0].toUpperCase()}
                backgroundColor={data.avatarColor!}
                size={36}
              />
              <div className="flex flex-col ml-3">
                <span className="text-base font-medium">{data.x_handle}</span>
                <span
                  className="text-xs font-normal"
                  style={{ color: "rgba(165, 176, 176, 1)" }}
                >
                  @{data.x_handle}
                </span>
              </div>
            </div>
            {userSignalsData?.tweetsCount && (
              <div className="flex items-center">
                <span className="animate-bounce">
                  <Image src={wifiIcon} alt="wifi" width={20} height={20} />
                </span>
                <span className="ml-2 text-[22px] font-normal">
                  {userSignalsData?.tweetsCount || "-"}
                </span>
              </div>
            )}
          </div>
          <div className="mt-3">
            {userSignalsData?.signals.map((signal) => (
              <SignalItem
                key={signal.signal_id}
                data={signal}
                currentClickItemId={currentClickItemId}
                onClick={() => {
                  setCurrentClickItemId(signal.signal_id);
                }}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    )
  );
}
