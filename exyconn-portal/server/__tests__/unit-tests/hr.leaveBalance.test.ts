import { LeaveRequestModel } from '../../src/modules/hr/hr.model';
import { LeaveBalanceModel } from '../../src/modules/hrmaster/leaveBalance.model';
import { NotificationModel } from '../../src/modules/notifications';
import { hrResolvers } from '../../src/modules/hr';
import { leaveDays } from '../../src/modules/hr/leave-balance.service';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const setLeaveStatus = hrResolvers.Mutation.setLeaveStatus as unknown as Resolver;
const hr = {
  user: { id: 'hr-1', email: 'hr@exyconn.com', roles: [ROLES.HR] },
} as unknown as GraphQLContext;

const EMP = 'emp-1';
const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const request = (over: Record<string, unknown> = {}) =>
  LeaveRequestModel.create({
    employeeId: EMP,
    type: 'CASUAL',
    fromDate: day('2026-03-02'),
    toDate: day('2026-03-04'),
    reason: 'Family',
    status: 'PENDING',
    ...over,
  });

const balance = (over: Record<string, unknown> = {}) =>
  LeaveBalanceModel.create({
    employeeId: EMP,
    leaveTypeCode: 'CASUAL',
    year: 2026,
    allocated: 10,
    ...over,
  });

const usedOf = async () =>
  (await LeaveBalanceModel.findOne({ employeeId: EMP, leaveTypeCode: 'CASUAL', year: 2026 }))?.used;

const decide = (id: unknown, status: string) =>
  setLeaveStatus(null, { id: String(id), status }, hr);

describe('leaveDays', () => {
  it('counts both ends, so a single day costs one', () => {
    expect(leaveDays(day('2026-03-02'), day('2026-03-02'))).toBe(1);
    expect(leaveDays(day('2026-03-02'), day('2026-03-04'))).toBe(3);
  });
});

describe('setLeaveStatus and the leave balance', () => {
  it('debits the balance when a request is approved', async () => {
    await balance();
    const req = await request();

    await decide(req._id, 'APPROVED');

    expect(await usedOf()).toBe(3);
  });

  it('refuses an approval that would overrun the balance and leaves it untouched', async () => {
    await balance({ allocated: 2 });
    const req = await request();

    await expect(decide(req._id, 'APPROVED')).rejects.toThrow(/Only 2 CASUAL day/);

    expect(await usedOf()).toBe(0);
    expect((await LeaveRequestModel.findById(req._id))?.status).toBe('PENDING');
  });

  it('refuses when no balance row exists for a paid type and says where to add one', async () => {
    const req = await request();

    await expect(decide(req._id, 'APPROVED')).rejects.toThrow(
      'No leave balance for CASUAL in 2026 — add one under HR > Leave Balances',
    );
  });

  it('needs no balance for UNPAID leave', async () => {
    const req = await request({ type: 'UNPAID' });

    const updated = (await decide(req._id, 'APPROVED')) as { status: string };

    expect(updated.status).toBe('APPROVED');
  });

  it('credits the days back when an approval is rejected afterwards', async () => {
    await balance();
    const req = await request();
    await decide(req._id, 'APPROVED');

    await decide(req._id, 'REJECTED');

    expect(await usedOf()).toBe(0);
  });

  it('does not debit twice when approving an already approved request', async () => {
    await balance();
    const req = await request();
    await decide(req._id, 'APPROVED');

    await decide(req._id, 'APPROVED');

    expect(await usedOf()).toBe(3);
  });

  it('keeps the decision away from a plain employee', async () => {
    const req = await request();
    const emp = {
      user: { id: EMP, email: 'e@exyconn.com', roles: [ROLES.EMPLOYEE] },
    } as unknown as GraphQLContext;

    await expect(
      setLeaveStatus(null, { id: String(req._id), status: 'APPROVED' }, emp),
    ).rejects.toThrow();
  });
});

describe('setLeaveStatus notifications', () => {
  it('tells the employee when their leave is approved, with a link back to it', async () => {
    await balance();
    const req = await request();

    await decide(req._id, 'APPROVED');

    const note = await NotificationModel.findOne({ employeeId: EMP }).lean();
    expect(note?.kind).toBe('LEAVE');
    expect(note?.title).toBe('Leave request approved');
    expect(note?.link).toBe('/me/leave');
  });

  it('tells the employee when their leave is rejected', async () => {
    const req = await request();

    await decide(req._id, 'REJECTED');

    const note = await NotificationModel.findOne({ employeeId: EMP }).lean();
    expect(note?.title).toBe('Leave request rejected');
  });

  it('sends nothing when the status does not change', async () => {
    const req = await request();

    await decide(req._id, 'PENDING');

    expect(await NotificationModel.countDocuments({ employeeId: EMP })).toBe(0);
  });

  it('still records the decision when the notification store fails', async () => {
    const req = await request();
    const spy = jest.spyOn(NotificationModel, 'create').mockRejectedValueOnce(new Error('down'));

    const updated = (await decide(req._id, 'REJECTED')) as { status: string };

    expect(updated.status).toBe('REJECTED');
    spy.mockRestore();
  });
});
