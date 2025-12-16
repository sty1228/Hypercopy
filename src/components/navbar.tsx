"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useContext } from "react";
import { usePrivy } from "@privy-io/react-auth";
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
import { HyperLiquidContext } from "@/providers/hyperliquid";
import { toast } from "sonner";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { authenticated } = usePrivy();
  const { tradingEnabled, builderFeeApproved } = useContext(HyperLiquidContext);

  useEffect(() => {
    console.log(pathname);
  }, [pathname]);

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    // /copyTrading 不需要校验，直接跳转
    if (href === "/copyTrading") {
      return;
    }

    // 其他路由需要校验
    if (authenticated) {
      return;
    }
    e.preventDefault();
    toast.warning("Please login to visit more page");
    // 方式1: 直接在 URL 中添加查询参数
    router.push(`/onboarding?from=${encodeURIComponent(href)}`);
    // 方式2: 使用 URLSearchParams（适合多个参数）
    // const params = new URLSearchParams({ from: href });
    // router.push(`/onboarding?${params.toString()}`);
  };

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
          <Link
            href="/dashboard"
            onClick={(e) => handleLinkClick(e, "/dashboard")}
          >
            <Image
              src={pathname === "/dashboard" ? homeActiveIcon : homeIcon}
              alt="dashboard"
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
          <Link href="/profile" onClick={(e) => handleLinkClick(e, "/profile")}>
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
          <Link
            href="/notification"
            onClick={(e) => handleLinkClick(e, "/notification")}
          >
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
          <Link
            href="/settings"
            onClick={(e) => handleLinkClick(e, "/settings")}
          >
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
