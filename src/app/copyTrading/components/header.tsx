"use client";

import Image from "next/image";
import headerLeftMoreIcon from "@/assets/icons/header-left-more.png";
import headerRightWalletIcon from "@/assets/icons/header-right-wallet.png";
import headerRightXIcon from "@/assets/icons/X.png";
import { usePrivy } from "@privy-io/react-auth";
import { useCallback } from "react";

export default function Header() {
  const { authenticated, login, logout } = usePrivy();

  const handleClickWallet = useCallback(() => {
    if (authenticated) {
      logout();
    } else {
      login();
    }
  }, [authenticated, login, logout]);

  return (
    <div className="flex px-1 py-4 justify-between">
      <Image
        src={headerLeftMoreIcon}
        alt="header-left-more"
        width={16}
        height={16}
      />
      <div className="flex">
        <Image
          src={headerRightXIcon}
          alt="header-right-X"
          width={16}
          height={16}
        />
        <Image
          src={headerRightWalletIcon}
          alt="header-right-wallet"
          className="ml-5"
          width={16}
          height={16}
          onClick={handleClickWallet}
        />
      </div>
    </div>
  );
}
