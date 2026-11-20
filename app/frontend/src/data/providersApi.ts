import { toProviders } from "@myton/ui/domain";
import type { SearchRequest } from "./dto";
import { http } from "./http";
import type { Provider } from "./types";

const CATALOG_LIMIT = 1000;

export async function fetchCatalog(): Promise<Provider[]> {
  const body: SearchRequest = { filters: {}, exact: [], limit: CATALOG_LIMIT, offset: 0 };
  const page = toProviders(await http.post<unknown>("/api/v1/providers/search", body));
  if (page === null) throw new Error("The catalog answered with something that is not a provider list");
  if (page.skipped > 0) console.warn(`Catalog: skipped ${page.skipped} entries without a key`);
  return page.providers;
}
