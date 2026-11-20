import {
  Badge,
  Card,
  Cell,
  cx,
  FieldGroup,
  FieldRow,
  iconButtonClass,
  LoadError,
  SegmentedControl,
  skeletonClass,
} from "@myton/ui";
import { EMPTY, explorerUrl, fmt, formatDuration, GRAM, JUST_NOW_SEC } from "@myton/ui/domain";
import { type TimeWords } from "@myton/ui/locale";
import { establishSession } from "@/app/session";
import { Chart } from "@/components/Chart";
import { Gauge } from "@/components/Gauge";
import { EMPTY_BAGS, type BagFilter } from "@/data/backend";
import {
  OWNER_CHART_RANGES,
  adaptOwner,
  type ChartKey,
  type GaugeKey,
  type OwnerChartRange,
  type OwnerPeriod,
} from "@/data/owner";
import type { Provider } from "@/data/types";
import { prefetchOwner, refreshOwner, useOwnerData } from "@/hooks/useOwnerData";
import { useTimeWords } from "@/i18n";
import type { TextKey } from "@/i18n/types";
import { BLANK } from "@/lib/skeletons";
import { filterTone } from "@/lib/status";
import { useAlerts } from "@/stores/alerts";
import { useAuth } from "@/stores/auth";
import { useSettings } from "@/stores/settings";
import type { TFunction } from "i18next";
import { ArrowUpRight } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { FieldCard } from "./FieldCard";
import styles from "./ProviderDetail.module.css";
import list from "@/styles/list.module.css";

type OwnerTab = "overview" | "earnings" | "charts";

const BAG_ROWS: { state: BagFilter; label: TextKey }[] = [
  { state: "all", label: "bagsAll" },
  { state: "confirmed", label: "bagsConfirmed" },
  { state: "unavailable", label: "bagsUnavailable" },
  { state: "downloading", label: "bagsDownloading" },
  { state: "not_paid", label: "bagsNotPaid" },
  { state: "not_accepted", label: "bagsNotAccepted" },
  { state: "not_confirmed", label: "bagsNotConfirmed" },
  { state: "closed", label: "bagsClosed" },
  { state: "check", label: "bagsCheck" },
];

const SKELETON_WIDTHS = [34, 72, 86, 76, 94, 112, 128, 104, 118];

const GAUGE_LABEL: Record<GaugeKey, TextKey> = {
  cpu_high: "chartCpu",
  ram_high: "chartRam",
  disk_load_high: "chartDisk",
  network_high: "chartNet",
};

const CHART_LABEL: Record<ChartKey, TextKey> = {
  cpu_high: "chartCpu",
  ram_high: "chartRam",
  disk_load_high: "chartDisk",
  net_in: "trafficIn",
  net_out: "trafficOut",
};

function balanceAge(secs: number, t: TFunction, time: TimeWords): string {
  return secs < JUST_NOW_SEC ? t("updatedNow") : t("updatedAgo", { time: fmt.duration(secs, time.duration) });
}

