import Image from "next/image";
import clockIcon from "@/assets/icons/clock.png";
import { TradersCopyingItem } from "@/service";

const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} d`;
  } else if (hours > 0) {
    return `${hours} h`;
  } else if (minutes > 0) {
    return `${minutes} m`;
  } else {
    return "now";
  }
};

const TraderCopyingItem = ({ data }: { data: TradersCopyingItem }) => {
  const firstLetter = data.name.charAt(0).toUpperCase();
  const timeAgo = formatTimeAgo(data.timestamp);

  return (
    <div
      className="mt-5 border-t pt-4 flex items-center justify-between gap-4"
      style={{
        borderTopColor: "rgba(23, 42, 48, 1)",
      }}
    >
      <div className="flex items-center flex-1 min-w-0">
        <p
          className="flex items-center justify-center font-medium text-base w-[36px] h-[36px] rounded-full flex-shrink-0"
          style={{
            backgroundColor: "rgba(37, 40, 202, 1)",
          }}
        >
          {firstLetter}
        </p>
        <div className="flex flex-col ml-3 min-w-0 flex-1">
          <p className="font-medium text-base truncate">{data.name}</p>
          <p
            className="flex items-center font-light text-sm min-w-0"
            style={{ color: "rgba(165, 176, 176, 1)" }}
          >
            <span className="truncate">@{data.twitterId}</span>
            <Image
              src={clockIcon}
              alt="clock"
              width={10}
              height={10}
              className="ml-2 flex-shrink-0"
            />
            <span className="ml-1 flex-shrink-0">{timeAgo}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center flex-shrink-0 gap-6">
        <div className="flex flex-col items-end">
          <p
            className="w-full font-medium text-base whitespace-nowrap align-left"
            style={{
              background: "linear-gradient(0deg, #50D2C1, #028C7A)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {data.signalCount}
          </p>
          <p className="text-sm whitespace-nowrap" style={{ color: "rgba(165, 176, 176, 1)" }}>
            Signals
          </p>
        </div>
        <div className="flex flex-col items-end">
          <p
            className="w-full font-medium text-base whitespace-nowrap align-left"
            style={{
              color: "rgba(79, 202, 21, 1)",
            }}
          >
            ${data.pnlValue.toLocaleString()}
          </p>
          <p className="text-sm whitespace-nowrap" style={{ color: "rgba(165, 176, 176, 1)" }}>
            $ Generated
          </p>
        </div>
      </div>
    </div>
  );
};

export default TraderCopyingItem;
