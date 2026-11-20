export interface SearchRequest {
  filters: Record<string, unknown>;
  sort?: { column: string; order: "asc" | "desc" };
  exact: string[];
  limit: number;
  offset: number;
}
