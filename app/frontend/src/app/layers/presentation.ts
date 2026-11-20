export type SheetHeight = "full" | "auto";

const AUTO_HEIGHT = ["/menu", "/sort"];

export function sheetHeight(pathname: string): SheetHeight {
  return AUTO_HEIGHT.includes(pathname) ? "auto" : "full";
}
