import { X } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button, EmptyState, UiProvider } from "@myton/ui";
import { locales } from "@myton/ui/locale";
import { HashRouter } from "react-router";
import { endSession } from "@/app/session";
import { useTranslation } from "react-i18next";
import { useAppliedLang } from "@/i18n";
import { tick } from "@/lib/telegram";
import { useAuth } from "@/stores/auth";
import { AppShell } from "./AppShell";
import { AppRoutes } from "./routes";
import { ThemeGate } from "./ThemeGate";

export function Root() {
  const banned = useAuth((state) => state.banned);
  const { t } = useTranslation();
  const lang = useAppliedLang();
  return (
    <ErrorBoundary
      fallback={() => (
        <EmptyState
          size="lg"
          hint={t("loadError")}
          action={
            <Button variant="text" size="md" tone="accent" onClick={() => location.reload()}>
              {locales[lang].ui.retry}
            </Button>
          }
        />
      )}
    >
      <UiProvider labels={locales[lang].ui} onFeedback={tick}>
        <ThemeGate>
          <AppShell>
            {banned ? (
              <EmptyState
                size="lg"
                icon={X}
                muted
                title={t("bannedTitle")}
                hint={t("bannedDesc")}
                action={
                  <Button variant="text" size="md" tone="accent" onClick={endSession}>
                    {t("logout")}
                  </Button>
                }
              />
            ) : (
              <HashRouter>
                <AppRoutes />
              </HashRouter>
            )}
          </AppShell>
        </ThemeGate>
      </UiProvider>
    </ErrorBoundary>
  );
}
