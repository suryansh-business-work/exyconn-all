import type { AiRequest, AiResult, ChatMessage, EngineSignal } from '@exyconn/wa-flow';
import type { DemoBundle, EngineContext } from '@exyconn/wa-flow/engine';

/** A published demo as the chat runs it, with the revision that tells versions apart. */
export interface CatalogBundle extends DemoBundle {
  revision: string;
}

/** What the runtime reports for analytics. */
export type RuntimeSignal =
  (EngineSignal & { demoKey: string }) | { type: 'DEMO_OPENED' | 'CHAT_CLEARED'; demoKey: string };

export interface RuntimeOptions {
  bundles: ReadonlyMap<string, CatalogBundle>;
  /** A fresh engine context (its `now` is read per event). */
  context: () => EngineContext;
  /** Whose chats these are — null keeps them in memory only (the editor's preview). */
  storageUserId: string | null;
  /** Seeds each chat's dummy data, so a viewer's ids and slots stay stable. */
  seedText: string;
  /** The chat on screen; messages anywhere else count as unread. */
  activeKey: string | undefined;
  track?: (signal: RuntimeSignal) => void;
  parse?: (request: AiRequest, demoKey: string) => Promise<AiResult>;
  /** A message arrived on its own (a reminder) in a chat that is not on screen. */
  onArrived?: (demoKey: string, message: ChatMessage) => void;
}
