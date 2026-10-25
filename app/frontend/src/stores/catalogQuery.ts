import type { CatalogFilters, Sort, SortField } from "@/data/types";
import { create } from "zustand";

export type Tab = "list" | "subs" | "fav";

const EMPTY_FILTERS: CatalogFilters = {
  location: null,
  rating: null,
  uptime: null,
  price: null,
  bag: null,
  cores: null,
  ram: null,
  age: null,
  minSpan: null,
  maxSpan: null,
  space: null,
  diskRead: null,
  diskWrite: null,
  download: null,
  upload: null,
  ping: null,
  cpuVirtual: null,
  storageHash: null,
  providerHash: null,
  freeSpace: false,
  telemetry: null,
  stableOnly: false,
};

const START_TAB_KEY = "mtp-start-tab";

function startTab(): Tab {
  try {
    const saved = localStorage.getItem(START_TAB_KEY);
    return saved === "subs" || saved === "fav" ? saved : "list";
  } catch {
    return "list";
  }
}

export function rememberStartTab(tab: Tab): void {
  try {
    localStorage.setItem(START_TAB_KEY, tab);
  } catch {
    return;
  }
}

interface CatalogQueryState {
  tab: Tab;
  search: string;
  sort: Sort;
  filters: CatalogFilters;
  setTab: (tab: Tab) => void;
  setSearch: (search: string) => void;
  setSortField: (field: SortField) => void;
  setFilters: (filters: CatalogFilters) => void;
  resetFilters: () => void;
}

export const useCatalogQuery = create<CatalogQueryState>((set) => ({
  tab: startTab(),
  search: "",
  sort: { field: "rating", dir: "desc" },
  filters: EMPTY_FILTERS,
  setTab: (tab) => set({ tab }),
  setSearch: (search) => set({ search }),
  setSortField: (field) =>
    set((state) => ({
      sort:
        state.sort.field === field
          ? { field, dir: state.sort.dir === "asc" ? "desc" : "asc" }
          : { field, dir: "desc" },
    })),
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: EMPTY_FILTERS }),
}));
