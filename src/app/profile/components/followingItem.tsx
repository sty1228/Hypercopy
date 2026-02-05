"use client";
import React from "react";
import { UserPlus, UserCheck } from "lucide-react";

export interface FollowingUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  avatarBg: string;
  score: number;
  isFollowing: boolean;
  tags?: string[];
}

interface FollowingItemProps {
  user: FollowingUser;
  onToggleFollow: (id: string) => void;
}

export default function FollowingItem({ user, onToggleFollow }: FollowingItemProps) {
  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-white/5 transition-all">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ backgroundColor: user.avatarBg, boxShadow: `0 0 12px ${user.avatarBg}40` }}
        >
          {user.avatar}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white truncate">{user.name}</span>
            <div
              className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(45,212,191,0.2) 0%, rgba(45,212,191,0.1) 100%)",
                color: "rgba(45,212,191,1)",
                border: "1px solid rgba(45,212,191,0.3)",
              }}
            >
              {user.score}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" className="text-gray-500">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="text-[11px] text-gray-500 truncate">{user.handle}</span>
          </div>
          {/* Tags */}
          {user.tags && user.tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {user.tags.slice(0, 2).map((tag, i) => (
                <span
                  key={i}
                  className="text-[9px] px-1.5 py-0.5 rounded-md text-gray-400"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Follow Button */}
      <button
        onClick={() => onToggleFollow(user.id)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer shrink-0"
        style={
          user.isFollowing
            ? {
                background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.1)",
              }
            : {
                background: "rgba(45,212,191,0.15)",
                color: "rgba(45,212,191,1)",
                border: "1px solid rgba(45,212,191,0.3)",
              }
        }
      >
        {user.isFollowing ? (
          <>
            <UserCheck size={12} />
            Following
          </>
        ) : (
          <>
            <UserPlus size={12} />
            Follow
          </>
        )}
      </button>
    </div>
  );
}