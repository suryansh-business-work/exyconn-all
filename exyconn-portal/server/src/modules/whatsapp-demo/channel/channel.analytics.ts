import { createHash, randomUUID } from 'node:crypto';
import type { EngineSignal } from '@exyconn/wa-flow';
import { storeActorEvents, type EventActor, type StoredEvent } from '../whatsappDemo.events';
import type { WhatsappEventType } from '../whatsappDemo.analytics.model';
import { SESSION_IDLE_MS } from '../whatsappDemo.present';
import { logger } from '../../../utils/logger';

/**
 * Conversations on the real number feed the same Analytics and Sessions screens as the
 * browser chat. A person is identified by a hash of their number, and shown by their WhatsApp
 * name with the number masked: the screens are for how the demo is used, not who used it.
 */

const LABEL_MAX = 80;
const DEVICE = 'whatsapp';

export interface ChatIdentity {
  waId: string;
  name: string;
}

/** Everything but the last four digits hidden. */
const maskedNumber = (waId: string) =>
  `+${'•'.repeat(Math.max(waId.length - 4, 0))}${waId.slice(-4)}`;

export function actorOf(chat: ChatIdentity): EventActor {
  const hash = createHash('sha256').update(chat.waId).digest('hex').slice(0, 24);
  return {
    id: `wa:${hash}`,
    name: chat.name || maskedNumber(chat.waId),
    email: maskedNumber(chat.waId),
  };
}

/** The chat's session, or a new one after a long silence. */
export function sessionFor(sessionId: string | null, lastEventAt: Date | null, now: number) {
  const fresh = !sessionId || !lastEventAt || now - lastEventAt.getTime() > SESSION_IDLE_MS;
  return fresh ? { id: `wa-${randomUUID()}`, started: true } : { id: sessionId, started: false };
}

/** One analytics event: what happened, never what was typed. */
export interface ChatEvent {
  type: WhatsappEventType;
  demoKey: string | null;
  workflow?: string;
  node?: string;
  stepKind?: string;
  label?: string;
}

export function fromSignal(signal: EngineSignal, demoKey: string): ChatEvent {
  if (signal.type === 'STEP') {
    return {
      type: 'STEP',
      demoKey,
      workflow: signal.workflow,
      node: signal.node,
      stepKind: signal.stepKind,
      label: signal.label,
    };
  }
  return { type: signal.type, demoKey, workflow: signal.workflow, node: signal.node };
}

function stored(actor: EventActor, sessionId: string, event: ChatEvent, at: Date): StoredEvent {
  return {
    eventId: `wa-${randomUUID()}`,
    sessionId,
    userId: actor.id,
    type: event.type,
    at,
    demoKey: event.demoKey,
    workflow: event.workflow ?? null,
    node: event.node ?? null,
    stepKind: event.stepKind ?? null,
    label: event.label ? event.label.slice(0, LABEL_MAX) : null,
    durationMs: null,
    meta: null,
    device: event.type === 'SESSION_START' ? DEVICE : null,
  };
}

/** Records the events; analytics never stops a conversation, so a failure is only logged. */
export async function recordChatEvents(actor: EventActor, sessionId: string, events: ChatEvent[]) {
  if (events.length === 0) {
    return;
  }
  const at = new Date();
  try {
    await storeActorEvents(
      actor,
      events.map((event) => stored(actor, sessionId, event, at)),
    );
  } catch (error) {
    logger.error({ err: error }, 'WhatsApp channel analytics could not be recorded');
  }
}
