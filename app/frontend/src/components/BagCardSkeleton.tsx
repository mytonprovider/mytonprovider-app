import { FieldList, skeletonClass } from "@myton/ui";
import { PlaceholderRow, type PlaceholderWidths } from "@/components/PlaceholderRow";
import styles from "./BagCard.module.css";

// The bag card with its title, line and rows standing in: a provider's bags and a bag's providers share it.
export function BagCardSkeleton({ rows, alt }: { rows: PlaceholderWidths[]; alt: boolean }) {
  return (
    <div className={styles.skeleton} data-alt={alt || undefined}>
      <div className={styles.title}>
        <span className={skeletonClass(styles.shapeTitle)} />
      </div>
      <div className={styles.sub}>
        <span className={skeletonClass(styles.shapeSub)} />
      </div>
      <FieldList divided className={styles.rows}>
        {rows.map((row, index) => (
          <PlaceholderRow key={index} {...row} />
        ))}
      </FieldList>
    </div>
  );
}
