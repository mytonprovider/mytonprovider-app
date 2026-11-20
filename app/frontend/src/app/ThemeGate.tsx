import { useAppliedTheme } from "@/hooks/useTheme";
import type { Theme } from "@/stores/settings";
import { isInTelegram } from "@/lib/telegram";
import { miniApp } from "@tma.js/sdk-react";
import { type ReactNode, useLayoutEffect, useRef } from "react";

function paintTelegramBands(): void {
  if (!isInTelegram()) return;
  const color = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
  if (!color.startsWith("#")) return;
  try {
    miniApp.setBgColor.ifAvailable(color);
    if (miniApp.setHeaderColor.supports("rgb")) miniApp.setHeaderColor.ifAvailable(color);
    miniApp.setBottomBarColor.ifAvailable(color);
  } catch {}
}

export function ThemeGate({ children }: { children: ReactNode }) {
  const theme = useAppliedTheme();
  // The theme on the page rather than a first-paint flag: StrictMode runs the effect twice, and a flag would crossfade
  // the theme into itself, a transition the profile's theme then cuts short.
  const applied = useRef<Theme | null>(null);

  useLayoutEffect(() => {
    if (applied.current === theme) return;
    const apply = () => {
      document.documentElement.dataset.theme = theme;
      paintTelegramBands();
    };
    const start = document.startViewTransition?.bind(document);
    if (applied.current !== null && start) start(apply);
    else apply();
    applied.current = theme;
  }, [theme]);

  return <>{children}</>;
}
