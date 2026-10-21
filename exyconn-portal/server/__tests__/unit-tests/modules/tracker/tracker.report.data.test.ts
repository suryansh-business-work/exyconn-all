import { buildHoursReport, dayStatusOf } from '../../../../src/modules/tracker/tracker.report.data';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { HolidayModel } from '../../../../src/modules/employee/holiday.model';
import { LeaveRequestModel } from '../../../../src/modules/hr/hr.model';
import { SalaryStructureModel } from '../../../../src/modules/employee/salary.model';
import {
  TrackerManualEntryModel,
  TrackerSessionModel,
} from '../../../../src/modules/tracker/models';
import { useTestOrganization } from '../../../helpers';

useTestOrganization();

const HOUR = 3_600_000;
// 5–11 January 2026 runs Monday to Sunday.
const FROM = new Date('2026-01-05T00:00:00Z');
const TO = new Date('2026-01-12T00:00:00Z');
const TODAY = '2026-01-09';

async function employee() {
  const user = await UserModel.create({
    name: 'Asha Rao',
    email: 'asha@exyconn.com',
    passwordHash: 'x',
    country: 'IN',
    workHoursPerDay: 8,
  });
  return user._id.toHexString();
}

const session = (userId: string, startedAt: string, activeMs: number, idleMs = 0) =>
  TrackerSessionModel.create({
    userId,
    deviceId: 'd1',
    startedAt: new Date(startedAt),
    status: 'stopped',
    activeMs,
    idleMs,
  });

const offComputer = (
  userId: string,
  startedAt: string,
  durationMs: number,
  status = 'APPROVED',
) => {
  const start = new Date(startedAt);
  return TrackerManualEntryModel.create({
    userId,
    startedAt: start,
    endedAt: new Date(start.getTime() + durationMs),
    durationMs,
    note: 'Client workshop',
    status,
  });
};

describe('dayStatusOf', () => {
  const working = { date: '2026-01-07', expectedMs: 8 * HOUR, offReason: null };

  it.each([
    ['LEAVE', 'LEAVE'],
    ['HOLIDAY', 'HOLIDAY'],
    ['WEEKEND', 'WEEK_OFF'],
  ] as const)('reads an off day of reason %s as %s, whatever was worked', (offReason, status) => {
    expect(dayStatusOf({ ...working, expectedMs: 0, offReason }, 9 * HOUR, HOUR, TODAY)).toBe(
      status,
    );
  });

  it('completes a working day once worked time meets its hours, off-computer included', () => {
    expect(dayStatusOf(working, 8 * HOUR, 3 * HOUR, TODAY)).toBe('COMPLETED');
    // Today and a future day complete just the same once the hours are in.
    expect(dayStatusOf({ ...working, date: TODAY }, 9 * HOUR, 0, TODAY)).toBe('COMPLETED');
  });

  it('marks a past working day below its hours as short, even with off-computer work', () => {
    expect(dayStatusOf(working, 8 * HOUR - 1, HOUR, TODAY)).toBe('SHORT');
    expect(dayStatusOf(working, 0, 0, TODAY)).toBe('SHORT');
  });

  it('shows off-computer work on a day still running, and nothing on an empty one', () => {
    expect(dayStatusOf({ ...working, date: TODAY }, HOUR, HOUR, TODAY)).toBe('OFF_COMPUTER');
    expect(dayStatusOf({ ...working, date: '2026-01-10' }, 0, 0, TODAY)).toBe('NONE');
  });

  it('never completes or shorts a past day that owed nothing', () => {
    const owedNothing = { ...working, expectedMs: 0 };
    expect(dayStatusOf(owedNothing, 0, 0, TODAY)).toBe('NONE');
    expect(dayStatusOf(owedNothing, HOUR, HOUR, TODAY)).toBe('OFF_COMPUTER');
  });
});

