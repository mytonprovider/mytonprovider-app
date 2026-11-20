import { SortList } from "@myton/ui";
import { SORT_FIELDS } from "@myton/ui/domain";
import { locales } from "@myton/ui/locale";
import { SheetTitle } from "@/app/layers/Sheet";
import { MainButton } from "@/components/MainButton";
import { useAppliedLang } from "@/i18n";
import { tick } from "@/lib/telegram";
import { useCatalogQuery } from "@/stores/catalogQuery";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import styles from "./Sort.module.css";

export function Sort() {
  const { t } = useTranslation();
  const locale = locales[useAppliedLang()];
  const navigate = useNavigate();

  const sort = useCatalogQuery((s) => s.sort);
  const setSortField = useCatalogQuery((s) => s.setSortField);

  // The list sorts behind the sheet as the row is tapped, so the button only puts the sheet away.
  return (
    <>
      <SheetTitle title={t("sortBy")} onClose={() => navigate(-1)} />
      <SortList
        options={SORT_FIELDS.map((field) => ({ value: field, label: locale.sortFields[field] }))}
        value={sort.field}
        direction={sort.dir}
        directionLabel={locale.sortDirection[sort.dir]}
        onPick={(field) => {
          tick();
          setSortField(field);
        }}
      />
      <div className={styles.action}>
        <MainButton label={t("done")} onClick={() => navigate(-1)} />
      </div>
    </>
  );
}
