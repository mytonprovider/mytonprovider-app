import { shareLink, useCopyFeedback } from "@myton/ui";
import { useTranslation } from "react-i18next";
import { providerLink, shareInTelegram } from "@/lib/telegram";

// What the share action gets for a provider: none when the build has no bot to link to.
export function useProviderShare(pubkey: string) {
  const { t } = useTranslation();
  const { copied, copy } = useCopyFeedback();
  const link = providerLink(pubkey);
  if (!link) return undefined;

  return {
    label: t("share"),
    shared: copied === link,
    onShare: () => shareLink(link, copy, shareInTelegram),
  };
}
