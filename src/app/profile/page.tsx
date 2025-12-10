"use client";

import Image from "next/image";
import greenDollarIcon from "@/assets/icons/dollar-green.png";
import xIcon from "@/assets/icons/X.png";
import infoIcon from "@/assets/icons/info.png";
import tradersCopyIcon from "@/assets/icons/traders-copy.png";
import rightArrowIcon from "@/assets/icons/right-arrow.png";
import wifiIcon from "@/assets/icons/wifi.png";
import plusIcon from "@/assets/icons/plus.png";
import fireIcon from "@/assets/icons/fire.png";
import ticksIcon from "@/assets/icons/ticks.png";
import pointsIcon from "@/assets/icons/points.png";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useContext, useEffect, useState } from "react";
import { throttle } from "@/lib/utils";
import TradersCopyingSheet from "./components/tradersCopyingSheet";
import FollowingSheet from "./components/followingSheet";
import {
  ProfileDataResponse,
  getProfileData as getProfileDataService,
} from "@/service";
import { getPerpsBalance } from "@/helpers/hyperliquid";
import { HyperLiquidContext } from "@/providers/hyperliquid";
import { useCurrentWallet } from "@/hooks/usePrivyData";

const Profile = () => {
  const { infoClient } = useContext(HyperLiquidContext);
  const currentWallet = useCurrentWallet();
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [isTradersCopyingOpen, setIsTradersCopyingOpen] = useState(false);
  const [isFollowingOpen, setIsFollowingOpen] = useState(false);
  const closeTooltip = throttle(() => setTooltipOpen(false), 300);
  const [profileData, setProfileData] = useState<ProfileDataResponse | null>(
    null
  );
  const [accountValue, setAccountValue] = useState<number>(0);

  const getProfileData = async () => {
    const data = await getProfileDataService();
    console.log(data);
    if (data) {
      setProfileData(data);
    }
  };

  const getAccountValue = async () => {
    const data = await getPerpsBalance({
      exchClient: infoClient!,
      walletAddress: currentWallet?.address!,
    });
    console.log(data);
    if (data) {
      setAccountValue(Number(data?.marginSummary?.accountValue));
    }
  };

  useEffect(() => {
    getProfileData();
    getAccountValue();
  }, []);

  return profileData ? (
    <div className="p-5">
      <div
        className="border rounded-[26px]"
        style={{
          borderColor: "rgba(80, 210, 193, 0.6)",
          background:
            "linear-gradient(0deg, rgba(7, 39, 35, 0), rgba(7, 39, 35, 1)), radial-gradient(0deg, rgba(80, 210, 193, 1), rgba(7, 39, 35, 1))",
        }}
      >
        <div className="relative flex items-center px-5 pt-5">
          {/* balance, position absolute */}
          <div
            className="absolute h-[48px] top-0 right-0 border-l border-b px-3 flex items-center rounded-bl-[26px]"
            style={{
              borderColor: "rgba(80, 210, 193, 0.6)",
            }}
          >
            <Image
              src={greenDollarIcon}
              alt="green-dollar"
              width={18}
              height={18}
            />
            <span
              className="font-medium text-lg ml-2 max-w-[100px] truncate"
              style={{
                color: "rgba(79, 202, 21, 1)",
              }}
            >
              $ {(accountValue || profileData.accountValue).toLocaleString()}
            </span>
          </div>
          <span className="w-[58px] h-[58px] bg-[#25A1CA] rounded-full font-bold text-2xl text-white flex items-center justify-center">
            {profileData.name.charAt(0).toUpperCase()}
          </span>
          <div className="flex flex-col ml-2">
            <span className="font-SemiBold text-xl max-w-[100px] break-words">{profileData.name}</span>
            <p className="flex items-center h-[14px] mt-1">
              <Image src={xIcon} alt="x" width={10} height={10} />
              <span
                className="ml-1"
                style={{
                  color: "rgba(165, 176, 176, 1)",
                }}
              >
                @{profileData.twitterId}
              </span>
            </p>
            <div className="flex h-[14px] mt-1">
              <span
                className="text-sm underline"
                style={{
                  color: "rgba(165, 176, 176, 1)",
                }}
              >
                <span className="font-medium">{profileData.followingCount}</span> Following
              </span>
              <span
                className="text-sm ml-3 underline"
                style={{
                  color: "rgba(165, 176, 176, 1)",
                }}
              >
                <span className="font-medium">{profileData.followerCount}</span> Followers
              </span>
            </div>
          </div>
        </div>

        <div className="flex px-5 items-center mt-4">
          <div className="flex relative">
            <p className="w-[20px] h-[20px] flex items-center justify-center bg-[#25A1CA] rounded-full z-5" />
            <p className="w-[20px] h-[20px] flex items-center justify-center bg-[#5B31BF] rounded-full z-4 -ml-2" />
            <p className="w-[20px] h-[20px] flex items-center justify-center bg-[#AA974C] rounded-full z-3 -ml-2" />
            <p className="w-[20px] h-[20px] flex items-center justify-center bg-[#190AD4] rounded-full z-2 -ml-2" />
          </div>
          <p
            className="text-sm ml-2"
            style={{ color: "rgba(165, 176, 176, 1)" }}
          >
            {profileData.followerList.length > 0 ? (
              <>
                Followed by{" "}
                <span className="text-white">
                  {profileData.followerList[0]?.name || profileData.followerList[0]?.twitterId}
                </span>
                {profileData.followerList.length > 1 && (
                  <>
                    {" "}
                    and{" "}
                    <span className="text-white">
                      {profileData.followerList.length - 1} others
                    </span>
                  </>
                )}
              </>
            ) : (
              "No followers yet"
            )}
          </p>
        </div>

        <div className="px-5">
          <div
            className="mt-9 border-t border-b flex flex-col"
            style={{
              borderTopColor: "rgba(23, 42, 48, 1)",
              borderBottomColor: "rgba(23, 42, 48, 1)",
            }}
          >
            <div className="flex items-center justify-between py-5">
              <div className="flex h-[30px] items-center">
                <span style={{ color: "rgba(165, 176, 176, 1)" }}>
                  Traders Copying
                </span>
                <Tooltip
                  open={tooltipOpen}
                  onOpenChange={(status) => {
                    if (!status) {
                      closeTooltip();
                    }
                  }}
                >
                  <TooltipTrigger
                    onClick={() => setTooltipOpen(true)}
                    onMouseEnter={() => null}
                  >
                    <Image
                      src={infoIcon}
                      alt="info"
                      width={16}
                      height={16}
                      className="ml-1"
                    />
                  </TooltipTrigger>
                  <TooltipContent
                    arrowFill="rgba(23, 42, 48, 1)"
                    className="px-4 py-2 max-w-[200px] border"
                    style={{
                      backgroundColor: "rgba(23, 42, 48, 1)",
                      borderColor: "rgba(46, 63, 68, 1)",
                    }}
                  >
                    <p className="font-SemiBold text-lg">Traders Copying</p>
                    <p
                      className="text-sm"
                      style={{ color: "rgba(165, 176, 176, 1)" }}
                    >
                      The total amount of traders that are following this
                      profile
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div
                className="flex h-[30px] items-center flex-1 justify-end"
                onClick={() => setIsTradersCopyingOpen(true)}
              >
                <Image
                  src={tradersCopyIcon}
                  alt="traders-copy"
                  width={18}
                  height={18}
                  className="mr-1"
                />
                <span className="text-2xl">{profileData.traderCopyingCount}</span>
                <Image
                  src={rightArrowIcon}
                  alt="arrow-right"
                  height={10}
                  className="ml-3"
                />
              </div>
            </div>

            <div
              className="flex items-center justify-between py-5 border-t"
              onClick={() => setIsFollowingOpen(true)}
              style={{
                borderTopColor: "rgba(23, 42, 48, 1)",
              }}
            >
              <div className="flex h-[30px] items-center">
                <span style={{ color: "rgba(165, 176, 176, 1)" }}>
                  Signal v. Noise
                </span>
              </div>
              <div className="flex h-[30px] items-center">
                <Image
                  src={wifiIcon}
                  alt="wifi"
                  width={18}
                  height={18}
                  className="mr-1"
                />
                <span className="text-2xl ml-1">{profileData.signalCount}</span>
                <Image
                  src={plusIcon}
                  alt="plus"
                  width={18}
                  height={18}
                  className="ml-4"
                />
                <span className="text-2xl ml-1">{profileData.noiseCount}</span>
                <Image
                  src={rightArrowIcon}
                  alt="arrow-right"
                  height={10}
                  className="ml-3"
                />
              </div>
            </div>
          </div>

          <div
            className="mt-5 pb-5 border-b"
            style={{
              borderBottomColor: "rgba(23, 42, 48, 1)",
            }}
          >
            <p className="flex flex-col items-center">
              <Image src={fireIcon} alt="fire" width={18} height={18} />
              <div className="mt-2 flex justify-center w-full">
                <div className="flex-1 flex flex-col items-end">
                  <div className="pr-8 text-center">
                    <p className="text-2xl">
                      <span
                        style={{
                          color: "rgba(220, 48, 255, 1)",
                        }}
                      >
                        {profileData.streakCount}
                      </span>{" "}
                      🔥
                    </p>
                    <p
                      className="mt-2"
                      style={{ color: "rgba(165, 176, 176, 1)" }}
                    >
                      Streak
                    </p>
                  </div>
                </div>
                <div
                  className="w-[1px] h-[30px]"
                  style={{
                    backgroundColor: "rgba(23, 42, 48, 1)",
                  }}
                />
                <div className="flex-1 flex flex-col items-start">
                  <div className="pl-4 text-center">
                    <p
                      className="text-2xl"
                      style={{
                        color: "rgba(80, 210, 193, 1)",
                      }}
                    >
                      {profileData.streakCumulativePnLRate.toFixed(0)}%
                    </p>
                    <p
                      className="mt-2"
                      style={{ color: "rgba(165, 176, 176, 1)" }}
                    >
                      % Cumulative
                    </p>
                  </div>
                </div>
              </div>
            </p>
          </div>

          <div
            className="mt-5 pb-5 border-b flex flex-col items-center"
            style={{
              borderBottomColor: "rgba(23, 42, 48, 1)",
            }}
          >
            <Image src={ticksIcon} alt="ticks" width={18} height={18} />
            <p className="mt-2 text-2xl">{profileData.tradeTicks} Ticks</p>
            <p className="flex items-center mt-2">
              <span
                style={{
                  color: "rgba(165, 176, 176, 1)",
                }}
              >
                Trader Data Analysis
              </span>
              <Image
                src={infoIcon}
                alt="info"
                width={18}
                height={18}
                className="ml-1"
              />
            </p>
          </div>

          <div className="mt-5 pb-5  flex flex-col items-center">
            <Image src={pointsIcon} alt="points" width={18} height={18} />
            <p className="mt-2 text-2xl">{profileData.collectedPoints} Pts</p>
            <p className="flex items-center mt-2">
              <span
                style={{
                  color: "rgba(165, 176, 176, 1)",
                }}
              >
                Points Collected
              </span>
            </p>
          </div>
        </div>
      </div>
      <TradersCopyingSheet
        isOpen={isTradersCopyingOpen}
        handleClose={() => setIsTradersCopyingOpen(false)}
      />
      <FollowingSheet
        isOpen={isFollowingOpen}
        handleClose={() => setIsFollowingOpen(false)}
      />
    </div>
  ) : null;
};

export default Profile;
