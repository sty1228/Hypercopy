import { Button } from "@/components/ui/button";
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

export default function KolDetailSheet({
  isOpen,
  handleClose,
}: {
  isOpen: boolean;
  handleClose: () => void;
}) {
  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="rounded-t-[20px] px-5 pt-8 gap-0"
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
              <XIcon className="size-4" />
              <span className="sr-only">Close</span>
            </SheetPrimitive.Close>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-5 flex items-center justify-between">
          <div className="flex">
            <Avatar
              name={randomLetter()}
              backgroundColor={randomColor()}
              size={36}
            />
            <div className="flex flex-col ml-3">
              <span className="text-base font-medium">{randomName()}</span>
              <span
                className="text-xs font-normal"
                style={{ color: "rgba(165, 176, 176, 1)" }}
              >
                @{randomName()}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <Image src={wifiIcon} alt="wifi" width={20} height={20} />
            <span className="ml-2 text-[22px] font-normal">
              {randomNumber()}
            </span>
          </div>
        </div>
        <div className="mt-5">
          <SignalItem />
        </div>
      </SheetContent>
    </Sheet>
  );
}
