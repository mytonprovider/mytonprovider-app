import { FieldRow, ShortId, useCopyFeedback } from "@myton/ui";
import { TrustedBadge } from "@/components/TrustedBadge";
import { explorerUrl } from "@myton/ui/domain";
import { useNames } from "@/stores/names";
import { useSettings } from "@/stores/settings";

interface ExplorerAddressRowProps {
  label: string;
  address: string;
}

export function ExplorerAddressRow({ label, address }: ExplorerAddressRowProps) {
  const explorer = useSettings((s) => s.explorer);
  const name = useNames((s) => s.addresses[address]);
  const { copied, copy } = useCopyFeedback();

  return (
    <FieldRow
      label={label}
      value={name || <ShortId value={address} upper={false} />}
      href={explorerUrl(address, explorer)}
      title={name ? address : undefined}
      trailing={<TrustedBadge address={address} />}
      copy={address}
      copied={copied === address}
      onCopy={(value) => void copy(value)}
    />
  );
}
