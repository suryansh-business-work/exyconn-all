import { Types } from 'mongoose';
import { hrResolvers } from '../../../../src/modules/hr';
import { LeaveRequestModel } from '../../../../src/modules/hr/hr.model';
import { AttendanceModel } from '../../../../src/modules/hr/attendance.model';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import type { GraphQLContext } from '../../../../src/middleware/auth';

useTestOrganization();

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const R = { ...hrResolvers.Query, ...hrResolvers.Mutation } as unknown as Record<string, Resolver>;

const EMP = String(new Types.ObjectId());
const HR_ID = String(new Types.ObjectId());
const as = (id: string, roles: string[]) =>
  ({ user: { id, email: `${id}@exyconn.com`, roles } }) as unknown as GraphQLContext;
const hr = as(HR_ID, [ROLES.HR]);
const emp = as(EMP, [ROLES.EMPLOYEE]);
const anonymous = { user: null } as unknown as GraphQLContext;

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const leaveFor = (employeeId: string) =>
  LeaveRequestModel.create({
    employeeId,
    type: 'UNPAID',
    fromDate: day('2026-03-02'),
    toDate: day('2026-03-02'),
    reason: 'Errand',
  });

describe('employee self-service', () => {
  it('shows the signed-in employee only their own leave and attendance, with ids', async () => {
    await leaveFor(EMP);
    await leaveFor(HR_ID);
    await AttendanceModel.create({ employeeId: EMP, date: day('2026-03-02'), status: 'WFH' });

    const leaves = (await R.myLeaveRequests(null, {}, emp)) as Array<{ id: string }>;
    const attendance = (await R.myAttendance(null, {}, emp)) as Array<{ status: string }>;

    expect(leaves).toHaveLength(1);
    expect(leaves[0].id).toEqual(expect.any(String));
    expect(attendance.map((row) => row.status)).toEqual(['WFH']);
  });

  it('marks attendance for the caller, never for an id in the arguments', async () => {
    const row = (await R.markAttendance(
      null,
      { input: { date: day('2026-03-05'), status: 'HALF_DAY' } },
      emp,
    )) as { id: string; employeeId: string };

    expect(row).toMatchObject({ employeeId: EMP, id: expect.any(String) });
  });

  it.each(['myLeaveRequests', 'myAttendance', 'teamLeaveRequests'])(
    '%s needs somebody signed in',
    async (name) => {
      await expect(R[name](null, {}, anonymous)).rejects.toThrow(/Authentication required/);
    },
  );

  it('gives a manager with no reports an empty leave queue', async () => {
    await leaveFor(EMP);

    await expect(R.teamLeaveRequests(null, {}, hr)).resolves.toEqual([]);
  });
});

describe('HR views', () => {
  beforeEach(async () => {
    await leaveFor(EMP);
    await AttendanceModel.create([
      { employeeId: EMP, date: day('2026-03-02'), status: 'PRESENT' },
      { employeeId: HR_ID, date: day('2026-03-03'), status: 'ABSENT' },
    ]);
  });

  it('lists everybody’s attendance and one employee’s leave and attendance', async () => {
    const all = (await R.listAttendance(null, {}, hr)) as unknown[];
    const leaves = (await R.leaveRequestsByEmployee(null, { employeeId: EMP }, hr)) as unknown[];
    const days = (await R.attendanceByEmployee(null, { employeeId: EMP }, hr)) as Array<{
      status: string;
    }>;

    expect(all).toHaveLength(2);
    expect(leaves).toHaveLength(1);
    expect(days.map((row) => row.status)).toEqual(['PRESENT']);
  });

  it('pages the attendance register', async () => {
    const page = (await R.listAttendancePaged(null, { input: { page: 0, pageSize: 1 } }, hr)) as {
      totalCount: number;
      rows: unknown[];
    };

    expect(page.totalCount).toBe(2);
    expect(page.rows).toHaveLength(1);
  });

  it('builds the HR dashboard', async () => {
    await expect(R.hrDashboard(null, {}, hr)).resolves.toMatchObject({
      totalEmployees: 0,
      headcount: [],
    });
  });

  it.each([
    ['listAttendance', {}],
    ['listAttendancePaged', { input: { page: 0, pageSize: 10 } }],
    ['leaveRequestsByEmployee', { employeeId: EMP }],
    ['attendanceByEmployee', { employeeId: EMP }],
    ['hrDashboard', {}],
  ])('%s is HR only', async (name, args) => {
    // listAttendancePaged is not async, so its guard throws before any promise exists.
    const attempt = async () => R[name](null, args, emp);
    await expect(attempt()).rejects.toThrow();
  });
});

describe('deciding leave', () => {
  it('refuses HR deciding their own leave request', async () => {
    const own = await leaveFor(HR_ID);

    await expect(
      R.setLeaveStatus(null, { id: String(own._id), status: 'APPROVED' }, hr),
    ).rejects.toThrow(/cannot decide a leave request for yourself/);
    expect((await LeaveRequestModel.findById(own._id).lean())?.status).toBe('PENDING');
  });

  it('says a request that does not exist is missing', async () => {
    await expect(
      R.setLeaveStatus(null, { id: String(new Types.ObjectId()), status: 'APPROVED' }, hr),
    ).rejects.toThrow('LeaveRequest not found');
  });

  it('refuses HR editing their own request through the leave console', async () => {
    const own = await leaveFor(HR_ID);

    await expect(
      R.updateLeaveRequest(null, { id: String(own._id), input: { reason: 'Changed' } }, hr),
    ).rejects.toThrow(/cannot edit your own LeaveRequest/);
  });

  it("lets HR edit somebody else's request, and reports one that does not exist", async () => {
    const theirs = await leaveFor(EMP);

    const updated = (await R.updateLeaveRequest(
      null,
      { id: String(theirs._id), input: { reason: 'Clarified' } },
      hr,
    )) as { reason: string };

    expect(updated.reason).toBe('Clarified');
    await expect(
      R.updateLeaveRequest(null, { id: String(new Types.ObjectId()), input: {} }, hr),
    ).rejects.toThrow('LeaveRequest not found');
  });
});
