import type { GraphQLContext } from './auth';
import { ROLES, type Role } from '../constants/roles';
import { unauthenticated, forbidden } from '../utils/errors';
import type { TokenPayload } from '../utils/jwt';

/**
 * Asserts the request is authenticated and the user holds one of the allowed
 * roles. ADMIN is a superuser and passes every guard. Returns the user.
 */
export function assertRole(ctx: GraphQLContext, allowed: Role[]): TokenPayload {
  if (!ctx.user) {
    unauthenticated();
  }
  const userRoles = ctx.user.roles ?? [];
  const isAdmin = userRoles.includes(ROLES.ADMIN);
  const intersects = userRoles.some((role) => allowed.includes(role));
  if (isAdmin || intersects) {
    return ctx.user;
  }
  forbidden();
}

/**
 * Asserts the caller administers the PLATFORM, not a company: creating organizations,
 * appointing their administrators, suspending them. A company's own ADMIN never passes —
 * that role is the top of one company, and this is the console above all of them.
 */
export function assertPlatformAdmin(ctx: GraphQLContext): TokenPayload {
  if (!ctx.user) {
    unauthenticated();
  }
  if (!(ctx.user.roles ?? []).includes(ROLES.SUPER_ADMIN)) {
    forbidden();
  }
  return ctx.user;
}

/** Asserts the request is authenticated (any role). Returns the user. */
export function assertAuthenticated(ctx: GraphQLContext): TokenPayload {
  if (!ctx.user) {
    unauthenticated();
  }
  return ctx.user;
}
