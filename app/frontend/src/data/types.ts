import type { SortDirection, SortField } from "@myton/ui/domain";

export type { Provider } from "@myton/ui/domain";

export interface Sort {
  field: SortField;
  dir: SortDirection;
}
