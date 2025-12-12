import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
export default function BottomButtons({
  onCancel,
  onSave,
  onReset,
}: {
  onCancel: () => void;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="mt-8">
      <div className="w-full flex gap-2">
        <ConfirmDialog
          triggerText="Cancel"
          triggerClassName="flex-1 h-[52px] rounded-[16px] font-semibold text-base border-1"
          title="Confirm revert changes"
          description="This action will revert all changes you have made to previous settings."
          onConfirm={onCancel}
        />
        <Button
          className="flex-1 h-[52px] rounded-[16px] font-semibold text-base "
          style={{
            backgroundColor: "rgba(80, 210, 193, 1)",
            color: "rgba(15, 26, 31, 1)",
          }}
          onClick={onSave}
        >
          Save
        </Button>
      </div>

      <ConfirmDialog
        triggerText="Reset to default"
        triggerClassName="mt-4 w-full h-[52px] rounded-[16px] font-semibold text-base border-1"
        title="Confirm reset to default settings"
        description="This action will reset all settings to default."
        onConfirm={onReset}
      />
    </div>
  );
}
