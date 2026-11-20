import { bindBackButton } from "@/lib/telegram";
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { type Location, Routes, useLocation, useNavigate } from "react-router";
import { type DialogSlot, LayerContext, setDialogsOpen } from "./context";
import styles from "./LayerStack.module.css";
import { sheetHeight } from "./presentation";
import { Sheet } from "./Sheet";

interface Entry {
  key: string;
  location: Location;
  idx: number;
  closing: boolean;
}

// A layer's own key, not the location's: react-router keys every location without history state "default" (an
// address typed past the app), and two layers sharing it closed together, the base screen with them.
let lastKey = 0;
const nextKey = () => String(++lastKey);

// null for an address typed past the app: the router never numbered that history entry.
function historyIndex(): number | null {
  return (window.history.state as { idx?: number } | null)?.idx ?? null;
}

function entryOf(location: Location): Entry {
  return { key: nextKey(), location, idx: historyIndex() ?? 0, closing: false };
}

function initialEntries(location: Location): Entry[] {
  const entry = entryOf(location);
  if (location.pathname === "/") return [entry];
  const base = { ...location, key: "base", pathname: "/", search: "", hash: "" };
  return [{ key: base.key, location: base, idx: entry.idx - 1, closing: false }, entry];
}

export function LayerStack({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>(() => initialEntries(location));
  const [dialogs, setDialogs] = useState<DialogSlot[]>([]);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useLayoutEffect(() => {
    setEntries((prev) => {
      const idx = historyIndex();
      const base = prev[0];
      if (location.pathname === "/") {
        const nextBase = { ...base, location, idx: idx ?? 0 };
        return [nextBase, ...prev.slice(1).map((entry) => ({ ...entry, closing: true }))];
      }
      const live = prev.filter((entry) => !entry.closing);
      const top = live[live.length - 1];
      // A cold start at a sheet: the first render already built this layer, and a new key would mount it twice.
      if (top && top.location === location) return prev;
      const onBase = !top || top === prev[0];
      // Unnumbered would read as 0, under the open sheet, and close it without opening the address; it goes on top
      // instead.
      if (idx === null) return [...prev, { key: nextKey(), location, idx: (top?.idx ?? 0) + 1, closing: false }];
      if (onBase || idx > top.idx) return [...prev, { key: nextKey(), location, idx, closing: false }];
      if (idx < top.idx) {
        return prev.map((entry) => (entry.idx > idx ? { ...entry, closing: true } : entry));
      }
      return prev.map((entry) => (entry.key === top.key ? { key: nextKey(), location, idx, closing: false } : entry));
    });
  }, [location]);

  const layers = entries.slice(1);
  const liveLayers = layers.filter((entry) => !entry.closing);
  const topKey = liveLayers[liveLayers.length - 1]?.key;

  const topIdx = liveLayers[liveLayers.length - 1]?.idx ?? 0;

  const dismiss = useCallback(
    (idx: number) => {
      if (idx > 0) navigate(-1);
      else navigate("/", { replace: true });
    },
    [navigate],
  );

  const topDialog = dialogs[dialogs.length - 1];

  useEffect(() => {
    if (topDialog) return bindBackButton(topDialog.close);
    if (!topKey) return;
    return bindBackButton(() => dismiss(topIdx));
  }, [topDialog, topKey, topIdx, dismiss]);

  const layered = liveLayers.length > 0 || dialogs.length > 0;

  useEffect(() => setDialogsOpen(dialogs.length > 0), [dialogs.length]);

  useEffect(() => {
    const root = document.documentElement;
    if (layered) root.dataset.layered = "";
    else delete root.dataset.layered;
    const base = baseRef.current;
    if (base) base.inert = layered;
  }, [layered]);

  const drop = (key: string) => setEntries((prev) => prev.filter((entry) => entry.key !== key));

  const host = useMemo(
    () => ({
      container,
      routeDepth: liveLayers.length,
      dialogs,
      open: (close: () => void) => {
        const id = nextId.current++;
        setDialogs((prev) => [...prev, { id, close }]);
        return id;
      },
      drop: (id: number) => setDialogs((prev) => prev.filter((slot) => slot.id !== id)),
    }),
    [container, liveLayers.length, dialogs],
  );

  return (
    <LayerContext.Provider value={host}>
      <div ref={baseRef} className={styles.base} data-layered={layered ? "" : undefined}>
        <Routes location={entries[0].location}>{children}</Routes>
      </div>
      {layers.map((entry, index) => (
        <Sheet
          key={entry.key}
          depth={index + 1}
          top={entry.key === topKey && dialogs.length === 0}
          closing={entry.closing}
          height={sheetHeight(entry.location.pathname)}
          onDismiss={() => dismiss(entry.idx)}
          onClosed={() => drop(entry.key)}
        >
          <Routes location={entry.location}>{children}</Routes>
        </Sheet>
      ))}
      <div ref={setContainer} className={styles.host} />
    </LayerContext.Provider>
  );
}
