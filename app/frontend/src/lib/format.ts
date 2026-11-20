import type { StatusTone } from "@myton/ui/domain";

const LEVEL_MARGIN = 12;

export function levelTone(value: number, threshold: number): StatusTone {
  if (value >= threshold) return "red";
  if (value >= threshold - LEVEL_MARGIN) return "orange";
  return "green";
}

export function uptimeTone(uptime: number): StatusTone {
  if (uptime >= 99) return "green";
  if (uptime >= 95) return "yellow";
  if (uptime > 0) return "red";
  return "gray";
}
