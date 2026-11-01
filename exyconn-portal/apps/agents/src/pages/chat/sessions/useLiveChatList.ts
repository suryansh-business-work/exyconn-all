import { useEffect, useRef, useState } from 'react';
import { useChatConsole, useChatFrames } from '../chat.context';
import { isLiveVisitorMessage } from '../chat.message';

/** Bursts of frames (a visitor sending three messages) become one reload. */
const RELOAD_DEBOUNCE_MS = 500;
/** How long the "new message" notice stays up. */
const ARRIVAL_VISIBLE_MS = 4000;

/** The newest visitor message, shown as a brief animated notice above the list. */
export interface ChatArrival {
  id: string;
  name: string;
}

/**
 * Keeps the chat list live: every session or message frame re-reads the grid (debounced), and
 * a new visitor message raises an arrival notice while "animate new messages" is on.
 */
export function useLiveChatList(reload: () => void): ChatArrival | null {
  const { prefs } = useChatConsole();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [arrival, setArrival] = useState<ChatArrival | null>(null);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!arrival) {
      return undefined;
    }
    const hide = setTimeout(() => setArrival(null), ARRIVAL_VISIBLE_MS);
    return () => clearTimeout(hide);
  }, [arrival]);

  useChatFrames((frame) => {
    if (frame.t !== 'session' && frame.t !== 'message') {
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(reload, RELOAD_DEBOUNCE_MS);
    if (frame.t === 'message' && prefs.animate && isLiveVisitorMessage(frame.message)) {
      setArrival({ id: frame.message.id, name: frame.message.senderName });
    }
  });

  return arrival;
}
