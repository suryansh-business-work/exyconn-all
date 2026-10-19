import { trackerExpectedService } from '../../../../src/modules/tracker/tracker.expected.service';
import { trackerExpectedReport } from '../../../../src/modules/tracker/tracker.expected.report';
import * as tableFiles from '../../../../src/modules/table-transfer/tableFiles';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { HolidayModel } from '../../../../src/modules/employee/holiday.model';
import { LeaveRequestModel } from '../../../../src/modules/hr/hr.model';
import { saveDefaultWorkDays } from '../../../../src/modules/admin/work-week';
import { freezeClock } from '../../../helpers';
import { codeOf } from '../codeOf';

// 5–11 January 2026 runs Monday to Sunday.
const FROM = new Date('2026-01-05T00:00:00Z');
const TO = new Date('2026-01-12T00:00:00Z');
const EIGHT_HOURS = 8 * 3_600_000;

async function employee(fields: { workDays?: number[]; workHoursPerDay?: number } = {}) {
  const user = await UserModel.create({
    name: 'Asha',
    email: 'asha@exyconn.com',
    passwordHash: 'x',
    country: 'IN',
    workHoursPerDay: 8,
    ...fields,
  });
  return user._id.toHexString();
}

const leave = (employeeId: string, type: string, from: string, to: string, status = 'APPROVED') =>
  LeaveRequestModel.create({
    employeeId,
    type,
    fromDate: new Date(from),
    toDate: new Date(to),
    reason: 'Family',
    status,
  });

const offOf = (days: Array<{ date: string; offReason: string | null; offLabel: string | null }>) =>
  Object.fromEntries(days.map((day) => [day.date, [day.offReason, day.offLabel]]));

describe('expected hours', () => {
  it('gives Monday–Friday the working day and marks the weekend as the week off', async () => {
    const id = await employee();

    const { workHoursPerDay, days } = await trackerExpectedService.expected(id, FROM, TO, 'UTC');

    expect(workHoursPerDay).toBe(8);
    expect(days.map((day) => day.expectedMs)).toEqual([...Array(5).fill(EIGHT_HOURS), 0, 0]);
    expect(days[5]).toMatchObject({ date: '2026-01-10', offReason: 'WEEKEND', offLabel: null });
  });

  it('follows the employee’s own week over the workspace’s', async () => {
    await saveDefaultWorkDays([1, 2, 3, 4, 5]);
    const id = await employee({ workDays: [0, 1, 2, 3, 4, 5] });

    const { days } = await trackerExpectedService.expected(id, FROM, TO, 'UTC');

    expect(days.filter((day) => day.offReason === 'WEEKEND').map((day) => day.date)).toEqual([
      '2026-01-10',
    ]);
  });

  it('follows the workspace’s week when the employee has none', async () => {
    await saveDefaultWorkDays([2, 3, 4]);
    const id = await employee();

    const { days } = await trackerExpectedService.expected(id, FROM, TO, 'UTC');

    expect(days.filter((day) => day.offReason === null).map((day) => day.date)).toEqual([
      '2026-01-06',
      '2026-01-07',
      '2026-01-08',
    ]);
  });

  it('labels a holiday with its name and leave with its type code', async () => {
    const id = await employee();
    await HolidayModel.create({ name: 'Founders Day', date: new Date('2026-01-06'), country: '' });
    // Leave across the weekend costs only the working days it covers.
    await leave(id, 'cl', '2026-01-08', '2026-01-11');
    await leave(id, 'EL', '2026-01-05', '2026-01-05', 'PENDING');

    const { days } = await trackerExpectedService.expected(id, FROM, TO, 'UTC');

    expect(offOf(days)).toEqual({
      '2026-01-05': [null, null],
      '2026-01-06': ['HOLIDAY', 'Founders Day'],
      '2026-01-07': [null, null],
      '2026-01-08': ['LEAVE', 'CL'],
      '2026-01-09': ['LEAVE', 'CL'],
      '2026-01-10': ['WEEKEND', null],
      '2026-01-11': ['WEEKEND', null],
    });
    expect(days[1]).toMatchObject({ holidayName: 'Founders Day', expectedMs: 0 });
    expect(days[3]).toMatchObject({ holidayName: null, expectedMs: 0 });
  });

  it('refuses a backwards or over-wide range and an unknown zone', async () => {
    const id = await employee();
    await expect(codeOf(trackerExpectedService.expected(id, TO, FROM, 'UTC'))).resolves.toBe(
      'BAD_USER_INPUT',
    );
    const tooWide = new Date(FROM.getTime() + 63 * 86_400_000);
    await expect(codeOf(trackerExpectedService.expected(id, FROM, tooWide, 'UTC'))).resolves.toBe(
      'BAD_USER_INPUT',
    );
    await expect(
      codeOf(trackerExpectedService.expected(id, FROM, TO, 'Mars/Olympus')),
    ).resolves.toBe('BAD_USER_INPUT');
  });
});

describe('offDayToday', () => {
  afterEach(() => jest.useRealTimers());

  it('is a working day on a Wednesday with nothing booked', async () => {
    const id = await employee();
    freezeClock('2026-01-07T10:00:00Z');
    await expect(trackerExpectedService.offDayToday(id, 'UTC')).resolves.toEqual({
      offReason: null,
      offLabel: null,
    });
  });

  it('reads the day in the employee’s zone', async () => {
    const id = await employee();
    // Friday 20:00 UTC is already Saturday in Tokyo.
    freezeClock('2026-01-09T20:00:00Z');
    await expect(trackerExpectedService.offDayToday(id, 'UTC')).resolves.toEqual({
      offReason: null,
      offLabel: null,
    });
    await expect(trackerExpectedService.offDayToday(id, 'Asia/Tokyo')).resolves.toEqual({
      offReason: 'WEEKEND',
      offLabel: null,
    });
  });

  it('names the leave the employee is on today', async () => {
    const id = await employee();
    await leave(id, 'EL', '2026-01-07', '2026-01-07');
    freezeClock('2026-01-07T10:00:00Z');
    await expect(trackerExpectedService.offDayToday(id, 'UTC')).resolves.toEqual({
      offReason: 'LEAVE',
      offLabel: 'EL',
    });
  });
});

describe('the expected-hours report', () => {
  afterEach(() => jest.useRealTimers());

  it('writes "Week off", the holiday and the leave into the remarks', async () => {
    const id = await employee();
    await HolidayModel.create({ name: 'Founders Day', date: new Date('2026-01-06'), country: '' });
    await leave(id, 'CL', '2026-01-08', '2026-01-08');
    freezeClock('2026-01-09T10:00:00Z');
    const write = jest.spyOn(tableFiles, 'writeTableFile');

    await trackerExpectedReport.build(id, FROM, TO, 'UTC');

    const [format, name, sheets] = write.mock.calls[0];
    expect(format).toBe('XLSX');
    expect(name).toBe('Asha 2026-01 hours');
    const remarks = sheets[0].rows.map((row) => row.at(-1));
    expect(remarks).toEqual([
      'Below expected hours',
      'Holiday: Founders Day',
      'Below expected hours',
      'On leave',
      'In progress',
      'Week off',
      'Week off',
      expect.stringContaining('Leave: 1 days (8 hrs off expected)'),
    ]);
    // Monday and Wednesday are over and nothing was logged: 16 hours behind so far.
    expect(sheets[0].rows.at(-1)?.[3]).toBe(-16);
    write.mockRestore();
  });
});
