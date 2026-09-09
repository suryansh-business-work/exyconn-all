import type { Request } from 'express';
import { verifyToken, type TokenPayload } from '../utils/jwt';
import { UserModel } from '../modules/admin/user.model';
import type { Role } from '../constants/roles';
import { principalForApiKey } from '../modules/integrations/api-key.service';

export interface GraphQLContext {
  user: TokenPayload | null;
  /**
   * Caller's address, used only to rate-limit the unauthenticated status-page mutation.
   * Optional because a resolver can also be called directly (tests, internal jobs).
   */
  ip?: string;
  /**
   * The `Origin` header, so a password reset link can point back at the portal that asked
   * for it. Caller-supplied: check it against the CORS list before trusting it.
   */
  origin?: string;
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
  const origin = req.headers.origin;
  const header = req.headers.authorization ?? '';

  // A machine presents a key instead of a session. It resolves to the SAME shape a person
  // does, carrying portal roles, so every assertRole and permission check downstream applies
  // to an integration exactly as it does to a human — one authorisation model, not two.
  const apiKey = req.headers['x-api-key'];
  if (typeof apiKey === 'string' && apiKey !== '') {
    const principal = await principalForApiKey(apiKey);
    if (!principal) {
      return { user: null, ip, origin };
    }
    return {
      user: {
        id: principal.id,
        email: `${principal.name} (API key)`,
        roles: principal.roles,
      } as TokenPayload,
      ip,
      origin,
    };
  }

  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const decoded = token ? verifyToken(token) : null;
  if (!decoded) {
    return { user: null, ip, origin };
  }

  const fresh = await UserModel.findById(decoded.id).select('roles isActive isBlocked').lean();
  if (!fresh || !fresh.isActive || fresh.isBlocked) {
    return { user: null, ip, origin };
  }

  return { user: { ...decoded, roles: fresh.roles as Role[] }, ip, origin };
}
