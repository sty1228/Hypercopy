"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useCallback } from "react";
import Avatar from "./avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Header() {
  const { authenticated, login, logout, user } = usePrivy();

  const handleClickAvatar = useCallback(() => {
    if (!authenticated) {
      login();
    }
  }, [authenticated, login]);

  const userName = user?.twitter?.name?.[0]?.toUpperCase() || "U";

  return (
    <div className="px-4 pt-3 pb-2 flex items-center justify-between">
      {/* Left - Menu Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:bg-white/10"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div className="grid grid-cols-2 gap-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/60" />
          ))}
        </div>
      </div>

      {/* Right - Stats & Avatar */}
      <div className="flex items-center gap-2">
        {/* Message Count */}
        <div
          className="px-3 py-2 rounded-xl flex items-center gap-1.5"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <svg
            className="w-4 h-4 text-teal-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="text-teal-400 text-xs font-semibold">4</span>
        </div>

        {/* Rank Badge */}
        <div
          className="px-3 py-2 rounded-xl flex items-center gap-1.5"
          style={{
            background: "linear-gradient(135deg, rgba(45,212,191,0.15) 0%, rgba(45,212,191,0.08) 100%)",
            border: "1px solid rgba(45,212,191,0.25)",
          }}
        >
          <span className="text-teal-400 text-xs">🏆</span>
          <span className="text-teal-400 text-xs font-semibold">#64</span>
        </div>

        {/* User Avatar */}
        {authenticated ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <div className="cursor-pointer">
                <Avatar name={userName} backgroundColor="#4f46e5" size={40} />
              </div>
            </AlertDialogTrigger>
            <AlertDialogContent
              style={{
                backgroundColor: "#0a0f14",
                border: "1px solid rgba(45,212,191,0.2)",
              }}
            >
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Sure to logout?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400">
                  This will logout your account or disconnect your wallet.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-row gap-4 justify-center">
                <AlertDialogCancel
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                  }}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  style={{
                    backgroundColor: "#2dd4bf",
                    color: "#0a0f14",
                  }}
                  onClick={logout}
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <div className="cursor-pointer" onClick={handleClickAvatar}>
            <Avatar name="?" backgroundColor="#4f46e5" size={40} />
          </div>
        )}
      </div>
    </div>
  );
}