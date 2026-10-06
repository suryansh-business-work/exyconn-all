import { useCallback, useEffect, useRef, useState } from "react";

/** How close to the bottom still counts as "reading the newest message". */
const NEAR_BOTTOM_PX = 48;

/**
 * Keeps a scrolling thread on its newest message while the visitor is at the bottom; once they
 * scroll up to read, new messages leave the view alone and `hasNew` asks for a "New messages"
 * chip instead.
 */
export function useAutoScroll(count: number, visible: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const seen = useRef(count);
  const [hasNew, setHasNew] = useState(false);

  const scrollToBottom = useCallback(() => {
    const el = ref.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
    atBottom.current = true;
    setHasNew(false);
  }, []);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    if (atBottom.current) {
      setHasNew(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const grew = count > seen.current;
    seen.current = count;
    if (atBottom.current) {
      scrollToBottom();
    } else if (grew) {
      setHasNew(true);
    }
  }, [count, visible, scrollToBottom]);

  return { ref, onScroll, hasNew, scrollToBottom };
}
