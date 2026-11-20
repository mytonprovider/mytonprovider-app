import { Card, cx } from "@myton/ui";
import { ProviderRow, ProviderRowPlaceholder } from "@/components/ProviderRow";
import type { Provider } from "@/data/types";
import { useRowWindow } from "@/hooks/useRowWindow";
import { BLANK } from "@/lib/skeletons";
import { type ReactNode, useRef } from "react";
import styles from "./Home.module.css";

interface ProviderPaneProps {
  hero?: ReactNode;
  toolbar?: ReactNode;
  // Left out where the list ends with its own count, as the paged catalogue does
  count?: string | null;
  loading: boolean;
  skeletonCount: number;
  rows: Provider[];
  ranks: Record<string, number>;
  fallback?: ReactNode;
  more?: ReactNode;
  viewed: string | null;
  onOpen: (pubkey: string) => void;
}

export function ProviderPane({
  hero,
  toolbar,
  count,
  loading,
  skeletonCount,
  rows,
  ranks,
  fallback,
  more,
  viewed,
  onOpen,
}: ProviderPaneProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const { start, end, padTop, padBottom } = useRowWindow(listRef, rows.length);
  // With no count line above it the card keeps the step the count line made
  const listClass = cx(styles.list, count === undefined && styles.listUncounted);

  return (
    <>
      {hero}
      {toolbar}
      {count !== undefined && (count !== null || loading) && <div className={styles.count}>{count || BLANK}</div>}

      {loading ? (
        <Card striped className={listClass}>
          {Array.from({ length: skeletonCount }, (_, index) => (
            <ProviderRowPlaceholder key={index} alt={index % 2 === 1} />
          ))}
        </Card>
      ) : rows.length > 0 ? (
        <>
          <Card striped ref={listRef} className={listClass} style={{ paddingTop: padTop, paddingBottom: padBottom }}>
            {rows.slice(start, end).map((provider, index) => (
              <ProviderRow
                key={provider.pubkey}
                provider={provider}
                onOpen={() => onOpen(provider.pubkey)}
                alt={(start + index) % 2 === 1}
                viewed={provider.pubkey === viewed}
                rank={ranks[provider.pubkey]}
              />
            ))}
          </Card>
          {more}
        </>
      ) : (
        <div className={styles.fallback}>{fallback}</div>
      )}
    </>
  );
}
