import { BottomBar } from "@/components/BottomBar";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon/Icon";
import { MainButton } from "@/components/MainButton";
import { RangeSlider } from "@/components/RangeSlider";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { SegmentControl } from "@/components/SegmentControl";
import { Toggle } from "@/components/Toggle";
import { facetOptions, selectCatalog } from "@/data/query";
import type { CatalogFilters, FacetKey, Range, RangeKey } from "@/data/types";
import { useT } from "@/i18n";
import type { DictStringKey } from "@/i18n/types";
import { cx } from "@/lib/cx";
import { useCatalog } from "@/stores/catalog";
import { useCatalogQuery } from "@/stores/catalogQuery";
import { useNames } from "@/stores/names";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import styles from "./Filters.module.css";

const SLIDER_META: Record<RangeKey, { labelKey: DictStringKey; dec: number; step: number; unit: string; unitKey?: DictStringKey }> = {
  rating: { labelKey: "ratingF", dec: 2, step: 0.01, unit: "" },
  uptime: { labelKey: "uptimeF", dec: 2, step: 0.01, unit: "%" },
  price: { labelKey: "priceF", dec: 2, step: 0.01, unit: "GRAM" },
  bag: { labelKey: "bagF", dec: 0, step: 1, unit: "GB" },
  cores: { labelKey: "coresF", dec: 0, step: 1, unit: "" },
  ram: { labelKey: "ramF", dec: 0, step: 1, unit: "GB" },
  age: { labelKey: "ageF", dec: 0, step: 1, unit: "", unitKey: "unitDays" },
  minSpan: { labelKey: "minSpanF", dec: 0, step: 1, unit: "", unitKey: "unitDays" },
  maxSpan: { labelKey: "maxSpanF", dec: 0, step: 1, unit: "", unitKey: "unitDays" },
  space: { labelKey: "spaceF", dec: 0, step: 10, unit: "GB" },
  diskRead: { labelKey: "diskReadF", dec: 0, step: 10, unit: "MiB/s" },
  diskWrite: { labelKey: "diskWriteF", dec: 0, step: 10, unit: "MiB/s" },
  download: { labelKey: "downloadF", dec: 0, step: 10, unit: "Mbit/s" },
  upload: { labelKey: "uploadF", dec: 0, step: 10, unit: "Mbit/s" },
  ping: { labelKey: "pingF", dec: 0, step: 1, unit: "ms" },
};

const PROVIDER_SLIDERS: RangeKey[] = ["rating", "uptime", "price", "bag", "age", "minSpan", "maxSpan"];
const HARDWARE_SLIDERS: RangeKey[] = ["cores", "ram", "space", "diskRead", "diskWrite", "download", "upload", "ping"];

function FilterSlider({
  sliderKey,
  bounds,
  value,
  onChange,
}: {
  sliderKey: RangeKey;
  bounds: Range;
  value: Range;
  onChange: (value: Range) => void;
}) {
  const t = useT();
  const meta = SLIDER_META[sliderKey];
  const unit = meta.unitKey ? t[meta.unitKey] : meta.unit;
  const valueText = `${value[0].toFixed(meta.dec)} – ${value[1].toFixed(meta.dec)}${unit ? ` ${unit}` : ""}`;
  return (
    <div className={styles.sliderBlock}>
      <div className={styles.sliderHead}>
        <span className={styles.sliderLabel}>{t[meta.labelKey]}</span>
        <span className={styles.sliderValue}>{valueText}</span>
      </div>
      <RangeSlider value={value} min={bounds[0]} max={bounds[1]} step={meta.step} onChange={onChange} />
    </div>
  );
}

function FacetRow({ facet, value, anyLabel, mono }: { facet: FacetKey; value: string[]; anyLabel: string; mono?: boolean }) {
  const t = useT();
  const navigate = useNavigate();
  const providers = useCatalog((s) => s.providers);
  const options = useMemo(() => facetOptions(providers, facet), [providers, facet]);
  const label = value.length === 0 ? anyLabel : (options.find((option) => value.includes(option.value))?.label ?? value[0]);

  return (
    <button type="button" className={styles.facetRow} onClick={() => navigate(`/filters/${facet}`)}>
      <span className={styles.sliderLabel}>{t[facet]}</span>
      <span className={styles.facetValue}>
        <span className={cx(mono && value.length > 0 && styles.facetMono)}>{label}</span>
        {value.length > 1 && <span className={styles.facetMore}>+{value.length - 1}</span>}
        <Icon glyph="chevron" size={16} color="var(--ts-hint)" />
      </span>
    </button>
  );
}

