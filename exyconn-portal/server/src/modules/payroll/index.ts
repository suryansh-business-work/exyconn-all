import { SalaryStructureModel } from '../employee/salary.model';
import { SalarySlipModel } from '../employee/salarySlip.model';
import { UserModel } from '../admin/user.model';
import { LeaveRequestModel } from '../hr/hr.model';
import { payrollTypeDefs } from './payroll.typeDefs';
import {
  computeMonthlySlip,
  financialYearOf,
  grossOf,
  monthlyEarnings,
  payableMonthsInFinancialYear,
  unpaidLeaveDays,
  type LeaveSpan,
  type PaySource,
  type SlabTaxInput,
  type StatutorySettings,
  type TaxRegimeFigures,
  type TaxSlabRow,
} from './payroll.compute';
import { DEFAULT_CURRENCY, DEFAULT_PAY_TYPE, type PayType } from '../../constants/pay';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertPermission } from '../../lib/permissions';
import { assertAuthenticated, assertRole } from '../../middleware/roleGuard';
import { badRequest, notFound } from '../../utils/errors';
import { withId, withIds } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import { notify } from '../notifications';
import { PayrollScheduleModel, MAX_SCHEDULE_DAY } from './payroll-schedule.model';
import {
  DEFAULT_FINANCIAL_YEAR_START_MONTH,
  DEFAULT_TDS_REGIME_KEY,
  PayrollSettingsModel,
  readPayrollSettings,
  TDS_MODES,
} from './payroll-settings.model';
import { TaxRegimeModel, TaxSlabModel } from './tax-slab.model';
import { ensurePayslipDocument } from '../documents';
import { periodLabel } from './payslip.pdf';
import { readSchedule } from './payroll.schedule';
import { dispatchSalarySlips, renderPayslip } from './payroll.dispatch';
import type { GraphQLContext } from '../../middleware/auth';
import type { TableQueryInput } from '../../utils/tableQuery';

const PAYROLL_ROLES = [ROLES.HR, ROLES.FINANCE];

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
  assertRole(ctx, PAYROLL_ROLES);
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
  assertRole(ctx, PAYROLL_ROLES);
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

/** One employee's approved unpaid leave, as plain date spans. */
async function unpaidLeaveFor(employeeId: string): Promise<LeaveSpan[]> {
  const rows = await LeaveRequestModel.find({
    employeeId,
    type: 'UNPAID',
    status: 'APPROVED',
  }).lean();
  return rows.map((r) => ({
    fromDate: new Date(r.fromDate),
    toDate: new Date(r.toDate),
    type: r.type,
    status: r.status,
  }));
}

/**
 * The tax-table half of the payroll settings.
 *
 * Both fields are optional here because `.lean()` skips Mongoose defaults: a settings
 * document saved before the tax table existed comes back without them.
 */
interface PayrollTaxSettings {
  tdsMode: string;
  tdsRegimeKey?: string | null;
  financialYearStartMonth?: number | null;
}

/** The month the financial year opens in, as stored or as the schema would have defaulted it. */
function startMonthOf(settings: PayrollTaxSettings): number {
  return settings.financialYearStartMonth ?? DEFAULT_FINANCIAL_YEAR_START_MONTH;
}

/** The stored figures of one slip, whichever way the run arrived at them. */
type SlipFigures = ReturnType<typeof computeMonthlySlip>;

/** The amount columns a slip carries, so a create and a recompute write the same set. */
function slipFields(amounts: SlipFigures, currency: string) {
  return {
    currency,
    gross: amounts.gross,
    deductions: amounts.deductions,
    pf: amounts.pf,
    esi: amounts.esi,
    professionalTax: amounts.professionalTax,
    tds: amounts.tds,
    otherDeductions: amounts.otherDeductions,
    net: amounts.net,
  };
}

/** A slip's own document title, as the employee will find it under My Documents. */
function payslipTitle(month: number, year: number): string {
  return `Payslip ${periodLabel(month, year)}`;
}

/** What ONE employee's slip is worked out from, gathered before any arithmetic happens. */
async function slipFor(
  employeeId: string,
  structure: {
    payType?: string | null;
    rate?: number | null;
    basic: number;
    hra: number;
    allowances: number;
    deductions: number;
    pfApplicable?: boolean | null;
    esiApplicable?: boolean | null;
    tdsPercent?: number | null;
  },
  month: number,
  year: number,
  settings: StatutorySettings,
  slabTax: SlabTaxInput,
): Promise<SlipFigures> {
  const unpaidDays = unpaidLeaveDays(await unpaidLeaveFor(employeeId), year, month);
  return computeMonthlySlip(
    monthlyEarnings(structure),
    year,
    month,
    unpaidDays,
    settings,
    {
      pfApplicable: structure.pfApplicable,
      esiApplicable: structure.esiApplicable,
      tdsPercent: structure.tdsPercent,
    },
    slabTax,
  );
}

