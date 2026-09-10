import { UserModel } from '../../src/modules/admin/user.model';
import { LeaveRequestModel } from '../../src/modules/hr/hr.model';
import { LeaveBalanceModel } from '../../src/modules/hrmaster/leaveBalance.model';
import { EmployeeRequestModel } from '../../src/modules/requests/request.model';
import { PerformanceReviewModel } from '../../src/modules/performance/review.model';
import { GoalModel } from '../../src/modules/goals/goal.model';
import { NotificationModel } from '../../src/modules/notifications';
import { hrResolvers } from '../../src/modules/hr';
import { requestsResolvers } from '../../src/modules/requests';
import { performanceResolvers } from '../../src/modules/performance';
import { goalsResolvers } from '../../src/modules/goals';
import { reportingResolvers } from '../../src/modules/admin/reporting';
import { adminService } from '../../src/modules/admin/admin.service';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const setLeaveStatus = hrResolvers.Mutation.setLeaveStatus as unknown as Resolver;
const teamLeaveRequests = hrResolvers.Query.teamLeaveRequests as unknown as Resolver;
const decideRequest = requestsResolvers.Mutation.decideEmployeeRequest as unknown as Resolver;
const teamRequests = requestsResolvers.Query.teamRequests as unknown as Resolver;
const submitManager = performanceResolvers.Mutation.submitManagerAssessment as unknown as Resolver;
const teamReviews = performanceResolvers.Query.teamPerformanceReviews as unknown as Resolver;
const commentOnTeamGoal = goalsResolvers.Mutation.commentOnTeamGoal as unknown as Resolver;
const myDirectReports = reportingResolvers.Query.myDirectReports as unknown as Resolver;
const myManager = reportingResolvers.Query.myManager as unknown as Resolver;

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
const leaveFor = (employeeId: string, over: Record<string, unknown> = {}) =>
  LeaveRequestModel.create({
    employeeId,
    type: 'UNPAID',
    fromDate: day('2026-03-02'),
    toDate: day('2026-03-03'),
    reason: 'Family',
    status: 'PENDING',
    ...over,
  });

/** A manager, one direct report, and a bystander who manages nobody. */
async function team() {
  const manager = await person('Meera');
  const report = await person('Ravi', String(manager._id));
  const other = await person('Omar');
  return { manager: String(manager._id), report: String(report._id), other: String(other._id) };
}

describe('the reporting line', () => {
  it('lists direct reports and resolves the manager back', async () => {
    const { manager, report } = await team();

    const reports = (await myDirectReports(null, {}, ctx(manager))) as Array<{ id: string }>;
    const boss = (await myManager(null, {}, ctx(report))) as { id: string; name: string };

    expect(reports.map((r) => r.id)).toEqual([report]);
    expect(boss).toMatchObject({ id: manager, name: 'Meera' });
    expect(await myManager(null, {}, ctx(manager))).toBeNull();
  });

  it('refuses an employee reporting to themself', async () => {
    const { report } = await team();

    await expect(adminService.updateUser(report, { managerId: report })).rejects.toThrow(
      /cannot report to themself/,
    );
  });
});

describe('manager leave approvals', () => {
  it('lets the manager approve their report’s leave through the balance-aware path', async () => {
    const { manager, report } = await team();
    await LeaveBalanceModel.create({
      employeeId: report,
      leaveTypeCode: 'CASUAL',
      year: 2026,
      allocated: 5,
    });
    const leave = await leaveFor(report, { type: 'CASUAL' });

    const updated = (await setLeaveStatus(
      null,
      { id: String(leave._id), status: 'APPROVED' },
      ctx(manager),
    )) as { status: string };

    expect(updated.status).toBe('APPROVED');
    const balance = await LeaveBalanceModel.findOne({ employeeId: report }).lean();
    expect(balance?.used).toBe(2);
    const note = await NotificationModel.findOne({ employeeId: report }).lean();
    expect(note?.title).toBe('Leave request approved');
  });

  it('keeps a non-manager employee out', async () => {
    const { report, other } = await team();
    const leave = await leaveFor(report);

    await expect(
      setLeaveStatus(null, { id: String(leave._id), status: 'APPROVED' }, ctx(other)),
    ).rejects.toThrow(/manager/);
    expect((await LeaveRequestModel.findById(leave._id))?.status).toBe('PENDING');
  });

  it('still lets HR decide', async () => {
    const { report, other } = await team();
    const leave = await leaveFor(report);

    const updated = (await setLeaveStatus(
      null,
      { id: String(leave._id), status: 'REJECTED' },
      ctx(other, [ROLES.HR]),
    )) as { status: string };

    expect(updated.status).toBe('REJECTED');
  });

  it('teamLeaveRequests returns only the reports’ rows', async () => {
    const { manager, report, other } = await team();
    await leaveFor(report);
    await leaveFor(other);
    await leaveFor(manager);

    const rows = (await teamLeaveRequests(null, {}, ctx(manager))) as Array<{
      employeeId: string;
    }>;

    expect(rows.map((r) => r.employeeId)).toEqual([report]);
    expect(await teamLeaveRequests(null, {}, ctx(other))).toEqual([]);
  });
});

