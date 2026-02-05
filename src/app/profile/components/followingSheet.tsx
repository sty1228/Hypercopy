"use client";
import React, { useState } from "react";
import { X, Search } from "lucide-react";
import FollowingItem, { FollowingUser } from "./followingItem";

interface FollowingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  count: number;
  users: FollowingUser[];
  onToggleFollow: (id: string) => void;
}

export default function FollowingSheet({
  isOpen,
  onClose,
  title,
  count,
  users,
  onToggleFollow,
}: FollowingSheetProps) {
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.handle.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto rounded-t-3xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #111820 0%, #0a0f14 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderBottom: "none",
          maxHeight: "75vh",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h2 className="text-base font-bold text-white">{title}</h2>
            <span className="text-[11px] text-gray-500">{count} accounts</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-white/10"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Search size={14} className="text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-gray-500 outline-none w-full"
            />
          </div>
        </div>

        {/* List */}
        <div
          className="overflow-y-auto divide-y divide-white/5"
          style={{ maxHeight: "calc(75vh - 160px)" }}
        >
          {filtered.length > 0 ? (
            filtered.map((user) => (
              <FollowingItem
                key={user.id}
                user={user}
                onToggleFollow={onToggleFollow}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="text-sm text-gray-500">No results found</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}