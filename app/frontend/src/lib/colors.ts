import type { StatusTone, Tone } from "@myton/ui/domain";

// The raw tone, for marks that carry no text of their own: a tick, a gauge arc, a bar. The theme's tone scale is tuned
// for text and tints; a mark without text keeps the vivid tone.
export const SC = {
  gray: "#8e8e93",
  green: "var(--ts-green)",
  yellow: "#e0a000",
  orange: "#ff8c1a",
  red: "#ff3b30",
} as const;

export function toneText(tone: StatusTone): string {
  return `var(--tone-${tone}-text)`;
}

export function toneColor(tone: Tone): string {
  return tone === "accent" ? "var(--accent)" : `var(--tone-${tone})`;
}

export const ACCENT = "var(--accent)";
