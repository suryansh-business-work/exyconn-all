import { useCallback, useRef, useState, type KeyboardEvent } from 'react';

/**
 * One tab stop for a row of items, moved through with the arrow keys (WAI-ARIA roving
 * tabindex).
 *
 * Ninety uptime bars as ninety tab stops would make the rest of the status page a long walk
 * away; as one stop, a keyboard reaches the row, reads any day by moving along it, and leaves
 * with a single Tab.
 */
export function useRovingFocus(count: number) {
  // Start on the newest day — the one somebody opening a status page is asking about.
  const [active, setActive] = useState(Math.max(count - 1, 0));
  const items = useRef<(HTMLElement | null)[]>([]);

  const moveTo = useCallback(
    (index: number) => {
      const next = Math.min(Math.max(index, 0), count - 1);
      setActive(next);
      items.current[next]?.focus();
    },
    [count],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const keys: Record<string, number> = {
        ArrowLeft: active - 1,
        ArrowRight: active + 1,
        Home: 0,
        End: count - 1,
      };
      if (event.key in keys) {
        event.preventDefault();
        moveTo(keys[event.key]);
      }
    },
    [active, count, moveTo],
  );

  const itemProps = (index: number) => ({
    ref: (node: HTMLElement | null) => {
      items.current[index] = node;
    },
    tabIndex: index === active ? 0 : -1,
    onFocus: () => setActive(index),
  });

  return { onKeyDown, itemProps };
}
