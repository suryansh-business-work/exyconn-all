import { LeaveRequestModel } from '../hr/hr.model';
import { ExpenseClaimModel } from '../expenses/expense.model';
import { EmployeeRequestModel } from '../requests/request.model';
import { TrackerManualEntryModel } from '../tracker/models';
import { trackerManualService } from '../tracker/tracker.manual.service';
import { setExpenseClaimStatus } from '../expenses/expense-status';
import { requestsResolvers } from '../requests';
import { hrResolvers } from '../hr';
import { assertPermission } from '../../lib/permissions';
import { ROLES } from '../../constants/roles';
import type { ApprovalScope, ApprovalSource } from './approvals.types';

/** Newest first: the queue is worked from the top, and a stale row is the older one. */
const NEWEST_FIRST = { createdAt: -1 } as const;

/** Restricts a source's pending query to the employees the caller may act for. */
function scopeFilter(ownerField: string, scope: ApprovalScope): Record<string, unknown> {
  if (scope.ownerIds === null) return {};
  return { [ownerField]: { $in: scope.ownerIds } };
}

/** How many days a leave request covers, inclusive of both ends. */
function dayCount(from: Date, to: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((to.getTime() - from.getTime()) / msPerDay) + 1;
}

const leaveSource: ApprovalSource = {
  kind: 'LEAVE',
  label: 'Leave Request',
  module: 'LeaveRequest',
  roles: [ROLES.HR],
  managerMayDecide: true,
  link: '/hr/leave',
  async pending(scope) {
    const rows = await LeaveRequestModel.find({
      status: 'PENDING',
      ...scopeFilter('employeeId', scope),
    })
      .sort(NEWEST_FIRST)
      .lean();
    return rows.map((row) => ({
      recordId: String(row._id),
      title: `${row.type.toLowerCase()} leave — ${dayCount(row.fromDate, row.toDate)} day(s)`,
      summary: row.reason,
      requestedById: row.employeeId,
      requestedAt: row.createdAt,
      amount: null,
      currency: null,
    }));
  },
  /**
   * Delegated, not reimplemented: `setLeaveStatus` is what debits and credits the
   * employee's leave balance. Writing the status here would approve leave that never
   * left anybody's entitlement. It takes no note, so a note on a leave decision is
   * not recorded — the balance movement and the notification are.
   */
  decide: async (args, ctx) => {
    await hrResolvers.Mutation.setLeaveStatus(
      null,
      { id: args.recordId, status: args.decision },
      ctx,
    );
  },
};

const expenseSource: ApprovalSource = {
  kind: 'EXPENSE',
  label: 'Expense Claim',
  module: 'ExpenseClaim',
  roles: [ROLES.FINANCE],
  // Finance clears the money, not the requester's manager — unchanged from the claim screen.
  managerMayDecide: false,
  link: '/expenses',
  async pending(scope) {
    const rows = await ExpenseClaimModel.find({
      status: 'SUBMITTED',
      ...scopeFilter('employeeId', scope),
    })
      .sort(NEWEST_FIRST)
      .lean();
    return rows.map((row) => ({
      recordId: String(row._id),
      title: `${row.category} claim`,
      summary: row.description,
      requestedById: row.employeeId,
      requestedAt: row.createdAt,
      amount: row.amount,
      currency: row.currency,
    }));
  },
  decide: async (args, ctx) => {
    await setExpenseClaimStatus(null, { id: args.recordId, status: args.decision }, ctx);
  },
};

const requestSource: ApprovalSource = {
  kind: 'REQUEST',
  label: 'Employee Request',
  module: 'EmployeeRequest',
  roles: [ROLES.HR],
  managerMayDecide: true,
  link: '/hr/requests',
  async pending(scope) {
    const rows = await EmployeeRequestModel.find({
      status: 'PENDING',
      ...scopeFilter('employeeId', scope),
    })
      .sort(NEWEST_FIRST)
      .lean();
    return rows.map((row) => ({
      recordId: String(row._id),
      title: row.subject,
      summary: row.details,
      requestedById: row.employeeId,
      requestedAt: row.createdAt,
      amount: null,
      currency: null,
    }));
  },
  decide: async (args, ctx) => {
    await requestsResolvers.Mutation.decideEmployeeRequest(
      null,
      { id: args.recordId, status: args.decision, decisionNote: args.note },
      ctx,
    );
  },
};

const manualTimeSource: ApprovalSource = {
  kind: 'MANUAL_TIME',
  label: 'Off-computer Time',
  module: 'Tracker',
  roles: [ROLES.TRACKER],
  managerMayDecide: false,
  link: '/tracker/approvals',
  async pending(scope) {
    const rows = await TrackerManualEntryModel.find({
      status: 'PENDING',
      ...scopeFilter('userId', scope),
    })
      .sort(NEWEST_FIRST)
      .lean();
    return rows.map((row) => ({
      recordId: String(row._id),
      title: `${Math.round(row.durationMs / 60_000)} min on ${row.projectName || 'no project'}`,
      summary: row.note,
      requestedById: row.userId,
      requestedAt: row.createdAt,
      amount: null,
      currency: null,
    }));
  },
  decide: async (args, ctx) => {
    const reviewer = await assertPermission(ctx, 'Tracker', [ROLES.TRACKER], 'APPROVE');
    await trackerManualService.review(args.recordId, args.decision, reviewer.id, args.note ?? '');
  },
};

/**
 * Every decision the shared queue knows about.
 *
 * Adding a source is this list plus one descriptor — which is the whole point: purchase
 * orders, invoices, contracts and deployments each become an entry here rather than
 * another bespoke approvals screen.
 */
export const APPROVAL_SOURCES: ApprovalSource[] = [
  leaveSource,
  expenseSource,
  requestSource,
  manualTimeSource,
];

/** Looks a source up by the `kind` half of a composite approval id. */
export function sourceByKind(kind: string): ApprovalSource | undefined {
  return APPROVAL_SOURCES.find((source) => source.kind === kind);
}
