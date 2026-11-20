import { readLocal, writeLocal } from "@myton/ui";
import { nextSortDirection, START_FILTERS, type FilterValues, type SortField } from "@myton/ui/domain";
import type { Sort } from "@/data/types";
import { create } from "zustand";

export type Tab = "list" | "subs" | "fav";

const START_TAB_KEY = "mtp-start-tab";

function startTab(): Tab {
  const saved = readLocal(START_TAB_KEY);
  return saved === "subs" || saved === "fav" ? saved : "list";
}

export function rememberStartTab(tab: Tab): void {
  writeLocal(START_TAB_KEY, tab);
}

interface CatalogQueryState {
  tab: Tab;
  search: string;
  sort: Sort;
  filters: FilterValues;
  setTab: (tab: Tab) => void;
  setSearch: (search: string) => void;
  setSortField: (field: SortField) => void;
  setFilters: (filters: FilterValues) => void;
  resetFilters: () => void;
}

// Neither the sort nor the filters outlive a launch, as on the sites.
export const useCatalogQuery = create<CatalogQueryState>()((set) => ({
  tab: startTab(),
  search: "",
  sort: { field: "rating", dir: "desc" },
  filters: START_FILTERS,
  setTab: (tab) => set({ tab }),
  setSearch: (search) => set({ search }),
  setSortField: (field) =>
    set((state) => ({ sort: { field, dir: nextSortDirection(field, state.sort.field, state.sort.dir) } })),
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: START_FILTERS }),
}));
