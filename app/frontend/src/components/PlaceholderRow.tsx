import { skeletonClass } from "@myton/ui";
import styles from "./PlaceholderRow.module.css";

export interface PlaceholderWidths {
  label: string;
  value: string;
}

export function PlaceholderRow({ label, value }: PlaceholderWidths) {
  return (
    <div className={styles.row}>
      <span className={skeletonClass(styles.bar)} style={{ width: label }} />
      <span className={skeletonClass(styles.bar)} style={{ width: value }} />
    </div>
  );
}
