import {
  WHATSAPP_EVENT_TYPES,
  WhatsappDemoEventModel,
  WhatsappDemoSessionModel,
  type WhatsappEventType,
} from './whatsappDemo.analytics.model';
import { isDuplicateKey } from './whatsappDemo.validation';
import { actorNameOf } from '../../lib/actor';
import { badRequest } from '../../utils/errors';
import type { TokenPayload } from '../../utils/jwt';
import type { GraphQLContext } from '../../middleware/auth';

/** The most events one call may carry; the client flushes in batches well under this. */
export const MAX_EVENTS_PER_CALL = 100;
const LABEL_MAX = 80;

/** What the client may send. AI_CALL is written by the server alone, inside the parse. */
const CLIENT_TYPES: ReadonlySet<string> = new Set(
  WHATSAPP_EVENT_TYPES.filter((type) => type !== 'AI_CALL'),
);

export interface WhatsappDemoEventInput {
  id: string;
  sessionId: string;
  type: WhatsappEventType;
  at: string;
  demoKey?: string | null;
  workflow?: string | null;
  node?: string | null;
  stepKind?: string | null;
  label?: string | null;
  device?: string | null;
  viewport?: string | null;
  durationMs?: number | null;
}

/** One event as stored, before the tenant plugin stamps the company on it. */
export interface StoredEvent {
  eventId: string;
  sessionId: string;
  userId: string;
  type: WhatsappEventType;
  at: Date;
  demoKey: string | null;
  workflow: string | null;
  node: string | null;
  stepKind: string | null;
  label: string | null;
  durationMs: number | null;
  meta: Record<string, unknown> | null;
  device?: string | null;
  viewport?: string | null;
}

const short = (value: string | null | undefined, max: number): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

/** The event as it may be stored, or null when it is malformed and is dropped. */
function sanitize(input: WhatsappDemoEventInput, userId: string): StoredEvent | null {
  const at = new Date(input.at);
  const id = short(input.id, 64);
  const sessionId = short(input.sessionId, 64);
  if (!CLIENT_TYPES.has(input.type) || Number.isNaN(at.getTime()) || !id || !sessionId) {
    return null;
  }
  const duration = input.durationMs;
  return {
    eventId: id,
    sessionId,
    userId,
    type: input.type,
    at,
    demoKey: short(input.demoKey, 64),
    workflow: short(input.workflow, 64),
    node: short(input.node, 64),
    stepKind: short(input.stepKind, 16),
    label: short(input.label, LABEL_MAX),
    durationMs: typeof duration === 'number' && duration >= 0 ? Math.round(duration) : null,
    meta: null,
    device: short(input.device, 16),
    viewport: short(input.viewport, 20),
  };
}

/** Inserts what is new; a repeated event id is refused by the unique index and skipped. */
async function insertNew(events: StoredEvent[]): Promise<StoredEvent[]> {
  const rows = events.map(({ device: _device, viewport: _viewport, ...row }) => row);
  try {
    await WhatsappDemoEventModel.insertMany(rows, { ordered: false });
    return events;
  } catch (error) {
    const failures = (error as { writeErrors?: { code?: number; err?: { code?: number } }[] })
      .writeErrors;
    const onlyDuplicates =
      Array.isArray(failures) &&
      failures.every((f) => isDuplicateKey({ code: f.code ?? f.err?.code }));
    if (!onlyDuplicates) {
      throw error;
    }
    const inserted = new Set(
      ((error as { insertedDocs?: { eventId: string }[] }).insertedDocs ?? []).map(
        (d) => d.eventId,
      ),
    );
    return events.filter((event) => inserted.has(event.eventId));
  }
}

/** Folds one session's newly stored events into its running aggregate. */
async function foldSession(user: TokenPayload, userName: string, events: StoredEvent[]) {
  const times = events.map((event) => event.at.getTime());
  const start = events.find((event) => event.type === 'SESSION_START');
  const count = (type: WhatsappEventType) => events.filter((event) => event.type === type).length;
  const demos = [
    ...new Set(events.map((event) => event.demoKey).filter((key): key is string => !!key)),
  ];
  const sessionId = events[0].sessionId;
  await WhatsappDemoSessionModel.updateOne(
    { sessionId, userId: user.id },
    {
      $setOnInsert: { userName, userEmail: user.email },
      $min: { startedAt: new Date(Math.min(...times)) },
      $max: { lastEventAt: new Date(Math.max(...times)) },
      $inc: {
        events: events.length,
        flowsStarted: count('FLOW_STARTED'),
        flowsCompleted: count('FLOW_COMPLETED'),
      },
      $addToSet: { demos: { $each: demos } },
      ...(start
        ? { $set: { device: start.device ?? null, viewport: start.viewport ?? null } }
        : {}),
    },
    { upsert: true },
  );
  await WhatsappDemoSessionModel.updateOne({ sessionId, userId: user.id }, [
    { $set: { durationMs: { $subtract: ['$lastEventAt', '$startedAt'] } } },
  ]);
}

/**
 * Stores events for the signed-in user and updates their sessions. Events for a session
 * somebody else owns are dropped: the user always comes from the token, never the client.
 * Returns how many events were new.
 */
export async function storeEvents(
  ctx: GraphQLContext,
  user: TokenPayload,
  events: StoredEvent[],
): Promise<number> {
  const sessionIds = [...new Set(events.map((event) => event.sessionId))];
  const foreign = new Set(
    (
      await WhatsappDemoSessionModel.find({
        sessionId: { $in: sessionIds },
        userId: { $ne: user.id },
      })
        .select('sessionId')
        .lean()
    ).map((session) => session.sessionId),
  );
  const own = events.filter((event) => !foreign.has(event.sessionId));
  if (own.length === 0) {
    return 0;
  }
  const stored = await insertNew(own);
  if (stored.length === 0) {
    return 0;
  }
  const userName = await actorNameOf(ctx);
  for (const sessionId of new Set(stored.map((event) => event.sessionId))) {
    await foldSession(
      user,
      userName,
      stored.filter((event) => event.sessionId === sessionId),
    );
  }
  return stored.length;
}

export async function recordEvents(
  ctx: GraphQLContext,
  user: TokenPayload,
  inputs: readonly WhatsappDemoEventInput[],
): Promise<number> {
  if (inputs.length > MAX_EVENTS_PER_CALL) {
    badRequest(`At most ${MAX_EVENTS_PER_CALL} events can be sent at once.`);
  }
  const events = inputs
    .map((input) => sanitize(input, user.id))
    .filter((event): event is StoredEvent => event !== null);
  return events.length === 0 ? 0 : storeEvents(ctx, user, events);
}
