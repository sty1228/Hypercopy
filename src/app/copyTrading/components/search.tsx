"use client";

import Image from "next/image";
import searchIcon from "@/assets/icons/search.png";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Search({
  placeholder = "Search",
  className,
  style,
  onSearchIconClick,
  onEnterClick,
  onChange,
}: {
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  onSearchIconClick?: () => void;
  onEnterClick?: () => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [inputHoverStyle, setInputHoverStyle] = useState({});

  return (
    <div
      className={cn(
        "flex w-full my-5 h-[52px] rounded-[16px] items-center px-5",
        className
      )}
      style={{
        background: "rgba(10, 20, 23, 1)",
        ...style,
        ...inputHoverStyle,
      }}
      onMouseEnter={() =>
        setInputHoverStyle({
          border: "1px solid rgba(43, 234, 223, 1)",
        })
      }
      onMouseLeave={() =>
        setInputHoverStyle({
          border: "none",
        })
      }
    >
      <Image
        src={searchIcon}
        alt="search"
        width={16}
        height={16}
        onClick={onSearchIconClick}
      />
      <input
        type="text"
        className="flex-1 pl-2 ml-2 h-[36px]"
        placeholder={placeholder}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onEnterClick?.();
          }
        }}
      />
    </div>
  );
}
