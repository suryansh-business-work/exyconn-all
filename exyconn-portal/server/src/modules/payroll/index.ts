import { SalaryStructureModel } from '../employee/salary.model';
import { SalarySlipModel } from '../employee/salarySlip.model';
import { payrollTypeDefs } from './payroll.typeDefs';
import {
  grossOf,
  monthlyEarnings,
  type PaySource,
  type StatutorySettings,
} from './payroll.compute';
import { DEFAULT_PAY_TYPE, type PayType } from '../../constants/pay';
import { companyProfile } from '../../lib/company';
import { normalizeCurrency } from '../../utils/iso';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertNotOwnRecord, assertPermission, refuseOwnRecordWrites } from '../../lib/permissions';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { badRequest, notFound } from '../../utils/errors';
import { withId, withIds } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import { PayrollScheduleModel, MAX_SCHEDULE_DAY } from './payroll-schedule.model';
import {
  DEFAULT_FINANCIAL_YEAR_START_MONTH,
  DEFAULT_RUN_FROM_DAY,
  DEFAULT_TDS_REGIME_KEY,
  PayrollSettingsModel,
  readPayrollSettings,
  TDS_MODES,
} from './payroll-settings.model';
import { TaxRegimeModel, TaxSlabModel } from './tax-slab.model';
import { planPayroll, runPayrollFor } from './payroll.run';
import { readSchedule } from './payroll.schedule';
import { dispatchSalarySlips, renderPayslip } from './payroll.dispatch';
import type { GraphQLContext } from '../../middleware/auth';
import type { TableQueryInput } from '../../utils/tableQuery';

const PAYROLL_ROLES = [ROLES.HR, ROLES.FINANCE];

/** The admin matrix restricts payroll runs, slips, schedule and settings under this name. */
const SLIP_MODULE = 'SalarySlip';

interface SalaryStructureInput {
  employeeId: string;
  currency: string;
  payType?: PayType;
  payTypeNote?: string;
  basic: number;
  hra: number;
  allowances: number;
  deductions: number;
  /** Per hour for HOURLY, per month for STIPEND and OTHER. */
  rate?: number;
  /** Per hour, always — what the tracker bills this person's time at. */
  billingRate?: number;
  /** This employee's own statutory position, overriding the company payroll settings. */
  pfApplicable?: boolean;
  esiApplicable?: boolean;
  tdsPercent?: number;
  pfNumber?: string;
  esiNumber?: string;
  panNumber?: string;
  effectiveFrom: Date;
}

/** ONE employee's salary structure, by employee. Null until HR has set one up. */
async function employeeSalary(
  _p: unknown,
  { employeeId }: { employeeId: string },
  ctx: GraphQLContext,
) {
  await assertPermission(ctx, 'SalaryStructure', PAYROLL_ROLES, 'VIEW');
  const structure = await SalaryStructureModel.findOne({ employeeId }).lean();
  return structure ? withId(structure as { _id: unknown }) : null;
}

/**
 * Creates or replaces ONE employee's salary structure.
 *
 * An upsert rather than create-or-update because `employeeId` is unique: the HR employee
 * form saves compensation alongside the rest of the record and has no business knowing
 * whether a structure already exists, and a client that guesses wrong gets a duplicate-key
 * error instead of a saved employee.
 */
