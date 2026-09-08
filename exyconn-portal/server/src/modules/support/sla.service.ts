import { SupportTicketModel } from '../employee/support.model';
import { DEFAULT_SLA_POLICIES, SupportSlaPolicyModel } from './sla-policy.model';
import { dueAtFrom, slaState, type SlaClocks, type SlaState } from './support.sla';
import { logger } from '../../utils/logger';

/**
 * Creates any missing default policy. Insert-only, like the email and status seeds: a
 * policy the team has retuned is theirs, and a restart must not quietly re-promise
 * something they decided against.
 */
export async function ensureSupportSlaPolicies(): Promise<number> {
  let created = 0;
  for (const policy of DEFAULT_SLA_POLICIES) {
    const result = await SupportSlaPolicyModel.updateOne(
      { priority: policy.priority },
      { $setOnInsert: policy },
      { upsert: true },
    );
    created += result.upsertedCount ?? 0;
  }
  if (created > 0) {
    logger.info(`Seeded ${created} support SLA policy/policies`);
  }
  return created;
}

/**
 * When a ticket of this priority is due, counting from `from`. Null when no active
 * policy covers the priority — the ticket then carries no deadline at all rather than
 * an invented one.
 */
export async function dueAtForPriority(priority: string, from: Date): Promise<Date | null> {
  const policy = await SupportSlaPolicyModel.findOne({ priority, active: true })
    .select('resolutionMinutes')
    .lean();
  return policy ? dueAtFrom(from, policy.resolutionMinutes) : null;
}

export interface SupportSlaSummary {
  onTrack: number;
  dueSoon: number;
  breached: number;
}

/**
 * How the open queue stands against its deadlines, plus everything that was finished
 * late. Only unresolved tickets are read row by row — that is the small set the team
 * can still act on; the resolved-late tally is one count in the database.
 */
export async function supportSlaSummary(now = new Date()): Promise<SupportSlaSummary> {
  const open = await SupportTicketModel.find({ resolvedAt: null, dueAt: { $ne: null } })
    .select('createdAt dueAt resolvedAt')
    .lean<SlaClocks[]>();

  const tally: Record<SlaState, number> = { ON_TRACK: 0, DUE_SOON: 0, BREACHED: 0, MET: 0 };
  for (const ticket of open) {
    tally[slaState(ticket, now)] += 1;
  }

  const resolvedLate = await SupportTicketModel.countDocuments({
    resolvedAt: { $ne: null },
    dueAt: { $ne: null },
    $expr: { $gt: ['$resolvedAt', '$dueAt'] },
  });

  return {
    onTrack: tally.ON_TRACK,
    dueSoon: tally.DUE_SOON,
    breached: tally.BREACHED + resolvedLate,
  };
}
