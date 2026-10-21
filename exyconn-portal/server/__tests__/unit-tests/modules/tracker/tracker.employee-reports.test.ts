import { Types } from 'mongoose';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { HolidayModel } from '../../../../src/modules/employee/holiday.model';
import { SalaryStructureModel } from '../../../../src/modules/employee/salary.model';
import { emailer } from '../../../../src/modules/email';
import { TrackerSessionModel } from '../../../../src/modules/tracker/models';
import {
  periodDays,
  periodsDue,
  sendEmployeeReport,
  zoneOf,
} from '../../../../src/modules/tracker/tracker.employee-reports';
import { TRACKER_DEFAULTS } from '../../../../src/modules/tracker/tracker.constants';
import type { TrackerSettingsLean } from '../../../../src/modules/tracker/tracker.settings.service';
import { asArg } from '../../../mockAs';
import { freezeClock, useTestOrganization } from '../../../helpers';

useTestOrganization({ locale: 'en-GB' });

const HOUR = 3_600_000;

let send: jest.SpyInstance;
beforeEach(() => {
  send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

async function employee() {
  const user = await UserModel.create({
    name: 'Asha',
    email: `${new Types.ObjectId().toHexString()}@exyconn.com`,
    passwordHash: 'x',
    workHoursPerDay: 8,
  });
  return { id: user._id.toHexString(), email: user.email };
}

const work = (userId: string, startedAt: string, activeMs = 3 * HOUR) =>
  TrackerSessionModel.create({
    userId,
    deviceId: 'd1',
    startedAt: new Date(startedAt),
    status: 'stopped',
    activeMs,
    idleMs: HOUR,
  });

/** The first email's arguments. */
const sent = () => send.mock.calls[0][0];

describe('zoneOf', () => {
  it('prefers the employee’s own zone, then the house default, then the company’s', () => {
    expect(zoneOf('Asia/Tokyo', 'Asia/Kolkata', 'Europe/London')).toBe('Asia/Tokyo');
    expect(zoneOf('', 'Asia/Kolkata', 'Europe/London')).toBe('Asia/Kolkata');
    expect(zoneOf(null, '', 'Europe/London')).toBe('Europe/London');
  });

  it('skips a zone nobody can resolve, and reads UTC when none is left', () => {
    expect(zoneOf('Mars/Olympus', 'Not/AZone', 'Asia/Kolkata')).toBe('Asia/Kolkata');
    expect(zoneOf(undefined, '', 'Bad/Zone')).toBe('UTC');
  });
});

describe('periodsDue', () => {
  const settings = (flags: Partial<TrackerSettingsLean> = {}): TrackerSettingsLean =>
    asArg({ ...TRACKER_DEFAULTS, ...flags });

  it('sends the day on an ordinary weekday', () => {
    expect(periodsDue('2026-01-07', settings())).toEqual(['DAY']);
  });

  it('adds the week on a Sunday and the month on its last day', () => {
    expect(periodsDue('2026-01-11', settings())).toEqual(['DAY', 'WEEK']);
    expect(periodsDue('2026-01-31', settings())).toEqual(['DAY', 'MONTH']);
    expect(periodsDue('2026-02-28', settings())).toEqual(['DAY', 'MONTH']);
    // 31 May 2026 is both a Sunday and the month's end.
    expect(periodsDue('2026-05-31', settings())).toEqual(['DAY', 'WEEK', 'MONTH']);
  });

  it('knows a leap February runs to the 29th', () => {
    expect(periodsDue('2028-02-28', settings())).toEqual(['DAY']);
    expect(periodsDue('2028-02-29', settings())).toEqual(['DAY', 'MONTH']);
  });

  it('leaves out every period that is switched off', () => {
    expect(periodsDue('2026-05-31', settings({ employeeDailyReportEnabled: false }))).toEqual([
      'WEEK',
      'MONTH',
    ]);
    expect(periodsDue('2026-05-31', settings({ employeeWeeklyReportEnabled: false }))).toEqual([
      'DAY',
      'MONTH',
    ]);
    expect(periodsDue('2026-05-31', settings({ employeeMonthlyReportEnabled: false }))).toEqual([
      'DAY',
      'WEEK',
    ]);
  });
});

describe('periodDays', () => {
  it('covers the day, the seven days to Sunday and the month to date', () => {
    expect(periodDays('DAY', '2026-01-07')).toEqual({ first: '2026-01-07', last: '2026-01-07' });
    expect(periodDays('WEEK', '2026-01-11')).toEqual({ first: '2026-01-05', last: '2026-01-11' });
    expect(periodDays('MONTH', '2026-01-31')).toEqual({ first: '2026-01-01', last: '2026-01-31' });
  });

  it('reaches back across the turn of the year', () => {
    expect(periodDays('WEEK', '2026-01-04')).toEqual({ first: '2025-12-29', last: '2026-01-04' });
  });
});

describe('sendEmployeeReport', () => {
  it('mails the day’s figures with the hours-report template and no attachment', async () => {
    const asha = await employee();
    await work(asha.id, '2026-01-07T09:00:00Z');

    await expect(sendEmployeeReport(asha.id, 'DAY', '2026-01-07', 'UTC')).resolves.toBe(true);

    expect(send).toHaveBeenCalledTimes(1);
    expect(sent()).toEqual({
      template: 'tracker-hours-report',
      to: asha.email,
      triggeredBy: 'tracker employee report schedule',
      attachments: undefined,
      variables: {
        name: 'Asha',
        periodLabel: 'on Wednesday 7 January',
        expected: '8h 0m',
        logged: '3h 0m',
        active: '3h 0m',
        offComputer: '0m',
        idle: '1h 0m',
        deficit: '-5h 0m',
        earnings: 'Salaried',
        rows: expect.objectContaining({ html: '' }),
      },
    });
  });

  it('measures the evening’s day as over, so its shortfall shows on the day itself', async () => {
    const asha = await employee();
    await work(asha.id, '2026-01-07T09:00:00Z');
    // Sent at the report hour of the same day, not the next morning.
    freezeClock('2026-01-07T20:30:00Z');

    await sendEmployeeReport(asha.id, 'DAY', '2026-01-07', 'UTC');

    expect(sent().variables).toMatchObject({ logged: '3h 0m', deficit: '-5h 0m' });
  });

  it('sends each period once a day, however often it is asked', async () => {
    const asha = await employee();
    await work(asha.id, '2026-01-11T09:00:00Z');

    await expect(sendEmployeeReport(asha.id, 'DAY', '2026-01-11', 'UTC')).resolves.toBe(true);
    await expect(sendEmployeeReport(asha.id, 'DAY', '2026-01-11', 'UTC')).resolves.toBe(false);
    // The week is its own report, claimed apart from the day.
    await expect(sendEmployeeReport(asha.id, 'WEEK', '2026-01-11', 'UTC')).resolves.toBe(true);

    expect(send).toHaveBeenCalledTimes(2);
  });

  it('gives the claim back when the email fails, so the next tick retries', async () => {
    const asha = await employee();
    await work(asha.id, '2026-01-11T09:00:00Z');
    send.mockRejectedValueOnce(new Error('SMTP down'));

    await expect(sendEmployeeReport(asha.id, 'DAY', '2026-01-11', 'UTC')).rejects.toThrow(
      'SMTP down',
    );
    await expect(sendEmployeeReport(asha.id, 'DAY', '2026-01-11', 'UTC')).resolves.toBe(true);

    expect(send).toHaveBeenCalledTimes(2);
  });

  it('skips a day nobody owed or worked, without using up its claim', async () => {
    const asha = await employee();

    // Saturday: the week off, and nothing was tracked.
    await expect(sendEmployeeReport(asha.id, 'DAY', '2026-01-10', 'UTC')).resolves.toBe(false);
    expect(send).not.toHaveBeenCalled();

    await work(asha.id, '2026-01-10T09:00:00Z');
    await expect(sendEmployeeReport(asha.id, 'DAY', '2026-01-10', 'UTC')).resolves.toBe(true);
  });

  it('still mails a working day nothing was logged on, to show the shortfall', async () => {
    const asha = await employee();

    await expect(sendEmployeeReport(asha.id, 'DAY', '2026-01-07', 'UTC')).resolves.toBe(true);
    expect(sent().variables).toMatchObject({ logged: '0m', deficit: '-8h 0m' });
  });

  it('sends nothing for an account with no email address', async () => {
    const missing = new Types.ObjectId().toHexString();

    await expect(sendEmployeeReport(missing, 'WEEK', '2026-01-11', 'UTC')).resolves.toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it('attaches the week’s PDF and lists its days, escaped', async () => {
    const asha = await employee();
    await HolidayModel.create({
      name: 'Mother & Child',
      date: new Date('2026-01-06'),
      country: '',
    });
    await work(asha.id, '2026-01-05T09:00:00Z', 8 * HOUR);

    await sendEmployeeReport(asha.id, 'WEEK', '2026-01-11', 'UTC');

    const { attachments, variables } = sent();
    expect(attachments).toEqual([
      { filename: 'hours-2026-01-05-to-2026-01-11.pdf', content: expect.any(Buffer) },
    ]);
    expect(attachments[0].content.subarray(0, 5).toString()).toBe('%PDF-');
    expect(variables.periodLabel).toBe('for 5 Jan – 11 Jan');
    const rows: string = variables.rows.html;
    expect(rows.match(/<tr>/g)).toHaveLength(7);
    expect(rows).toContain(
      '<tr><td style="padding:3px 0;">2026-01-05</td><td style="padding:3px 0;">Completed</td><td style="padding:3px 0;text-align:right;">8h 0m</td></tr>',
    );
    expect(rows).toContain('Holiday (Mother &amp; Child)');
    expect(rows).toContain('>Short<');
    expect(rows).toContain('>Week off<');
  });

  it('attaches the month’s PDF and prices hourly work', async () => {
    const asha = await employee();
    await SalaryStructureModel.create({
      employeeId: asha.id,
      currency: 'USD',
      payType: 'HOURLY',
      rate: 10,
      effectiveFrom: new Date('2025-01-01'),
    });
    await work(asha.id, '2026-01-20T09:00:00Z');

    await sendEmployeeReport(asha.id, 'MONTH', '2026-01-31', 'UTC');

    const { attachments, variables } = sent();
    expect(attachments[0].filename).toBe('hours-2026-01-01-to-2026-01-31.pdf');
    expect(variables).toMatchObject({ periodLabel: 'for January 2026', earnings: 'US$30.00' });
    expect(variables.rows.html.match(/<tr>/g)).toHaveLength(31);
  });

  it('reads the day in the employee’s own zone', async () => {
    const asha = await employee();
    // 20:00 UTC on Tuesday is already 01:30 on Wednesday in Kolkata.
    await work(asha.id, '2026-01-06T20:00:00Z');

    await sendEmployeeReport(asha.id, 'DAY', '2026-01-07', 'Asia/Kolkata');

    expect(sent().variables.logged).toBe('3h 0m');
  });
});
