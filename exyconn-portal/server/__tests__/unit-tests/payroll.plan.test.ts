import { UserModel } from '../../src/modules/admin/user.model';
import { SalaryStructureModel } from '../../src/modules/employee/salary.model';
import { SalarySlipModel } from '../../src/modules/employee/salarySlip.model';
import { LeaveRequestModel } from '../../src/modules/hr/hr.model';
import { PayrollSettingsModel, payrollResolvers } from '../../src/modules/payroll';
import { payrollWindow, zonedMidnight } from '../../src/modules/payroll/payroll.window';
import { ROLES } from '../../src/constants/roles';
import { freezeClock, seedUser, useTestOrganization } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

useTestOrganization({
  currency: 'INR',
  locale: 'en-IN',
  taxSystem: 'INDIA_GST',
  fiscalYearStartMonth: 4,
  timezone: 'Asia/Kolkata',
});

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const M = payrollResolvers.Mutation as unknown as Record<string, Resolver>;
const Q = payrollResolvers.Query as unknown as Record<string, Resolver>;
const PayrollSettings = payrollResolvers.PayrollSettings as unknown as Record<
  string,
  (s: object) => unknown
>;
const hr = {
  user: { id: 'hr', email: 'hr@exyconn.com', roles: [ROLES.HR] },
} as unknown as GraphQLContext;
const emp = {
  user: { id: 'e', email: 'e@exyconn.com', roles: [ROLES.EMPLOYEE] },
} as unknown as GraphQLContext;

const OCTOBER = { month: 10, year: 2026 };
/** 24 Oct 23:30 in Kolkata — still the 24th there, so October has not opened. */
const EVE_OF_OPENING = '2026-10-24T18:00:00.000Z';
/** 25 Oct 00:00 in Kolkata, while UTC still reads the 24th. */
const OPENING = '2026-10-24T18:30:00.000Z';

interface Candidate {
  employeeId: string;
  name: string;
  status: string;
  slipStatus: string | null;
  gross: number | null;
  deductions: number | null;
  net: number | null;
  currency: string | null;
}

interface Plan {
  opensOn: Date;
  open: boolean;
  employees: Candidate[];
  readyCount: number;
  alreadyRunCount: number;
  noStructureCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
}

async function employee(email: string, fields: Record<string, unknown> = {}) {
  const u = await seedUser(email, 'whatever123', [ROLES.EMPLOYEE]);
  await UserModel.updateOne({ _id: u._id }, fields);
  return String(u._id);
}

async function structureFor(employeeId: string, amounts: Record<string, number>) {
  await SalaryStructureModel.create({
    employeeId,
    currency: 'INR',
    basic: 0,
    hra: 0,
    allowances: 0,
    deductions: 0,
    effectiveFrom: new Date('2020-01-01T00:00:00.000Z'),
    ...amounts,
  });
}

/** Statutory deductions on, so the plan's figures have more than one line to agree on. */
async function setPolicy(overrides: Record<string, unknown> = {}) {
  await PayrollSettingsModel.updateOne(
    { key: 'global' },
    {
      $set: {
        key: 'global',
        pfEnabled: true,
        pfEmployeePercent: 12,
        pfWageCeiling: 15_000,
        esiEnabled: true,
        esiEmployeePercent: 0.75,
        esiWageLimit: 21_000,
        professionalTaxMonthly: 200,
        tdsMode: 'NONE',
        tdsFlatPercent: 0,
        ...overrides,
      },
    },
    { upsert: true },
  );
}

const plan = (ctx: GraphQLContext = hr) => Q.payrollRunPlan(null, OCTOBER, ctx) as Promise<Plan>;

afterEach(() => {
  jest.useRealTimers();
});

describe('payrollWindow', () => {
  it('opens at midnight of the run day on the company clock, not in UTC', () => {
    const before = payrollWindow(10, 2026, 25, 'Asia/Kolkata', new Date(EVE_OF_OPENING));
    const after = payrollWindow(10, 2026, 25, 'Asia/Kolkata', new Date(OPENING));
    expect(before).toEqual({ opensOn: new Date(OPENING), open: false });
    expect(after.open).toBe(true);
    // The same instant on a UTC clock is still the 24th.
    expect(payrollWindow(10, 2026, 25, 'UTC', new Date(OPENING)).open).toBe(false);
  });

  it('stays open for every later day and month, and keeps future months closed', () => {
    const now = new Date('2026-11-02T10:00:00.000Z');
    expect(payrollWindow(10, 2026, 25, 'UTC', now).open).toBe(true);
    expect(payrollWindow(12, 2025, 28, 'UTC', now).open).toBe(true);
    expect(payrollWindow(11, 2026, 25, 'UTC', now).open).toBe(false);
    expect(payrollWindow(1, 2027, 1, 'UTC', now).open).toBe(false);
  });

  it('finds midnight across a daylight-saving change', () => {
    // New York is on EDT (UTC-4) until 1 Nov 2026 and on EST (UTC-5) from then.
    expect(zonedMidnight(2026, 10, 25, 'America/New_York')).toEqual(
      new Date('2026-10-25T04:00:00.000Z'),
    );
    expect(zonedMidnight(2026, 11, 25, 'America/New_York')).toEqual(
      new Date('2026-11-25T05:00:00.000Z'),
    );
  });
});

