import { ConfirmBody } from "@myton/ui";
import type { ReactNode } from "react";
import { BottomSheet } from "@/components/BottomSheet";

interface ConfirmSheetProps {
  title: string;
  subtitle?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmSheet({ title, subtitle, confirmLabel, onConfirm, onClose }: ConfirmSheetProps) {
  return (
    <BottomSheet title={title} subtitle={subtitle} onClose={onClose}>
      {(close) => <ConfirmBody confirmLabel={confirmLabel} onConfirm={onConfirm} close={close} />}
    </BottomSheet>
  );
}
