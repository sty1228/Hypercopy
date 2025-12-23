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
import { OrderStyleEnum } from "../page";

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
        <p
          className="font-medium text-xs"
          style={{ color: "rgba(80, 210, 193, 1)" }}
        >
          read more...
        </p>
      </AlertDialogTrigger>
      <AlertDialogContent
        style={{
          backgroundColor: "rgb(14, 26, 30)",
          border: "1px solid rgba(27, 36, 41, 1)",
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Summary</AlertDialogTitle>
          <AlertDialogDescription>
            {" "}
            You will be taking profit at{" "}
            {defaultFollowSettings.takeProfitType === "USD"
              ? `$${defaultFollowSettings.takeProfit}`
              : `${defaultFollowSettings.takeProfit}%`}{" "}
            and cut loss at{" "}
            {defaultFollowSettings.cutLossType === "USD"
              ? `$${defaultFollowSettings.cutLoss}`
              : `${defaultFollowSettings.cutLoss}%`}{" "}
            ,with{" "}
            {defaultFollowSettings.orderStyle === OrderStyleEnum.market
              ? "market"
              : "limit"}{" "}
            order positions on {defaultFollowSettings.leverage}x leverage,
            {defaultFollowSettings.leverageType === "isolated"
              ? "isolated"
              : "cross"}{" "}
            to each position on your{" "}
            {defaultFollowSettings.tradeSizeType === "USD"
              ? `$${defaultFollowSettings.tradeSize}`
              : `${defaultFollowSettings.tradeSize}%`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row gap-8 justify-center">
          <AlertDialogAction
            className="w-full"
            style={{
              backgroundColor: "rgba(80, 210, 193, 1)",
              color: "rgba(15, 26, 31, 1)",
            }}
            onClick={onConfirm}
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
