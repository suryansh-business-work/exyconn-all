import { Types } from 'mongoose';
import { hrService } from '../../../../src/modules/hr/hr.service';
import { LeaveRequestModel } from '../../../../src/modules/hr/hr.model';
import { AttendanceModel } from '../../../../src/modules/hr/attendance.model';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { ROLES } from '../../../../src/constants/roles';
import { freezeClock, useTestOrganization } from '../../../helpers';
import { asArg } from '../../../mockAs';

useTestOrganization({ locale: 'en-US' });

const EMP = String(new Types.ObjectId());
const OTHER = String(new Types.ObjectId());
const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const leave = (employeeId: string, reason: string, createdAt = new Date()) =>
  LeaveRequestModel.create({
    employeeId,
    type: 'UNPAID',
    fromDate: day('2026-03-02'),
    toDate: day('2026-03-03'),
    reason,
    createdAt,
  });

const person = (name: string, fields: Record<string, unknown> = {}) =>
  UserModel.create({
    name,
    email: `${name.toLowerCase()}@exyconn.com`,
    passwordHash: 'x',
    roles: [ROLES.EMPLOYEE],
    ...fields,
  });

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('leave reads', () => {
  it("lists one employee's requests, newest first, for themselves and for HR", async () => {
    await leave(EMP, 'First', new Date('2026-02-01T00:00:00.000Z'));
    await leave(EMP, 'Second', new Date('2026-02-02T00:00:00.000Z'));
    await leave(OTHER, 'Not mine');

    const mine = await hrService.myLeaves(EMP);
    const forHr = await hrService.leavesByEmployee(EMP);

    expect(mine.map((row) => row.reason)).toEqual(['Second', 'First']);
    expect(forHr.map((row) => row.reason)).toEqual(['Second', 'First']);
  });

  it('reads one request by id and says when it does not exist', async () => {
    const row = await leave(EMP, 'Family');

    await expect(hrService.getLeave(String(row._id))).resolves.toMatchObject({ reason: 'Family' });
    await expect(hrService.getLeave(String(new Types.ObjectId()))).rejects.toThrow(
      'LeaveRequest not found',
    );
  });

  it('gives a manager with no reports an empty queue', async () => {
    await leave(EMP, 'Family');

    await expect(hrService.teamLeaves([])).resolves.toEqual([]);
  });
});

describe('setLeaveStatus edge cases', () => {
  it('refuses a request that does not exist', async () => {
    await expect(
      hrService.setLeaveStatus(String(new Types.ObjectId()), 'APPROVED'),
    ).rejects.toThrow('LeaveRequest not found');
  });

  it('says the request is gone when it disappears between the read and the write', async () => {
    const row = await leave(EMP, 'Family');
    jest
      .spyOn(LeaveRequestModel, 'findByIdAndUpdate')
      .mockReturnValue(asArg({ lean: () => Promise.resolve(null) }));

    await expect(hrService.setLeaveStatus(String(row._id), 'REJECTED')).rejects.toThrow(
      'LeaveRequest not found',
    );
  });
});

describe('attendance', () => {
  it('marks one record per day, however late in the day it is marked, and updates it after', async () => {
    const first = await hrService.markAttendance(EMP, {
      date: new Date('2026-03-02T17:45:00.000Z'),
      status: 'WFH',
    });
    const second = await hrService.markAttendance(EMP, {
      date: new Date('2026-03-02T08:00:00.000Z'),
      status: 'PRESENT',
      note: 'Back in office',
    });

    expect(first).toMatchObject({ date: day('2026-03-02'), status: 'WFH', note: null });
    expect(second).toMatchObject({ status: 'PRESENT', note: 'Back in office' });
    expect(await AttendanceModel.countDocuments({ employeeId: EMP })).toBe(1);
  });

  it('lists attendance newest first, per employee and for everybody', async () => {
    await AttendanceModel.create([
      { employeeId: EMP, date: day('2026-03-01'), status: 'PRESENT' },
      { employeeId: EMP, date: day('2026-03-03'), status: 'ABSENT' },
      { employeeId: OTHER, date: day('2026-03-02'), status: 'HALF_DAY' },
    ]);

    const statuses = (rows: Array<{ status: string }>) => rows.map((row) => row.status);
    expect(statuses(await hrService.myAttendance(EMP))).toEqual(['ABSENT', 'PRESENT']);
    expect(statuses(await hrService.attendanceByEmployee(OTHER))).toEqual(['HALF_DAY']);
    expect(statuses(await hrService.listAttendance())).toEqual(['ABSENT', 'HALF_DAY', 'PRESENT']);
  });
});

describe('dashboard', () => {
  it('has an empty headcount series when there is nobody yet', async () => {
    await expect(hrService.dashboard()).resolves.toEqual({
      totalEmployees: 0,
      activeEmployees: 0,
      onLeave: 0,
      headcount: [],
    });
  });

  it('counts people by status and builds a cumulative monthly headcount', async () => {
    freezeClock('2026-03-15T12:00:00.000Z');
    await person('Asha', { joinDate: new Date('2026-01-10T12:00:00.000Z') });
    await person('Ben', {
      joinDate: new Date('2026-02-20T12:00:00.000Z'),
      employmentStatus: 'ON_LEAVE',
    });
    // No join date: the account's creation (today, frozen) stands in for it.
    await person('Cara', { employmentStatus: 'TERMINATED' });

    const dashboard = await hrService.dashboard();

    expect(dashboard).toMatchObject({ totalEmployees: 3, activeEmployees: 1, onLeave: 1 });
    expect(dashboard.headcount).toEqual([
      { label: 'Jan 26', count: 1 },
      { label: 'Feb 26', count: 2 },
      { label: 'Mar 26', count: 3 },
    ]);
  });
});
