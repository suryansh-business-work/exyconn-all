import type { FilterQuery } from 'mongoose';
import { assertRole } from '../../middleware/roleGuard';
import { forbidden } from '../../utils/errors';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';
import type { SupportTicketDocument } from '../employee/support.model';

/** Everyone who works tickets: the support desk, and IT on its own queue. */
export const DESK_ROLES = [ROLES.SUPPORT, ROLES.IT];

/** The category IT works. Tickets in any other category are the support desk's. */
export const IT_CATEGORY = 'IT';

export type TicketScope = FilterQuery<SupportTicketDocument>;

/** True when the caller sees the whole queue rather than IT's slice of it. */
function seesEverything(roles: readonly string[]): boolean {
  return roles.includes(ROLES.ADMIN) || roles.includes(ROLES.SUPPORT);
}

/**
 * Which tickets the caller's desk covers. Support (and ADMIN) work the whole queue; somebody
 * who is only IT works the IT category and nothing else — HR, payroll and customer tickets
 * are not theirs to read. One queue, one set of resolvers, narrowed per caller.
 */
export function deskScope(ctx: GraphQLContext): TicketScope {
  const user = assertRole(ctx, DESK_ROLES);
  return seesEverything(user.roles ?? []) ? {} : { category: IT_CATEGORY };
}

/** Refuses an IT-only caller moving a ticket into a category outside their desk's reach. */
export function assertCategoryInScope(scope: TicketScope, category: string): void {
  if (scope.category && scope.category !== category) {
    forbidden('IT may only work on items filed under the IT category');
  }
}
