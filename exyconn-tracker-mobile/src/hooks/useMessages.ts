import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import type { TrackerMessage, TrackerMessageKind } from '@exyconn/tracker-core';
import { tracker } from '../tracker/instance';

/**
 * How often an open thread re-reads the portal.
 *
 * The keep-alive already carries the unread COUNT once a minute, which is what raises the
 * notification. This is only for the screen somebody is looking at, where a minute between a
 * reply landing and it appearing would feel like the message had not sent.
 */
const REFRESH_MS = 10_000;

const LOAD_FAILED = 'Could not load your messages. Check your connection and try again.';

export interface MessagesQuery {
  messages: TrackerMessage[];
  loading: boolean;
  error: string | null;
  /** Sends one line; rejects with the portal's reason when it is refused. */
  send: (body: string) => Promise<void>;
}

/**
 * The employee's own messages of one kind, kept fresh while the screen is in front.
 *
 * Driven by focus, not mount: the drawer keeps a visited screen mounted behind the others, so
 * "open" means the one showing. Opening it marks what was addressed to them as read, which is
 * what clears the badge — reading a message is the act of reading it, not a separate button.
 */
export function useMessages(kind: TrackerMessageKind): MessagesQuery {
  const [messages, setMessages] = useState<TrackerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /**
   * The view on screen, null once it is left. Every setState checks it, so neither a thread
   * that was left nor the other tab's late answer can land in the one being read.
   */
  const showing = useRef<TrackerMessageKind | null>(null);

  const load = useCallback(async (): Promise<void> => {
    const rows = await tracker.getMessages(kind);
    if (showing.current === kind) {
      setMessages(rows);
      setError(null);
    }
  }, [kind]);

  useFocusEffect(
    useCallback(() => {
      showing.current = kind;
      setLoading(true);
      const failed = (cause: unknown): void => {
        console.error('Failed to load messages', cause);
        if (showing.current === kind) {
          setError(LOAD_FAILED);
        }
      };

      load()
        .catch(failed)
        .finally(() => {
          if (showing.current === kind) {
            setLoading(false);
          }
        });
      tracker.markMessagesRead(kind).catch((cause: unknown) => {
        console.error('Marking messages read failed', cause);
      });

      const timer = setInterval(() => {
        load().catch(failed);
      }, REFRESH_MS);

      return () => {
        showing.current = null;
        clearInterval(timer);
      };
    }, [kind, load]),
  );

  const send = useCallback(
    async (body: string): Promise<void> => {
      // The portal's copy is what the thread shows — never a local echo, which would put a
      // message on screen that nobody else can see if the send actually failed.
      await tracker.sendMessage(body);
      await load();
    },
    [load],
  );

  return { messages, loading, error, send };
}
