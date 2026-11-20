import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./Callout.module.css";

interface CalloutProps {
  icon?: LucideIcon;
  leading?: ReactNode;
  title?: string;
  desc?: ReactNode;
  children?: ReactNode;
}

export function Callout({ icon: Mark, leading, title, desc, children }: CalloutProps) {
  // The colour comes from the disc's own CSS, not lucide's color prop: that prop paints only the stroke, and a filled
  // star or bell then took the text colour for its fill.
  const mark =
    leading ??
    (Mark ? (
      <span className={styles.disc}>
        <Mark size={19} fill="currentColor" />
      </span>
    ) : null);

  return (
    <div className={styles.root}>
      {mark ? <span className={styles.mark}>{mark}</span> : null}
      {title ? <div className={styles.title}>{title}</div> : null}
      {desc ? <div className={styles.desc}>{desc}</div> : null}
      {children ? <div className={styles.action}>{children}</div> : null}
    </div>
  );
}
