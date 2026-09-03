import { CompanyExpenseModel } from './company-expense.model';
import { companyFinance } from './finance.summary';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { withId } from '../../utils/serialize';
import { badRequest, notFound } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';

const financeRoles = [ROLES.FINANCE];

interface CompanyExpenseInput {
  vendor: string;
  category: string;
  description?: string;
  amount: number;
  currency: string;
  incurredOn: Date;
  dueDate: Date;
  reference?: string;
}

export const companyExpensesService = createCrudService<CompanyExpenseInput>(
  CompanyExpenseModel as never,
  'CompanyExpense',
);

const expenses = createCrudResolvers(companyExpensesService, {
  name: 'CompanyExpense',
  roles: financeRoles,
  table: {
    searchFields: ['vendor', 'description', 'reference'],
    filterFields: ['vendor', 'category', 'status', 'currency'],
    sortFields: ['vendor', 'category', 'amount', 'incurredOn', 'dueDate', 'status', 'createdAt'],
    defaultSort: { field: 'incurredOn', dir: 'DESC' },
  },
  stats: { countBy: ['category', 'status'], sum: ['amount'] },
});

/**
 * Settles a bill.
 *
 * `paidOn` is a separate date from `incurredOn` and is written only here, because it is the
 * date every cash figure is built from — a bill that quietly reused its incurred date would
 * put the money in the wrong month and make cash flow disagree with the bank.
 */
async function markExpensePaid(
  _p: unknown,
  { id, paidOn }: { id: string; paidOn?: Date },
  ctx: GraphQLContext,
) {
  const actor = assertRole(ctx, financeRoles);

  const expense = await CompanyExpenseModel.findById(id);
  if (!expense) {
    notFound('Expense');
  }
  if (expense.status === 'PAID') {
    badRequest(`${expense.vendor} was already settled on this bill.`);
  }

  expense.status = 'PAID';
  expense.paidOn = paidOn ?? new Date();
  expense.recordedBy = ctx.user?.email ?? actor.id;
  await expense.save();

  return withId(expense.toObject());
}

export const financeCompanyResolvers = {
  Query: {
    ...expenses.Query,
    companyFinance: async (
      _p: unknown,
      { from, to }: { from: Date; to: Date },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, financeRoles);
      if (from > to) {
        badRequest('The start of the period must not be after its end.');
      }
      return companyFinance({ from, to });
    },
  },
  Mutation: {
    ...expenses.Mutation,
    markExpensePaid,
  },
};

export { financeCompanyTypeDefs } from './finance.company.typeDefs';
