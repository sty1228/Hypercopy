"use client";

interface TimeRangeTabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

const TimeRangeTab = ({
  label,
  isActive,
  onClick,
  className = "",
}: TimeRangeTabProps) => {
  // 根据标签长度决定宽度
  const widthClass = label.length <= 1 ? "w-[18px]" : "w-[22px]";

  return (
    <div
      className={`flex flex-col cursor-pointer ${className}`}
      onClick={onClick}
    >
      <span
        className={`${widthClass} flex justify-center text-xs`}
        style={{
          color: isActive ? "rgba(80, 210, 193, 1)" : "rgba(165, 176, 176, 1)",
        }}
      >
        {label}
      </span>
      {isActive && (
        <span
          className="h-[2px] rounded-[1px] mt-1"
          style={{ backgroundColor: "rgba(80, 210, 193, 1)" }}
        />
      )}
    </div>
  );
};

export default TimeRangeTab;
