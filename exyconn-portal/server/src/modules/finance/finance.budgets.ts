import { CostCenterModel } from './cost-center.model';
import { BudgetModel } from './budget.model';
import { CompanyExpenseModel } from './company-expense.model';
import { monthsBetween } from './finance.summary';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { badRequest } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';

const financeRoles = [ROLES.FINANCE];

/** Money to two places — see the note on round2 in finance.billing.ts. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

interface CostCenterInput {
  code: string;
  name: string;
  description?: string;
  ownerId?: string;
  isActive: boolean;
}

interface BudgetInput {
  costCenterId: string;
  month: string;
  amount: number;
  currency: string;
  note?: string;
}

export const costCentersService = createCrudService<CostCenterInput>(
  CostCenterModel as never,
  'CostCenter',
);

const costCenters = createCrudResolvers(costCentersService, {
  name: 'CostCenter',
  roles: financeRoles,
  table: {
    searchFields: ['code', 'name', 'description'],
    filterFields: ['code', 'name', 'isActive'],
    sortFields: ['code', 'name', 'isActive', 'createdAt'],
    defaultSort: { field: 'code', dir: 'ASC' },
  },
  stats: { countBy: ['isActive'] },
});

export const budgetsService = createCrudService<BudgetInput>(BudgetModel as never, 'Budget');

const budgets = createCrudResolvers(budgetsService, {
  name: 'Budget',
  roles: financeRoles,
  table: {
    searchFields: ['month', 'note'],
    filterFields: ['costCenterId', 'month', 'currency'],
    sortFields: ['month', 'amount', 'createdAt'],
    defaultSort: { field: 'month', dir: 'DESC' },
  },
  stats: { countBy: ['month'], sum: ['amount'] },
});

/** The id the report files untagged spend under. Not a cost centre — deliberately not one. */
const UNALLOCATED = '';

interface VarianceRow {
  costCenterId: string;
  code: string;
  name: string;
  budgeted: number;
  actual: number;
  variance: number;
  /** Actual as a percentage of budget. Null when there is no budget to be a percentage of. */
  utilisation: number | null;
}

/** Spend per cost centre in the window, including whatever is tagged to none. */
async function actualsByCentre(from: Date, to: Date): Promise<Map<string, number>> {
  const rows = await CompanyExpenseModel.aggregate<{ _id: string | null; total: number }>([
    { $match: { incurredOn: { $gte: from, $lte: to } } },
    { $group: { _id: '$costCenterId', total: { $sum: '$amount' } } },
  ]);
  return new Map(rows.map((row) => [row._id ?? UNALLOCATED, row.total]));
}

/** Budgeted per cost centre across every month the window touches. */
async function budgetsByCentre(from: Date, to: Date): Promise<Map<string, number>> {
  const rows = await BudgetModel.aggregate<{ _id: string; total: number }>([
    { $match: { month: { $in: monthsBetween(from, to) } } },
    { $group: { _id: '$costCenterId', total: { $sum: '$amount' } } },
  ]);
  return new Map(rows.map((row) => [row._id, row.total]));
}

/** A percentage only where a budget exists; zero budget with real spend is not "infinite". */
function utilisationOf(budgeted: number, actual: number): number | null {
  if (budgeted <= 0) return null;
  return round2((actual / budgeted) * 100);
}

function rowFor(
  costCenterId: string,
  code: string,
  name: string,
  budgeted: number,
  actual: number,
): VarianceRow {
  return {
    costCenterId,
    code,
    name,
    budgeted: round2(budgeted),
    actual: round2(actual),
    // Positive is money left; negative is an overspend. Budget minus actual, never the reverse.
    variance: round2(budgeted - actual),
    utilisation: utilisationOf(budgeted, actual),
  };
}

/**
 * Budget against actual, per cost centre, over a window.
 *
 * "Actual" here is **company bills** booked to the centre — not payroll, not reimbursed
 * employee claims. Those are real cost and the finance summary counts them, but neither
 * carries a cost centre, and quietly folding them into one would make a centre look
 * overspent on money it never chose to spend.
 *
 * Untagged spend gets its own row rather than being dropped. A variance report whose
 * actuals do not add up to what the company actually spent is worse than no report: it is
 * a reconciliation nobody can close.
 */
export async function budgetVsActual(from: Date, to: Date): Promise<VarianceRow[]> {
  const [centres, actuals, budgeted] = await Promise.all([
    CostCenterModel.find().sort({ code: 1 }).lean(),
    actualsByCentre(from, to),
    budgetsByCentre(from, to),
  ]);

  const rows = centres
    .map((centre) => {
      const id = String(centre._id);
      return rowFor(id, centre.code, centre.name, budgeted.get(id) ?? 0, actuals.get(id) ?? 0);
    })
    // A retired centre with no money either way is noise; one with either still has to answer.
    .filter((row) => row.budgeted > 0 || row.actual > 0);

  const untagged = actuals.get(UNALLOCATED) ?? 0;
  if (untagged > 0) {
    rows.push(rowFor(UNALLOCATED, '—', 'Unallocated', 0, untagged));
  }
  return rows;
}

export const financeBudgetResolvers = {
  /** Written before the field existed, a `.lean()` row comes back without it. */
  CompanyExpense: {
    costCenterId: (expense: { costCenterId?: string | null }) => expense.costCenterId ?? '',
  },
  CostCenter: {
    ownerId: (centre: { ownerId?: string | null }) => centre.ownerId ?? '',
    description: (centre: { description?: string | null }) => centre.description ?? '',
  },
  Query: {
    ...costCenters.Query,
    ...budgets.Query,
    budgetVsActual: (_p: unknown, { from, to }: { from: Date; to: Date }, ctx: GraphQLContext) => {
      assertRole(ctx, financeRoles);
      if (from > to) {
        badRequest('The start of the period must not be after its end.');
      }
      return budgetVsActual(from, to);
    },
  },
  Mutation: { ...costCenters.Mutation, ...budgets.Mutation },
};
