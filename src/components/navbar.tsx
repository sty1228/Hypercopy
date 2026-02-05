"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const navItems = [
  { href: "/dashboard", label: "Home", icon: homeIcon, activeIcon: homeActiveIcon },
  { href: "/copyTrading", label: "Copy", icon: copyTradingIcon, activeIcon: copyTradingActiveIcon },
  { href: "/profile", label: "Profile", icon: portfolioIcon, activeIcon: portfolioActiveIcon },
  { href: "/notification", label: "Alerts", icon: notificationIcon, activeIcon: notificationActiveIcon },
  { href: "/settings", label: "Settings", icon: settingsIcon, activeIcon: settingsActiveIcon },
];

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav
      className="w-full"
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        height: "70px",
        zIndex: 9999,
        maxWidth: MAX_WIDTH,
        background: "linear-gradient(180deg, rgba(10,15,20,0.95) 0%, rgba(10,15,20,0.98) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 -4px 30px rgba(0,0,0,0.3)",
      }}
    >
      <ul className="h-full flex justify-around items-center px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer"
                style={{
                  background: isActive ? "rgba(45,212,191,0.1)" : "transparent",
                }}
              >
                <div
                  className="relative transition-transform duration-200"
                  style={{ transform: isActive ? "scale(1.1)" : "scale(1)" }}
                >
                  <Image
                    src={isActive ? item.activeIcon : item.icon}
                    alt={item.label}
                    width={22}
                    height={22}
                  />
                  {isActive && (
                    <div
                      className="absolute -inset-1 rounded-full -z-10"
                      style={{
                        background: "radial-gradient(circle, rgba(45,212,191,0.3) 0%, transparent 70%)",
                        filter: "blur(4px)",
                      }}
                    />
                  )}
                </div>
                <span
                  className="text-[10px] font-medium transition-colors duration-200"
                  style={{
                    color: isActive ? "rgba(45,212,191,1)" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navbar;