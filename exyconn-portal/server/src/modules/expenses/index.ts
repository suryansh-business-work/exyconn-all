import { ExpenseClaimModel } from './expense.model';
import { expensesTypeDefs } from './expenses.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { createMyRecordsResolver } from '../../lib/employeeScope';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { assertNotOwnRecord, refuseOwnRecordWrites } from '../../lib/permissions';
import { withId } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import { notify, notifyBestEffort } from '../notifications';
import { setExpenseClaimStatus } from './expense-status';
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

const generated = createCrudResolvers(expensesService, {
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

/** The stored claimant, so an edit cannot dodge the self-approval check with another id. */
async function claimantOf(id: string): Promise<string | undefined> {
  const row = await ExpenseClaimModel.findById(id).select('employeeId').lean();
  return row?.employeeId;
}

/** Finance's console edits anybody's claim but their own — its input carries the status. */
const crud = {
  ...generated,
  Mutation: refuseOwnRecordWrites(generated.Mutation, 'ExpenseClaim', claimantOf),
};

/** Finance's decision, never on the approver's own claim. */
const decideExpenseClaim = async (
  p: unknown,
  args: Parameters<typeof setExpenseClaimStatus>[1],
  ctx: GraphQLContext,
) => {
  if (ctx.user) {
    assertNotOwnRecord(ctx, await claimantOf(args.id), 'approve an expense claim');
  }
  return setExpenseClaimStatus(p, args, ctx);
};

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

/** Finance's edit wraps the generated update so a decision reaches the claimant. */
const updateExpenseClaim = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { id, input } = args as unknown as { id: string; input: ExpenseClaimInput };
  const before = await ExpenseClaimModel.findById(id).select('status').lean();
  const updated = await crud.Mutation.updateExpenseClaim(p, args, ctx);
  if (before && before.status !== input.status) {
    const outcome = input.status.toLowerCase();
    const cleared = input.approvedAmount ?? input.amount;
    await notifyBestEffort(input.employeeId, {
      kind: 'REQUEST',
      title: `Expense claim ${outcome}: ${input.category}`,
      body: `${input.currency} ${cleared} — your claim was ${outcome}.`,
      link: '/me/expenses',
    });
  }
  return updated;
};

export const expensesResolvers = {
  Query: {
    ...crud.Query,
    myExpenseClaims: createMyRecordsResolver(ExpenseClaimModel as never, { incurredOn: -1 }),
  },
  Mutation: {
    ...crud.Mutation,
    createMyExpenseClaim,
    updateExpenseClaim,
    setExpenseClaimStatus: decideExpenseClaim,
  },
};
export { expensesTypeDefs };
