import { ProviderRow, ProviderRowPlaceholder } from "@/components/ProviderRow";
import type { Provider } from "@/data/types";
import { useRowWindow } from "@/hooks/useRowWindow";
import { type ReactNode, useRef } from "react";
import styles from "./Home.module.css";

interface ProviderPaneProps {
  hero?: ReactNode;
  toolbar?: ReactNode;
  count: string | null;
  loading: boolean;
  skeletonCount: number;
  rows: Provider[];
  trailing: (provider: Provider) => ReactNode;
  fallback?: ReactNode;
  onOpen: (pubkey: string) => void;
}

export function ProviderPane({
  hero,
  toolbar,
  count,
  loading,
  skeletonCount,
  rows,
  trailing,
  fallback,
  onOpen,
}: ProviderPaneProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const { start, end, padTop, padBottom } = useRowWindow(listRef, rows.length);

  return (
    <>
      {hero}
      {toolbar}
      {(count !== null || loading) && <div className={styles.count}>{count || " "}</div>}

      {loading ? (
        <div className={styles.list}>
          {Array.from({ length: skeletonCount }, (_, index) => (
            <ProviderRowPlaceholder key={index} />
          ))}
        </div>
      ) : rows.length > 0 ? (
        <div ref={listRef} className={styles.list} style={{ paddingTop: padTop, paddingBottom: padBottom }}>
          {rows.slice(start, end).map((provider) => (
            <ProviderRow
              key={provider.pubkey}
              provider={provider}
              onOpen={() => onOpen(provider.pubkey)}
              trailing={trailing(provider)}
            />
          ))}
        </div>
      ) : (
        <div className={styles.fallback}>{fallback}</div>
      )}
    </>
  );
}
