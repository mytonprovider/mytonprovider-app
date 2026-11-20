import { Check, Pencil, X } from "lucide-react";
import { Badge, Button, Cell, EmptyState, FieldList, glyphClass, IconButton, ShortId, TelegramIcon } from "@myton/ui";
import { Field } from "@/components/Field";
import { NameSheet } from "@/components/NameSheet";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { BADGE_SRC } from "@/components/TrustedBadge";
import { toggleTrusted } from "@/data/sync";
import { useTranslation } from "react-i18next";
import { explorerUrl, toFriendly } from "@myton/ui/domain";
import { useSettings } from "@/stores/settings";
import { useNames } from "@/stores/names";
import { useChannels } from "@/stores/channels";
import { useTrusted } from "@/stores/trusted";
import { useState } from "react";
import { useNavigate } from "react-router";
import styles from "./Trusted.module.css";

type Invalid = "none" | "format" | "duplicate";

export function Trusted() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const explorer = useSettings((s) => s.explorer);
  const addresses = useTrusted((s) => s.addresses);
  const names = useNames((s) => s.addresses);
  const channels = useChannels((s) => s.byAddress);

  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState<Invalid>("none");
  const [editing, setEditing] = useState<string | null>(null);

  const submit = () => {
    const address = toFriendly(value.trim());
    if (address === null) {
      setInvalid("format");
      return;
    }
    if (addresses.includes(address)) {
      setInvalid("duplicate");
      return;
    }
    toggleTrusted(address);
    setValue("");
  };

  const header = <ScreenHeader title={t("trustedTitle")} onBack={() => navigate(-1)} />;

  return (
    <Screen header={header}>
      <Field
        className={styles.field}
        value={value}
        onChange={(next) => {
          setValue(next);
          setInvalid("none");
        }}
        placeholder={t("trustedPlaceholder")}
        enterKeyHint="done"
        invalid={invalid !== "none"}
        onEnter={submit}
        trailing={
          <Button variant="primary" size="sm" disabled={!value.trim()} onClick={submit}>
            {t("trustedAdd")}
          </Button>
        }
      />
      {invalid !== "none" && (
        <div className={styles.error}>{invalid === "format" ? t("trustedInvalid") : t("trustedDuplicate")}</div>
      )}

      {addresses.length === 0 ? (
        <EmptyState size="lg" icon={Check} title={t("trustedEmptyTitle")} hint={t("trustedEmptyDesc")} />
      ) : (
        <>
          <div className={styles.count}>{t("trustedCount", { count: addresses.length })}</div>
          <FieldList card>
            {addresses.map((address) => (
              <Cell
                key={address}
                label={
                  <a
                    className={names[address] ? styles.name : styles.link}
                    href={explorerUrl(address, explorer)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {names[address] || <ShortId value={address} upper={false} />}
                  </a>
                }
                trailing={
                  <span className={styles.actions}>
                    {channels[address] && (
                      <a
                        className={styles.channel}
                        href={channels[address].invite_link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Badge tone="accent" size="sm">
                          <TelegramIcon className={styles.channelIcon} />
                          {t("channel")}
                        </Badge>
                      </a>
                    )}
                    <IconButton size="xs" label={t("nameEdit")} onClick={() => setEditing(address)}>
                      <Pencil className={glyphClass("xs")} color="var(--text-2)" />
                    </IconButton>
                    <IconButton size="xs" label={t("trustedRemove")} onClick={() => toggleTrusted(address)}>
                      <X className={glyphClass("xs")} color="var(--btn-danger)" />
                    </IconButton>
                  </span>
                }
              />
            ))}
          </FieldList>
          <div className={styles.note}>
            {t("trustedNote")}
            <img className={styles.noteBadge} src={BADGE_SRC} alt="" />
          </div>
        </>
      )}
      {editing !== null && (
        <NameSheet
          kind="address"
          target={editing}
          subtitle={<ShortId value={editing} upper={false} />}
          onClose={() => setEditing(null)}
        />
      )}
    </Screen>
  );
}
