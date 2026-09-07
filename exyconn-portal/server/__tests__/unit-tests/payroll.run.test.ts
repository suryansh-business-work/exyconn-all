import { UserModel } from '../../src/modules/admin/user.model';
import { SalaryStructureModel } from '../../src/modules/employee/salary.model';
import { SalarySlipModel } from '../../src/modules/employee/salarySlip.model';
import { LeaveRequestModel } from '../../src/modules/hr/hr.model';
import { NotificationModel } from '../../src/modules/notifications';
import { EmployeeDocumentModel } from '../../src/modules/documents';
import { PayrollSettingsModel } from '../../src/modules/payroll';
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

/**
 * The statutory policy a test runs against. Every test states its own, because the figures
 * the company withholds are a setting — a test that let the default decide them would be
 * testing the default, not the run.
 */
async function setPolicy(overrides: Record<string, unknown> = {}) {
  await PayrollSettingsModel.updateOne(
    { key: 'global' },
    {
      $set: {
        key: 'global',
        pfEnabled: false,
        pfEmployeePercent: 12,
        pfWageCeiling: 15_000,
        esiEnabled: false,
        esiEmployeePercent: 0.75,
        esiWageLimit: 21_000,
        professionalTaxMonthly: 0,
        tdsMode: 'NONE',
        tdsFlatPercent: 0,
        ...overrides,
      },
    },
    { upsert: true },
  );
}

describe('runPayroll', () => {
  // These are about the run itself, so nothing statutory is withheld inside them.
  beforeEach(() => setPolicy());
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

describe('runPayroll — statutory deductions', () => {
  const withSettings = (overrides: Record<string, unknown> = {}) =>
    setPolicy({ pfEnabled: true, esiEnabled: true, professionalTaxMonthly: 200, ...overrides });

  it('withholds PF, ESI and professional tax and stores each line beside the total', async () => {
    await withSettings();
    const a = await employee('a@exyconn.com');
    await SalaryStructureModel.create({
      employeeId: a,
      basic: 10_000,
      hra: 4_000,
      allowances: 2_000,
      deductions: 0,
      effectiveFrom: new Date(),
    });

    await M.runPayroll(null, { month: 3, year: 2026 }, hr);
    const slip = await SalarySlipModel.findOne({ employeeId: a });
    expect(slip).toMatchObject({ pf: 1_200, esi: 120, professionalTax: 200, tds: 0 });
    expect(slip?.deductions).toBe(1_520);
    expect(slip?.net).toBe(16_000 - 1_520);
  });

  it("lets an employee's structure opt out of PF and ESI and set their own TDS rate", async () => {
    await withSettings({ tdsMode: 'FLAT_PERCENT', tdsFlatPercent: 5 });
    const a = await employee('a@exyconn.com');
    await SalaryStructureModel.create({
      employeeId: a,
      basic: 10_000,
      hra: 4_000,
      allowances: 2_000,
      deductions: 0,
      pfApplicable: false,
      esiApplicable: false,
      tdsPercent: 10,
      effectiveFrom: new Date(),
    });

    await M.runPayroll(null, { month: 3, year: 2026 }, hr);
    // 16,000 − 200 professional tax = 15,800 taxable, at the employee's own 10%.
    expect(await SalarySlipModel.findOne({ employeeId: a })).toMatchObject({
      pf: 0,
      esi: 0,
      professionalTax: 200,
      tds: 1_580,
    });
  });

  it('files the payslip under the employee documents, exactly once however often it runs', async () => {
    await setPolicy();
    const a = await employee('a@exyconn.com');
    await SalaryStructureModel.create({
      employeeId: a,
      basic: 10_000,
      hra: 0,
      allowances: 0,
      deductions: 0,
      effectiveFrom: new Date(),
    });

    await M.runPayroll(null, { month: 3, year: 2026 }, hr);
    await M.runPayroll(null, { month: 3, year: 2026 }, hr);

    const documents = await EmployeeDocumentModel.find({ employeeId: a }).lean();
    expect(documents).toHaveLength(1);
    expect(documents[0]).toMatchObject({ kind: 'SALARY_SLIP', title: 'Payslip March 2026' });
    const slip = await SalarySlipModel.findOne({ employeeId: a });
    expect(documents[0].salarySlipId).toBe(String(slip?._id));
  });

  it('stamps the day the salary left the company when the month is marked paid', async () => {
    await setPolicy();
    const a = await employee('a@exyconn.com');
    await SalaryStructureModel.create({
      employeeId: a,
      basic: 10_000,
      hra: 0,
      allowances: 0,
      deductions: 0,
      effectiveFrom: new Date(),
    });
    await M.runPayroll(null, { month: 3, year: 2026 }, hr);
    expect(await SalarySlipModel.findOne({ employeeId: a }).then((s) => s?.paidOn)).toBeNull();

    await M.markPayrollPaid(null, { month: 3, year: 2026 }, hr);
    const paid = await SalarySlipModel.findOne({ employeeId: a });
    expect(paid?.status).toBe('PAID');
    expect(paid?.paidOn).toBeInstanceOf(Date);
  });
});

describe('payrollSettings', () => {
  it('creates the policy with its defaults on first read', async () => {
    expect(await Q.payrollSettings(null, {}, hr)).toMatchObject({
      pfEnabled: true,
      pfEmployeePercent: 12,
      pfWageCeiling: 15_000,
      esiWageLimit: 21_000,
      professionalTaxMonthly: 200,
      tdsMode: 'NONE',
    });
  });

  it('saves a new policy, refuses nonsense, and refuses a plain employee', async () => {
    const input = {
      pfEnabled: true,
      pfEmployeePercent: 10,
      pfWageCeiling: 20_000,
      esiEnabled: false,
      esiEmployeePercent: 0.75,
      esiWageLimit: 21_000,
      professionalTaxMonthly: 250,
      tdsMode: 'FLAT_PERCENT',
      tdsFlatPercent: 5,
    };
    await expect(M.updatePayrollSettings(null, { input }, hr)).resolves.toMatchObject({
      pfEmployeePercent: 10,
      esiEnabled: false,
      tdsMode: 'FLAT_PERCENT',
    });
    await expect(
      M.updatePayrollSettings(null, { input: { ...input, pfEmployeePercent: 120 } }, hr),
    ).rejects.toThrow(/between 0 and 100/);
    await expect(
      M.updatePayrollSettings(null, { input: { ...input, tdsMode: 'GUESS' } }, hr),
    ).rejects.toThrow(/tdsMode/);
    await expect(M.updatePayrollSettings(null, { input }, emp)).rejects.toThrow();
  });
});
