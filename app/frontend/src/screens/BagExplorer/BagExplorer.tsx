import {
  buttonClass,
  Card,
  EmptyState,
  FieldGroup,
  FieldList,
  FieldRow,
  GhostValue,
  LoadError,
  OpenRow,
  ShortId,
  skeletonClass,
} from "@myton/ui";
import {
  EMPTY,
  fmt,
  parseAddress,
  ratioState,
  reasonTone,
  shortKey,
  STATE_TONE,
  toFriendly,
  type StatusTone,
} from "@myton/ui/domain";
import { locales, type TimeWords } from "@myton/ui/locale";
import { BagCardSkeleton } from "@/components/BagCardSkeleton";
import { CopyRow } from "@/components/CopyRow";
import { ExplorerAddressRow } from "@/components/ExplorerAddressRow";
import { Field } from "@/components/Field";
import { MetricTile } from "@/components/MetricTile";
import { PlaceholderRow, type PlaceholderWidths } from "@/components/PlaceholderRow";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { BackendError, backend, type BagPayload, type BagProvider } from "@/data/backend";
import type { Provider } from "@/data/types";
import { useAppliedLang, useTimeWords } from "@/i18n";
import { toneText } from "@/lib/colors";
import { bagGatewayUrl } from "@/lib/gateway";
import { reasonText, stateText, stateTone } from "@/lib/status";
import { useCatalog } from "@/stores/catalog";
import { useNames } from "@/stores/names";
import { useSubscriptions } from "@/stores/subscriptions";
import type { TFunction } from "i18next";
import { Info, Search, TriangleAlert, X } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import styles from "./BagExplorer.module.css";
import list from "@/styles/list.module.css";

const REPORT_BOT = "https://t.me/bagidreport_bot";
// Catalogue quotes per 200 GB per month, the contract per MB per day - same divisor as the backend.
const PRICE_MB_DAYS = 200 * 1024 * 30;
const BAG_ID_RE = /^[0-9a-fA-F]{64}$/;

type QueryKind = "bag" | "address";

function classify(query: string): QueryKind | null {
  if (BAG_ID_RE.test(query)) return "bag";
  if (parseAddress(query)) return "address";
  return null;
}

// A hash is content, and several owners may pay for it, so the answer is a list: one
// contract for an address, as many as were hired for a bag id.
async function resolveBag(query: string, kind: QueryKind): Promise<BagPayload[]> {
  const search = kind === "bag" ? query.toLowerCase() : query;
  try {
    const { bags } = await backend.bag(search);
    return bags;
  } catch (error) {
    if (error instanceof BackendError && error.status === 404) return [];
    throw error;
  }
}

// A running contract was signed on older terms, so only a hire that never happened is flagged.
function mismatch(prov: BagProvider, listed: Provider | undefined): { span: boolean; rate: boolean } {
  if (prov.state !== "not_accepted" || !listed) return { span: false, rate: false };
  return {
    span:
      prov.payment_max_span !== null &&
      listed.minSpan !== null &&
      listed.maxSpan !== null &&
      (prov.payment_max_span < listed.minSpan || prov.payment_max_span > listed.maxSpan),
    rate:
      prov.rate_per_mb_day !== null &&
      listed.price !== null &&
      prov.rate_per_mb_day < Math.round(listed.price / PRICE_MB_DAYS),
  };
}

function ratioTone(passed: number, total: number): StatusTone {
  return STATE_TONE[ratioState(total > 0 ? passed / total : 0) ?? "unstable"];
}

// The window closing is not the alarm - the ladder gives proofs OVERDUE_FACTOR of slack
// because they reach the chain late, so the row turns red with the state, not before it.
function nextProofValue(
  lastProof: number | null,
  maxSpan: number | null,
  nowSec: number,
  t: TFunction,
  time: TimeWords,
  notConfirmed: boolean,
): ReactNode {
  if (!lastProof || !maxSpan) return EMPTY;
  const deadline = lastProof + maxSpan;
  if (deadline <= nowSec) {
    const late = fmt.ago(nowSec, deadline, time.ago);
    return notConfirmed ? <span style={{ color: toneText("red") }}>{late}</span> : late;
  }
  return t("inFuture", { time: fmt.duration(deadline - nowSec, time.duration) });
}

