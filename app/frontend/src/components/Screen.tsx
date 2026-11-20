import { cx } from "@myton/ui";
import type { ReactNode } from "react";
import styles from "./Screen.module.css";

interface ScreenProps {
  header: ReactNode;
  children: ReactNode;
  bottom?: ReactNode;
  // Content that keeps its own side inset, as the package's panels do, runs edge to edge
  flush?: boolean;
}

export function Screen({ header, children, bottom, flush = false }: ScreenProps) {
  return (
    <div className={styles.screen}>
      {header}
      <div className={cx(styles.scroll, flush && styles.flush)}>{children}</div>
      {bottom}
    </div>
  );
}
