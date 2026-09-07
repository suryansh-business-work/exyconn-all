import { ExpenseClaimModel } from './expense.model';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { withId } from '../../utils/serialize';
import { badRequest, notFound } from '../../utils/errors';
import { notifyBestEffort } from '../notifications/notifications.service';
import type { GraphQLContext } from '../../middleware/auth';

const financeRoles = [ROLES.FINANCE];

type Decision = 'APPROVED' | 'REJECTED' | 'PAID';

interface StatusArgs {
  id: string;
  status: Decision | 'SUBMITTED';
  approvedAmount?: number | null;
}

/** What the employee reads when the decision lands. */
const OUTCOME_TITLES: Record<Decision, string> = {
  APPROVED: 'Expense claim approved',
  REJECTED: 'Expense claim rejected',
  PAID: 'Expense claim paid',
};

/**
 * Finance's decision on a claim, in one step.
 *
 * The approved amount is written only here and only on approval, so what was cleared is
 * never confused with what was asked. `paidOn` is written only on PAID, because it is the
 * date the reimbursement enters the cash figures — a claim that quietly reused its incurred
 * date would put the money in the wrong month and make cash flow disagree with the bank.
 */
export async function setExpenseClaimStatus(
  _p: unknown,
  { id, status, approvedAmount }: StatusArgs,
  ctx: GraphQLContext,
) {
  assertRole(ctx, financeRoles);
  if (status === 'SUBMITTED') {
    badRequest('A claim cannot be sent back to submitted. Reject it, or approve it again.');
  }

  const claim = await ExpenseClaimModel.findById(id);
  if (!claim) {
    notFound('Expense claim');
  }

  if (status === 'APPROVED') {
    const cleared = approvedAmount ?? claim.amount;
    if (cleared < 0 || cleared > claim.amount) {
      badRequest(`The approved amount must be between 0 and the ${claim.amount} claimed.`);
    }
    claim.approvedAmount = cleared;
  }
  if (status === 'PAID') {
    claim.approvedAmount ??= claim.amount;
    claim.paidOn = new Date();
  }
  claim.status = status;
  await claim.save();

  // Best-effort: a notification store hiccup must not undo a decision that is already made.
  await notifyBestEffort(claim.employeeId, {
    kind: 'REQUEST',
    title: `${OUTCOME_TITLES[status]}: ${claim.category}`,
    body: `${claim.currency} ${claim.approvedAmount ?? claim.amount} — ${claim.description}`,
    link: '/me/expenses',
  });

  return withId(claim.toObject());
}
