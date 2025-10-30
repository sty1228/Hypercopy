import Image from "next/image";
import clockIcon from "@/assets/icons/clock.png";

const FollowingItem = () => {
  return (
    <div
      className="mt-5 border-t pt-4 flex items-center justify-between"
      style={{
        borderTopColor: "rgba(23, 42, 48, 1)",
      }}
    >
      <div className="flex items-center">
        <p
          className="flex items-center justify-center font-medium text-base w-[36px] h-[36px] rounded-full"
          style={{
            backgroundColor: "rgba(37, 40, 202, 1)",
          }}
        >
          J
        </p>
        <div className="flex flex-col ml-3">
          <p className="font-medium text-base">Jason Kraz</p>
          <p
            className="flex items-center font-light text-sm"
            style={{ color: "rgba(165, 176, 176, 1)" }}
          >
            <span>@jasonk</span>
            <Image
              src={clockIcon}
              alt="clock"
              width={10}
              height={10}
              className="ml-2"
            />
            <span className="ml-1">2 h</span>
          </p>
        </div>
      </div>

      <div className="flex items-center">
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
