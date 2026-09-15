import type { GraphQLContext } from './auth';
import { ROLES, type Role } from '../constants/roles';
import { unauthenticated, forbidden } from '../utils/errors';
import type { TokenPayload } from '../utils/jwt';

/**
 * A tracker device token carries the employee's roles, but it is a credential for the tracker
 * only: a non-expiring token on a laptop must never open the Finance or Admin portal. The
 * request-level allow-list in buildContext already limits it to tracker operations; refusing
 * it in every role check as well means a portal resolver can never be reached with one, even
 * when a resolver is called with a context built some other way.
 */
function assertNotDevice(ctx: GraphQLContext, user: TokenPayload): void {
  if (ctx.deviceId || user.deviceId) {
    forbidden('Sign in to the portal to do this.');
  }
}

/**
 * Asserts the request is authenticated and the user holds one of the allowed
 * roles. ADMIN is a superuser and passes every guard. Returns the user.
 */
export function assertRole(ctx: GraphQLContext, allowed: Role[]): TokenPayload {
  if (!ctx.user) {
    unauthenticated();
  }
  assertNotDevice(ctx, ctx.user);
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
 *
 * The role is the gate, and it can only be held legitimately: no tenant path can grant
 * SUPER_ADMIN (see assertMayAssignRoles and the API-key role cap). The bootstrap account keeps
 * it while also belonging to the first company — the legacy migration put it there — so the
 * guard does not also demand an account with no organization.
 */
export function assertPlatformAdmin(ctx: GraphQLContext): TokenPayload {
  if (!ctx.user) {
    unauthenticated();
  }
  assertNotDevice(ctx, ctx.user);
  if (!(ctx.user.roles ?? []).includes(ROLES.SUPER_ADMIN)) {
    forbidden();
  }
  return ctx.user;
}

/**
 * Asserts the request is authenticated (any role). Returns the user.
 *
 * A device token passes here: several tracker operations (myTrackerDay, trackerTimezones, …)
 * are guarded by this, and buildContext has already confined a device-token request to the
 * tracker's own operations, so identity is all that is being asked.
 */
export function assertAuthenticated(ctx: GraphQLContext): TokenPayload {
  if (!ctx.user) {
    unauthenticated();
  }
  return ctx.user;
}
