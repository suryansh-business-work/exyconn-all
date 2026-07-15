import type { Request } from 'express';
import { verifyToken, type TokenPayload } from '../utils/jwt';
import { UserModel } from '../modules/admin/user.model';
import type { Role } from '../constants/roles';

export interface GraphQLContext {
  user: TokenPayload | null;
}

/**
 * Builds the per-request GraphQL context by decoding the Bearer token and then
 * refreshing the caller's roles from the database.
 *
 * Authorization (`assertRole`) reads `ctx.user.roles`, but those are baked into a 7-day
 * JWT at login. Without this refresh, a role change persists to Mongo yet does not take
 * effect until the user signs in again — the "roles aren't being assigned" symptom. Re-
 * reading the roles from the source of truth on every request makes changes apply at once,
 * and a token whose user has since been deleted is rejected outright.
 */
export async function buildContext({ req }: { req: Request }): Promise<GraphQLContext> {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const decoded = token ? verifyToken(token) : null;
  if (!decoded) {
    return { user: null };
  }

  const fresh = await UserModel.findById(decoded.id).select('roles').lean();
  if (!fresh) {
    return { user: null };
  }

  return { user: { ...decoded, roles: fresh.roles as Role[] } };
}
