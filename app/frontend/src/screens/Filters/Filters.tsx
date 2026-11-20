import { Button, FilterPanel } from "@myton/ui";
import { START_FILTERS, countChanged, isStart, matchesFilters, type FilterValues } from "@myton/ui/domain";
import { fill, locales } from "@myton/ui/locale";
import { BottomBar } from "@/components/BottomBar";
import { MainButton } from "@/components/MainButton";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAppliedLang } from "@/i18n";
import { useCatalog } from "@/stores/catalog";
import { useCatalogQuery } from "@/stores/catalogQuery";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

// Edits are a draft, as on the sites: "Show N" applies them, back and the close drop them
export function Filters() {
  const locale = locales[useAppliedLang()];
  const labels = locale.filters;
  const navigate = useNavigate();

  const providers = useCatalog((s) => s.providers);
  const edges = useCatalog((s) => s.edges);
  const options = useCatalog((s) => s.options);
  const load = useCatalog((s) => s.load);

  const filters = useCatalogQuery((s) => s.filters);
  const setFilters = useCatalogQuery((s) => s.setFilters);
  const resetFilters = useCatalogQuery((s) => s.resetFilters);
  const setSearch = useCatalogQuery((s) => s.setSearch);
  const [draft, setDraft] = useState<FilterValues>(filters);

  useEffect(() => {
    void load();
  }, [load]);

  const matching = useMemo(() => {
    const now = Date.now() / 1000;
    return providers.filter((provider) => matchesFilters(provider, draft, now)).length;
  }, [providers, draft]);

  const back = () => navigate(-1);

  const reset = () => {
    resetFilters();
    setDraft(START_FILTERS);
  };

  // A search reaches past the filters, so leaving it on would show a list the count does not mean
  const apply = () => {
    setFilters(draft);
    setSearch("");
    navigate(-1);
  };

  const header = (
    <ScreenHeader
      title={labels.title}
      badge={countChanged(draft)}
      onBack={back}
      right={
        !isStart(draft) && (
          <Button variant="text" tone="red" onClick={reset}>
            {locale.ui.reset}
          </Button>
        )
      }
    />
  );

  return (
    <Screen
      flush
      header={header}
      bottom={
        edges && (
          <BottomBar>
            <MainButton label={fill(labels.show, { total: matching })} onClick={apply} />
          </BottomBar>
        )
      }
    >
      {edges && <FilterPanel values={draft} edges={edges} options={options} labels={labels} onChange={setDraft} />}
    </Screen>
  );
}
