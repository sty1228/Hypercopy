"use client";

import Image from "next/image";
import headerLeftMoreIcon from "@/assets/icons/header-left-more.png";
import headerRightWalletIcon from "@/assets/icons/header-right-wallet.png";
import headerRightXIcon from "@/assets/icons/X.png";
import { usePrivy } from "@privy-io/react-auth";
import { useCallback } from "react";
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
        {/* <Image
          src={headerRightXIcon}
          alt="header-right-X"
          width={16}
          height={16}
        /> */}

        {authenticated && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Image
                src={headerRightWalletIcon}
                alt="header-right-wallet"
                className="ml-5"
                width={16}
                height={16}
              />
            </AlertDialogTrigger>
            <AlertDialogContent
              style={{
                backgroundColor: "rgb(14, 26, 30)",
                border: "1px solid rgba(27, 36, 41, 1)",
              }}
            >
              <AlertDialogHeader>
                <AlertDialogTitle>Sure to logout?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will logout your account or disconnect your wallet.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-row gap-8 justify-center">
                <AlertDialogCancel
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid rgba(27, 36, 41, 1)",
                  }}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  style={{
                    backgroundColor: "rgba(80, 210, 193, 1)",
                    color: "rgba(15, 26, 31, 1)",
                  }}
                  onClick={handleClickWallet}
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
