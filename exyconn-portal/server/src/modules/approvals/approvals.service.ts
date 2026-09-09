import { isValidObjectId } from 'mongoose';
import { UserModel } from '../admin/user.model';
import { directReportIds } from '../admin/reporting';
import { isAllowed } from '../../lib/permissions';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { badRequest, forbidden } from '../../utils/errors';
import { ROLES, type Role } from '../../constants/roles';
import { APPROVAL_SOURCES, sourceByKind } from './approvals.registry';
import type { ApprovalDecision, ApprovalScope, ApprovalSource } from './approvals.types';
import type { GraphQLContext } from '../../middleware/auth';

/** One row of the shared queue, as GraphQL hands it back. */
export interface ApprovalItem {
  id: string;
  kind: string;
  kindLabel: string;
  title: string;
  summary: string;
  requestedById: string;
  requestedByName: string;
  requestedAt: Date;
  link: string;
  amount: number | null;
  currency: string | null;
}

export interface ApprovalGroup {
  kind: string;
  label: string;
  count: number;
}

export interface ApprovalQueue {
  items: ApprovalItem[];
  groups: ApprovalGroup[];
  totalCount: number;
}

/**
 * How much of a source this caller may act on: everything, only their reports', or none.
 *
 * The role path is measured against the permission matrix, so an administrator who has
 * taken APPROVE away from a role does not leave that role a queue full of buttons the
 * server would refuse. The manager path deliberately is not — a manager deciding their
 * own report's request is acting through the reporting line, not through the module's
 * role, exactly as `assertApprovePermission` already reasons about it.
 */
async function scopeFor(source: ApprovalSource, roles: Role[], userId: string) {
  if (roles.includes(ROLES.ADMIN)) return { ownerIds: null };
  const byRole = roles.some((role) => source.roles.includes(role));
  if (byRole && (await isAllowed(roles, source.module, 'APPROVE'))) return { ownerIds: null };
  if (!source.managerMayDecide) return null;
  const ownerIds = await directReportIds(userId);
  return ownerIds.length > 0 ? { ownerIds } : null;
}

/** Display names for the people who raised these approvals, in one query. */
async function namesFor(ids: string[]): Promise<Map<string, string>> {
  const valid = [...new Set(ids)].filter(isValidObjectId);
  if (valid.length === 0) return new Map();
  const rows = await UserModel.find({ _id: { $in: valid } })
    .select('name')
    .lean();
  return new Map(rows.map((row) => [String(row._id), row.name]));
}

/** Reads one source's pending rows, or nothing when the caller may not act on it. */
async function itemsFrom(
  source: ApprovalSource,
  scope: ApprovalScope | null,
): Promise<Omit<ApprovalItem, 'requestedByName'>[]> {
  if (!scope) return [];
  const rows = await source.pending(scope);
  return rows.map((row) => ({
    ...row,
    id: `${source.kind}:${row.recordId}`,
    kind: source.kind,
    kindLabel: source.label,
    link: source.link,
  }));
}

/** The sources this caller may act on at all, paired with how far their reach goes. */
function scopedSources(roles: Role[], userId: string) {
  return Promise.all(
    APPROVAL_SOURCES.map(async (source) => ({
      source,
      scope: await scopeFor(source, roles, userId),
    })),
  );
}

/**
 * Everything waiting on the signed-in user, across every module, newest first.
 *
 * Every source the caller may act on is read whatever `kind` says, so the counts behind
 * the filter stay the caller's whole backlog: a filtered queue that also shrank its own
 * totals would tell a manager they were finished when they were not. `kind` narrows the
 * rows and nothing else — it can never reach a source the unfiltered call would have
 * hidden.
 */
export async function myApprovals(
  ctx: GraphQLContext,
  kind?: string | null,
): Promise<ApprovalQueue> {
  const user = assertAuthenticated(ctx);
  const roles = (user.roles ?? []) as Role[];
  // Only sources the caller may actually act on: a filter chip for a queue they can never
  // open is a promise the server would refuse.
  const scoped = (await scopedSources(roles, user.id)).filter((entry) => entry.scope !== null);

  const perSource = await Promise.all(scoped.map((e) => itemsFrom(e.source, e.scope)));
  const groups = scoped.map((entry, index) => ({
    kind: entry.source.kind,
    label: entry.source.label,
    count: perSource[index].length,
  }));
  const totalCount = perSource.reduce((sum, rows) => sum + rows.length, 0);

  const wanted = kind ? perSource.flat().filter((item) => item.kind === kind) : perSource.flat();
  const names = await namesFor(wanted.map((item) => item.requestedById));
  const items = wanted
    .map((item) => ({ ...item, requestedByName: names.get(item.requestedById) ?? 'Unknown' }))
    .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());

  return { items, groups, totalCount };
}

/** The badge number. Counts the same rows the queue would show, without resolving names. */
export async function myPendingApprovalCount(ctx: GraphQLContext): Promise<number> {
  const user = assertAuthenticated(ctx);
  const roles = (user.roles ?? []) as Role[];
  const scoped = await scopedSources(roles, user.id);
  const counts = await Promise.all(scoped.map((e) => itemsFrom(e.source, e.scope)));
  return counts.reduce((total, rows) => total + rows.length, 0);
}

/** Splits `LEAVE:663f…` into its two halves. */
function parseApprovalId(id: string): { kind: string; recordId: string } {
  const separator = id.indexOf(':');
  if (separator <= 0 || separator === id.length - 1) {
    badRequest('An approval id looks like "KIND:recordId".');
  }
  return { kind: id.slice(0, separator), recordId: id.slice(separator + 1) };
}

/**
 * Applies a decision through the owning module's own service.
 *
 * The caller's right to decide is re-checked twice over: once here, against the same
 * scope the queue was built from, and again inside the module's service. The second check
 * is the one that counts — this one only stops a caller reaching a source whose rows they
 * were never shown.
 */
export async function decideApproval(
  ctx: GraphQLContext,
  id: string,
  decision: ApprovalDecision,
  note?: string | null,
): Promise<boolean> {
  const user = assertAuthenticated(ctx);
  const roles = (user.roles ?? []) as Role[];
  const { kind, recordId } = parseApprovalId(id);

  const source = sourceByKind(kind);
  if (!source) badRequest(`Nothing approves "${kind}".`);

  const scope = await scopeFor(source, roles, user.id);
  if (!scope) forbidden(`You may not decide ${source.label.toLowerCase()}s`);

  await source.decide({ recordId, decision, note: note ?? null }, ctx);
  return true;
}
