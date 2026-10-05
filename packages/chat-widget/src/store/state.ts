import type {
  Channel,
  ChatMessage,
  Identity,
  OutgoingFile,
  VisitorSession,
  WidgetConfig,
} from '../types';

export type Tab = Channel | 'FAQS';
export type Connection = 'idle' | 'connecting' | 'open' | 'reconnecting';
export type AuthStep = 'form' | 'code' | 'signedIn';
export type ItemStatus = 'sending' | 'sent' | 'failed';

/** One bubble: the message, and for the visitor's own, whether it reached the server. */
export interface ThreadItem {
  /** The clientId of a message this widget sent, else the message id — stable across the echo. */
  key: string;
  message: ChatMessage;
  status: ItemStatus;
  /** What to send again on retry. */
  files: OutgoingFile[];
}

export type Threads = Readonly<Record<Channel, readonly ThreadItem[]>>;

export interface ChatState {
  open: boolean;
  tab: Tab;
  connection: Connection;
  config: WidgetConfig | null;
  step: AuthStep;
  identity: Identity;
  codeSentAt: number;
  busy: boolean;
  session: VisitorSession | null;
  threads: Threads;
  /** Who is typing in each thread; '' when no one. */
  typing: Readonly<Record<Channel, string>>;
  unread: number;
  error: string;
  notice: string;
  /** Bumped on every switch to the Knowledge Bot, so the view can play the transition. */
  switches: number;
  soundOn: boolean;
}

export interface Store {
  get(): ChatState;
  set(patch: Partial<ChatState>): void;
  subscribe(listener: (state: ChatState, previous: ChatState) => void): () => void;
}

export const emptyThreads = (): Threads => ({ LIVE: [], KNOWLEDGE: [] });

export function initialState(soundOn: boolean): ChatState {
  return {
    open: false,
    tab: 'LIVE',
    connection: 'idle',
    config: null,
    step: 'form',
    identity: { name: '', email: '', phone: '' },
    codeSentAt: 0,
    busy: false,
    session: null,
    threads: emptyThreads(),
    typing: { LIVE: '', KNOWLEDGE: '' },
    unread: 0,
    error: '',
    notice: '',
    switches: 0,
    soundOn,
  };
}

/** A minimal observable state: every `set` notifies with the new and the previous state. */
export function createStore(initial: ChatState): Store {
  let state = initial;
  const listeners = new Set<(state: ChatState, previous: ChatState) => void>();
  return {
    get: () => state,
    set(patch) {
      const previous = state;
      state = { ...state, ...patch };
      listeners.forEach((listener) => listener(state, previous));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
