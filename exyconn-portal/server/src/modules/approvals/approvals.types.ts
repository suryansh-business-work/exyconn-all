import type { Role } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

/** The only two answers an approval takes. Withdrawal is the requester's own action. */
export type ApprovalDecision = 'APPROVED' | 'REJECTED';

/**
 * One thing waiting on somebody, flattened out of whichever collection owns it.
 *
 * Deliberately NOT a stored record. An approval lives in the domain collection that owns
 * the decision — a leave request is the leave request — so this is a read-through view.
 * A central `approvals` collection would be a second copy of the truth, and the two would
 * drift the first time anything decided a claim without going through the queue.
 */
export interface PendingApproval {
  /** Id within the owning collection. The queue exposes `${kind}:${recordId}`. */
  recordId: string;
  title: string;
  summary: string;
  /** User id of whoever raised it. */
  requestedById: string;
  requestedAt: Date;
  /** Money at stake, when the decision is about money. */
  amount: number | null;
  currency: string | null;
}

/** Whose pending rows to read: every one, or only these employees'. */
export type ApprovalScope = { ownerIds: string[] | null };

/** What a caller may decide, and how they came by that right. */
export interface DecideArgs {
  recordId: string;
  decision: ApprovalDecision;
  note: string | null;
}

/**
 * A module lending its pending decisions to the shared queue.
 *
 * `decide` delegates to the module's own service rather than writing the status here, so
 * authorization, validation and the requester's notification stay in the one place that
 * already gets them right — the queue is a second door onto the same decision, never a
 * second implementation of it.
 */
export interface ApprovalSource {
  /** Stable identifier; half of an approval's composite id, so it must never be renamed. */
  kind: string;
  label: string;
  /** Permission-matrix module, for the APPROVE check. */
  module: string;
  /** Roles that may decide by virtue of the role itself. */
  roles: Role[];
  /** Whether the requester's manager may decide it through the reporting line. */
  managerMayDecide: boolean;
  /** Portal path the row links to. */
  link: string;
  pending(scope: ApprovalScope): Promise<PendingApproval[]>;
  decide(args: DecideArgs, ctx: GraphQLContext): Promise<void>;
}
