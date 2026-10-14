/**
 * Plays the demos: feeds what the viewer does to the engine, reveals the replies one by one
 * behind "typing…", animates the ticks, delivers reminders when they fall due, asks the server
 * to read free text when a workflow needs it, and keeps each chat in the viewer's browser.
 */
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { ChatState, RenderedOption } from '@exyconn/wa-flow';
import { newChatState, respond, type ChatEvent } from '@exyconn/wa-flow/engine';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { WA_MOTION } from '../theme/wa.tokens';
import { loadChats, saveChats } from './storage';
import { chatReducer, EMPTY_STORE, type ChatStore } from './store';
import type { RuntimeOptions } from './types';
import { useReplyQueue } from './useReplyQueue';

const PUSH_TICK_MS = 1000;
const UPDATED_NOTICE =
  'This business updated its replies since your last visit. Type menu to see what is new.';

function initialStore(userId: string | null): ChatStore {
  const saved = userId ? loadChats(userId) : null;
  return saved ? { ...saved, typing: {} } : EMPTY_STORE;
}

function enginesOf(store: ChatStore): Map<string, ChatState> {
  return new Map(Object.entries(store.chats).map(([key, chat]) => [key, chat.state]));
}

export function useChatRuntime(options: RuntimeOptions) {
  // Read synchronously, so a chat opened on the first render finds its saved transcript.
  const [store, dispatch] = useReducer(chatReducer, options.storageUserId, initialStore);
  const opts = useRef(options);
  opts.current = options;
  const storeRef = useRef(store);
  storeRef.current = store;
  /** Engine state per chat, updated synchronously so quick taps never read a stale one. */
  const [initialEngines] = useState(() => enginesOf(store));
  const engine = useRef(initialEngines);
  const queue = useReplyQueue(dispatch, opts);

  useEffect(() => {
    const userId = options.storageUserId;
    if (userId) {
      saveChats(userId, store);
    }
  }, [store, options.storageUserId]);

  const run = useCallback(
    (demoKey: string, event: ChatEvent) => {
      const bundle = opts.current.bundles.get(demoKey);
      const state = engine.current.get(demoKey);
      if (!bundle || !state) {
        return;
      }
      const result = respond(bundle, state, event, opts.current.context());
      engine.current.set(demoKey, result.state);
      dispatch({ type: 'state', demoKey, state: result.state });
      const sent = result.sent;
      if (sent) {
        dispatch({ type: 'append', demoKey, message: sent, unread: false });
        queue.later(
          () => dispatch({ type: 'status', demoKey, id: sent.id, status: 'delivered' }),
          WA_MOTION.deliveredMs,
        );
        queue.later(
          () => dispatch({ type: 'status', demoKey, id: sent.id, status: 'read' }),
          WA_MOTION.readMs,
        );
      }
      if (result.scheduled.length > 0) {
        dispatch({ type: 'schedule', pushes: result.scheduled });
      }
      for (const signal of result.signals) {
        opts.current.track?.({ ...signal, demoKey });
      }
      queue.enqueue(demoKey, result.replies, {
        lead: sent ? WA_MOTION.readMs : 0,
        pushed: event.type === 'push',
      });
      const ai = result.ai;
      const parse = opts.current.parse;
      if (ai && parse) {
        queue.whenIdle(demoKey, () => {
          dispatch({ type: 'typing', demoKey, typing: true });
          parse(ai, demoKey)
            .catch((error: unknown) => {
              portalLogger.warn('wa-demo: AI parse failed', error);
              return null;
            })
            .then((reading) => run(demoKey, { type: 'ai', request: ai, result: reading }))
            .catch((error: unknown) => portalLogger.error('wa-demo: AI reply failed', error));
        });
      }
    },
    [queue],
  );

  const begin = useCallback(
    (demoKey: string) => {
      const bundle = opts.current.bundles.get(demoKey);
      const state = newChatState(demoKey, opts.current.seedText);
      engine.current.set(demoKey, state);
      dispatch({ type: 'reset', demoKey, state, revision: bundle?.revision });
      run(demoKey, { type: 'start' });
    },
    [run],
  );

  const open = useCallback(
    (demoKey: string) => {
      const bundle = opts.current.bundles.get(demoKey);
      if (!bundle) {
        return;
      }
      opts.current.track?.({ type: 'DEMO_OPENED', demoKey });
      const chat = storeRef.current.chats[demoKey];
      if (!chat || !engine.current.has(demoKey)) {
        begin(demoKey);
        return;
      }
      dispatch({ type: 'read', demoKey });
      if (chat.revision !== bundle.revision) {
        dispatch({ type: 'revision', demoKey, revision: bundle.revision });
        const notice = { type: 'system' as const, text: opts.current.context().t(UPDATED_NOTICE) };
        dispatch({
          type: 'append',
          demoKey,
          unread: false,
          message: {
            id: `${demoKey}-rev-${bundle.revision}`,
            from: 'bot',
            at: Date.now(),
            content: notice,
          },
        });
      }
    },
    [begin],
  );

  const clear = useCallback(
    (demoKey: string) => {
      queue.cancel(demoKey);
      dispatch({ type: 'typing', demoKey, typing: false });
      dispatch({ type: 'unscheduleDemo', demoKey });
      opts.current.track?.({ type: 'CHAT_CLEARED', demoKey });
      begin(demoKey);
    },
    [begin, queue],
  );

  const send = useCallback(
    (demoKey: string, text: string) => run(demoKey, { type: 'text', text }),
    [run],
  );
  const choose = useCallback(
    (demoKey: string, option: RenderedOption, quoted: string) =>
      run(demoKey, { type: 'choice', option, quoted }),
    [run],
  );

  useEffect(() => {
    const timer = globalThis.setInterval(() => {
      const due = storeRef.current.pending.filter(
        (p) => p.at <= Date.now() && opts.current.bundles.has(p.demoKey),
      );
      if (due.length === 0) {
        return;
      }
      dispatch({ type: 'unschedule', ids: due.map((p) => p.id) });
      for (const push of due) {
        run(push.demoKey, { type: 'push', push });
      }
    }, PUSH_TICK_MS);
    return () => globalThis.clearInterval(timer);
  }, [run]);

  return { store, open, send, choose, clear };
}

export type ChatRuntime = ReturnType<typeof useChatRuntime>;
