import { SalaryStructureModel } from '../employee/salary.model';
import { SalarySlipModel } from '../employee/salarySlip.model';
import { UserModel } from '../admin/user.model';
import { LeaveRequestModel } from '../hr/hr.model';
import { payrollTypeDefs } from './payroll.typeDefs';
import { computeSlip, grossOf, unpaidLeaveDays, type LeaveSpan } from './payroll.compute';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertRole } from '../../middleware/roleGuard';
import { badRequest } from '../../utils/errors';
import { withIds } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import { notify } from '../notifications';
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
  },
  Mutation: { ...structureCrud.Mutation, runPayroll, markPayrollPaid },
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
