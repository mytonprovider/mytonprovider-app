import { createI18n, pickLang, resolveLang, type LangChoice } from "@myton/ui/i18n";
import { words, type TimeWords } from "@myton/ui/locale";
import { useTranslation } from "react-i18next";
import { getTelegramUser, isInTelegram } from "@/lib/telegram";
import { useSettings } from "@/stores/settings";
import { en } from "./en";
import { ru } from "./ru";
import type { Lang } from "./types";

// The pick lives in the settings store, which the server mirrors; until it is made, the language is Telegram's.
const choice: LangChoice = {
  chosen: () => {
    const { lang, langAuto } = useSettings.getState();
    return langAuto ? null : lang;
  },
  system: () => (isInTelegram() ? getTelegramUser()?.language_code : null),
};

export function initI18n(): void {
  const i18n = createI18n({ en, ru }, choice);
  useSettings.subscribe((state, prev) => {
    if (state.lang !== prev.lang || state.langAuto !== prev.langAuto) void i18n.changeLanguage(resolveLang(choice));
  });
}

export function useAppliedLang(): Lang {
  return pickLang(useTranslation().i18n.language);
}

export function useTimeWords(): TimeWords {
  return words[useAppliedLang()];
}
