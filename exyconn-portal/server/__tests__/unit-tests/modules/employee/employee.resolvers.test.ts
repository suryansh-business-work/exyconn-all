import { randomUUID } from 'node:crypto';
import { employeeResolvers, employeeTypeDefs } from '../../../../src/modules/employee';
import { SalaryStructureModel } from '../../../../src/modules/employee/salary.model';
import { SalarySlipModel } from '../../../../src/modules/employee/salarySlip.model';
import { HolidayModel } from '../../../../src/modules/employee/holiday.model';
import { SupportTicketModel } from '../../../../src/modules/employee/support.model';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolve = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = employeeResolvers.Query as unknown as Record<string, Resolve>;

const ME = '65b000000000000000000021';
const OTHER = '65b000000000000000000022';
const as = (id: string): GraphQLContext => ({
  user: { id, email: `${id}@example.com`, roles: [ROLES.EMPLOYEE] },
});
const nobody: GraphQLContext = { user: null };

const slip = (employeeId: string, year: number, month: number) =>
  SalarySlipModel.create({
    employeeId,
    year,
    month,
    currency: 'USD',
    gross: 1000,
    net: 900,
    issuedDate: new Date(Date.UTC(year, month - 1, 28)),
  });

describe('myPayroll', () => {
  it('is empty until a salary structure exists', async () => {
    await expect(Q.myPayroll(null, {}, as(ME))).resolves.toBeNull();
  });

  it('adds the gross and net figures to the employee’s own structure', async () => {
    await SalaryStructureModel.create({
      employeeId: ME,
      currency: 'USD',
      basic: 5000,
      hra: 2000,
      allowances: 500,
      deductions: 1200,
      effectiveFrom: new Date('2026-01-01'),
    });
    await SalaryStructureModel.create({
      employeeId: OTHER,
      currency: 'USD',
      basic: 1,
      effectiveFrom: new Date('2026-01-01'),
    });

    const payroll = (await Q.myPayroll(null, {}, as(ME))) as Record<string, unknown>;

    expect(payroll).toMatchObject({ employeeId: ME, gross: 7500, net: 6300 });
    expect(payroll.id).toMatch(/^[a-f\d]{24}$/);
  });
});

describe('mySalarySlips', () => {
  it('lists only the employee’s payslips, latest month first', async () => {
    await slip(ME, 2025, 12);
    await slip(ME, 2026, 2);
    await slip(ME, 2026, 1);
    await slip(OTHER, 2026, 3);

    const rows = (await Q.mySalarySlips(null, {}, as(ME))) as Array<{
      year: number;
      month: number;
    }>;

    expect(rows.map((row) => `${row.year}-${row.month}`)).toEqual(['2026-2', '2026-1', '2025-12']);
  });
});

describe('mySupportTickets', () => {
  it('lists only the tickets the employee raised', async () => {
    const ticket = { category: 'IT', description: 'd', priority: 'LOW' };
    await SupportTicketModel.create({ ...ticket, employeeId: ME, subject: 'Mine' });
    await SupportTicketModel.create({ ...ticket, employeeId: OTHER, subject: 'Theirs' });

    const rows = (await Q.mySupportTickets(null, {}, as(ME))) as Array<{
      subject: string;
      id: string;
    }>;

    expect(rows.map((row) => row.subject)).toEqual(['Mine']);
    expect(rows[0].id).toMatch(/^[a-f\d]{24}$/);
  });
});

describe('listHolidays', () => {
  it('lists holidays in date order for anyone signed in', async () => {
    await HolidayModel.create({ name: 'Diwali', date: new Date('2026-11-08') });
    await HolidayModel.create({ name: 'New Year', date: new Date('2026-01-01') });

    const rows = (await Q.listHolidays(null, {}, as(ME))) as Array<{ name: string }>;

    expect(rows.map((row) => row.name)).toEqual(['New Year', 'Diwali']);
  });

  it('keeps a country holiday to a real ISO country code', async () => {
    const holiday = await HolidayModel.create({ name: 'Onam', date: new Date(), country: 'in' });
    expect(holiday.country).toBe('IN');
    await expect(
      HolidayModel.create({ name: 'Bad', date: new Date(), country: 'india' }),
    ).rejects.toThrow('"INDIA" is not an ISO 3166-1 country');
  });
});

describe('self-service needs a session', () => {
  it.each(['myPayroll', 'mySalarySlips', 'mySupportTickets', 'listHolidays'])(
    '%s refuses a caller who is not signed in',
    async (name) => {
      await expect(Q[name](null, {}, nobody)).rejects.toThrow('Authentication required');
    },
  );

  it('refuses replies to a ticket without a session', async () => {
    await expect(Q.mySupportReplies(null, { ticketId: randomUUID() }, nobody)).rejects.toThrow(
      'Authentication required',
    );
  });

  it('declares every self-service query in the schema', () => {
    const body = employeeTypeDefs.loc?.source.body ?? '';
    for (const name of ['myPayroll', 'mySalarySlips', 'mySupportTickets', 'listHolidays']) {
      expect(body).toContain(name);
    }
  });
});
