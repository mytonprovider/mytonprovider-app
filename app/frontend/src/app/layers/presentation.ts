export type SheetHeight = "full" | "auto";

const AUTO_HEIGHT = ["/menu", "/sort"];

export function isBaseRoute(pathname: string): boolean {
  return pathname === "/";
}

export function sheetHeight(pathname: string): SheetHeight {
  return AUTO_HEIGHT.includes(pathname) ? "auto" : "full";
}
