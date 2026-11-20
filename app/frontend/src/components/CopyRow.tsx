import { FieldRow, useCopyFeedback } from "@myton/ui";
import type { ReactNode } from "react";

interface CopyRowProps {
  label: string;
  copyValue: string | null;
  title?: string;
  mono?: boolean;
  children: ReactNode;
}

export function CopyRow({ label, copyValue, title, mono, children }: CopyRowProps) {
  const { copied, copy } = useCopyFeedback();

  return (
    <FieldRow
      label={label}
      value={children}
      title={title}
      mono={mono}
      copy={copyValue ?? undefined}
      copied={copyValue !== null && copied === copyValue}
      onCopy={(value) => void copy(value)}
    />
  );
}
