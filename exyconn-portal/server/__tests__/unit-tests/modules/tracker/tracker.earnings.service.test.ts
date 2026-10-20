import { trackerEarningsService } from '../../../../src/modules/tracker/tracker.earnings.service';
import { trackerAdminService } from '../../../../src/modules/tracker/tracker.admin.service';
import { SalaryStructureModel } from '../../../../src/modules/employee/salary.model';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';

useTestOrganization({ currency: 'INR' });

const EMPLOYEE = 'emp-earnings';
const HOUR = 3_600_000;
const FROM = '2026-01-01T00:00:00Z';
const TO = '2026-02-01T00:00:00Z';

// The calendar is the tracker's own figure (tested with the admin service); earnings price it.
const calendar = jest.spyOn(trackerAdminService, 'calendar');
type CalendarDay = Awaited<ReturnType<typeof trackerAdminService.calendar>>[number];
const day = (date: string, activeMs: number, manualMs: number) =>
  ({ date, activeMs, manualMs }) as CalendarDay;

beforeEach(() => {
  calendar.mockResolvedValue([
    day('2026-01-05', 6 * HOUR, 2 * HOUR),
    day('2026-01-06', HOUR / 2, 0),
  ]);
});
afterAll(() => calendar.mockRestore());

const structure = (fields: Record<string, unknown>) =>
  SalaryStructureModel.create({
    employeeId: EMPLOYEE,
    currency: 'USD',
    effectiveFrom: new Date('2025-01-01'),
    ...fields,
  });

describe('earnings', () => {
  it('pays tracked plus approved off-computer time at the hourly rate', async () => {
    await structure({ payType: 'HOURLY', rate: 20 });

    await expect(trackerEarningsService.earnings(EMPLOYEE, FROM, TO)).resolves.toEqual({
      payType: 'HOURLY',
      rate: 20,
      currency: 'USD',
      trackedMs: 8.5 * HOUR,
      amount: 170,
    });
    expect(calendar).toHaveBeenCalledWith(EMPLOYEE, new Date(FROM), new Date(TO), 'UTC');
  });

  it('gives no amount for a pay type that is not hourly', async () => {
    await structure({ payType: 'FIXED', rate: 20 });

    await expect(trackerEarningsService.earnings(EMPLOYEE, FROM, TO)).resolves.toMatchObject({
      payType: 'FIXED',
      trackedMs: 8.5 * HOUR,
      amount: null,
    });
  });

  it('falls back to the house pay type and the company currency without a structure', async () => {
    await expect(trackerEarningsService.earnings(EMPLOYEE, FROM, TO)).resolves.toEqual({
      payType: 'FIXED',
      rate: 0,
      currency: 'INR',
      trackedMs: 8.5 * HOUR,
      amount: null,
    });
  });

  it('pays nothing for a range with no tracked time', async () => {
    calendar.mockResolvedValueOnce([]);
    await structure({ payType: 'HOURLY', rate: 15 });
    await expect(trackerEarningsService.earnings(EMPLOYEE, FROM, TO)).resolves.toMatchObject({
      trackedMs: 0,
      amount: 0,
    });
  });

  it('accepts a range of exactly 366 days and refuses one longer', async () => {
    const yearOn = '2027-01-02T00:00:00Z'; // 366 days after FROM
    await expect(trackerEarningsService.earnings(EMPLOYEE, FROM, yearOn)).resolves.toBeDefined();
    await expect(
      codeOf(trackerEarningsService.earnings(EMPLOYEE, FROM, '2027-01-02T00:00:01Z')),
    ).resolves.toBe('BAD_USER_INPUT');
  });

  it.each([
    ['backwards', TO, FROM],
    ['empty', FROM, FROM],
    ['unreadable', 'yesterday', TO],
  ])('refuses a %s range before reading anything', async (_label, from, to) => {
    await expect(codeOf(trackerEarningsService.earnings(EMPLOYEE, from, to))).resolves.toBe(
      'BAD_USER_INPUT',
    );
    expect(calendar).not.toHaveBeenCalled();
  });
});
