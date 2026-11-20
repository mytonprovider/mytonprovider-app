import { EmptyState, FieldGroup, FieldRow, Notice, RankMark, ShortId, StatusCard } from "@myton/ui";
import {
  dominantReason,
  EMPTY,
  fmt,
  GRAM,
  providerStatus,
  staleSignals,
  toFriendly,
  type Telemetry,
} from "@myton/ui/domain";
import { locales, providerFields, statusView, type Locale } from "@myton/ui/locale";
import { BottomBar } from "@/components/BottomBar";
import { ConfirmSheet } from "@/components/ConfirmSheet";
import { CopyRow } from "@/components/CopyRow";
import { ExplorerAddressRow } from "@/components/ExplorerAddressRow";
import { MainButton } from "@/components/MainButton";
import { MetricTile } from "@/components/MetricTile";
import { NameSheet } from "@/components/NameSheet";
import { PasswordSheet } from "@/components/PasswordSheet";
import { ProviderHeader } from "@/components/ProviderHeader";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { rankInFilters } from "@/data/query";
import { unsubscribeProvider } from "@/data/sync";
import { useLogin } from "@/hooks/useLogin";
import { useAppliedLang } from "@/i18n";
import { toneText } from "@/lib/colors";
import { uptimeTone } from "@/lib/format";
import { reasonText } from "@/lib/status";
import { useAuth } from "@/stores/auth";
import { useCatalog } from "@/stores/catalog";
import { useCatalogQuery } from "@/stores/catalogQuery";
import { useNames } from "@/stores/names";
import { useSubscriptions } from "@/stores/subscriptions";
import { Clock, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { type Field, FieldCard } from "./FieldCard";
import { OwnerPanel } from "./OwnerPanel";
import { TriggerBanners } from "./TriggerBanners";
import styles from "./ProviderDetail.module.css";
import list from "@/styles/list.module.css";

type Labels = Locale["details"];

function hardwareFields(tel: Telemetry, labels: Labels, words: Locale["filters"]): Field[] {
  return [
    { label: labels.cpuName, value: fmt.shortText(tel.cpuName), title: tel.cpuName || undefined },
    { label: labels.cpuCount, value: tel.cpuCount != null ? String(tel.cpuCount) : EMPTY },
    { label: labels.cpuVirtual, value: tel.cpuVirtual == null ? EMPTY : tel.cpuVirtual ? words.yes : words.no },
    { label: labels.ram, value: fmt.spacePair(tel.usageRamBytes, tel.totalRamBytes) },
    { label: labels.space, value: fmt.spacePair(tel.usedSpaceBytes, tel.totalSpaceBytes) },
  ];
}

function networkFields(tel: Telemetry, labels: Labels): Field[] {
  return [
    { label: labels.download, value: fmt.mbits(tel.downloadBits) },
    { label: labels.upload, value: fmt.mbits(tel.uploadBits) },
    { label: labels.ping, value: fmt.ping(tel.pingMs) },
    { label: labels.country, value: tel.country || EMPTY },
    { label: labels.isp, value: fmt.shortText(tel.isp), title: tel.isp || undefined },
  ];
}

export function ProviderDetail() {
  const { t } = useTranslation();
  const lang = useAppliedLang();
  const locale = locales[lang];
  const navigate = useNavigate();
  const { pubkey = "" } = useParams();

  const providers = useCatalog((s) => s.providers);
  const filters = useCatalogQuery((s) => s.filters);
  const status = useCatalog((s) => s.status);
  const load = useCatalog((s) => s.load);
  const loadedAt = useCatalog((s) => s.loadedAt);

  const loggedIn = useAuth((s) => s.loggedIn);
  const { start: startLogin } = useLogin();
  const isSubscribed = useSubscriptions((s) => s.subscribed.includes(pubkey));
  const name = useNames((s) => s.providers[pubkey]);

  const [deniedFor, setDeniedFor] = useState<string | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  const provider = providers.find((p) => p.pubkey === pubkey);
  // The same number as the list row, so the list's filters decide it
  const rank = useMemo(() => rankInFilters(providers, filters)[pubkey], [providers, filters, pubkey]);

  const back = () => navigate(-1);

  if (!provider) {
    // The catalogue lists working providers only, while a contract keeps the key of one
    // that left: name that instead of bouncing the screen back to the home list.
    return (
      <Screen header={<ScreenHeader title={locale.filters.group.provider} onBack={back} />}>
        {status === "ready" && (
          <>
            <EmptyState size="lg" icon={Search} muted title={t("providerGoneTitle")} hint={t("providerGoneDesc")} />
            <FieldGroup className={list.group}>
              <CopyRow label={locale.columns.pubkey} copyValue={pubkey} mono>
                <ShortId value={pubkey} />
              </CopyRow>
            </FieldGroup>
          </>
        )}
      </Screen>
    );
  }

  const st = statusView(providerStatus(provider), lang);
  const now = Math.floor(loadedAt / 1000);
  const telemetry = provider.sendsTelemetry ? provider.telemetry : null;
  const labels = locale.details;
  const groups = locale.filters.group;

  // A subscription the provider no longer confirms keeps its place in the list: the button
  // offers the new password instead of the way out.
  const denied = deniedFor === pubkey;
  const subscribeLabel = denied ? t("updatePassword") : isSubscribed ? t("unsubscribe") : loggedIn ? t("subscribe") : t("loginTg");
  const onSubscribe = () => {
    if (!loggedIn) return startLogin();
    if (isSubscribed && !denied) return setConfirmOpen(true);
    setPwOpen(true);
  };

  const header = <ProviderHeader pubkey={provider.pubkey} onBack={back} />;

  const overview = (
    <>
      <FieldGroup title={groups.provider} className={styles.overviewCard}>
        <FieldRow
          label={t("nameField")}
          value={name || t("nameUnset")}
          valueClassName={name ? undefined : styles.nameUnset}
          onClick={() => setNameOpen(true)}
        />
        <CopyRow label={locale.columns.pubkey} copyValue={provider.pubkey} mono>
          <ShortId value={provider.pubkey} />
        </CopyRow>
        {provider.address && (
          <ExplorerAddressRow label={labels.address} address={toFriendly(provider.address) ?? provider.address} />
        )}
        {providerFields(provider, now, lang).map((field) => (
          <FieldRow key={field.id} label={field.label} value={field.value} tone={field.stale ? "red" : undefined} />
        ))}
      </FieldGroup>

      {telemetry ? (
        <>
          <FieldGroup title={groups.software} className={list.group}>
            <CopyRow
              label={labels.storageHash}
              copyValue={telemetry.storageGitHash}
              title={telemetry.storageGitHash || undefined}
              mono
            >
              {fmt.shortText(telemetry.storageGitHash)}
            </CopyRow>
            <CopyRow
              label={labels.providerHash}
              copyValue={telemetry.providerGitHash}
              title={telemetry.providerGitHash || undefined}
              mono
            >
              {fmt.shortText(telemetry.providerGitHash)}
            </CopyRow>
          </FieldGroup>
          <FieldCard
            title={groups.benchmarks}
            rows={[
              { label: labels.diskRead, value: fmt.diskSpeed(telemetry.diskRead) },
              { label: labels.diskWrite, value: fmt.diskSpeed(telemetry.diskWrite) },
            ]}
          />
          <FieldCard title={groups.hardware} rows={hardwareFields(telemetry, labels, locale.filters)} />
          <FieldCard title={groups.network} rows={networkFields(telemetry, labels)} />
        </>
      ) : (
        <Notice tone="gray" icon={Clock} className={list.group}>
          {t("noTelemetry")}
        </Notice>
      )}
    </>
  );

  return (
    <>
      <Screen
        header={header}
        bottom={
          <BottomBar>
            <MainButton
              label={subscribeLabel}
              tone={isSubscribed && !denied ? "destructive" : "accent"}
              onClick={onSubscribe}
            />
          </BottomBar>
        }
      >
        <TriggerBanners pubkey={pubkey} />
        {staleSignals(provider, now).map((signal) => (
          <Notice key={signal} tone="red" className={list.group}>
            {locale.stale[signal]}
          </Notice>
        ))}

        <StatusCard
          tone={st.tone}
          label={st.label}
          ratio={st.ratio}
          description={reasonText(dominantReason(provider.reasons), locale)}
          reasons={provider.reasons}
          describe={(reason) => reasonText(reason, locale)}
          className={list.group}
        />

        <div className={styles.tiles}>
          <MetricTile
            value={fmt.number(provider.rating, 2)}
            label={
              rank ? (
                <>
                  {t("rating")}
                  <RankMark rank={rank} />
                </>
              ) : (
                t("rating")
              )
            }
            valueColor="var(--accent)"
          />
          <MetricTile
            value={fmt.number(provider.uptime, 2)}
            unit="%"
            label={t("uptime")}
            valueColor={toneText(uptimeTone(provider.uptime ?? 0))}
          />
          <MetricTile value={fmt.price(provider.price)} unit={GRAM} label={t("priceUnit")} />
        </div>

        {isSubscribed ? (
          <OwnerPanel provider={provider} pubkey={pubkey} onDenied={setDeniedFor}>
            {overview}
          </OwnerPanel>
        ) : (
          overview
        )}
      </Screen>
      {pwOpen && <PasswordSheet pubkey={pubkey} onClose={() => setPwOpen(false)} />}
      {nameOpen && (
        <NameSheet
          kind="provider"
          target={pubkey}
          subtitle={<ShortId value={provider.pubkey} />}
          onClose={() => setNameOpen(false)}
        />
      )}
      {confirmOpen && (
        <ConfirmSheet
          title={t("unsubscribeConfirm")}
          subtitle={name || <ShortId value={provider.pubkey} />}
          confirmLabel={t("unsubscribe")}
          onConfirm={() => unsubscribeProvider(pubkey)}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
