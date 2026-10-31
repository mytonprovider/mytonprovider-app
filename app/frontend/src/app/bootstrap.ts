import { establishSession } from "@/app/session";
import { flushAlerts, hydrateFromServer } from "@/data/sync";
import { invalidateOwner } from "@/hooks/useOwnerData";
import { useCatalog } from "@/stores/catalog";
import { type Tab, rememberStartTab } from "@/stores/catalogQuery";
import { getTelegramUser, initTelegram, isInTelegram } from "@/lib/telegram";
import { onRevalidate, revalidate } from "@/lib/revalidate";
import { makeAuthUser, useAuth } from "@/stores/auth";
import { useFavorites } from "@/stores/favorites";
import { useSubscriptions } from "@/stores/subscriptions";

const POLL_MS = 60_000;

function usefulTab(): Tab {
  if (useAuth.getState().loggedIn && useSubscriptions.getState().subscribed.length > 0) return "subs";
  if (useFavorites.getState().favorites.length > 0) return "fav";
  return "list";
}

function trackStartTab(): void {
  const save = () => rememberStartTab(usefulTab());
  save();
  useAuth.subscribe(save);
  useFavorites.subscribe(save);
  useSubscriptions.subscribe(save);
}

function applyTelegramLogin(): void {
  const user = getTelegramUser();
  if (user) {
    useAuth.getState().login(makeAuthUser(user.first_name, user.last_name, user.username, user.photo_url));
  } else {
    useAuth.getState().logout();
  }
}

function registerRevalidation(): void {
  onRevalidate(() => {
    void useCatalog.getState().load();
    const auth = useAuth.getState();
    if (auth.session === "open") {
      invalidateOwner();
      hydrateFromServer().catch((error: unknown) => console.error("sync failed", error));
    } else if (isInTelegram() || auth.loggedIn) {
      // A refused session waits here: coming back to the app brings fresh init data.
      void establishSession();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushAlerts();
    else revalidate();
  });
  window.addEventListener("focus", revalidate);
  // Fresh numbers without a tap. A tick costs nothing when nothing has gone stale - the catalogue,
  // the owner cache and the profile each compare their own timestamp and skip the request.
  setInterval(() => {
    if (document.visibilityState === "visible") revalidate();
  }, POLL_MS);
}

async function runBootSequence(): Promise<void> {
  if (isInTelegram()) applyTelegramLogin();
  trackStartTab();
  await establishSession();
}

export function bootstrap(): void {
  initTelegram();
  registerRevalidation();
  void runBootSequence();
}
