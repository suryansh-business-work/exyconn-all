import { SalaryStructureModel } from '../employee/salary.model';
import { SalarySlipModel } from '../employee/salarySlip.model';
import { UserModel } from '../admin/user.model';
import { LeaveRequestModel } from '../hr/hr.model';
import { payrollTypeDefs } from './payroll.typeDefs';
import { computeSlip, grossOf, unpaidLeaveDays, type LeaveSpan } from './payroll.compute';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertAuthenticated, assertRole } from '../../middleware/roleGuard';
import { badRequest, notFound } from '../../utils/errors';
import { withIds } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import { notify } from '../notifications';
import { PayrollScheduleModel, MAX_SCHEDULE_DAY } from './payroll-schedule.model';
import { readSchedule } from './payroll.schedule';
import { dispatchSalarySlips, renderPayslip } from './payroll.dispatch';
import type { GraphQLContext } from '../../middleware/auth';
import type { TableQueryInput } from '../../utils/tableQuery';

const PAYROLL_ROLES = [ROLES.HR, ROLES.FINANCE];

interface SalaryStructureInput {
  employeeId: string;
  currency: string;
  basic: number;
  hra: number;
  allowances: number;
  deductions: number;
  effectiveFrom: Date;
}

const structureCrud = createCrudResolvers(
  createCrudService<SalaryStructureInput>(SalaryStructureModel as never, 'SalaryStructure'),
  {
    name: 'SalaryStructure',
    roles: PAYROLL_ROLES,
    table: {
      searchFields: ['employeeId', 'currency'],
      filterFields: ['employeeId', 'currency'],
      sortFields: ['basic', 'effectiveFrom', 'createdAt'],
      defaultSort: { field: 'effectiveFrom', dir: 'DESC' },
    },
    stats: { countBy: ['currency'], sum: ['basic', 'hra', 'allowances', 'deductions'] },
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

async function runPayroll(
  _p: unknown,
  { month, year }: { month: number; year: number },
  ctx: GraphQLContext,
) {
  assertRole(ctx, PAYROLL_ROLES);
  assertMonth(month, year);
  const users = await UserModel.find({ isActive: true }).select('_id name').lean();
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
    const unpaidDays = unpaidLeaveDays(await unpaidLeaveFor(employeeId), year, month);
    const amounts = computeSlip(structure, year, month, unpaidDays);
    totalNet += amounts.net;

    if (existing) {
      existing.gross = amounts.gross;
      existing.deductions = amounts.deductions;
      existing.net = amounts.net;
      existing.currency = structure.currency;
      await existing.save();
      updated += 1;
    } else {
      await SalarySlipModel.create({
        employeeId,
        month,
        year,
        currency: structure.currency,
        gross: amounts.gross,
        deductions: amounts.deductions,
        net: amounts.net,
        status: 'GENERATED',
        issuedDate: new Date(),
      });
      generated += 1;
      await notify(employeeId, {
        kind: 'PAYROLL',
        title: `Salary slip for ${month}/${year} is ready`,
        link: '/me/salary-slips',
      });
    }
  }
  return { month, year, generated, updated, skipped, totalNet };
}

async function markPayrollPaid(
  _p: unknown,
  { month, year }: { month: number; year: number },
  ctx: GraphQLContext,
) {
  assertRole(ctx, PAYROLL_ROLES);
  assertMonth(month, year);
  const res = await SalarySlipModel.updateMany(
    { month, year, status: 'GENERATED' },
    { status: 'PAID' },
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

export const payrollResolvers = {
  Query: {
    ...structureCrud.Query,
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
    salarySlipPdf,
  },
  Mutation: {
    ...structureCrud.Mutation,
    runPayroll,
    markPayrollPaid,
    updatePayrollSchedule,
    sendSalarySlips,
  },
  /** Derived so the HR list shows the same numbers the employee's own view does. */
  SalaryStructure: {
    gross: (s: { basic: number; hra: number; allowances: number; gross?: number }) =>
      s.gross ?? grossOf(s),
    net: (s: {
      basic: number;
      hra: number;
      allowances: number;
      deductions: number;
      net?: number;
    }) => s.net ?? grossOf(s) - s.deductions,
  },
};
export { payrollTypeDefs };
export { PayrollScheduleModel, MAX_SCHEDULE_DAY } from './payroll-schedule.model';
export { startPayrollDispatch } from './payroll.schedule';
export { dispatchSalarySlips, renderPayslip } from './payroll.dispatch';
