import { TelegramIcon } from "@myton/ui";
import { useLogin } from "@/hooks/useLogin";
import { useTranslation } from "react-i18next";
import styles from "./TelegramLoginButton.module.css";

export function TelegramLoginButton() {
  const { t } = useTranslation();
  const { start } = useLogin();
  return (
    <button type="button" className={styles.button} onClick={start}>
      <TelegramIcon className={styles.icon} />
      {t("loginTg")}
    </button>
  );
}
