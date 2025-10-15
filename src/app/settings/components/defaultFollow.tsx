import Divider from "@/components/divider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DefaultFollow() {
  return (
    <div className="mt-8">
      <p className="flex justify-between items-center">
        <span className="font-semibold text-xl">Filter Types</span>
        <span className="text-sm" style={{ color: "rgba(80, 210, 193, 1)" }}>
          Balance: $180000
        </span>
      </p>
      <p className="mt-5 mb-2">
        <Divider />
      </p>
      {/* Risk management */}
      <div>
        <p className="font-semibold text-base">Risk management</p>
        <div
          className="mt-2 rounded-[16px] w-full h-[52px] flex items-center pr-2"
          style={{
            backgroundColor: "rgba(13, 23, 28, 1)",
            borderWidth: "1px",
            borderColor: "rgba(27, 36, 41, 1)",
          }}
        >
          <div className="relative flex items-center w-full mr-4">
            <Label
              htmlFor="tradeSize"
              className="absolute left-4 text-sm text-muted-foreground pointer-events-none"
            >
              Trade Sizing
            </Label>
            <Input
              id="tradeSize"
              name="tradeSize"
              className="h-[34px] pl-[100px] text-right border-none"
              placeholder=""
            />
          </div>
          <Button
            className="w-[34px] h-[34px] rounded-lg font-medium text-sm"
            style={{
              backgroundColor: "rgba(80, 210, 193, 1)",
              color: "rgba(15, 26, 31, 1)",
            }}
          >
            $
          </Button>
          <Button
            className="w-[34px] h-[34px] rounded-lg font-medium text-sm ml-1"
            style={{
              borderWidth: "1px",
              borderColor: "rgba(80, 210, 193, 1)",
              color: "rgba(128, 236, 184, 1)",
            }}
          >
            %
          </Button>
        </div>
        <div
          className="mt-2 rounded-[16px] w-full h-[52px] flex items-center relative"
          style={{
            backgroundColor: "rgba(13, 23, 28, 1)",
            borderWidth: "1px",
            borderColor: "rgba(27, 36, 41, 1)",
          }}
        >
          <Label
            htmlFor="leverage"
            className="absolute left-4 text-sm text-muted-foreground pointer-events-none"
          >
            Leverage
          </Label>
          <Input
            id="leverage"
            name="leverage"
            className="h-full pl-[100px] text-right border-none"
            placeholder=""
            value="5x"
          />
        </div>
      </div>
    </div>
  );
}
