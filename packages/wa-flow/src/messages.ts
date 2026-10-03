/**
 * What a chat holds once a workflow has been played: rendered messages (templates filled in,
 * prices resolved, dynamic rows generated), and the engine's per-chat state. These are what
 * the WhatsApp screen draws and what each viewer's browser keeps as the transcript.
 */
import type { ContactCard, DocumentAttachment, Illustration, LocationPin, Ticket } from './schema';

/** Where a tapped option leads: the output of a node in a workflow. */
export interface OptionRef {
  /** Workflow key, or `$menu` for the main menu. */
  workflow: string;
  node: string;
  handle: string;
}

export interface RenderedOption {
  id: string;
  title: string;
  description?: string;
  /** Variables set when chosen, already rendered. */
  set?: Readonly<Record<string, string>>;
  ref: OptionRef;
}

export interface RenderedProduct {
  id: string;
  title: string;
  subtitle?: string;
  price: number;
  mrp?: number;
  badge?: string;
  image: Illustration;
}

export interface RenderedOrder {
  orderId: string;
  title: string;
  items: { id: string; name: string; qty: number; price: number }[];
  adjustments: { id: string; label: string; amount: number }[];
  total: number;
  status: 'pending' | 'paid';
}

export type RenderedCta =
  | { kind: 'url'; title: string; url: string }
  | { kind: 'call'; title: string; phone: string }
  | {
      kind: 'calendar';
      title: string;
      event: { title: string; start: number; durationMin: number; location?: string };
    };

/** Everything the bot can send, ready to draw. */
export type BotContent =
  /** `sender` labels a message from a human agent after a handoff. */
  | { type: 'text'; text: string; sender?: string }
  | { type: 'buttons'; header?: string; text: string; footer?: string; buttons: RenderedOption[] }
  | {
      type: 'list';
      header?: string;
      text: string;
      footer?: string;
      button: string;
      sections: { id: string; title: string; rows: RenderedOption[] }[];
    }
  | { type: 'cta'; header?: string; text: string; footer?: string; actions: RenderedCta[] }
  | { type: 'image'; image: Illustration; caption?: string }
  | { type: 'document'; document: DocumentAttachment; caption?: string }
  | { type: 'location'; location: LocationPin; caption?: string }
  | { type: 'contact'; contact: ContactCard }
  | { type: 'product'; product: RenderedProduct; option?: RenderedOption }
  | {
      type: 'carousel';
      text?: string;
      cards: { product: RenderedProduct; option?: RenderedOption }[];
    }
  | { type: 'ticket'; ticket: Ticket; caption?: string }
  | { type: 'order'; order: RenderedOrder; pay?: RenderedOption }
  /** A centred notice, not a bubble. */
  | { type: 'system'; text: string };

/** What the customer sends. */
export type UserContent =
  | { type: 'text'; text: string }
  /** A tapped button or row, shown quoting the message it answered. */
  | { type: 'reply'; text: string; quoted: string };

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface ChatMessage {
  id: string;
  from: 'bot' | 'user';
  /** Epoch milliseconds. */
  at: number;
  content: BotContent | UserContent;
  /** Ticks, on the customer's own messages. */
  status?: MessageStatus;
}

/** Engine state of one chat, persisted beside its transcript. */
export interface ChatState {
  demoKey: string;
  vars: Record<string, string>;
  /** Input or AI node waiting for typed text. */
  awaiting?: { workflow: string; node: string };
  /** Workflow in progress, and whether it has completed. */
  workflow?: string;
  completed?: boolean;
  /** Message counter, for ids and fresh dummy data per step. */
  seq: number;
  /** Seeds the dummy data, so a chat's ids and slots stay stable. */
  seed: number;
}

/** A message that arrives later on its own. */
export interface PendingPush {
  id: string;
  demoKey: string;
  workflow: string;
  node: string;
  /** Epoch milliseconds it is due. */
  at: number;
  label?: string;
}

/** What happened, for analytics. */
export type EngineSignal =
  | { type: 'FLOW_STARTED' | 'FLOW_COMPLETED' | 'FLOW_ABANDONED'; workflow: string; node: string }
  | { type: 'STEP'; workflow?: string; node: string; stepKind: 'choice' | 'text'; label: string }
  | { type: 'REMINDER_DELIVERED'; workflow: string; node: string };

export interface OutgoingMessage {
  message: ChatMessage;
  /** How long "typing…" shows before it. */
  typingMs: number;
}

/** Free text the server should read with OpenAI before the chat can go on. */
export interface AiRequest {
  /** Workflow key, or `$router` when choosing which workflow the text is about. */
  workflow: string;
  node: string;
  text: string;
  intents: { id: string; description: string }[];
  entities: { name: string; kind: string; description: string }[];
}

/** The server's reading of it; null when OpenAI is unavailable or failed. */
export type AiResult = { intent: string | null; entities: Readonly<Record<string, string>> } | null;

export interface EngineResult {
  state: ChatState;
  /** The customer's own bubble, when the event was theirs. */
  sent?: ChatMessage;
  replies: OutgoingMessage[];
  scheduled: PendingPush[];
  signals: EngineSignal[];
  /** Set when the engine needs the server to read the text first; answer with an `ai` event. */
  ai?: AiRequest;
}
