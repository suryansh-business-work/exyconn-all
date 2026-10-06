import type { Connection } from "../lib/socket";
import type {
  Channel,
  ChatMessage,
  Identity,
  OutgoingFile,
  VisitorSession,
  WidgetConfig,
} from "../types";

export type Tab = Channel | "FAQS";
export type AuthStep = "form" | "code" | "signedIn";
export type ItemStatus = "sending" | "sent" | "failed";

/** One bubble: the message, and for the visitor's own, whether it reached the server. */
export interface ThreadItem {
  /** The clientId of a message this chat sent, else the message id — stable across the echo. */
  key: string;
  message: ChatMessage;
  status: ItemStatus;
  /** What to send again on retry. */
  files: OutgoingFile[];
  /** Why the server refused it, when it said. */
  error?: string;
}

export type Threads = Readonly<Record<Channel, readonly ThreadItem[]>>;

export interface ChatState {
  open: boolean;
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
  /** Bumped on every reply that arrives unseen, so the launcher can play its nudge. */
  nudges: number;
  /** A problem that names no single message (sign-in refused, not connected…). */
  error: string;
  soundOn: boolean;
}

export interface Store {
  get(): ChatState;
  set(patch: Partial<ChatState>): void;
  subscribe(listener: () => void): () => void;
}

export const emptyThreads = (): Threads => ({ LIVE: [], KNOWLEDGE: [] });

export function initialState(soundOn: boolean): ChatState {
  return {
    open: false,
    connection: "idle",
    config: null,
    step: "form",
    identity: { name: "", email: "", phone: "" },
    codeSentAt: 0,
    busy: false,
    session: null,
    threads: emptyThreads(),
    typing: { LIVE: "", KNOWLEDGE: "" },
    unread: 0,
    nudges: 0,
    error: "",
    soundOn,
  };
}

/** A minimal observable state for `useSyncExternalStore`: every `set` makes a new snapshot. */
export function createStore(initial: ChatState): Store {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...patch };
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
