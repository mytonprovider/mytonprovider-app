import {
  Badge,
  CopyButton,
  cx,
  FavoriteButton,
  FreeMark,
  OpenRow,
  RankMark,
  ShareButton,
  ShortId,
  skeletonClass,
  useCompactStatus,
} from "@myton/ui";
import { countryLabel, EMPTY, fmt, freeBytes, freePercent, providerStatus, shortKey } from "@myton/ui/domain";
import { locales, statusView } from "@myton/ui/locale";
import { Star } from "lucide-react";
import type { Provider } from "@/data/types";
import { useTranslation } from "react-i18next";
import { useAppliedLang, useTimeWords } from "@/i18n";
import { BLANK } from "@/lib/skeletons";
import { useNames } from "@/stores/names";
import { type ReactNode, useRef } from "react";
import { useProviderActions } from "@/hooks/useProviderActions";
import styles from "./ProviderRow.module.css";

interface ProviderRowProps {
  provider: Provider;
  onOpen: () => void;
  alt: boolean;
  viewed: boolean;
  rank: number | undefined;
}

function withUnits(text: string): ReactNode {
  return text.split(/([\d.,]+)/).map((part, index) =>
    !part || /^[\d.,]/.test(part) ? (
      part
    ) : (
      <span key={index} className={styles.unit}>
        {part}
      </span>
    ),
  );
}

export function ProviderRow({ provider, onOpen, alt, viewed, rank }: ProviderRowProps) {
  const { t } = useTranslation();
  const time = useTimeWords();
  const lang = useAppliedLang();
  const locale = locales[lang];
  const columns = locale.columns;
  const status = statusView(providerStatus(provider), lang);
  const actions = useProviderActions(provider.pubkey);
  const headRef = useRef<HTMLDivElement>(null);
  const compact = useCompactStatus(headRef);
  const name = useNames((s) => s.providers[provider.pubkey]);
  const free = freePercent(provider);
  const place = countryLabel(provider.location) ?? EMPTY;
  const working = (provider.workingTime ?? 0) > 0 ? fmt.duration(provider.workingTime, time.duration, 2) : EMPTY;

  const cell = (label: ReactNode, value: ReactNode) => (
    <span className={styles.cell}>
      <span className={styles.cellLabel}>{label}</span>
      <span className={styles.cellValue}>{value}</span>
    </span>
  );

  return (
    <OpenRow
      onOpen={onOpen}
      label={`${t("providerDetails")} ${name || shortKey(provider.pubkey)}`}
      viewed={viewed}
      data-alt={alt || undefined}
      className={styles.row}
    >
      <div ref={headRef} className={styles.head}>
        <FavoriteButton size="sm" {...actions.favorite} />
        {name ? <span className={styles.name}>{name}</span> : <ShortId value={provider.pubkey} className={styles.pk} />}
        <CopyButton {...actions.copy} />
        <Badge tone={status.tone} dot compact={compact} reserve={Object.values(locale.status)} className={styles.status}>
          {status.label}
        </Badge>
        {actions.share && <ShareButton size="sm" {...actions.share} />}
      </div>
      <div className={styles.cells}>
        {cell(
          rank ? (
            <>
              {columns.rating}
              <RankMark rank={rank} />
            </>
          ) : (
            columns.rating
          ),
          <>
            <Star className={styles.star} aria-hidden="true" />
            {fmt.number(provider.rating, 2)}
          </>,
        )}
        {cell(columns.uptime, fmt.percent(provider.uptime))}
        {cell(columns.price, withUnits(fmt.tonLabel(provider.price)))}
        {cell(
          free === null ? (
            columns.freeSpace
          ) : (
            <>
              {columns.freeSpace}
              <FreeMark percent={free} />
            </>
          ),
          withUnits(fmt.space(freeBytes(provider))),
        )}
        {cell(columns.workingTime, working)}
        {cell(columns.location, place)}
      </div>
    </OpenRow>
  );
}

const CELL_COUNT = 6;

export function ProviderRowPlaceholder({ alt }: { alt: boolean }) {
  const locale = locales[useAppliedLang()];
  return (
    <div className={styles.placeholder} data-alt={alt || undefined}>
      <div className={styles.head}>
        <span className={skeletonClass(styles.shapeToggle)} />
        <span className={skeletonClass(cx(styles.pk, styles.shapeKey))}>{BLANK}</span>
        <Badge
          tone="gray"
          dot
          reserve={Object.values(locale.status)}
          className={skeletonClass(cx(styles.status, styles.shapeStatus))}
        >
          {BLANK}
        </Badge>
      </div>
      <div className={styles.cells}>
        {Array.from({ length: CELL_COUNT }, (_, cell) => (
          <span key={cell} className={styles.cell}>
            <span className={skeletonClass(cx(styles.cellLabel, styles.shapeLabel))}>{BLANK}</span>
            <span className={skeletonClass(cx(styles.cellValue, styles.shapeValue))}>{BLANK}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
