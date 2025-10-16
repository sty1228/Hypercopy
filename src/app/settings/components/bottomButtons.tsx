import { Button } from "@/components/ui/button";

{
  /* Cancel Save Reset buttons */
}
export default function BottomButtons() {
  return (
    <div className="mt-8">
      <div className="w-full flex gap-2">
        <Button
          className="flex-1 h-[52px] rounded-[16px] font-semibold text-base border-1"
          style={{
            borderColor: "rgba(80, 210, 193, 1)",
            color: "rgba(80, 210, 193, 1)",
          }}
        >
          Cancel
        </Button>
        <Button
          className="flex-1 h-[52px] rounded-[16px] font-semibold text-base "
          style={{
            backgroundColor: "rgba(80, 210, 193, 1)",
            color: "rgba(15, 26, 31, 1)",
          }}
        >
          Save
        </Button>
      </div>
      <Button
        className="mt-4 w-full h-[52px] rounded-[16px] font-semibold text-base border-1"
        style={{
          borderColor: "rgba(80, 210, 193, 1)",
          color: "rgba(80, 210, 193, 1)",
        }}
      >
        Reset to default
      </Button>
    </div>
  );
}
