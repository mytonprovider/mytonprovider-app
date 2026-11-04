import { Callout } from "@/components/Callout";
import { CopyRow } from "@/components/CopyRow";
import { ExplorerAddressRow } from "@/components/ExplorerAddressRow";
import { Field } from "@/components/Field";
import { FieldRow } from "@/components/FieldRow";
import { ProviderHeader } from "@/components/ProviderHeader";
import { Screen } from "@/components/Screen";
import { StatusDot } from "@/components/StatusDot";
import type { Bag, BagFilter } from "@/data/backend";
import { useRowWindow } from "@/hooks/useRowWindow";
import { useT } from "@/i18n";
import type { DictStringKey } from "@/i18n/types";
import { toUserFriendly } from "@/lib/address";
import { toneColor, toneText } from "@/lib/colors";
import { EMPTY, ago, formatBytes, shorten } from "@/lib/format";
import { bagGatewayUrl } from "@/lib/gateway";
import { onRevalidate } from "@/lib/revalidate";
import { COLD_CARDS } from "@/lib/skeletons";
import { describeStatus, filterTone, reasonText, reasonTone, stateText, stateTone } from "@/lib/status";
import { useCatalog } from "@/stores/catalog";
import { bucketKey, useProviderBags } from "@/stores/providerBags";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import styles from "./ProviderBags.module.css";

const TITLES: Record<BagFilter, DictStringKey> = {
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
  return value != null && value !== "all" && value in TITLES ? (value as BagFilter) : "all";
}

export function ProviderBags() {
  const t = useT();
  const navigate = useNavigate();
  const { pubkey = "" } = useParams();
  const [params] = useSearchParams();
  const state = readState(params.get("state"));

  const providers = useCatalog((s) => s.providers);
  const loadCatalog = useCatalog((s) => s.load);
  const provider = providers.find((p) => p.pubkey === pubkey);

  const bucket = useProviderBags((s) => s.buckets[bucketKey(pubkey, state)]);
  const loadBucket = useProviderBags((s) => s.load);

  const [query, setQuery] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    setFailed(false);
    const reload = () => loadBucket(pubkey, state).catch(() => setFailed(true));
    void reload();
    return onRevalidate(() => void reload());
  }, [pubkey, state, loadBucket]);

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

  const openBag = (bag: Bag) => (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("a")) return;
    navigate(`/bags?q=${encodeURIComponent(bag.address)}`);
  };

  const view = provider ? describeStatus(provider, t) : null;
  const tone = view?.tone ?? "gray";
  const nowSec = Math.floor(Date.now() / 1000);
  const header = <ProviderHeader pubkey={pubkey} color={toneColor(tone)} onBack={() => navigate(-1)} />;

  return (
    <Screen header={header}>
      <div className={styles.about}>
        <div className={styles.aboutHead}>
          <StatusDot color={toneColor(filterTone(state))} size={8} />
          {t[TITLES[state]]}
        </div>
        <div className={styles.aboutText}>{t.bagsAbout[state]}</div>
      </div>
      <Field
        glyph="search"
        className={styles.search}
        value={query}
        onChange={setQuery}
        placeholder={t.bagsSearch}
        enterKeyHint="search"
      />
      {loading ? (
        <>
          <div className={styles.count}>
            <span className={styles.countBar} />
          </div>
          <div className={styles.list}>
            {Array.from({ length: COLD_CARDS }, (_, i) => (
              <BagCardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : failed && bucket === undefined ? (
        <Callout glyph="close" title={t.bagsLoadError} iconColor="var(--ts-hint)" />
      ) : found.length === 0 ? (
        <Callout glyph="search" title={t.bagsNothingFound} iconColor="var(--ts-hint)" />
      ) : (
        <>
          <div className={styles.count}>
            {truncated ? t.showing(items.length, bucket.total) : `${t[TITLES[state]]} · ${found.length}`}
          </div>
          <div ref={listRef} className={styles.list} style={{ paddingTop: padTop, paddingBottom: padBottom }}>
            {found.slice(start, end).map((bag) => (
              <div key={bag.address} className={styles.card} onClick={openBag(bag)}>
                <div className={styles.title} style={{ color: toneText(stateTone(bag.state)) }}>
                  {stateText(bag.state, t)}
                </div>
                <div className={styles.sub} style={bag.reason ? { color: toneText(reasonTone(bag.reason)) } : undefined}>
                  {reasonText(bag.reason, t)}
                </div>
                {bag.bag_id && (
                  <CopyRow label={t.bagId} copyValue={bag.bag_id} divider compact>
                    <a
                      className={styles.link}
                      href={bagGatewayUrl(bag.bag_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {shorten(bag.bag_id, 12).toUpperCase()}
                    </a>
                  </CopyRow>
                )}
                <ExplorerAddressRow label={t.bagContract} address={bag.address} divider compact />
                {bag.owner_address && (
                  <ExplorerAddressRow label={t.bagOwner} address={toUserFriendly(bag.owner_address)} divider compact />
                )}
                <FieldRow
                  label={t.lastProof}
                  value={bag.last_proof_at ? ago(nowSec - bag.last_proof_at, t) : EMPTY}
                  divider
                  compact
                />
                {bag.size != null && <FieldRow label={t.bagSize} value={formatBytes(bag.size)} divider compact />}
              </div>
            ))}
          </div>
        </>
      )}
    </Screen>
  );
}

// Rows the card will show once loaded: the first three carry a copy button and so
// stand taller.
const SKELETON_ROWS: { label: string; value: string; copy: boolean }[] = [
  { label: "12%", value: "34%", copy: true },
  { label: "22%", value: "30%", copy: true },
  { label: "24%", value: "40%", copy: true },
  { label: "26%", value: "22%", copy: false },
  { label: "18%", value: "18%", copy: false },
];

function BagCardSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.title}>
        <span className={styles.skTitle} />
      </div>
      <div className={styles.sub}>
        <span className={styles.skSub} />
      </div>
      {SKELETON_ROWS.map((row) => (
        <div key={row.label} className={row.copy ? styles.skRowCopy : styles.skRow}>
          <span className={styles.skBar} style={{ width: row.label }} />
          <span className={styles.skBar} style={{ width: row.value }} />
        </div>
      ))}
    </div>
  );
}
