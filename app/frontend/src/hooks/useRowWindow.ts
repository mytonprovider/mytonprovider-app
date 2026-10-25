import { type RefObject, useLayoutEffect, useRef, useState } from "react";

const OVERSCAN = 4;
// Rows to render before any height is known; measure corrects it in the same frame.
const INITIAL_ROWS = 8;

interface RowWindow {
  start: number;
  end: number;
  padTop: number;
  padBottom: number;
}

const COLD: RowWindow = { start: 0, end: INITIAL_ROWS, padTop: 0, padBottom: 0 };

function scrollerOf(node: HTMLElement): HTMLElement | null {
  for (let element = node.parentElement; element; element = element.parentElement) {
    const { overflowY } = getComputedStyle(element);
    if (overflowY === "auto" || overflowY === "scroll") return element;
  }
  return null;
}

// Only what fits the screen is mounted; the caller pads over the rest, so the scroller keeps the
// height of the whole list. Heights are measured as rows pass through the window and the unseen
// ones priced at the average seen so far - catalog rows all come out the same height, bag cards
// do not, and a declared height would drift the first time a card gains a row.
export function useRowWindow(listRef: RefObject<HTMLElement>, count: number): RowWindow {
  const sizes = useRef<number[]>([]);
  const shown = useRef<RowWindow>(COLD);
  const [slot, setSlot] = useState<RowWindow>(COLD);
  // A search can cut the list from under the scroller, and the render runs before measure can
  // notice: without this the window would slice past the new end and show nothing.
  const view = slot.end > count ? { ...COLD, end: Math.min(count, INITIAL_ROWS) } : slot;

  // What the caller has in the DOM, taken after the commit so a measured height lands on the
  // index it belongs to - the window above can be pulled back on a render measure never saw.
  useLayoutEffect(() => {
    shown.current = view;
  });

  useLayoutEffect(() => {
    const list = listRef.current;
    const pane = list && scrollerOf(list);
    if (!list || !pane) return;
    sizes.current.length = count;

    const measure = () => {
      const mounted = list.children;
      if (!mounted.length) return;
      const gap = parseFloat(getComputedStyle(list).rowGap) || 0;
      for (let i = 0; i < mounted.length; i += 1) {
        sizes.current[shown.current.start + i] = (mounted[i] as HTMLElement).offsetHeight + gap;
      }

      let seen = 0;
      let measured = 0;
      for (const size of sizes.current) {
        if (size) {
          seen += 1;
          measured += size;
        }
      }
      if (!seen) return;
      const typical = measured / seen;
      const sizeAt = (index: number) => sizes.current[index] || typical;

      const listTop = list.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop;
      const above = pane.scrollTop - listTop;
      let start = 0;
      let padTop = 0;
      while (start < count - 1 && padTop + sizeAt(start) <= above) {
        padTop += sizeAt(start);
        start += 1;
      }
      for (let i = 0; i < OVERSCAN && start > 0; i += 1) {
        start -= 1;
        padTop -= sizeAt(start);
      }

      let end = start;
      let filled = 0;
      // Twice the overscan below, once above: unmeasured rows are priced at the average, and on a
      // ragged list that average is short, so a symmetric window falls behind a fast scroll - three
      // blank frames per sweep of a thousand bag-sized rows against none with this.
      const want = pane.clientHeight + typical * OVERSCAN;
      while (end < count && filled < want) {
        filled += sizeAt(end);
        end += 1;
      }
      end = Math.min(count, end + OVERSCAN);

      let padBottom = 0;
      for (let i = end; i < count; i += 1) padBottom += sizeAt(i);

      const next = { start, end, padTop: Math.max(0, padTop), padBottom };
      setSlot((prev) =>
        prev.start === start && prev.end === end && prev.padTop === next.padTop && prev.padBottom === padBottom
          ? prev
          : next,
      );
    };

    measure();
    pane.addEventListener("scroll", measure, { passive: true });
    // The pane only: the list changes its own height through those paddings, so watching it
    // would feed the measurement back into itself.
    const observer = new ResizeObserver(measure);
    observer.observe(pane);
    return () => {
      pane.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [listRef, count]);

  return view;
}
