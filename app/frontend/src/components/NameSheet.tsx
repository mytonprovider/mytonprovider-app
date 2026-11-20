import { BottomSheet } from "@/components/BottomSheet";
import { Field } from "@/components/Field";
import { MainButton } from "@/components/MainButton";
import { setAddressName, setProviderName } from "@/data/sync";
import { useTranslation } from "react-i18next";
import { NAME_MAX, cleanName } from "@/lib/names";
import { useNames } from "@/stores/names";
import { type ReactNode, useState } from "react";
import styles from "./NameSheet.module.css";

interface NameSheetProps {
  kind: "provider" | "address";
  target: string;
  subtitle: ReactNode;
  onClose: () => void;
}

export function NameSheet({ kind, target, subtitle, onClose }: NameSheetProps) {
  const { t } = useTranslation();
  const saved = useNames((s) => (kind === "provider" ? s.providers[target] : s.addresses[target]) ?? "");
  const [value, setValue] = useState(saved);

  const name = cleanName(value);

  const submit = (close: () => void) => {
    if (kind === "provider") setProviderName(target, name);
    else setAddressName(target, name);
    close();
  };

  return (
    <BottomSheet title={kind === "provider" ? t("nameTitle") : t("nameAddressTitle")} subtitle={subtitle} onClose={onClose}>
      {(close) => (
        <>
          <Field
            className={styles.field}
            value={value}
            onChange={setValue}
            placeholder={t("namePlaceholder")}
            maxLength={NAME_MAX}
            enterKeyHint="done"
            onEnter={() => submit(close)}
          />
          <div className={styles.submit}>
            <MainButton
              label={name || !saved ? t("save") : t("nameClear")}
              disabled={!name && !saved}
              onClick={() => submit(close)}
            />
          </div>
        </>
      )}
    </BottomSheet>
  );
}
