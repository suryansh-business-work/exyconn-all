import { useCallback, useEffect, useRef, useState } from 'react';
import type { TrackerMessage, TrackerMessageKind } from '@shared/types';

/**
 * How often an open thread re-reads the portal.
 *
 * The keep-alive already carries the unread COUNT once a minute, which is what raises the
 * notification. This is only for the screen somebody is looking at, where a minute between a
 * reply landing and it appearing would feel like the message had not sent.
 */
const REFRESH_MS = 10_000;

export interface MessagesQuery {
  messages: TrackerMessage[];
  loading: boolean;
  error: string | null;
  /** True while a line the employee typed is on its way. */
  sending: boolean;
  send: (body: string) => Promise<void>;
}

/**
 * The employee's own messages of one kind, kept fresh while the screen is open.
 *
 * Opening the screen marks what was addressed to them as read, which is what clears the
 * badge — reading a message is the act of reading it, not a separate button.
 */
export default function useMessages(kind: TrackerMessageKind): MessagesQuery {
  const [messages, setMessages] = useState<TrackerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  /** Guards every setState against a thread that was closed while a request was in flight. */
  const mounted = useRef(true);

  const load = useCallback(async (): Promise<void> => {
    const rows = await window.tracker.getMessages(kind);
    if (mounted.current) {
      setMessages(rows);
      setError(null);
    }
  }, [kind]);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    const failed = (cause: unknown): void => {
      console.error('Failed to load messages', cause);
      if (mounted.current) {
        setError('Could not load your messages. Check your connection and try again.');
      }
    };

    load()
      .catch(failed)
      .finally(() => {
        if (mounted.current) {
          setLoading(false);
        }
      });
    // Reading them IS the act that clears the badge; a separate "mark as read" button would
    // only ask the employee to confirm something they have already done.
    window.tracker.markMessagesRead(kind).catch((cause: unknown) => {
      console.error('Marking messages read failed', cause);
    });

    const timer = setInterval(() => {
      load().catch(failed);
    }, REFRESH_MS);

    return () => {
      mounted.current = false;
      clearInterval(timer);
    };
  }, [kind, load]);

  const send = useCallback(
    async (body: string): Promise<void> => {
      setSending(true);
      try {
        // The portal's copy is what the thread shows — never a local echo, which would put a
        // message on screen that nobody else can see if the send actually failed.
        await window.tracker.sendMessage(body);
        await load();
      } finally {
        if (mounted.current) {
          setSending(false);
        }
      }
    },
    [load],
  );

  return { messages, loading, error, sending, send };
}
