import { SheetHeader } from "@myton/ui";
import { bindBackButton } from "@/lib/telegram";
import { type ReactNode, useEffect, useRef } from "react";
import styles from "./ScreenHeader.module.css";

interface ScreenHeaderProps {
  title: string;
  badge?: number;
  lead?: ReactNode;
  onBack: () => void;
  right?: ReactNode;
}

// Every route past the list opens as a sheet, so its header is the sites' one; the close stays in Telegram too,
// next to the system back button.
export function ScreenHeader({ title, badge, lead, onBack, right }: ScreenHeaderProps) {
  const handler = useRef(onBack);
  handler.current = onBack;

  useEffect(() => bindBackButton(() => handler.current()), []);

  return (
    <SheetHeader
      title={title}
      badge={badge}
      lead={lead}
      actions={right}
      grabber={false}
      onClose={onBack}
      className={styles.header}
    />
  );
}