// The same three rows in both places: the contract section of an open bag, and the card
// that picks one when the hash matched several.
function ContractRows({ bag }: { bag: BagPayload }) {
  const { t } = useTranslation();
  return (
    <>
      <ExplorerAddressRow label={t("bagAddress")} address={bag.contract_address} />
      {bag.owner_address && (
        <ExplorerAddressRow label={t("bagOwner")} address={toFriendly(bag.owner_address) ?? bag.owner_address} />
      )}
      <FieldRow label={t("balanceLabel")} value={bag.balance != null ? fmt.tonLabel(bag.balance) : EMPTY} />
    </>
  );
}

type Status = "idle" | "loading" | "ready" | "notfound" | "invalid" | "failed";

export function BagExplorer() {
  const { t } = useTranslation();
  const time = useTimeWords();
  const locale = locales[useAppliedLang()];
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const providers = useCatalog((s) => s.providers);
  const names = useNames((s) => s.providers);
  const subscribed = useSubscriptions((s) => s.subscribed);
  const load = useCatalog((s) => s.load);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<BagPayload[]>([]);
  const reqRef = useRef(0);

  useEffect(() => {
    void load();
  }, [load]);

  const runSearch = useCallback((raw: string) => {
    const q = raw.trim();
    if (!q) return;
    const kind = classify(q);
    if (!kind) {
      setResults([]);
      setStatus("invalid");
      return;
    }
    const id = ++reqRef.current;
    setStatus("loading");
    resolveBag(q, kind)
      .then((res) => {
        if (reqRef.current !== id) return;
        setResults(res);
        setStatus(res.length ? "ready" : "notfound");
      })
      .catch((error: unknown) => {
        if (reqRef.current !== id) return;
        console.error("bag lookup failed", error);
        setStatus("failed");
      });
  }, []);

  useEffect(() => {
    const q = params.get("q");
    if (q) {
      setQuery(q);
      runSearch(q);
    }
  }, [params, runSearch]);

  const header = <ScreenHeader title={t("explorerTitle")} onBack={() => navigate(-1)} />;
  const nowSec = Math.floor(Date.now() / 1000);
  // Several contracts behind one query turn the screen into a pick.
  const single = results.length === 1 ? results[0] : null;
  const slots = single?.providers ?? [];
  const confirmed = slots.filter((p) => p.state === "confirmed").length;
  const passed = slots.filter((p) => p.reason === 0).length;
  // Upstream checks the whole network in one batch, so the age is one per bag, not per slot.
  const checkedAt = slots.reduce<number | null>(
    (max, p) => ((p.reason_at ?? 0) > (max ?? 0) ? p.reason_at : max),
    null,
  );

  return (
    <Screen header={header}>
      <Field
        glyph="search"
        className={styles.search}
        value={query}
        onChange={(next) => {
          setQuery(next);
          if (status === "invalid") setStatus("idle");
        }}
        placeholder={t("bagSearchPlaceholder")}
        enterKeyHint="search"
        invalid={status === "invalid"}
        onEnter={() => runSearch(query)}
        onClear={() => {
          setStatus("idle");
          setResults([]);
        }}
      />

      {status === "idle" && <EmptyState size="lg" icon={Search} title={t("bagIdleTitle")} hint={t("bagIdleDesc")} />}
      {status === "loading" && <BagSkeleton />}
      {status === "invalid" && (
        <EmptyState size="lg" icon={Info} muted title={t("bagInvalidTitle")} hint={t("bagInvalidDesc")} />
      )}
      {status === "notfound" && (
        <EmptyState size="lg" icon={X} muted title={t("bagNotFoundTitle")} hint={t("bagNotFoundDesc")} />
      )}
      {status === "failed" && <LoadError size="lg" message={t("bagsLoadError")} onRetry={() => runSearch(query)} />}

      {status === "ready" && results.length > 1 && (
        <>
          <div className={styles.count}>
            {t("bagFound")} · {results.length}
          </div>
          <Card striped className={styles.list}>
            {results.map((bag, index) => (
              <OpenRow
                key={bag.contract_address}
                onOpen={() => navigate(`/bags?q=${encodeURIComponent(bag.contract_address)}`)}
                label={`${t("bagDetails")} ${shortKey(bag.contract_address)}`}
                data-alt={index % 2 === 1 || undefined}
              >
                <div className={styles.title} style={{ color: toneText(stateTone(bag.state)) }}>
                  {stateText(bag.state, t)}
                </div>
                <FieldList divided className={styles.rows}>
                  <ContractRows bag={bag} />
                </FieldList>
              </OpenRow>
            ))}
          </Card>
        </>
      )}

      {status === "ready" && single && (
        <>
          <Card frame className={styles.stateCard}>
            <div className={styles.title} style={{ color: toneText(stateTone(single.state)) }}>
              {stateText(single.state, t)}
            </div>
          </Card>
          <div className={styles.tiles}>
            <MetricTile
              value={
                <>
                  {confirmed}
                  <span className={styles.den}>
                    <span className={styles.slash}>/</span>
                    {single.providers.length}
                  </span>
                </>
              }
              label={t("bagProofs")}
              valueColor={toneText(ratioTone(confirmed, single.providers.length))}
            />
            <MetricTile
              value={
                checkedAt === null ? (
                  EMPTY
                ) : (
                  <>
                    {passed}
                    <span className={styles.den}>
                      <span className={styles.slash}>/</span>
                      {single.providers.length}
                    </span>
                  </>
                )
              }
              label={checkedAt === null ? t("bagChecks") : `${t("bagChecks")} · ${fmt.ago(nowSec, checkedAt, time.ago)}`}
              valueColor={checkedAt === null ? "var(--text-2)" : toneText(ratioTone(passed, single.providers.length))}
            />
          </div>
          <FieldGroup title={t("bagSection")} className={list.group}>
            {single.bag_id && (
              <CopyRow label={t("bagId")} copyValue={single.bag_id} mono>
                <a
                  className={styles.link}
                  href={bagGatewayUrl(single.bag_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ShortId value={single.bag_id} />
                </a>
              </CopyRow>
            )}
            <FieldRow label={t("bagSize")} value={fmt.bytes(single.size)} />
            <FieldRow label={t("bagChunk")} value={fmt.bytes(single.chunk_size)} />
            {single.merkle_hash && (
              <CopyRow label={t("bagMerkle")} copyValue={single.merkle_hash} mono>
                <ShortId value={single.merkle_hash} />
              </CopyRow>
            )}
            <FieldRow label={t("bagDepth")} value={single.key_len ?? EMPTY} />
          </FieldGroup>

          <FieldGroup title={t("bagContract")} className={list.group}>
            <ContractRows bag={single} />
          </FieldGroup>

          <div className={styles.count}>
            {t("list")} · {single.providers.length}
          </div>
          <Card striped className={styles.list}>
            {single.providers.map((prov, index) => {
              const listed = providers.find((p) => p.pubkey === prov.pubkey);
              const off = mismatch(prov, listed);
              // A provider of your own has his screen a tap away in Subscriptions, and opening
              // him from here would only walk back to the list this bag was picked from.
              const open = subscribed.includes(prov.pubkey) ? undefined : () => navigate(`/provider/${prov.pubkey}`);
              const body = (
                <>
                  <div className={styles.title} style={{ color: toneText(stateTone(prov.state)) }}>
                    {stateText(prov.state, t)}
                  </div>
                  <div
                    className={styles.sub}
                    style={prov.reason ? { color: toneText(reasonTone(prov.reason)) } : undefined}
                  >
                    {reasonText(prov.reason, locale)}
                  </div>
                  <FieldList divided className={styles.rows}>
                    <CopyRow label={t("bagProvider")} copyValue={prov.pubkey} mono={!names[prov.pubkey]}>
                      {names[prov.pubkey] || <ShortId value={prov.pubkey} />}
                    </CopyRow>
                    <FieldRow
                      label={t("maxSpanF")}
                      value={
                        <>
                          <span style={off.span ? { color: toneText("red") } : undefined}>
                            {prov.payment_max_span !== null ? fmt.duration(prov.payment_max_span, time.duration) : EMPTY}
                          </span>
                          <span className={styles.slash}>/</span>
                          {listed ? fmt.duration(listed.maxSpan, time.duration) : EMPTY}
                        </>
                      }
                    />
                    <FieldRow
                      label={t("bagRate")}
                      value={
                        <>
                          <span style={off.rate ? { color: toneText("red") } : undefined}>
                            {prov.rate_per_mb_day !== null ? fmt.groupDigits(prov.rate_per_mb_day) : EMPTY}
                          </span>
                          <span className={styles.slash}>/</span>
                          {listed?.price != null ? fmt.groupDigits(Math.round(listed.price / PRICE_MB_DAYS)) : EMPTY}
                        </>
                      }
                    />
                    <FieldRow label={t("lastProof")} value={fmt.ago(nowSec, prov.last_proof_at, time.ago)} />
                    <FieldRow
                      label={t("nextProof")}
                      value={nextProofValue(
                        prov.last_proof_at,
                        prov.payment_max_span,
                        nowSec,
                        t,
                        time,
                        prov.state === "not_confirmed",
                      )}
                    />
                    <CopyRow label={t("bagNextByte")} copyValue={String(prov.next_proof_byte ?? "")} mono>
                      {prov.next_proof_byte !== null ? fmt.groupDigits(prov.next_proof_byte) : EMPTY}
                    </CopyRow>
                    <CopyRow label={t("bagNonce")} copyValue={prov.nonce ?? ""} mono>
                      {prov.nonce ?? EMPTY}
                    </CopyRow>
                  </FieldList>
                </>
              );
              const alt = index % 2 === 1 || undefined;
              return open ? (
                <OpenRow
                  key={prov.pubkey}
                  onOpen={open}
                  label={`${t("providerDetails")} ${names[prov.pubkey] || shortKey(prov.pubkey)}`}
                  data-alt={alt}
                >
                  {body}
                </OpenRow>
              ) : (
                <div key={prov.pubkey} data-alt={alt} className={styles.plain}>
                  {body}
                </div>
              );
            })}
          </Card>
          <a
            className={buttonClass({ variant: "text", tone: "red" }, styles.report)}
            href={REPORT_BOT}
            target="_blank"
            rel="noopener noreferrer"
          >
            <TriangleAlert size={15} />
            {t("bagReport")}
          </a>
        </>
      )}
    </Screen>
  );
}

// The explorer's answer with every row standing in, in the order the loaded screen has, or the layout jumps once the
// answer arrives.
const BAG_ROWS: PlaceholderWidths[] = [
  { label: "22%", value: "40%" },
  { label: "18%", value: "30%" },
  { label: "24%", value: "30%" },
  { label: "26%", value: "40%" },
  { label: "16%", value: "18%" },
];
const CONTRACT_ROWS: PlaceholderWidths[] = [
  { label: "22%", value: "40%" },
  { label: "18%", value: "40%" },
  { label: "26%", value: "22%" },
];
const SLOT_ROWS: PlaceholderWidths[] = [
  { label: "22%", value: "30%" },
  { label: "18%", value: "30%" },
  { label: "24%", value: "40%" },
  { label: "26%", value: "30%" },
  { label: "20%", value: "30%" },
  { label: "16%", value: "40%" },
  { label: "22%", value: "40%" },
];

function BagSkeleton() {
  const { t } = useTranslation();
  return (
    <>
      <Card frame className={styles.stateCard}>
        <div className={styles.title}>
          <span className={skeletonClass(styles.shapeTitle)} />
        </div>
      </Card>
      <div className={styles.tiles}>
        <MetricTile value={<GhostValue sample="0/0" className={styles.tileGhost} />} label={t("bagProofs")} />
        <MetricTile value={<GhostValue sample="0/0" className={styles.tileGhost} />} label={t("bagChecks")} />
      </div>
      <FieldGroup title={t("bagSection")} className={list.group}>
        {BAG_ROWS.map((row, index) => (
          <PlaceholderRow key={index} {...row} />
        ))}
      </FieldGroup>
      <FieldGroup title={t("bagContract")} className={list.group}>
        {CONTRACT_ROWS.map((row, index) => (
          <PlaceholderRow key={index} {...row} />
        ))}
      </FieldGroup>
      <div className={styles.count}>
        <span className={skeletonClass(styles.countBar)} />
      </div>
      <Card striped className={styles.list}>
        {[0, 1].map((key) => (
          <BagCardSkeleton key={key} rows={SLOT_ROWS} alt={key === 1} />
        ))}
      </Card>
    </>
  );
}
