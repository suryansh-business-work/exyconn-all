import { ROLES } from '../constants/roles';
import type { GraphQLContext } from '../middleware/auth';
import { assertRole } from '../middleware/roleGuard';
import { actorNameOf } from './actor';

/** Who is trying a public demo on demos.exyconn.com. */
export interface DemoCaller {
  /** `visitor:<id>` for a demo visitor, `user:<id>` for an employee showing it to a client. */
  key: string;
  name: string;
  email: string;
  company: string;
}

/**
 * The demo's caller: a demo visitor signed in with an emailed code (the pass in
 * x-demo-visitor), or any signed-in employee walking a client through it. Anyone else is
 * refused, exactly as the other demos refuse them.
 */
export async function demoCallerOf(ctx: GraphQLContext): Promise<DemoCaller> {
  const visitor = ctx.demoVisitor;
  if (visitor && !ctx.user) {
    return {
      key: `visitor:${visitor.id}`,
      name: visitor.name,
      email: visitor.email,
      company: visitor.company,
    };
  }
  const user = assertRole(ctx, [ROLES.EMPLOYEE]);
  return { key: `user:${user.id}`, name: await actorNameOf(ctx), email: user.email, company: '' };
}