async function saveEmployeeSalary(
  _p: unknown,
  { employeeId, input }: { employeeId: string; input: Omit<SalaryStructureInput, 'employeeId'> },
  ctx: GraphQLContext,
) {
  await assertPermission(ctx, 'SalaryStructure', PAYROLL_ROLES, 'EDIT');
  // Nobody sets their own pay, whatever payroll role they hold.
  assertNotOwnRecord(ctx, employeeId, 'set a salary');
  const saved = await SalaryStructureModel.findOneAndUpdate(
    { employeeId },
    { ...input, employeeId },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  return withId(saved as { _id: unknown });
}

const structureCrud = createCrudResolvers(
  createCrudService<SalaryStructureInput>(SalaryStructureModel as never, 'SalaryStructure'),
  {
    name: 'SalaryStructure',
    roles: PAYROLL_ROLES,
    table: {
      searchFields: ['employeeId', 'currency', 'payType'],
      filterFields: ['employeeId', 'currency', 'payType'],
      sortFields: ['basic', 'rate', 'billingRate', 'payType', 'effectiveFrom', 'createdAt'],
      defaultSort: { field: 'effectiveFrom', dir: 'DESC' },
    },
    stats: { countBy: ['currency', 'payType'], sum: ['basic', 'hra', 'allowances', 'deductions'] },
  },
);

/** The tax table is HR's alone: it decides what every employee is withheld. */
const TAX_TABLE_ROLES = [ROLES.HR];

interface TaxRegimeInput {
  regimeKey: string;
  financialYear: string;
  name: string;
  standardDeduction: number;
  rebateIncomeLimit: number;
  rebateMaxTax: number;
  cessPercent: number;
  active: boolean;
}

interface TaxSlabInput {
  regimeKey: string;
  financialYear: string;
  fromAmount: number;
  toAmount?: number | null;
  ratePercent: number;
  order: number;
  active: boolean;
}

const regimeCrud = createCrudResolvers(
  createCrudService<TaxRegimeInput>(TaxRegimeModel as never, 'TaxRegime'),
  { name: 'TaxRegime', roles: TAX_TABLE_ROLES },
);

const slabCrud = createCrudResolvers(
  createCrudService<TaxSlabInput>(TaxSlabModel as never, 'TaxSlab'),
  {
    name: 'TaxSlab',
    roles: TAX_TABLE_ROLES,
    table: {
      searchFields: ['regimeKey', 'financialYear'],
      filterFields: ['regimeKey', 'financialYear'],
      sortFields: ['order', 'fromAmount', 'toAmount', 'ratePercent', 'financialYear'],
      defaultSort: { field: 'order', dir: 'ASC' },
    },
    stats: { countBy: ['regimeKey', 'active'] },
  },
);

const slipService = createCrudService<never>(SalarySlipModel as never, 'SalarySlip');
const SLIP_TABLE = {
  searchFields: ['employeeId', 'currency'],
  filterFields: ['employeeId', 'status', 'year', 'month'],
  sortFields: ['year', 'month', 'net', 'status', 'issuedDate'],
  defaultSort: { field: 'issuedDate', dir: 'DESC' as const },
};

function assertMonth(month: number, year: number) {
  if (month < 1 || month > 12) badRequest('month must be 1-12');
  if (year < 2000 || year > 2100) badRequest('year out of range');
}

/** What the month's run would do, employee by employee — HR reviews this before running it. */
async function payrollRunPlan(
  _p: unknown,
  { month, year }: { month: number; year: number },
  ctx: GraphQLContext,
) {
  await assertPermission(ctx, SLIP_MODULE, PAYROLL_ROLES, 'CREATE');
  assertMonth(month, year);
  return planPayroll(month, year);
}

async function runPayroll(
  _p: unknown,
  { month, year, employeeIds }: { month: number; year: number; employeeIds: string[] },
  ctx: GraphQLContext,
) {
  await assertPermission(ctx, SLIP_MODULE, PAYROLL_ROLES, 'CREATE');
  assertMonth(month, year);
  return runPayrollFor(month, year, employeeIds);
}

async function markPayrollPaid(
  _p: unknown,
  { month, year }: { month: number; year: number },
  ctx: GraphQLContext,
) {
  await assertPermission(ctx, 'SalarySlip', PAYROLL_ROLES, 'APPROVE');
  assertMonth(month, year);
  // The pay date is stamped with the status, because a slip that is PAID with no date is a
  // salary the cash-flow summary can see was paid but not when — so it counts it in no month.
  const res = await SalarySlipModel.updateMany(
    { month, year, status: 'GENERATED' },
    { status: 'PAID', paidOn: new Date() },
  );
  return res.modifiedCount;
}

async function payrollSummary(
  _p: unknown,
  { month, year }: { month: number; year: number },
  ctx: GraphQLContext,
) {
  await assertPermission(ctx, SLIP_MODULE, PAYROLL_ROLES, 'VIEW');
  assertMonth(month, year);
  const slips = await SalarySlipModel.find({ month, year }).lean();
  return {
    month,
    year,
    slips: slips.length,
    paid: slips.filter((s) => s.status === 'PAID').length,
    totalGross: slips.reduce((sum, s) => sum + s.gross, 0),
    totalDeductions: slips.reduce((sum, s) => sum + s.deductions, 0),
    totalNet: slips.reduce((sum, s) => sum + s.net, 0),
  };
}

/** HR chooses the day, hour and minute; anything outside the clock is a mistake, not a policy. */
interface PayrollScheduleInput {
  enabled: boolean;
  dayOfMonth: number;
  hour: number;
  minute: number;
  period: string;
}

const DISPATCH_PERIODS = new Set(['PREVIOUS_MONTH', 'CURRENT_MONTH']);

function assertSchedule(input: PayrollScheduleInput) {
  if (input.dayOfMonth < 1 || input.dayOfMonth > MAX_SCHEDULE_DAY) {
    badRequest(`dayOfMonth must be 1-${MAX_SCHEDULE_DAY} so it exists in every month`);
  }
  if (input.hour < 0 || input.hour > 23) badRequest('hour must be 0-23');
  if (input.minute < 0 || input.minute > 59) badRequest('minute must be 0-59');
  if (!DISPATCH_PERIODS.has(input.period)) {
    badRequest('period must be PREVIOUS_MONTH or CURRENT_MONTH');
  }
}

async function updatePayrollSchedule(
  _p: unknown,
  { input }: { input: PayrollScheduleInput },
  ctx: GraphQLContext,
) {
  await assertPermission(ctx, SLIP_MODULE, PAYROLL_ROLES, 'EDIT');
  assertSchedule(input);
  return PayrollScheduleModel.findOneAndUpdate({ key: 'global' }, input, {
    new: true,
    upsert: true,
  }).lean();
}

async function sendSalarySlips(
  _p: unknown,
  { month, year }: { month: number; year: number },
  ctx: GraphQLContext,
) {
  const user = await assertPermission(ctx, SLIP_MODULE, PAYROLL_ROLES, 'EDIT');
  assertMonth(month, year);
  return dispatchSalarySlips(month, year, user.email);
}

/**
 * An employee may download their own payslip; HR and Finance may download anyone's.
 * The ownership check comes first so an employee never needs a payroll role to be paid.
 */
async function salarySlipPdf(_p: unknown, { id }: { id: string }, ctx: GraphQLContext) {
  const user = assertAuthenticated(ctx);
  const slip = await SalarySlipModel.findById(id).select('employeeId').lean();
  if (!slip) {
    notFound('Salary slip');
  }
  if (slip.employeeId !== user.id) {
    await assertPermission(ctx, SLIP_MODULE, PAYROLL_ROLES, 'VIEW');
  }
  const payslip = await renderPayslip(id);
  return {
    filename: payslip.filename,
    contentType: 'application/pdf',
    contentBase64: payslip.pdf.toString('base64'),
  };
}

/** Every percentage is a percentage, every amount is money, and TDS has a mode we know. */
interface PayrollSettingsInput extends StatutorySettings {
  tdsMode: string;
  tdsRegimeKey?: string;
  financialYearStartMonth?: number;
  runFromDay?: number;
}

const MONTHS_IN_YEAR = 12;

const PERCENT_FIELDS = ['pfEmployeePercent', 'esiEmployeePercent', 'tdsFlatPercent'] as const;
const AMOUNT_FIELDS = ['pfWageCeiling', 'esiWageLimit', 'professionalTaxMonthly'] as const;
const TDS_MODE_SET = new Set<string>(TDS_MODES);

function assertPayrollSettings(input: PayrollSettingsInput) {
  for (const field of PERCENT_FIELDS) {
    const value = input[field];
    if (value < 0 || value > 100) badRequest(`${field} must be between 0 and 100`);
  }
  for (const field of AMOUNT_FIELDS) {
    if (input[field] < 0) badRequest(`${field} cannot be negative`);
  }
  if (!TDS_MODE_SET.has(input.tdsMode)) badRequest('tdsMode must be NONE, FLAT_PERCENT or SLAB');
  if (input.tdsRegimeKey !== undefined && input.tdsRegimeKey.trim() === '') {
    badRequest('tdsRegimeKey must name a regime in the tax table');
  }
  const startMonth = input.financialYearStartMonth;
  if (startMonth !== undefined && (startMonth < 1 || startMonth > MONTHS_IN_YEAR)) {
    badRequest(`financialYearStartMonth must be 1-${MONTHS_IN_YEAR}`);
  }
  const runFromDay = input.runFromDay;
  if (
    runFromDay !== undefined &&
    (!Number.isInteger(runFromDay) || runFromDay < 1 || runFromDay > MAX_SCHEDULE_DAY)
  ) {
    badRequest(`runFromDay must be a whole day 1-${MAX_SCHEDULE_DAY} so it exists in every month`);
  }
}

/**
 * Saves the statutory policy. It applies to the NEXT run: a slip already generated keeps
 * the figures it was generated with, because those are the ones that were withheld.
 */
async function updatePayrollSettings(
  _p: unknown,
  { input }: { input: PayrollSettingsInput },
  ctx: GraphQLContext,
) {
  await assertPermission(ctx, SLIP_MODULE, [ROLES.HR], 'EDIT');
  assertPayrollSettings(input);
  return PayrollSettingsModel.findOneAndUpdate({ key: 'global' }, input, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  }).lean();
}

