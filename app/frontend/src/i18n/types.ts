import type { Lang, Locale } from "@myton/ui/locale";
import type { en } from "./en";

export type { Lang };

type En = typeof en;
type PluralKey = `${string}_${"one" | "few" | "many" | "other"}`;
// Every key but the plural forms, which each language spells by its own numbers.
type BaseKey = Exclude<keyof En, PluralKey>;

export type Translation = { [K in BaseKey]: En[K] } & Record<PluralKey, string>;
export type AlertKey = keyof En["alertNames"];
export type AlertGroupKey = keyof En["alertGroups"];
export type TriggerKey = keyof En["triggerNames"];
export type TextKey = { [K in BaseKey]: En[K] extends string ? K : never }[BaseKey];

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: En; ui: Locale };
  }
}
