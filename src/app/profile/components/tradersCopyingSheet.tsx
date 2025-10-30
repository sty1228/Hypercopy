"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import TraderCopyingItem from "./traderCopyingItem";
import { MAX_WIDTH } from "@/app/layout";

export default function TradersCopyingSheet({
  isOpen,
  handleClose,
}: {
  isOpen: boolean;
  handleClose: () => void;
}) {
  const [sortBy, setSortBy] = useState("performance");

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="rounded-t-[20px] px-5 py-8 gap-0 overflow-y-auto"
        style={{
          borderTop: "none",
          background: "linear-gradient(0deg, #172A30, #0E1A1E)",
          height: "92%",
          maxWidth: MAX_WIDTH,
        }}
        showCloseButton={false}
      >
        <SheetHeader className="px-0 py-0">
          <SheetTitle className="text-[22px] font-semibold text-white flex items-center justify-between">
            <span>Traders Copying</span>
            <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
              <span className="animate-pulse">
                <XIcon className="size-4" />
              </span>
              <span className="sr-only">Close</span>
            </SheetPrimitive.Close>
          </SheetTitle>
        </SheetHeader>

        <div
          className="relative flex items-center w-full mt-8 border rounded-[16px] h-[52px]"
          style={{
            borderColor: "rgba(27, 36, 41, 1)",
          }}
        >
          <Label
            htmlFor="orderStyle"
            className="absolute left-4 text-sm text-muted-foreground pointer-events-none font-normal text-base"
          >
            Sort by:
          </Label>
          <Select
            value={sortBy}
            onValueChange={(value) => {
              setSortBy(value);
            }}
          >
            <SelectTrigger className="w-full border-none font-normal text-base pl-[100px] pr-0 justify-end pr-2">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div>
          {Array.from({ length: 10 }).map((_, index) => (
            <TraderCopyingItem key={index} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
