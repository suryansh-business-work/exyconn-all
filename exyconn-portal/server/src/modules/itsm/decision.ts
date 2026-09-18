import { isValidObjectId, type Model } from 'mongoose';
import { actorNameOf } from '../../lib/actor';
import { badRequest, notFound } from '../../utils/errors';
import { withId } from '../../utils/serialize';
import { notifyBestEffort } from '../notifications/notifications.service';
import type { GraphQLContext } from '../../middleware/auth';

export type ItDecision = 'APPROVED' | 'REJECTED';

/** The fields every decidable IT record shares. */
export interface DecidableRecord {
  status: string;
  requestedById?: string | null;
  decidedByName?: string | null;
  decidedAt?: Date | null;
  decisionNote?: string | null;
  /** The rest of the record, which `describe` reads from. */
  [field: string]: unknown;
}

export interface DecisionSpec {
  /** Singular label for errors and the requester's notification, e.g. "Access request". */
  label: string;
  /** The statuses a record must be in to be decided. */
  awaiting: ReadonlySet<string>;
  /** Where the requester's notification links to. */
  link: string;
  /** How the notification names the record, e.g. its title. */
  describe: (record: DecidableRecord) => string;
}

/**
 * Approves or rejects one IT record — an access request, a change, a purchase. One path for
 * all three, whether the decision comes from the module's own screen or the shared approvals
 * queue, so who decided, when and why is stamped the same way everywhere.
 */
export async function decideRecord(
  model: Model<DecidableRecord>,
  spec: DecisionSpec,
  args: { id: string; decision: ItDecision; note?: string | null },
  ctx: GraphQLContext,
) {
  if (!isValidObjectId(args.id)) {
    notFound(spec.label);
  }
  const record = await model.findById(args.id);
  if (!record) {
    notFound(spec.label);
  }
  if (!spec.awaiting.has(record.status)) {
    badRequest(`This ${spec.label.toLowerCase()} has already been decided`);
  }
  record.status = args.decision;
  record.decidedByName = await actorNameOf(ctx);
  record.decidedAt = new Date();
  record.decisionNote = args.note?.trim() ?? '';
  await record.save();

  const saved = record.toObject();
  if (saved.requestedById) {
    await notifyBestEffort(saved.requestedById, {
      kind: 'IT',
      title: `${spec.label} ${args.decision.toLowerCase()}: ${spec.describe(saved)}`,
      body: saved.decisionNote ?? '',
      link: spec.link,
    });
  }
  return withId(saved);
}