/**
 * Statutory figures default to zero on read rather than being trusted from the document:
 * `.lean()` skips Mongoose defaults, so a slip generated before statutory deductions
 * existed comes back without them and must still read as a complete payslip.
 */
const SLIP_STATUTORY_DEFAULTS = {
  pf: (slip: { pf?: number | null }) => slip.pf ?? 0,
  esi: (slip: { esi?: number | null }) => slip.esi ?? 0,
  professionalTax: (slip: { professionalTax?: number | null }) => slip.professionalTax ?? 0,
  tds: (slip: { tds?: number | null }) => slip.tds ?? 0,
  otherDeductions: (slip: { otherDeductions?: number | null }) => slip.otherDeductions ?? 0,
};

export const payrollResolvers = {
  Query: {
    ...structureCrud.Query,
    ...regimeCrud.Query,
    ...slabCrud.Query,
    employeeSalary,
    listSalarySlipsPaged: async (
      _p: unknown,
      { input }: { input: TableQueryInput },
      ctx: GraphQLContext,
    ) => {
      await assertPermission(ctx, SLIP_MODULE, PAYROLL_ROLES, 'VIEW');
      const page = await slipService.paged(input, SLIP_TABLE);
      return { rows: withIds(page.rows as { _id: unknown }[]), totalCount: page.totalCount };
    },
    listSalarySlipsStats: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await assertPermission(ctx, SLIP_MODULE, PAYROLL_ROLES, 'VIEW');
      return slipService.stats({ countBy: ['status'], sum: ['gross', 'net'] });
    },
    payrollSummary,
    payrollRunPlan,
    payrollSchedule: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await assertPermission(ctx, SLIP_MODULE, PAYROLL_ROLES, 'VIEW');
      return readSchedule();
    },
    payrollSettings: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await assertPermission(ctx, SLIP_MODULE, PAYROLL_ROLES, 'VIEW');
      return readPayrollSettings();
    },
    salarySlipPdf,
  },
  Mutation: {
    ...refuseOwnRecordWrites(structureCrud.Mutation, 'SalaryStructure', async (id) => {
      const row = await SalaryStructureModel.findById(id).select('employeeId').lean();
      return row?.employeeId;
    }),
    ...regimeCrud.Mutation,
    ...slabCrud.Mutation,
    saveEmployeeSalary,
    runPayroll,
    markPayrollPaid,
    updatePayrollSchedule,
    sendSalarySlips,
    updatePayrollSettings,
  },
  SalarySlip: SLIP_STATUTORY_DEFAULTS,
  /** Defaulted on read for the same reason as the slip's: `.lean()` skips schema defaults. */
  PayrollSettings: {
    tdsRegimeKey: (s: { tdsRegimeKey?: string | null }) => s.tdsRegimeKey ?? DEFAULT_TDS_REGIME_KEY,
    financialYearStartMonth: (s: { financialYearStartMonth?: number | null }) =>
      s.financialYearStartMonth ?? DEFAULT_FINANCIAL_YEAR_START_MONTH,
    runFromDay: (s: { runFromDay?: number | null }) => s.runFromDay ?? DEFAULT_RUN_FROM_DAY,
  },
  /**
   * Derived so the HR list shows the same numbers the employee's own view does.
   *
   * Both go through `monthlyEarnings`, so a stipend reads as its monthly figure and an
   * hourly employee reads as zero monthly gross rather than as a salary nobody agreed to.
   */
  SalaryStructure: {
    payType: (s: PaySource) => s.payType ?? DEFAULT_PAY_TYPE,
    rate: (s: PaySource) => s.rate ?? 0,
    billingRate: (s: { billingRate?: number | null }) => s.billingRate ?? 0,
    currency: async (s: { currency?: string | null }) =>
      normalizeCurrency(s.currency) ?? (await companyProfile()).currency,
    gross: (s: PaySource) => grossOf(monthlyEarnings(s)),
    net: (s: PaySource) => {
      const parts = monthlyEarnings(s);
      return grossOf(parts) - parts.deductions;
    },
    // Defaulted on read for the same reason as the slip's: structures written before the
    // statutory fields existed come back without them and must still read as "applies".
    pfApplicable: (s: { pfApplicable?: boolean | null }) => s.pfApplicable ?? true,
    esiApplicable: (s: { esiApplicable?: boolean | null }) => s.esiApplicable ?? true,
    tdsPercent: (s: { tdsPercent?: number | null }) => s.tdsPercent ?? 0,
  },
};
export { payrollTypeDefs };
export { PayrollScheduleModel, MAX_SCHEDULE_DAY } from './payroll-schedule.model';
export { PayrollSettingsModel, readPayrollSettings } from './payroll-settings.model';
export { TaxRegimeModel, TaxSlabModel } from './tax-slab.model';
export { ensureTaxSlabs } from './tax-slab.seed';
export { startPayrollDispatch } from './payroll.schedule';
export { dispatchSalarySlips, renderPayslip } from './payroll.dispatch';
