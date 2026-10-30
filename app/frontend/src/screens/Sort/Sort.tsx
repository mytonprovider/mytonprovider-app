import { tick } from "@/lib/telegram";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon/Icon";
import { MainButton } from "@/components/MainButton";
import { SORT_FIELDS } from "@/data/query";
import { useT } from "@/i18n";
import { cx } from "@/lib/cx";
import { useCatalogQuery } from "@/stores/catalogQuery";
import { useNavigate } from "react-router-dom";
import styles from "./Sort.module.css";

export function Sort() {
  const t = useT();
  const navigate = useNavigate();

  const sort = useCatalogQuery((s) => s.sort);
  const setSortField = useCatalogQuery((s) => s.setSortField);

  // The list sorts behind the sheet as the row is tapped, so the button only puts the sheet away.
  return (
    <>
      <div className={styles.title}>{t.sortBy}</div>
      <Card>
        {SORT_FIELDS.map((field) => {
          const active = sort.field === field;
          return (
            <button
              key={field}
              type="button"
              className={styles.row}
              onClick={() => {
                tick();
                setSortField(field);
              }}
            >
              <span className={cx(styles.label, active && styles.labelActive)}>{t.sortField[field]}</span>
              {active && (
                <span className={styles.dir}>
                  {t.sortDir[sort.dir]}
                  <span className={cx(styles.chevron, sort.dir === "asc" && styles.chevronUp)}>
                    <Icon glyph="chevronDown" size={16} color="var(--ts-accent)" />
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </Card>
      <div className={styles.action}>
        <MainButton label={t.done} onClick={() => navigate(-1)} />
      </div>
    </>
  );
}
