import { isValidObjectId, type FilterQuery } from 'mongoose';
import { assertRole } from '../../middleware/roleGuard';
import { forbidden } from '../../utils/errors';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';
import { IT_POLICY_CATEGORIES, PolicyModel, type PolicyDocument } from './policy.model';

/** Who maintains policies: Legal owns them all; IT owns its own categories. */
export const POLICY_ROLES = [ROLES.LEGAL, ROLES.IT];

const IT_CATEGORIES: ReadonlySet<string> = new Set(IT_POLICY_CATEGORIES);

export type PolicyScope = FilterQuery<PolicyDocument>;

/**
 * The policies the caller may maintain. Legal (and ADMIN) see the whole register; somebody
 * who is only IT sees the IT and SECURITY ones — never an HR-only draft.
 */
export function policyScope(ctx: GraphQLContext): PolicyScope {
  const roles = assertRole(ctx, POLICY_ROLES).roles ?? [];
  const everything = roles.includes(ROLES.ADMIN) || roles.includes(ROLES.LEGAL);
  return everything ? {} : { category: { $in: [...IT_POLICY_CATEGORIES] } };
}

/** Refuses an IT-only caller writing a policy outside IT's categories. */
export function assertPolicyCategory(scope: PolicyScope, category: string | null | undefined) {
  if (scope.category && !IT_CATEGORIES.has(category ?? '')) {
    forbidden('IT may only maintain IT and security policies');
  }
}

/** Refuses an IT-only caller touching an existing policy outside IT's categories. */
export async function assertPolicyInScope(scope: PolicyScope, id: string) {
  if (!scope.category) {
    return;
  }
  const row = isValidObjectId(id) ? await PolicyModel.findById(id).select('category').lean() : null;
  assertPolicyCategory(scope, row?.category);
}
