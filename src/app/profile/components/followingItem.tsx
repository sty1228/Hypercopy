import Image from "next/image";
import clockIcon from "@/assets/icons/clock.png";
import { FollowerItem } from "@/service";

const FollowingItem = ({ data }: { data: FollowerItem }) => {
  return (
    <div
      className="mt-5 border-t pt-4 flex items-center justify-between"
      style={{
        borderTopColor: "rgba(23, 42, 48, 1)",
      }}
    >
      <div className="flex items-center flex-1">
        <p
          className="flex items-center justify-center font-medium text-base w-[36px] h-[36px] rounded-full"
          style={{
            backgroundColor: "rgba(37, 40, 202, 1)",
          }}
        >
          {data.name.charAt(0).toUpperCase()}
        </p>
        <div className="flex-1 flex flex-col ml-3">
          <p className="font-medium text-base">{data.name}</p>
          <p
            className="flex items-center font-light text-sm justify-between"
            style={{ color: "rgba(165, 176, 176, 1)" }}
          >
            <span className="w-[100px] truncate">@{data.twitterId}</span>
            <div className="flex items-center">
              <Image
                src={clockIcon}
                alt="clock"
                width={10}
                height={10}
                className="ml-2 flex-shrink-0"
              />
              <span className="ml-1 flex-shrink-0">2h</span>
            </div>
          </p>
        </div>
      </div>

      <div className="flex items-center ml-2">
        <div className="flex flex-col">
          <p
            className="font-medium text-base"
            style={{
              background: "linear-gradient(0deg, #50D2C1, #028C7A)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            186
          </p>
          <p className="text-sm" style={{ color: "rgba(165, 176, 176, 1)" }}>
            Signals
          </p>
        </div>
        <div className="flex flex-col ml-6">
          <p className="font-medium text-base">546</p>
          <p className="text-sm" style={{ color: "rgba(165, 176, 176, 1)" }}>
            Followers
          </p>
        </div>
      </div>
    </div>
  );
};

export default FollowingItem;
