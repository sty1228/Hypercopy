"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import colors from "@/const/colors";
import Image from "next/image";
import homeIcon from "@/assets/icons/home.png";
import copyTradingIcon from "@/assets/icons/copy-trading.png";
import portfolioIcon from "@/assets/icons/portfolio.png";
import notificationIcon from "@/assets/icons/notification.png";
import settingsIcon from "@/assets/icons/settings.png";

const Navbar = () => {
  const pathname = usePathname();
  useEffect(() => {
    console.log(pathname);
  }, [pathname]);

  return (
    <nav
      className="w-full"
      style={{
        position: "fixed",
        bottom: "0",
        height: "62px",
        padding: "0 42px",
        zIndex: 9,
        backgroundColor: colors.primary,
      }}
    >
      <ul className="h-full flex justify-between items-center">
        <li>
          <Link href="/">
            <Image src={homeIcon} alt="home" width={22} height={22} />
          </Link>
        </li>
        <li>
          <Link href="/copyTrading">
            <Image src={copyTradingIcon} alt="copy-trading" width={22} height={22} />
          </Link>
        </li>
        <li>
          <Link href="/profile">
            <Image src={portfolioIcon} alt="profile" width={22} height={22} />
          </Link>
        </li>
        <li>
          <Link href="/">
            <Image src={notificationIcon} alt="notification" width={22} height={22} />
          </Link>
        </li>
        <li>
          <Link href="/settings">
            <Image src={settingsIcon} alt="settings" width={22} height={22} />
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