export function Filters() {
  const t = useT();
  const navigate = useNavigate();

  const providers = useCatalog((s) => s.providers);

  const names = useNames((s) => s.providers);
  const bounds = useCatalog((s) => s.bounds);
  const load = useCatalog((s) => s.load);

  const filters = useCatalogQuery((s) => s.filters);
  const sort = useCatalogQuery((s) => s.sort);
  const search = useCatalogQuery((s) => s.search);
  const setSearch = useCatalogQuery((s) => s.setSearch);
  const setFilters = useCatalogQuery((s) => s.setFilters);
  const resetFilters = useCatalogQuery((s) => s.resetFilters);

  useEffect(() => {
    void load();
  }, [load]);

  const resultCount = useMemo(
    () => selectCatalog(providers, { only: null, search: "", filters, sort, names, bounds }).length,
    [providers, filters, sort, names, bounds],
  );

  const patch = (part: Partial<CatalogFilters>) => setFilters({ ...filters, ...part });
  const setRange = (key: RangeKey) => (range: Range) => patch({ [key]: range });

  const back = () => navigate(-1);

  // A search reaches past the filters, so leaving it on would show the list the count does not mean.
  const done = () => {
    if (search) setSearch("");
    navigate(-1);
  };

  const header = (
    <ScreenHeader
      title={t.filters}
      onBack={back}
      right={
        <button type="button" className={styles.reset} onClick={resetFilters}>
          {t.reset}
        </button>
      }
    />
  );

  if (!bounds) {
    return <Screen header={header}>{null}</Screen>;
  }

  return (
    <Screen
      header={header}
      bottom={
        <BottomBar>
          <MainButton label={t.showResults(resultCount)} onClick={done} />
        </BottomBar>
      }
    >
      <SectionHeader title={t.providerGroup} />
      <Card className={styles.padCard}>
        {PROVIDER_SLIDERS.map((key) => (
          <FilterSlider
            key={key}
            sliderKey={key}
            bounds={bounds[key]}
            value={filters[key] ?? bounds[key]}
            onChange={setRange(key)}
          />
        ))}
        <FacetRow facet="location" value={filters.location} anyLabel={t.anyLoc} />
      </Card>

      <SectionHeader title={t.hardware} />
      <Card className={styles.padCard}>
        {HARDWARE_SLIDERS.map((key) => (
          <FilterSlider
            key={key}
            sliderKey={key}
            bounds={bounds[key]}
            value={filters[key] ?? bounds[key]}
            onChange={setRange(key)}
          />
        ))}
        <div className={styles.subLabel}>{t.cpuVirtual}</div>
        <div className={styles.segWrap}>
          <SegmentControl<boolean | null>
            options={[
              { value: null, label: t.any },
              { value: true, label: t.yes },
              { value: false, label: t.no },
            ]}
            value={filters.cpuVirtual}
            onChange={(value) => patch({ cpuVirtual: value })}
            height={33}
            fontSize={13.5}
          />
        </div>
      </Card>

      <SectionHeader title={t.software} />
      <Card className={styles.padCard}>
        <FacetRow facet="storageHash" value={filters.storageHash} anyLabel={t.any} mono />
        <FacetRow facet="providerHash" value={filters.providerHash} anyLabel={t.any} mono />
      </Card>

      <SectionHeader title={t.statusGroup} />
      <Card className={styles.padCard}>
        <div className={styles.toggleRow}>
          <span className={styles.toggleLabel}>{t.freeSpace}</span>
          <Toggle checked={filters.freeSpace} onChange={(value) => patch({ freeSpace: value })} ariaLabel={t.freeSpace} />
        </div>
        <div className={styles.subLabel}>{t.sendTelemetry}</div>
        <div className={styles.segWrap}>
          <SegmentControl<boolean | null>
            options={[
              { value: null, label: t.any },
              { value: true, label: t.yes },
              { value: false, label: t.no },
            ]}
            value={filters.telemetry}
            onChange={(value) => patch({ telemetry: value })}
            height={33}
            fontSize={13.5}
          />
        </div>
        <div className={styles.subLabel}>{t.statusF}</div>
        <SegmentControl<boolean>
          options={[
            { value: false, label: t.any },
            { value: true, label: t.stableOnly },
          ]}
          value={filters.stableOnly}
          onChange={(value) => patch({ stableOnly: value })}
          height={33}
          fontSize={13.5}
        />
      </Card>
    </Screen>
  );
}
