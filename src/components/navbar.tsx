"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import colors from "@/const/colors";
import Image from "next/image";
import homeIcon from "@/assets/icons/home.png";
import homeActiveIcon from "@/assets/icons/home-active.png";
import copyTradingIcon from "@/assets/icons/copy-trading.png";
import copyTradingActiveIcon from "@/assets/icons/copy-trading-active.png";
import portfolioIcon from "@/assets/icons/portfolio.png";
import portfolioActiveIcon from "@/assets/icons/portfolio-active.png";
import notificationIcon from "@/assets/icons/notification.png";
import notificationActiveIcon from "@/assets/icons/notification-active.png";
import settingsIcon from "@/assets/icons/settings.png";
import settingsActiveIcon from "@/assets/icons/settings-active.png";
import { MAX_WIDTH } from "@/app/layout";

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
        maxWidth: MAX_WIDTH,
      }}
    >
      <ul className="h-full flex justify-between items-center">
        <li>
          <Link href="/home">
            <Image
              src={pathname === "/home" ? homeActiveIcon : homeIcon}
              alt="home"
              width={22}
              height={22}
            />
          </Link>
        </li>
        <li>
          <Link href="/copyTrading">
            <Image
              src={
                pathname === "/copyTrading"
                  ? copyTradingActiveIcon
                  : copyTradingIcon
              }
              alt="copy-trading"
              width={22}
              height={22}
            />
          </Link>
        </li>
        <li>
          <Link href="/profile">
            <Image
              src={
                pathname === "/profile" ? portfolioActiveIcon : portfolioIcon
              }
              alt="profile"
              width={22}
              height={22}
            />
          </Link>
        </li>
        <li>
          <Link href="/notification">
            <Image
              src={
                pathname === "/notification"
                  ? notificationActiveIcon
                  : notificationIcon
              }
              alt="notification"
              width={22}
              height={22}
            />
          </Link>
        </li>
        <li>
          <Link href="/settings">
            <Image
              src={pathname === "/settings" ? settingsActiveIcon : settingsIcon}
              alt="settings"
              width={22}
              height={22}
            />
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
