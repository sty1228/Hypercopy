import Image from "next/image";
import bullishIcon from "@/assets/icons/bullish.png";
import dotsMoreIcon from "@/assets/icons/dots-more.png";
import commentIcon from "@/assets/icons/comment.png";
import retweetIcon from "@/assets/icons/retweet.png";
import likeIcon from "@/assets/icons/like.png";

export default function SignalItem() {
  return (
    <div
      className="rounded-[20px] p-4"
      style={{
        background: "linear-gradient(0deg, #26424B, #26424B)",
      }}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className="mr-1 text-base font-normal">12 hrs ago</span>
          <Image src={bullishIcon} alt="bullish" height={16} />
        </div>
        <Image
          src={dotsMoreIcon}
          alt="dots-more"
          className="w-[17px] h-[4px]"
        />
      </div>
      <div className="mt-2">
        <p>
          Duis aute irure dolor{" "}
          <span
            style={{
              color: "rgba(43, 234, 223, 1)",
            }}
          >
            BTC +6.92 +34.65%
          </span>{" "}
          in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur voluptatesse.
        </p>
        <span
          className=""
          style={{
            color: "rgba(43, 234, 223, 1)",
          }}
        >
          See More...
        </span>
      </div>
      <div className="mt-6 flex justify-between">
        <div className="flex">
          <div className="flex items-center">
            <Image src={commentIcon} alt="comment" height={16} />
            <span className="ml-1">89</span>
          </div>
          <div className="flex items-center ml-4">
            <Image src={retweetIcon} alt="retweet" height={16} />
            <span className="ml-1">1.5K</span>
          </div>
          <div className="flex items-center ml-4">
            <Image src={likeIcon} alt="like" height={16} />
            <span className="ml-1">9K</span>
          </div>
        </div>
        <div className="flex">
          <span
            className="px-1 rounded-[6px] font-medium text-xs"
            style={{
              backgroundColor: "rgba(43, 234, 223, 1)",
              color: "rgba(14, 26, 30, 1)",
              lineHeight: "24px",
            }}
          >
            $BTC
          </span>
          <span
            className="px-1 ml-1 rounded-[6px] font-medium text-xs"
            style={{
              backgroundColor: "rgba(38, 211, 159, 1)",
              color: "rgba(14, 26, 30, 1)",
              lineHeight: "24px",
            }}
          >
            +34.65%
          </span>
        </div>
      </div>
    </div>
  );
}
