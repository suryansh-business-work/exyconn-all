import { UserModel } from '../modules/admin/user.model';
import { unauthenticated } from '../utils/errors';
import type { GraphQLContext } from '../middleware/auth';

/**
 * The display name of whoever is making this request, read from the request's own token —
 * never from anything the client sent. Falls back to their email when the account has no
 * name, so a history row always says somebody.
 */
export async function actorNameOf(ctx: GraphQLContext): Promise<string> {
  const id = ctx.user?.id;
  if (!id) {
    unauthenticated();
  }
  const user = await UserModel.findById(id).select('name').lean();
  return user?.name ?? ctx.user?.email ?? '';
}