describe('buildHoursReport', () => {
  async function seededWeek() {
    const id = await employee();
    // Monday: 7h active, 1h idle and 1h approved off-computer — exactly the 8 hours owed.
    await session(id, '2026-01-05T09:00:00Z', 7 * HOUR, HOUR);
    await offComputer(id, '2026-01-05T17:00:00Z', HOUR);
    // Tuesday is a holiday, worked anyway.
    await HolidayModel.create({ name: 'Founders Day', date: new Date('2026-01-06'), country: '' });
    await session(id, '2026-01-06T09:00:00Z', HOUR);
    // Wednesday: well short, half of it idle.
    await session(id, '2026-01-07T09:00:00Z', 2 * HOUR, 2 * HOUR);
    // Thursday: approved casual leave.
    await LeaveRequestModel.create({
      employeeId: id,
      type: 'CL',
      fromDate: new Date('2026-01-08'),
      toDate: new Date('2026-01-08'),
      reason: 'Family',
      status: 'APPROVED',
    });
    // Friday (today): a meeting off the computer; a pending entry never counts.
    await offComputer(id, '2026-01-09T09:00:00Z', HOUR);
    await offComputer(id, '2026-01-09T11:00:00Z', HOUR, 'PENDING');
    return id;
  }

  it('gives every day its status, label and figures', async () => {
    const id = await seededWeek();

    const report = await buildHoursReport(id, FROM, TO, 'UTC', new Date('2026-01-09T18:00:00Z'));

    expect(report).toMatchObject({
      employee: { id, name: 'Asha Rao', email: 'asha@exyconn.com' },
      from: FROM.toISOString(),
      to: TO.toISOString(),
      timezone: 'UTC',
      workHoursPerDay: 8,
    });
    expect(report.days).toEqual([
      {
        date: '2026-01-05',
        status: 'COMPLETED',
        label: '',
        expectedMs: 8 * HOUR,
        activeMs: 7 * HOUR,
        idleMs: HOUR,
        offComputerMs: HOUR,
        workedMs: 8 * HOUR,
        activityPercent: 88,
      },
      {
        date: '2026-01-06',
        status: 'HOLIDAY',
        label: 'Founders Day',
        expectedMs: 0,
        activeMs: HOUR,
        idleMs: 0,
        offComputerMs: 0,
        workedMs: HOUR,
        activityPercent: 100,
      },
      {
        date: '2026-01-07',
        status: 'SHORT',
        label: '',
        expectedMs: 8 * HOUR,
        activeMs: 2 * HOUR,
        idleMs: 2 * HOUR,
        offComputerMs: 0,
        workedMs: 2 * HOUR,
        activityPercent: 50,
      },
      {
        date: '2026-01-08',
        status: 'LEAVE',
        label: 'CL',
        expectedMs: 0,
        activeMs: 0,
        idleMs: 0,
        offComputerMs: 0,
        workedMs: 0,
        activityPercent: 0,
      },
      {
        date: '2026-01-09',
        status: 'OFF_COMPUTER',
        label: '',
        expectedMs: 8 * HOUR,
        activeMs: 0,
        idleMs: 0,
        offComputerMs: HOUR,
        workedMs: HOUR,
        activityPercent: 0,
      },
      expect.objectContaining({ date: '2026-01-10', status: 'WEEK_OFF', workedMs: 0 }),
      expect.objectContaining({ date: '2026-01-11', status: 'WEEK_OFF', workedMs: 0 }),
    ]);
  });

  it('totals the range and measures the deficit against the days already over', async () => {
    const id = await seededWeek();

    const { totals } = await buildHoursReport(
      id,
      FROM,
      TO,
      'UTC',
      new Date('2026-01-09T18:00:00Z'),
    );

    expect(totals).toEqual({
      expectedMs: 24 * HOUR,
      // Monday and Wednesday are over; Friday is still running.
      expectedSoFarMs: 16 * HOUR,
      workedMs: 12 * HOUR,
      activeMs: 10 * HOUR,
      idleMs: 3 * HOUR,
      offComputerMs: 2 * HOUR,
      weekOffWorkedMs: 0,
      deficitMs: -4 * HOUR,
      leaveDays: 1,
      leaveMs: 8 * HOUR,
    });
  });

  it('calls the employee salaried without an hourly structure', async () => {
    const id = await seededWeek();

    const { earnings } = await buildHoursReport(id, FROM, TO, 'UTC', new Date('2026-01-09'));

    expect(earnings).toEqual({ payType: 'FIXED', rate: 0, currency: 'USD', amount: null });
  });

  it('prices the worked hours at an hourly rate', async () => {
    const id = await seededWeek();
    await SalaryStructureModel.create({
      employeeId: id,
      currency: 'EUR',
      payType: 'HOURLY',
      rate: 10,
      effectiveFrom: new Date('2025-01-01'),
    });

    const { earnings } = await buildHoursReport(id, FROM, TO, 'UTC', new Date('2026-01-09'));

    // 10h active plus 2h approved off-computer; idle time is never paid.
    expect(earnings).toEqual({ payType: 'HOURLY', rate: 10, currency: 'EUR', amount: 120 });
  });

  it('keeps work on a week off apart and counts it as a surplus', async () => {
    const id = await employee();
    await session(id, '2026-01-10T10:00:00Z', 2 * HOUR);

    const { days, totals } = await buildHoursReport(
      id,
      new Date('2026-01-10T00:00:00Z'),
      TO,
      'UTC',
      new Date('2026-01-13T09:00:00Z'),
    );

    expect(days.map((day) => [day.date, day.status, day.workedMs])).toEqual([
      ['2026-01-10', 'WEEK_OFF', 2 * HOUR],
      ['2026-01-11', 'WEEK_OFF', 0],
    ]);
    expect(totals).toMatchObject({
      expectedMs: 0,
      expectedSoFarMs: 0,
      weekOffWorkedMs: 2 * HOUR,
      deficitMs: 2 * HOUR,
      leaveDays: 0,
      leaveMs: 0,
    });
  });

  it('files a session under the local day it started on', async () => {
    const id = await employee();
    // 20:00 UTC on Monday is already Tuesday in Tokyo.
    await session(id, '2026-01-05T20:00:00Z', HOUR);

    const { days } = await buildHoursReport(
      id,
      new Date('2026-01-04T15:00:00Z'),
      new Date('2026-01-06T15:00:00Z'),
      'Asia/Tokyo',
      new Date('2026-01-10T00:00:00Z'),
    );

    expect(days.map((day) => [day.date, day.workedMs])).toEqual([
      ['2026-01-05', 0],
      ['2026-01-06', HOUR],
    ]);
  });

  it('leaves the name and email blank for an account that no longer exists', async () => {
    const id = '0123456789abcdef01234567';

    const report = await buildHoursReport(id, FROM, TO, 'UTC', new Date('2026-01-09'));

    expect(report.employee).toEqual({ id, name: '', email: '' });
  });
});
