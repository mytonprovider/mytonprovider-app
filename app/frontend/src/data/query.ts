import { matchesFilters, rankByRating, sortProviders, type FilterValues } from "@myton/ui/domain";
import type { Provider, Sort } from "./types";

interface CatalogSelection {
  // null = whole catalog; a list restricts the tab to its own pubkeys
  only: string[] | null;
  search: string;
  filters: FilterValues;
  sort: Sort;
  names: Record<string, string>;
}

export function selectCatalog(providers: Provider[], selection: CatalogSelection): Provider[] {
  const search = selection.search.trim().toLowerCase();
  const found = (p: Provider) =>
    p.pubkey.toLowerCase().includes(search) || (selection.names[p.pubkey] ?? "").toLowerCase().includes(search);
  const now = Date.now() / 1000;
  // Search reaches past the filters: the provider being looked for is often the one they hide.
  const filtered = providers.filter((p) => {
    if (selection.only && !selection.only.includes(p.pubkey)) return false;
    if (search) return found(p);
    return matchesFilters(p, selection.filters, now);
  });
  return sortProviders(filtered, selection.sort.field, selection.sort.dir);
}

// The place by rating among what the catalogue filters keep, as the sites count it: search does not renumber.
export function rankInFilters(providers: Provider[], filters: FilterValues): Record<string, number> {
  const now = Date.now() / 1000;
  return rankByRating(providers.filter((p) => matchesFilters(p, filters, now)));
}
