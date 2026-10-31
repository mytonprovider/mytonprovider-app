import { BottomBar } from "@/components/BottomBar";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon/Icon";
import { MainButton } from "@/components/MainButton";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { facetOptions } from "@/data/query";
import type { FacetKey } from "@/data/types";
import { useT } from "@/i18n";
import { cx } from "@/lib/cx";
import { tick } from "@/lib/telegram";
import { useCatalog } from "@/stores/catalog";
import { useCatalogQuery } from "@/stores/catalogQuery";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import styles from "./Filters.module.css";

export function FacetPicker({ facet }: { facet: FacetKey }) {
  const t = useT();
  const navigate = useNavigate();

  const providers = useCatalog((s) => s.providers);
  const load = useCatalog((s) => s.load);
  const filters = useCatalogQuery((s) => s.filters);
  const setFilters = useCatalogQuery((s) => s.setFilters);
  const options = useMemo(() => facetOptions(providers, facet), [providers, facet]);

  useEffect(() => {
    void load();
  }, [load]);

  const picked = filters[facet];
  const mono = facet !== "location";
  const pick = (values: string[]) => setFilters({ ...filters, [facet]: values });

  // List order, not tap order, so the row in the card always names the same country.
  const toggle = (value: string) => {
    tick();
    const next = picked.includes(value) ? picked.filter((item) => item !== value) : [...picked, value];
    pick(options.filter((option) => next.includes(option.value)).map((option) => option.value));
  };

  const header = (
    <ScreenHeader
      title={t[facet]}
      onBack={() => navigate(-1)}
      right={
        picked.length > 0 ? (
          <button type="button" className={styles.reset} onClick={() => pick([])}>
            {t.reset}
          </button>
        ) : undefined
      }
    />
  );

  return (
    <Screen
      header={header}
      bottom={
        <BottomBar>
          <MainButton label={t.done} onClick={() => navigate(-1)} />
        </BottomBar>
      }
    >
      <Card className={styles.pickerCard}>
        {options.map((option) => {
          const active = picked.includes(option.value);
          return (
            <button key={option.value} type="button" className={styles.option} onClick={() => toggle(option.value)}>
              <span className={styles.tick}>
                {active && <Icon glyph="check" size={17} color="var(--ts-accent)" />}
              </span>
              <span className={cx(styles.optionName, mono && styles.optionMono, active && styles.optionActive)}>
                {option.label}
              </span>
              <span className={styles.optionCount}>{option.count}</span>
            </button>
          );
        })}
      </Card>
    </Screen>
  );
}
