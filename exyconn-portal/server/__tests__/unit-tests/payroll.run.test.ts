import { UserModel } from '../../src/modules/admin/user.model';
import { SalaryStructureModel } from '../../src/modules/employee/salary.model';
import { SalarySlipModel } from '../../src/modules/employee/salarySlip.model';
import { LeaveRequestModel } from '../../src/modules/hr/hr.model';
import { NotificationModel } from '../../src/modules/notifications';
import { payrollResolvers } from '../../src/modules/payroll';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const M = payrollResolvers.Mutation as unknown as Record<string, Resolver>;
const Q = payrollResolvers.Query as unknown as Record<string, Resolver>;
const hr = {
  user: { id: 'hr', email: 'hr@exyconn.com', roles: [ROLES.HR] },
} as unknown as GraphQLContext;
const emp = {
  user: { id: 'e', email: 'e@exyconn.com', roles: [ROLES.EMPLOYEE] },
} as unknown as GraphQLContext;

interface RunResult {
  generated: number;
  updated: number;
  skipped: number;
  totalNet: number;
}

async function employee(email: string) {
  const u = await seedUser(email, 'whatever123', [ROLES.EMPLOYEE]);
  return String(u._id);
}

describe('runPayroll', () => {
  it('generates a slip per active employee with a structure, skips those without one', async () => {
    const a = await employee('a@exyconn.com');
    await employee('b@exyconn.com'); // no salary structure
    await SalaryStructureModel.create({
      employeeId: a,
      basic: 30000,
      hra: 12000,
      allowances: 8000,
      deductions: 2500,
      effectiveFrom: new Date(),
    });

    const r = (await M.runPayroll(null, { month: 3, year: 2026 }, hr)) as RunResult;
    expect(r).toMatchObject({ generated: 1, updated: 0, skipped: 1, totalNet: 47500 });

    const slip = await SalarySlipModel.findOne({ employeeId: a, month: 3, year: 2026 });
    expect(slip).toMatchObject({ gross: 50000, deductions: 2500, net: 47500, status: 'GENERATED' });
    expect(await NotificationModel.countDocuments({ employeeId: a, kind: 'PAYROLL' })).toBe(1);
  });

  it('is idempotent: a second run recomputes instead of duplicating, and sends no second notification', async () => {
    const a = await employee('a@exyconn.com');
    await SalaryStructureModel.create({
      employeeId: a,
      basic: 30000,
      hra: 0,
      allowances: 0,
      deductions: 0,
      effectiveFrom: new Date(),
    });
    await M.runPayroll(null, { month: 3, year: 2026 }, hr);
    await SalaryStructureModel.updateOne({ employeeId: a }, { allowances: 5000 });

    const r = (await M.runPayroll(null, { month: 3, year: 2026 }, hr)) as RunResult;
    expect(r).toMatchObject({ generated: 0, updated: 1, skipped: 0 });
    expect(await SalarySlipModel.countDocuments({ employeeId: a, month: 3, year: 2026 })).toBe(1);
    expect((await SalarySlipModel.findOne({ employeeId: a }))?.net).toBe(35000);
    expect(await NotificationModel.countDocuments({ employeeId: a, kind: 'PAYROLL' })).toBe(1);
  });

  it('deducts approved unpaid leave for the month, and only that month', async () => {
    const a = await employee('a@exyconn.com');
    await SalaryStructureModel.create({
      employeeId: a,
      basic: 31000,
      hra: 0,
      allowances: 0,
      deductions: 0,
      effectiveFrom: new Date(),
    });
    await LeaveRequestModel.create({
      employeeId: a,
      type: 'UNPAID',
      fromDate: new Date('2026-03-30'),
      toDate: new Date('2026-04-02'),
      reason: 'x',
      status: 'APPROVED',
    });

    const march = (await M.runPayroll(null, { month: 3, year: 2026 }, hr)) as RunResult;
    expect(march.totalNet).toBe(31000 - 2000); // 2 unpaid days × 31000/31
  });

  it('never touches a PAID slip', async () => {
    const a = await employee('a@exyconn.com');
    await SalaryStructureModel.create({
      employeeId: a,
      basic: 10000,
      hra: 0,
      allowances: 0,
      deductions: 0,
      effectiveFrom: new Date(),
    });
    await M.runPayroll(null, { month: 3, year: 2026 }, hr);
    expect(await M.markPayrollPaid(null, { month: 3, year: 2026 }, hr)).toBe(1);
    await SalaryStructureModel.updateOne({ employeeId: a }, { basic: 99999 });

    const r = (await M.runPayroll(null, { month: 3, year: 2026 }, hr)) as RunResult;
    expect(r).toMatchObject({ generated: 0, updated: 0, skipped: 1 });
    expect((await SalarySlipModel.findOne({ employeeId: a }))?.net).toBe(10000);
  });

  it('summarises the month and refuses a plain employee', async () => {
    const a = await employee('a@exyconn.com');
    await SalaryStructureModel.create({
      employeeId: a,
      basic: 10000,
      hra: 0,
      allowances: 0,
      deductions: 1000,
      effectiveFrom: new Date(),
    });
    await M.runPayroll(null, { month: 3, year: 2026 }, hr);
    expect(await Q.payrollSummary(null, { month: 3, year: 2026 }, hr)).toMatchObject({
      slips: 1,
      paid: 0,
      totalGross: 10000,
      totalDeductions: 1000,
      totalNet: 9000,
    });
    await expect(M.runPayroll(null, { month: 3, year: 2026 }, emp)).rejects.toThrow();
    await expect(M.runPayroll(null, { month: 13, year: 2026 }, hr)).rejects.toThrow();
  });
});
