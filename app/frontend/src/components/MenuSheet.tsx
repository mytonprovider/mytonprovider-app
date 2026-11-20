import { ArrowUpRight, Bell, Check, LogOut, Search, Server, SlidersHorizontal } from "lucide-react";
import { Card, Cell, FieldList, type Glyph, glyphClass, IconButton, SegmentedControl, TelegramIcon } from "@myton/ui";
import { endSession } from "@/app/session";
import { TelegramLoginButton } from "@/components/TelegramLoginButton";
import { setExplorer, setLanguage, setTheme } from "@/data/sync";
import { useAppliedTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { useAppliedLang } from "@/i18n";
import type { Lang } from "@/i18n/types";
import { isInTelegram, openExternal } from "@/lib/telegram";
import { useAuth } from "@/stores/auth";
import type { Explorer } from "@myton/ui/domain";
import { type Theme, useSettings } from "@/stores/settings";
import { useNavigate } from "react-router";
import styles from "./MenuSheet.module.css";

interface MenuRowProps {
  icon: Glyph;
  label: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
}

function MenuRow({ icon: Icon, label, href, external, onClick }: MenuRowProps) {
  return (
    <Cell
      leading={
        <span className={styles.tile}>
          <Icon className={styles.glyph} aria-hidden="true" />
        </span>
      }
      label={label}
      trailing={external && <ArrowUpRight size={15} color="var(--text-2)" />}
      chevron={!external}
      href={href}
      external={external}
      onClick={onClick}
    />
  );
}

export function MenuSheet() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const theme = useAppliedTheme();
  const lang = useAppliedLang();
  const explorer = useSettings((s) => s.explorer);

  const loggedIn = useAuth((s) => s.loggedIn);
  const user = useAuth((s) => s.user);
  const isAdmin = useAuth((s) => s.isAdmin);
  const inTelegram = isInTelegram();

  const openAdmin = () => openExternal(`${location.origin}/admin/#theme=${theme}`);

  return (
    <>
      <div className={styles.accountSlot}>
        {loggedIn && user ? (
          <Card className={styles.account}>
            {user.photoUrl ? (
              <img className={styles.avatar} src={user.photoUrl} alt="" />
            ) : (
              <div className={styles.avatar}>{user.initials}</div>
            )}
            <div className={styles.accountInfo}>
              <div className={styles.accountName}>{user.name}</div>
              {user.username && <div className={styles.accountUser}>@{user.username}</div>}
            </div>
            {!inTelegram && (
              <IconButton tone="red" label={t("logout")} className={styles.logout} onClick={endSession}>
                <LogOut className={glyphClass("md")} />
              </IconButton>
            )}
          </Card>
        ) : (
          !inTelegram && (
            <div className={styles.login}>
              <TelegramLoginButton />
            </div>
          )
        )}
      </div>

      <div className={styles.separator} />

      <div className={styles.label}>{t("language")}</div>
      <SegmentedControl<Lang>
        options={[
          { value: "en", label: "English" },
          { value: "ru", label: "Русский" },
        ]}
        value={lang}
        onChange={setLanguage}
      />

      <div className={styles.label}>{t("appearance")}</div>
      <SegmentedControl<Theme>
        options={[
          { value: "light", label: t("light") },
          { value: "dark", label: t("dark") },
        ]}
        value={theme}
        onChange={setTheme}
      />

      <div className={styles.label}>{t("explorerLabel")}</div>
      <SegmentedControl<Explorer>
        options={[
          { value: "tonviewer", label: "Tonviewer" },
          { value: "tonscan", label: "Tonscan" },
        ]}
        value={explorer}
        onChange={setExplorer}
      />

      <FieldList card className={styles.group}>
        {isAdmin && <MenuRow icon={SlidersHorizontal} label={t("adminPanel")} external onClick={openAdmin} />}
        <MenuRow icon={Bell} label={t("alertSettings")} onClick={() => navigate("/alerts")} />
        <MenuRow icon={Search} label={t("explorerTitle")} onClick={() => navigate("/bags")} />
        <MenuRow icon={Check} label={t("trustedTitle")} onClick={() => navigate("/trusted")} />
        <MenuRow icon={Server} label={t("becomeProvider")} href="https://github.com/igroman787/mytonprovider" external />
        <MenuRow icon={TelegramIcon} label={t("support")} href="https://t.me/mytonprovider_chat" external />
      </FieldList>
    </>
  );
}
