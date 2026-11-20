import { ScreenHeader } from "@/components/ScreenHeader";
import { FavoriteButton, ShareButton, ShortId } from "@myton/ui";
import { locales } from "@myton/ui/locale";
import { useProviderActions } from "@/hooks/useProviderActions";
import { useAppliedLang } from "@/i18n";
import { useNames } from "@/stores/names";

interface ProviderHeaderProps {
  pubkey: string;
  onBack: () => void;
  // A screen about the provider's bags rather than the provider names it and only closes.
  actions?: boolean;
}

export function ProviderHeader({ pubkey, onBack, actions = true }: ProviderHeaderProps) {
  const locale = locales[useAppliedLang()];
  const name = useNames((s) => s.providers[pubkey]);
  const { favorite, share } = useProviderActions(pubkey);

  return (
    <ScreenHeader
      title={name || locale.filters.group.provider}
      lead={name ? undefined : <ShortId value={pubkey} />}
      onBack={onBack}
      right={
        actions && (
          <>
            <FavoriteButton size="sm" {...favorite} />
            {share && <ShareButton size="sm" {...share} />}
          </>
        )
      }
    />
  );
}
