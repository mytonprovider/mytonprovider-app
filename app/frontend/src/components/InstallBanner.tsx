import { Share, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { glyphClass, IconButton, readLocal, writeLocal } from "@myton/ui";
import { isInTelegram } from "@/lib/telegram";
import { useEffect, useState } from "react";
import styles from "./InstallBanner.module.css";

const DISMISS_KEY = "mtp-install-dismissed";

function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  const iOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const otherBrowser = /crios|fxios|edgios|opios|android/i.test(ua);
  return iOS && !otherBrowser;
}

export function InstallBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInTelegram() || isStandalone() || readLocal(DISMISS_KEY)) return;
    if (isIOSSafari()) setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    writeLocal(DISMISS_KEY, "1");
    setVisible(false);
  };

  return (
    <div className={styles.banner}>
      <div className={styles.body}>
        <div className={styles.title}>{t("installTitle")}</div>
        <div className={styles.hint}>
          {t("installStep1")}
          <Share className={styles.share} size={17} aria-hidden="true" />
          {t("installStep2")}
        </div>
      </div>
      <IconButton label={t("installHide")} variant="secondary" size="xs" onClick={dismiss}>
        <X className={glyphClass("xs")} color="var(--text-2)" />
      </IconButton>
    </div>
  );
}
