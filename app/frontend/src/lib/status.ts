import type { BagFilter, BagState } from "@/data/backend";
import type { TFunction } from "i18next";
import type { TextKey } from "@/i18n/types";
import type { StatusTone } from "@myton/ui/domain";
import { fill, reasonKey, type Locale } from "@myton/ui/locale";

export function reasonText(reason: number | null, locale: Locale): string {
  return fill(locale.reason[reasonKey(reason)], { code: String(reason) });
}

// Typed by BagState: a state added on the backend stops the build here instead of
// silently rendering as a grey "confirmed" bag.
const STATES: Record<BagState, { tone: StatusTone; label: TextKey }> = {
  confirmed: { tone: "green", label: "bagStateConfirmed" },
  downloading: { tone: "yellow", label: "bagStateDownloading" },
  not_accepted: { tone: "gray", label: "bagStateNotAccepted" },
  unavailable: { tone: "orange", label: "bagStateUnavailable" },
  not_confirmed: { tone: "red", label: "bagStateNotConfirmed" },
  not_paid: { tone: "orange", label: "bagStateNotPaid" },
  closed: { tone: "gray", label: "bagStateClosed" },
  partial: { tone: "yellow", label: "bagStatePartial" },
  not_hired: { tone: "gray", label: "bagStateNotHired" },
};

export function stateTone(state: BagState): StatusTone {
  return STATES[state].tone;
}

export function stateText(state: BagState, t: TFunction): string {
  return t(STATES[state].label);
}

// Slices are not states: "check" is grey because it mixes every chain state there is.
export function filterTone(filter: BagFilter): StatusTone | "accent" {
  if (filter === "all") return "accent";
  return filter === "check" ? "gray" : stateTone(filter);
}
