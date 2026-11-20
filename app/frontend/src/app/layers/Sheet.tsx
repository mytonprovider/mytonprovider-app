import { cx, reducedMotion, SheetHeader, SheetPanel, toMs, useSheetDrag } from "@myton/ui";
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Sheet.module.css";
import type { SheetHeight } from "./presentation";

const TitleSlot = createContext<HTMLDivElement | null>(null);

// A routed sheet names itself from inside: the header lands above the padded body, as a full-height screen's does.
export function SheetTitle({ title, onClose }: { title: string; onClose: () => void }) {
  const slot = useContext(TitleSlot);
  return (
    slot && createPortal(<SheetHeader title={title} grabber={false} onClose={onClose} className={styles.header} />, slot)
  );
}

interface SheetProps {
  height: SheetHeight;
  depth: number;
  top: boolean;
  closing: boolean;
  title?: string;
  subtitle?: ReactNode;
  onDismiss: () => void;
  onClosed: () => void;
  children: ReactNode;
}

export function Sheet({ height, depth, top, closing, title, subtitle, onDismiss, onClosed, children }: SheetProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const { ref: dragRef, element: sheetRef, offset, dragging, handlers } = useSheetDrag(top && !closing, onDismiss);
  const [titleSlot, setTitleSlot] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (layer) layer.inert = !top;
  }, [top]);

  const opener = useRef<Element | null>(null);
  opener.current ??= document.activeElement;

  useEffect(() => {
    sheetRef.current?.focus({ preventScroll: true });
    return () => {
      const previous = opener.current;
      requestAnimationFrame(() => {
        if (previous instanceof HTMLElement && document.contains(previous)) previous.focus({ preventScroll: true });
      });
    };
  }, []);

  const closed = useRef(onClosed);
  closed.current = onClosed;

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!closing || !sheet) return;
    const style = getComputedStyle(sheet);
    const from = style.transform;
    const close = toMs(style.getPropertyValue("--dur-base"));
    const easing = style.getPropertyValue("--ease-sheet").trim();
    const duration = reducedMotion() ? 0 : close;
    const slide = sheet.animate([{ transform: from === "none" ? "translateY(0px)" : from }, { transform: "translateY(100%)" }], {
      duration,
      easing,
      fill: "forwards",
    });
    const scrim = scrimRef.current;
    if (scrim) {
      scrim.animate([{ opacity: getComputedStyle(scrim).opacity }, { opacity: 0 }], {
        duration,
        easing,
        fill: "forwards",
      });
    }
    const finish = () => closed.current();
    slide.addEventListener("finish", finish);
    const timer = setTimeout(finish, close * 2);
    return () => {
      slide.removeEventListener("finish", finish);
      clearTimeout(timer);
    };
  }, [closing]);

  return (
    <div
      ref={layerRef}
      className={styles.layer}
      style={{ ["--layer-depth" as string]: depth }}
      role="dialog"
      aria-modal={top}
      aria-label={title}
    >
      <div ref={scrimRef} className={styles.scrim} onClick={top && !closing ? onDismiss : undefined} />
      <SheetPanel
        ref={dragRef}
        className={cx(styles.sheet, styles[height], dragging && styles.dragging, !closing && !top && styles.behind)}
        style={offset > 0 ? { transform: `translateY(${offset}px)` } : undefined}
        onClose={onDismiss}
        {...handlers}
      >
        {title && <SheetHeader title={title} grabber={false} onClose={onDismiss} className={styles.header} />}
        {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        <div ref={setTitleSlot} className={styles.titleSlot} />
        <div className={styles.body}>
          <TitleSlot.Provider value={titleSlot}>{children}</TitleSlot.Provider>
        </div>
      </SheetPanel>
    </div>
  );
}
