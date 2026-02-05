import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { IDefaultFollowSettings } from "./defaultFollow";
import { OrderStyleEnum } from "../types";

export const SummaryDialog = ({
  onConfirm,
  defaultFollowSettings,
}: {
  onConfirm: () => void;
  defaultFollowSettings: IDefaultFollowSettings;
}) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="text-xs text-teal-400 font-medium">read more...</button>
      </AlertDialogTrigger>
      <AlertDialogContent
        style={{
          backgroundColor: "rgb(14, 26, 30)",
          border: "1px solid rgba(27, 36, 41, 1)",
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Summary</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-sm">
            <p>
              <span className="text-gray-400">Trade Size:</span>{" "}
              <span className="text-white">
                {defaultFollowSettings.tradeSizeType === "USD"
                  ? `$${defaultFollowSettings.tradeSize}`
                  : `${defaultFollowSettings.tradeSize}%`}{" "}
                of your balance per copied trade
              </span>
            </p>
            <p>
              <span className="text-gray-400">Leverage:</span>{" "}
              <span className="text-white">
                {defaultFollowSettings.leverage}x {defaultFollowSettings.leverageType}
              </span>
            </p>
            <p>
              <span className="text-gray-400">Stop Loss:</span>{" "}
              <span className="text-orange-400">
                {defaultFollowSettings.cutLossType === "USD"
                  ? `$${defaultFollowSettings.cutLoss}`
                  : `${defaultFollowSettings.cutLoss}%`}
              </span>
            </p>
            <p>
              <span className="text-gray-400">Take Profit:</span>{" "}
              <span className="text-green-400">
                {defaultFollowSettings.takeProfitType === "USD"
                  ? `$${defaultFollowSettings.takeProfit}`
                  : `${defaultFollowSettings.takeProfit}%`}
              </span>
            </p>
            <p>
              <span className="text-gray-400">Order Type:</span>{" "}
              <span className="text-white">
                {defaultFollowSettings.orderStyle === OrderStyleEnum.market ? "Market" : "Limit"}
              </span>
            </p>
            <p>
              <span className="text-gray-400">Max Positions:</span>{" "}
              <span className="text-white">{defaultFollowSettings.maxPositions}</span>
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row gap-8 justify-center">
          <AlertDialogAction
            className="w-full"
            style={{
              backgroundColor: "rgba(45,212,191,1)",
              color: "#0a0f14",
            }}
            onClick={onConfirm}
          >
            Got it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};