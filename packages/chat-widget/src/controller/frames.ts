import { readItem, removeItem, writeItem } from '../storage';
import { emptyThreads, type Store, type Threads } from '../store/state';
import {
  countUnread,
  withStatus,
  markVisitorRead,
  mergeHistory,
  upsertMessage,
} from '../store/threads';
import { strings } from '../strings';
import type { ChatMessage, ServerFrame, WidgetConfig } from '../types';
import type { Notifier } from './notifier';

export interface FrameContext {
  store: Store;
  keys: Readonly<{ token: string; sound: string }>;
  notifier: Notifier;
  markRead(): void;
}

function onConfig(ctx: FrameContext, config: WidgetConfig): void {
  const storedSound = readItem(ctx.keys.sound);
  const soundOn = storedSound === null ? config.soundEnabledByDefault : storedSound === 'on';
  const open = config.enabled && ctx.store.get().open;
  ctx.store.set({ config, soundOn, open });
}

function onSignedIn(ctx: FrameContext, frame: Extract<ServerFrame, { t: 'signedIn' }>): void {
  const { store } = ctx;
  writeItem(ctx.keys.token, frame.token);
  const unread = countUnread(frame.messages);
  const seeing = ctx.notifier.seeing();
  store.set({
    step: 'signedIn',
    session: frame.session,
    threads: mergeHistory(frame.messages, store.get().threads),
    busy: false,
    error: '',
    unread: seeing ? 0 : unread,
  });
  if (seeing && unread > 0) {
    ctx.markRead();
  }
}

/** The message an error names, marked failed; an error about anything else fails no message. */
function failOne(threads: Threads, clientId?: string): Threads {
  if (clientId === undefined) {
    return threads;
  }
  return {
    LIVE: withStatus(threads.LIVE, clientId, 'failed'),
    KNOWLEDGE: withStatus(threads.KNOWLEDGE, clientId, 'failed'),
  };
}

function onMessage(ctx: FrameContext, message: ChatMessage, clientId?: string): void {
  const state = ctx.store.get();
  const { channel } = message;
  const { items, added } = upsertMessage(state.threads[channel], message, clientId);
  const typing = message.sender === 'VISITOR' ? state.typing : { ...state.typing, [channel]: '' };
  ctx.store.set({ threads: { ...state.threads, [channel]: items }, typing });
  if (added && message.sender !== 'VISITOR') {
    ctx.notifier.incoming(message);
  }
}

/** Applies one server frame to the widget's state. */
export function handleFrame(ctx: FrameContext, frame: ServerFrame): void {
  const { store } = ctx;
  const state = store.get();
  switch (frame.t) {
    case 'config':
      onConfig(ctx, frame.config);
      return;
    case 'codeSent':
      store.set({ step: 'code', codeSentAt: Date.now(), busy: false, error: '' });
      return;
    case 'signedIn':
      onSignedIn(ctx, frame);
      return;
    case 'signedOut':
      removeItem(ctx.keys.token);
      store.set({ step: 'form', session: null, threads: emptyThreads(), busy: false, unread: 0 });
      return;
    case 'message':
      onMessage(ctx, frame.message, frame.clientId);
      return;
    case 'typing': {
      const channel = frame.who === 'AGENT' ? 'LIVE' : 'KNOWLEDGE';
      store.set({ typing: { ...state.typing, [channel]: frame.on ? frame.name : '' } });
      return;
    }
    case 'read':
      store.set({
        threads: { ...state.threads, LIVE: markVisitorRead(state.threads.LIVE, frame.at) },
      });
      return;
    case 'session':
      store.set({ session: frame.session });
      return;
    case 'switch':
      store.set({ tab: 'KNOWLEDGE', notice: strings.switchNotice, switches: state.switches + 1 });
      return;
    case 'error':
      store.set({
        error: frame.message,
        busy: false,
        threads: failOne(state.threads, frame.clientId),
      });
      return;
    case 'pong':
      return;
  }
}