describe('manager request decisions', () => {
  const request = (employeeId: string) =>
    EmployeeRequestModel.create({
      employeeId,
      type: 'WFH',
      subject: 'WFH Friday',
      details: 'Plumber visit',
    });

  it('lets the manager decide with a note, and tells the employee', async () => {
    const { manager, report } = await team();
    const row = await request(report);

    const updated = (await decideRequest(
      null,
      { id: String(row._id), status: 'APPROVED', decisionNote: 'Fine by me' },
      ctx(manager),
    )) as { status: string; decisionNote: string; decidedAt: Date };

    expect(updated.status).toBe('APPROVED');
    expect(updated.decisionNote).toBe('Fine by me');
    expect(updated.decidedAt).toBeInstanceOf(Date);
    const note = await NotificationModel.findOne({ employeeId: report }).lean();
    expect(note?.title).toBe('Request approved: WFH Friday');
    expect(note?.body).toBe('Fine by me');
  });

  it('refuses somebody else’s manager', async () => {
    const { report, other } = await team();
    const row = await request(report);

    await expect(
      decideRequest(null, { id: String(row._id), status: 'REJECTED' }, ctx(other)),
    ).rejects.toThrow(/manager/);
  });

  it('teamRequests is scoped to direct reports', async () => {
    const { manager, report, other } = await team();
    await request(report);
    await request(other);

    const rows = (await teamRequests(null, {}, ctx(manager))) as Array<{ employeeId: string }>;

    expect(rows.map((r) => r.employeeId)).toEqual([report]);
  });
});

describe('manager assessment', () => {
  const review = (employeeId: string, status = 'SELF_SUBMITTED') =>
    PerformanceReviewModel.create({ employeeId, cycle: 'H1 2026', status });

  it('moves a self-submitted review to MANAGER_SUBMITTED with the score', async () => {
    const { manager, report } = await team();
    const row = await review(report);

    const updated = (await submitManager(
      null,
      { id: String(row._id), managerAssessment: 'Strong half', score: 8 },
      ctx(manager),
    )) as { status: string; score: number; managerAssessment: string };

    expect(updated).toMatchObject({
      status: 'MANAGER_SUBMITTED',
      score: 8,
      managerAssessment: 'Strong half',
    });
    const note = await NotificationModel.findOne({ employeeId: report }).lean();
    expect(note?.link).toBe('/me/performance');
  });

  it('waits for the employee’s half first', async () => {
    const { manager, report } = await team();
    const row = await review(report, 'OPEN');

    await expect(
      submitManager(null, { id: String(row._id), managerAssessment: 'Early' }, ctx(manager)),
    ).rejects.toThrow(/not submitted/);
  });

  it('refuses a non-manager, and admits HR', async () => {
    const { report, other } = await team();
    const row = await review(report);

    await expect(
      submitManager(null, { id: String(row._id), managerAssessment: 'Nope' }, ctx(other)),
    ).rejects.toThrow(/manager/);
    const byHr = (await submitManager(
      null,
      { id: String(row._id), managerAssessment: 'By HR' },
      ctx(other, [ROLES.HR]),
    )) as { status: string };
    expect(byHr.status).toBe('MANAGER_SUBMITTED');
  });

  it('teamPerformanceReviews lists the reports’ reviews only', async () => {
    const { manager, report, other } = await team();
    await review(report);
    await review(other);

    const rows = (await teamReviews(null, {}, ctx(manager))) as Array<{ employeeId: string }>;

    expect(rows.map((r) => r.employeeId)).toEqual([report]);
  });
});

describe('manager goal comments', () => {
  const goal = (employeeId: string) =>
    GoalModel.create({ employeeId, title: 'Ship it', startDate: new Date(), endDate: new Date() });

  it('lets the manager comment on a report’s goal', async () => {
    const { manager, report } = await team();
    const row = await goal(report);

    const updated = (await commentOnTeamGoal(
      null,
      { id: String(row._id), comment: 'On track' },
      ctx(manager),
    )) as { managerComment: string };

    expect(updated.managerComment).toBe('On track');
  });

  it('refuses everyone else', async () => {
    const { report, other } = await team();
    const row = await goal(report);

    await expect(
      commentOnTeamGoal(null, { id: String(row._id), comment: 'Hi' }, ctx(other)),
    ).rejects.toThrow(/manager/);
  });
});
