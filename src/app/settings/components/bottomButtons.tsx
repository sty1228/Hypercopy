import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";

export default function BottomButtons({
  onCancel,
  onSave,
  onReset,
  hasChanges = false,
}: {
  onCancel: () => void;
  onSave: () => void;
  onReset: () => void;
  hasChanges?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <ConfirmDialog
          triggerText="Cancel"
          triggerClassName="flex-1 h-14 rounded-2xl font-semibold text-sm transition-all border border-white/15 text-white/70 bg-transparent hover:bg-white/5"
          title="Confirm revert changes"
          description="This action will revert all changes you have made to previous settings."
          onConfirm={onCancel}
        />
        <button
          className="flex-1 h-14 rounded-2xl font-semibold text-sm transition-all"
          style={{
            background: hasChanges ? "rgba(45,212,191,1)" : "rgba(45,212,191,0.5)",
            color: "#0a0f14",
            boxShadow: hasChanges ? "0 0 25px rgba(45,212,191,0.4)" : "none",
          }}
          onClick={onSave}
        >
          Save Changes
        </button>
      </div>
      <ConfirmDialog
        triggerText="Reset to default"
        triggerClassName="w-full h-12 rounded-2xl text-sm transition-all text-white/40 bg-transparent hover:text-white/60"
        title="Confirm reset to default settings"
        description="This action will reset all settings to default."
        onConfirm={onReset}
      />
    </div>
  );
}