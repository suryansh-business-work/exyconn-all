import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { payrollResolvers } from '../../../../src/modules/payroll';
import { SalarySlipModel } from '../../../../src/modules/employee/salarySlip.model';
import { emailer } from '../../../../src/modules/email';
import { ROLES } from '../../../../src/constants/roles';
import { seedUser, useTestOrganization } from '../../../helpers';
import type { GraphQLContext } from '../../../../src/middleware/auth';

useTestOrganization({ currency: 'INR', locale: 'en-IN', taxSystem: 'INDIA_GST' });

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = payrollResolvers.Query as unknown as Record<string, Resolver>;
const M = payrollResolvers.Mutation as unknown as Record<string, Resolver>;

const as = (id: string, roles: string[]) =>
  ({ user: { id, email: `${id}@exyconn.com`, roles } }) as unknown as GraphQLContext;
const hr = as('hr-1', [ROLES.HR]);
const finance = as('fin-1', [ROLES.FINANCE]);
const MARCH = { month: 3, year: 2026 };

const slip = (employeeId: string, extra: Record<string, unknown> = {}) =>
  SalarySlipModel.create({
    employeeId,
    ...MARCH,
    currency: 'INR',
    gross: 10_000,
    deductions: 1_000,
    net: 9_000,
    issuedDate: new Date('2026-03-31T00:00:00.000Z'),
    ...extra,
  });

async function employeeWithSlip(email: string) {
  const user = await seedUser(email, randomUUID(), [ROLES.EMPLOYEE]);
  const id = String(user._id);
  const created = await slip(id);
  return { id, slipId: String(created._id), ctx: as(id, [ROLES.EMPLOYEE]) };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('listSalarySlipsPaged and listSalarySlipsStats', () => {
  it('pages the slips with ids, newest issued first', async () => {
    await slip('a', { issuedDate: new Date('2026-01-31T00:00:00.000Z'), month: 1 });
    await slip('b');

    const page = (await Q.listSalarySlipsPaged(
      null,
      { input: { page: 0, pageSize: 10 } },
      finance,
    )) as {
      rows: { id: string; employeeId: string }[];
      totalCount: number;
    };

    expect(page.totalCount).toBe(2);
    expect(page.rows.map((r) => r.employeeId)).toEqual(['b', 'a']);
    expect(typeof page.rows[0].id).toBe('string');
  });

  it('counts slips by status and sums gross and net', async () => {
    await slip('a', { status: 'PAID' });
    await slip('b');

    const stats = (await Q.listSalarySlipsStats(null, {}, hr)) as {
      total: number;
      counts: { field: string; buckets: { value: string; count: number }[] }[];
      sums: { field: string; total: number }[];
    };

    expect(stats.total).toBe(2);
    expect(stats.counts[0].buckets).toEqual(
      expect.arrayContaining([
        { value: 'PAID', count: 1 },
        { value: 'GENERATED', count: 1 },
      ]),
    );
    expect(stats.sums).toEqual([
      { field: 'gross', total: 20_000 },
      { field: 'net', total: 18_000 },
    ]);
  });
});

describe('markPayrollPaid', () => {
  it('marks only the month’s unpaid slips paid and says how many it moved', async () => {
    await slip('a');
    await slip('b', { status: 'PAID', paidOn: new Date('2026-04-01T00:00:00.000Z') });
    await slip('c', { month: 4 });

    await expect(M.markPayrollPaid(null, MARCH, finance)).resolves.toBe(1);
    await expect(M.markPayrollPaid(null, MARCH, finance)).resolves.toBe(0);
    expect((await SalarySlipModel.findOne({ employeeId: 'c' }).lean())?.status).toBe('GENERATED');
  });

  it('refuses a year outside the payroll range', async () => {
    await expect(M.markPayrollPaid(null, { month: 3, year: 1999 }, hr)).rejects.toThrow(
      'year out of range',
    );
    await expect(Q.payrollSummary(null, { month: 3, year: 2101 }, hr)).rejects.toThrow(
      'year out of range',
    );
  });
});

describe('salarySlipPdf', () => {
  it('lets an employee download their own payslip without a payroll role', async () => {
    const { slipId, ctx } = await employeeWithSlip('own@exyconn.com');

    const file = (await Q.salarySlipPdf(null, { id: slipId }, ctx)) as {
      filename: string;
      contentType: string;
      contentBase64: string;
    };

    expect(file.contentType).toBe('application/pdf');
    expect(file.filename).toMatch(/^Payslip-own-2026-03\.pdf$/);
    expect(Buffer.from(file.contentBase64, 'base64').subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('lets HR download anybody’s, and refuses another employee', async () => {
    const { slipId } = await employeeWithSlip('owner@exyconn.com');
    const nosy = as(String(new Types.ObjectId()), [ROLES.EMPLOYEE]);

    await expect(Q.salarySlipPdf(null, { id: slipId }, hr)).resolves.toMatchObject({
      contentType: 'application/pdf',
    });
    await expect(Q.salarySlipPdf(null, { id: slipId }, nosy)).rejects.toThrow();
  });

  it('refuses a slip that does not exist, and a caller who is not signed in', async () => {
    const missing = String(new Types.ObjectId());
    await expect(Q.salarySlipPdf(null, { id: missing }, hr)).rejects.toThrow(
      'Salary slip not found',
    );
    await expect(
      Q.salarySlipPdf(null, { id: missing }, {} as unknown as GraphQLContext),
    ).rejects.toThrow();
  });
});

describe('sendSalarySlips', () => {
  it('emails the month’s payslips as whoever pressed the button', async () => {
    const send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
    await employeeWithSlip('mail@exyconn.com');

    await expect(M.sendSalarySlips(null, MARCH, hr)).resolves.toEqual({
      ...MARCH,
      sent: 1,
      failed: 0,
      skipped: 0,
    });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'mail@exyconn.com', triggeredBy: 'hr-1@exyconn.com' }),
    );
  });

  it('refuses a month that does not exist and a plain employee', async () => {
    const send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
    await expect(M.sendSalarySlips(null, { month: 13, year: 2026 }, hr)).rejects.toThrow(
      'month must be 1-12',
    );
    await expect(M.sendSalarySlips(null, MARCH, as('emp-1', [ROLES.EMPLOYEE]))).rejects.toThrow();
    expect(send).not.toHaveBeenCalled();
  });
});
