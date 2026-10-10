/**
 * Reveals a chat's replies one at a time: "typing…" for each reply's typing time, then the
 * message. Replies to a chat that is not on screen (or while the tab is hidden) count as
 * unread, and a reminder that lands there is announced.
 */
import { useCallback, useEffect, useMemo, useRef, type Dispatch, type RefObject } from 'react';
import type { OutgoingMessage } from '@exyconn/wa-flow';
import type { StoreAction } from './store';
import type { RuntimeOptions } from './types';

interface Lane {
  items: OutgoingMessage[];
  busy: boolean;
  pushed: boolean;
  idle: (() => void)[];
}

export function useReplyQueue(dispatch: Dispatch<StoreAction>, opts: RefObject<RuntimeOptions>) {
  const lanes = useRef(new Map<string, Lane>());
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) {
        globalThis.clearTimeout(timer);
      }
    };
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    const timer = globalThis.setTimeout(() => {
      timers.current.delete(timer);
      fn();
    }, ms);
    timers.current.add(timer);
  }, []);

  const lane = useCallback((demoKey: string): Lane => {
    let current = lanes.current.get(demoKey);
    if (!current) {
      current = { items: [], busy: false, pushed: false, idle: [] };
      lanes.current.set(demoKey, current);
    }
    return current;
  }, []);

  const pump = useCallback(
    (demoKey: string) => {
      const current = lane(demoKey);
      const next = current.items.shift();
      if (!next) {
        current.busy = false;
        current.pushed = false;
        dispatch({ type: 'typing', demoKey, typing: false });
        const waiting = current.idle.splice(0);
        for (const fn of waiting) {
          fn();
        }
        return;
      }
      current.busy = true;
      dispatch({ type: 'typing', demoKey, typing: true });
      later(() => {
        if (lanes.current.get(demoKey) !== current) {
          return; // The chat was cleared while this reply was "typing".
        }
        const message = { ...next.message, at: Date.now() };
        const away = opts.current.activeKey !== demoKey || document.hidden;
        dispatch({ type: 'append', demoKey, message, unread: away });
        if (away && current.pushed) {
          opts.current.onArrived?.(demoKey, message);
        }
        pump(demoKey);
      }, next.typingMs);
    },
    [dispatch, lane, later, opts],
  );

  const enqueue = useCallback(
    (demoKey: string, replies: OutgoingMessage[], options: { lead: number; pushed: boolean }) => {
      if (replies.length === 0) {
        return;
      }
      const current = lane(demoKey);
      const [first, ...rest] = replies;
      current.items.push({ ...first, typingMs: first.typingMs + options.lead }, ...rest);
      current.pushed = current.pushed || options.pushed;
      if (!current.busy) {
        pump(demoKey);
      }
    },
    [lane, pump],
  );

  /** Runs `fn` once the chat has finished revealing its replies. */
  const whenIdle = useCallback(
    (demoKey: string, fn: () => void) => {
      const current = lane(demoKey);
      if (current.busy) {
        current.idle.push(fn);
      } else {
        fn();
      }
    },
    [lane],
  );

  const cancel = useCallback((demoKey: string) => {
    lanes.current.delete(demoKey);
  }, []);

  return useMemo(() => ({ enqueue, later, whenIdle, cancel }), [enqueue, later, whenIdle, cancel]);
}
