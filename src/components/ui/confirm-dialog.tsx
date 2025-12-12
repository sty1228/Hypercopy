import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  triggerText: string;
  triggerClassName?: string;
  title: string;
  description: string;
  onConfirm: () => void;
}

export function ConfirmDialog({
  triggerText,
  triggerClassName,
  title,
  description,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          className={triggerClassName || "h-[52px] rounded-[16px] font-semibold text-base border-1"}
          style={{
            borderColor: "rgba(80, 210, 193, 1)",
            color: "rgba(80, 210, 193, 1)",
          }}
        >
          {triggerText}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        style={{
          backgroundColor: "rgb(14, 26, 30)",
          border: "1px solid rgba(27, 36, 41, 1)",
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row gap-8 justify-center">
          <AlertDialogCancel
            style={{
              backgroundColor: "transparent",
              border: "1px solid rgba(27, 36, 41, 1)",
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
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
}

