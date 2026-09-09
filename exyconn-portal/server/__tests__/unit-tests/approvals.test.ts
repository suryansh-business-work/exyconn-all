import { UserModel } from '../../src/modules/admin/user.model';
import { LeaveRequestModel } from '../../src/modules/hr/hr.model';
import { ExpenseClaimModel } from '../../src/modules/expenses/expense.model';
import { EmployeeRequestModel } from '../../src/modules/requests/request.model';
import { TrackerManualEntryModel } from '../../src/modules/tracker/models';
import { approvalsResolvers } from '../../src/modules/approvals';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<never>;
const myApprovals = approvalsResolvers.Query.myApprovals as unknown as Resolver;
const pendingCount = approvalsResolvers.Query.myPendingApprovalCount as unknown as Resolver;
const decide = approvalsResolvers.Mutation.decideApproval as unknown as Resolver;

interface Queue {
  items: {
    id: string;
    kind: string;
    requestedByName: string;
    amount: number | null;
    currency: string | null;
  }[];
  groups: { kind: string; label: string; count: number }[];
  totalCount: number;
}

const ctx = (id: string, roles: string[] = [ROLES.EMPLOYEE]) =>
  ({ user: { id, email: `${id}@exyconn.com`, roles } }) as unknown as GraphQLContext;

const person = (name: string, managerId: string | null = null) =>
  UserModel.create({
    name,
    email: `${name.toLowerCase()}@exyconn.com`,
    passwordHash: 'x',
    roles: [ROLES.EMPLOYEE],
    managerId,
  });

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const leaveFor = (employeeId: string) =>
  LeaveRequestModel.create({
    employeeId,
    type: 'UNPAID',
    fromDate: day('2026-03-02'),
    toDate: day('2026-03-04'),
    reason: 'Family',
    status: 'PENDING',
  });

const claimFor = (employeeId: string) =>
  ExpenseClaimModel.create({
    employeeId,
    category: 'Travel',
    description: 'Client visit',
    amount: 1200,
    currency: 'INR',
    incurredOn: day('2026-03-01'),
    status: 'SUBMITTED',
  });

const requestFor = (employeeId: string) =>
  EmployeeRequestModel.create({
    employeeId,
    type: 'WFH',
    subject: 'Work from home Friday',
    details: 'Plumber visiting',
    status: 'PENDING',
  });

const manualFor = (userId: string) =>
  TrackerManualEntryModel.create({
    userId,
    startedAt: day('2026-03-01'),
    endedAt: new Date(day('2026-03-01').getTime() + 60 * 60 * 1000),
    durationMs: 60 * 60 * 1000,
    note: 'Client meeting off site',
    status: 'PENDING',
  });

/** A manager, one direct report, and a bystander who manages nobody. */
async function team() {
  const manager = await person('Meera');
  const report = await person('Ravi', String(manager._id));
  const other = await person('Omar');
  return { manager: String(manager._id), report: String(report._id), other: String(other._id) };
}

