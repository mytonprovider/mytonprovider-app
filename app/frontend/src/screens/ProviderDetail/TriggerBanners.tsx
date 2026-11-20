import { Notice } from "@myton/ui";
import { ChartColumn, Cpu, Globe, Server, type LucideIcon } from "lucide-react";
import { ownerTriggers } from "@/data/owner";
import { useOwnerData } from "@/hooks/useOwnerData";
import { useTranslation } from "react-i18next";
import type { TriggerKey } from "@/i18n/types";
import { useAuth } from "@/stores/auth";
import { useSubscriptions } from "@/stores/subscriptions";
import styles from "./ProviderDetail.module.css";

// Offline and stopped telemetry are told to everyone above the status card; the owner's own banners keep the rest
type OwnerTrigger = Exclude<TriggerKey, "telemetry_lost" | "not_online">;

const ownerOnly = (key: TriggerKey): key is OwnerTrigger => key !== "telemetry_lost" && key !== "not_online";

const TRIGGER_ICON: Record<OwnerTrigger, LucideIcon> = {
  cpu_high: Cpu,
  ram_high: ChartColumn,
  network_high: Globe,
  disk_load_high: ChartColumn,
  disk_space_low: Server,
};

export function TriggerBanners({ pubkey }: { pubkey: string }) {
  const { t } = useTranslation();
  const loggedIn = useAuth((s) => s.loggedIn);
  const isSubscribed = useSubscriptions((s) => s.subscribed.includes(pubkey));
  const { payload } = useOwnerData(pubkey, isSubscribed && loggedIn, "today");
  const triggers = payload ? ownerTriggers(payload.triggers) : [];

  return (
    <>
      {triggers.map(
        (trigger) =>
          ownerOnly(trigger.key) && (
            <Notice key={trigger.key} tone={trigger.color} icon={TRIGGER_ICON[trigger.key]} className={styles.triggerBanner}>
              {t(`triggerNames.${trigger.key}`)}
            </Notice>
          ),
      )}
    </>
  );
}
