import {
  Card,
  EmptyState,
  FieldList,
  FieldRow,
  LoadError,
  OpenRow,
  ShortId,
  skeletonClass,
  StatusDot,
} from "@myton/ui";
import { fmt, reasonTone, shortKey, toFriendly } from "@myton/ui/domain";
import { locales } from "@myton/ui/locale";
import { BagCardSkeleton } from "@/components/BagCardSkeleton";
import { CopyRow } from "@/components/CopyRow";
import { ExplorerAddressRow } from "@/components/ExplorerAddressRow";
import { Field } from "@/components/Field";
import type { PlaceholderWidths } from "@/components/PlaceholderRow";
import { ProviderHeader } from "@/components/ProviderHeader";
import { Screen } from "@/components/Screen";
import type { BagFilter } from "@/data/backend";
import { useRowWindow } from "@/hooks/useRowWindow";
import { useAppliedLang, useTimeWords } from "@/i18n";
import type { TextKey } from "@/i18n/types";
import { toneColor, toneText } from "@/lib/colors";
import { bagGatewayUrl } from "@/lib/gateway";
import { onRevalidate } from "@/lib/revalidate";
import { COLD_CARDS } from "@/lib/skeletons";
import { filterTone, reasonText, stateText, stateTone } from "@/lib/status";
import { bucketKey, useProviderBags } from "@/stores/providerBags";
import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router";
import styles from "./ProviderBags.module.css";

const TITLES: Record<BagFilter, TextKey> = {
  all: "bagsAll",
  confirmed: "bagsConfirmed",
  downloading: "bagsDownloading",
  not_paid: "bagsNotPaid",
  unavailable: "bagsUnavailable",
  not_confirmed: "bagsNotConfirmed",
  closed: "bagsClosed",
  not_accepted: "bagsNotAccepted",
  check: "bagsCheck",
};

function readState(value: string | null): BagFilter {
  return value != null && Object.prototype.hasOwnProperty.call(TITLES, value) ? (value as BagFilter) : "all";
}

export function ProviderBags() {
  const { t } = useTranslation();
  const time = useTimeWords();
  const locale = locales[useAppliedLang()];
  const navigate = useNavigate();
  const { pubkey = "" } = useParams();
  const [params] = useSearchParams();
  const state = readState(params.get("state"));

  const bucket = useProviderBags((s) => s.buckets[bucketKey(pubkey, state)]);
  const loadBucket = useProviderBags((s) => s.load);

  const [query, setQuery] = useState("");
  const [failed, setFailed] = useState(false);

  const reload = useCallback(() => {
    setFailed(false);
    loadBucket(pubkey, state).catch(() => setFailed(true));
  }, [pubkey, state, loadBucket]);

  useEffect(() => {
    reload();
    return onRevalidate(reload);
  }, [reload]);

  // The bucket is in memory, so the search filters it instead of asking the server: no
  // debounce, no flicker, and a return from a bag costs nothing.
  const term = query.trim().toLowerCase();
  const items = bucket?.items ?? [];
  const found = term
    ? items.filter((bag) => (bag.bag_id ?? "").startsWith(term) || bag.address.toLowerCase().startsWith(term))
    : items;
  const listRef = useRef<HTMLDivElement>(null);
  const { start, end, padTop, padBottom } = useRowWindow(listRef, found.length);
  const loading = bucket === undefined && !failed;
  const truncated = bucket !== undefined && items.length < bucket.total;

  const nowSec = Math.floor(Date.now() / 1000);
  const header = <ProviderHeader pubkey={pubkey} actions={false} onBack={() => navigate(-1)} />;

  return (
    <Screen header={header}>
      <Card pad="row" className={styles.about}>
        <div className={styles.aboutHead}>
          <StatusDot color={toneColor(filterTone(state))} size={8} />
          {t(TITLES[state])}
        </div>
        <div className={styles.aboutText}>{t(`bagsAbout.${state}`)}</div>
      </Card>
      <Field
        glyph="search"
        className={styles.search}
        value={query}
        onChange={setQuery}
        placeholder={t("bagsSearch")}
        enterKeyHint="search"
      />
      {loading ? (
        <>
          <div className={styles.count}>
            <span className={skeletonClass(styles.countBar)} />
          </div>
          <Card striped className={styles.list}>
            {Array.from({ length: COLD_CARDS }, (_, i) => (
              <BagCardSkeleton key={i} rows={SKELETON_ROWS} alt={i % 2 === 1} />
            ))}
          </Card>
        </>
      ) : failed && bucket === undefined ? (
        <LoadError size="lg" message={t("bagsLoadError")} onRetry={reload} />
      ) : found.length === 0 ? (
        <EmptyState size="lg" icon={Search} muted title={t("bagsNothingFound")} />
      ) : (
        <>
          <div className={styles.count}>
            {truncated ? t("showing", { shown: items.length, count: bucket.total }) : `${t(TITLES[state])} · ${found.length}`}
          </div>
          <Card striped ref={listRef} className={styles.list} style={{ paddingTop: padTop, paddingBottom: padBottom }}>
            {found.slice(start, end).map((bag, index) => (
              <OpenRow
                key={bag.address}
                onOpen={() => navigate(`/bags?q=${encodeURIComponent(bag.address)}`)}
                label={`${t("bagDetails")} ${shortKey(bag.address)}`}
                data-alt={(start + index) % 2 === 1 || undefined}
              >
                <div className={styles.title} style={{ color: toneText(stateTone(bag.state)) }}>
                  {stateText(bag.state, t)}
                </div>
                <div
                  className={styles.sub}
                  style={bag.reason ? { color: toneText(reasonTone(bag.reason)) } : undefined}
                >
                  {reasonText(bag.reason, locale)}
                </div>
                <FieldList divided className={styles.rows}>
                  {bag.bag_id && (
                    <CopyRow label={t("bagId")} copyValue={bag.bag_id} mono>
                      <a
                        className={styles.link}
                        href={bagGatewayUrl(bag.bag_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ShortId value={bag.bag_id} />
                      </a>
                    </CopyRow>
                  )}
                  <ExplorerAddressRow label={t("bagContract")} address={bag.address} />
                  {bag.owner_address && (
                    <ExplorerAddressRow
                      label={t("bagOwner")}
                      address={toFriendly(bag.owner_address) ?? bag.owner_address}
                    />
                  )}
                  <FieldRow label={t("lastProof")} value={fmt.ago(nowSec, bag.last_proof_at, time.ago)} />
                  {bag.size != null && <FieldRow label={t("bagSize")} value={fmt.bytes(bag.size)} />}
                </FieldList>
              </OpenRow>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

// Label and value widths of the rows the card will show once loaded.
const SKELETON_ROWS: PlaceholderWidths[] = [
  { label: "12%", value: "34%" },
  { label: "22%", value: "30%" },
  { label: "24%", value: "40%" },
  { label: "26%", value: "22%" },
  { label: "18%", value: "18%" },
];