describe('the shared approval queue', () => {
  it('shows an HR role every pending leave request, whoever raised it', async () => {
    const { manager, report, other } = await team();
    await leaveFor(report);
    await leaveFor(other);

    const queue = (await myApprovals(null, {}, ctx(manager, [ROLES.HR]))) as unknown as Queue;

    expect(queue.totalCount).toBe(2);
    expect(queue.items.every((item) => item.kind === 'LEAVE')).toBe(true);
  });

  it('shows a manager only their own reports, and nothing to a bystander', async () => {
    const { manager, report, other } = await team();
    await leaveFor(report);
    await leaveFor(other);

    const mine = (await myApprovals(null, {}, ctx(manager))) as unknown as Queue;
    const none = (await myApprovals(null, {}, ctx(other))) as unknown as Queue;

    expect(mine.totalCount).toBe(1);
    expect(mine.items[0].requestedByName).toBe('Ravi');
    expect(none.totalCount).toBe(0);
  });

  it('gathers every source into one queue and counts them per kind', async () => {
    const { report } = await team();
    const admin = String((await person('Root'))._id);
    await leaveFor(report);
    await claimFor(report);
    await requestFor(report);
    await manualFor(report);

    const queue = (await myApprovals(null, {}, ctx(admin, [ROLES.ADMIN]))) as unknown as Queue;

    expect(queue.totalCount).toBe(4);
    expect(queue.groups.map((g) => g.kind).sort()).toEqual([
      'EXPENSE',
      'LEAVE',
      'MANUAL_TIME',
      'REQUEST',
    ]);
    expect(queue.groups.every((group) => group.count === 1)).toBe(true);
  });

  it('carries the money on a claim so the queue can show what is at stake', async () => {
    const { report } = await team();
    const finance = String((await person('Fin'))._id);
    await claimFor(report);

    const queue = (await myApprovals(
      null,
      { kind: 'EXPENSE' },
      ctx(finance, [ROLES.FINANCE]),
    )) as unknown as Queue;

    expect(queue.items).toHaveLength(1);
    expect(queue.items[0].currency).toBe('INR');
    expect(queue.items[0].amount).toBe(1200);
  });

  it('narrows to one kind without widening what the caller may see', async () => {
    const { manager, report } = await team();
    await leaveFor(report);
    await claimFor(report);

    const claims = (await myApprovals(null, { kind: 'EXPENSE' }, ctx(manager))) as unknown as Queue;

    // A manager has no reach into expense claims; asking for them by name changes nothing.
    expect(claims.items).toHaveLength(0);
    // The counts stay the caller's whole backlog, so the filter cannot hide the leave.
    expect(claims.totalCount).toBe(1);
    expect(claims.groups.map((g) => g.kind)).toEqual(['LEAVE', 'REQUEST']);
  });

  it('counts the same rows the queue would show', async () => {
    const { manager, report } = await team();
    await leaveFor(report);
    await requestFor(report);

    expect(await pendingCount(null, {}, ctx(manager))).toBe(2);
  });
});

describe('deciding through the queue', () => {
  it('approves a leave request through the module that owns it', async () => {
    const { manager, report } = await team();
    const leave = await leaveFor(report);

    await decide(null, { id: `LEAVE:${leave._id}`, decision: 'APPROVED' }, ctx(manager));

    const after = await LeaveRequestModel.findById(leave._id).lean();
    expect(after?.status).toBe('APPROVED');
  });

  it('records the decision on an employee request with its note', async () => {
    const { manager, report } = await team();
    const request = await requestFor(report);

    await decide(
      null,
      { id: `REQUEST:${request._id}`, decision: 'REJECTED', note: 'Team is on site that day' },
      ctx(manager),
    );

    const after = await EmployeeRequestModel.findById(request._id).lean();
    expect(after?.status).toBe('REJECTED');
    expect(after?.decisionNote).toBe('Team is on site that day');
  });

  it('refuses a source the caller has no reach into', async () => {
    const { manager, report } = await team();
    const claim = await claimFor(report);

    await expect(
      decide(null, { id: `EXPENSE:${claim._id}`, decision: 'APPROVED' }, ctx(manager)),
    ).rejects.toThrow(/may not decide/i);
  });

  it('refuses an id that names no source', async () => {
    const { manager } = await team();

    await expect(
      decide(null, { id: 'DEPLOYMENT:abc', decision: 'APPROVED' }, ctx(manager)),
    ).rejects.toThrow(/Nothing approves/i);
  });

  it('refuses an id that is not a composite', async () => {
    const { manager } = await team();

    await expect(
      decide(null, { id: 'nonsense', decision: 'APPROVED' }, ctx(manager)),
    ).rejects.toThrow(/KIND:recordId/);
  });

  it('drops a decided row out of the queue', async () => {
    const { manager, report } = await team();
    const leave = await leaveFor(report);

    await decide(null, { id: `LEAVE:${leave._id}`, decision: 'REJECTED' }, ctx(manager));
    const queue = (await myApprovals(null, {}, ctx(manager))) as unknown as Queue;

    expect(queue.totalCount).toBe(0);
  });
});
