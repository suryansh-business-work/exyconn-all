import type { Request } from 'express';
import { verifyToken, type TokenPayload } from '../utils/jwt';
import { UserModel } from '../modules/admin/user.model';
import type { Role } from '../constants/roles';

export interface GraphQLContext {
  user: TokenPayload | null;
  /**
   * Caller's address, used only to rate-limit the unauthenticated status-page mutation.
   * Optional because a resolver can also be called directly (tests, internal jobs).
   */
  ip?: string;
}

/**
 * Builds the per-request GraphQL context by decoding the Bearer token and then
 * revalidating the caller against the database.
 *
 * Authorization (`assertRole`) reads `ctx.user`, but its roles/identity are baked into a
 * 7-day JWT at login. Without this refresh, a change persists to Mongo yet does not take
 * effect until the user signs in again. Re-reading from the source of truth on every request
 * makes it apply at once: role changes take effect immediately, and a token whose user has
 * been deleted, deactivated, or blocked is rejected on its very next request rather than
 * lingering until the token expires.
 */
export async function buildContext({ req }: { req: Request }): Promise<GraphQLContext> {
  const ip = req.ip ?? 'unknown';
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const decoded = token ? verifyToken(token) : null;
  if (!decoded) {
    return { user: null, ip };
  }

  const fresh = await UserModel.findById(decoded.id).select('roles isActive isBlocked').lean();
  if (!fresh || !fresh.isActive || fresh.isBlocked) {
    return { user: null, ip };
  }

  return { user: { ...decoded, roles: fresh.roles as Role[] }, ip };
}