export function OwnerPanel({
  provider,
  pubkey,
  onDenied,
  children,
}: {
  provider: Provider;
  pubkey: string;
  onDenied: (pubkey: string | null) => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const time = useTimeWords();
  const navigate = useNavigate();
  const loggedIn = useAuth((s) => s.loggedIn);
  const session = useAuth((s) => s.session);
  const thresholds = useAlerts((s) => s.thresholds);

  const [tab, setTab] = useState<OwnerTab>("overview");
  const [period, setPeriod] = useState<OwnerPeriod>("today");
  const [chartRange, setChartRange] = useState<OwnerChartRange>("1h");

  const { payload, denied, failed, refreshing } = useOwnerData(pubkey, loggedIn, period, chartRange);
  useEffect(() => {
    if (loggedIn) prefetchOwner(pubkey);
  }, [pubkey, loggedIn]);
  useEffect(() => {
    onDenied(denied ? pubkey : null);
  }, [denied, pubkey, onDenied]);

  const owner = payload ? adaptOwner(provider, payload, thresholds) : null;
  const nowSec = Math.floor(Date.now() / 1000);
  const explorer = useSettings((state) => state.explorer);
  const walletUrl = provider.address ? explorerUrl(provider.address, explorer) : undefined;
  const loading = loggedIn && session !== "closed" && !payload && !denied && !failed;
  const bags = payload?.bags ?? EMPTY_BAGS;

  const tabs = (
    <div className={styles.ownerSegWrap}>
      <SegmentedControl<OwnerTab>
        options={[
          { value: "overview", label: t("overview") },
          { value: "earnings", label: t("earningsTab") },
          { value: "charts", label: t("chartsTab") },
        ]}
        value={tab}
        onChange={setTab}
        variant="underline"
      />
    </div>
  );

  return (
    <>
      {owner ? (
        <>
          <Card pad="block" className={cx(list.group, styles.balanceCard)}>
            <div className={styles.balanceMain}>
              <div className={styles.subLabel}>{t("balanceLabel")}</div>
              <div className={styles.balanceRow}>
                <span className={styles.balanceValue}>{owner.balance}</span>
                <span className={styles.balanceUnit}>{GRAM}</span>
              </div>
              <div className={styles.balanceUpdated}>
                {owner.balanceUpdatedAt === null ? t("unknown") : balanceAge(nowSec - owner.balanceUpdatedAt, t, time)}
              </div>
            </div>
            <a
              className={iconButtonClass({ size: "xl" })}
              href={walletUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("viewInExplorer")}
            >
              <ArrowUpRight size={20} color="var(--accent)" />
            </a>
          </Card>
          <Card pad="block" className={list.group}>
            <div className={styles.storageTop}>
              <span className={styles.subLabel}>{t("incomeMonth")}</span>
              <span className={styles.storageValue}>
                <span className={styles.valueNow}>{owner.income}</span>
                {owner.incomeMax ? ` / ${owner.incomeMax}` : ""}
                {` ${GRAM}`}
              </span>
            </div>
            <div className={styles.storageBarRow}>
              <div className={styles.storageBarTrack}>
                <div
                  className={styles.storageBarFill}
                  style={{ width: `${owner.usedPct}%`, background: owner.barColor }}
                />
              </div>
              <span
                className={styles.storagePct}
                style={{ color: owner.spaceOver ? owner.barColor : "var(--text-2)" }}
              >
                {owner.spaceKnown ? `${owner.usedPct}%` : EMPTY}
              </span>
            </div>
            <div className={styles.storageTop}>
              <span className={styles.subLabel}>{t("storageUsage")}</span>
              <span className={styles.storageValue}>
                {owner.spaceKnown ? (
                  <>
                    <span className={styles.valueNow}>{owner.usedSpace}</span>
                    {` / ${owner.totalSpace} ${owner.spaceUnit}`}
                  </>
                ) : (
                  t("unknown")
                )}
              </span>
            </div>
          </Card>
          <FieldGroup title={t("bagsTitle")} className={list.group}>
            {BAG_ROWS.map(({ state, label }) => {
              const count = bags[state];
              return (
                <Cell
                  key={state}
                  label={t(label)}
                  trailing={
                    count > 0 && (
                      <Badge tone={filterTone(state)} size="sm">
                        {count}
                      </Badge>
                    )
                  }
                  chevron
                  onClick={count > 0 ? () => navigate(`/provider/${pubkey}/bags?state=${state}`) : undefined}
                />
              );
            })}
          </FieldGroup>
          {tabs}
        </>
      ) : loading ? (
        <>
          <Card pad="block" className={cx(list.group, styles.balanceCard)}>
            <div className={styles.balanceMain}>
              <div className={skeletonClass(cx(styles.subLabel, styles.shapeLabel))}>{BLANK}</div>
              <div className={styles.balanceRow}>
                <span className={skeletonClass(cx(styles.balanceValue, styles.shapeBalance))}>{BLANK}</span>
              </div>
              <div className={skeletonClass(cx(styles.balanceUpdated, styles.shapeNote))}>{BLANK}</div>
            </div>
          </Card>
          <Card pad="block" className={list.group}>
            <div className={styles.storageTop}>
              <span className={skeletonClass(cx(styles.subLabel, styles.shapeLabel))}>{BLANK}</span>
              <span className={skeletonClass(cx(styles.storageValue, styles.shapeValue))}>{BLANK}</span>
            </div>
            <div className={styles.storageBarRow}>
              <div className={skeletonClass(styles.storageBarTrack)} />
              <span className={skeletonClass(cx(styles.storagePct, styles.shapePct))}>{BLANK}</span>
            </div>
            <div className={styles.storageTop}>
              <span className={skeletonClass(cx(styles.subLabel, styles.shapeLabel))}>{BLANK}</span>
              <span className={skeletonClass(cx(styles.storageValue, styles.shapeValue))}>{BLANK}</span>
            </div>
          </Card>
          <FieldGroup title={t("bagsTitle")} className={list.group}>
            {BAG_ROWS.map(({ state }, index) => (
              <Cell
                key={state}
                label={
                  <span className={skeletonClass(styles.bagsShape)} style={{ width: SKELETON_WIDTHS[index] }}>
                    {BLANK}
                  </span>
                }
                chevron
              />
            ))}
          </FieldGroup>
          {tabs}
        </>
      ) : loggedIn && !denied ? (
        <LoadError
          size="lg"
          message={session === "open" ? t("ownerFailed") : t("sessionFailed")}
          onRetry={session === "open" ? refreshOwner : () => void establishSession()}
        />
      ) : null}

      {(tab === "overview" || !owner) && children}

      {tab === "earnings" && owner && (
        <>
          <FieldGroup
            className={styles.summaryCard}
            head={
              <SegmentedControl<OwnerPeriod>
                options={[
                  { value: "hour", label: t("periodHour") },
                  { value: "today", label: t("periodDay") },
                  { value: "week", label: t("periodWeek") },
                  { value: "month", label: t("periodMonth") },
                ]}
                value={period}
                onChange={setPeriod}
                size="sm"
              />
            }
          >
            <SummaryRow label={t("earnedLabel")} value={owner.summary.earned} loading={refreshing} />
            <SummaryRow label={t("bagsAddedLabel")} value={owner.summary.bagsAdded} loading={refreshing} />
            <SummaryRow label={t("trafficIn")} value={owner.summary.trafficIn} loading={refreshing} />
            <SummaryRow label={t("trafficOut")} value={owner.summary.trafficOut} loading={refreshing} />
            <SummaryRow label={t("storageGrowth")} value={owner.summary.storageGrowth} loading={refreshing} />
          </FieldGroup>
          <FieldCard
            title={t("monthlyHeader")}
            rows={[
              { label: t("monthlyEarned"), value: owner.monthly.earned },
              { label: t("monthlySpace"), value: owner.monthly.space },
              { label: t("monthlyTraffic"), value: owner.monthly.traffic },
            ]}
          />
          <FieldCard
            title={t("allTimeHeader")}
            rows={[
              { label: t("allTimeEarned"), value: owner.allTime.earned },
              { label: t("allTimeStored"), value: owner.allTime.space },
              { label: t("allTimeTraffic"), value: owner.allTime.traffic },
            ]}
          />
        </>
      )}

      {tab === "charts" && owner && (
        <>
          <div className={styles.gaugeGrid}>
            {owner.gauges.map((gauge) => (
              <Gauge
                key={gauge.key}
                value={gauge.value}
                threshold={gauge.threshold}
                label={t(GAUGE_LABEL[gauge.key])}
              />
            ))}
          </div>
          <FieldGroup
            className={list.group}
            head={
              <SegmentedControl<OwnerChartRange>
                size="sm"
                options={OWNER_CHART_RANGES.map((range) => ({
                  value: range.value,
                  label: formatDuration([{ value: range.hours, unit: "hour" }], time.duration),
                }))}
                value={chartRange}
                onChange={setChartRange}
              />
            }
          >
            {owner.charts.map((chart) => (
              <Chart
                key={chart.key}
                values={chart.values}
                peaks={chart.peaks}
                times={chart.times}
                threshold={chart.threshold}
                unit={chart.unit}
                current={chart.current}
                label={t(CHART_LABEL[chart.key])}
                loading={refreshing}
              />
            ))}
          </FieldGroup>
        </>
      )}
    </>
  );
}

function SummaryRow({ label, value, loading }: { label: string; value: string; loading?: boolean }) {
  return (
    <FieldRow
      label={label}
      value={loading ? <span className={skeletonClass(styles.shapeRowValue)}>{BLANK}</span> : value}
    />
  );
}
