"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { usePrivy } from "@privy-io/react-auth";
import { useCurrentWallet } from "@/hooks/usePrivyData";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import InviteSheet from "@/app/dashboard/components/InviteSheet";

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [showInvite, setShowInvite] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { authenticated, logout, login, user, linkTwitter, linkWallet } = usePrivy();
  const currentWallet = useCurrentWallet();
  const router = useRouter();

  const twitterAccount = user?.twitter;
  const hasTwitter = !!twitterAccount?.username;
  const twitterPfp = (twitterAccount as any)?.profilePictureUrl || null;

  const walletAddress = currentWallet?.address || "";
  const isEmbeddedWallet = currentWallet?.walletClientType === "privy";
  const hasExternalWallet = !!walletAddress && !isEmbeddedWallet;
  const truncAddr = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "";

  const avatarLabel = walletAddress ? walletAddress.slice(2, 6).toUpperCase() : "?";

  const updatePosition = useCallback(() => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    }
  }, []);

  const toggleMenu = () => {
    if (!isOpen) updatePosition();
    setIsOpen(!isOpen);
  };

  // Authenticated taps on the avatar go straight to /profile (the place
  // where the user manages identity / followers / settings). Unauthenticated
  // taps still open the dropdown so the "Log In" button is reachable.
  const handleAvatarClick = () => {
    if (authenticated) {
      router.push("/profile");
      return;
    }
    toggleMenu();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", updatePosition, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.success("Address copied!");
    }
    setIsOpen(false);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.push("/");
  };

  const handleLogin = () => {
    setIsOpen(false);
    login();
  };

  const handleLinkTwitter = async () => {
    try {
      await linkTwitter();
      toast.success("X account linked!");
    } catch (e: any) {
      if (e?.message?.includes("cancelled") || e?.message?.includes("closed")) return;
      toast.error("Failed to link X account");
    }
  };

  const handleLinkWallet = async () => {
    try {
      await linkWallet();
      toast.success("Wallet linked!");
    } catch (e: any) {
      if (e?.message?.includes("cancelled") || e?.message?.includes("closed")) return;
      toast.error("Failed to link wallet");
    }
  };

  const handleOpenInvite = () => {
    setIsOpen(false);
    // slight delay so menu closes before sheet animates in
    setTimeout(() => setShowInvite(true), 80);
  };

  const dropdown = isOpen
    ? createPortal(
        <div
          ref={menuRef}
          className="w-[260px] rounded-2xl overflow-hidden"
          style={{
            position: "fixed",
            top: menuPos.top,
            right: menuPos.right,
            zIndex: 999999,
            background: "linear-gradient(135deg, rgba(15,22,30,0.98) 0%, rgba(10,15,20,0.98) 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.3)",
            backdropFilter: "blur(20px)",
            animation: "userMenuFadeIn 0.2s ease-out",
          }}
        >
          <style>{`
            @keyframes userMenuFadeIn {
              from { opacity: 0; transform: translateY(-8px) scale(0.95); }
              to   { opacity: 1; transform: translateY(0)   scale(1);    }
            }
          `}</style>

          {authenticated ? (
            <>
              {/* Header */}
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.6)" }} />
                  <span className="text-[11px] text-gray-400">Connected</span>
                </div>
              </div>

              {/* X Account */}
              {hasTwitter ? (
                <div className="w-full px-4 py-3 flex items-center gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
                    {twitterPfp ? (
                      <img src={twitterPfp} alt="pfp" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-white font-medium">@{twitterAccount!.username}</p>
                    <p className="text-[10px] text-gray-500">X account linked</p>
                  </div>
                  <div className="ml-auto">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)" }}>
                      <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleLinkTwitter}
                  className="w-full px-4 py-3 flex items-center gap-3 transition-all duration-200 hover:bg-white/5 cursor-pointer"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-white font-medium">Link X Account</p>
                    <p className="text-[10px] text-gray-500">Earn KOL rewards & boost points</p>
                  </div>
                </button>
              )}

              {/* Wallet */}
              {hasExternalWallet ? (
                <button
                  onClick={handleCopyAddress}
                  className="w-full px-4 py-3 flex items-center justify-between transition-all duration-200 hover:bg-white/5 cursor-pointer"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(45,212,191,0.1)" }}>
                      <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-white font-medium">{truncAddr}</p>
                      <p className="text-[10px] text-gray-500">Tap to copy</p>
                    </div>
                  </div>
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleLinkWallet}
                  className="w-full px-4 py-3 flex items-center gap-3 transition-all duration-200 hover:bg-white/5 cursor-pointer"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(45,212,191,0.08)" }}>
                    <svg className="w-4 h-4 text-teal-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-teal-400 font-medium">Link Wallet</p>
                    <p className="text-[10px] text-gray-500">Connect MetaMask, Rabby, etc.</p>
                  </div>
                </button>
              )}

              {/* Disconnect */}
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 flex items-center gap-3 transition-all duration-200 hover:bg-white/5 cursor-pointer"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(244,63,94,0.1)" }}>
                  <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                </div>
                <span className="text-xs text-rose-400 font-medium">Disconnect</span>
              </button>

              {/* ★ Invite Friends — subtle, after disconnect */}
              <button
                onClick={handleOpenInvite}
                className="w-full px-4 py-2.5 flex items-center gap-2.5 transition-all duration-200 hover:bg-white/[0.03] cursor-pointer"
                style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
              >
                <svg
                  width="13" height="13" viewBox="0 0 24 24"
                  fill="none" stroke="rgba(45,212,191,0.45)" strokeWidth="1.8"
                >
                  <polyline points="20 12 20 22 4 22 4 12"/>
                  <rect x="2" y="7" width="20" height="5"/>
                  <path d="M12 22V7"/>
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                </svg>
                <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.28)" }}>
                  Invite Friends
                </span>
              </button>

              <div className="h-1" />
            </>
          ) : (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.3)" }} />
                <span className="text-[11px] text-gray-400">Not connected</span>
              </div>
              <button
                onClick={handleLogin}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, rgba(45,212,191,0.2) 0%, rgba(45,212,191,0.1) 100%)",
                  border: "1px solid rgba(45,212,191,0.3)",
                  color: "rgba(45,212,191,1)",
                }}
              >
                Log In
              </button>
            </div>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleAvatarClick}
        aria-label={authenticated ? "Open profile" : "Open account menu"}
        className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-sm font-bold text-white cursor-pointer transition-all duration-200 hover:scale-105"
        style={{
          backgroundColor: authenticated
            ? twitterPfp ? "transparent" : "#2528CA"
            : "rgba(255,255,255,0.1)",
          boxShadow: authenticated ? "0 0 25px rgba(59,130,246,0.4)" : "none",
          border: authenticated
            ? twitterPfp ? "2px solid rgba(45,212,191,0.4)" : "none"
            : "1px solid rgba(255,255,255,0.15)",
          position: "relative",
          zIndex: 10,
          overflow: "hidden",
        }}
      >
        {authenticated ? (
          twitterPfp ? (
            <img src={twitterPfp} alt="pfp" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-[10px] font-bold tracking-wider">{avatarLabel}</span>
          )
        ) : (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      </button>

      {dropdown}

      {/* ★ Invite Sheet */}
      {showInvite && <InviteSheet onClose={() => setShowInvite(false)} />}
    </>
  );
};

export default UserMenu;