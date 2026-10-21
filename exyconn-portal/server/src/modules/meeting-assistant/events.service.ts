import { logger } from '../../utils/logger';
import { MaEventModel, type MaEventLevel, type MaMeetingDocument } from './models';

/** Who an event is attributed to: a person, or the assistant itself. */
export interface EventActor {
  id: string;
  name: string;
}

export const SYSTEM_EVENT_ACTOR: EventActor = Object.freeze({
  id: 'system',
  name: 'Meeting Assistant',
});

type MeetingRef = Pick<MaMeetingDocument, 'title' | 'viewerIds'> & { _id: unknown };

export interface EventInput {
  type: string;
  message: string;
  level?: MaEventLevel;
  meeting?: MeetingRef | null;
  actor?: EventActor;
  /** Ids, counts, codes — never audio, transcript text, tokens or addresses' contents. */
  details?: Record<string, string | number | boolean | null>;
}

/**
 * Appends one event to the Meeting Assistant log. Best-effort, like the audit log: the thing
 * it describes already happened, so a failed write is logged and never thrown.
 */
export async function logMaEvent(input: EventInput): Promise<void> {
  const actor = input.actor ?? SYSTEM_EVENT_ACTOR;
  const viewers = new Set(input.meeting?.viewerIds ?? []);
  if (actor.id !== SYSTEM_EVENT_ACTOR.id) {
    viewers.add(actor.id);
  }
  try {
    await MaEventModel.create({
      meetingId: input.meeting ? String(input.meeting._id) : null,
      meetingTitle: input.meeting?.title ?? '',
      viewerIds: [...viewers],
      actorId: actor.id,
      actorName: actor.name,
      type: input.type,
      level: input.level ?? 'INFO',
      message: input.message.slice(0, 1000),
      details: input.details ? JSON.stringify(input.details).slice(0, 4000) : '',
    });
  } catch (error) {
    logger.error({ err: error, type: input.type }, 'Meeting assistant event write failed');
  }
}
