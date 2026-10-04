import { randomBytes } from 'node:crypto';
import type { ChatState, PendingPush, RenderedOption } from '@exyconn/wa-flow';
import { toDemoBundle, type CatalogWarn } from '@exyconn/wa-flow';
import type { DemoBundle } from '@exyconn/wa-flow/engine';
import { WhatsappChatModel } from './chat.model';
import { catalog } from '../whatsappDemo.service';
import { isDuplicateKey } from '../whatsappDemo.validation';
import { logger } from '../../../utils/logger';

/** A chat as the conversation reads it. */
export interface ChatRecord {
  id: string;
  waId: string;
  name: string;
  demoKey: string | null;
  state: ChatState | null;
  options: Record<string, RenderedOption>;
  pending: PendingPush[];
  sessionId: string | null;
  lastEventAt: Date | null;
}

/** How many message ids are remembered for spotting Meta's redeliveries. */
const SEEN_MAX = 30;
/** How many offered options stay tappable; older buttons answer with the menu. */
const OPTIONS_MAX = 80;

type Lean = {
  _id: unknown;
  waId: string;
  name?: string | null;
  demoKey?: string | null;
  state?: unknown;
  options?: unknown;
  pending?: unknown[];
  sessionId?: string | null;
  lastEventAt?: Date | null;
};

export function toRecord(doc: Lean): ChatRecord {
  return {
    id: String(doc._id),
    waId: doc.waId,
    name: doc.name ?? '',
    demoKey: doc.demoKey ?? null,
    state: (doc.state as ChatState | null) ?? null,
    options: (doc.options as Record<string, RenderedOption> | undefined) ?? {},
    pending: (doc.pending as PendingPush[] | undefined) ?? [],
    sessionId: doc.sessionId ?? null,
    lastEventAt: doc.lastEventAt ?? null,
  };
}

/**
 * The chat this message belongs to, created on a first message — or null when the message
 * was already handled, which is how a redelivered webhook is ignored.
 */
export async function claimMessage(waId: string, name: string, messageId: string) {
  try {
    const doc = await WhatsappChatModel.findOneAndUpdate(
      { waId, seen: { $ne: messageId } },
      { $set: { name }, $push: { seen: { $each: [messageId], $slice: -SEEN_MAX } } },
      { upsert: true, new: true },
    ).lean();
    return doc ? toRecord(doc) : null;
  } catch (error) {
    // The id is already in `seen`, so the filter missed the row and the upsert collided.
    if (isDuplicateKey(error)) {
      return null;
    }
    throw error;
  }
}

/** Options keep their short ids across messages, newest last, so old ones age out first. */
export function optionRegistry(existing: Readonly<Record<string, RenderedOption>>) {
  const options = new Map(Object.entries(existing));
  return {
    register: (option: RenderedOption) => {
      const id = `o${randomBytes(5).toString('hex')}`;
      options.set(id, option);
      return id;
    },
    entries: () => Object.fromEntries([...options].slice(-OPTIONS_MAX)),
  };
}

export const nextDueAt = (pending: readonly PendingPush[]) =>
  pending.length === 0 ? null : new Date(Math.min(...pending.map((p) => p.at)));

export interface ChatUpdate {
  demoKey: string | null;
  state: ChatState | null;
  options: Record<string, RenderedOption>;
  pending: PendingPush[];
  sessionId: string;
  lastEventAt: Date;
}

export async function saveChat(id: string, update: ChatUpdate): Promise<void> {
  await WhatsappChatModel.updateOne(
    { _id: id },
    { $set: { ...update, nextDueAt: nextDueAt(update.pending) } },
  );
}

const warn: CatalogWarn = (message, error, meta) => logger.warn({ err: error, ...meta }, message);

/** The published industries, in menu order, as the chat runs them. */
export async function publishedBundles(): Promise<DemoBundle[]> {
  const entries = await catalog();
  return entries
    .map((entry) => toDemoBundle(entry, warn))
    .filter((bundle): bundle is DemoBundle => bundle !== null);
}