describe('payrollRunPlan', () => {
  beforeEach(() => setPolicy());

  it('lists every active employee with where they stand, ready ones with their figures', async () => {
    freezeClock(OPENING);
    const ready = await employee('ready@exyconn.com', { department: 'Engineering' });
    const run = await employee('run@exyconn.com');
    const none = await employee('none@exyconn.com');
    const gone = await employee('gone@exyconn.com', { isActive: false });
    await structureFor(ready, { basic: 10_000, hra: 4_000, allowances: 2_000 });
    await structureFor(run, { basic: 10_000 });
    await structureFor(gone, { basic: 10_000 });
    await M.runPayroll(null, { ...OCTOBER, employeeIds: [run] }, hr);

    const result = await plan();
    expect(result).toMatchObject({
      opensOn: new Date(OPENING),
      open: true,
      readyCount: 1,
      alreadyRunCount: 1,
      noStructureCount: 1,
    });
    const byId = new Map(result.employees.map((c) => [c.employeeId, c]));
    expect(byId.has(gone)).toBe(false);
    expect(result.employees.map((c) => c.name)).toEqual(['none', 'ready', 'run']);
    expect(byId.get(ready)).toMatchObject({ status: 'READY', currency: 'INR', slipStatus: null });
    expect(byId.get(run)).toMatchObject({
      status: 'ALREADY_RUN',
      slipStatus: 'GENERATED',
      net: null,
    });
    expect(byId.get(none)).toMatchObject({ status: 'NO_STRUCTURE', slipStatus: null, gross: null });
  });

  it('shows exactly the figures the run then stores', async () => {
    freezeClock(OPENING);
    const a = await employee('a@exyconn.com');
    const b = await employee('b@exyconn.com');
    await structureFor(a, { basic: 10_000, hra: 4_000, allowances: 2_000, deductions: 300 });
    await structureFor(b, { basic: 40_000, hra: 10_000 });
    await LeaveRequestModel.create({
      employeeId: a,
      type: 'UNPAID',
      fromDate: new Date('2026-10-05'),
      toDate: new Date('2026-10-06'),
      reason: 'x',
      status: 'APPROVED',
    });

    const before = await plan();
    await M.runPayroll(null, { ...OCTOBER, employeeIds: [a, b] }, hr);
    const slips = await SalarySlipModel.find(OCTOBER).lean();

    for (const candidate of before.employees) {
      const slip = slips.find((s) => s.employeeId === candidate.employeeId);
      expect(slip).toMatchObject({
        gross: candidate.gross,
        deductions: candidate.deductions,
        net: candidate.net,
        currency: candidate.currency,
      });
    }
    expect(before.totalNet).toBe(slips.reduce((sum, s) => sum + s.net, 0));
    expect(before.totalGross).toBe(slips.reduce((sum, s) => sum + s.gross, 0));
    expect(before.totalDeductions).toBe(slips.reduce((sum, s) => sum + s.deductions, 0));
    expect((await plan()).alreadyRunCount).toBe(2);
  });

  it('is closed before the run day, and the run is refused with the day it opens', async () => {
    freezeClock(EVE_OF_OPENING);
    const a = await employee('a@exyconn.com');
    await structureFor(a, { basic: 10_000 });

    expect(await plan()).toMatchObject({ open: false, readyCount: 1 });
    await expect(M.runPayroll(null, { ...OCTOBER, employeeIds: [a] }, hr)).rejects.toThrow(
      'Payroll for October 2026 opens on 25 October 2026 and cannot be run before then.',
    );
    expect(await SalarySlipModel.countDocuments()).toBe(0);
  });

  it('opens on the day the payroll settings name', async () => {
    freezeClock('2026-10-10T06:00:00.000Z');
    await setPolicy({ runFromDay: 10 });
    expect(await plan()).toMatchObject({
      open: true,
      opensOn: new Date('2026-10-09T18:30:00.000Z'),
    });
  });

  it('opens on the 25th for a policy saved before the run day existed', async () => {
    freezeClock(OPENING);
    await PayrollSettingsModel.collection.updateOne(
      { key: 'global' },
      { $unset: { runFromDay: '' } },
    );
    expect(await plan()).toMatchObject({ open: true, opensOn: new Date(OPENING) });
  });

  it('refuses a plain employee and a month that does not exist', async () => {
    await expect(plan(emp)).rejects.toThrow();
    await expect(Q.payrollRunPlan(null, { month: 0, year: 2026 }, hr)).rejects.toThrow();
  });
});

describe('payrollSettings.runFromDay', () => {
  const input = {
    pfEnabled: false,
    pfEmployeePercent: 12,
    pfWageCeiling: 15_000,
    esiEnabled: false,
    esiEmployeePercent: 0.75,
    esiWageLimit: 21_000,
    professionalTaxMonthly: 0,
    tdsMode: 'NONE',
    tdsFlatPercent: 0,
  };

  it('defaults to the 25th, also for a policy saved before the setting existed', async () => {
    expect(await Q.payrollSettings(null, {}, hr)).toMatchObject({ runFromDay: 25 });
    expect(PayrollSettings.runFromDay({})).toBe(25);
    expect(PayrollSettings.runFromDay({ runFromDay: 3 })).toBe(3);
  });

  it('saves a day that exists in every month and refuses any other', async () => {
    const save = (runFromDay: number) =>
      M.updatePayrollSettings(null, { input: { ...input, runFromDay } }, hr);
    await expect(save(28)).resolves.toMatchObject({ runFromDay: 28 });
    await expect(save(1)).resolves.toMatchObject({ runFromDay: 1 });
    for (const bad of [0, 29, 31, 12.5]) {
      await expect(save(bad)).rejects.toThrow('runFromDay must be a whole day 1-28');
    }
  });
});
