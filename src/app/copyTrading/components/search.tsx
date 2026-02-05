"use client";

import { useState } from "react";

export default function Search({
  placeholder = "Search traders...",
  onSearchIconClick,
  onEnterClick,
  onChange,
}: {
  placeholder?: string;
  onSearchIconClick?: () => void;
  onEnterClick?: () => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="px-4 mb-3">
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-300"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: isFocused
            ? "1px solid rgba(45,212,191,0.4)"
            : "1px solid rgba(255,255,255,0.06)",
          boxShadow: isFocused ? "0 0 20px rgba(45,212,191,0.1)" : "none",
        }}
      >
        <svg
          className="w-4 h-4 text-gray-500 cursor-pointer"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          onClick={onSearchIconClick}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 outline-none"
          placeholder={placeholder}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onEnterClick?.();
            }
          }}
        />
      </div>
    </div>
  );
}