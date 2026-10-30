import { DEFAULT_FILTERS, EMPTY_FILTERS, SORT_FIELDS } from "@/data/query";
import type { CatalogFilters, Sort, SortField } from "@/data/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Tab = "list" | "subs" | "fav";

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

export const useCatalogQuery = create<CatalogQueryState>()(
  persist(
    (set) => ({
      tab: startTab(),
      search: "",
      sort: { field: "rating", dir: "desc" },
      filters: DEFAULT_FILTERS,
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
      // Returning to the opening pair left the list cut with the dot lit, which is not a reset.
      resetFilters: () => set({ filters: EMPTY_FILTERS }),
    }),
    {
      name: "mtp-filters",
      version: 2,
      // The old shape kept a single value, not a set; it is dropped rather than converted.
      migrate: () => ({ filters: DEFAULT_FILTERS }),
      partialize: (state) => ({ filters: state.filters, sort: state.sort }),
      // Only what was saved comes back: a key it never had stays unset, an unknown sort is dropped.
      merge: (persisted, current) => {
        const state = { ...current, ...(persisted as Partial<CatalogQueryState>) };
        return {
          ...state,
          filters: { ...EMPTY_FILTERS, ...state.filters },
          sort: SORT_FIELDS.includes(state.sort?.field) ? state.sort : current.sort,
        };
      },
    },
  ),
);
