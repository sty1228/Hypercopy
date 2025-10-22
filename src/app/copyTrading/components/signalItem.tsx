import Image from "next/image";
import bullishIcon from "@/assets/icons/bullish.png";
import bearishIcon from "@/assets/icons/bearish.png";
import dotsMoreIcon from "@/assets/icons/dots-more.png";
import commentIcon from "@/assets/icons/comment.png";
import retweetIcon from "@/assets/icons/retweet.png";
import likeIcon from "@/assets/icons/like.png";
import { UserSignalItem } from "@/service";
import { numberToPercentageString } from "@/lib/number";
import counterTradeIcon from "@/assets/icons/counter-trade-tip.png";
import copyTradeIcon from "@/assets/icons/copy-trade-tip.png";
import { Button } from "@/components/ui/button";

export default function SignalItem({
  data,
  onClick,
  currentClickItemId,
}: {
  data: UserSignalItem;
  onClick: (signalId: number) => void;
  currentClickItemId: number | null;
}) {
  return (
    <div
      className="rounded-[20px] p-4 mt-2"
      style={{
        background: "linear-gradient(0deg, #26424B, #26424B)",
      }}
      onClick={() => onClick(data.signal_id)}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className="mr-1 text-base font-normal">{data.updateTime}</span>
          {data.bull_or_bear === "bullish" ? (
            <Image src={bullishIcon} alt="bullish" height={16} />
          ) : (
            <Image src={bearishIcon} alt="bearish" height={16} />
          )}
        </div>
        {/* <Image
          src={dotsMoreIcon}
          alt="dots-more"
          className="w-[17px] h-[4px]"
        /> */}
      </div>
      <div className="mt-2">
        <p>{data?.content || ""}</p>
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
            <span className="ml-1">
              {data?.commentsCount >= 0 ? data.commentsCount : "-"}
            </span>
          </div>
          <div className="flex items-center ml-4">
            <Image src={retweetIcon} alt="retweet" height={16} />
            <span className="ml-1">
              {data?.retweetsCount >= 0 ? data.retweetsCount : "-"}
            </span>
          </div>
          <div className="flex items-center ml-4">
            <Image src={likeIcon} alt="like" height={16} />
            <span className="ml-1">
              {data?.likesCount >= 0 ? data.likesCount : "-"}
            </span>
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
            ${data?.ticker || "-"}
          </span>
          <span
            className="px-1 ml-1 rounded-[6px] font-medium text-xs"
            style={{
              backgroundColor: "rgba(38, 211, 159, 1)",
              color: "rgba(14, 26, 30, 1)",
              lineHeight: "24px",
            }}
          >
            {numberToPercentageString(data?.change_since_tweet || 0)}
          </span>
        </div>
      </div>

      {currentClickItemId === data.signal_id && (
        <div
          className="mt-6 border-t-[1px] flex pt-4"
          style={{
            borderTopColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="flex flex-1 items-center justify-center h-[18px] font-normal text-sm">
            Counter Trade
            <Image
              src={counterTradeIcon}
              alt="counter-trade"
              className="ml-2"
              width={12}
              height={12}
            />
          </div>
          <p
            className="h-[18px] w-[1px]"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            }}
          />
          <div className="flex flex-1 items-center justify-center h-[18px] font-normal text-sm">
            Counter Trade
            <Image
              src={copyTradeIcon}
              alt="copy-trade"
              className="ml-2"
              width={12}
              height={12}
            />
          </div>
        </div>
      )}
    </div>
  );
}
