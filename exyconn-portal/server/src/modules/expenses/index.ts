import { ExpenseClaimModel } from './expense.model';
import { expensesTypeDefs } from './expenses.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { createMyRecordsResolver } from '../../lib/employeeScope';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { withId } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import { notify } from '../notifications';
import type { GraphQLContext } from '../../middleware/auth';

interface ExpenseClaimInput {
  employeeId: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  incurredOn: Date;
  receiptUrl?: string | null;
  status: string;
  approvedAmount?: number | null;
}

export const expensesService = createCrudService<ExpenseClaimInput>(
  ExpenseClaimModel as never,
  'ExpenseClaim',
);

const crud = createCrudResolvers(expensesService, {
  name: 'ExpenseClaim',
  roles: [ROLES.FINANCE],
  table: {
    searchFields: ['category', 'description'],
    filterFields: ['employeeId', 'category', 'status'],
    sortFields: ['category', 'amount', 'status', 'incurredOn', 'createdAt'],
    defaultSort: { field: 'incurredOn', dir: 'DESC' },
  },
  stats: { countBy: ['status'], sum: ['amount'] },
});

type MyClaim = Omit<ExpenseClaimInput, 'employeeId' | 'status' | 'approvedAmount'>;

/** An employee filing their own claim: never their own status or approved amount. */
async function createMyExpenseClaim(
  _p: unknown,
  { input }: { input: MyClaim },
  ctx: GraphQLContext,
) {
  const user = assertAuthenticated(ctx);
  const created = await ExpenseClaimModel.create({
    ...input,
    employeeId: user.id,
    status: 'SUBMITTED',
  });
  await notify(user.id, {
    kind: 'REQUEST',
    title: `Expense claim submitted: ${input.category}`,
    body: 'Finance will review it and you will be notified of the outcome.',
    link: '/me/expenses',
  });
  return withId(created.toObject() as { _id: unknown });
}

export const expensesResolvers = {
  Query: {
    ...crud.Query,
    myExpenseClaims: createMyRecordsResolver(ExpenseClaimModel as never, { incurredOn: -1 }),
  },
  Mutation: { ...crud.Mutation, createMyExpenseClaim },
};
export { expensesTypeDefs };
