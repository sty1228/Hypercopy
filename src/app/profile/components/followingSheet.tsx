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
import { XIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import FollowingItem from "./followingItem";
import Search from "@/app/copyTrading/components/search";
import { MAX_WIDTH } from "@/app/layout";

export default function FollowingSheet({
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
            <span>Following</span>
            <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
              <span className="animate-pulse">
                <XIcon className="size-4" />
              </span>
              <span className="sr-only">Close</span>
            </SheetPrimitive.Close>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-8">
          <Search
            placeholder="Search"
            className="my-0 border"
            style={{
              borderColor: "rgba(27, 36, 41, 1)",
            }}
          />
        </div>

        <div>
          {Array.from({ length: 10 }).map((_, index) => (
            <FollowingItem key={index} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
