import { HttpError } from "@/data/http";
import { fetchCatalog } from "@/data/providersApi";
import {
  CATALOG_FRESH_MS,
  filterEdges,
  filterOptions,
  type FilterEdges,
  type ListId,
  type ListOption,
} from "@myton/ui/domain";
import type { Provider } from "@/data/types";
import { create } from "zustand";

type LoadStatus = "idle" | "loading" | "ready" | "error";

interface CatalogState {
  providers: Provider[];
  edges: FilterEdges | null;
  options: Record<ListId, ListOption[]>;
  status: LoadStatus;
  errorStatus: number | null;
  loadedAt: number;
  load: () => Promise<void>;
  reload: () => Promise<boolean>;
}

export const useCatalog = create<CatalogState>((set, get) => {
  const fetchAll = async (silent: boolean): Promise<boolean> => {
    if (!silent) set({ status: "loading" });
    try {
      const providers = await fetchCatalog();
      set({
        providers,
        edges: filterEdges(providers, Date.now() / 1000),
        options: filterOptions(providers),
        status: "ready",
        errorStatus: null,
        loadedAt: Date.now(),
      });
      return true;
    } catch (error) {
      console.error("Catalog load failed", error);
      if (!silent) {
        if (get().providers.length > 0) set({ status: "ready" });
        else set({ status: "error", errorStatus: error instanceof HttpError ? error.status : null });
      }
      return false;
    }
  };

  return {
    providers: [],
    edges: null,
    options: filterOptions([]),
    status: "idle",
    errorStatus: null,
    loadedAt: 0,
    load: async () => {
      const { status, loadedAt } = get();
      if (status === "loading") return;
      if (status === "ready") {
        if (Date.now() - loadedAt > CATALOG_FRESH_MS) await fetchAll(true);
        return;
      }
      await fetchAll(false);
    },
    reload: () => fetchAll(false),
  };
});
