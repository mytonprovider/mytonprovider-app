import { useCopyFeedback } from "@myton/ui";
import { toggleFavorite } from "@/data/sync";
import { useProviderShare } from "@/hooks/useProviderShare";
import { useTranslation } from "react-i18next";
import { useFavorites } from "@/stores/favorites";

// The copy, favourite and share of one provider: its list row takes all three, the sheet header the favourite and share.
export function useProviderActions(pubkey: string) {
  const { t } = useTranslation();
  const { copied, copy } = useCopyFeedback();
  const favorite = useFavorites((s) => s.favorites.includes(pubkey));
  const share = useProviderShare(pubkey);

  return {
    copy: { value: pubkey, copied: copied === pubkey, onCopy: (value: string) => void copy(value) },
    favorite: { active: favorite, label: t("fav"), onToggle: () => toggleFavorite(pubkey) },
    share,
  };
}
