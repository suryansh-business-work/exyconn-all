import type { GraphQLContext } from '../../middleware/auth';
import { recordAudit, type AuditAction } from '../audit';
import { logMaEvent, type EventDetails, type MeetingRef } from './events.service';
import { MA_AUDIT_MODULE } from './ma.enums';
import type { MaActor } from './ma.access';

export interface ActivityInput {
  type: string;
  action: AuditAction;
  summary: string;
  meeting?: MeetingRef | null;
  details?: EventDetails;
}

/**
 * Something a person did in the Meeting Assistant, written to BOTH logs: the audit log (so it
 * shows in that person's Activity on their employee and user pages, and in Admin › Audit Log)
 * and the assistant's own event log (the AI portal's Logs page and the meeting's Activity tab).
 */
export async function recordMaActivity(
  ctx: GraphQLContext,
  actor: MaActor,
  input: ActivityInput,
): Promise<void> {
  await recordAudit(ctx, {
    action: input.action,
    module: MA_AUDIT_MODULE,
    entityId: input.meeting?._id,
    entityLabel: input.meeting?.title ?? '',
    summary: input.summary,
    actor: { id: actor.id, name: actor.name, email: actor.email },
  });
  await logMaEvent({
    type: input.type,
    message: input.summary,
    meeting: input.meeting,
    actor: { id: actor.id, name: actor.name },
    details: input.details,
  });
}