/** The regime and bands SLAB mode applies, read once for the whole run. */
interface TaxTable {
  regime: TaxRegimeFigures | null;
  slabs: TaxSlabRow[];
}

/**
 * The tax table for the financial year this period falls in.
 *
 * Read once per run rather than once per employee, and only in SLAB mode: the other modes
 * never look at it, so a portal that has not entered one is not asked for it.
 */
async function taxTableFor(
  settings: PayrollTaxSettings,
  month: number,
  year: number,
): Promise<TaxTable> {
  if (settings.tdsMode !== 'SLAB') {
    return { regime: null, slabs: [] };
  }
  const regimeKey = settings.tdsRegimeKey ?? DEFAULT_TDS_REGIME_KEY;
  const financialYear = financialYearOf(year, month, startMonthOf(settings));
  const [regime, slabs] = await Promise.all([
    TaxRegimeModel.findOne({ regimeKey, financialYear }).lean(),
    TaxSlabModel.find({ regimeKey, financialYear }).lean(),
  ]);
  return { regime, slabs };
}

async function runPayroll(
  _p: unknown,
  { month, year }: { month: number; year: number },
  ctx: GraphQLContext,
) {
  assertRole(ctx, PAYROLL_ROLES);
  assertMonth(month, year);
  const settings = await readPayrollSettings();
  const taxTable = await taxTableFor(settings, month, year);
  const startMonth = startMonthOf(settings);
  const users = await UserModel.find({ isActive: true }).select('_id name joinDate').lean();
  const structures = await SalaryStructureModel.find({
    employeeId: { $in: users.map((u) => String(u._id)) },
  }).lean();
  const byEmployee = new Map(structures.map((s) => [s.employeeId, s]));

  let generated = 0;
  let updated = 0;
  let skipped = 0;
  let totalNet = 0;

  for (const user of users) {
    const employeeId = String(user._id);
    const structure = byEmployee.get(employeeId);
    if (!structure) {
      skipped += 1;
      continue;
    }
    const existing = await SalarySlipModel.findOne({ employeeId, month, year });
    if (existing?.status === 'PAID') {
      skipped += 1;
      continue;
    }
    // Worked out per employee, not per run: a mid-year joiner is taxed on the months they
    // will actually be paid in this financial year, not on a full year they will not earn.
    const amounts = await slipFor(employeeId, structure, month, year, settings, {
      ...taxTable,
      payableMonths: payableMonthsInFinancialYear(user.joinDate, year, month, startMonth),
    });
    totalNet += amounts.net;

    let slipId: string;
    let issuedDate: Date;
    if (existing) {
      existing.set(slipFields(amounts, structure.currency));
      await existing.save();
      slipId = String(existing._id);
      issuedDate = existing.issuedDate;
      updated += 1;
    } else {
      issuedDate = new Date();
      const created = await SalarySlipModel.create({
        employeeId,
        month,
        year,
        ...slipFields(amounts, structure.currency),
        status: 'GENERATED',
        issuedDate,
      });
      slipId = String(created._id);
      generated += 1;
      await notify(employeeId, {
        kind: 'PAYROLL',
        title: `Salary slip for ${month}/${year} is ready`,
        link: '/me/salary-slips',
      });
    }
    // Filed against the payslip's own id, so re-running a month never gives an employee a
    // second copy of the same payslip in My Documents.
    await ensurePayslipDocument(employeeId, slipId, payslipTitle(month, year), issuedDate);
  }
  return { month, year, generated, updated, skipped, totalNet };
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
  assertRole(ctx, PAYROLL_ROLES);
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
  assertRole(ctx, PAYROLL_ROLES);
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
  const user = assertRole(ctx, PAYROLL_ROLES);
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
    assertRole(ctx, PAYROLL_ROLES);
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
  assertRole(ctx, [ROLES.HR]);
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
      assertRole(ctx, PAYROLL_ROLES);
      const page = await slipService.paged(input, SLIP_TABLE);
      return { rows: withIds(page.rows as { _id: unknown }[]), totalCount: page.totalCount };
    },
    listSalarySlipsStats: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, PAYROLL_ROLES);
      return slipService.stats({ countBy: ['status'], sum: ['gross', 'net'] });
    },
    payrollSummary,
    payrollSchedule: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, PAYROLL_ROLES);
      return readSchedule();
    },
    payrollSettings: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, PAYROLL_ROLES);
      return readPayrollSettings();
    },
    salarySlipPdf,
  },
  Mutation: {
    ...structureCrud.Mutation,
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
    currency: (s: { currency?: string | null }) => s.currency ?? DEFAULT_CURRENCY,
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
